import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { cancelBooking, initializePayment } from "../api/services";
import cancelIcon from "../assets/cancel-icon.png";
import protectIcon from "../assets/protect-icon.png";
import { formatDate, formatNaira } from "../utils/format";

export default function StepThree({ booking, onBack, onCancelled }) {
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Tick every second to count down the room hold
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const holdEndsAt = new Date(booking.holdExpiresAt).getTime();
  const secondsLeft = Math.max(0, Math.floor((holdEndsAt - now) / 1000));
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const holdExpired = secondsLeft === 0;
  const formattedTotal = formatNaira(booking.amount);

  const handlePay = async () => {
    setError("");
    setIsPaying(true);
    try {
      const payment = await initializePayment(booking.reference);
      // Paystack's secure page takes the payment, then sends the guest
      // back to this app with ?reference=... (see PaymentCallback)
      window.location.href = payment.authorizationUrl;
    } catch (err) {
      setError(getErrorMessage(err));
      setIsPaying(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this booking and release the room?")) return;
    setError("");
    setIsCancelling(true);
    try {
      await cancelBooking(booking.reference);
      onCancelled();
    } catch (err) {
      setError(getErrorMessage(err));
      setIsCancelling(false);
    }
  };

  return (
    <section
      id="step-three-payment"
      className="payment-page max-w-xl mx-auto space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow-label text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Your next check-in
          </p>
          <h1 className="page-main-title text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Payment
          </h1>
        </div>
        <span className="step-counter-pill text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
          03 / 03
        </span>
      </div>

      {/* Amount Due Summary */}
      <div
        id="amount-due-card"
        className="amount-due-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1"
      >
        <span className="text-xs font-medium text-slate-400">Amount due</span>
        <p className="text-3xl font-black text-slate-900">{formattedTotal}</p>
        <p className="text-xs text-slate-500 pt-1">
          {booking.roomSnapshot?.name}, {formatDate(booking.checkInDate, false)}{" "}
          - {formatDate(booking.checkOutDate, false)}
        </p>
        <p className="text-xs text-slate-400">
          Booking reference{" "}
          <strong className="text-slate-700">{booking.reference}</strong>
        </p>
      </div>

      {/* Room hold countdown */}
      <div
        id="room-hold-timer"
        className={`border p-3.5 rounded-xl flex items-center justify-between text-xs font-medium ${
          holdExpired
            ? "bg-rose-50 border-rose-200 text-rose-700"
            : "bg-amber-50 border-amber-200/80 text-amber-900"
        }`}
      >
        <span>
          {holdExpired
            ? "Your hold on this room has expired"
            : "Room held for you"}
        </span>
        {!holdExpired && (
          <span className="font-bold tabular-nums">
            {minutes}:{seconds} min left
          </span>
        )}
      </div>

      {/* Pay with Paystack */}
      <div className="payment-form-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Payment options
          </span>
          <div className="grid grid-cols-3 gap-2">
            {["Card", "Bank transfer", "USSD"].map((option) => (
              <span
                key={option}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-center bg-slate-50 border border-slate-200 text-slate-600"
              >
                {option}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            You&apos;ll choose how to pay on Paystack&apos;s secure page, then
            come back here automatically.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        {holdExpired ? (
          <button
            type="button"
            onClick={onCancelled}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
          >
            Start a new booking
          </button>
        ) : (
          <button
            type="button"
            id="pay-now-btn"
            onClick={handlePay}
            disabled={isPaying}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPaying ? "Opening Paystack..." : `Pay ${formattedTotal}`}
          </button>
        )}
      </div>

      {/* Secondary Actions */}
      <div className="payment-secondary-actions flex flex-wrap items-center justify-center gap-3 text-xs pt-1">
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          Back to details
        </button>

        {!holdExpired && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-60"
          >
            <img
              src={cancelIcon}
              alt="Cancel booking"
              className="w-3.5 h-3.5 object-contain"
            />
            <span>{isCancelling ? "Cancelling..." : "Cancel booking"}</span>
          </button>
        )}
      </div>

      <div className="text-center pt-2 text-xs text-slate-500 flex items-center justify-center space-x-1.5">
        <img
          src={protectIcon}
          alt="Secured by Paystack"
          className="w-4 h-4 object-contain"
        />
        <span>
          Secured by <strong className="text-slate-800">paystack</strong>
        </span>
      </div>
    </section>
  );
}
