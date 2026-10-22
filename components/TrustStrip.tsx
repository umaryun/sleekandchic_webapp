import Link from "next/link";
import { MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { DELIVERY, STORE, whatsappLink } from "@/lib/store";

/** What shoppers want to know before buying online: delivery, safe payment, returns, a person to ask. */
export default function TrustStrip() {
  const items = [
    { Icon: Truck, title: "Delivery across Nigeria", detail: `${DELIVERY.courier} door to door, or public transport to your state`, href: "/help" },
    { Icon: ShieldCheck, title: "Secure payment", detail: "Pay by card or transfer through Paystack", href: "/help" },
    { Icon: RotateCcw, title: "Easy returns", detail: `Unused items within ${STORE.returnsWindow}`, href: "/returns" },
    { Icon: MessageCircle, title: "Talk to us", detail: `WhatsApp ${STORE.phoneDisplay}`, href: whatsappLink(), external: true },
  ];
  return (
    <section aria-label="Why shop with us" className="mx-auto mb-8 max-w-[1280px] px-4 sm:mb-10">
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-[5px] bg-[#f6f3f0] p-3 sm:gap-4 sm:p-5 lg:grid-cols-4">
        {items.map(({ Icon, title, detail, href, external }) => (
          <li key={title}>
            <Link
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex h-full items-center gap-2.5 rounded-[5px] p-1 transition-colors hover:text-[#8a6452] sm:items-start sm:gap-3 sm:p-1.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#8a6452] sm:h-9 sm:w-9">
                <Icon size={17} aria-hidden />
              </span>
              <span>
                <span className="block text-xs font-semibold leading-tight text-[#1a1a1a] sm:text-[13px]">{title}</span>
                <span className="hidden text-xs leading-snug text-[#6b6b6b] sm:block">{detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
