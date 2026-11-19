import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getErrorMessage } from "../api/client";
import { verifyPayment } from "../api/services";
import {
  Alert,
  Loading,
  cardClass,
  primaryButton,
  secondaryButton,
} from "../components/ui";
import { formatDate, formatNaira } from "../utils/format";

// Paystack redirects here after payment: /payment/callback?reference=KFP-XXXXXXXX
export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [result, setResult] = useState(null); // { message, data: { payment, booking } }
  const [loading, setLoading] = useState(Boolean(reference));
  const [error, setError] = useState("");

  const checkPayment = () => {
    setLoading(true);
    setError("");
    verifyPayment(reference)
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (reference) checkPayment();
  }, [reference]);

  if (!reference) {
    return (
      <section className="max-w-xl mx-auto space-y-4">
        <Alert>No payment reference was found in the link.</Alert>
        <Link to="/bookings" className={primaryButton}>
          Go to my bookings
        </Link>
      </section>
    );
  }

  if (loading) return <Loading text="Confirming your payment..." />;

  if (error) {
    return (
      <section className="max-w-xl mx-auto space-y-4">
        <Alert>{error}</Alert>
        <button type="button" onClick={checkPayment} className={primaryButton}>
          Try again
        </button>
      </section>
    );
  }

  const { payment, booking } = result.data;
  const isConfirmed = payment.status === "success" && booking.paymentStatus === "paid";

  let title = "Payment not completed yet";
  if (isConfirmed) title = "Booking confirmed";
  else if (payment.status === "success") title = "Payment received";
  else if (payment.status === "failed") title = "Payment failed";

  return (
    <section className={`max-w-xl mx-auto ${cardClass} text-center space-y-4`}>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-600">{result.message}</p>

      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-1">
        <p>
          <strong>{booking.room?.name}</strong> · Room {booking.room?.roomNumber}
        </p>
        <p>
          {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
        </p>
        <p className="text-lg font-extrabold text-indigo-600">
          {formatNaira(payment.amount)}
          {payment.status === "success" ? " paid" : ""}
        </p>
        <p className="text-xs text-slate-400">Booking {booking.reference}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {isConfirmed && (
          <Link to={`/check-in/${booking.reference}`} className={primaryButton}>
            Check in online
          </Link>
        )}
        {payment.status === "pending" && (
          <button type="button" onClick={checkPayment} className={primaryButton}>
            Check again
          </button>
        )}
        <Link to={`/bookings/${booking.reference}`} className={secondaryButton}>
          View booking
        </Link>
      </div>
    </section>
  );
}
