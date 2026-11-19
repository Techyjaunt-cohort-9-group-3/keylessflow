import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getErrorMessage } from "../api/client";
import {
  cancelServiceRequest,
  createServiceRequest,
  getServiceCategories,
  getServiceRequests,
} from "../api/services";
import {
  Alert,
  BackLink,
  Loading,
  PageHeader,
  StatusBadge,
  cardClass,
  inputClass,
  labelClass,
  primaryButton,
} from "../components/ui";
import { formatDateTime, statusLabel } from "../utils/format";

const emptyForm = {
  category: "housekeeping",
  priority: "normal",
  description: "",
  preferredTime: "",
};

export default function ServiceRequests() {
  const { reference } = useParams();
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRequests = () =>
    getServiceRequests({ bookingReference: reference })
      .then(setRequests)
      .catch((err) => setError(getErrorMessage(err)));

  useEffect(() => {
    getServiceCategories()
      .then(setCategories)
      .catch((err) => setError(getErrorMessage(err)));
    loadRequests().finally(() => setLoading(false));
  }, [reference]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const request = await createServiceRequest({
        bookingReference: reference,
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        preferredTime: form.preferredTime
          ? new Date(form.preferredTime).toISOString()
          : undefined,
      });
      setMessage(`Request received. Your reference is ${request.reference}.`);
      setForm(emptyForm);
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  };

  const handleCancel = async (requestReference) => {
    if (!window.confirm("Cancel this request?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await cancelServiceRequest(requestReference);
      await loadRequests();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setBusy(false);
  };

  const categoryLabel = (key) =>
    categories.find((category) => category.key === key)?.label || statusLabel(key);
  const selectedCategory = categories.find((c) => c.key === form.category);

  return (
    <section className="space-y-6">
      <BackLink to={`/bookings/${reference}`}>Booking {reference}</BackLink>

      <PageHeader eyebrow="Guest services" title="How can we help?" />

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
          <h2 className="font-bold text-slate-900">New request</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="request-category" className={labelClass}>Category</label>
              <select id="request-category" name="category" value={form.category} onChange={handleChange} className={inputClass}>
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="request-priority" className={labelClass}>Priority</label>
              <select id="request-priority" name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          {selectedCategory && (
            <p className="text-xs text-slate-400 -mt-2">{selectedCategory.description}</p>
          )}

          <div>
            <label htmlFor="request-description" className={labelClass}>What do you need?</label>
            <textarea id="request-description" name="description" rows="3" required maxLength={1000} placeholder="e.g. Two extra towels and a bottle of water" value={form.description} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="request-time" className={labelClass}>Preferred time (optional)</label>
            <input id="request-time" name="preferredTime" type="datetime-local" value={form.preferredTime} onChange={handleChange} className={inputClass} />
          </div>

          <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
            {busy ? "Sending..." : "Send request"}
          </button>
        </form>

        <div className={`${cardClass} space-y-3`}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Your requests</h2>
            <button type="button" onClick={loadRequests} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
              Refresh
            </button>
          </div>

          {loading && <Loading />}
          {!loading && requests.length === 0 && (
            <p className="text-sm text-slate-500">No requests yet.</p>
          )}

          <ul className="divide-y divide-slate-100">
            {requests.map((request) => {
              const latestNote = request.statusHistory?.at(-1)?.note;
              return (
                <li key={request._id} className="py-3 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 text-sm">
                      {categoryLabel(request.category)}
                    </p>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-slate-600">{request.description}</p>
                  <p className="text-xs text-slate-400">
                    {request.reference} · {formatDateTime(request.createdAt)}
                    {latestNote && ` · ${latestNote}`}
                  </p>
                  {request.status === "pending" && (
                    <button type="button" onClick={() => handleCancel(request.reference)} disabled={busy} className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer disabled:opacity-60">
                      Cancel request
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
