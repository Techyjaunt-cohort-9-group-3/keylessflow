const mongoose = require('mongoose');

const CHECKIN_STATUSES = ['initiated', 'details_submitted', 'verified', 'verification_failed'];
const ID_TYPES = ['passport', 'national_id', 'drivers_license'];

const checkInSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    bookingReference: { type: String, required: true, index: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    status: { type: String, enum: CHECKIN_STATUSES, default: 'initiated' },
    details: {
      estimatedArrivalTime: String,
      phone: String,
      numberOfGuests: Number,
      purposeOfVisit: { type: String, enum: ['business', 'leisure', 'other'] },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
      },
      specialRequests: String,
      submittedAt: Date,
    },
    // The full ID number is never stored: only a keyed hash and the last 4 characters
    identity: {
      idType: { type: String, enum: ID_TYPES },
      idNumberLast4: String,
      idNumberHash: String,
      nameOnId: String,
      nationality: String,
    },
    verification: {
      method: { type: String, enum: ['simulated', 'manual'], default: 'simulated' },
      attempts: { type: Number, default: 0 },
      lastAttemptAt: Date,
      verifiedAt: Date,
      failureReason: String,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    },
    completedAt: Date,
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

module.exports = mongoose.model('CheckIn', checkInSchema);
module.exports.CHECKIN_STATUSES = CHECKIN_STATUSES;
module.exports.ID_TYPES = ID_TYPES;
