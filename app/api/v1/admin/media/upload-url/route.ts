import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { apiSuccess, apiError, requireAdmin, withCors, parseBody } from "@/lib/api-utils";

const uploadSchema = z.object({
  bucket: z.enum(["products", "categories", "banners"]),
  filename: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|png|webp|gif|svg\+xml)$/, "Only image files allowed"),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { data, error } = await parseBody(req, uploadSchema);
    if (error) return error;

    const { bucket, filename, contentType } = data!;

    // Generate a unique path
    const ext = filename.split(".").pop() || "jpg";
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
