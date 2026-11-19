import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../api/client";
import {
  getCheckIn,
  startCheckIn,
  submitCheckInDetails,
  verifyIdentity,
} from "../api/services";
import {
  Alert,
  BackLink,
  Loading,
  PageHeader,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
} from "../components/ui";
import { formatDate, formatDateTime } from "../utils/format";

const ID_TYPES = [
  { value: "national_id", label: "National ID (NIN)", hint: "11 digits" },
  { value: "passport", label: "Passport", hint: "6 to 9 letters or digits" },
  { value: "drivers_license", label: "Driver's licence", hint: "8 to 15 letters or digits" },
];

const STEPS = ["Your details", "Verify identity", "Room key"];

export default function CheckIn() {
  const { reference } = useParams();
  const [data, setData] = useState(null); // { checkIn, eligibility, booking }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState({
    estimatedArrivalTime: "14:00",
    numberOfGuests: "",
    purposeOfVisit: "leisure",
    phone: "",
    specialRequests: "",
  });
  const [identity, setIdentity] = useState({
    idType: "national_id",
    idNumber: "",
    nameOnId: "",
    nationality: "",
  });

  const loadCheckIn = () =>
    getCheckIn(reference)
      .then((result) => {
        setData(result);
        const guest = result.booking.guestDetails;
        // Prefill the forms from the booking
        setDetails((prev) => ({
          ...prev,
          numberOfGuests: prev.numberOfGuests || result.booking.numberOfGuests,
          phone: prev.phone || guest.phone,
        }));
        setIdentity((prev) => ({
          ...prev,
          nameOnId: prev.nameOnId || `${guest.firstName} ${guest.lastName}`,
        }));
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadCheckIn();
  }, [reference]);

  // Runs an API call, then reloads the check-in to show the new status
  const submit = async (apiCall) => {
    setBusy(true);
    setError("");
    try {
      await apiCall();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    await loadCheckIn();
    setBusy(false);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    submit(() =>
      submitCheckInDetails(reference, {
        estimatedArrivalTime: details.estimatedArrivalTime,
        numberOfGuests: Number(details.numberOfGuests),
        purposeOfVisit: details.purposeOfVisit,
        phone: details.phone || undefined,
        specialRequests: details.specialRequests || undefined,
      }),
    );
  };

  const handleIdentitySubmit = (e) => {
    e.preventDefault();
    submit(() =>
      verifyIdentity(reference, {
        idType: identity.idType,
        idNumber: identity.idNumber.trim(),
        nameOnId: identity.nameOnId.trim(),
        nationality: identity.nationality || undefined,
      }),
    );
  };

  const changeDetails = (e) =>
    setDetails({ ...details, [e.target.name]: e.target.value });
  const changeIdentity = (e) =>
    setIdentity({ ...identity, [e.target.name]: e.target.value });

  if (loading) return <Loading text="Loading check-in..." />;
  if (!data) {
    return (
      <section className="space-y-4">
        <BackLink to="/bookings">My bookings</BackLink>
        <Alert>{error}</Alert>
      </section>
    );
  }

  const { checkIn, eligibility, booking } = data;
  const status = checkIn?.status;
  let stepIndex = 0;
  if (status === "details_submitted" || status === "verification_failed") stepIndex = 1;
  if (status === "verified") stepIndex = 2;
  const idHint = ID_TYPES.find((type) => type.value === identity.idType)?.hint;

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <BackLink to={`/bookings/${reference}`}>Booking {reference}</BackLink>

      <PageHeader eyebrow="Online check-in" title={booking.room?.name}>
        <p className="text-xs text-slate-500">
          {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
        </p>
      </PageHeader>

      {checkIn && (
        <ol className="grid grid-cols-3 gap-2 text-xs font-semibold">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className={`px-3 py-2 rounded-xl text-center ${
                index <= stepIndex
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      )}

      <Alert>{error}</Alert>

      {/* Not started yet */}
      {!checkIn && (
        <div className={`${cardClass} space-y-3`}>
          {eligibility.eligible ? (
            <>
              <p className="text-sm text-slate-600">
                Check in now to skip the front desk. You&apos;ll confirm your
                arrival details, verify your ID and get a digital room key.
              </p>
              <button type="button" onClick={() => submit(() => startCheckIn(reference))} disabled={busy} className={primaryButton}>
                Start check-in
              </button>
            </>
          ) : (
            <Alert type="info">
              {eligibility.reason}
              {eligibility.reason?.includes("opens") &&
                ` It opens on ${formatDateTime(eligibility.opensAt)}.`}
            </Alert>
          )}
        </div>
      )}

      {/* Step 1: arrival details */}
      {status === "initiated" && (
        <form onSubmit={handleDetailsSubmit} className={`${cardClass} space-y-4`}>
          <h2 className="font-bold text-slate-900">Your arrival details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="arrival-time" className={labelClass}>Estimated arrival time</label>
              <input id="arrival-time" name="estimatedArrivalTime" type="time" required value={details.estimatedArrivalTime} onChange={changeDetails} className={inputClass} />
            </div>
            <div>
              <label htmlFor="checkin-guests" className={labelClass}>Number of guests</label>
              <input id="checkin-guests" name="numberOfGuests" type="number" min="1" required value={details.numberOfGuests} onChange={changeDetails} className={inputClass} />
            </div>
            <div>
              <label htmlFor="checkin-purpose" className={labelClass}>Purpose of visit</label>
              <select id="checkin-purpose" name="purposeOfVisit" value={details.purposeOfVisit} onChange={changeDetails} className={inputClass}>
                <option value="leisure">Leisure</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="checkin-phone" className={labelClass}>Phone number</label>
              <input id="checkin-phone" name="phone" type="tel" value={details.phone} onChange={changeDetails} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="checkin-requests" className={labelClass}>Special requests (optional)</label>
            <textarea id="checkin-requests" name="specialRequests" rows="2" value={details.specialRequests} onChange={changeDetails} className={inputClass} />
          </div>
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? "Saving..." : "Save and continue"}
          </button>
        </form>
      )}

      {/* Step 2: identity verification */}
      {(status === "details_submitted" || status === "verification_failed") &&
        (checkIn.attemptsRemaining > 0 ? (
          <form onSubmit={handleIdentitySubmit} className={`${cardClass} space-y-4`}>
            <div>
              <h2 className="font-bold text-slate-900">Verify your identity</h2>
              <p className="text-xs text-slate-500 mt-1">
                The name must match your booking:{" "}
                <strong>
                  {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                </strong>
                . {checkIn.attemptsRemaining} attempt(s) left.
              </p>
            </div>

            {status === "verification_failed" && checkIn.verification?.failureReason && (
              <Alert>{checkIn.verification.failureReason}</Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="id-type" className={labelClass}>ID type</label>
                <select id="id-type" name="idType" value={identity.idType} onChange={changeIdentity} className={inputClass}>
                  {ID_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="id-number" className={labelClass}>ID number ({idHint})</label>
                <input id="id-number" name="idNumber" required value={identity.idNumber} onChange={changeIdentity} className={inputClass} />
              </div>
              <div>
                <label htmlFor="name-on-id" className={labelClass}>Name on ID</label>
                <input id="name-on-id" name="nameOnId" required value={identity.nameOnId} onChange={changeIdentity} className={inputClass} />
              </div>
              <div>
                <label htmlFor="nationality" className={labelClass}>Nationality (optional)</label>
                <input id="nationality" name="nationality" value={identity.nationality} onChange={changeIdentity} className={inputClass} />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              We only keep the last 4 characters of your ID number.
            </p>
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy ? "Verifying..." : "Verify and check in"}
            </button>
          </form>
        ) : (
          <Alert type="info">
            You have used all verification attempts. Please visit the front desk
            to complete check-in.
          </Alert>
        ))}

      {/* Done */}
      {status === "verified" && (
        <div className={`${cardClass} text-center space-y-3`}>
          <h2 className="text-xl font-bold text-slate-900">You&apos;re checked in</h2>
          <p className="text-sm text-slate-600">
            Your room is {booking.room?.roomNumber}. Generate your digital key to
            open the door.
          </p>
          <Link to={`/bookings/${reference}/key`} className={`${primaryButton} inline-block`}>
            Get my room key
          </Link>
        </div>
      )}
    </section>
  );
}
