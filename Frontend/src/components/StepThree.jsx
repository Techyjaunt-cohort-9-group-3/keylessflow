import { useState } from "react";
import cancelIcon from "../assets/cancel-icon.png";
import protectIcon from "../assets/protect-icon.png";
import switchIcon from "../assets/switch-icon.png";

export default function StepThree({
  room,
  stayDetails,
  totalAmount,
  onBack,
  onResetBooking,
}) {
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const formattedTotal = `₦${(totalAmount || 160000).toLocaleString()}`;

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setPaymentSuccess(true);
  };

  if (paymentSuccess) {
    return (
      <section
        id="step-three-payment-success"
        className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4"
      >
        <h1 className="text-2xl font-bold text-slate-900">Booking Confirmed</h1>
        <p className="text-sm text-slate-600">
          Your reservation for <strong>{room?.name || "Deluxe room"}</strong> (
          {stayDetails.checkIn} – {stayDetails.checkOut}) has been received.
        </p>
        <p className="text-lg font-extrabold text-indigo-600">
          {formattedTotal} Paid
        </p>
        <button
          type="button"
          onClick={onResetBooking}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl cursor-pointer"
        >
          Start another booking
        </button>
      </section>
    );
  }

  return (
    <section
      id="step-three-payment"
      className="payment-page max-w-xl mx-auto space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow-label text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Your next check-in
          </p>
          <h1 className="page-main-title text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Payment
          </h1>
        </div>
        <span className="step-counter-pill text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
          03 / 03
        </span>
      </div>

      {/* Amount Due Summary */}
      <div
        id="amount-due-card"
        className="amount-due-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1"
      >
        <span className="text-xs font-medium text-slate-400">Amount due</span>
        <p className="text-3xl font-black text-slate-900">{formattedTotal}</p>
        <p className="text-xs text-slate-500 pt-1">
          {room?.name || "Deluxe room"}, {stayDetails.checkIn} -{" "}
          {stayDetails.checkOut}
        </p>
      </div>

      {/* Payment Options */}
      <div className="payment-options-group space-y-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Payment options
        </span>
        <div className="grid grid-cols-3 gap-2">
          {["Card", "Bank transfer", "USSD"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPaymentMethod(option)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                paymentMethod === option
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Form */}
      <form
        onSubmit={handlePaySubmit}
        className="payment-form-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        {paymentMethod === "Card" && (
          <>
            <h2 className="text-sm font-bold text-slate-800">
              Enter your card details to pay
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="card-number-input"
                  className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1"
                >
                  Card number
                </label>
                <input
                  id="card-number-input"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      cardNumber: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-indigo-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="card-expiry-input"
                    className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  >
                    Card expiry
                  </label>
                  <input
                    id="card-expiry-input"
                    type="text"
                    placeholder="MM / YY"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails((prev) => ({
                        ...prev,
                        expiry: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="card-cvv-input"
                    className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
                  >
                    CVV
                  </label>
                  <input
                    id="card-cvv-input"
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails((prev) => ({
                        ...prev,
                        cvv: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {paymentMethod === "Bank transfer" && (
          <div className="text-center py-6 text-slate-600 text-sm space-y-1">
            <p className="font-semibold text-slate-800">
              Paystack Virtual Account
            </p>
            <p className="text-xs text-slate-500">
              A temporary transfer account for {formattedTotal} will be
              generated when you click pay.
            </p>
          </div>
        )}

        {paymentMethod === "USSD" && (
          <div className="text-center py-6 text-slate-600 text-sm space-y-1">
            <p className="font-semibold text-slate-800">Authorize via USSD</p>
            <p className="text-xs text-slate-500">
              Dial your bank&apos;s USSD string to complete {formattedTotal}{" "}
              immediately.
            </p>
          </div>
        )}

        <button
          type="submit"
          id="pay-now-btn"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
        >
          Pay {formattedTotal}
        </button>
      </form>

      {/* Secondary Actions */}
      <div className="payment-secondary-actions text-center space-y-2.5 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() =>
              setPaymentMethod((prev) =>
                prev === "Card"
                  ? "Bank transfer"
                  : prev === "Bank transfer"
                    ? "USSD"
                    : "Card",
              )
            }
            className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <img
              src={switchIcon}
              alt="Switch method"
              className="w-3.5 h-3.5 object-contain"
            />
            <span>Change Payment Method</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <img
              src={cancelIcon}
              alt="Cancel payment"
              className="w-3.5 h-3.5 object-contain"
            />
            <span>Cancel Payment</span>
          </button>
        </div>
      </div>

      <div className="text-center pt-2 text-xs text-slate-500 flex items-center justify-center space-x-1.5">
        <img
          src={protectIcon}
          alt="Secured by Paystack"
          className="w-4 h-4 object-contain"
        />
        <span>
          Secured by <strong className="text-slate-800">paystack</strong>
        </span>
      </div>
    </section>
  );
}
