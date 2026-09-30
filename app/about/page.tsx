import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import { STORE, whatsappLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `About us | ${STORE.name}`,
  description: STORE.tagline,
};

export default function AboutPage() {
  return (
    <InfoPage title={`About ${STORE.name}`} intro={<p>{STORE.tagline}.</p>}>
      <section>
        <h2>What we sell</h2>
        <p>
          Abayas, bubu, kaftans, gowns, dresses, two-piece sets and inner dresses, chosen for modest everyday wear and
          special occasions. <Link href="/products">Browse the collection</Link>.
        </p>
      </section>

      <section>
        <h2>How we deliver</h2>
        <p>
          We&apos;re based in {STORE.city} and deliver to every state in Nigeria. Pay by card, transfer or USSD through
          Paystack, or pay on delivery. <Link href="/help">Delivery and payment details</Link>.
        </p>
      </section>

      <section>
        <h2>Talk to us</h2>
        <p>
          Message us on <a href={whatsappLink()}>WhatsApp</a>, call {STORE.phoneDisplay}, or email{" "}
          <a href={`mailto:${STORE.email}`}>{STORE.email}</a>. You can also visit us at {STORE.address}.
        </p>
      </section>
    </InfoPage>
  );
}
