import api from "./client";

// Successful responses look like { success: true, data, message? }
const unwrap = (res) => res.data.data;

// ---------- Auth and profile ----------
export const register = (body) => api.post("/auth/register", body).then(unwrap);
export const login = (body) => api.post("/auth/login", body).then(unwrap);
export const staffLogin = (body) =>
  api.post("/auth/staff/login", body).then(unwrap);
export const getMe = () => api.get("/auth/me").then(unwrap);
export const updateMe = (body) => api.patch("/auth/me", body).then(unwrap);
export const changePassword = (body) =>
  api.post("/auth/change-password", body).then((res) => res.data);

// ---------- Rooms ----------
// params: { checkInDate, checkOutDate, guests, includeUnavailable }
export const getAvailableRooms = (params) =>
  api.get("/rooms/availability", { params }).then(unwrap);

// Admin: every room, including hidden ones
export const getAllRooms = () =>
  api.get("/rooms", { params: { includeInactive: true } }).then(unwrap);
export const createRoom = (body) => api.post("/rooms", body).then(unwrap);
export const updateRoom = (id, body) =>
  api.patch(`/rooms/${id}`, body).then(unwrap);

// ---------- Bookings ----------
export const createBooking = (body) => api.post("/bookings", body).then(unwrap);
export const getBookings = (params) =>
  api.get("/bookings", { params }).then(unwrap);
export const getBooking = (reference) =>
  api.get(`/bookings/${reference}`).then(unwrap);
export const cancelBooking = (reference) =>
  api.post(`/bookings/${reference}/cancel`).then(unwrap);
export const checkOutBooking = (reference) =>
  api.post(`/bookings/${reference}/check-out`).then(unwrap);

// ---------- Payments (Paystack) ----------
export const initializePayment = (bookingReference) =>
  api.post("/payments/initialize", { bookingReference }).then(unwrap);
// Returns { message, data: { payment, booking } }
export const verifyPayment = (paymentReference) =>
  api.get(`/payments/verify/${paymentReference}`).then((res) => res.data);

// ---------- Check-in ----------
export const getCheckIn = (reference) =>
  api.get(`/check-in/${reference}`).then(unwrap);
export const startCheckIn = (bookingReference) =>
  api.post("/check-in", { bookingReference }).then(unwrap);
export const submitCheckInDetails = (reference, body) =>
  api.patch(`/check-in/${reference}/details`, body).then(unwrap);
export const verifyIdentity = (reference, body) =>
  api.post(`/check-in/${reference}/verify-identity`, body).then(unwrap);
export const getCheckIns = (params) =>
  api.get("/check-in", { params }).then(unwrap);
export const recordVerification = (reference, body) =>
  api.post(`/check-in/${reference}/verification`, body).then(unwrap);

// ---------- Digital room keys ----------
export const issueRoomKey = (bookingReference) =>
  api.post("/access/tokens", { bookingReference }).then(unwrap);
export const getRoomKeys = (bookingReference) =>
  api.get("/access/tokens", { params: { bookingReference } }).then(unwrap);
export const revokeRoomKey = (tokenId) =>
  api.post(`/access/tokens/${tokenId}/revoke`).then(unwrap);
export const getAccessLogs = (bookingReference) =>
  api.get("/access/logs", { params: { bookingReference } }).then(unwrap);
// The simulated door lock
export const unlockDoor = (token, roomNumber) =>
  api.post("/lock/validate", { token, roomNumber }).then((res) => res.data);

// ---------- Service requests ----------
export const getServiceCategories = () =>
  api.get("/service-requests/categories").then(unwrap);
export const createServiceRequest = (body) =>
  api.post("/service-requests", body).then(unwrap);
export const getServiceRequests = (params) =>
  api.get("/service-requests", { params }).then(unwrap);
export const cancelServiceRequest = (reference) =>
  api.post(`/service-requests/${reference}/cancel`).then(unwrap);
export const updateServiceRequestStatus = (reference, status) =>
  api.patch(`/service-requests/${reference}/status`, { status }).then(unwrap);

// ---------- Recommendations ----------
export const getRecommendations = (bookingReference) =>
  api.get("/recommendations", { params: { bookingReference } }).then(unwrap);

// ---------- Notifications ----------
// Returns { data, unreadCount }
export const getNotifications = () =>
  api.get("/notifications").then((res) => res.data);
export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`).then(unwrap);
export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all").then(unwrap);
