/**
 * AI Intent Detection Engine
 * Supports: OpenAI | Google AI | Deterministic fallback
 */
const config = require('../config');

const INTENTS = [
  'medicine_reminder',
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
 * Deterministic keyword-based fallback intent detector.
 * Always available — no external calls.
 */
function deterministicDetect(text) {
  const t = text.toLowerCase();

  const rules = [
    { intent: 'emergency_help', keywords: ['help', 'emergency', 'hurt', 'fell', 'pain', 'ambulance', 'sos', 'dard', 'madad', 'gira'] },
    { intent: 'medicine_reminder', keywords: ['medicine', 'tablet', 'pill', 'dawa', 'dawai', 'reminder', 'remind', 'dose', 'capsule'] },
    { intent: 'ride_booking', keywords: ['ride', 'taxi', 'cab', 'auto', 'uber', 'ola', 'pick', 'doctor ke liye', 'hospital jana', 'gaadi'] },
    { intent: 'food_order', keywords: ['food', 'khana', 'lunch', 'dinner', 'breakfast', 'order', 'delivery', 'dal', 'roti', 'sabji'] },
    { intent: 'home_cleaning', keywords: ['clean', 'safai', 'mop', 'sweep', 'dust', 'cleaning', 'jhadoo', 'poch'] },
    { intent: 'gardening', keywords: ['garden', 'plant', 'grass', 'flowers', 'mali', 'bagicha'] },
    { intent: 'car_wash', keywords: ['car', 'wash', 'gaadi', 'clean car', 'vehicle', 'bike'] },
    { intent: 'wellness_checkin', keywords: ['how are you', 'how am i', 'feeling', 'health', 'checkin', 'check in', 'theek hun', 'acha hun'] },
    { intent: 'booking_status', keywords: ['status', 'where', 'when', 'arrived', 'booking', 'order status', 'kab aayega'] },
    { intent: 'human_support', keywords: ['talk', 'support', 'agent', 'person', 'help me', 'operator', 'insaan', 'baat'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => t.includes(kw))) {
      return {
        intent: rule.intent,
        confidence: 0.7,
        language: detectLanguage(t),
        source: 'deterministic',
        missingFields: [],
        requiresConfirmation: ['ride_booking', 'food_order', 'home_cleaning'].includes(rule.intent),
      };
    }
  }

  return {
    intent: 'unknown',
    confidence: 0.0,
    language: detectLanguage(t),
    source: 'deterministic',
    missingFields: [],
    requiresConfirmation: false,
  };
}

function detectLanguage(text) {
  // Simple heuristic: if devanagari chars present → hindi
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // If mix of english + common hindi transliteration words → hinglish
  const hinglishWords = ['kya', 'hai', 'mujhe', 'chahiye', 'please', 'aur', 'main'];
  if (hinglishWords.some((w) => text.toLowerCase().includes(w))) return 'hinglish';
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
Do NOT fabricate details not present in the message.`;

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
