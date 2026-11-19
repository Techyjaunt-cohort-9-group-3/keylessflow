const mongoose = require('mongoose');

const ROOM_TYPES = ['standard', 'deluxe', 'executive', 'suite'];

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: [true, 'Room number is required'], unique: true, trim: true },
    name: { type: String, required: [true, 'Room name is required'], trim: true },
    type: { type: String, enum: ROOM_TYPES, required: [true, 'Room type is required'] },
    description: { type: String, trim: true, maxlength: 2000 },
    pricePerNight: { type: Number, required: [true, 'Price per night is required'], min: 0 },
    capacity: { type: Number, required: true, min: 1, default: 2 },
    bedType: { type: String, trim: true },
    floor: { type: Number },
    sizeSqm: { type: Number, min: 0 },
    amenities: [{ type: String, trim: true }],
    images: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

roomSchema.index({ type: 1, pricePerNight: 1 });

module.exports = mongoose.model('Room', roomSchema);
module.exports.ROOM_TYPES = ROOM_TYPES;
