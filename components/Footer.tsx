"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const footerLinks = {
  "Customer Service": [
    { label: "Track Your Order", href: "/orders/tracking" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Store Locator", href: "/store-locator" },
  ],
  Information: [
    { label: "About Us", href: "/about" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
  Social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "Twitter", href: "https://twitter.com" },
    { label: "YouTube", href: "https://youtube.com" },
  ],
};

const contactInfo = [
  { heading: "EMAIL", value: "hello@slickandchic.com" },
  { heading: "CALL US", value: "+1 (800) 123-4567" },
  { heading: "ADDRESS", value: "123 Commerce St, New York" },
];

function AccordionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 px-1 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
          {title}
        </span>
        <ChevronDown
          size={18}
          className="text-neutral-400 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? "300px" : "0",
          opacity: open ? 1 : 0,
          paddingBottom: open ? "16px" : "0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f5] text-[#1a1a1a]">
      {/* === Large Logo Section === */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "20px 10px 12px",
          textAlign: "center",
        }}
      >
        <Link href="/" className="inline-block no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Slickandchic"
            className="w-[240px] sm:w-[320px] lg:w-[450px] h-auto mx-auto"
          />
        </Link>
      </div>

      {/* === Desktop: Contact + Links Row === */}
      <div className="hidden md:block border-t border-neutral-300 w-full">
        <div
          style={{
            maxWidth: "1280px",
            margin: "10px auto",
            padding: "10px 24px",
          }}
        >
          <div className="grid grid-cols-[1fr_auto] gap-10 lg:gap-25 items-start">
            {/* Contact Info Columns */}
            <div className="flex gap-10 lg:gap-14">
              {contactInfo.map((item) => (
                <div key={item.heading}>
                  <p className="text-[15px] font-bold uppercase tracking-widest text-[#1a1a1a] mb-2 m-0">
                    {item.heading}
                  </p>
                  <p className="text-[13px] text-neutral-600 m-0 leading-relaxed">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Link Columns */}
            <div className="flex gap-12 lg:gap-25">
              {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                  <p className="text-[15px] font-bold uppercase tracking-widest text-[#1a1a1a] mb-3 m-0">
                    {title}
                  </p>
                  <ul className="list-none p-0 m-0 space-y-2">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          target={link.href.startsWith("http") ? "_blank" : undefined}
                          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-[13px] text-neutral-600 no-underline hover:text-[#b88d7a] transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === Mobile: Accordion Sections === */}
      <div className="md:hidden border-t border-neutral-300 px-4 pt-6">
        {Object.entries(footerLinks).map(([title, links]) => (
          <AccordionSection key={title} title={title}>
            <ul className="list-none p-0 m-0 space-y-2.5 px-1">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-[13px] text-neutral-600 no-underline hover:text-[#b88d7a] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>
        ))}

        {/* Mobile Contact Info */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          {contactInfo.map((item) => (
            <div key={item.heading}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a] mb-1 m-0">
                {item.heading}
              </p>
              <p className="text-[13px] text-neutral-600 m-0">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* === Bottom Copyright Bar === */}
      <div style={{ borderTop: "1px solid #d4d4d4", marginTop: "20px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "11px",
            color: "#737373",
          }}
        >
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <span>Lagos, Nigeria</span>
            <Link
              href="/terms"
              className="text-neutral-500 no-underline hover:text-[#b88d7a] transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy-policy"
              className="text-neutral-500 no-underline hover:text-[#b88d7a] transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Slickandchic</span>
        </div>
      </div>
    </footer>
  );
}
