const DAY_MS = 24 * 60 * 60 * 1000;

export function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

// "YYYY-MM-DD" for today plus a number of days, in the guest's local time
export function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function nightsBetween(checkInIso, checkOutIso) {
  if (!checkInIso || !checkOutIso) return 0;
  return Math.round((new Date(checkOutIso) - new Date(checkInIso)) / DAY_MS);
}

export function plural(count, word) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

// Stay dates are calendar days stored at 00:00 UTC, so show them in UTC
// to avoid shifting to the previous day
export function formatDate(value, withYear = true) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
    timeZone: "UTC",
  });
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "pending_payment" -> "Pending payment"
export function statusLabel(status) {
  if (!status) return "";
  const text = status.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
