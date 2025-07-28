'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../../components/AuthProvider';
import styles from '../../../../app/page.module.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, loading, logout } = useAuthContext();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Debug logging
  useEffect(() => {
    console.log('ProfileModal - User data:', user);
    console.log('ProfileModal - Loading:', loading);
  }, [user, loading]);

  const handleClose = () => {
    setIsClosing(true);
    // Đợi animation hoàn thành rồi mới gọi onClose
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400); // Thời gian animation
  };

  const handleLogout = () => {
    handleClose();
    // Đợi modal đóng xong rồi mới logout
    setTimeout(() => {
      logout();
    }, 400);
  };

  if (!isOpen) return null;

  // Tính toán thông tin từ user data
  const userCoins = user?.coins || 0;
  const userGems = user?.gems || 0;
  const userScore = user?.score || 0;
  const petsCount = user?.pets?.length || 0;
  const username = user?.username || 'Unknown';
  const email = user?.email || '';
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '';

  return (
    <div className={styles.profileModalOverlay} onClick={handleClose}>
      <div 
        className={`${styles.profileModal} ${isClosing ? styles.profileModalClosing : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>👤 Hồ sơ người chơi</h3>
        </div>
        <div className={styles.profileContent}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <div className={styles.profileAvatar}>
                <div className={styles.avatar}>👤</div>
                <h4>{username}</h4>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.5rem 0' }}>
                  {email}
                </p>
              </div>
              <div className={styles.profileStats}>
                <div className={styles.statRow}>
                  <span>Điểm số:</span>
                  <span>{userScore}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Linh thú:</span>
                  <span>{petsCount}</span>
                </div>
                <div className={styles.statRow}>
                  <span>💰 Coins:</span>
                  <span>{userCoins}</span>
                </div>
                <div className={styles.statRow}>
                  <span>💎 Gems:</span>
                  <span>{userGems}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Ngày tham gia:</span>
                  <span>{joinDate}</span>
                </div>
              </div>
            </>
          )}
          
          {/* Logout Button */}
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid #eee',
            textAlign: 'center'
          }}>
            <button 
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 