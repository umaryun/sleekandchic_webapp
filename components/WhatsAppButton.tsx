"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/store";

/** Chat with the shop from any page. Kept off checkout so it never covers the pay button. */
export default function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/checkout") || pathname === "/cart") return null;

  return (
    <a
      href={whatsappLink("Hello Sleekandchic!")}
      // On a product page, say which one (the address is only known in the browser).
      onClick={(e) => {
        if (pathname.startsWith("/products/")) {
          e.currentTarget.href = whatsappLink(`Hello Sleekandchic! I'm interested in this: ${window.location.href}`);
        }
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-[76px] right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-[#25D366] pl-3 pr-3 text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition-[padding,transform] hover:-translate-y-0.5 md:bottom-6 md:right-6 md:pr-4"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
      </svg>
      <span className="hidden text-sm font-semibold md:inline">Chat with us</span>
    </a>
  );
}
