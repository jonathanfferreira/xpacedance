import { vi } from 'vitest';

vi.mock('next/headers', () => ({
    cookies: () => ({
        get: () => undefined,
        set: () => undefined,
        getAll: () => []
    })
}));
