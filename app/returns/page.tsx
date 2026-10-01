import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { STORE, whatsappLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `Returns | ${STORE.name}`,
  description: `Faulty, damaged or wrong items reported within ${STORE.returnsWindowHours} hours of delivery are replaced or refunded.`,
};

export default function ReturnsPage() {
  const hours = STORE.returnsWindowHours;
  return (
    <InfoPage
      title="Returns policy"
      updated="1 October 2026"
      intro={
        <p>
          If your order arrives faulty, damaged or not what you ordered, tell us within {hours} hours of delivery and
          we&apos;ll put it right.
        </p>
      }
    >
      <section>
        <h2>What we accept</h2>
        <ul>
          <li>An item that is faulty or damaged when it arrives.</li>
          <li>The wrong item, size or colour compared with your order.</li>
          <li>An item missing from your order.</li>
        </ul>
        <p className="mt-3">
          We don&apos;t accept returns or exchanges for a change of mind, or for an item that has been worn, washed or
          altered.
        </p>
      </section>

      <section>
        <h2>How to report a problem</h2>
        <ul>
          <li>
            Contact us within {hours} hours of delivery on <a href={whatsappLink("Hello, I have a problem with my order")}>WhatsApp</a>{" "}
            ({STORE.phoneDisplay}) or by email at <a href={`mailto:${STORE.email}`}>{STORE.email}</a>.
          </li>
          <li>Include your order number and clear photos of the item and its label.</li>
          <li>Keep the item unworn, with its tags and packaging, until we reply.</li>
        </ul>
      </section>

      <section>
        <h2>What happens next</h2>
        <ul>
          <li>We&apos;ll confirm the problem and arrange with you how the item comes back to us.</li>
          <li>We&apos;ll send a replacement, or refund you if a replacement isn&apos;t available or you prefer a refund.</li>
          <li>
            Card, transfer and USSD payments are refunded through Paystack to the original payment method. Pay-on-delivery
            orders are refunded by bank transfer to an account you give us.
          </li>
        </ul>
      </section>
    </InfoPage>
  );
}
