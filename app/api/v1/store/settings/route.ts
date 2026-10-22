import { apiSuccess, internalError } from "@/lib/api-utils";
import { getSettings } from "@/lib/services/settings";

/** GET /api/v1/store/settings — the parts of the owner's settings shoppers see. */
export async function GET() {
  try {
    const { announcement } = await getSettings();
    return apiSuccess({ announcement: announcement.enabled && announcement.text ? announcement : null });
  } catch (err) {
    return internalError("GET /api/v1/store/settings", err);
  }
}
