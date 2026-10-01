import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isStorageConfigured } from "@/lib/supabase";
import { apiSuccess, apiError, requireAdmin, withCors, parseBody } from "@/lib/api-utils";

// SVG is left out on purpose: it can carry scripts that run on the storage domain.
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const uploadSchema = z.object({
  bucket: z.enum(["products", "categories", "banners"]),
  filename: z.string().min(1).max(200),
  contentType: z.enum(Object.keys(EXTENSIONS) as [keyof typeof EXTENSIONS], {
    message: "Upload a JPEG, PNG or WebP image",
  }),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    if (!isStorageConfigured()) {
      return withCors(apiError("Image uploads are not configured on the server", 503), req);
    }
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await parseBody(req, uploadSchema);
    if (error) return error;

    const { bucket, contentType } = data!;

    // The extension comes from the checked type, never from the filename.
    const ext = EXTENSIONS[contentType];
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const path = `uploads/${uniqueName}`;

    // Create signed upload URL (valid for 10 minutes)
    const { data: signedData, error: signedError } =
      await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);

    if (signedError) {
      console.error("Signed upload URL error:", signedError);
      return apiError("Failed to generate upload URL", 500);
    }

    // Public URL
    const { data: publicData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    const response = apiSuccess({
      uploadUrl: signedData.signedUrl,
      token: signedData.token,
      publicUrl: publicData.publicUrl,
      path,
      bucket,
    });

    return withCors(response, req);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/admin/media/upload-url error:", err);
    return apiError("Internal server error", 500);
  }
}
