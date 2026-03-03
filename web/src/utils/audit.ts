import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Log an audit event for admin/security tracking.
 * Uses service role to bypass RLS.
 */
export async function logAuditEvent(
    actorId: string,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string
) {
    try {
        await supabaseAdmin.from("audit_logs").insert({
            actor_id: actorId,
            action,
            target_type: targetType,
            target_id: targetId || null,
            metadata: metadata || {},
            ip_address: ipAddress || null,
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}
