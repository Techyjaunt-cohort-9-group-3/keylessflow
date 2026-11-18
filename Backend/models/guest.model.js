const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid'],
    },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    nationality: { type: String, trim: true },
    idType: {
      
      type: String,
      enum: ['passport', 'national_id', 'drivers_license', 'other'],
    },
    idNumber: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

guestSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

guestSchema.index({ lastName: 1, firstName: 1 });

module.exports = mongoose.model('Guest', guestSchema);
