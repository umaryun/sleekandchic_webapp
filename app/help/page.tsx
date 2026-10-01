import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import { DELIVERY, STORE, whatsappLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `Help & FAQs | ${STORE.name}`,
  description: "Delivery by public transport or GIG Logistics, store pickup, paying online, tracking orders and returns.",
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
        <h2>How do you deliver, and how long does it take?</h2>
        <p>We deliver to every state in Nigeria from {STORE.city}, in one of two ways. You choose at checkout.</p>
        <ul>
          <li>
            <strong>{DELIVERY.methods.standard.name}</strong> takes your order from {STORE.city} to the motor park in your
            state, where you collect it. It isn&apos;t door to door. You can pay the delivery fee online with your order, or
            at the park when you collect.
          </li>
          <li>
            <strong>{DELIVERY.methods.express.name}</strong> delivers to your door, usually in {DELIVERY.transitTime}. Its
            delivery fee is paid online with your order.
          </li>
          <li>
            <strong>We send out deliveries on {DELIVERY.dispatchDays} only.</strong>
          </li>
          <li>You&apos;ll see the delivery fees at checkout as soon as you choose your state, before you pay.</li>
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
            Online by <strong>card, bank transfer or USSD</strong> through Paystack. You pay on Paystack&apos;s secure page
            and come back to us for your confirmation. We hold your items for 60 minutes while you pay.
          </li>
          <li>
            Your items are always paid for before we ship them; we don&apos;t take payment for items on delivery.
          </li>
          <li>
            With {DELIVERY.methods.standard.name.toLowerCase()}, you can choose to pay just the delivery fee at the park
            when you collect your order.
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
