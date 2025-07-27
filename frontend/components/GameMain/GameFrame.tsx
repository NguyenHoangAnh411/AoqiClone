'use client';

import { ReactNode } from 'react';
import styles from '../../app/page.module.css';

interface GameFrameProps {
  children: ReactNode;
}

export const GameFrame = ({ children }: GameFrameProps) => {
  return (
    <div className={styles.gameFrame}>
      {/* Central Game Frame */}
      <div className={styles.centralGameFrame}>
        {children}
      </div>
    </div>
  );
}; 