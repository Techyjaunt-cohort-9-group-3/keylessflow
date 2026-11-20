import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import {
  clearSession,
  getSavedUser,
  getToken,
  saveSession,
  saveUser,
} from "./api/client";
import { getMe } from "./api/services";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import StepOne from "./components/StepOne";
import StepThree from "./components/StepThree";
import StepTwo from "./components/StepTwo";
import BookingDetails from "./pages/BookingDetails";
import CheckIn from "./pages/CheckIn";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";
import Notifications from "./pages/Notifications";
import PaymentCallback from "./pages/PaymentCallback";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import RoomKey from "./pages/RoomKey";
import ServiceRequests from "./pages/ServiceRequests";
import StaffDashboard from "./pages/StaffDashboard";
import { dateFromToday } from "./utils/format";

const emptyGuestDetails = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  specialRequest: "",
};

// Fill empty guest fields with the logged-in account's details
const fillFromUser = (details, account) => ({
  ...details,
  firstName: details.firstName || account.firstName || "",
  lastName: details.lastName || account.lastName || "",
  email: details.email || account.email || "",
  phone: details.phone || account.phone || "",
});

// Sends logged-out visitors to /login (and back here afterwards).
// `allow` limits a page to "guest" or "staff" accounts.
function RequireAuth({ user, allow, children }) {
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  if (allow && user.type !== allow) {
    return <Navigate to={user.type === "staff" ? "/staff" : "/"} replace />;
  }
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState(getSavedUser);

  // Booking flow on the home page (steps 1-3)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [booking, setBooking] = useState(null);
  const [stayDetails, setStayDetails] = useState({
    checkInIso: dateFromToday(1),
    checkOutIso: dateFromToday(3),
    guests: 2,
  });
  const [guestDetails, setGuestDetails] = useState(emptyGuestDetails);

  // Start every page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Refresh the saved account on load, and log out if the token has expired
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then((me) => {
        const account = { ...me.user, type: me.type, role: me.role };
        saveUser(account);
        setUser(account);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          clearSession();
          setUser(null);
        }
      });
  }, []);

  const handleLoggedIn = (token, account) => {
    saveSession(token, account);
    setUser(account);
    setGuestDetails((prev) => fillFromUser(prev, account));
  };

  const handleUserUpdated = (account) => {
    saveUser(account);
    setUser(account);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setBooking(null);
    setCurrentStep(1);
    setGuestDetails(emptyGuestDetails);
    navigate("/");
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    if (user) setGuestDetails((prev) => fillFromUser(prev, user));
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookingCreated = (newBooking) => {
    setBooking(newBooking);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookingCancelled = () => {
    setBooking(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bookingFlow = (
    <>
      {currentStep === 1 && (
        <StepOne
          stayDetails={stayDetails}
          setStayDetails={setStayDetails}
          onSelectRoom={handleSelectRoom}
        />
      )}

      {currentStep === 2 && selectedRoom && (
        <StepTwo
          room={selectedRoom}
          user={user}
          stayDetails={stayDetails}
          guestDetails={guestDetails}
          setGuestDetails={setGuestDetails}
          onBack={() => setCurrentStep(1)}
          onRequireLogin={() => navigate("/login", { state: { from: "/" } })}
          onBookingCreated={handleBookingCreated}
        />
      )}

      {currentStep === 3 && booking && (
        <StepThree
          booking={booking}
          onBack={() => setCurrentStep(2)}
          onCancelled={handleBookingCancelled}
        />
      )}
    </>
  );

  return (
    <div
      id="top"
      className="keyless-app-shell min-h-screen flex flex-col bg-[#F8F9FB] text-slate-900 font-sans"
    >
      <Navbar user={user} currentStep={currentStep} onLogout={handleLogout} />

      <main
        id="booking-main-content"
        className="booking-main-container flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8"
      >
        <Routes>
          <Route path="/" element={bookingFlow} />
          <Route path="/login" element={<Login onLoggedIn={handleLoggedIn} />} />
          <Route
            path="/register"
            element={<Register onLoggedIn={handleLoggedIn} />}
          />

          {/* Paystack sends the guest here: /payment/callback?reference=KFP-... */}
          <Route
            path="/payment/callback"
            element={
              <RequireAuth user={user} allow="guest">
                <PaymentCallback />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth user={user} allow="guest">
                <MyBookings />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings/:reference"
            element={
              <RequireAuth user={user} allow="guest">
                <BookingDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/check-in/:reference"
            element={
              <RequireAuth user={user} allow="guest">
                <CheckIn />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings/:reference/key"
            element={
              <RequireAuth user={user} allow="guest">
                <RoomKey />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings/:reference/services"
            element={
              <RequireAuth user={user} allow="guest">
                <ServiceRequests />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth user={user} allow="guest">
                <Notifications />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth user={user}>
                <Profile user={user} onUserUpdated={handleUserUpdated} />
              </RequireAuth>
            }
          />
          <Route
            path="/staff"
            element={
              <RequireAuth user={user} allow="staff">
                <StaffDashboard user={user} />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
