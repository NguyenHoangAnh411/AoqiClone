import React from 'react';
import styles from './ExpDisplay.module.css';

interface ExpDisplayProps {
  currentExp: number;
  expNeeded: number;
  canLevelUp: boolean;
  level: number;
  progressPercentage: number;
  showProgressBar?: boolean;
  compact?: boolean;
}

const ExpDisplay: React.FC<ExpDisplayProps> = ({
  currentExp,
  expNeeded,
  canLevelUp,
  level,
  progressPercentage,
  showProgressBar = true,
  compact = false
}) => {


  // Xác định màu sắc dựa trên trạng thái
  const getProgressColor = () => {
    if (level >= 100) return '#6b7280'; // Gray for max level
    if (canLevelUp) return '#ef4444'; // Red for can level up
    if (progressPercentage >= 80) return '#f59e0b'; // Yellow for close to level up
    return '#3b82f6'; // Blue for normal progress
  };

  const progressColor = getProgressColor();

  if (compact) {
    return (
      <div className={styles.expDisplayCompact}>
        <span className={styles.expText}>
          {currentExp}/{expNeeded}
        </span>
        {canLevelUp && <span className={styles.levelUpBadge}>⚡</span>}
      </div>
    );
  }

  return (
    <div className={styles.expDisplay}>
      <div className={styles.expHeader}>
        <span className={styles.levelText}>Level {level}</span>
        <span className={styles.expText}>
          {currentExp.toLocaleString()}/{expNeeded.toLocaleString()}
        </span>
        {canLevelUp && (
          <span className={`${styles.levelUpBadge} ${styles.pulse}`}>
            ⚡ Level Up!
          </span>
        )}
      </div>
      
      {showProgressBar && level < 100 && (
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: progressColor
            }}
          />
          <span className={styles.progressText}>
            {progressPercentage}%
          </span>
        </div>
      )}
      
      {level >= 100 && (
        <div className={styles.maxLevel}>
          <span className={styles.maxLevelText}>MAX LEVEL</span>
        </div>
      )}
    </div>
  );
};

export default ExpDisplay; 