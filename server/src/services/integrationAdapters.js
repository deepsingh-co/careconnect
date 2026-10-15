/**
 * Demo-Mode Integration Adapters
 *
 * Real public APIs do not exist for:
 *   - Ride hailing price comparison (Ola / Uber / Rapido)
 *   - Food ordering (Zomato / Swiggy consumer APIs are partner-only)
 *   - Home services (Urban Company has no public API)
 *
 * These adapters integrate those providers in DEMO MODE:
 *   - Deterministic, hash-based pricing so demos are stable
 *   - Simulated booking references (clearly prefixed *-DEMO-*)
 *   - Every payload carries `isDemo: true` — NEVER fake success
 */
const crypto = require('crypto');

function hashInt(str, mod) {
  const h = crypto.createHash('sha256').update(String(str).toLowerCase()).digest();
  return h.readUInt32BE(0) % mod;
}

function demoRef(prefix, seed) {
  const h = crypto
    .createHash('sha256')
    .update(`${seed}|${Date.now()}|${Math.random()}`)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();
  return `${prefix}-DEMO-${h}`;
}

// Rough deterministic "distance" between two addresses (4.0 – 18.0 km)
function estimateDistanceKm(origin, destination) {
  const raw = 400 + hashInt(`${origin}|${destination}`, 1410); // 400–1809 (x0.01 km)
  return Math.round(raw) / 100;
}

function estimateEtaMin(seed) {
  return 3 + hashInt(`eta|${seed}`, 10); // 3–12 min
}

// ── Ride Providers (Ola / Uber / Rapido) ─────────────────────────────────────
const RIDE_PROVIDERS = [
  {
    id: 'ola',
    name: 'Ola',
    vehicles: [
      { id: 'ola-mini', label: 'Ola Mini', base: 40, perKm: 12 },
      { id: 'ola-sedan', label: 'Ola Sedan', base: 60, perKm: 15 },
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    vehicles: [
      { id: 'uber-go', label: 'Uber Go', base: 42, perKm: 13 },
      { id: 'uber-premier', label: 'Uber Premier', base: 70, perKm: 17 },
    ],
  },
  {
    id: 'rapido',
    name: 'Rapido',
    vehicles: [
      { id: 'rapido-bike', label: 'Rapido Bike', base: 20, perKm: 7 },
      { id: 'rapido-auto', label: 'Rapido Auto', base: 30, perKm: 10 },
    ],
  },
];

const DEMO_DRIVERS = [
  { name: 'Ramesh Kumar', phone: '+91 90000 11111' },
  { name: 'Suresh Yadav', phone: '+91 90000 22222' },
  { name: 'Amit Singh', phone: '+91 90000 33333' },
  { name: 'Vijay Patil', phone: '+91 90000 44444' },
];

const rideProviders = {
  isDemo: true,
  mode: 'demo',
  providers: RIDE_PROVIDERS,

  estimateDistanceKm,

  /** All quotes across Ola/Uber/Rapido, sorted by price (cheapest first). */
  getQuotes({ pickup, destination }) {
    const distanceKm = estimateDistanceKm(pickup, destination);
    const quotes = [];
    for (const p of RIDE_PROVIDERS) {
      for (const v of p.vehicles) {
        const seed = `${p.id}|${v.id}|${pickup}|${destination}`;
        quotes.push({
          providerId: p.id,
          providerName: p.name,
          vehicleId: v.id,
          vehicleLabel: v.label,
          price: Math.round(v.base + v.perKm * distanceKm),
          etaMin: estimateEtaMin(seed),
          distanceKm,
          isDemo: true,
          notice: 'DEMO price — simulated quote, not a live fare.',
        });
      }
    }
    return quotes.sort((a, b) => a.price - b.price);
  },

  /** Cheapest quote per provider (for price comparison UI / WhatsApp list). */
  getComparison({ pickup, destination }) {
    const all = this.getQuotes({ pickup, destination });
    const best = new Map();
    for (const q of all) {
      if (!best.has(q.providerId) || q.price < best.get(q.providerId).price) {
        best.set(q.providerId, q);
      }
    }
    return [...best.values()].sort((a, b) => a.price - b.price);
  },

  /** Simulated booking. Returns a DEMO reference — never a real ride. */
  bookRide({ providerId, vehicleId, pickup, destination }) {
    const quote = this.getQuotes({ pickup, destination }).find(
      (q) => q.providerId === providerId && q.vehicleId === vehicleId
    );
    if (!quote) return null;

    const driver = DEMO_DRIVERS[hashInt(`${providerId}${pickup}${destination}`, DEMO_DRIVERS.length)];
    return {
      ...quote,
      ref: demoRef(providerId.toUpperCase(), `${providerId}${pickup}${destination}`),
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleDetails: `${quote.vehicleLabel} (DEMO)`,
      isDemo: true,
      notice: 'DEMO booking — no real driver has been dispatched.',
    };
  },
};

// ── Food Provider (Zomato-style demo catalogue) ──────────────────────────────
const DEMO_RESTAURANTS = [
  { id: 'r1', name: 'Annapurna Home Kitchen (Demo)', cuisine: 'Home-style North Indian' },
  { id: 'r2', name: 'Dakshin Tiffins (Demo)', cuisine: 'South Indian' },
  { id: 'r3', name: 'Shanti Cafe (Demo)', cuisine: 'Light meals & snacks' },
];

const DEMO_MENU = [
  { id: 'm1', name: 'Dal Khichdi', category: 'meals', price: 120, restaurantId: 'r1', description: 'Light and healthy rice and lentil dish.' },
  { id: 'm2', name: 'Idli Sambhar (4 pcs)', category: 'breakfast', price: 80, restaurantId: 'r2', description: 'Steamed rice cakes with sambhar.' },
  { id: 'm3', name: 'Poha', category: 'breakfast', price: 60, restaurantId: 'r2', description: 'Flattened rice with vegetables.' },
  { id: 'm4', name: 'Vegetable Soup', category: 'soups', price: 75, restaurantId: 'r3', description: 'Warm vegetable broth.' },
  { id: 'm5', name: 'Roti with Sabzi', category: 'meals', price: 100, restaurantId: 'r1', description: 'Whole wheat roti with seasonal vegetable curry.' },
  { id: 'm6', name: 'Curd Rice', category: 'meals', price: 90, restaurantId: 'r2', description: 'Cooling curd mixed with rice.' },
  { id: 'm7', name: 'Fresh Fruit Bowl', category: 'snacks', price: 80, restaurantId: 'r3', description: 'Seasonal fresh fruits.' },
  { id: 'm8', name: 'Green Tea', category: 'beverages', price: 30, restaurantId: 'r3', description: 'Antioxidant-rich green tea.' },
];

const foodProviders = {
  isDemo: true,
  mode: 'demo',
  restaurants: DEMO_RESTAURANTS,

  getMenu() {
    return DEMO_MENU.map((item) => ({
      ...item,
      restaurantName: DEMO_RESTAURANTS.find((r) => r.id === item.restaurantId)?.name || 'Demo Kitchen',
    }));
  },

  /** Simulated order. Returns a DEMO reference (Zomato-style) — no real order. */
  placeOrder({ items, restaurantId }) {
    const restaurant =
      DEMO_RESTAURANTS.find((r) => r.id === restaurantId) || DEMO_RESTAURANTS[0];
    const total = items.reduce((sum, it) => sum + (it.unitPrice || 0) * (it.quantity || 1), 0);
    return {
      ref: demoRef('ZOMATO', restaurant.id),
      restaurantName: restaurant.name,
      estimatedTotal: total,
      etaMin: 25 + hashInt(`food|${restaurant.id}`, 16), // 25–40 min
      riderName: DEMO_DRIVERS[hashInt(`rider|${restaurant.id}`, DEMO_DRIVERS.length)].name,
      isDemo: true,
      notice: 'DEMO order — no real restaurant or delivery partner was contacted.',
    };
  },
};

// ── Home Services (Urban Company-style demo) ─────────────────────────────────
const DEMO_PROS = [
  { name: 'Sunita Devi', rating: 4.8 },
  { name: 'Rekha Sharma', rating: 4.7 },
  { name: 'Mohan Lal', rating: 4.6 },
  { name: 'Geeta Kumari', rating: 4.9 },
];

const homeServiceProviders = {
  isDemo: true,
  mode: 'demo',
  providerName: 'Urban Company (Demo)',

  /** Simulated booking. Returns a DEMO reference — no real professional. */
  bookService({ categoryId }) {
    const pro = DEMO_PROS[hashInt(`uc|${categoryId}`, DEMO_PROS.length)];
    return {
      ref: demoRef('UC', categoryId || 'service'),
      platform: 'Urban Company (Demo)',
      proName: pro.name,
      proRating: pro.rating,
      arrivalWindow: 'Tomorrow, 10:00 AM – 12:00 PM (simulated)',
      isDemo: true,
      notice: 'DEMO booking — no real professional has been assigned.',
    };
  },
};

module.exports = {
  rideProviders,
  foodProviders,
  homeServiceProviders,
  estimateDistanceKm,
  demoRef,
};
