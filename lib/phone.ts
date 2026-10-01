/**
 * A Nigerian mobile number in +234 form, from any common way of writing it:
 * "0803 000 0000", "+234 803 000 0000", "2348030000000", "(0803)-000-0000".
 * Null when it isn't one.
 */
export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (!/^\d+$/.test(digits)) return null;
  const local = digits.startsWith("234") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  // Mobile numbers: 10 digits after the country code, starting 7, 8 or 9.
  return /^[789]\d{9}$/.test(local) ? `+234${local}` : null;
}

export const PHONE_MESSAGE = "Enter a Nigerian mobile number, like 0803 000 0000";
