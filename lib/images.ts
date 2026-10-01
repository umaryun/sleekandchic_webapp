/**
 * Images Next.js may resize and convert (see images.remotePatterns in
 * next.config.ts): files in /public and uploads in Supabase Storage. Others,
 * such as an image URL pasted in from elsewhere, are shown as they are.
 */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/") &&
      !url.search
    );
  } catch {
    return false;
  }
}
