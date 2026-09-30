import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import { STORE, whatsappLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `Help & FAQs | ${STORE.name}`,
  description: "Delivery fees and times, paying by card or on delivery, tracking orders and returns.",
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
          We deliver to every state in Nigeria from {STORE.city}. The fee and the estimated delivery time depend on your
          state, and you&apos;ll see both at checkout as soon as you choose your state, before you pay.
        </p>
        <ul>
          <li>Standard delivery is the cheaper option. Express delivery is faster and costs more.</li>
          <li>Standard delivery is free when your order is over the amount shown for your state at checkout.</li>
          <li>Orders with more than three items include ₦200 handling for each extra item.</li>
          <li>Delivery times are estimates and start once your order is confirmed.</li>
        </ul>
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
          We accept returns for items that arrive faulty, damaged or wrong, reported within {STORE.returnsWindowHours}{" "}
          hours of delivery. We don&apos;t accept returns for a change of mind. See our{" "}
          <Link href="/returns">returns policy</Link>.
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
