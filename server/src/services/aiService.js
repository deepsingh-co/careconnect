/**
 * AI Intent Detection Engine
 * Supports: OpenAI | Google AI | Deterministic fallback
 */
const config = require('../config');
const { MEDICINES } = require('./itemCatalogs');

const INTENTS = [
  'medicine_reminder',
  'medicine_order',
  'grocery_order',
  'wellness_checkin',
  'medical_appointment',
  'ride_booking',
  'food_order',
  'home_cleaning',
  'gardening',
  'car_wash',
  'other_home_service',
  'emergency_help',
  'booking_status',
  'human_support',
  'unknown',
];

/**
 * Folds the most common Hinglish spelling variants into one canonical form so
 * the keyword rules below match regardless of how the parent transliterates
 * Hindi in Latin script (khaana/khana, cheeni/chini, sabjee/sabji…).
 */
const SPELLING_FOLDS = [
  [/\bkhaana\b/g, 'khana'],
  [/\bkhaane\b/g, 'khane'],
  [/\bcheeni\b/g, 'chini'],
  [/\bchinee\b/g, 'chini'],
  [/\bsabjee\b/g, 'sabji'],
  [/\bsabzi\b/g, 'sabji'],
  [/\bsabjiyaan\b/g, 'sabji'],
  [/\bsabziyaan\b/g, 'sabji'],
  [/\bdawai\b/g, 'dawa'],
  [/\bdavai\b/g, 'dawa'],
  [/\bmangwao\b/g, 'mangwa'],
  [/\bmangwana\b/g, 'mangwa'],
  [/\bkharidna\b/g, 'kharid'],
  [/\bkhareed\b/g, 'kharid'],
  [/\bbhejna\b/g, 'bhej'],
  [/\bbhejo\b/g, 'bhej'],
];

function foldSpellings(text) {
  let out = String(text || '').toLowerCase();
  for (const [re, to] of SPELLING_FOLDS) out = out.replace(re, to);
  return out;
}

// Intent keyword groups (matched against the spelling-folded text).
const EMERGENCY_WORDS = ['help', 'emergency', 'hurt', 'fell', 'ambulance', 'sos', 'dard', 'madad', 'gira', 'bachao', 'bachaa', '112'];
const MEDICINE_GENERIC_WORDS = ['medicine', 'tablet', 'pill', 'dawa', 'capsule', 'pharmacy', 'chemist', 'prescription', 'aushadhi', 'goli'];
// Users say brand names, not the word "medicine" ("dolo 650 order karni hai") —
// so every brand/ingredient alias from the pharmacy catalogue counts too.
const MEDICINE_WORDS = [
  ...MEDICINE_GENERIC_WORDS,
  ...MEDICINES.flatMap((m) => [m.name.toLowerCase(), ...m.aliases]),
];
// "Dawa mangwa do" vs "dawa yaad dilao" — the verb decides order vs reminder.
const ORDER_VERBS_STRONG = ['order', 'mangwa', 'kharid', 'buy', 'refill', 'delivery', 'bhej', 'le aao', 'la do'];
const ORDER_VERBS_WEAK = ['chahiye', 'need', 'want', 'khatam', 'nahi hai'];
const REMINDER_WORDS = ['remind', 'reminder', 'yaad', 'schedule', 'roz', 'subah shaam'];
const GROCERY_WORDS = [
  'dudh', 'doodh', 'milk', 'chini', 'sugar', 'poha', 'kirana', 'grocery', 'groceries',
  'sabji', 'atta', 'aata', 'chawal', 'rice', 'namak', 'salt', 'bread', 'double roti',
  'ande', 'anda', 'egg', 'dahi', 'curd', 'paneer', 'ghee', 'besan', 'tel', 'oil',
  'chai', 'tea', 'coffee', 'biscuit', 'biskut', 'namkeen', 'bhujia', 'detergent', 'surf',
  'nirma', 'sabun', 'soap', 'manjan', 'phenyl', 'pyaaz', 'pyaz', 'aloo', 'tamatar',
  'phal', 'fruits', 'fruit', 'saman', 'saaman', 'ration', 'rations', 'daily needs',
  'cylinder', 'gas cylinder', 'masala', 'haldi', 'mirch', 'jeera', 'sabzi',
];
const RIDE_WORDS = ['ride', 'taxi', 'cab', 'auto', 'rickshaw', 'uber', 'ola', 'pick', 'doctor ke liye', 'hospital jana', 'gaadi', 'drop'];
const FOOD_WORDS = ['food', 'khana', 'khane', 'lunch', 'dinner', 'breakfast', 'nashta', 'nasta', 'bhookh', 'bukh', 'order', 'delivery', 'dal', 'roti', 'meal'];

/**
 * Deterministic keyword-based fallback intent detector.
 * Always available — no external calls. Tuned for Hinglish (Hindi typed in
 * Latin script), which is how most elderly users in India actually write.
 */
function deterministicDetect(text) {
  const original = String(text || '');
  const t = foldSpellings(original);

  const has = (words) => words.some((kw) => t.includes(kw));
  const base = (intent, extra = {}) => ({
    intent,
    confidence: 0.7,
    // Detect on the ORIGINAL text: spelling folds (dawai→dawa, sabjee→sabji)
    // would otherwise erase the very words that mark the message as Hinglish.
    language: detectLanguage(original),
    source: 'deterministic',
    missingFields: [],
    ...extra,
  });

  // 1. Emergency always wins.
  if (has(EMERGENCY_WORDS)) {
    return base('emergency_help', { requiresConfirmation: false });
  }

  // 2. Medicine: ORDER vs REMINDER ("dawa mangwa do" vs "dawa yaad dilana").
  //    A strong order verb always means ordering; a weak one ("chahiye")
  //    means ordering UNLESS a reminder word is present.
  if (has(MEDICINE_WORDS)) {
    const isOrder = has(ORDER_VERBS_STRONG) || (has(ORDER_VERBS_WEAK) && !has(REMINDER_WORDS));
    if (isOrder) {
      return base('medicine_order', { requiresConfirmation: false });
    }
    return base('medicine_reminder', { requiresConfirmation: false });
  }

  // 3. Daily needs / quick commerce (Blinkit-style) — checked BEFORE food so
  //    "dudh chahiye" never falls into the restaurant menu flow.
  if (has(GROCERY_WORDS)) {
    return base('grocery_order', { requiresConfirmation: false });
  }

  // 4. Rides (before food so "hospital jana hai" isn't read as a food order).
  if (has(RIDE_WORDS)) {
    return base('ride_booking', {
      requiresConfirmation: true,
      missingFields: [],
    });
  }

  // 5. Food.
  if (has(FOOD_WORDS)) {
    return base('food_order', { requiresConfirmation: true });
  }

  if (has(['clean', 'safai', 'mop', 'sweep', 'dust', 'cleaning', 'jhadoo', 'poch', 'saaf'])) {
    return base('home_cleaning', { requiresConfirmation: true });
  }
  if (has(['garden', 'plant', 'grass', 'flowers', 'mali', 'bagicha'])) {
    return base('gardening', { requiresConfirmation: true });
  }
  if (has(['car', 'wash', 'gaadi dhulai', 'clean car', 'vehicle', 'bike'])) {
    return base('car_wash', { requiresConfirmation: true });
  }
  if (has(['how are you', 'how am i', 'feeling', 'health', 'checkin', 'check in', 'theek hun', 'acha hun', 'kaise ho', 'kaisa hai', 'kya haal', 'sab theek'])) {
    return base('wellness_checkin', { requiresConfirmation: false });
  }
  if (has(['status', 'where is', 'when is', 'arrived', 'booking status', 'order status', 'kab aayega', 'kitne baje'])) {
    return base('booking_status', { requiresConfirmation: false });
  }
  if (has(['talk to', 'support', 'agent', 'person', 'help me', 'operator', 'insaan', 'baat karo', 'baat karni'])) {
    return base('human_support', { requiresConfirmation: false });
  }

  return base('unknown', { confidence: 0.0, requiresConfirmation: false });
}

function detectLanguage(text) {
  // Simple heuristic: if devanagari chars present → hindi
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // If mix of english + common hindi transliteration words → hinglish.
  // Word-boundary match so English words like "remain"/"chairman" don't
  // false-positive on the substring "main".
  const hinglishWords = ['kya', 'hai', 'mujhe', 'chahiye', 'aur', 'karo', 'bhejo', 'bhej', 'kaise', 'kaisa', 'batao', 'kripaya', 'namaste', 'namaskar', 'theek', 'hun', 'mangwa', 'kar', 'karni', 'kardo', 'bhookh', 'dudh', 'dawai', 'sabji', 'chawal', 'liye', 'bolo', 'subah', 'shaam', 'kyun', 'kaun', 'dhanyavad', 'suno', 'kitna', 'kab'];
  if (hinglishWords.some((w) => new RegExp(`\\b${w}\\b`).test(text.toLowerCase()))) return 'hinglish';
  return 'en';
}

class AIService {
  constructor() {
    this.provider = config.ai.provider;
    this.isDemo = !this.provider;
  }

  getStatus() {
    return {
      provider: this.provider || 'deterministic_fallback',
      configured: !this.isDemo,
    };
  }

  async detectIntent(text) {
    if (this.isDemo) {
      return deterministicDetect(text);
    }

    try {
      if (this.provider === 'openai') {
        return await this._openaiDetect(text);
      } else if (this.provider === 'google') {
        return await this._googleDetect(text);
      }
    } catch (err) {
      console.error('[AI] Provider call failed, using fallback:', err.message);
      return { ...deterministicDetect(text), source: 'deterministic_fallback' };
    }

    return deterministicDetect(text);
  }

  async _openaiDetect(text) {
    const axios = require('axios');
    const { apiKey, model } = config.ai.openai;

    const systemPrompt = `You are an assistant for CareConnect, an elderly care platform. 
Extract intent and structured data from user messages.
Reply ONLY with valid JSON matching this schema:
{
  "intent": one of ${JSON.stringify(INTENTS)},
  "confidence": number 0-1,
  "language": "en"|"hi"|"hinglish",
  "details": {
    "date": string or null,
    "time": string or null,
    "pickup": string or null,
    "destination": string or null,
    "items": array or null,
    "description": string or null
  },
  "missingFields": array of field names needed to complete the request,
  "requiresConfirmation": boolean,
  "followUpQuestion": string or null
}
Do NOT fabricate details not present in the message.
Users often write Hinglish (Hindi transliterated in Latin script, e.g. "khana chahiye", "dudh bhejo", "dawai order karni hai") — understand it naturally and set "language" to "hinglish".`;

    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 400,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const raw = resp.data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);

    // Validate intent is in allowed list
    if (!INTENTS.includes(parsed.intent)) parsed.intent = 'unknown';
    parsed.source = 'openai';
    return parsed;
  }

  async _googleDetect(text) {
    const axios = require('axios');
    const { apiKey, model } = config.ai.google;

    const prompt = `You are an assistant for CareConnect, an elderly care platform.
Extract intent and structured data from: "${text}"
Reply ONLY with valid JSON matching:
{"intent":"one of ${INTENTS.join('|')}","confidence":0.0-1.0,"language":"en/hi/hinglish","details":{},"missingFields":[],"requiresConfirmation":false,"followUpQuestion":null}`;

    const resp = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const raw = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    if (!INTENTS.includes(parsed.intent)) parsed.intent = 'unknown';
    parsed.source = 'google';
    return parsed;
  }
}

module.exports = new AIService();
module.exports.INTENTS = INTENTS;
module.exports.deterministicDetect = deterministicDetect;
