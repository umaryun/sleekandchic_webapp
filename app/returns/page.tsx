import type { Metadata } from "next";
import type { ReactNode } from "react";
import InfoPage from "@/components/InfoPage";
import { STORE, telLink, mailLink } from "@/lib/store";

export const metadata: Metadata = {
  title: `Return & Refund Policy | ${STORE.name}`,
  description: `Return unused items within ${STORE.returnsWindow} of delivery. How returns, refunds and exchanges work at ${STORE.name}.`,
};

/** A policy point: a bold label, then the rule. */
function Point({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li>
      <strong className="text-[#1a1a1a]">{label}:</strong> {children}
    </li>
  );
}

export default function ReturnsPage() {
  return (
    <InfoPage
      title="Return & Refund Policy"
      updated="1 October 2026"
      intro={
        <p>
          At {STORE.name}, we are committed to ensuring your complete satisfaction with our ready-to-wear pieces. Please
          read our policy carefully to understand your rights and responsibilities regarding returns, refunds and
          exchanges.
        </p>
      }
    >
      <section>
        <h2>1. General conditions</h2>
        <ul>
          <Point label="Eligibility">
            To be eligible for a return, your item must be unused, unwashed, undamaged and in the same pristine condition
            that you received it. It must also be in its original packaging with all brand tags and labels intact.
          </Point>
          <Point label="Time frame">
            You have 7 to 10 calendar days from the date of delivery to start a return.
          </Point>
        </ul>
      </section>

      <section>
        <h2>2. Return process</h2>
        <ul>
          <Point label="Starting a return">
            Contact our customer service team with your order number, a brief description of the issue, and photos if
            applicable.
          </Point>
          <Point label="Authorisation">
            Once your return request is approved, we will give you the return address. Please do not send your purchase
            back without our approval first.
          </Point>
          <Point label="Shipping">
            You are responsible for paying your own shipping costs for returning your item. We strongly recommend using a
            trackable shipping service or buying shipping insurance, as we cannot guarantee that we will receive your
            returned item.
          </Point>
        </ul>
      </section>

      <section>
        <h2>3. Inspection and approval</h2>
        <ul>
          <Point label="Inspection">
            When we receive your returned item, our team will inspect it to make sure it meets our return conditions.
          </Point>
          <Point label="Notification">
            We will let you know by email or message once we have received and inspected your item, and whether your
            refund has been approved or rejected based on its condition.
          </Point>
        </ul>
      </section>

      <section>
        <h2>4. Refund process</h2>
        <ul>
          <Point label="Refund method">
            If approved, your refund will be processed and credited back to your original method of payment within 3 to 4
            working days.
          </Point>
          <Point label="Deductions">
            Original shipping costs are non-refundable. If a return is due to an error on our part, shipping costs will be
            adjusted accordingly.
          </Point>
        </ul>
      </section>

      <section>
        <h2>5. Exchanges</h2>
        <ul>
          <Point label="Eligibility">
            We only replace items if they arrive defective or damaged. If you need to exchange a piece for the same item
            because of a defect, contact us with your order details.
          </Point>
          <Point label="Process">
            Once your exchange is approved, you will receive instructions on how to proceed. Exchanges are subject to
            product and fabric availability.
          </Point>
        </ul>
      </section>

      <section>
        <h2>6. Non-refundable items</h2>
        <ul>
          <Point label="Sale items">
            Only regular-priced items can be refunded. Items bought during promotional sales or clearance events cannot
            be refunded.
          </Point>
          <Point label="Custom orders">
            Custom-made, tailored or personalised items are non-refundable unless they arrive damaged or defective.
          </Point>
          <Point label="Gift cards">Gift cards are non-refundable and cannot be exchanged for cash.</Point>
        </ul>
      </section>

      <section>
        <h2>7. Damaged or defective items</h2>
        <ul>
          <Point label="Reporting">
            If you receive a damaged or defective garment, contact us immediately with a description of the issue and
            clear photos of the damage.
          </Point>
          <Point label="Resolution">
            We take quality control seriously and will work quickly to resolve the issue, which may mean a replacement, a
            repair or a full refund.
          </Point>
        </ul>
      </section>

      <section>
        <h2>8. Exceptions</h2>
        <ul>
          <Point label="Special circumstances">
            In rare cases, we may accept returns outside the standard {STORE.returnsWindow} window at our sole
            discretion. These exceptions are handled case by case to make sure the outcome is fair.
          </Point>
        </ul>
      </section>

      <section>
        <h2>9. International returns</h2>
        <ul>
          <Point label="Duties and taxes">
            International customers are responsible for any customs duties, taxes or brokerage fees associated with their
            return.
          </Point>
          <Point label="Shipping">
            International returns follow the same process as returns within Nigeria. Contact our support team for help
            with routing.
          </Point>
        </ul>
      </section>

      <section>
        <h2>10. Contact information</h2>
        <p>For any questions about this policy, or for help with a return, reach out to our team:</p>
        <ul className="mt-2">
          <Point label="Email">
            <a href={mailLink}>{STORE.email}</a>
          </Point>
          <Point label="Phone">
            <a href={telLink}>{STORE.phoneDisplay}</a>
          </Point>
          <Point label="Customer service hours">{STORE.serviceHours}</Point>
        </ul>
      </section>
    </InfoPage>
  );
}
