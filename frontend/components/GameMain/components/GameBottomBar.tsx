'use client';

import styles from '../../../app/page.module.css';

interface GameBottomBarProps {
  onPetsClick: () => void;
  onShopClick: () => void;
}

export const GameBottomBar = ({ onPetsClick, onShopClick }: GameBottomBarProps) => {
  return (
    <div className={styles.gameBottomBar}>
      <div className={styles.bottomBarLeft}>
        <button 
          className={styles.petsButton}
          onClick={onPetsClick}
          title="Túi linh thú"
        >
          <span className={styles.petsIcon}>🐾</span>
        </button>

      </div>
      
      <div className={styles.bottomBarRight}>
        <button 
          className={styles.shopButton}
          onClick={onShopClick}
          title="Cửa hàng"
        >
          <span className={styles.shopIcon}>🏪</span>
        </button>
      </div>
    </div>
  );
}; 