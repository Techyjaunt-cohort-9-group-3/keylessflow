const mongoose = require('mongoose');
const { ROOM_TYPES } = require('./room.model');

const RECOMMENDATION_CATEGORIES = ['dining', 'spa_wellness', 'tours', 'transport', 'amenities', 'events'];
const STAY_STAGES = ['any', 'pre_arrival', 'in_stay'];

const recommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    category: { type: String, enum: RECOMMENDATION_CATEGORIES, required: true },
    price: { type: Number, min: 0 },
    imageUrl: String,
    // Simple rule-based targeting (PRD 6.3.C MVP approach)
    rules: {
      roomTypes: [{ type: String, enum: ROOM_TYPES }],
      minNights: { type: Number, min: 0, default: 0 },
      weekendOnly: { type: Boolean, default: false },
      stage: { type: String, enum: STAY_STAGES, default: 'any' },
    },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, id: false, toJSON: { versionKey: false } },
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
module.exports.RECOMMENDATION_CATEGORIES = RECOMMENDATION_CATEGORIES;
module.exports.STAY_STAGES = STAY_STAGES;
