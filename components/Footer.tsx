import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Apple,
  Play,
} from "lucide-react";

const footerLinks = {
  Information: [
    { label: "About Us", href: "/about" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Careers", href: "/careers" },
    { label: "Affiliate", href: "/affiliate" },
    { label: "Sitemap", href: "/sitemap" },
  ],
  "Customer Service": [
    { label: "Help Center", href: "/help" },
    { label: "Track Your Order", href: "/orders/tracking" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faqs" },
    { label: "Store Locator", href: "/store-locator" },
  ],
  "My Account": [
    { label: "Sign In", href: "/login" },
    { label: "Register", href: "/register" },
    { label: "Cart", href: "/cart" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Compare", href: "/compare" },
    { label: "Order History", href: "/orders" },
  ],
};

const socialLinks = [
  { href: "https://facebook.com", Icon: Facebook, label: "Facebook" },
  { href: "https://twitter.com", Icon: Twitter, label: "Twitter" },
  { href: "https://instagram.com", Icon: Instagram, label: "Instagram" },
  { href: "https://youtube.com", Icon: Youtube, label: "YouTube" },
  { href: "https://linkedin.com", Icon: Linkedin, label: "LinkedIn" },
];

const paymentIcons = ["Visa", "Mastercard", "PayPal", "Stripe", "Apple Pay"];

export default function Footer() {
  return (
    <footer className="bg-[#f8f8f8] text-black border-t border-neutral-200">
      
      {/* Top Footer Grid Section */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "56px 16px",
          width: "100%",
        }}
      >
        
        {/* Brand Column */}
        <div>
          <Link href="/" className="inline-block no-underline mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Slickandchic"
              className="w-[170px] md:w-[200px]"
              
            />
          </Link>
          <p className="text-[13px] leading-relaxed text-neutral-500 mb-5">
            We bring you the finest handcrafted products from around the world.
            Quality, style, and comfort — delivered to your door.
          </p>

          {/* Contact Info list */}
          <div className="flex flex-col gap-2.5">
            {[
              { Icon: MapPin, text: "123 Commerce St, New York, NY 10001" },
              { Icon: Phone, text: "+1 (800) 123-4567" },
              { Icon: Mail, text: "hello@ninico.com" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <Icon size={14} className="text-[#b88d7a] mt-1 flex-shrink-0" />
                <span className="text-[13px] text-neutral-600">{text}</span>
              </div>
            ))}
          </div>

          {/* Social Icons list */}
          <div className="flex items-center gap-2.5 mt-6">
            {socialLinks.map(({ href, Icon, label }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-[34px] h-[34px] rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-[#b88d7a] hover:border-[#b88d7a] hover:text-white transition-all duration-200"
              >
                <Icon size={14} />
              </Link>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-5 pb-2.5 border-b border-neutral-200">
              {title}
            </h4>
            <ul className="list-none p-0 m-0 space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-black hover:text-[#b88d7a] no-underline text-[13px] flex items-center gap-2 transition-colors duration-200"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#b88d7a] flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Slickandchic. All rights reserved. Powered by{" "}
        <Link
          href="https://botble.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#b88d7a] hover:underline no-underline"
        >
          Botble Technologies
        </Link>
        .
      </div>
    </footer>
  );
}
