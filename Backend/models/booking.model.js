const mongoose = require('mongoose');

// Booking status and payment status are tracked separately (PRD 6.1.C)
const BOOKING_STATUSES = ['pending_payment', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refund_required'];

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    roomSnapshot: {
      roomNumber: String,
      name: String,
      type: { type: String },
      pricePerNight: Number,
    },
    guestDetails: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    numberOfGuests: { type: Number, required: true, min: 1 },
    specialRequests: { type: String, trim: true, maxlength: 1000 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending_payment' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    holdExpiresAt: Date,
    confirmedAt: Date,
    checkedInAt: Date,
    checkedOutAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    nudgeSentAt: Date,
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1, status: 1 });
bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
