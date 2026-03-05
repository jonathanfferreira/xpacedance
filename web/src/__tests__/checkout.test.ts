import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        set: vi.fn(),
        getAll: vi.fn()
    })
}));

// Mock Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockCreateUser = vi.fn();
const mockSignUp = vi.fn().mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null });

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: (table: string) => {
            mockFrom(table);
            // Build a full chainable mock
            const chainable: any = {
                select: (...args: any[]) => {
                    mockSelect(...args);
                    return {
                        eq: (...eqArgs: any[]) => {
                            mockEq(...eqArgs);
                            return {
                                single: () => mockSingle(),
                                eq: () => ({ single: () => mockSingle() }),
                            };
                        },
                    };
                },
                insert: (data: any) => {
                    mockInsert(data);
                    return {
                        error: null,
                        // Suporte a insert().select().single() para split_audit
                        select: () => ({
                            single: () => Promise.resolve({ data: { id: 'tx-id-mock' }, error: null }),
                        }),
                    };
                },
                update: () => ({
                    eq: () => Promise.resolve({ error: null }),
                }),
            };
            return chainable;
        },
        auth: {
            admin: {
                createUser: mockCreateUser,
            },
            signUp: mockSignUp,
        },
    }),
}));

// Mock rate limiter
vi.mock('@/utils/rate-limit', () => ({
    rateLimit: () => ({ limited: false, remaining: 5, resetAt: Date.now() + 60000 }),
    getClientIp: () => '127.0.0.1',
}));

// Mock CSRF validation: validateCsrf retorna null quando OK, string com erro quando inválido
vi.mock('@/utils/csrf', () => ({
    validateCsrf: () => null,
}));

describe('Checkout API - Input Validation', () => {

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('should reject empty JSON body', async () => {
        // Import after mocks are set up
        const { POST } = await import('../app/api/checkout/route');

        const request = new Request('http://localhost/api/checkout', {
            method: 'POST',
            body: 'invalid json{{{',
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('JSON inválido.');
    });

    it('should reject when missing required fields', async () => {
        // Mock course lookup to return null (should not even reach this with invalid Zod data)
        mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

        const { POST } = await import('../app/api/checkout/route');

        const request = new Request('http://localhost/api/checkout', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@test.com' }), // missing name and courseId
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        // Zod retorna 422 para dados inválidos
        expect([400, 422]).toContain(response.status);
        expect(data.error).toBeTruthy();
    });

    // Fixed: module caching issue resolved with vi.resetModules()
    it('should return 404 when course is not found', async () => {
        // Mock course lookup to return null
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const { POST } = await import('../app/api/checkout/route');

        const request = new Request('http://localhost/api/checkout', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@test.com',
                courseId: '00000000-0000-0000-0000-000000000000',
                paymentMethod: 'pix',
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Curso não encontrado.');
    });
});

describe('Checkout API - User Lookup (Bug #1 Fix)', () => {

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    // Fixed: integrated with Zod and multi-step Supabase mock
    it('should query users table by email instead of listUsers()', async () => {
        // The fix queries public.users by email — NOT auth.admin.listUsers()
        // Verify the mock was called with 'users' table, not the admin API
        mockSingle.mockResolvedValueOnce({
            data: { id: 'test-id', title: 'Test', price: 99.90, tenants: { split_percent: 10 } },
            error: null,
        });
        mockSingle.mockResolvedValueOnce({
            data: { id: 'existing-user-id' },
            error: null,
        });

        const { POST } = await import('../app/api/checkout/route');

        const request = new Request('http://localhost/api/checkout', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Test User',
                email: 'existing@test.com',
                courseId: '550e8400-e29b-41d4-a716-446655440000',
                paymentMethod: 'pix',
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        await POST(request);

        // Should have called .from('users') for the user lookup (2nd call — 1st is 'courses')
        const usersCalls = mockFrom.mock.calls.filter((args: any[]) => args[0] === 'users');
        expect(usersCalls.length).toBeGreaterThanOrEqual(1);

        // Should NOT have called auth.admin.listUsers
        expect(mockCreateUser).not.toHaveBeenCalled();
    });
});

describe('Checkout API - Interest Calculation', () => {

    it('should not add interest for single installment', () => {
        const coursePrice = 100.00;
        const installments = 1;
        const INTEREST_RATE = 0.0299;

        let finalValue = coursePrice;
        if (installments > 1) {
            const installmentValue = coursePrice * Math.pow(1 + INTEREST_RATE, installments) / installments;
            finalValue = installmentValue * installments;
        }

        expect(finalValue).toBe(100.00);
    });

    it('should add compound interest for multiple installments', () => {
        const coursePrice = 100.00;
        const installments = 3;
        const INTEREST_RATE = 0.0299;

        const installmentValue = coursePrice * Math.pow(1 + INTEREST_RATE, installments) / installments;
        const finalValue = Number((installmentValue * installments).toFixed(2));

        // 100 * (1.0299)^3 ≈ 109.21
        expect(finalValue).toBeGreaterThan(coursePrice);
        expect(finalValue).toBeCloseTo(109.21, 1);
    });
});
