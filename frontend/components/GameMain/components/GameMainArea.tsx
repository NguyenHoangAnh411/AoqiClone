'use client';

import styles from '../../../app/page.module.css';

interface GameMainAreaProps {
  onCornerProfile?: () => void;
  onCornerQuests?: () => void;
  onCornerPets?: () => void;
  onCornerShop?: () => void;
  onCornerFormation?: () => void;
}

export const GameMainArea = ({ 
  onCornerProfile, 
  onCornerQuests, 
  onCornerPets, 
  onCornerShop,
  onCornerFormation
}: GameMainAreaProps) => {
  return (
    <div className={styles.gameMainArea}>
      {/* Floating Elements */}
      <div className={styles.floatingElement}></div>
      <div className={styles.floatingElement}></div>
      <div className={styles.floatingElement}></div>
      
      {/* Corner Navigation Buttons */}
      <button 
        className={`${styles.cornerButton} ${styles.cornerTopLeft}`} 
        title="Hồ sơ"
        onClick={onCornerProfile}
      >
        <span className={styles.cornerIcon}>👤</span>
      </button>
      
      <button 
        className={`${styles.cornerButton} ${styles.cornerTopRight}`} 
        title="Nhiệm vụ"
        onClick={onCornerQuests}
      >
        <span className={styles.cornerIcon}>📋</span>
      </button>
      
      {/* Bottom Left Buttons - Formation and Pets */}
      <button 
        className={`${styles.cornerButton} ${styles.cornerBottomLeft}`} 
        title="Lập đội hình"
        onClick={onCornerFormation}
      >
        <span className={styles.cornerIcon}>🎯</span>
      </button>

      <button 
        className={`${styles.cornerButton} ${styles.cornerBottomLeftSecondary}`} 
        title="Túi linh thú"
        onClick={onCornerPets}
      >
        <span className={styles.cornerIcon}>🐾</span>
      </button>
      
      {/* Bottom Right Button - Shop */}
      <button 
        className={`${styles.cornerButton} ${styles.cornerBottomRight}`} 
        title="Cửa hàng"
        onClick={onCornerShop}
      >
        <span className={styles.cornerIcon}>🏪</span>
      </button>
      
      {/* Game Placeholder */}
      <div className={styles.gamePlaceholder}>
        <h2>🌟 AOQI Game</h2>
        <p>Chào mừng đến với thế giới Aoqi! Hãy khám phá và thu thập những linh thú mạnh mẽ nhất.</p>
      </div>
    </div>
  );
}; 