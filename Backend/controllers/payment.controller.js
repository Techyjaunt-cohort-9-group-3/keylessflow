const Payment = require('../models/payment.model');
const Booking = require('../models/booking.model');
const ApiError = require('../utils/ApiError');
const paystack = require('../services/paystack.service');
const { paystack: paystackConfig } = require('../config/env');
const { requireFields } = require('../utils/validation');
const { generateReference } = require('../utils/references');
const { notify } = require('../services/notification.service');
const { findBookingForUser, bookingSummary, markBookingPaid } = require('../services/booking.service');
const { isStaff } = require('../middlewares/auth');

const toKobo = (amount) => Math.round(amount * 100);

function paymentSummary(payment) {
  return {
    reference: payment.reference,
    bookingReference: payment.bookingReference,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    authorizationUrl: payment.status === 'pending' ? payment.authorizationUrl : undefined,
    accessCode: payment.status === 'pending' ? payment.accessCode : undefined,
    channel: payment.channel,
    gatewayResponse: payment.gatewayResponse,
    paidAt: payment.paidAt,
  };
}

// Applies a Paystack transaction (from verify or webhook) to our records.
// Safe to call more than once for the same transaction.
async function applyTransaction(payment, tx, via) {
  if (!tx || tx.reference !== payment.reference) throw ApiError.badRequest('Transaction does not match this payment');

  const base = { providerStatus: tx.status, gatewayResponse: tx.gateway_response, channel: tx.channel };

  if (tx.status === 'success') {
    const amountMatches = Number(tx.amount) === toKobo(payment.amount);
    const currencyMatches = String(tx.currency || '').toUpperCase() === payment.currency;
    if (!amountMatches || !currencyMatches) {
      await Payment.updateOne(
        { _id: payment._id, status: 'pending' },
        { $set: { ...base, status: 'failed', verifiedVia: via, gatewayResponse: 'Amount or currency mismatch' } },
      );
      return Payment.findById(payment._id);
    }

    const updated = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: 'success' } },
      {
        $set: {
          ...base,
          status: 'success',
          providerTransactionId: String(tx.id),
          paidAt: tx.paid_at || tx.paidAt || new Date(),
          verifiedVia: via,
        },
      },
      { returnDocument: 'after' },
    );
    if (!updated) return Payment.findById(payment._id); // already processed by the other path

    const booking = await markBookingPaid(updated.booking, updated._id);
    if (booking && booking.payment && String(booking.payment) !== String(updated._id)) {
      updated.requiresRefund = true;
      await updated.save();
    }
    return updated;
  }

  if (['failed', 'reversed'].includes(tx.status)) {
    const updated = await Payment.findOneAndUpdate(
      { _id: payment._id, status: 'pending' },
      { $set: { ...base, status: 'failed', verifiedVia: via } },
      { returnDocument: 'after' },
    );
    if (updated) {
      await Booking.updateOne({ _id: updated.booking, paymentStatus: 'unpaid' }, { $set: { paymentStatus: 'failed' } });
      await notify(updated.guest, {
        type: 'payment_failed',
        title: 'Payment was not successful',
        message: `Your payment for booking ${updated.bookingReference} failed. You can try again before your hold expires.`,
        data: { bookingReference: updated.bookingReference, paymentReference: updated.reference },
      });
    }
    return updated || Payment.findById(payment._id);
  }

  // abandoned, ongoing, pending...: the guest has not finished paying yet
  await Payment.updateOne({ _id: payment._id, status: 'pending' }, { $set: base });
  return Payment.findById(payment._id);
}

// POST /payments/initialize
async function initializePayment(req, res) {
  requireFields(req.body, ['bookingReference']);
  const booking = await findBookingForUser(req.body.bookingReference, req.user);

  if (booking.paymentStatus === 'paid') throw ApiError.conflict('This booking has already been paid');
  if (booking.status !== 'pending_payment') {
    throw ApiError.conflict(`This booking cannot be paid because it is ${booking.status.replace('_', ' ')}`);
  }
  if (!booking.holdExpiresAt || booking.holdExpiresAt <= new Date()) {
    booking.status = 'expired';
    await booking.save();
    throw ApiError.conflict('The hold on this room has expired. Please create a new booking');
  }

  const open = await Payment.findOne({ booking: booking._id, status: 'pending' });
  if (open) {
    return res.json({ success: true, reused: true, message: 'Continue your existing payment', data: paymentSummary(open) });
  }

  const reference = generateReference('payment');
  const tx = await paystack.initializeTransaction({
    email: booking.guestDetails.email,
    amountKobo: toKobo(booking.amount),
    currency: booking.currency,
    reference,
    callbackUrl: paystackConfig.callbackUrl,
    metadata: {
      bookingReference: booking.reference,
      bookingId: String(booking._id),
      guestId: String(booking.guest),
    },
  });

  let payment;
  try {
    payment = await Payment.create({
      reference,
      booking: booking._id,
      bookingReference: booking.reference,
      guest: booking.guest,
      amount: booking.amount,
      currency: booking.currency,
      authorizationUrl: tx.authorization_url,
      accessCode: tx.access_code,
    });
  } catch (err) {
    // A parallel request opened a payment first; hand that one back instead
    if (err.code !== 11000) throw err;
    const existing = await Payment.findOne({ booking: booking._id, status: 'pending' });
    if (!existing) throw err;
    return res.json({ success: true, reused: true, message: 'Continue your existing payment', data: paymentSummary(existing) });
  }

  res.status(201).json({ success: true, message: 'Redirect the guest to authorizationUrl to pay', data: paymentSummary(payment) });
}

async function findPaymentForUser(reference, user) {
  const payment = await Payment.findOne({ reference: String(reference).trim().toUpperCase() });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (!isStaff(user) && String(payment.guest) !== String(user.id)) throw ApiError.notFound('Payment not found');
  return payment;
}

// GET /payments/verify/:reference  (call after Paystack redirects back)
async function verifyPayment(req, res) {
  let payment = await findPaymentForUser(req.params.reference, req.user);

  if (payment.status === 'pending') {
    const tx = await paystack.verifyTransaction(payment.reference);
    payment = await applyTransaction(payment, tx, 'verify');
  }

  const booking = await Booking.findById(payment.booking);
  const messages = {
    success: 'Payment verified. Your booking is confirmed',
    failed: 'Payment was not successful',
    pending: 'Payment has not been completed yet',
  };
  res.json({
    success: true,
    message: payment.requiresRefund ? 'Payment received for a booking that was already paid. A refund is required' : messages[payment.status],
    data: { payment: paymentSummary(payment), booking: bookingSummary(booking) },
  });
}

// GET /payments/:reference
async function getPayment(req, res) {
  const payment = await findPaymentForUser(req.params.reference, req.user);
  res.json({ success: true, data: paymentSummary(payment) });
}

// POST /payments/webhook  (called by Paystack, authenticated by signature)
async function paystackWebhook(req, res) {
  if (!paystack.isValidWebhookSignature(req.rawBody, req.headers['x-paystack-signature'])) {
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  const event = req.body || {};
  if (event.event === 'charge.success' && event.data && event.data.reference) {
    const payment = await Payment.findOne({ reference: event.data.reference });
    if (payment) await applyTransaction(payment, event.data, 'webhook');
  }

  // Always acknowledge so Paystack stops retrying
  res.status(200).json({ received: true });
}

module.exports = { initializePayment, verifyPayment, getPayment, paystackWebhook };
