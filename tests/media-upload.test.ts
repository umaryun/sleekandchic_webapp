import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { resetTestDb } from "./support/test-db";
import { json, jsonRequest, signUpCustomer } from "./support/fixtures";

const createSignedUploadUrl = vi.fn(async (path: string) => ({ data: { signedUrl: `https://storage.test/${path}`, token: "t" }, error: null }));

vi.mock("@/lib/supabase", () => ({
  isStorageConfigured: () => true,
  getSupabaseAdmin: () => ({
    storage: {
      from: () => ({
        createSignedUploadUrl,
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
      }),
    },
  }),
}));

const { POST: uploadUrl } = await import("@/app/api/v1/admin/media/upload-url/route");

let adminHeaders: Record<string, string>;

beforeEach(async () => {
  await resetTestDb();
  createSignedUploadUrl.mockClear();
  const admin = await signUpCustomer("staff@example.com");
  await db.update(users).set({ role: "admin" }).where(eq(users.id, admin.userId));
  adminHeaders = admin.headers;
});

const request = (body: unknown) => uploadUrl(jsonRequest("/api/v1/admin/media/upload-url", body, adminHeaders));

describe("image upload URLs", () => {
  it("refuses SVG and other non-photo types", async () => {
    for (const contentType of ["image/svg+xml", "image/gif", "text/html"]) {
      const res = await json(await request({ bucket: "products", filename: "logo.svg", contentType }));
      expect(res.status).toBe(422);
    }
    expect(createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("takes the extension from the image type, not the filename", async () => {
    const res = await json(await request({ bucket: "products", filename: "dress.html", contentType: "image/png" }));
    expect(res.status).toBe(200);
    expect(res.body.data.path).toMatch(/^uploads\/[\w-]+\.png$/);
    expect(res.body.data.publicUrl).toMatch(/\.png$/);
  });

  it("is for staff only", async () => {
    const customer = await signUpCustomer("shopper@example.com");
    const res = await uploadUrl(
      jsonRequest("/api/v1/admin/media/upload-url", { bucket: "products", filename: "a.jpg", contentType: "image/jpeg" }, customer.headers)
    );
    expect(res.status).toBe(403);
  });
});
