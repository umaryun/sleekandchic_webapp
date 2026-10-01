import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import { DELIVERY, STORE, whatsappLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `Help & FAQs | ${STORE.name}`,
  description: "Delivery with GIG Logistics, store pickup, paying by card or on delivery, tracking orders and returns.",
};

export default function HelpPage() {
  return (
    <InfoPage
      title="Help & FAQs"
      intro={
        <p>
          Can&apos;t find your answer? Message us on <a href={whatsappLink("Hello, I have a question about")}>WhatsApp</a> or
          call {STORE.phoneDisplay}.
        </p>
      }
    >
      <section>
        <h2>How much is delivery, and how long does it take?</h2>
        <p>
          We deliver to every state in Nigeria from {STORE.city} with {DELIVERY.courier}. Delivery takes{" "}
          {DELIVERY.transitTime} to your state of residence.
        </p>
        <ul>
          <li>
            <strong>We send out deliveries on {DELIVERY.dispatchDays} only.</strong>
          </li>
          <li>
            You pay the delivery fee to us, based on the weight of your order, before we hand it to {DELIVERY.courier}.
            You&apos;ll see the fee at checkout as soon as you choose your state, before you pay.
          </li>
          <li>Standard delivery is free when your order is over the amount shown for your state at checkout.</li>
          <li>Delivery times are estimates and start once your order is sent out.</li>
        </ul>
      </section>

      <section>
        <h2>Can I pick up my order instead?</h2>
        <p>
          Yes. Pickup is available at our store: {STORE.address}. Message us on{" "}
          <a href={whatsappLink("Hello, I'd like to pick up my order from the store")}>WhatsApp</a> to arrange it.
        </p>
      </section>

      <section>
        <h2>How can I pay?</h2>
        <ul>
          <li>
            <strong>Card, bank transfer or USSD</strong> through Paystack. You pay on Paystack&apos;s secure page and
            come back to us for your confirmation. We hold your items for 60 minutes while you pay.
          </li>
          <li>
            <strong>Pay on delivery</strong> with cash or POS when your order arrives. We&apos;ll call the number you
            give at checkout to confirm delivery.
          </li>
        </ul>
      </section>

      <section>
        <h2>Where is my order?</h2>
        <p>
          Use <Link href="/orders/tracking">Track your order</Link> with your order number and the email or phone
          number you used at checkout. If you have an account, your orders are also listed under{" "}
          <Link href="/profile">My Account</Link>.
        </p>
      </section>

      <section>
        <h2>My payment went through but I didn&apos;t get a confirmation</h2>
        <p>
          Please don&apos;t pay again. Send us your Paystack receipt on{" "}
          <a href={whatsappLink("Hello, I paid but didn't get a confirmation. My Paystack receipt:")}>WhatsApp</a> and
          we&apos;ll confirm your order.
        </p>
      </section>

      <section>
        <h2>Can I return or exchange an item?</h2>
        <p>
          Yes, within {STORE.returnsWindow} of delivery, if the item is unused, unwashed and in its original packaging
          with its tags on. Ask us first; please don&apos;t send anything back before we approve the return. Sale items
          and custom-made pieces can&apos;t be refunded, and we exchange items only if they arrive defective or damaged.
          See our <Link href="/returns">returns &amp; refund policy</Link>.
        </p>
      </section>

      <section>
        <h2>I&apos;m not sure about my size</h2>
        <p>
          Message us on <a href={whatsappLink("Hello, I need help choosing a size for")}>WhatsApp</a> with the item and
          your usual size and we&apos;ll help you choose before you order.
        </p>
      </section>
    </InfoPage>
  );
}
