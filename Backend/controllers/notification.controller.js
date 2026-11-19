const Notification = require('../models/notification.model');
const ApiError = require('../utils/ApiError');
const { assertObjectId, parsePagination, paginationMeta } = require('../utils/validation');

// GET /notifications?unread=true
async function listNotifications(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { guest: req.user.id };
  if (req.query.unread === 'true') filter.readAt = { $exists: false };

  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ guest: req.user.id, readAt: { $exists: false } }),
  ]);
  res.json({ success: true, data: items, unreadCount: unread, pagination: paginationMeta(page, limit, total) });
}

// PATCH /notifications/:id/read
async function markRead(req, res) {
  assertObjectId(req.params.id);
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, guest: req.user.id },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.json({ success: true, data: notification });
}

// PATCH /notifications/read-all
async function markAllRead(req, res) {
  const result = await Notification.updateMany(
    { guest: req.user.id, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
  res.json({ success: true, data: { updated: result.modifiedCount } });
}

module.exports = { listNotifications, markRead, markAllRead };
