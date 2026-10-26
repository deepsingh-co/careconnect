/**
 * Real-World Handoff Links
 *
 * Ola / Uber / Rapido / Zomato / Swiggy do not offer public consumer APIs
 * (they are partner-only), so CareConnect cannot place a real booking on the
 * user's behalf. Instead we hand the user off to the provider's own app or
 * website with the trip / search pre-filled — the standard approach for
 * aggregators without API partnerships. This makes the service usable by
 * real people today, with zero API keys.
 *
 * Link formats verified against provider docs:
 *   - Uber universal link:  https://developer.uber.com (m.uber.com/ul deep link)
 *   - Ola web deep link:    https://developers.olacabs.com/docs/deep-linking
 *   - Google Maps URLs:     https://developers.google.com/maps/documentation/urls
 */

function enc(value) {
  return encodeURIComponent(String(value || '').trim());
}

/** Google Maps driving directions (works on mobile & desktop, no API key). */
function mapsDirectionsUrl({ destination, origin } = {}) {
  const params = [`destination=${enc(destination)}`, 'travelmode=driving'];
  if (origin) params.push(`origin=${enc(origin)}`);
  return `https://www.google.com/maps/dir/?api=1&${params.join('&')}`;
}

/** Google Maps nearby search (used when we only know a category). */
function mapsNearbyUrl(query = 'restaurants near me') {
  return `https://www.google.com/maps/search/?api=1&query=${enc(query)}`;
}

const RIDE_HANDOFFS = [
  {
    providerId: 'uber',
    providerName: 'Uber',
    label: 'Open in Uber',
    url: ({ destination }) =>
      `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${enc(destination)}`,
  },
  {
    providerId: 'ola',
    providerName: 'Ola',
    label: 'Open in Ola',
    url: ({ destination }) => `https://book.olacabs.com/?drop_name=${enc(destination)}`,
  },
  {
    providerId: 'rapido',
    providerName: 'Rapido',
    label: 'Open Rapido',
    url: () => 'https://rapido.bike/',
  },
  {
    providerId: 'maps',
    providerName: 'Google Maps',
    label: 'Directions in Google Maps',
    url: ({ pickup, destination }) => mapsDirectionsUrl({ destination, origin: pickup }),
  },
];

/** All real booking links for a ride. Opens the provider's own app/site. */
function rideHandoffs({ pickup, destination } = {}) {
  return RIDE_HANDOFFS.map((h) => ({
    providerId: h.providerId,
    providerName: h.providerName,
    label: h.label,
    url: h.url({ pickup, destination }),
  }));
}

/** The handoff link for one ride provider (e.g. the one the user selected). */
function rideHandoffFor(providerId, { pickup, destination } = {}) {
  return rideHandoffs({ pickup, destination }).find((h) => h.providerId === providerId) || null;
}

/** Real food-delivery handoffs (Swiggy / Zomato / Maps nearby). */
function foodHandoffs() {
  return [
    { providerId: 'swiggy', providerName: 'Swiggy', label: 'Order on Swiggy', url: 'https://www.swiggy.com/' },
    { providerId: 'zomato', providerName: 'Zomato', label: 'Order on Zomato', url: 'https://www.zomato.com/' },
    { providerId: 'maps', providerName: 'Google Maps', label: 'Restaurants nearby', url: mapsNearbyUrl() },
  ];
}

/**
 * 10-minute quick-commerce handoffs for daily needs (milk, chini, poha…).
 * The search term is pre-filled so the parent just taps "Add to cart".
 *   - Blinkit web search:   blinkit.com/s/<query>
 *   - Zepto web search:     zeptonow.com/search?query=<query>
 *   - Instamart web search: swiggy.com/instamart/search?query=<query>
 */
function quickCommerceHandoffs(query) {
  const q = enc(query || 'grocery');
  return [
    {
      providerId: 'blinkit',
      providerName: 'Blinkit',
      label: 'Order on Blinkit (~10 min)',
      url: `https://blinkit.com/s/${q}`,
    },
    {
      providerId: 'zepto',
      providerName: 'Zepto',
      label: 'Order on Zepto',
      url: `https://www.zeptonow.com/search?query=${q}`,
    },
    {
      providerId: 'instamart',
      providerName: 'Swiggy Instamart',
      label: 'Order on Instamart',
      url: `https://www.swiggy.com/instamart/search?query=${q}`,
    },
  ];
}

/**
 * Online-pharmacy handoffs for medicine orders. Search pre-filled with the
 * medicine name(s) the parent mentioned.
 *   - Apollo Pharmacy: apollopharmacy.in/search-medicines?name=<query>
 *   - Tata 1mg:        1mg.com/search/all?name=<query>
 *   - PharmEasy:       pharmeasy.in/search/all?name=<query>
 */
function medicineHandoffs(query) {
  const q = enc(query || 'medicine');
  return [
    {
      providerId: 'apollo',
      providerName: 'Apollo Pharmacy',
      label: 'Order on Apollo Pharmacy',
      url: `https://www.apollopharmacy.in/search-medicines?name=${q}`,
    },
    {
      providerId: 'tata1mg',
      providerName: 'Tata 1mg',
      label: 'Order on 1mg',
      url: `https://www.1mg.com/search/all?name=${q}`,
    },
    {
      providerId: 'pharmeasy',
      providerName: 'PharmEasy',
      label: 'Order on PharmEasy',
      url: `https://www.pharmeasy.in/search/all?name=${q}`,
    },
  ];
}

module.exports = {
  mapsDirectionsUrl,
  mapsNearbyUrl,
  rideHandoffs,
  rideHandoffFor,
  foodHandoffs,
  quickCommerceHandoffs,
  medicineHandoffs,
};
