import { NextRequest } from "next/server";
import { apiSuccess, auditLog, internalError, parseBody, requireAdmin, requireSuperAdmin, withCors } from "@/lib/api-utils";
import { emailProvider, emailSender } from "@/lib/email/send";
import { alertRecipients, getSettings, saveSettings, settingsSchema, type StoreSettings } from "@/lib/services/settings";

/** The settings plus how email is set up on the server (read-only here). */
function withEmailStatus(settings: StoreSettings) {
  return {
    ...settings,
    email: {
      provider: emailProvider(),
      sender: emailSender(),
      /** Where alerts go right now, after the defaults are applied. */
      alertsGoTo: alertRecipients(settings),
    },
  };
}

/** GET /admin/settings — staff can see them; only the owner can change them. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    return withCors(apiSuccess(withEmailStatus(await getSettings())), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("GET /api/v1/admin/settings", err);
  }
}

/** PUT /admin/settings — the whole settings object (owner only). */
export async function PUT(req: NextRequest) {
  try {
    const session = await requireSuperAdmin(req);
    const { data, error } = await parseBody(req, settingsSchema);
    if (error) return withCors(error, req);

    const before = await getSettings();
    const saved = await saveSettings(data!, session.user.id);
    await auditLog(session.user.id, "update", "settings", {
      changed: (Object.keys(saved) as (keyof StoreSettings)[]).filter((k) => JSON.stringify(saved[k]) !== JSON.stringify(before[k])),
    });
    return withCors(apiSuccess(withEmailStatus(saved)), req);
  } catch (err) {
    if (err instanceof Response) return err;
    return internalError("PUT /api/v1/admin/settings", err);
  }
}
