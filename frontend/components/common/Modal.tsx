import React, { useEffect } from 'react';
import styles from '../../app/page.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  className = ''
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={`${styles.modal} ${styles[`modal${size.charAt(0).toUpperCase() + size.slice(1)}`]} ${className}`}>
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && <h3 className={styles.modalTitle}>{title}</h3>}
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className={styles.closeButton}
                aria-label="Đóng modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
}; 