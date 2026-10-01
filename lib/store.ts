// Store details shown to customers. Change them here, not in pages.

export const STORE = {
  name: "Sleekandchic",
  tagline: "Modest fashion from Kaduna, delivered across Nigeria",
  email: "sleekandchic.it@gmail.com",
  phoneDisplay: "+234 903 377 7385",
  phoneE164: "+2349033777385",
  whatsappNumber: "2349033777385",
  address: "Grey Parrot Center, beside Second Gate, Urban Shelter, Millennium City, Kaduna",
  city: "Kaduna",
  /** Hours a faulty, damaged or wrong item can be reported after delivery. */
  returnsWindowHours: 48,
} as const;

/** WhatsApp chat link to the store, optionally with a prefilled message. */
export function whatsappLink(message?: string) {
  return whatsappTo(STORE.whatsappNumber, message);
}

/** WhatsApp chat link to any Nigerian number ("0803…", "+234 803…" or "234803…"). */
export function whatsappTo(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "234");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const telLink = `tel:${STORE.phoneE164}`;
export const mailLink = `mailto:${STORE.email}`;
