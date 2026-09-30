import type { Metadata } from "next";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { STORE, whatsappLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `Contact us | ${STORE.name}`,
  description: `WhatsApp, call or email ${STORE.name}, or visit us in ${STORE.city}.`,
};

const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.address)}`;

const channels = [
  {
    Icon: MessageCircle,
    title: "WhatsApp",
    lines: [STORE.phoneDisplay, "Fastest for orders, sizes and returns"],
    href: whatsappLink("Hello Sleekandchic,"),
    cta: "Chat on WhatsApp",
  },
  { Icon: Phone, title: "Call us", lines: [STORE.phoneDisplay], href: `tel:${STORE.phoneE164}`, cta: "Call now" },
  { Icon: Mail, title: "Email", lines: [STORE.email], href: `mailto:${STORE.email}`, cta: "Send an email" },
  { Icon: MapPin, title: "Visit us", lines: [STORE.address], href: mapsLink, cta: "Open in Google Maps" },
];

export default function ContactPage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title="Contact" crumbs={[]} />
      <section className="max-w-[1100px] mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#1a1a1a] mb-2">Contact us</h1>
        <p className="text-[15px] text-[#555] mb-8 max-w-[620px]">
          Questions about an order, sizes or delivery? Message us and include your order number if you have one.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channels.map(({ Icon, title, lines, href, cta }) => (
            <div key={title} className="bg-white border border-[#ece8e5] rounded-lg p-6 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-full bg-[#f4efeb] flex items-center justify-center text-[#8a6452]">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-bold text-[#1a1a1a]">{title}</h2>
              <div className="text-sm text-[#555] leading-relaxed flex-1">
                {lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="self-start rounded bg-[#1a1a1a] px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#333]"
              >
                {cta}
              </a>
            </div>
          ))}
        </div>
      </section>
    </ShopLayout>
  );
}
