const mongoose = require('mongoose');

const SERVICE_CATEGORIES = {
  housekeeping: 'Housekeeping',
  room_service: 'Room service',
  maintenance: 'Maintenance',
  general_assistance: 'General assistance',
};
const REQUEST_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'normal', 'high'];

const statusChangeSchema = new mongoose.Schema(
  {
    status: { type: String, enum: REQUEST_STATUSES, required: true },
    note: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId },
    changedByType: { type: String, enum: ['guest', 'staff', 'system'] },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const serviceRequestSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookingReference: { type: String, required: true },
    roomNumber: String,
    category: { type: String, enum: Object.keys(SERVICE_CATEGORIES), required: [true, 'Category is required'] },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 1000 },
    priority: { type: String, enum: PRIORITIES, default: 'normal' },
    preferredTime: Date,
    status: { type: String, enum: REQUEST_STATUSES, default: 'pending' },
    statusHistory: [statusChangeSchema],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    completedAt: Date,
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

serviceRequestSchema.index({ guest: 1, createdAt: -1 });
serviceRequestSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
module.exports.REQUEST_STATUSES = REQUEST_STATUSES;
module.exports.PRIORITIES = PRIORITIES;
