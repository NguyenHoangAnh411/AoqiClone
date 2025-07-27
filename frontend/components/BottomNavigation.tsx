'use client';

import styles from '../app/page.module.css';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <div className={styles.bottomNavigation}>
      <button
        className={`${styles.bottomNavButton} ${activeTab === 'pets' ? styles.active : ''}`}
        onClick={() => onTabChange('pets')}
      >
        <div className={styles.bottomNavIcon}>🐾</div>
        <span className={styles.bottomNavLabel}>Linh thú</span>
      </button>
      
      <button
        className={`${styles.bottomNavButton} ${activeTab === 'inventory' ? styles.active : ''}`}
        onClick={() => onTabChange('inventory')}
      >
        <div className={styles.bottomNavIcon}>🎒</div>
        <span className={styles.bottomNavLabel}>Túi đồ</span>
      </button>
      
      <button
        className={`${styles.bottomNavButton} ${activeTab === 'battle' ? styles.active : ''}`}
        onClick={() => onTabChange('battle')}
      >
        <div className={styles.bottomNavIcon}>⚔️</div>
        <span className={styles.bottomNavLabel}>Chiến đấu</span>
      </button>
      
      <button
        className={`${styles.bottomNavButton} ${activeTab === 'ranking' ? styles.active : ''}`}
        onClick={() => onTabChange('ranking')}
      >
        <div className={styles.bottomNavIcon}>🏆</div>
        <span className={styles.bottomNavLabel}>Xếp hạng</span>
      </button>
      
      <button
        className={`${styles.bottomNavButton} ${activeTab === 'shop' ? styles.active : ''}`}
        onClick={() => onTabChange('shop')}
      >
        <div className={styles.bottomNavIcon}>🏪</div>
        <span className={styles.bottomNavLabel}>Cửa hàng</span>
      </button>
    </div>
  );
}; 