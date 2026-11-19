import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getErrorMessage } from "../api/client";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/services";
import { Alert, Loading, PageHeader, secondaryButton } from "../components/ui";
import { formatDateTime } from "../utils/format";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = () =>
    getNotifications()
      .then((result) => {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setError("");
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleOpen = async (notification) => {
    if (!notification.readAt) {
      // Not worth blocking the guest if this fails
      await markNotificationRead(notification._id).catch(() => {});
    }
    const bookingReference = notification.data?.bookingReference;
    if (bookingReference) navigate(`/bookings/${bookingReference}`);
    else loadNotifications();
  };

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <PageHeader eyebrow={`${unreadCount} unread`} title="Notifications">
        {unreadCount > 0 && (
          <button type="button" onClick={handleMarkAllRead} className={secondaryButton}>
            Mark all as read
          </button>
        )}
      </PageHeader>

      <Alert>{error}</Alert>
      {loading && <Loading />}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-10 bg-white rounded-2xl border border-slate-200">
          You have no notifications.
        </p>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <button
            key={notification._id}
            type="button"
            onClick={() => handleOpen(notification)}
            className={`w-full text-left p-4 rounded-2xl border transition-colors cursor-pointer ${
              notification.readAt
                ? "bg-white border-slate-200"
                : "bg-indigo-50/60 border-indigo-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900 text-sm">
                {!notification.readAt && (
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 mr-2 align-middle" />
                )}
                {notification.title}
              </p>
              <span className="text-xs text-slate-400 shrink-0">
                {formatDateTime(notification.createdAt)}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
