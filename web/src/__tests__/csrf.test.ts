import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('validateCsrf', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.xtage.com.br');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should skip validation in non-production environments', async () => {
        vi.stubEnv('NODE_ENV', 'development');
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            // No headers
        });

        const result = validateCsrf(request);
        expect(result).toBeNull();
    });

    it('should return error if both origin and referer are missing', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            // No headers
        });

        const result = validateCsrf(request);
        expect(result).toBe('Missing origin header.');
    });

    it('should allow valid origin', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                origin: 'https://app.xtage.com.br',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBeNull();
    });

    it('should reject mismatched origin', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                origin: 'https://evil.com',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBe('Origin mismatch.');
    });

    it('should handle invalid origin format', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                origin: 'not-a-valid-url',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBe('Invalid origin header.');
    });

    it('should allow valid referer when origin is missing', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                referer: 'https://app.xtage.com.br/dashboard',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBeNull();
    });

    it('should reject mismatched referer when origin is missing', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                referer: 'https://evil.com/dashboard',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBe('Referer mismatch.');
    });

    it('should handle invalid referer format when origin is missing', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                referer: 'not-a-valid-url',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBe('Invalid referer header.');
    });

    it('should use origin over referer if both are present', async () => {
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                origin: 'https://evil.com',
                referer: 'https://app.xtage.com.br/dashboard',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBe('Origin mismatch.');
    });

    it('should allow if SITE_URL is somehow not set (edge case)', async () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
        const { validateCsrf } = await import('../utils/csrf');

        const request = new Request('https://api.xtage.com.br/data', {
            method: 'POST',
            headers: {
                origin: 'https://evil.com',
            },
        });

        const result = validateCsrf(request);
        expect(result).toBeNull();
    });
});
