export function getPhoneDigitsRemainingHint(
  value: string,
  minDigits = 10,
): string {
  const digits = (value || "").replace(/\D/g, "");
  const n = digits.length;

  if (n <= 0) return `Enter ${minDigits}-digit phone number`;
  if (n < minDigits) {
    const remaining = minDigits - n;
    return `Enter ${remaining} more digit${remaining === 1 ? "" : "s"}`;
  }
  return "Phone number complete";
}

