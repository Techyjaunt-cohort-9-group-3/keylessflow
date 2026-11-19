import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../api/client";
import { getBookings } from "../api/services";
import {
  Alert,
  Loading,
  PageHeader,
  StatusBadge,
  primaryButton,
} from "../components/ui";
import { formatDate, formatNaira, plural } from "../utils/format";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBookings({ limit: 50 })
      .then(setBookings)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Your stays" title="My bookings">
        <Link to="/" className={primaryButton}>
          Book a room
        </Link>
      </PageHeader>

      <Alert>{error}</Alert>
      {loading && <Loading text="Loading your bookings..." />}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">
          You have no bookings yet.
        </p>
      )}

      <div className="space-y-3">
        {bookings.map((booking) => (
          <Link
            key={booking._id}
            to={`/bookings/${booking.reference}`}
            className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900">
                  {booking.roomSnapshot?.name}
                </h2>
                <span className="text-xs text-slate-400">
                  Room {booking.roomSnapshot?.roomNumber}
                </span>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-xs text-slate-500">
                {formatDate(booking.checkInDate)} →{" "}
                {formatDate(booking.checkOutDate)} ·{" "}
                {plural(booking.nights, "night")}
              </p>
              <p className="text-xs text-slate-400">{booking.reference}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-bold text-slate-900">
                {formatNaira(booking.amount)}
              </p>
              <StatusBadge status={booking.paymentStatus} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
