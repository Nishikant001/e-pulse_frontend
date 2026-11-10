// Contact-form validation — pure, shared by the page and the tests.
export const LIMITS = { name: [2, 100], organisation: [0, 120], message: [20, 2000], phone: [0, 25] };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\-\s\d.]{6,25}$/;

export function validateContact(v = {}) {
  const e = {};
  const name = String(v.name ?? "").trim(); const email = String(v.email ?? "").trim(); const org = String(v.organisation ?? "").trim();
  const phone = String(v.phone ?? "").trim(); const message = String(v.message ?? "").trim();
  if (name.length < LIMITS.name[0]) e.name = "Enter your name (at least 2 characters).";
  else if (name.length > LIMITS.name[1]) e.name = "Name is too long (100 characters maximum).";
  if (!email) e.email = "Enter your work email address.";
  else if (email.length > 254 || !EMAIL.test(email)) e.email = "Enter a valid email address, for example name@company.com.";
  if (org.length > LIMITS.organisation[1]) e.organisation = "Organisation name is too long (120 characters maximum).";
  if (phone && !PHONE.test(phone)) e.phone = "Use digits, spaces, +, ( ) or - only (6–25 characters).";
  if (message.length < LIMITS.message[0]) e.message = `Tell us a little more (at least ${LIMITS.message[0]} characters).`;
  else if (message.length > LIMITS.message[1]) e.message = "Message is too long (2000 characters maximum).";
  if (!v.consent) e.consent = "Please confirm that you have read the Privacy Policy.";
  return { valid: Object.keys(e).length === 0, errors: e };
}

export function mailtoHref(to, v) {
  const body = `${String(v.message ?? "").trim()}\n\n—\n${String(v.name ?? "").trim()}${v.organisation ? `, ${String(v.organisation).trim()}` : ""}${v.phone ? `\n${String(v.phone).trim()}` : ""}`;
  return `mailto:${encodeURIComponent(to).replace(/%40/g, "@")}?subject=${encodeURIComponent("e-Pulse enquiry")}&body=${encodeURIComponent(body)}`;
}
