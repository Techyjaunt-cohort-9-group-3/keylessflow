const mongoose = require('mongoose');

const NOTIFICATION_TYPES = [
  'booking_created',
  'booking_confirmed',
  'payment_failed',
  'booking_reminder',
  'checkin_completed',
  'access_key_issued',
  'service_request_update',
  'general',
];

const notificationSchema = new mongoose.Schema(
  {
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'general' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    data: mongoose.Schema.Types.Mixed,
    channel: { type: String, default: 'in_app' },
    readAt: Date,
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

notificationSchema.index({ guest: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
