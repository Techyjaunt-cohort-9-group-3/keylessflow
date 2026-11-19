import { useRef, useState } from "react";
import calendarIcon from "../assets/calender-icon.png";
import guestIcon from "../assets/guest-icon.png";
import locationIcon from "../assets/location-icon.png";
import padlockIcon from "../assets/jam_padlock-f.png";

export default function StepOne({
  rooms,
  stayDetails,
  setStayDetails,
  onSelectRoom,
}) {
  const roomListSectionRef = useRef(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [alertedRoomIds, setAlertedRoomIds] = useState([]);

  const handleCheckAvailability = () => {
    roomListSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const updateGuests = (delta) => {
    setStayDetails((prev) => ({
      ...prev,
      guests: Math.max(1, Math.min(6, prev.guests + delta)),
    }));
  };

  const updateRoomsCount = (delta) => {
    setStayDetails((prev) => ({
      ...prev,
      roomsCount: Math.max(1, Math.min(4, prev.roomsCount + delta)),
    }));
  };

  const toggleAlertRoom = (roomId) => {
    setAlertedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
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
                  {stayDetails.checkIn}
                </span>
              </div>
            </div>

            <div className="date-divider border-r border-slate-200 h-8 mx-3 sm:mx-4" />

            <div className="text-right sm:text-left">
              <span className="field-caption text-xs text-slate-400 font-medium block">
                Check-out
              </span>
              <span className="field-value font-semibold text-slate-800 text-sm">
                {stayDetails.checkOut}
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
                  {stayDetails.guests} guests · {stayDetails.roomsCount}{" "}
                  {stayDetails.roomsCount === 1 ? "room" : "rooms"}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="guest-arrow-toggle-btn"
              onClick={() => setIsGuestMenuOpen((prev) => !prev)}
              aria-expanded={isGuestMenuOpen}
              aria-label="Toggle guest and stay quick options"
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

        {/* Expandable Date Picker Panel when Calendar Icon is Clicked */}
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
                value={stayDetails.checkInIso}
                onChange={(e) => {
                  const val = e.target.value;
                  setStayDetails((prev) => ({
                    ...prev,
                    checkInIso: val,
                    checkIn: val
                      ? new Date(val + "T00:00:00").toLocaleDateString(
                          "en-GB",
                          { weekday: "short", day: "numeric", month: "short" },
                        )
                      : prev.checkIn,
                  }));
                }}
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
                value={stayDetails.checkOutIso}
                onChange={(e) => {
                  const val = e.target.value;
                  setStayDetails((prev) => ({
                    ...prev,
                    checkOutIso: val,
                    checkOut: val
                      ? new Date(val + "T00:00:00").toLocaleDateString(
                          "en-GB",
                          { weekday: "short", day: "numeric", month: "short" },
                        )
                      : prev.checkOut,
                  }));
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <span className="text-xs font-semibold text-indigo-700 bg-white px-3 py-2 rounded-lg border border-indigo-100">
                {stayDetails.nights} nights
              </span>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(false)}
                className="bg-indigo-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Expandable Guest & Quick Stay Perks Panel when Arrow Icon is Clicked */}
        {isGuestMenuOpen && (
          <div
            id="guest-quick-panel"
            className="guest-quick-panel bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  Guests:
                </span>
                <button
                  type="button"
                  onClick={() => updateGuests(-1)}
                  className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="text-sm font-bold text-slate-900">
                  {stayDetails.guests}
                </span>
                <button
                  type="button"
                  onClick={() => updateGuests(1)}
                  className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  Rooms:
                </span>
                <button
                  type="button"
                  onClick={() => updateRoomsCount(-1)}
                  className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                >
                  -
                </button>
                <span className="text-sm font-bold text-slate-900">
                  {stayDetails.roomsCount}
                </span>
                <button
                  type="button"
                  onClick={() => updateRoomsCount(1)}
                  className="w-7 h-7 rounded-md bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                >
                  +
                </button>
              </div>

              <label className="flex items-center space-x-2 text-xs font-medium text-indigo-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stayDetails.mobileKeyEnabled}
                  onChange={(e) =>
                    setStayDetails((prev) => ({
                      ...prev,
                      mobileKeyEnabled: e.target.checked,
                    }))
                  }
                  className="rounded border-indigo-300 text-indigo-600"
                />
                <span>Enable instant digital room key</span>
              </label>
            </div>
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
              {rooms.filter((r) => !r.isSoldOut).length} room types available
              for your stay
            </p>
          </div>
          <span className="nights-pill text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            {stayDetails.nights} nights
          </span>
        </div>

        <div className="rooms-stack space-y-4">
          {rooms.map((room) => {
            const isAlertSet = alertedRoomIds.includes(room.id);

            return (
              <article
                key={room.id}
                id={`room-card-${room.id}`}
                className={`room-card bg-white p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  room.isSoldOut
                    ? "border-slate-200/80 opacity-90"
                    : "border-slate-200 hover:border-indigo-200 shadow-sm"
                }`}
              >
                <div className="room-card-details space-y-2">
                  <div className="room-title-row flex items-center flex-wrap gap-2.5">
                    <h3 className="room-name text-lg font-bold text-slate-900">
                      {room.name}
                    </h3>
                    <span
                      className={`room-status-badge text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        room.statusVariant === "available"
                          ? "bg-emerald-50 text-emerald-700"
                          : room.statusVariant === "few-left"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="room-amenities-row flex flex-wrap items-center text-xs text-slate-500 gap-y-1">
                    <span className="inline-flex items-center space-x-1">
                      <img
                        src={guestIcon}
                        alt="Capacity"
                        className="w-3.5 h-3.5 object-contain"
                      />
                      <span>{room.capacity}</span>
                    </span>
                    <span className="mx-2">•</span>
                    <span>{room.bed}</span>
                    <span className="mx-2">•</span>
                    <span>{room.view}</span>
                    {room.features.map((feat, idx) => (
                      <span key={idx} className="inline-flex items-center">
                        <span className="mx-2">•</span>
                        <span>{feat}</span>
                      </span>
                    ))}
                    <span className="mx-2">•</span>
                    <span>{room.size}</span>
                  </div>

                  <div className="room-rate-block pt-1">
                    <span className="rate-caption text-xs text-slate-400 block">
                      Nightly rate
                    </span>
                    <p className="rate-value text-xs font-semibold text-slate-700">
                      {room.rateLabel}
                    </p>
                    {room.isSoldOut && (
                      <p className="soldout-hint text-xs text-indigo-600 font-medium mt-0.5">
                        {isAlertSet
                          ? "Availability alert active for this room"
                          : "Get an availability alert"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="room-card-action w-full md:w-auto">
                  {room.isSoldOut ? (
                    <button
                      type="button"
                      onClick={() => toggleAlertRoom(room.id)}
                      className="notify-btn w-full md:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      {isAlertSet ? "Alert set ✓" : "Notify me"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectRoom(room)}
                      className="select-room-btn w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Select</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
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
