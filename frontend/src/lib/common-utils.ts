// Common utilities chỉ cho Auth & User

// Date utilities
export const dateUtils = {
  // Format date to Vietnamese locale
  formatDate: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('vi-VN');
  },

  // Format date with time
  formatDateTime: (date: string | Date): string => {
    return new Date(date).toLocaleString('vi-VN');
  },
};

// Number utilities
export const numberUtils = {
  // Format number with commas
  formatNumber: (num: number): string => {
    return num.toLocaleString('vi-VN');
  },

  // Format currency
  formatCurrency: (amount: number, currency: string = 'VND'): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },
};

// String utilities
export const stringUtils = {
  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Truncate text with ellipsis
  truncate: (str: string, length: number): string => {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
  },
};

// Validation utilities
export const validationUtils = {
  // Validate email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isStrongPassword: (password: string): boolean => {
    return password.length >= 6; // Minimum 6 characters
  },
}; 