const mongoose = require('mongoose');

const conversationSessionSchema = new mongoose.Schema(
  {
    whatsappNumber: { type: String, required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    state: {
      type: String,
      enum: [
        'idle',
        'collecting_ride',
        'collecting_food',
        'collecting_service',
        'collecting_reminder',
        'awaiting_confirmation',
        'awaiting_ride_choice',
        'awaiting_food_choice',
        'emergency',
      ],
      default: 'idle',
    },
    pendingIntent: String,
    pendingData: mongoose.Schema.Types.Mixed,
    lastMessageAt: { type: Date, default: Date.now },
    language: { type: String, enum: ['en', 'hi', 'hinglish'], default: 'en' },
    processedMessageIds: [String], // deduplication
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConversationSession', conversationSessionSchema);
