const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  stageId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mapId: {
    type: String,
    required: true,
    ref: 'Map'
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
    default: '🏔️'
  },
  levelRequirement: {
    type: Number,
    default: 1
  },
  unlockCondition: {
    type: String,
    enum: ['none', 'level', 'previous_stage', 'item', 'achievement'],
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
  isBossStage: {
    type: Boolean,
    default: false
  },
  bossPetId: {
    type: String,
    ref: 'Pet',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
stageSchema.index({ stageId: 1 });
stageSchema.index({ mapId: 1, order: 1 });
stageSchema.index({ isActive: 1, isBossStage: 1 });

module.exports = mongoose.model('Stage', stageSchema); 