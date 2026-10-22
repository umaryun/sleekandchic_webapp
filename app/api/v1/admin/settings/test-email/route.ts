import { NextRequest } from "next/server";
import { apiError, apiSuccess, internalError, requireSuperAdmin, withCors } from "@/lib/api-utils";
import { deliverEmail } from "@/lib/email/send";
import { testEmail } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";
import { alertRecipients, getSettings } from "@/lib/services/settings";

/** POST /admin/settings/test-email — sends a test to the alert addresses (owner only). */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperAdmin(req);
    const limited = await rateLimit(req, "contact");
    if (limited) return limited;

    const to = alertRecipients(await getSettings());
    const result = await deliverEmail(testEmail(to, session.user.name));
    if (!result.sent) return withCors(apiError(result.error, 502), req);
    return withCors(apiSuccess({ sentTo: to }), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("POST /api/v1/admin/settings/test-email", err);
  }
}
