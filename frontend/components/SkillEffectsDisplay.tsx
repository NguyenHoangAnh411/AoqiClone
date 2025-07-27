import React from 'react';
import { SkillEffects } from '@/lib/types';

interface SkillEffectsDisplayProps {
  effects?: SkillEffects;
  className?: string;
}

const SkillEffectsDisplay: React.FC<SkillEffectsDisplayProps> = ({ effects, className = '' }) => {
  if (!effects) return null;

  const hasStatusEffects = effects.status && Object.entries(effects.status).some(([_, active]) => active);
  const hasBuffEffects = effects.buff && Object.entries(effects.buff).some(([_, level]) => level > 0);
  const hasDebuffEffects = effects.debuff && Object.entries(effects.debuff).some(([_, level]) => level > 0);
  const hasSpecialEffects = effects.special && Object.entries(effects.special).some(([_, value]) => value && value !== 0);

  if (!hasStatusEffects && !hasBuffEffects && !hasDebuffEffects && !hasSpecialEffects) {
    return null;
  }

  return (
    <div className={`skill-effects-display ${className}`}>
      <h6>Hiệu ứng:</h6>
      
      {/* Status Effects */}
      {hasStatusEffects && (
        <div className="effects-group">
          <span className="effects-label">Status:</span>
          <div className="effects-list">
            {Object.entries(effects.status!).map(([effect, active]) => 
              active && (
                <span key={effect} className="effect-tag status">
                  {effect === 'stun' && '💫 Stun'}
                  {effect === 'poison' && '☠️ Poison'}
                  {effect === 'burn' && '🔥 Burn'}
                  {effect === 'freeze' && '❄️ Freeze'}
                  {effect === 'paralyze' && '⚡ Paralyze'}
                  {effect === 'sleep' && '😴 Sleep'}
                  {effect === 'confusion' && '💫 Confusion'}
                </span>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Buff Effects */}
      {hasBuffEffects && (
        <div className="effects-group">
          <span className="effects-label">Buff:</span>
          <div className="effects-list">
            {Object.entries(effects.buff!).map(([stat, level]) => 
              level > 0 && (
                <span key={stat} className="effect-tag buff">
                  {stat === 'attack' && '⚔️'}
                  {stat === 'defense' && '🛡️'}
                  {stat === 'speed' && '⚡'}
                  {stat === 'accuracy' && '🎯'}
                  {stat === 'evasion' && '👻'}
                  {stat === 'criticalRate' && '💥'}
                  +{level}
                </span>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Debuff Effects */}
      {hasDebuffEffects && (
        <div className="effects-group">
          <span className="effects-label">Debuff:</span>
          <div className="effects-list">
            {Object.entries(effects.debuff!).map(([stat, level]) => 
              level > 0 && (
                <span key={stat} className="effect-tag debuff">
                  {stat === 'attack' && '⚔️'}
                  {stat === 'defense' && '🛡️'}
                  {stat === 'speed' && '⚡'}
                  {stat === 'accuracy' && '🎯'}
                  {stat === 'evasion' && '👻'}
                  {stat === 'criticalRate' && '💥'}
                  -{level}
                </span>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Special Effects */}
      {hasSpecialEffects && (
        <div className="effects-group">
          <span className="effects-label">Special:</span>
          <div className="effects-list">
            {effects.special!.heal && effects.special!.heal > 0 && (
              <span className="effect-tag special">💚 Heal {effects.special!.heal}%</span>
            )}
            {effects.special!.drain && effects.special!.drain > 0 && (
              <span className="effect-tag special">🩸 Drain {effects.special!.drain}%</span>
            )}
            {effects.special!.reflect && (
              <span className="effect-tag special">🪞 Reflect</span>
            )}
            {effects.special!.counter && (
              <span className="effect-tag special">↩️ Counter</span>
            )}
            {effects.special!.priority && effects.special!.priority !== 0 && (
              <span className="effect-tag special">⚡ Priority {effects.special!.priority > 0 ? '+' : ''}{effects.special!.priority}</span>
            )}
            {effects.special!.multiHit && effects.special!.multiHit > 1 && (
              <span className="effect-tag special">🎯 {effects.special!.multiHit} hits</span>
            )}
            {effects.special!.recoil && effects.special!.recoil > 0 && (
              <span className="effect-tag special">💥 Recoil {effects.special!.recoil}%</span>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .skill-effects-display {
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e9ecef;
        }
        
        .skill-effects-display h6 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .effects-group {
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .effects-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #666;
          min-width: 50px;
          margin-top: 2px;
        }
        
        .effects-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .effect-tag {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .effect-tag.status {
          background: #dc3545;
          color: white;
        }
        
        .effect-tag.buff {
          background: #28a745;
          color: white;
        }
        
        .effect-tag.debuff {
          background: #ffc107;
          color: #212529;
        }
        
        .effect-tag.special {
          background: #667eea;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default SkillEffectsDisplay; 