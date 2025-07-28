import React from 'react';
import styles from '../../app/page.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Đang tải...',
  className = ''
}) => {
  return (
    <div className={`${styles.loadingSpinner} ${styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`]} ${className}`}>
      <div className={styles.spinnerInner}></div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
}; 