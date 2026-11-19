import { useEffect, useState } from "react";
import addIcon from "../assets/Add-icon.png";
import calendarIcon from "../assets/calender-icon.png";
import checkedIcon from "../assets/checked-icon.png";
import feeIcon from "../assets/fee-icon.png";
import guestIcon from "../assets/guest-icon.png";
import locationIcon from "../assets/location-icon.png";
import padlockIcon from "../assets/jam_padlock-f.png";

export default function StepTwo({
  room,
  stayDetails,
  setStayDetails,
  guestDetails,
  setGuestDetails,
  onBack,
  onContinue,
}) {
  // 10:00 (600 seconds) countdown starts immediately when entering Step 2
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [showSpecialRequest, setShowSpecialRequest] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);

  useEffect(() => {
    setSecondsLeft(600);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const nights = stayDetails.nights || 2;
  const nightlyRate = room?.nightlyRate > 0 ? room.nightlyRate : 80000;
  const roomSubtotal = nightlyRate * nights;
  const taxesAndFees = 10000;
  const totalAmount = roomSubtotal + taxesAndFees;

  const handleGuestFieldChange = (e) => {
    const { name, value } = e.target;
    setGuestDetails((prev) => ({ ...prev, [name]: value }));
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
                  {room?.name || "Deluxe room"}
                </h2>
                <p className="text-xs text-slate-500">
                  {room?.view || "City view"} · {room?.bed || "King bed"}
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
                    {stayDetails.checkIn}
                  </span>
                </div>
              </div>

              <div className="border-r border-slate-200 h-8 mx-2" />

              <div>
                <span className="text-xs text-slate-400 font-medium block">
                  Check-out
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {stayDetails.checkOut}
                </span>
              </div>

              <span className="text-xs font-semibold bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg">
                {nights} nights
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
                <span>{stayDetails.guests} guests</span>
              </span>
              <span className="mx-2">•</span>
              <span>{room?.bed || "King bed"}</span>
              <span className="mx-2">•</span>
              <span>{room?.view || "City view"}</span>
            </div>
          </div>

          {/* Guest Details Form (Placeholders Only) */}
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

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="guest-full-name"
                  className="text-xs font-medium text-slate-500 block mb-1"
                >
                  Full name
                </label>
                <input
                  id="guest-full-name"
                  name="fullName"
                  type="text"
                  placeholder="Full name"
                  value={guestDetails.fullName}
                  onChange={handleGuestFieldChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                />
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
                  placeholder="Phone number"
                  value={guestDetails.phone}
                  onChange={handleGuestFieldChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
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
                  placeholder="Email"
                  value={guestDetails.email}
                  onChange={handleGuestFieldChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
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
                    placeholder="Late check-in, high floor, extra pillows..."
                    value={guestDetails.specialRequest}
                    onChange={handleGuestFieldChange}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Cancellation Policy Banner */}
          <div className="cancellation-policy-banner bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center space-x-2.5">
            <img
              src={checkedIcon}
              alt="Checked"
              className="w-4 h-4 object-contain shrink-0"
            />
            <span>
              Free cancellation before 18 Nov · No hidden booking or credit card
              fees
            </span>
          </div>
        </div>

        {/* Right Column: Live Hold Timer + Price Breakdown */}
        <aside className="review-sidebar space-y-4">
          <div
            id="room-hold-timer"
            className="hold-timer-card bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-900 font-medium"
          >
            <span>Room held for you</span>
            <span className="font-bold tabular-nums">
              {minutes}:{seconds} min left
            </span>
          </div>

          <div
            id="price-breakdown-card"
            className="price-breakdown-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h2 className="font-bold text-slate-900 text-base">
              Price breakdown
            </h2>

            <div className="space-y-2.5 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Room × {nights} nights</span>
                <span className="font-semibold text-slate-900">
                  ₦{roomSubtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="inline-flex items-center space-x-1.5">
                  <span>Taxes and fees</span>
                  <img
                    src={feeIcon}
                    alt="Fee info"
                    className="w-3.5 h-3.5 object-contain"
                  />
                </span>
                <span className="font-semibold text-slate-900">
                  ₦{taxesAndFees.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-slate-900 text-base">
                  Total
                </span>
                <span className="font-extrabold text-indigo-600 text-xl">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="continue-to-payment-btn"
              onClick={() => onContinue(totalAmount)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>Continue to payment</span>
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
