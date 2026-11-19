/* eslint-disable no-console */
// Loads sample hotel data: rooms, recommendations, and admin/staff accounts.
// Safe to run more than once: records are matched and updated, not duplicated.
const { nodeEnv } = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const Room = require('../models/room.model');
const Recommendation = require('../models/recommendation.model');
const Staff = require('../models/staff.model');

const ROOMS = [
  { roomNumber: '101', name: 'Standard Queen', type: 'standard', pricePerNight: 45000, capacity: 2, bedType: 'Queen', floor: 1, sizeSqm: 22, amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Work desk'] },
  { roomNumber: '102', name: 'Standard Twin', type: 'standard', pricePerNight: 45000, capacity: 2, bedType: 'Twin', floor: 1, sizeSqm: 22, amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV'] },
  { roomNumber: '103', name: 'Standard Queen', type: 'standard', pricePerNight: 48000, capacity: 2, bedType: 'Queen', floor: 1, sizeSqm: 24, amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'City view'] },
  { roomNumber: '201', name: 'Deluxe King', type: 'deluxe', pricePerNight: 75000, capacity: 2, bedType: 'King', floor: 2, sizeSqm: 30, amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Mini bar', 'Rain shower'] },
  { roomNumber: '202', name: 'Deluxe Family', type: 'deluxe', pricePerNight: 85000, capacity: 4, bedType: 'King + Sofa bed', floor: 2, sizeSqm: 36, amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Mini bar', 'Bathtub'] },
  { roomNumber: '203', name: 'Deluxe King', type: 'deluxe', pricePerNight: 75000, capacity: 2, bedType: 'King', floor: 2, sizeSqm: 30, amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Mini bar', 'Balcony'] },
  { roomNumber: '301', name: 'Executive King', type: 'executive', pricePerNight: 110000, capacity: 2, bedType: 'King', floor: 3, sizeSqm: 40, amenities: ['Wi-Fi', 'Lounge access', 'Smart TV', 'Mini bar', 'Espresso machine', 'Work desk'] },
  { roomNumber: '302', name: 'Executive Twin', type: 'executive', pricePerNight: 110000, capacity: 3, bedType: 'Twin + Single', floor: 3, sizeSqm: 42, amenities: ['Wi-Fi', 'Lounge access', 'Smart TV', 'Mini bar', 'Espresso machine'] },
  { roomNumber: '401', name: 'Junior Suite', type: 'suite', pricePerNight: 180000, capacity: 3, bedType: 'King', floor: 4, sizeSqm: 55, amenities: ['Wi-Fi', 'Living area', 'Lounge access', 'Bathtub', 'Butler service'] },
  { roomNumber: '402', name: 'Presidential Suite', type: 'suite', pricePerNight: 350000, capacity: 4, bedType: 'King + Queen', floor: 4, sizeSqm: 90, amenities: ['Wi-Fi', 'Living and dining area', 'Private terrace', 'Jacuzzi', 'Butler service'] },
].map((room) => ({ ...room, description: `${room.name} on floor ${room.floor}, ${room.sizeSqm} m², sleeps ${room.capacity}.` }));

const RECOMMENDATIONS = [
  { title: 'Airport pickup', description: 'Private transfer from the airport straight to the hotel.', category: 'transport', price: 25000, rules: { stage: 'pre_arrival' }, priority: 10 },
  { title: 'Breakfast buffet', description: 'Continental and local breakfast, 6:30am to 10:30am.', category: 'dining', price: 12000, rules: { stage: 'any' }, priority: 8 },
  { title: 'Rooftop dinner for two', description: 'Three-course dinner with a view of the city skyline.', category: 'dining', price: 60000, rules: { roomTypes: ['deluxe', 'executive', 'suite'] }, priority: 6 },
  { title: 'Spa day package', description: '60-minute massage, sauna and pool access.', category: 'spa_wellness', price: 45000, rules: { minNights: 2 }, priority: 7 },
  { title: 'Weekend city tour', description: 'Half-day guided tour of the city\'s markets, art and beaches.', category: 'tours', price: 30000, rules: { weekendOnly: true }, priority: 5 },
  { title: 'Late checkout', description: 'Keep your room until 4pm on your departure day.', category: 'amenities', price: 15000, rules: { stage: 'in_stay' }, priority: 9 },
  { title: 'Laundry express', description: 'Same-day laundry and pressing service.', category: 'amenities', price: 8000, rules: { minNights: 3 }, priority: 4 },
  { title: 'Butler welcome hamper', description: 'Fruit, pastries and a bottle of bubbly waiting in your suite.', category: 'amenities', price: 40000, rules: { roomTypes: ['suite'], stage: 'pre_arrival' }, priority: 6 },
];

async function upsertStaff({ email, password, ...rest }) {
  const existing = await Staff.findOne({ email });
  if (existing) return { email, created: false };
  await Staff.create({ email, password, ...rest });
  return { email, created: true };
}

async function seed() {
  const isProduction = nodeEnv === 'production';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || (!isProduction && 'Admin@12345');
  const staffPassword = process.env.SEED_STAFF_PASSWORD || (!isProduction && 'Staff@12345');
  if (!adminPassword || !staffPassword) {
    throw new Error('Set SEED_ADMIN_PASSWORD and SEED_STAFF_PASSWORD before seeding in production');
  }

  await connectDB();

  for (const room of ROOMS) {
    await Room.updateOne({ roomNumber: room.roomNumber }, { $set: room }, { upsert: true, runValidators: true });
  }
  for (const rec of RECOMMENDATIONS) {
    await Recommendation.updateOne({ title: rec.title }, { $set: rec }, { upsert: true, runValidators: true });
  }

  const accounts = [
    await upsertStaff({ firstName: 'Hotel', lastName: 'Admin', email: process.env.SEED_ADMIN_EMAIL || 'admin@keylessflow.test', password: adminPassword, role: 'admin', department: 'management' }),
    await upsertStaff({ firstName: 'Front', lastName: 'Desk', email: process.env.SEED_STAFF_EMAIL || 'staff@keylessflow.test', password: staffPassword, role: 'staff', department: 'front_desk' }),
  ];

  console.log(`Seeded ${ROOMS.length} rooms and ${RECOMMENDATIONS.length} recommendations`);
  accounts.forEach((a) => console.log(`Staff account ${a.email}: ${a.created ? 'created' : 'already exists (password unchanged)'}`));
  if (!process.env.SEED_ADMIN_PASSWORD) console.log('Default dev passwords: Admin@12345 / Staff@12345');
}

seed()
  .catch((err) => {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
