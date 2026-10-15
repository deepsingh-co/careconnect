const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['parent', 'child', 'provider', 'admin'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Invalid phone number'],
    },
    phoneVerified: { type: Boolean, default: false },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'hinglish'],
      default: 'en',
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    profileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving (async middleware — no next callback)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, config.bcrypt.rounds);
});

// Compare candidate password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

userSchema.index({ role: 1 });
userSchema.index({ phone: 1 });

module.exports = mongoose.model('User', userSchema);
