const Notification = require('../models/notification.model');
const { nodeEnv } = require('../config/env');

// MVP: in-app notifications only. Email/SMS/push can be added here later
// without touching the controllers that call notify().
async function notify(guestId, { type = 'general', title, message, link, data }) {
  try {
    const notification = await Notification.create({ guest: guestId, type, title, message, link, data });
    if (nodeEnv === 'development') console.log(`[notify] ${type} -> guest ${guestId}: ${title}`);
    return notification;
  } catch (err) {
    // A failed notification must never break the main flow
    console.error(`Failed to create notification: ${err.message}`);
    return null;
  }
}

module.exports = { notify };
