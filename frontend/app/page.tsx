'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { GameFrame } from '@/components/GameMain/GameFrame';
import { AuthSection } from '@/components/GameMain/AuthSection';
import { GameInterface } from '@/components/GameMain/GameInterface';
import styles from './page.module.css';

export default function GamePage() {
  const { isAuthenticated } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Game Frame */}
      <GameFrame>
        {!isAuthenticated() ? (
          <AuthSection />
        ) : (
          <GameInterface />
        )}
      </GameFrame>
    </div>
  );
}
