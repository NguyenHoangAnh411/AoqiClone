'use client';

import { useAuthContext } from './AuthProvider';
import styles from '../app/page.module.css';

interface PlayerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPets: any[];
}

export const PlayerInfoModal = ({ isOpen, onClose, userPets }: PlayerInfoModalProps) => {
  const { user, logout } = useAuthContext();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.playerInfoModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>👤 Thông tin người chơi</h2>
          <button onClick={onClose} className={styles.closeModalButton}>×</button>
        </div>
        
        <div className={styles.playerInfo}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              <span>{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
            <h3>{user?.username}</h3>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
          
          <div className={styles.statsSection}>
            <h4>📊 Thống kê</h4>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Level:</span>
                <span className={styles.statValue}>1</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>EXP:</span>
                <span className={styles.statValue}>0/100</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Linh thú:</span>
                <span className={styles.statValue}>{userPets.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Chiến thắng:</span>
                <span className={styles.statValue}>0</span>
              </div>
            </div>
          </div>
          
          <div className={styles.actionsSection}>
            <button onClick={logout} className={styles.logoutButton}>
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 