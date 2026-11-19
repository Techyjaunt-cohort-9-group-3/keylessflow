import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../api/client";
import { getAvailableRooms } from "../api/services";
import calendarIcon from "../assets/calender-icon.png";
import guestIcon from "../assets/guest-icon.png";
import locationIcon from "../assets/location-icon.png";
import padlockIcon from "../assets/jam_padlock-f.png";
import {
  dateFromToday,
  formatDate,
  formatNaira,
  nightsBetween,
  plural,
} from "../utils/format";

export default function StepOne({ stayDetails, setStayDetails, onSelectRoom }) {
  const roomListSectionRef = useRef(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const nights = nightsBetween(stayDetails.checkInIso, stayDetails.checkOutIso);
  const availableCount = rooms.filter((room) => room.isAvailable).length;

  const loadRooms = async () => {
    if (nights < 1) {
      setError("Check-out must be at least one day after check-in.");
      setRooms([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await getAvailableRooms({
        checkInDate: stayDetails.checkInIso,
        checkOutDate: stayDetails.checkOutIso,
        guests: stayDetails.guests,
        includeUnavailable: true,
      });
      setRooms(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load rooms for the current dates when the page opens
  useEffect(() => {
    loadRooms();
  }, []);

  const handleCheckAvailability = () => {
    setIsDatePickerOpen(false);
    setIsGuestMenuOpen(false);
    roomListSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    loadRooms();
  };

  const updateDate = (field, value) => {
    setStayDetails((prev) => ({ ...prev, [field]: value }));
  };

  const updateGuests = (delta) => {
    setStayDetails((prev) => ({
      ...prev,
      guests: Math.max(1, Math.min(6, prev.guests + delta)),
    }));
  };

  return (
    <section
      id="step-one-room-selection"
      className="room-selection-page space-y-6"
    >
      {/* Page Title */}
      <div className="page-header-block">
        <p className="eyebrow-label text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Your next check-in
        </p>
        <h1 className="page-main-title text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Find your room
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

      {/* Search & Filter Card */}
      <div
        id="availability-search-card"
        className="search-filter-card bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div className="search-inputs-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Check-in & Check-out */}
          <div className="date-range-box bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between md:col-span-2">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                id="calendar-trigger-btn"
                onClick={() => setIsDatePickerOpen((prev) => !prev)}
                title="Select check-in and check-out dates"
                aria-label="Open calendar date selector"
                className="calendar-icon-btn p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 transition-colors cursor-pointer"
              >
                <img
                  src={calendarIcon}
                  alt="Calendar"
                  className="w-4 h-4 object-contain"
                />
              </button>
              <div>
                <span className="field-caption text-xs text-slate-400 font-medium block">
                  Check-in
                </span>
                <span className="field-value font-semibold text-slate-800 text-sm">
                  {formatDate(stayDetails.checkInIso, false)}
                </span>
              </div>
            </div>

            <div className="date-divider border-r border-slate-200 h-8 mx-3 sm:mx-4" />

            <div className="text-right sm:text-left">
              <span className="field-caption text-xs text-slate-400 font-medium block">
                Check-out
              </span>
              <span className="field-value font-semibold text-slate-800 text-sm">
                {formatDate(stayDetails.checkOutIso, false)}
              </span>
            </div>
          </div>

          {/* Guests & Arrow Trigger */}
          <div className="guests-selector-box bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={guestIcon}
                alt="Guests"
                className="w-5 h-5 object-contain"
              />
              <div>
                <span className="field-caption text-xs text-slate-400 font-medium block">
                  Guests
                </span>
                <span className="field-value font-semibold text-slate-800 text-sm">
                  {plural(stayDetails.guests, "guest")} · 1 room
                </span>
              </div>
            </div>

            <button
              type="button"
              id="guest-arrow-toggle-btn"
              onClick={() => setIsGuestMenuOpen((prev) => !prev)}
              aria-expanded={isGuestMenuOpen}
              aria-label="Change number of guests"
              className="guest-arrow-btn p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition-colors cursor-pointer"
            >
              <span
                className={`inline-block text-xs transition-transform ${isGuestMenuOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* Date picker, opened by the calendar icon */}
        {isDatePickerOpen && (
          <div
            id="date-picker-drawer"
            className="date-picker-drawer bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label
                htmlFor="checkin-date-input"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Check-in date
              </label>
              <input
                id="checkin-date-input"
                type="date"
                min={dateFromToday(0)}
                value={stayDetails.checkInIso}
                onChange={(e) => updateDate("checkInIso", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-date-input"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Check-out date
              </label>
              <input
                id="checkout-date-input"
                type="date"
                min={stayDetails.checkInIso}
                value={stayDetails.checkOutIso}
                onChange={(e) => updateDate("checkOutIso", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-xs font-semibold text-indigo-700 bg-white px-3 py-2 rounded-lg border border-indigo-100">
                {plural(Math.max(nights, 0), "night")}
              </span>
              <button
                type="button"
                onClick={handleCheckAvailability}
                className="bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Guest counter, opened by the arrow */}
        {isGuestMenuOpen && (
          <div
            id="guest-quick-panel"
            className="guest-quick-panel bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                Guests:
              </span>
              <button
                type="button"
                onClick={() => updateGuests(-1)}
                aria-label="Remove a guest"
                className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                -
              </button>
              <span className="text-sm font-bold text-slate-900">
                {stayDetails.guests}
              </span>
              <button
                type="button"
                onClick={() => updateGuests(1)}
                aria-label="Add a guest"
                className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                +
              </button>
            </div>

            <span className="text-xs font-medium text-indigo-700">
              Every booking includes a digital room key after online check-in
            </span>
          </div>
        )}

        {/* Check Availability CTA */}
        <button
          type="button"
          id="check-availability-btn"
          onClick={handleCheckAvailability}
          className="check-availability-btn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          Check availability
        </button>
      </div>

      {/* Rooms List Section */}
      <div
        ref={roomListSectionRef}
        id="choose-your-room-section"
        className="rooms-list-section space-y-4 scroll-mt-6"
      >
        <div className="rooms-section-header flex items-center justify-between">
          <div>
            <h2 className="section-heading text-lg sm:text-xl font-bold text-slate-900">
              Choose your room
            </h2>
            <p className="rooms-subtitle text-xs text-slate-500 mt-0.5">
              {isLoading
                ? "Checking availability..."
                : `${plural(availableCount, "room")} available for your stay`}
            </p>
          </div>
          <span className="nights-pill text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            {plural(Math.max(nights, 0), "night")}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm"
          >
            {error}
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-slate-500 text-center py-10">
            Loading rooms... the first request can take up to a minute while
            the server wakes up.
          </p>
        )}

        {!isLoading && !error && rooms.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">
            No rooms match your search. Try other dates or fewer guests.
          </p>
        )}

        {!isLoading && (
          <div className="rooms-stack space-y-4">
            {rooms.map((room) => {
              const features = [
                room.bedType && `${room.bedType} bed`,
                room.floor && `Floor ${room.floor}`,
                ...(room.amenities || []),
                room.sizeSqm && `${room.sizeSqm} sqm`,
              ].filter(Boolean);

              return (
                <article
                  key={room._id}
                  id={`room-card-${room.roomNumber}`}
                  className={`room-card bg-white p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    room.isAvailable
                      ? "border-slate-200 hover:border-indigo-200 shadow-sm"
                      : "border-slate-200/80 opacity-90"
                  }`}
                >
                  <div className="room-card-details space-y-2">
                    <div className="room-title-row flex items-center flex-wrap gap-2.5">
                      <h3 className="room-name text-lg font-bold text-slate-900">
                        {room.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        Room {room.roomNumber}
                      </span>
                      <span
                        className={`room-status-badge text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          room.isAvailable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {room.isAvailable ? "Available" : "Booked"}
                      </span>
                    </div>

                    <div className="room-amenities-row flex flex-wrap items-center text-xs text-slate-500 gap-y-1">
                      <span className="inline-flex items-center space-x-1">
                        <img
                          src={guestIcon}
                          alt="Capacity"
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span>Up to {plural(room.capacity, "guest")}</span>
                      </span>
                      {features.map((feature) => (
                        <span key={feature} className="inline-flex items-center">
                          <span className="mx-2">•</span>
                          <span>{feature}</span>
                        </span>
                      ))}
                    </div>

                    <div className="room-rate-block pt-1">
                      <span className="rate-caption text-xs text-slate-400 block">
                        Nightly rate
                      </span>
                      <p className="rate-value text-xs font-semibold text-slate-700">
                        {formatNaira(room.pricePerNight)} / night ·{" "}
                        {formatNaira(room.totalPrice)} for{" "}
                        {plural(room.nights, "night")}
                      </p>
                      {!room.isAvailable && (
                        <p className="soldout-hint text-xs text-slate-500 font-medium mt-0.5">
                          Not available for these dates
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="room-card-action w-full md:w-auto">
                    {room.isAvailable ? (
                      <button
                        type="button"
                        onClick={() => onSelectRoom(room)}
                        className="select-room-btn w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Select</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full md:w-auto bg-slate-100 text-slate-400 text-sm font-semibold px-5 py-2.5 rounded-xl cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="rate-assurance-note text-center pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center space-x-1.5">
        <img
          src={padlockIcon}
          alt="Secure rate"
          className="w-3.5 h-3.5 object-contain"
        />
        <span>Review your final rate before payment</span>
      </div>
    </section>
  );
}
