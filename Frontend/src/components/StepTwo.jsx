import { useState } from "react";
import { getErrorMessage } from "../api/client";
import { createBooking } from "../api/services";
import addIcon from "../assets/Add-icon.png";
import calendarIcon from "../assets/calender-icon.png";
import checkedIcon from "../assets/checked-icon.png";
import guestIcon from "../assets/guest-icon.png";
import locationIcon from "../assets/location-icon.png";
import padlockIcon from "../assets/jam_padlock-f.png";
import { formatDate, formatNaira, nightsBetween, plural } from "../utils/format";

const inputClass =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600";

export default function StepTwo({
  room,
  user,
  stayDetails,
  guestDetails,
  setGuestDetails,
  onBack,
  onRequireLogin,
  onBookingCreated,
}) {
  const [showSpecialRequest, setShowSpecialRequest] = useState(
    Boolean(guestDetails.specialRequest),
  );
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nights = nightsBetween(stayDetails.checkInIso, stayDetails.checkOutIso);
  // The API charges the nightly rate times the number of nights
  const totalAmount = room.pricePerNight * nights;

  const handleGuestFieldChange = (e) => {
    const { name, value } = e.target;
    setGuestDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    setError("");

    if (!user) {
      onRequireLogin();
      return;
    }
    if (user.type !== "guest") {
      setError("Staff accounts cannot make bookings. Log in with a guest account.");
      return;
    }

    const { firstName, lastName, phone, email, specialRequest } = guestDetails;
    if (![firstName, lastName, phone, email].every((value) => value.trim())) {
      setError("Please fill in your name, phone number and email.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Creates the booking and holds the room while the guest pays
      const booking = await createBooking({
        roomId: room._id,
        checkInDate: stayDetails.checkInIso,
        checkOutDate: stayDetails.checkOutIso,
        numberOfGuests: stayDetails.guests,
        guestDetails: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
        specialRequests: specialRequest.trim() || undefined,
      });
      onBookingCreated(booking);
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="step-two-review-booking"
      className="review-booking-page space-y-6"
    >
      {/* Header */}
      <div className="page-header-row flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow-label text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Your next check-in
          </p>
          <h1 className="page-main-title text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Review your booking
          </h1>
          <div className="property-location-row flex items-center space-x-1.5 text-sm text-slate-500 mt-1">
            <img
              src={locationIcon}
              alt="Location"
              className="w-4 h-4 object-contain"
            />
            <span>Marriott · Lagos</span>
          </div>
        </div>

        <span className="step-counter-pill text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
          02 / 03
        </span>
      </div>

      <div className="review-layout-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Selected Room + Guest Details Form */}
        <div className="review-main-column lg:col-span-2 space-y-6">
          {/* Selected Room Card */}
          <div
            id="selected-room-summary"
            className="selected-room-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="selected-room-title text-lg font-bold text-slate-900">
                  {room.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Room {room.roomNumber}
                  {room.bedType && ` · ${room.bedType} bed`}
                </p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="edit-stay-btn text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Edit stay
              </button>
            </div>

            <div className="stay-dates-summary bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingDates((prev) => !prev)}
                  title="Adjust dates"
                  aria-label="Toggle stay dates editor"
                  className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 cursor-pointer"
                >
                  <img
                    src={calendarIcon}
                    alt="Calendar"
                    className="w-4 h-4 object-contain"
                  />
                </button>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">
                    Check-in
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatDate(stayDetails.checkInIso, false)}
                  </span>
                </div>
              </div>

              <div className="border-r border-slate-200 h-8 mx-2" />

              <div>
                <span className="text-xs text-slate-400 font-medium block">
                  Check-out
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatDate(stayDetails.checkOutIso, false)}
                </span>
              </div>

              <span className="text-xs font-semibold bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg">
                {plural(nights, "night")}
              </span>
            </div>

            {isEditingDates && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-700 font-medium">
                  Want to switch room or dates?
                </span>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-indigo-600 font-semibold underline cursor-pointer"
                >
                  Return to room selection
                </button>
              </div>
            )}

            <div className="room-meta-strip flex flex-wrap items-center text-xs text-slate-500 gap-y-1">
              <span className="inline-flex items-center space-x-1">
                <img
                  src={guestIcon}
                  alt="Guests"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>{plural(stayDetails.guests, "guest")}</span>
              </span>
              {room.bedType && (
                <>
                  <span className="mx-2">•</span>
                  <span>{room.bedType} bed</span>
                </>
              )}
              {room.sizeSqm && (
                <>
                  <span className="mx-2">•</span>
                  <span>{room.sizeSqm} sqm</span>
                </>
              )}
            </div>
          </div>

          {/* Guest Details Form */}
          <div
            id="guest-details-form-card"
            className="guest-details-card bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Guest details
              </h2>
              <span className="text-xs text-slate-400">
                All fields required
              </span>
            </div>

            {!user && (
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl px-4 py-3 text-xs">
                Log in or sign up to book. We&apos;ll fill in your details for
                you.
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="guest-first-name"
                    className="text-xs font-medium text-slate-500 block mb-1"
                  >
                    First name
                  </label>
                  <input
                    id="guest-first-name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={guestDetails.firstName}
                    onChange={handleGuestFieldChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="guest-last-name"
                    className="text-xs font-medium text-slate-500 block mb-1"
                  >
                    Last name
                  </label>
                  <input
                    id="guest-last-name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last name"
                    value={guestDetails.lastName}
                    onChange={handleGuestFieldChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="guest-phone-number"
                  className="text-xs font-medium text-slate-500 block mb-1"
                >
                  Phone number
                </label>
                <input
                  id="guest-phone-number"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone number"
                  value={guestDetails.phone}
                  onChange={handleGuestFieldChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="guest-email-address"
                  className="text-xs font-medium text-slate-500 block mb-1"
                >
                  Email
                </label>
                <input
                  id="guest-email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={guestDetails.email}
                  onChange={handleGuestFieldChange}
                  className={inputClass}
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowSpecialRequest((prev) => !prev)}
                  className="add-request-btn text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <img
                    src={addIcon}
                    alt="Add"
                    className="w-3.5 h-3.5 object-contain"
                  />
                  <span>Add special requests (optional)</span>
                </button>

                {showSpecialRequest && (
                  <textarea
                    id="guest-special-requests"
                    name="specialRequest"
                    rows="2"
                    maxLength={1000}
                    placeholder="Late check-in, high floor, extra pillows..."
                    value={guestDetails.specialRequest}
                    onChange={handleGuestFieldChange}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Policy Banner */}
          <div className="cancellation-policy-banner bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2.5">
            <img
              src={checkedIcon}
              alt="Checked"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span>
              Free cancellation until you pay · No hidden booking or credit card
              fees
            </span>
          </div>
        </div>

        {/* Right Column: Hold Notice + Price Breakdown */}
        <aside className="review-sidebar space-y-4">
          <div
            id="room-hold-notice"
            className="hold-timer-card bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 font-medium"
          >
            We hold this room for you for 30 minutes once you continue to
            payment.
          </div>

          <div
            id="price-breakdown-card"
            className="price-breakdown-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="font-bold text-slate-900 text-base">
              Price breakdown
            </h2>

            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex justify-between pb-3 border-b border-slate-100">
                <span>
                  {formatNaira(room.pricePerNight)} × {plural(nights, "night")}
                </span>
                <span className="font-semibold text-slate-900">
                  {formatNaira(totalAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-slate-900 text-base">
                  Total
                </span>
                <span className="font-extrabold text-indigo-600 text-xl">
                  {formatNaira(totalAmount)}
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-xs"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              id="continue-to-payment-btn"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {isSubmitting
                  ? "Holding your room..."
                  : user
                    ? "Continue to payment"
                    : "Log in to continue"}
              </span>
              <span aria-hidden="true">→</span>
            </button>

            <div className="text-center pt-2 space-y-1">
              <div className="text-xs text-slate-500 flex items-center justify-center space-x-1.5">
                <img
                  src={padlockIcon}
                  alt="Secure"
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>Secure checkout with Paystack</span>
              </div>
              <p className="text-[11px] text-slate-400">
                You&apos;ll enter payment details in the next step
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
