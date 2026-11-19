const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
  {
    accessToken: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessToken' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    bookingReference: String,
    roomNumber: { type: String, required: true },
    result: { type: String, enum: ['granted', 'denied'], required: true },
    reason: { type: String, required: true },
    source: { type: String, default: 'simulated_lock' },
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, id: false, toJSON: { versionKey: false } },
);

accessLogSchema.index({ roomNumber: 1, createdAt: -1 });
accessLogSchema.index({ booking: 1, createdAt: -1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
