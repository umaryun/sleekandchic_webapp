import { describe, expect, it } from "vitest";
import { isOptimizableImage } from "@/lib/images";

describe("which images Next.js optimises", () => {
  it("covers site files and Supabase public uploads", () => {
    expect(isOptimizableImage("/logo.png")).toBe(true);
    expect(isOptimizableImage("https://abcd.supabase.co/storage/v1/object/public/products/uploads/x.webp")).toBe(true);
  });

  it("leaves everything else as-is so it can't break the page", () => {
    expect(isOptimizableImage("https://cdn.example.com/dress.jpg")).toBe(false);
    expect(isOptimizableImage("//abcd.supabase.co/storage/v1/object/public/x.png")).toBe(false);
    expect(isOptimizableImage("https://abcd.supabase.co/storage/v1/object/sign/x.png?token=1")).toBe(false);
    expect(isOptimizableImage("not a url")).toBe(false);
  });
});
