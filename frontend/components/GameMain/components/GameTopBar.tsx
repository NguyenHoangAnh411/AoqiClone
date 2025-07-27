'use client';

import styles from '../../../app/page.module.css';

interface GameTopBarProps {
  onProfileClick: () => void;
  onQuestClick: () => void;
}

export const GameTopBar = ({ onProfileClick, onQuestClick }: GameTopBarProps) => {
  return (
    <div className={styles.gameTopBar}>
      <div className={styles.topBarLeft}>
        <button 
          className={styles.profileButton}
          onClick={onProfileClick}
          title="Hồ sơ"
        >
          <span className={styles.profileIcon}>👤</span>
        </button>
      </div>
      
      <div className={styles.topBarRight}>
        <button 
          className={styles.questButton}
          onClick={onQuestClick}
          title="Nhiệm vụ"
        >
          <span className={styles.questIcon}>📋</span>
        </button>
      </div>
    </div>
  );
}; 