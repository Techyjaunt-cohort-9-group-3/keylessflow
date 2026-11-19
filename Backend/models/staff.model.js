const mongoose = require('mongoose');
const { passwordPlugin } = require('../utils/password');

const STAFF_ROLES = ['admin', 'staff'];
const DEPARTMENTS = ['front_desk', 'housekeeping', 'room_service', 'maintenance', 'concierge', 'management'];

const staffSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid'],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: STAFF_ROLES, default: 'staff' },
    department: { type: String, enum: DEPARTMENTS, default: 'front_desk' },
    isActive: { type: Boolean, default: true },
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

staffSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

staffSchema.plugin(passwordPlugin);

module.exports = mongoose.model('Staff', staffSchema);
module.exports.STAFF_ROLES = STAFF_ROLES;
module.exports.DEPARTMENTS = DEPARTMENTS;
