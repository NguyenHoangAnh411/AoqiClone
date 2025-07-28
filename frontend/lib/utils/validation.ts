// Validation utility functions

export const validation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidUsername: (username: string): boolean => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  },
  
  isValidPassword: (password: string): boolean => {
    return password.length >= 6;
  },
  
  isStrongPassword: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  },
  
  isNotEmpty: (value: string): boolean => {
    return value.trim().length > 0;
  },
  
  isValidFormationName: (name: string): boolean => {
    return name.trim().length >= 1 && name.trim().length <= 50;
  },
  
  isValidPosition: (position: number): boolean => {
    return position >= 1 && position <= 9 && Number.isInteger(position);
  },
  
  isValidPetId: (id: string): boolean => {
    return typeof id === 'string' && id.length > 0;
  },
  
  isValidFormationId: (id: string): boolean => {
    return typeof id === 'string' && id.length > 0;
  },
};

export const getValidationError = (field: string, value: any): string | null => {
  switch (field) {
    case 'email':
      return !validation.isValidEmail(value) ? 'Email không hợp lệ' : null;
    case 'username':
      return !validation.isValidUsername(value) ? 'Tên người dùng phải từ 3-20 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới' : null;
    case 'password':
      return !validation.isValidPassword(value) ? 'Mật khẩu phải có ít nhất 6 ký tự' : null;
    case 'formationName':
      return !validation.isValidFormationName(value) ? 'Tên đội hình phải từ 1-50 ký tự' : null;
    case 'position':
      return !validation.isValidPosition(value) ? 'Vị trí phải từ 1-9' : null;
    default:
      return null;
  }
}; 