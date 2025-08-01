const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  mapId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '🗺️'
  },
  background: {
    type: String,
    default: ''
  },
  levelRequirement: {
    type: Number,
    default: 1
  },
  unlockCondition: {
    type: String,
    enum: ['none', 'level', 'previous_map', 'item', 'achievement'],
    default: 'none'
  },
  unlockValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'expert', 'legendary'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEvent: {
    type: Boolean,
    default: false
  },
  eventStartDate: {
    type: Date,
    default: null
  },
  eventEndDate: {
    type: Date,
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
mapSchema.index({ mapId: 1 });
mapSchema.index({ isActive: 1, order: 1 });
mapSchema.index({ isEvent: 1, eventStartDate: 1, eventEndDate: 1 });

module.exports = mongoose.model('Map', mapSchema); 