'use client';

import { useAuth } from '../../../../lib/hooks/useAuth';
import styles from '../../../../app/page.module.css';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopModal = ({ isOpen, onClose }: ShopModalProps) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  const userCoins = user?.coins || 0;
  const userGems = user?.gems || 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.shopModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🏪 Cửa hàng</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.shopContent}>
          <div style={{ 
            padding: '1rem', 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Tài khoản của bạn:</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <span>💰 {userCoins} Coins</span>
              <span>💎 {userGems} Gems</span>
            </div>
          </div>
          
          <div className={styles.shopItem}>
            <div className={styles.itemIcon}>💊</div>
            <div className={styles.itemInfo}>
              <h4>Thuốc hồi máu</h4>
              <p>Giá: 100 💰</p>
            </div>
            <button 
              className={styles.buyButton}
              disabled={userCoins < 100}
            >
              {userCoins >= 100 ? 'Mua' : 'Không đủ'}
            </button>
          </div>
          <div className={styles.shopItem}>
            <div className={styles.itemIcon}>⚡</div>
            <div className={styles.itemInfo}>
              <h4>Thuốc hồi năng lượng</h4>
              <p>Giá: 150 💰</p>
            </div>
            <button 
              className={styles.buyButton}
              disabled={userCoins < 150}
            >
              {userCoins >= 150 ? 'Mua' : 'Không đủ'}
            </button>
          </div>
          <div className={styles.shopItem}>
            <div className={styles.itemIcon}>🎁</div>
            <div className={styles.itemInfo}>
              <h4>Gói quà đặc biệt</h4>
              <p>Giá: 10 💎</p>
            </div>
            <button 
              className={styles.buyButton}
              disabled={userGems < 10}
            >
              {userGems >= 10 ? 'Mua' : 'Không đủ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 