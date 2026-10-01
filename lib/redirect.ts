/** Where to go after signing in: a page on this site, never another site. */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  return value && /^\/(?!\/)/.test(value) && !value.startsWith("/\\") ? value : fallback;
}
