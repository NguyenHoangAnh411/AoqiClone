'use client';

import styles from '../app/page.module.css';

interface MenuButtonProps {
  onClick: () => void;
}

export const MenuButton = ({ onClick }: MenuButtonProps) => {
  return (
    <button className={styles.menuButton} onClick={onClick}>
      <div className={styles.menuIcon}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  );
}; 