'use client';

import styles from '../../../../app/page.module.css';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestModal = ({ isOpen, onClose }: QuestModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.questModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>📋 Nhiệm vụ</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.questContent}>
          <div className={styles.questItem}>
            <div className={styles.questIcon}>🎯</div>
            <div className={styles.questInfo}>
              <h4>Nhiệm vụ đầu tiên</h4>
              <p>Hoàn thành trận chiến đầu tiên</p>
              <div className={styles.questProgress}>
                <span>Tiến độ: 0/1</span>
              </div>
            </div>
          </div>
          <div className={styles.questItem}>
            <div className={styles.questIcon}>🐾</div>
            <div className={styles.questInfo}>
              <h4>Thu thập linh thú</h4>
              <p>Sở hữu 3 linh thú khác nhau</p>
              <div className={styles.questProgress}>
                <span>Tiến độ: 1/3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 