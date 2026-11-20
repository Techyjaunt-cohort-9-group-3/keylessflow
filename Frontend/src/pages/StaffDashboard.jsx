import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import {
  checkOutBooking,
  getBookings,
  getCheckIns,
  getServiceRequests,
  recordVerification,
  updateServiceRequestStatus,
} from "../api/services";
import {
  Alert,
  Loading,
  PageHeader,
  StatusBadge,
  cardClass,
  inputClass,
} from "../components/ui";
import RoomsPanel from "../components/RoomsPanel";
import { formatDate, formatDateTime, formatNaira, statusLabel } from "../utils/format";

const TABS = [
  { key: "requests", label: "Service requests" },
  { key: "checkins", label: "Check-ins" },
  { key: "bookings", label: "Bookings" },
];
const ADMIN_TABS = [...TABS, { key: "rooms", label: "Rooms" }];

const smallButton =
  "text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer";

function StatusFilter({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Filter by status"
      className={`${inputClass} sm:w-60`}
    >
      <option value="">All statuses</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {statusLabel(option)}
        </option>
      ))}
    </select>
  );
}

// ---------- Service requests: move them through pending → in progress → completed ----------
function RequestsPanel() {
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getServiceRequests({ status: status || undefined, limit: 50 })
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const changeStatus = async (reference, newStatus) => {
    setError("");
    try {
      await updateServiceRequestStatus(reference, newStatus);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={["pending", "in_progress", "completed", "cancelled"]} />
      <Alert>{error}</Alert>
      {loading && <Loading />}
      {!loading && items.length === 0 && <p className="text-sm text-slate-500">No requests.</p>}

      {!loading &&
        items.map((item) => (
          <div key={item._id} className={`${cardClass} space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900 text-sm">
                Room {item.roomNumber} · {statusLabel(item.category)}{" "}
                <span className="text-xs text-slate-400">({item.priority} priority)</span>
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-slate-600">{item.description}</p>
            <p className="text-xs text-slate-400">
              {item.reference} · Booking {item.bookingReference} · {formatDateTime(item.createdAt)}
              {item.preferredTime && ` · Preferred ${formatDateTime(item.preferredTime)}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.status === "pending" && (
                <button type="button" onClick={() => changeStatus(item.reference, "in_progress")} className={smallButton}>
                  Start
                </button>
              )}
              {["pending", "in_progress"].includes(item.status) && (
                <>
                  <button type="button" onClick={() => changeStatus(item.reference, "completed")} className={smallButton}>
                    Mark completed
                  </button>
                  <button type="button" onClick={() => changeStatus(item.reference, "cancelled")} className={smallButton}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

// ---------- Check-ins: approve or reject guests at the desk ----------
function CheckInsPanel() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getCheckIns({ status: status || undefined, limit: 50 })
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const verify = async (reference, approved) => {
    setError("");
    try {
      await recordVerification(reference, { approved });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={["initiated", "details_submitted", "verification_failed", "verified"]} />
      <Alert>{error}</Alert>
      {loading && <Loading />}
      {!loading && items.length === 0 && <p className="text-sm text-slate-500">No check-ins.</p>}

      {!loading &&
        items.map((item) => (
          <div key={item._id} className={`${cardClass} space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900 text-sm">
                {item.guest?.firstName} {item.guest?.lastName} · Booking {item.bookingReference}
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-xs text-slate-500">
              {item.guest?.email} · {item.guest?.phone}
              {item.details?.estimatedArrivalTime && ` · Arriving ${item.details.estimatedArrivalTime}`}
            </p>
            {item.identity?.idType && (
              <p className="text-xs text-slate-500">
                {statusLabel(item.identity.idType)} ending {item.identity.idNumberLast4} · Name on ID:{" "}
                {item.identity.nameOnId} · {item.verification?.attempts} attempt(s)
              </p>
            )}
            {item.verification?.failureReason && (
              <p className="text-xs text-rose-600">{item.verification.failureReason}</p>
            )}
            {item.status !== "verified" && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => verify(item.bookingReference, true)} className={smallButton}>
                  Approve ID
                </button>
                <button type="button" onClick={() => verify(item.bookingReference, false)} className={smallButton}>
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

// ---------- Bookings: find stays and check guests out ----------
function BookingsPanel() {
  const [status, setStatus] = useState("checked_in");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    getBookings({ status: status || undefined, limit: 50 })
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const checkOut = async (reference) => {
    if (!window.confirm(`Check out booking ${reference}? Room keys will stop working.`)) return;
    setError("");
    try {
      await checkOutBooking(reference);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={["pending_payment", "confirmed", "checked_in", "checked_out", "cancelled", "expired"]} />
      <Alert>{error}</Alert>
      {loading && <Loading />}
      {!loading && items.length === 0 && <p className="text-sm text-slate-500">No bookings.</p>}

      {!loading &&
        items.map((item) => (
          <div key={item._id} className={`${cardClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 text-sm">
                {item.guestDetails.firstName} {item.guestDetails.lastName} · Room{" "}
                {item.roomSnapshot?.roomNumber}
              </p>
              <p className="text-xs text-slate-500">
                {item.reference} · {formatDate(item.checkInDate)} → {formatDate(item.checkOutDate)} ·{" "}
                {formatNaira(item.amount)}
              </p>
              <div className="flex gap-2">
                <StatusBadge status={item.status} />
                <StatusBadge status={item.paymentStatus} />
              </div>
            </div>
            {item.status === "checked_in" && (
              <button type="button" onClick={() => checkOut(item.reference)} className={smallButton}>
                Check out
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

export default function StaffDashboard({ user }) {
  const [tab, setTab] = useState("requests");
  const isAdmin = user?.role === "admin";
  const tabs = isAdmin ? ADMIN_TABS : TABS;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow={isAdmin ? "Admin" : "Front desk"} title="Staff dashboard" />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer ${
              tab === item.key
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "requests" && <RequestsPanel />}
      {tab === "checkins" && <CheckInsPanel />}
      {tab === "bookings" && <BookingsPanel />}
      {tab === "rooms" && isAdmin && <RoomsPanel />}
    </section>
  );
}
