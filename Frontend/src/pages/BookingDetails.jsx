import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../api/client";
import {
  cancelBooking,
  getBooking,
  getRecommendations,
  initializePayment,
  verifyPayment,
} from "../api/services";
import {
  Alert,
  BackLink,
  Loading,
  PageHeader,
  StatusBadge,
  cardClass,
  dangerButton,
  primaryButton,
  secondaryButton,
} from "../components/ui";
import {
  formatDate,
  formatDateTime,
  formatNaira,
  plural,
  statusLabel,
} from "../utils/format";

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-slate-400 font-medium">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800">{children}</dd>
    </div>
  );
}

export default function BookingDetails() {
  const { reference } = useParams();
  const [booking, setBooking] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBooking = () =>
    getBooking(reference)
      .then((data) => {
        setBooking(data);
        // Personalised suggestions for confirmed and current stays
        if (["confirmed", "checked_in"].includes(data.status)) {
          getRecommendations(reference)
            .then(setRecommendations)
            .catch(() => setRecommendations([]));
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadBooking();
  }, [reference]);

  const handlePay = async () => {
    setError("");
    setBusy(true);
    try {
      const payment = await initializePayment(reference);
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  const handleCheckPayment = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await verifyPayment(booking.latestPayment.reference);
      setMessage(result.message);
      await loadBooking();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this booking and release the room?")) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await cancelBooking(reference);
      setMessage("Your booking has been cancelled.");
      await loadBooking();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  };

  if (loading) return <Loading text="Loading booking..." />;
  if (!booking) {
    return (
      <section className="space-y-4">
        <BackLink to="/bookings">My bookings</BackLink>
        <Alert>{error}</Alert>
      </section>
    );
  }

  const isAwaitingPayment = booking.status === "pending_payment";
  const holdActive =
    isAwaitingPayment && new Date(booking.holdExpiresAt) > new Date();
  const paymentPending = booking.latestPayment?.status === "pending";
  const canRequestService = ["confirmed", "checked_in"].includes(booking.status);

  return (
    <section className="space-y-6">
      <BackLink to="/bookings">My bookings</BackLink>

      <PageHeader eyebrow={`Booking ${booking.reference}`} title={booking.roomSnapshot?.name}>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      </PageHeader>

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} lg:col-span-2 space-y-5`}>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Detail label="Room">
              {booking.roomSnapshot?.name} · {booking.roomSnapshot?.roomNumber}
            </Detail>
            <Detail label="Check-in">{formatDate(booking.checkInDate)}</Detail>
            <Detail label="Check-out">{formatDate(booking.checkOutDate)}</Detail>
            <Detail label="Length of stay">{plural(booking.nights, "night")}</Detail>
            <Detail label="Guests">{booking.numberOfGuests}</Detail>
            <Detail label="Total">{formatNaira(booking.amount)}</Detail>
          </dl>

          <div className="border-t border-slate-100 pt-4">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Detail label="Guest">
                {booking.guestDetails.firstName} {booking.guestDetails.lastName}
              </Detail>
              <Detail label="Email">{booking.guestDetails.email}</Detail>
              <Detail label="Phone">{booking.guestDetails.phone}</Detail>
            </dl>
          </div>

          {booking.specialRequests && (
            <div className="border-t border-slate-100 pt-4">
              <Detail label="Special requests">{booking.specialRequests}</Detail>
            </div>
          )}

          {booking.cancellationReason && (
            <p className="text-xs text-slate-500">
              Cancelled: {booking.cancellationReason}
            </p>
          )}
        </div>

        {/* What the guest can do next */}
        <aside className={`${cardClass} space-y-3`}>
          <h2 className="font-bold text-slate-900">Next steps</h2>

          {isAwaitingPayment && holdActive && (
            <>
              <p className="text-xs text-slate-500">
                Pay before {formatDateTime(booking.holdExpiresAt)} to confirm
                your room.
              </p>
              <button type="button" onClick={handlePay} disabled={busy} className={`${primaryButton} w-full`}>
                Pay {formatNaira(booking.amount)}
              </button>
              {paymentPending && (
                <button type="button" onClick={handleCheckPayment} disabled={busy} className={`${secondaryButton} w-full`}>
                  I&apos;ve paid, check status
                </button>
              )}
              <button type="button" onClick={handleCancel} disabled={busy} className={`${dangerButton} w-full`}>
                Cancel booking
              </button>
            </>
          )}

          {isAwaitingPayment && !holdActive && (
            <>
              <p className="text-xs text-slate-500">
                The hold on this room has expired. Please make a new booking.
              </p>
              <Link to="/" className={`${primaryButton} block w-full text-center`}>
                Find a room
              </Link>
            </>
          )}

          {booking.status === "confirmed" && (
            <Link to={`/check-in/${reference}`} className={`${primaryButton} block w-full text-center`}>
              Check in online
            </Link>
          )}

          {booking.status === "checked_in" && (
            <Link to={`/bookings/${reference}/key`} className={`${primaryButton} block w-full text-center`}>
              Open digital room key
            </Link>
          )}

          {canRequestService && (
            <Link to={`/bookings/${reference}/services`} className={`${secondaryButton} block w-full text-center`}>
              Request a service
            </Link>
          )}

          {["checked_out", "cancelled", "expired"].includes(booking.status) && (
            <p className="text-xs text-slate-500">
              This booking is {statusLabel(booking.status).toLowerCase()}.
            </p>
          )}

          {booking.latestPayment && (
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
              <p>
                Payment {booking.latestPayment.reference}:{" "}
                <StatusBadge status={booking.latestPayment.status} />
              </p>
              {booking.latestPayment.paidAt && (
                <p>Paid on {formatDateTime(booking.latestPayment.paidAt)}</p>
              )}
            </div>
          )}

          {booking.checkIn && (
            <p className="text-xs text-slate-500">
              Online check-in: <StatusBadge status={booking.checkIn.status} />
            </p>
          )}
        </aside>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">
            Recommended for your stay
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <article key={rec._id} className={`${cardClass} space-y-2`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{rec.title}</h3>
                  {rec.price > 0 && (
                    <span className="text-sm font-semibold text-indigo-600">
                      {formatNaira(rec.price)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{rec.description}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {statusLabel(rec.category)}
                </p>
                {rec.reasons?.length > 0 && (
                  <p className="text-xs text-indigo-700">{rec.reasons[0]}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
