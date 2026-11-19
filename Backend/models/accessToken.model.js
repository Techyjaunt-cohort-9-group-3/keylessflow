const mongoose = require('mongoose');

const ACCESS_TOKEN_STATUSES = ['active', 'revoked', 'expired'];

// The raw token is shown to the guest once; only its SHA-256 hash is stored
const accessTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, select: false },
    tokenHint: { type: String, required: true }, // last 4 characters, for support
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookingReference: { type: String, required: true, index: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    roomNumber: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ACCESS_TOKEN_STATUSES, default: 'active' },
    revokedAt: Date,
    revokedReason: String,
    lastUsedAt: Date,
    useCount: { type: Number, default: 0 },
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

module.exports = mongoose.model('AccessToken', accessTokenSchema);
module.exports.ACCESS_TOKEN_STATUSES = ACCESS_TOKEN_STATUSES;
