import React from 'react';
import styles from '../../app/page.module.css';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
  showCloseButton?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onClose, 
  className = '',
  showCloseButton = true
}) => {
  if (!message) return null;

  return (
    <div className={`${styles.errorMessage} ${className}`}>
      <span className={styles.errorText}>{message}</span>
      {showCloseButton && onClose && (
        <button 
          onClick={onClose} 
          className={styles.errorCloseButton}
          aria-label="Đóng thông báo lỗi"
        >
          ×
        </button>
      )}
    </div>
  );
}; 