import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { createRoom, getAllRooms, updateRoom } from "../api/services";
import { formatNaira, statusLabel } from "../utils/format";
import {
  Alert,
  Loading,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
  secondaryButton,
} from "./ui";

const ROOM_TYPES = ["standard", "deluxe", "executive", "suite"];

const smallButton =
  "text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-60";

const emptyForm = {
  roomNumber: "",
  name: "",
  type: "standard",
  pricePerNight: "",
  capacity: "2",
  bedType: "",
  floor: "",
  sizeSqm: "",
  amenities: "",
  description: "",
};

// Room from the API -> form values (all strings)
function toForm(room) {
  return {
    roomNumber: room.roomNumber || "",
    name: room.name || "",
    type: room.type || "standard",
    pricePerNight: String(room.pricePerNight ?? ""),
    capacity: String(room.capacity ?? 2),
    bedType: room.bedType || "",
    floor: String(room.floor ?? ""),
    sizeSqm: String(room.sizeSqm ?? ""),
    amenities: (room.amenities || []).join(", "),
    description: room.description || "",
  };
}

// Form values -> request body. Empty optional numbers are sent as null to clear them.
function toBody(form) {
  return {
    roomNumber: form.roomNumber.trim(),
    name: form.name.trim(),
    type: form.type,
    pricePerNight: Number(form.pricePerNight),
    capacity: Number(form.capacity),
    bedType: form.bedType.trim(),
    floor: form.floor === "" ? null : Number(form.floor),
    sizeSqm: form.sizeSqm === "" ? null : Number(form.sizeSqm),
    amenities: form.amenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    description: form.description.trim(),
  };
}

// Used for both "Add room" and "Edit room"
function RoomForm({ initial, title, submitLabel, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(toBody(form));
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-4 border-indigo-200`}>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <Alert>{error}</Alert>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="room-number" className={labelClass}>Room number *</label>
          <input id="room-number" name="roomNumber" required placeholder="e.g. 305" value={form.roomNumber} onChange={handleChange} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="room-name" className={labelClass}>Name *</label>
          <input id="room-name" name="name" required placeholder="e.g. Deluxe King" value={form.name} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="room-type" className={labelClass}>Type *</label>
          <select id="room-type" name="type" value={form.type} onChange={handleChange} className={inputClass}>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>{statusLabel(type)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="room-price" className={labelClass}>Price per night (₦) *</label>
          <input id="room-price" name="pricePerNight" type="number" min="0" required value={form.pricePerNight} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="room-capacity" className={labelClass}>Max guests *</label>
          <input id="room-capacity" name="capacity" type="number" min="1" required value={form.capacity} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="room-bed" className={labelClass}>Bed type</label>
          <input id="room-bed" name="bedType" placeholder="e.g. King" value={form.bedType} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="room-floor" className={labelClass}>Floor</label>
          <input id="room-floor" name="floor" type="number" value={form.floor} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="room-size" className={labelClass}>Size (sqm)</label>
          <input id="room-size" name="sizeSqm" type="number" min="0" value={form.sizeSqm} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="room-amenities" className={labelClass}>Amenities (separate with commas)</label>
        <input id="room-amenities" name="amenities" placeholder="Wi-Fi, Smart TV, Mini bar" value={form.amenities} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label htmlFor="room-description" className={labelClass}>Description</label>
        <textarea id="room-description" name="description" rows="2" maxLength={2000} value={form.description} onChange={handleChange} className={inputClass} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? "Saving..." : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- Rooms (admin only): add, edit, hide and show rooms ----------
export default function RoomsPanel() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null); // null, "new" or a room _id
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    getAllRooms()
      .then(setRooms)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const startEditing = (id) => {
    setEditingId(id);
    setError("");
    setMessage("");
  };

  const handleCreate = async (body) => {
    const room = await createRoom(body);
    setEditingId(null);
    setMessage(`Room ${room.roomNumber} added. Guests can book it now.`);
    await load();
  };

  const handleUpdate = async (id, body) => {
    const room = await updateRoom(id, body);
    setEditingId(null);
    setMessage(`Room ${room.roomNumber} updated.`);
    await load();
  };

  const toggleActive = async (room) => {
    if (
      room.isActive &&
      !window.confirm(
        `Hide room ${room.roomNumber}? Guests won't be able to book it. Existing bookings are not affected.`,
      )
    ) {
      return;
    }
    setBusyId(room._id);
    setError("");
    setMessage("");
    try {
      await updateRoom(room._id, { isActive: !room.isActive });
      setMessage(
        room.isActive
          ? `Room ${room.roomNumber} is hidden from guests.`
          : `Room ${room.roomNumber} can be booked again.`,
      );
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusyId(null);
  };

  const hiddenCount = rooms.filter((room) => !room.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {rooms.length} room(s){hiddenCount > 0 && ` · ${hiddenCount} hidden`}
        </p>
        {editingId !== "new" && (
          <button type="button" onClick={() => startEditing("new")} className={primaryButton}>
            + Add room
          </button>
        )}
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {editingId === "new" && (
        <RoomForm
          initial={emptyForm}
          title="New room"
          submitLabel="Add room"
          onSave={handleCreate}
          onCancel={() => setEditingId(null)}
        />
      )}

      {loading && <Loading />}
      {!loading && rooms.length === 0 && <p className="text-sm text-slate-500">No rooms yet.</p>}

      {!loading &&
        rooms.map((room) =>
          editingId === room._id ? (
            <RoomForm
              key={room._id}
              initial={toForm(room)}
              title={`Edit room ${room.roomNumber}`}
              submitLabel="Save changes"
              onSave={(body) => handleUpdate(room._id, body)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={room._id}
              className={`${cardClass} flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                room.isActive ? "" : "opacity-70"
              }`}
            >
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 text-sm">
                  Room {room.roomNumber} · {room.name}{" "}
                  <span
                    className={`ml-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      room.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {room.isActive ? "Bookable" : "Hidden"}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {statusLabel(room.type)} · {formatNaira(room.pricePerNight)} / night · Up to{" "}
                  {room.capacity} guest(s)
                  {room.bedType && ` · ${room.bedType} bed`}
                  {room.floor != null && ` · Floor ${room.floor}`}
                </p>
                {room.amenities?.length > 0 && (
                  <p className="text-xs text-slate-400">{room.amenities.join(", ")}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => startEditing(room._id)} className={smallButton}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(room)}
                  disabled={busyId === room._id}
                  className={smallButton}
                >
                  {room.isActive ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ),
        )}
    </div>
  );
}
