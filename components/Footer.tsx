import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { STORE, whatsappLink } from "@/lib/store";

const footerLinks = {
  Help: [
    { label: "Track your order", href: "/orders/tracking" },
    { label: "Delivery & FAQs", href: "/help" },
    { label: "Returns", href: "/returns" },
    { label: "Contact us", href: "/contact" },
  ],
  Information: [
    { label: "About us", href: "/about" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms & conditions", href: "/terms" },
  ],
};

const contactInfo = [
  { heading: "WhatsApp / Call", value: STORE.phoneDisplay, href: whatsappLink() },
  { heading: "Email", value: STORE.email, href: `mailto:${STORE.email}` },
  { heading: "Address", value: STORE.address },
];

function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="list-none p-0 m-0 space-y-2.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="text-[13px] text-neutral-600 no-underline hover:text-[#8a6452] transition-colors duration-200">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] text-[#1a1a1a]">
      <div className="max-w-[1280px] mx-auto px-2.5 pt-5 pb-3 text-center">
        <Link href="/" className="inline-block no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={STORE.name} className="w-[240px] sm:w-[320px] lg:w-[450px] h-auto mx-auto" />
        </Link>
      </div>

      {/* Desktop */}
      <div className="hidden md:block border-t border-neutral-300 w-full">
        <div className="max-w-[1280px] mx-auto my-2.5 px-6 py-2.5 grid grid-cols-[1fr_auto] gap-10 lg:gap-24 items-start">
          <div className="flex gap-10 lg:gap-14">
            {contactInfo.map((item) => (
              <div key={item.heading} className="max-w-[260px]">
                <p className="text-[13px] font-bold uppercase tracking-widest text-[#1a1a1a] mb-2">{item.heading}</p>
                {item.href ? (
                  <a href={item.href} className="text-[13px] text-neutral-600 leading-relaxed no-underline hover:text-[#8a6452]">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-[13px] text-neutral-600 m-0 leading-relaxed">{item.value}</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-12 lg:gap-24">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <p className="text-[13px] font-bold uppercase tracking-widest text-[#1a1a1a] mb-3">{title}</p>
                <LinkList links={links} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden border-t border-neutral-300 px-4 pt-4">
        {Object.entries(footerLinks).map(([title, links]) => (
          <details key={title} className="group border-b border-neutral-200">
            <summary className="flex items-center justify-between py-4 px-1 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[13px] font-bold uppercase tracking-wider">{title}</span>
              <ChevronDown size={18} className="text-neutral-400 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="px-1 pb-4">
              <LinkList links={links} />
            </div>
          </details>
        ))}
        <div className="grid grid-cols-1 gap-5 mt-7">
          {contactInfo.map((item) => (
            <div key={item.heading}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1">{item.heading}</p>
              {item.href ? (
                <a href={item.href} className="text-[13px] text-neutral-600 no-underline">
                  {item.value}
                </a>
              ) : (
                <p className="text-[13px] text-neutral-600 m-0">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#d4d4d4] mt-5">
        <div className="max-w-[1280px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#737373]">
          <div className="flex items-center gap-6 flex-wrap">
            <span>{STORE.city}, Nigeria</span>
            <Link href="/terms" className="text-neutral-500 no-underline hover:text-[#8a6452]">Terms</Link>
            <Link href="/privacy" className="text-neutral-500 no-underline hover:text-[#8a6452]">Privacy</Link>
          </div>
          <span>© {new Date().getFullYear()} {STORE.name}</span>
        </div>
      </div>
    </footer>
  );
}
