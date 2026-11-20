const Room = require('../models/room.model');
const ApiError = require('../utils/ApiError');
const { booking: bookingConfig } = require('../config/env');
const { parseStay } = require('../utils/dates');
const { assertObjectId, pick } = require('../utils/validation');
const { unavailableRoomIds } = require('../services/availability.service');

const ROOM_FIELDS = [
  'roomNumber',
  'name',
  'type',
  'description',
  'pricePerNight',
  'capacity',
  'bedType',
  'floor',
  'sizeSqm',
  'amenities',
  'images',
  'isActive',
];

function roomFilter(query) {
  const filter = { isActive: true };
  if (query.type) filter.type = String(query.type);
  if (query.guests) filter.capacity = { $gte: Math.max(parseInt(query.guests, 10) || 1, 1) };
  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.pricePerNight = {};
    if (Number.isFinite(minPrice)) filter.pricePerNight.$gte = minPrice;
    if (Number.isFinite(maxPrice)) filter.pricePerNight.$lte = maxPrice;
  }
  return filter;
}

// GET /rooms?type=deluxe&guests=2&minPrice=&maxPrice=&includeInactive=true
async function listRooms(req, res) {
  const filter = roomFilter(req.query);
  // Admins can also list hidden rooms so they can make them bookable again
  if (req.query.includeInactive === 'true' && req.user?.role === 'admin') delete filter.isActive;
  const rooms = await Room.find(filter).sort({ pricePerNight: 1, roomNumber: 1 });
  res.json({ success: true, data: rooms });
}

// GET /rooms/availability?checkInDate=YYYY-MM-DD&checkOutDate=YYYY-MM-DD&guests=2&type=&includeUnavailable=true
async function checkAvailability(req, res) {
  const { checkIn, checkOut, nights } = parseStay(req.query.checkInDate, req.query.checkOutDate, bookingConfig.maxNights);

  const [rooms, busyIds] = await Promise.all([
    Room.find(roomFilter(req.query)).sort({ pricePerNight: 1, roomNumber: 1 }),
    unavailableRoomIds(checkIn, checkOut),
  ]);
  const busy = new Set(busyIds.map(String));
  const includeUnavailable = req.query.includeUnavailable === 'true';

  const results = rooms
    .map((room) => ({
      ...room.toJSON(),
      isAvailable: !busy.has(String(room._id)),
      nights,
      totalPrice: room.pricePerNight * nights,
      currency: bookingConfig.currency,
    }))
    .filter((room) => includeUnavailable || room.isAvailable);

  res.json({
    success: true,
    data: results,
    meta: {
      checkInDate: req.query.checkInDate,
      checkOutDate: req.query.checkOutDate,
      nights,
      available: results.filter((r) => r.isAvailable).length,
    },
  });
}

// GET /rooms/:id?checkInDate=&checkOutDate=
async function getRoom(req, res) {
  assertObjectId(req.params.id, 'room id');
  const room = await Room.findById(req.params.id);
  if (!room || (!room.isActive && req.user?.type !== 'staff')) throw ApiError.notFound('Room not found');

  const data = { ...room.toJSON(), currency: bookingConfig.currency };
  if (req.query.checkInDate || req.query.checkOutDate) {
    const { checkIn, checkOut, nights } = parseStay(req.query.checkInDate, req.query.checkOutDate, bookingConfig.maxNights);
    const busyIds = await unavailableRoomIds(checkIn, checkOut);
    data.isAvailable = room.isActive && !busyIds.some((id) => String(id) === String(room._id));
    data.nights = nights;
    data.totalPrice = room.pricePerNight * nights;
  }

  res.json({ success: true, data });
}

// POST /rooms (admin)
async function createRoom(req, res) {
  const room = await Room.create(pick(req.body, ROOM_FIELDS));
  res.status(201).json({ success: true, data: room });
}

// PATCH /rooms/:id (admin)
async function updateRoom(req, res) {
  assertObjectId(req.params.id, 'room id');
  const room = await Room.findById(req.params.id);
  if (!room) throw ApiError.notFound('Room not found');
  room.set(pick(req.body, ROOM_FIELDS));
  await room.save();
  res.json({ success: true, data: room });
}

module.exports = { listRooms, checkAvailability, getRoom, createRoom, updateRoom };
