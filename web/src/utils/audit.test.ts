import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Wrap mocks in vi.hoisted() to prevent ReferenceErrors if static imports are ever added
const { mockInsert, mockFrom, mockCreateClient } = vi.hoisted(() => {
    const mockInsert = vi.fn();
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockCreateClient = vi.fn().mockReturnValue({ from: mockFrom });
    return { mockInsert, mockFrom, mockCreateClient };
});

vi.mock("@supabase/supabase-js", () => ({
    createClient: mockCreateClient,
}));

describe("logAuditEvent", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        // Mock environment variables
        process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
        process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should correctly log an audit event with all fields provided (Happy Path)", async () => {
        const { logAuditEvent } = await import("./audit");

        const actorId = "user-123";
        const action = "LOGIN";
        const targetType = "USER";
        const targetId = "target-456";
        const metadata = { browser: "Chrome" };
        const ipAddress = "192.168.1.1";

        mockInsert.mockResolvedValueOnce({ data: null, error: null });

        await logAuditEvent(actorId, action, targetType, targetId, metadata, ipAddress);

        expect(mockFrom).toHaveBeenCalledWith("audit_logs");
        expect(mockInsert).toHaveBeenCalledWith({
            actor_id: actorId,
            action,
            target_type: targetType,
            target_id: targetId,
            metadata,
            ip_address: ipAddress,
        });
    });

    it("should correctly handle undefined optional fields (Edge Cases)", async () => {
        const { logAuditEvent } = await import("./audit");

        const actorId = "user-123";
        const action = "LOGOUT";
        const targetType = "SESSION";

        mockInsert.mockResolvedValueOnce({ data: null, error: null });

        await logAuditEvent(actorId, action, targetType);

        expect(mockFrom).toHaveBeenCalledWith("audit_logs");
        expect(mockInsert).toHaveBeenCalledWith({
            actor_id: actorId,
            action,
            target_type: targetType,
            target_id: null,
            metadata: {},
            ip_address: null,
        });
    });

    it("should catch and log errors without throwing (Error Handling)", async () => {
        const { logAuditEvent } = await import("./audit");

        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const mockError = new Error("Database connection failed");

        mockInsert.mockRejectedValueOnce(mockError);

        // This should not throw an error (just awaiting it directly resolves normally)
        await logAuditEvent("user-1", "ACTION", "TYPE");

        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to write audit log:", mockError);
    });
});
