const ServiceRequest = require('../models/serviceRequest.model');
const { SERVICE_CATEGORIES, PRIORITIES } = require('../models/serviceRequest.model');
const ApiError = require('../utils/ApiError');
const { requireFields, assertObjectId, parsePagination, paginationMeta } = require('../utils/validation');
const { createWithReference } = require('../utils/references');
const { findBookingForUser, normaliseReference } = require('../services/booking.service');
const { notify } = require('../services/notification.service');
const { isStaff } = require('../middlewares/auth');

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };
const ALLOWED_TRANSITIONS = {
  pending: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const CATEGORY_DETAILS = {
  housekeeping: 'Room cleaning, fresh towels, extra pillows or toiletries',
  room_service: 'Food and drinks delivered to your room',
  maintenance: 'Something in the room is broken or not working',
  general_assistance: 'Anything else: directions, bookings, luggage help',
};

async function findRequestForUser(reference, user) {
  const request = await ServiceRequest.findOne({ reference: normaliseReference(reference) });
  if (!request) throw ApiError.notFound('Service request not found');
  if (!isStaff(user) && String(request.guest) !== String(user.id)) throw ApiError.notFound('Service request not found');
  return request;
}

// GET /service-requests/categories
function listCategories(req, res) {
  res.json({
    success: true,
    data: Object.entries(SERVICE_CATEGORIES).map(([key, label]) => ({ key, label, description: CATEGORY_DETAILS[key] })),
  });
}

// POST /service-requests
async function createRequest(req, res) {
  requireFields(req.body, ['bookingReference', 'category', 'description']);
  if (!SERVICE_CATEGORIES[req.body.category]) {
    throw ApiError.badRequest(`category must be one of: ${Object.keys(SERVICE_CATEGORIES).join(', ')}`);
  }
  if (req.body.priority && !PRIORITIES.includes(req.body.priority)) {
    throw ApiError.badRequest(`priority must be one of: ${PRIORITIES.join(', ')}`);
  }

  const booking = await findBookingForUser(req.body.bookingReference, req.user);
  if (!['confirmed', 'checked_in'].includes(booking.status)) {
    throw ApiError.conflict('Service requests can only be made for confirmed or current stays');
  }

  let preferredTime;
  if (req.body.preferredTime) {
    preferredTime = new Date(req.body.preferredTime);
    if (Number.isNaN(preferredTime.getTime())) throw ApiError.badRequest('preferredTime must be an ISO date-time');
  }

  const request = await createWithReference(ServiceRequest, 'serviceRequest', {
    guest: booking.guest,
    booking: booking._id,
    bookingReference: booking.reference,
    roomNumber: booking.roomSnapshot.roomNumber,
    category: req.body.category,
    description: req.body.description,
    priority: req.body.priority,
    preferredTime,
    statusHistory: [{ status: 'pending', changedBy: req.user.id, changedByType: req.user.type, note: 'Request submitted' }],
  });

  await notify(booking.guest, {
    type: 'service_request_update',
    title: 'Request received',
    message: `We've received your ${SERVICE_CATEGORIES[request.category].toLowerCase()} request (${request.reference}).`,
    data: { serviceRequestReference: request.reference },
  });

  res.status(201).json({ success: true, message: `Request received. Your reference is ${request.reference}`, data: request });
}

// GET /service-requests?status=&category=&bookingReference=&roomNumber=
async function listRequests(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = isStaff(req.user) ? {} : { guest: req.user.id };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.bookingReference) filter.bookingReference = normaliseReference(req.query.bookingReference);
  if (isStaff(req.user) && req.query.roomNumber) filter.roomNumber = String(req.query.roomNumber);

  const [items, total] = await Promise.all([
    ServiceRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ServiceRequest.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: paginationMeta(page, limit, total) });
}

// GET /service-requests/:reference
async function getRequest(req, res) {
  const request = await findRequestForUser(req.params.reference, req.user);
  if (isStaff(req.user)) await request.populate('assignedTo', 'firstName lastName department');
  res.json({ success: true, data: request });
}

async function changeStatus(request, status, user, note) {
  if (!ALLOWED_TRANSITIONS[request.status].includes(status)) {
    throw ApiError.conflict(`Cannot change a ${STATUS_LABELS[request.status].toLowerCase()} request to ${status}`);
  }
  request.status = status;
  if (status === 'completed') request.completedAt = new Date();
  request.statusHistory.push({ status, note, changedBy: user.id, changedByType: user.type });
  await request.save();

  await notify(request.guest, {
    type: 'service_request_update',
    title: `Request ${STATUS_LABELS[status].toLowerCase()}`,
    message: `Your request ${request.reference} is now ${STATUS_LABELS[status].toLowerCase()}.${note ? ` ${note}` : ''}`,
    data: { serviceRequestReference: request.reference, status },
  });
  return request;
}

// PATCH /service-requests/:reference/status  (staff)  { status, note?, assignedTo? }
async function updateStatus(req, res) {
  requireFields(req.body, ['status']);
  if (!STATUS_LABELS[req.body.status]) {
    throw ApiError.badRequest(`status must be one of: ${Object.keys(STATUS_LABELS).join(', ')}`);
  }
  const request = await findRequestForUser(req.params.reference, req.user);

  if (req.body.assignedTo) {
    assertObjectId(req.body.assignedTo, 'assignedTo');
    request.assignedTo = req.body.assignedTo;
  } else if (req.body.status === 'in_progress' && !request.assignedTo) {
    request.assignedTo = req.user.id;
  }

  await changeStatus(request, req.body.status, req.user, req.body.note);
  res.json({ success: true, message: `Request marked as ${STATUS_LABELS[request.status].toLowerCase()}`, data: request });
}

// POST /service-requests/:reference/cancel  (guest, pending requests only)
async function cancelRequest(req, res) {
  const request = await findRequestForUser(req.params.reference, req.user);
  if (request.status !== 'pending') throw ApiError.conflict('Only pending requests can be cancelled');
  await changeStatus(request, 'cancelled', req.user, (req.body && req.body.reason) || 'Cancelled by guest');
  res.json({ success: true, message: 'Request cancelled', data: request });
}

module.exports = { listCategories, createRequest, listRequests, getRequest, updateStatus, cancelRequest };
