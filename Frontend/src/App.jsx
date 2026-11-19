import { useState } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import StepOne from "./components/StepOne";
import StepThree from "./components/StepThree";
import StepTwo from "./components/StepTwo";
import { roomsData } from "./data/roomsData";

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(roomsData[1]);
  const [bookingTotal, setBookingTotal] = useState(170000);

  const [stayDetails, setStayDetails] = useState({
    checkIn: "Fri, 20 Nov",
    checkOut: "Sun, 22 Nov",
    checkInIso: "2026-11-20",
    checkOutIso: "2026-11-22",
    nights: 2,
    guests: 2,
    roomsCount: 1,
    mobileKeyEnabled: true,
  });

  const [guestDetails, setGuestDetails] = useState({
    fullName: "",
    phone: "",
    email: "",
    specialRequest: "",
  });

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinueToPayment = (computedTotal) => {
    setBookingTotal(computedTotal);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetBooking = () => {
    setCurrentStep(1);
    setGuestDetails({ fullName: "", phone: "", email: "", specialRequest: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      id="top"
      className="keyless-app-shell min-h-screen flex flex-col bg-[#F8F9FB] text-slate-900 font-sans"
    >
      <Navbar currentStep={currentStep} />

      <main
        id="booking-main-content"
        className="booking-main-container flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8"
      >
        {currentStep === 1 && (
          <StepOne
            rooms={roomsData}
            stayDetails={stayDetails}
            setStayDetails={setStayDetails}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {currentStep === 2 && (
          <StepTwo
            room={selectedRoom}
            stayDetails={stayDetails}
            setStayDetails={setStayDetails}
            guestDetails={guestDetails}
            setGuestDetails={setGuestDetails}
            onBack={() => setCurrentStep(1)}
            onContinue={handleContinueToPayment}
          />
        )}

        {currentStep === 3 && (
          <StepThree
            room={selectedRoom}
            stayDetails={stayDetails}
            totalAmount={bookingTotal}
            onBack={() => setCurrentStep(2)}
            onResetBooking={handleResetBooking}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
