const Recommendation = require('../models/recommendation.model');
const ApiError = require('../utils/ApiError');
const { assertObjectId, pick } = require('../utils/validation');
const { stayIncludesWeekend } = require('../utils/dates');
const { findBookingForUser } = require('../services/booking.service');
const { isStaff } = require('../middlewares/auth');

const FIELDS = ['title', 'description', 'category', 'price', 'imageUrl', 'rules', 'priority', 'isActive'];

function stayContext(booking) {
  return {
    roomType: booking.roomSnapshot.type,
    nights: booking.nights,
    weekend: stayIncludesWeekend(booking.checkInDate, booking.checkOutDate),
    stage: booking.status === 'checked_in' ? 'in_stay' : 'pre_arrival',
  };
}

// Rule-based matching: returns null when a recommendation does not apply,
// otherwise the reasons it was picked
function match(rec, ctx) {
  const rules = rec.rules || {};
  const reasons = [];
  if (rules.roomTypes && rules.roomTypes.length) {
    if (!rules.roomTypes.includes(ctx.roomType)) return null;
    reasons.push(`Picked for ${ctx.roomType} guests`);
  }
  if (rules.minNights) {
    if (ctx.nights < rules.minNights) return null;
    reasons.push(`Great for stays of ${rules.minNights}+ nights`);
  }
  if (rules.weekendOnly) {
    if (!ctx.weekend) return null;
    reasons.push('Your stay includes a weekend');
  }
  if (rules.stage && rules.stage !== 'any') {
    if (rules.stage !== ctx.stage) return null;
    reasons.push(ctx.stage === 'in_stay' ? 'Available during your stay' : 'Plan this before you arrive');
  }
  return reasons;
}

// GET /recommendations?bookingReference=&category=
async function listRecommendations(req, res) {
  const filter = {};
  if (!(isStaff(req.user) && req.query.includeInactive === 'true')) filter.isActive = true;
  if (req.query.category) filter.category = String(req.query.category);
  const recs = await Recommendation.find(filter).sort({ priority: -1, createdAt: -1 });

  if (!req.query.bookingReference) {
    return res.json({ success: true, data: recs });
  }

  if (!req.user) throw ApiError.unauthorized('Log in to get recommendations for your booking');
  const booking = await findBookingForUser(req.query.bookingReference, req.user);
  const ctx = stayContext(booking);

  const personalised = recs
    .map((rec) => ({ rec, reasons: match(rec, ctx) }))
    .filter((x) => x.reasons)
    .sort((a, b) => b.reasons.length - a.reasons.length || (b.rec.priority || 0) - (a.rec.priority || 0))
    .map(({ rec, reasons }) => ({ ...rec.toJSON(), reasons }));

  res.json({ success: true, data: personalised, meta: { context: ctx } });
}

// POST /recommendations (admin)
async function createRecommendation(req, res) {
  const rec = await Recommendation.create(pick(req.body, FIELDS));
  res.status(201).json({ success: true, data: rec });
}

// PATCH /recommendations/:id (admin)
async function updateRecommendation(req, res) {
  assertObjectId(req.params.id);
  const rec = await Recommendation.findById(req.params.id);
  if (!rec) throw ApiError.notFound('Recommendation not found');
  rec.set(pick(req.body, FIELDS));
  await rec.save();
  res.json({ success: true, data: rec });
}

// DELETE /recommendations/:id (admin)
async function deleteRecommendation(req, res) {
  assertObjectId(req.params.id);
  const rec = await Recommendation.findByIdAndDelete(req.params.id);
  if (!rec) throw ApiError.notFound('Recommendation not found');
  res.status(204).end();
}

module.exports = { listRecommendations, createRecommendation, updateRecommendation, deleteRecommendation };
