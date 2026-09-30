import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { STORE } from "@/lib/store";

export const metadata: Metadata = {
  title: `Privacy policy | ${STORE.name}`,
  description: "What personal information we collect, why, who we share it with, and your rights.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      updated="1 October 2026"
      intro={
        <p>
          {STORE.name} ({STORE.address}) collects only the information we need to take and deliver your orders. This page
          explains what we collect and your rights under the Nigeria Data Protection Act 2023.
        </p>
      }
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Your name, email address and phone number.</li>
          <li>Your delivery address.</li>
          <li>Your orders and what you paid.</li>
          <li>If you create an account, your password, stored in a form we can&apos;t read.</li>
        </ul>
        <p className="mt-3">
          We don&apos;t collect or store your card details. Card, transfer and USSD payments are handled by Paystack.
        </p>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To process, deliver and support your orders, and to contact you about them.</li>
          <li>To run your account, if you have one.</li>
          <li>To keep the records the law requires for sales.</li>
        </ul>
        <p className="mt-3">We don&apos;t sell your information or use it for advertising.</p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <ul>
          <li>Paystack, to process card, transfer and USSD payments.</li>
          <li>The courier delivering your order, who receives your name, phone number and delivery address.</li>
          <li>The companies that host our website and database and send our emails, only to provide those services.</li>
        </ul>
      </section>

      <section>
        <h2>Cookies and storage</h2>
        <p>
          We use a cookie to keep you signed in, and your browser&apos;s storage to remember your shopping bag. We
          don&apos;t use advertising cookies.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep order records for as long as the law requires for sales records. You can ask us to delete your account
          at any time; we&apos;ll keep only the order records we must.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You can ask to see, correct or delete the information we hold about you, or object to how we use it. Email{" "}
          <a href={`mailto:${STORE.email}`}>{STORE.email}</a>. You can also complain to the Nigeria Data Protection
          Commission.
        </p>
      </section>
    </InfoPage>
  );
}
