"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const EMPTY = { name: "", email: "", phone: "", orderNumber: "", message: "", website: "" };
const inputClass = "w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#1a1a1a]";

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof typeof EMPTY) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/v1/store/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || "Your message didn't send. Please try again.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
      setForm(EMPTY);
    } catch {
      setError("We couldn't reach the store. Check your connection and try again.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-lg border border-[#b7dfb9] bg-[#edf7ed] p-5 text-sm text-[#1e4620]">
        <CheckCircle size={20} className="shrink-0" />
        <p>Thanks, your message was sent. We&apos;ll reply to the email you gave.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {error && (
        <p role="alert" className="sm:col-span-2 flex items-center gap-2 rounded border border-[#f8b4b4] bg-[#fdf2f2] px-3.5 py-2.5 text-sm text-[#981b1b]">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </p>
      )}
      <div>
        <label htmlFor="ct-name" className="block text-xs font-bold text-[#444] mb-1.5">Name *</label>
        <input id="ct-name" required autoComplete="name" className={inputClass} {...field("name")} />
      </div>
      <div>
        <label htmlFor="ct-email" className="block text-xs font-bold text-[#444] mb-1.5">Email *</label>
        <input id="ct-email" type="email" required autoComplete="email" className={inputClass} {...field("email")} />
      </div>
      <div>
        <label htmlFor="ct-phone" className="block text-xs font-bold text-[#444] mb-1.5">Phone</label>
        <input id="ct-phone" type="tel" autoComplete="tel" className={inputClass} {...field("phone")} />
      </div>
      <div>
        <label htmlFor="ct-order" className="block text-xs font-bold text-[#444] mb-1.5">Order number (if any)</label>
        <input id="ct-order" className={inputClass} {...field("orderNumber")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="ct-message" className="block text-xs font-bold text-[#444] mb-1.5">Message *</label>
        <textarea id="ct-message" required rows={5} className={`${inputClass} resize-y`} {...field("message")} />
      </div>
      {/* Hidden from people; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="ct-website">Website</label>
        <input id="ct-website" tabIndex={-1} autoComplete="off" {...field("website")} />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="sm:col-span-2 justify-self-start rounded bg-[#1a1a1a] px-6 py-3 text-sm font-bold text-white disabled:opacity-60 flex items-center gap-2 cursor-pointer"
      >
        {status === "sending" ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Send message"}
      </button>
    </form>
  );
}
