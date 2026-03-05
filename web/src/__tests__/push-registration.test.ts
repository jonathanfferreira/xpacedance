import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    subscribePushNotifications,
    unsubscribePushNotifications,
    initPushRegistration,
} from '@/utils/push-registration';

// Mocks
const mockUser = { id: 'test-user-id' };
const mockSupabaseEq = vi.fn().mockResolvedValue({ data: null, error: null });
const mockSupabaseUpdate = vi.fn(() => ({ eq: mockSupabaseEq }));
const mockSupabaseFrom = vi.fn(() => ({ update: mockSupabaseUpdate }));
const mockSupabaseGetUser = vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null });

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => ({
        auth: {
            getUser: mockSupabaseGetUser,
        },
        from: mockSupabaseFrom,
    }),
}));

describe('push-registration.ts', () => {
    let mockSubscription: any;
    let mockPushManager: any;
    let mockServiceWorkerRegistration: any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();

        // Save original console methods
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock NEXT_PUBLIC_VAPID_PUBLIC_KEY
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key';

        mockSubscription = {
            toJSON: vi.fn().mockReturnValue({ endpoint: 'https://test.com/push', keys: { p256dh: 'test', auth: 'test' } }),
            unsubscribe: vi.fn().mockResolvedValue(true),
        };

        mockPushManager = {
            subscribe: vi.fn().mockResolvedValue(mockSubscription),
            getSubscription: vi.fn().mockResolvedValue(mockSubscription),
        };

        mockServiceWorkerRegistration = {
            pushManager: mockPushManager,
        };

        // Browser globals mocks
        Object.defineProperty(global, 'navigator', {
            value: {
                serviceWorker: {
                    ready: Promise.resolve(mockServiceWorkerRegistration),
                    register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
                },
            },
            configurable: true,
            writable: true,
        });

        Object.defineProperty(global, 'window', {
            value: {
                PushManager: {},
            },
            configurable: true,
            writable: true,
        });

        Object.defineProperty(global, 'Notification', {
            value: {
                requestPermission: vi.fn().mockResolvedValue('granted'),
            },
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete (global as any).navigator;
        delete (global as any).window;
        delete (global as any).Notification;
        delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    });

    describe('Environment Setup Check', () => {
        it('has basic mocks in place', () => {
            expect(typeof navigator.serviceWorker).toBe('object');
            expect(typeof window.PushManager).toBe('object');
            expect(typeof Notification.requestPermission).toBe('function');
        });
    });

    describe('subscribePushNotifications', () => {
        const subscriptionData = {
            endpoint: 'https://test.com/push',
            keys: { p256dh: 'test', auth: 'test' }
        };

        beforeEach(() => {
            // Setup successful default state for these tests specifically
            Object.defineProperty(global, 'Notification', {
                value: {
                    requestPermission: vi.fn().mockResolvedValue('granted'),
                },
                configurable: true,
                writable: true,
            });

            mockSubscription.toJSON.mockReturnValue(subscriptionData);
        });

        it('should successfully subscribe and save to Supabase', async () => {
            const result = await subscribePushNotifications();

            expect(global.Notification.requestPermission).toHaveBeenCalled();
            expect(mockPushManager.subscribe).toHaveBeenCalledWith({
                userVisibleOnly: true,
                applicationServerKey: 'test-vapid-key',
            });

            expect(result).toBe(mockSubscription);

            // Assert Supabase was called correctly
            expect(mockSupabaseGetUser).toHaveBeenCalled();
            expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                push_subscription: JSON.stringify(subscriptionData),
                push_token: null,
            });
            expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-user-id');
        });

        it('should return null if serviceWorker is not supported', async () => {
            Object.defineProperty(global, 'navigator', {
                value: {}, // Missing serviceWorker
                configurable: true,
                writable: true,
            });

            const result = await subscribePushNotifications();

            expect(result).toBeNull();
            expect(console.warn).toHaveBeenCalledWith('[push] Push não suportado neste navegador.');
            expect(global.Notification.requestPermission).not.toHaveBeenCalled();
        });

        it('should return null if PushManager is not supported', async () => {
            Object.defineProperty(global, 'window', {
                value: {}, // Missing PushManager
                configurable: true,
                writable: true,
            });

            const result = await subscribePushNotifications();

            expect(result).toBeNull();
            expect(console.warn).toHaveBeenCalledWith('[push] Push não suportado neste navegador.');
        });

        it('should return null if permission is denied', async () => {
            Object.defineProperty(global, 'Notification', {
                value: {
                    requestPermission: vi.fn().mockResolvedValue('denied'),
                },
                configurable: true,
                writable: true,
            });

            const result = await subscribePushNotifications();

            expect(result).toBeNull();
            expect(console.warn).toHaveBeenCalledWith('[push] Permissão negada pelo usuário.');
            expect(mockPushManager.subscribe).not.toHaveBeenCalled();
        });

        it('should return null if NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing', async () => {
            delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            const result = await subscribePushNotifications();

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada.');
            expect(mockPushManager.subscribe).not.toHaveBeenCalled();
        });

        it('should return null and log error if subscribe throws', async () => {
            const error = new Error('Subscribe failed');
            mockPushManager.subscribe.mockRejectedValueOnce(error);

            const result = await subscribePushNotifications();

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalledWith('[push] Erro ao registrar subscription:', error);
            expect(mockSupabaseFrom).not.toHaveBeenCalled();
        });
    });

    describe('unsubscribePushNotifications', () => {
        let mockSubscription: any;
        let mockPushManager: any;
        let mockServiceWorkerRegistration: any;

        beforeEach(() => {
            vi.clearAllMocks();
            mockSubscription = {
                unsubscribe: vi.fn().mockResolvedValue(true),
            };

            mockPushManager = {
                getSubscription: vi.fn().mockResolvedValue(mockSubscription),
            };

            mockServiceWorkerRegistration = {
                pushManager: mockPushManager,
            };

            Object.defineProperty(global, 'navigator', {
                value: {
                    serviceWorker: {
                        ready: Promise.resolve(mockServiceWorkerRegistration),
                    },
                },
                configurable: true,
                writable: true,
            });
        });

        it('should successfully unsubscribe and update Supabase', async () => {
            await unsubscribePushNotifications();

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();

            // Assert Supabase was called correctly
            expect(mockSupabaseGetUser).toHaveBeenCalled();
            expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                push_subscription: null,
            });
            expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-user-id');
        });

        it('should do nothing if serviceWorker is not supported', async () => {
            Object.defineProperty(global, 'navigator', {
                value: {}, // Missing serviceWorker
                configurable: true,
                writable: true,
            });

            await unsubscribePushNotifications();

            expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();
            expect(mockSupabaseFrom).not.toHaveBeenCalled();
        });

        it('should do nothing if no subscription exists', async () => {
            mockPushManager.getSubscription.mockResolvedValueOnce(null);

            await unsubscribePushNotifications();

            expect(mockSubscription.unsubscribe).not.toHaveBeenCalled();
            expect(mockSupabaseFrom).not.toHaveBeenCalled();
        });

        it('should handle Supabase updates even if no user is found', async () => {
            // This case specifically tests the branch logic `if (user)`
            mockSupabaseGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

            await unsubscribePushNotifications();

            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
            expect(mockSupabaseFrom).not.toHaveBeenCalled(); // No update when user is null
        });
});

    describe('initPushRegistration', () => {
        let mockSubscription: any;
        let mockPushManager: any;
        let mockServiceWorkerRegistration: any;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.spyOn(console, 'error').mockImplementation(() => {});
            mockSubscription = {
                toJSON: vi.fn().mockReturnValue({ endpoint: 'sync', keys: { p256dh: 'sync', auth: 'sync' } }),
            };

            mockPushManager = {
                getSubscription: vi.fn().mockResolvedValue(mockSubscription),
            };

            mockServiceWorkerRegistration = {
                pushManager: mockPushManager,
            };

            Object.defineProperty(global, 'navigator', {
                value: {
                    serviceWorker: {
                        ready: Promise.resolve(mockServiceWorkerRegistration),
                        register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
                    },
                },
                configurable: true,
                writable: true,
            });

            // Ensure window is defined to simulate browser environment
            Object.defineProperty(global, 'window', {
                value: {},
                configurable: true,
                writable: true,
            });
        });

        it('should register SW and sync existing subscription to Supabase', async () => {
            await initPushRegistration();

            expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
            expect(mockPushManager.getSubscription).toHaveBeenCalled();

            // Assert Supabase was called correctly to sync
            expect(mockSupabaseGetUser).toHaveBeenCalled();
            expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
            expect(mockSupabaseUpdate).toHaveBeenCalledWith({
                push_subscription: JSON.stringify({ endpoint: 'sync', keys: { p256dh: 'sync', auth: 'sync' } }),
                push_token: null,
            });
            expect(mockSupabaseEq).toHaveBeenCalledWith('id', 'test-user-id');
        });

        it('should return early if window is undefined', async () => {
            Object.defineProperty(global, 'window', {
                value: undefined,
                configurable: true,
                writable: true,
            });

            await initPushRegistration();

            expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
            expect(mockSupabaseFrom).not.toHaveBeenCalled();
        });

        it('should return early if serviceWorker is not supported', async () => {
            Object.defineProperty(global, 'navigator', {
                value: {}, // Missing serviceWorker
                configurable: true,
                writable: true,
            });

            await initPushRegistration();

            expect(mockSupabaseFrom).not.toHaveBeenCalled();
        });

        it('should catch and log error if registration fails', async () => {
            const error = new Error('Registration failed');
            (navigator.serviceWorker.register as any).mockRejectedValueOnce(error);

            await initPushRegistration();

            expect(console.error).toHaveBeenCalledWith('[push] initPushRegistration error:', error);
            expect(mockPushManager.getSubscription).not.toHaveBeenCalled();
        });

        it('should not sync if no existing subscription', async () => {
            mockPushManager.getSubscription.mockResolvedValueOnce(null);

            await initPushRegistration();

            expect(navigator.serviceWorker.register).toHaveBeenCalled();
            expect(mockPushManager.getSubscription).toHaveBeenCalled();
            expect(mockSupabaseFrom).not.toHaveBeenCalled();
        });
});

});
