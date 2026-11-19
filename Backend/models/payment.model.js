const mongoose = require('mongoose');

const PAYMENT_RECORD_STATUSES = ['pending', 'success', 'failed'];

const paymentSchema = new mongoose.Schema(
  {
    // Our reference, sent to Paystack as the transaction reference
    reference: { type: String, required: true, unique: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookingReference: { type: String, required: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    provider: { type: String, default: 'paystack' },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: 'pending' },
    authorizationUrl: String,
    accessCode: String,
    providerTransactionId: String,
    providerStatus: String,
    channel: String,
    gatewayResponse: String,
    verifiedVia: { type: String, enum: ['verify', 'webhook'] },
    paidAt: Date,
    // Set when a second successful payment arrives for an already-paid booking
    requiresRefund: { type: Boolean, default: false },
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

paymentSchema.index({ booking: 1, createdAt: -1 });
// Only one open (pending) payment per booking
paymentSchema.index({ booking: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
// A Paystack transaction can only ever be recorded once
paymentSchema.index(
  { providerTransactionId: 1 },
  { unique: true, partialFilterExpression: { providerTransactionId: { $type: 'string' } } },
);

module.exports = mongoose.model('Payment', paymentSchema);
module.exports.PAYMENT_RECORD_STATUSES = PAYMENT_RECORD_STATUSES;
