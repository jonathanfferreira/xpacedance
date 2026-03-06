import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
    createServerClient: () => ({
        from: (table: string) => {
            mockFrom(table);
            const chainable: any = {
                select: (...args: any[]) => {
                    mockSelect(...args);
                    return chainable;
                },
                eq: (...args: any[]) => {
                    mockEq(...args);
                    return chainable;
                },
                single: () => mockSingle(),
                insert: (data: any) => {
                    mockInsert(data);
                    return chainable;
                }
            };
            return chainable;
        },
        rpc: mockRpc,
        auth: {
            getUser: mockGetUser
        }
    })
}));

vi.mock('next/headers', () => ({
    cookies: () => ({
        getAll: () => []
    })
}));

describe('XTORE Orders API', () => {

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('should call decrement_stock RPC and succeed when stock is sufficient', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });

        // Mock the order insert to return an ID
        mockSingle.mockResolvedValue({ data: { id: 'test-order-id' }, error: null });

        // Mock successful RPC calls (increment_user_xp won't be called if xp_to_burn=0, decrement_stock will succeed)
        mockRpc.mockResolvedValue({ data: null, error: null });

        const { POST } = await import('../app/api/xtore/orders/route');

        const request = new Request('http://localhost/api/xtore/orders', {
            method: 'POST',
            body: JSON.stringify({
                tenant_id: 'test-tenant-id',
                items: [
                    { product_id: 'product-1', quantity: 2, price: 50 },
                    { product_id: 'product-2', quantity: 1, price: 100 }
                ],
                total_amount: 200,
                shipping_cost: 20,
                shipping_address: { zip: '12345' }
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('success');

        // Verify RPC was called with correct parameters
        expect(mockRpc).toHaveBeenCalledWith('decrement_stock', {
            p_items: [
                { product_id: 'product-1', quantity: 2 },
                { product_id: 'product-2', quantity: 1 }
            ]
        });
    });

    it('should return error when decrement_stock RPC fails (e.g. out of stock)', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });

        // Mock the order insert to return an ID
        mockSingle.mockResolvedValue({ data: { id: 'test-order-id' }, error: null });

        // Mock RPC to fail on decrement_stock
        mockRpc.mockResolvedValue({
            data: null,
            error: { message: 'Insufficient stock for product: Test Product (Available: 1, Requested: 2)' }
        });

        const { POST } = await import('../app/api/xtore/orders/route');

        const request = new Request('http://localhost/api/xtore/orders', {
            method: 'POST',
            body: JSON.stringify({
                tenant_id: 'test-tenant-id',
                items: [
                    { product_id: 'product-1', quantity: 2, price: 50 }
                ],
                total_amount: 100,
                shipping_cost: 20,
                shipping_address: { zip: '12345' }
            }),
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain('Insufficient stock');
    });
});
