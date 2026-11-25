/**
 * Quick-commerce price comparison (demo mode)
 * ─────────────────────────────────────────────────────────────────────────────
 * Blinkit, Zepto and Swiggy Instamart do not expose public consumer price /
 * cart APIs. CareConnect therefore compares deterministic, clearly-labelled
 * DEMO estimates, picks the cheapest basket, and hands the parent off to that
 * provider with the item search pre-filled. The provider's own checkout shows
 * the final, real bill.
 *
 * The estimates are stable across calls (hash-based, no randomness), so demos
 * and tests are repeatable. Every response carries `isEstimate: true`.
 */
const crypto = require('crypto');
const { quickCommerceHandoffs } = require('./handoffLinks');

/** Approximate retail pack prices in INR (demo estimates). */
const BASE_PRICES = {
  Milk: 34,
  Sugar: 48,
  Poha: 42,
  'Wheat Atta': 320,
  Rice: 75,
  'Toor Dal': 160,
  'Cooking Oil': 150,
  Salt: 22,
  Curd: 35,
  Paneer: 90,
  Ghee: 600,
  Besan: 90,
  Bread: 40,
  Eggs: 42,
  'Fresh Vegetables': 60,
  Onion: 40,
  Potato: 35,
  Tomato: 30,
  Fruits: 100,
  Tea: 140,
  Coffee: 200,
  Biscuits: 30,
  Namkeen: 40,
  Masala: 60,
  Detergent: 120,
  Soap: 40,
  Toothpaste: 95,
  'Floor Cleaner': 99,
  'LPG Cylinder': 850,
  'Household Saman': 150,
};

const PROVIDERS = [
  {
    providerId: 'blinkit',
    providerName: 'Blinkit',
    etaMinutes: 10,
    deliveryFee: 25,
    handlingFee: 4,
    priceBias: 1.0,
  },
  {
    providerId: 'zepto',
    providerName: 'Zepto',
    etaMinutes: 12,
    deliveryFee: 20,
    handlingFee: 3,
    priceBias: 1.02,
  },
  {
    providerId: 'instamart',
    providerName: 'Swiggy Instamart',
    etaMinutes: 15,
    deliveryFee: 15,
    handlingFee: 5,
    priceBias: 0.99,
  },
];

function hashInt(seed, mod) {
  const hash = crypto.createHash('sha256').update(String(seed)).digest();
  return hash.readUInt32BE(0) % mod;
}

/** Per-provider, per-item price variance (±7%) so the comparison is realistic. */
function estimateUnitPrice(provider, itemName) {
  const base = BASE_PRICES[itemName] || 60;
  const variance = 0.93 + (hashInt(`${provider.providerId}|${itemName}`, 1000) / 1000) * 0.14;
  return Math.max(5, Math.round(base * provider.priceBias * variance));
}

function normaliseItems(items) {
  const names = (Array.isArray(items) ? items : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return [...new Set(names)].slice(0, 10);
}

/**
 * Compare one basket across Blinkit / Zepto / Instamart.
 *
 * @param {string[]} items canonical item names (e.g. ["Milk", "Poha"])
 * @returns {{
 *   isEstimate: true,
 *   currency: string,
 *   items: string[],
 *   cheapest: object,
 *   savingsVsHighest: number,
 *   options: object[],
 *   note: string,
 * }}
 */
function compareQuickCommercePrices(items) {
  const names = normaliseItems(items);
  if (!names.length) names.push('Household Saman');

  const query = names.join(' ');
  const handoffs = quickCommerceHandoffs(query);

  const options = PROVIDERS.map((provider) => {
    const pricedItems = names.map((name) => {
      const unitPrice = estimateUnitPrice(provider, name);
      return { name, quantity: 1, unitPrice, lineTotal: unitPrice };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal + provider.deliveryFee + provider.handlingFee;
    const handoff = handoffs.find((h) => h.providerId === provider.providerId);

    return {
      providerId: provider.providerId,
      providerName: provider.providerName,
      etaMinutes: provider.etaMinutes,
      items: pricedItems,
      subtotal,
      deliveryFee: provider.deliveryFee,
      handlingFee: provider.handlingFee,
      total,
      orderUrl: handoff?.url || '',
      label: handoff?.label || `Order on ${provider.providerName}`,
    };
  }).sort((a, b) => a.total - b.total || a.etaMinutes - b.etaMinutes);

  const cheapest = options[0];
  const highest = options[options.length - 1];

  return {
    isEstimate: true,
    currency: 'INR',
    items: names,
    cheapest,
    savingsVsHighest: Math.max(0, highest.total - cheapest.total),
    options,
    note:
      'Estimated demo prices. The provider app shows the final bill at checkout; ' +
      'CareConnect cannot place the order automatically without a partner API.',
  };
}

module.exports = {
  BASE_PRICES,
  PROVIDERS,
  compareQuickCommercePrices,
  _estimateUnitPrice: estimateUnitPrice,
};
