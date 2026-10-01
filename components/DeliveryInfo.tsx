import Link from "next/link";
import { Bus, Truck, CalendarDays, CreditCard, Store, RotateCcw } from "lucide-react";
import { DELIVERY, STORE } from "@/lib/store";

/** Delivery, payment, pickup and returns at a glance, next to the buy buttons. */
export default function DeliveryInfo() {
  const { standard, express } = DELIVERY.methods;
  const rows = [
    {
      Icon: Bus,
      text: (
        <>
          <strong className="text-[#1a1a1a]">{standard.name}:</strong> to the motor park in your state, where you
          collect it (not door to door). Pay the delivery fee online, or at the park when you collect.
        </>
      ),
    },
    {
      Icon: Truck,
      text: (
        <>
          <strong className="text-[#1a1a1a]">{express.name}:</strong> door to door in {DELIVERY.transitTime}, paid
          online with your order.
        </>
      ),
    },
    { Icon: CreditCard, text: <>Items are paid for online before we ship them.</> },
    { Icon: CalendarDays, text: <>We send out deliveries on {DELIVERY.dispatchDays} only.</> },
    { Icon: Store, text: <>Prefer to pick up? Collect your order from our store at {STORE.address}.</> },
    {
      Icon: RotateCcw,
      text: (
        <>
          Returns within {STORE.returnsWindow} of delivery on unused items.{" "}
          <Link href="/returns" className="font-semibold text-[#8a6452] underline-offset-2 hover:underline">
            Returns &amp; refunds
          </Link>
        </>
      ),
    },
  ];

  return (
    <section aria-labelledby="delivery-info-heading" className="mb-5 rounded-md border border-[#f0f0f0] bg-[#faf9f8] px-4 py-3.5">
      <h2 id="delivery-info-heading" className="mb-2.5 text-[13px] font-bold text-[#1a1a1a]">
        Delivery &amp; pickup
      </h2>
      <ul className="flex flex-col gap-2">
        {rows.map(({ Icon, text }, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.55] text-[#555]">
            <Icon size={15} className="mt-[3px] shrink-0 text-[#8a6452]" aria-hidden />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
