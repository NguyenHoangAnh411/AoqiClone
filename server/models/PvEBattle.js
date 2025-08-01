const mongoose = require('mongoose');

const pveBattleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  stageId: {
    type: String,
    required: true,
    ref: 'Stage'
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
    default: '⚔️'
  },
  levelRequirement: {
    type: Number,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'expert', 'legendary'],
    default: 'normal'
  },
  isBossBattle: {
    type: Boolean,
    default: false
  },
  enemies: [{
    petId: {
      type: String,
      required: true,
      ref: 'Pet'
    },
    level: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    skills: [{
      type: String,
      ref: 'Skill'
    }],
    equipment: [{
      itemId: {
        type: String,
        ref: 'Item'
      },
      slot: {
        type: String,
        enum: ['weapon', 'armor', 'accessory']
      }
    }],
    stats: {
      hp: { type: Number, default: null },
      attack: { type: Number, default: null },
      defense: { type: Number, default: null },
      speed: { type: Number, default: null }
    }
  }],
  formation: {
    type: String,
    enum: ['random', 'line', 'circle', 'triangle', 'custom'],
    default: 'random'
  },
  customFormation: {
    type: [[String]], // 3x3 grid with pet positions
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
pveBattleSchema.index({ battleId: 1 });
pveBattleSchema.index({ stageId: 1, order: 1 });
pveBattleSchema.index({ isActive: 1, isBossBattle: 1 });

module.exports = mongoose.model('PvEBattle', pveBattleSchema); 