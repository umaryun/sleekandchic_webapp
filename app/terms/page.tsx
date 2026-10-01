import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import { STORE } from "@/lib/store";

export const metadata: Metadata = {
  title: `Terms & conditions | ${STORE.name}`,
  description: "Terms for ordering, paying, delivery and returns.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & conditions"
      updated="1 October 2026"
      intro={<p>These terms apply when you order from {STORE.name}. By placing an order you agree to them.</p>}
    >
      <section>
        <h2>Prices and orders</h2>
        <ul>
          <li>Prices are in Nigerian naira. The total you see before you pay, including delivery, is what you pay.</li>
          <li>Your order is confirmed when we receive payment, or, for pay on delivery, when we confirm it with you by phone.</li>
          <li>
            If an item becomes unavailable after you order, we&apos;ll tell you and refund what you paid for it.
          </li>
        </ul>
      </section>

      <section>
        <h2>Payment</h2>
        <ul>
          <li>Card, bank transfer and USSD payments are processed by Paystack.</li>
          <li>Card orders not paid within 60 minutes are cancelled and the items released.</li>
          <li>Pay-on-delivery orders are paid in cash or by POS when the order is delivered.</li>
        </ul>
      </section>

      <section>
        <h2>Delivery</h2>
        <p>
          We deliver across Nigeria. Delivery fees and estimated times are shown at checkout for your state; estimates
          aren&apos;t guaranteed. Please give a phone number the courier can reach.
        </p>
      </section>

      <section>
        <h2>Returns</h2>
        <p>
          Faulty, damaged or wrong items reported within {STORE.returnsWindowHours} hours of delivery are replaced or
          refunded. See the <Link href="/returns">returns policy</Link>.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <p>Keep your password private. You&apos;re responsible for orders placed from your account.</p>
      </section>

      <section>
        <h2>Contact and law</h2>
        <p>
          Questions: <a href={`mailto:${STORE.email}`}>{STORE.email}</a> or {STORE.phoneDisplay}. These terms are governed
          by the laws of the Federal Republic of Nigeria.
        </p>
      </section>
    </InfoPage>
  );
}
