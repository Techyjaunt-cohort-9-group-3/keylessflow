import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://keylessflow.onrender.com/api/v1";

const TOKEN_KEY = "kf_token";
const USER_KEY = "kf_user";

const api = axios.create({
  baseURL: API_URL,
  // The API runs on Render's free tier, which can take up to a minute to wake up
  timeout: 60000,
});

// Send the saved login token with every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// The logged-in account: { type: "guest" | "staff", role, firstName, ... }
export function getSavedUser() {
  if (!getToken()) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  saveUser(user);
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Turns an axios error into a message we can show on screen.
// API errors look like { success: false, message, details? }
export function getErrorMessage(error) {
  const data = error.response?.data;
  if (Array.isArray(data?.details) && data.details.length) {
    return data.details.map((detail) => detail.message).join(". ");
  }
  if (data?.message) return data.message;
  if (error.code === "ECONNABORTED") {
    return "The server is taking too long to respond. Please try again.";
  }
  if (error.request && !error.response) {
    return "Could not reach the server. Check your connection and try again.";
  }
  return error.message || "Something went wrong. Please try again.";
}
