import { Link } from "react-router";
import { statusLabel } from "../utils/format";

// Shared Tailwind class names so every screen looks the same
export const cardClass =
  "bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm";
export const inputClass =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600";
export const labelClass = "text-xs font-medium text-slate-500 block mb-1";
export const primaryButton =
  "bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
export const secondaryButton =
  "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
export const dangerButton =
  "bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}

const ALERT_STYLES = {
  error: "bg-rose-50 border-rose-200 text-rose-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  info: "bg-indigo-50 border-indigo-100 text-indigo-800",
};

export function Alert({ type = "error", children }) {
  if (!children) return null;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`border rounded-xl px-4 py-3 text-sm ${ALERT_STYLES[type]}`}
    >
      {children}
    </div>
  );
}

const GREEN = ["confirmed", "paid", "success", "verified", "completed", "active", "granted", "checked_in"];
const AMBER = ["pending_payment", "pending", "unpaid", "initiated", "details_submitted", "in_progress"];
const RED = ["cancelled", "failed", "expired", "verification_failed", "refund_required", "revoked", "denied"];

export function StatusBadge({ status }) {
  let colors = "bg-slate-100 text-slate-600";
  if (GREEN.includes(status)) colors = "bg-emerald-50 text-emerald-700";
  if (AMBER.includes(status)) colors = "bg-amber-50 text-amber-700";
  if (RED.includes(status)) colors = "bg-rose-50 text-rose-700";

  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function Loading({ text = "Loading..." }) {
  return <p className="text-sm text-slate-500 py-10 text-center">{text}</p>;
}

export function BackLink({ to, children = "Back" }) {
  return (
    <Link
      to={to}
      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
    >
      ← {children}
    </Link>
  );
}
