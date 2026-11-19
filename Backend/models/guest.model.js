const mongoose = require('mongoose');
const { passwordPlugin } = require('../utils/password');

// Identity documents are captured per stay in the check-in record, not on the profile
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
    password: { type: String, required: [true, 'Password is required'], select: false },
    nationality: { type: String, trim: true },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    preferences: [{ type: String, trim: true }],
    notes: { type: String, trim: true, maxlength: 1000 },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  },
);

guestSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

guestSchema.index({ lastName: 1, firstName: 1 });
guestSchema.plugin(passwordPlugin);

module.exports = mongoose.model('Guest', guestSchema);
