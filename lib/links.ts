/**
 * Links staff can set (hero slides): a page on this site ("/products?sale=true")
 * or a full https address. Anything else (javascript:, //other.site, http:)
 * is refused.
 */
export function isSafeHref(href: string): boolean {
  if (/^\/(?!\/)/.test(href)) return true;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

export const SAFE_HREF_MESSAGE = "Use a page on this site (starting with /) or a full https:// link";
