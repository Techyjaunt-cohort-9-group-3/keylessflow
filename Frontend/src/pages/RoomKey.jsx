import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getErrorMessage } from "../api/client";
import {
  getAccessLogs,
  getBooking,
  getRoomKeys,
  issueRoomKey,
  revokeRoomKey,
  unlockDoor,
} from "../api/services";
import {
  Alert,
  BackLink,
  Loading,
  PageHeader,
  StatusBadge,
  cardClass,
  primaryButton,
  secondaryButton,
} from "../components/ui";
import { formatDateTime, statusLabel } from "../utils/format";

// The API shows the raw key only once, so we keep it on this device
const storageKey = (reference) => `kf_room_key_${reference}`;

export default function RoomKey() {
  const { reference } = useParams();
  const [booking, setBooking] = useState(null);
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [savedKey, setSavedKey] = useState(() =>
    localStorage.getItem(storageKey(reference)),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doorResult, setDoorResult] = useState(null); // { type, text }

  const loadAll = async () => {
    try {
      const [bookingData, keyList, logList] = await Promise.all([
        getBooking(reference),
        getRoomKeys(reference),
        getAccessLogs(reference),
      ]);
      setBooking(bookingData);
      setKeys(keyList);
      setLogs(logList);
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [reference]);

  const forgetKey = () => {
    localStorage.removeItem(storageKey(reference));
    setSavedKey(null);
  };

  const handleIssue = async () => {
    setBusy(true);
    setError("");
    setDoorResult(null);
    try {
      const key = await issueRoomKey(reference);
      localStorage.setItem(storageKey(reference), key.accessToken);
      setSavedKey(key.accessToken);
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  };

  // Sends the key to the simulated door lock
  const handleUnlock = async () => {
    setBusy(true);
    setDoorResult(null);
    try {
      const result = await unlockDoor(savedKey, booking.roomSnapshot.roomNumber);
      setDoorResult({ type: "success", text: `${result.message}. Welcome to room ${booking.roomSnapshot.roomNumber}!` });
    } catch (err) {
      setDoorResult({ type: "error", text: getErrorMessage(err) });
    }
    await loadAll();
    setBusy(false);
  };

  const handleRevoke = async (key) => {
    if (!window.confirm("Revoke this key? It will stop opening the door.")) return;
    setBusy(true);
    setError("");
    try {
      await revokeRoomKey(key._id);
      if (savedKey?.endsWith(key.tokenHint)) forgetKey();
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  };

  if (loading) return <Loading text="Loading your room key..." />;
  if (!booking) {
    return (
      <section className="space-y-4">
        <BackLink to="/bookings">My bookings</BackLink>
        <Alert>{error}</Alert>
      </section>
    );
  }

  const isCheckedIn = booking.status === "checked_in";
  const activeKey = keys.find((key) => key.status === "active");
  const keyOnThisDevice = activeKey && savedKey?.endsWith(activeKey.tokenHint);

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <BackLink to={`/bookings/${reference}`}>Booking {reference}</BackLink>

      <PageHeader eyebrow="Digital room key" title={`Room ${booking.roomSnapshot.roomNumber}`} />

      <Alert>{error}</Alert>

      {!isCheckedIn && (
        <Alert type="info">
          {booking.status === "confirmed"
            ? "Your room key is available after online check-in."
            : `Room keys are not available for a ${statusLabel(booking.status).toLowerCase()} booking.`}
        </Alert>
      )}
      {!isCheckedIn && booking.status === "confirmed" && (
        <Link to={`/check-in/${reference}`} className={`${primaryButton} inline-block`}>
          Check in online
        </Link>
      )}

      {isCheckedIn && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                {booking.roomSnapshot.name}
              </p>
              <p className="text-3xl font-black">Room {booking.roomSnapshot.roomNumber}</p>
            </div>
            {activeKey && <StatusBadge status="active" />}
          </div>

          {keyOnThisDevice ? (
            <>
              <p className="text-xs text-slate-300">
                Valid until {formatDateTime(activeKey.validUntil)} · Key ending{" "}
                {activeKey.tokenHint}
              </p>
              <button type="button" onClick={handleUnlock} disabled={busy} className="w-full bg-white text-slate-900 font-semibold py-3.5 rounded-xl hover:bg-slate-100 cursor-pointer disabled:opacity-60">
                {busy ? "Unlocking..." : "Tap to unlock door"}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-300">
              {activeKey
                ? "Your active key was issued on another device. Generate a new key to use it here."
                : "Generate your key to open your room door with this phone."}
            </p>
          )}

          <button type="button" onClick={handleIssue} disabled={busy} className="w-full border border-slate-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer disabled:opacity-60">
            {activeKey ? "Generate a new key" : "Generate room key"}
          </button>
        </div>
      )}

      {doorResult && <Alert type={doorResult.type}>{doorResult.text}</Alert>}

      {keys.length > 0 && (
        <div className={`${cardClass} space-y-3`}>
          <h2 className="font-bold text-slate-900">Your keys</h2>
          <ul className="divide-y divide-slate-100">
            {keys.map((key) => (
              <li key={key._id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">
                    Key ending {key.tokenHint} <StatusBadge status={key.status} />
                  </p>
                  <p className="text-xs text-slate-500">
                    Issued {formatDateTime(key.createdAt)} · Used {key.useCount} time(s)
                  </p>
                </div>
                {key.status === "active" && (
                  <button type="button" onClick={() => handleRevoke(key)} disabled={busy} className={secondaryButton}>
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {logs.length > 0 && (
        <div className={`${cardClass} space-y-3`}>
          <h2 className="font-bold text-slate-900">Door activity</h2>
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li key={log._id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">{formatDateTime(log.createdAt)}</span>
                <span className="text-slate-600">{statusLabel(log.reason)}</span>
                <StatusBadge status={log.result} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
