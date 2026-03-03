/**
 * CSRF Protection via Origin/Referer header validation.
 *
 * This validates that POST requests originate from our own domain,
 * preventing cross-site request forgery attacks.
 *
 * Webhook endpoints (Asaas, Bunny) are exempt and should NOT use this.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

/**
 * Validates that a request originates from our own domain.
 * Returns null if valid, or a string error message if invalid.
 */
export function validateCsrf(request: Request): string | null {
    // Skip validation in development and test environments
    if (process.env.NODE_ENV !== "production") return null;

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // At least one must be present
    if (!origin && !referer) {
        return "Missing origin header.";
    }

    // Validate origin matches our site URL
    if (SITE_URL) {
        const siteHost = new URL(SITE_URL).host;

        if (origin) {
            try {
                const originHost = new URL(origin).host;
                if (originHost !== siteHost) {
                    return "Origin mismatch.";
                }
            } catch {
                return "Invalid origin header.";
            }
        } else if (referer) {
            try {
                const refererHost = new URL(referer).host;
                if (refererHost !== siteHost) {
                    return "Referer mismatch.";
                }
            } catch {
                return "Invalid referer header.";
            }
        }
    }

    return null;
}
