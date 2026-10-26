/**
 * Item Catalogues for Quick-Commerce & Pharmacy Handoffs
 *
 * CareConnect cannot place real orders on Blinkit / Zepto / Apollo etc. (no
 * public consumer APIs), so the bot extracts WHAT the parent asked for from
 * their Hinglish/English message and pre-fills the provider's own search page.
 *
 * Aliases are Latin-script Hindi (Hinglish) spellings, since that is how
 * elderly Indian users type: "dudh", "cheeni", "sabji", "dawai"…
 */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Word-boundary match for one alias (multi-word aliases supported). */
function matchesAlias(normText, alias) {
  const escaped = alias.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escaped}\\b`).test(normText);
}

/**
 * Common Indian household / daily-need items. The FIRST match per message
 * wins per catalogue entry; `name` is the canonical search term sent to the
 * quick-commerce apps.
 */
const DAILY_NEEDS = [
  { name: 'Milk', aliases: ['dudh', 'doodh', 'milk'] },
  { name: 'Sugar', aliases: ['chini', 'cheeni', 'sugar'] },
  { name: 'Poha', aliases: ['poha', 'chivda', 'beaten rice'] },
  { name: 'Wheat Atta', aliases: ['atta', 'aata', 'wheat flour'] },
  { name: 'Rice', aliases: ['chawal', 'rice'] },
  { name: 'Toor Dal', aliases: ['toor dal', 'arhar dal', 'tur dal', 'moong dal', 'chana dal', 'dal'] },
  { name: 'Cooking Oil', aliases: ['sunflower oil', 'refined oil', 'cooking oil', 'tel', 'oil'] },
  { name: 'Salt', aliases: ['namak', 'salt'] },
  { name: 'Curd', aliases: ['dahi', 'curd', 'yogurt'] },
  { name: 'Paneer', aliases: ['paneer', 'cottage cheese'] },
  { name: 'Ghee', aliases: ['desi ghee', 'ghee'] },
  { name: 'Besan', aliases: ['besan', 'gram flour'] },
  { name: 'Bread', aliases: ['bread', 'double roti', 'pav'] },
  { name: 'Eggs', aliases: ['ande', 'anda', 'eggs', 'egg'] },
  { name: 'Fresh Vegetables', aliases: ['sabziyan', 'sabjiyan', 'sabzi', 'sabji', 'sabjee', 'vegetables', 'tarkari'] },
  { name: 'Onion', aliases: ['pyaaz', 'pyaz', 'onion'] },
  { name: 'Potato', aliases: ['aloo', 'potato'] },
  { name: 'Tomato', aliases: ['tamatar', 'tomato'] },
  { name: 'Fruits', aliases: ['fruits', 'fruit', 'phal'] },
  { name: 'Tea', aliases: ['chai patti', 'chai', 'tea'] },
  { name: 'Coffee', aliases: ['coffee', 'kaapi'] },
  { name: 'Biscuits', aliases: ['biscuits', 'biscuit', 'biskut'] },
  { name: 'Namkeen', aliases: ['namkeen', 'bhujia', 'mixture', 'sev'] },
  { name: 'Masala', aliases: ['masala', 'haldi', 'mirch', 'jeera'] },
  { name: 'Detergent', aliases: ['washing powder', 'detergent', 'surf', 'nirma'] },
  { name: 'Soap', aliases: ['sabun', 'soap'] },
  { name: 'Toothpaste', aliases: ['dant manjan', 'manjan', 'toothpaste'] },
  { name: 'Floor Cleaner', aliases: ['phenyl', 'floor cleaner'] },
  { name: 'LPG Cylinder', aliases: ['gas cylinder', 'lpg cylinder', 'cylinder'] },
  { name: 'Household Saman', aliases: ['kirana', 'grocery', 'groceries', 'daily needs', 'rations', 'ration', 'saman', 'saaman'] },
];

/** Frequently ordered OTC / chronic-disease medicines in Indian households. */
const MEDICINES = [
  { name: 'Paracetamol 650', aliases: ['paracetamol', 'dolo', 'crocin', 'calpol'] },
  { name: 'Combiflam', aliases: ['combiflam', 'ibuprofen'] },
  { name: 'Cetirizine', aliases: ['levocetirizine', 'cetirizine', 'cetzine', 'okacet'] },
  { name: 'Pantoprazole', aliases: ['pantoprazole', 'pantop', 'pantocid', 'pantoloc'] },
  { name: 'Omeprazole', aliases: ['omeprazole', 'omee', 'omez'] },
  { name: 'Azithromycin', aliases: ['azithromycin', 'azithral', 'azee'] },
  { name: 'Metformin', aliases: ['metformin', 'glycomet', 'glimepiride'] },
  { name: 'Telmisartan', aliases: ['telmisartan', 'telma', 'telmikind'] },
  { name: 'Amlodipine', aliases: ['amlodipine', 'amlong', 'amlopres'] },
  { name: 'Vitamin D3', aliases: ['vitamin d3', 'vitamin d', 'calcium d3'] },
  { name: 'Multivitamin', aliases: ['multivitamin', 'supradyn', 'zincovit', 'becosules'] },
  { name: 'ORS Electral', aliases: ['electral', 'ors', 'ors powder'] },
  { name: 'Gelusil', aliases: ['gelusil', 'digene', 'gaviscon', 'gas x'] },
  { name: 'Pain Balm', aliases: ['volini', 'moov', 'odinex', 'pain balm', 'balm'] },
  { name: 'Insulin', aliases: ['insulin'] },
  { name: 'Cremaffin', aliases: ['cremaffin', 'duphalac', 'isabgol', 'dulcolax'] },
  { name: 'Betadine', aliases: ['betadine', 'detol', 'dettol'] },
  { name: 'Cough Syrup', aliases: ['cough syrup', 'ascoril', 'benshen'] },
  { name: 'Liv.52', aliases: ['liv52', 'liv 52', 'liv.52'] },
  { name: 'Glucometer Strips', aliases: ['glucometer strips', 'test strips', 'glucometer'] },
];

/** Returns canonical names of daily-need items mentioned in a message. */
function extractDailyNeeds(text) {
  const norm = normalize(text);
  return DAILY_NEEDS.filter((item) => item.aliases.some((a) => matchesAlias(norm, a))).map((i) => i.name);
}

/** Returns canonical names of medicines mentioned in a message. */
function extractMedicines(text) {
  const norm = normalize(text);
  return MEDICINES.filter((item) => item.aliases.some((a) => matchesAlias(norm, a))).map((i) => i.name);
}

module.exports = { extractDailyNeeds, extractMedicines, DAILY_NEEDS, MEDICINES };
