import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, userPetAPI, userAPI } from '@/lib/api';

interface User {
  _id?: string;
  userId?: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  score?: number;
  coins?: number;
  gems?: number;
  hasChosenStarterPet?: boolean;
  [key: string]: any;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

    // Kiểm tra token khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
        // Thử load user data từ localStorage nếu có
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
          try {
            setUser(JSON.parse(savedUserData));
          } catch (error) {
            localStorage.removeItem('userData');
          }
        }
        setLoading(false);
        return;
      }

      try {
        const userData = await userAPI.getUserData(userToken);
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (error) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Sync state between tabs/pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (error) {
          localStorage.removeItem('userData');
        }
      }
    };

    const handleUserDataUpdate = (e: CustomEvent) => {
      if (typeof e.detail === 'object' && e.detail.userData) {
        setUser(e.detail.userData);
        if (e.detail.token) {
          setToken(e.detail.token);
        }
      } else {
        setUser(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const data = await authAPI.login({ username, password });
      
      if (!data.token) {
        return { success: false, error: data.error };
      }

      // Lưu token và role
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userRole', data.role);
      setToken(data.token);

      // Load user data từ token
      try {
        const userData = await userAPI.getUserData(data.token);
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Sync state ngay lập tức
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: { userData, token: data.token } 
        }));

        // Kiểm tra starter pet cho user thường
        if (data.role === 'user') {
          try {
            const starterPetData = await userPetAPI.checkStarterPetStatus(data.token);
            if (starterPetData.success && !starterPetData.hasChosenStarterPet) {
              return { success: true, user: userData, needsStarterPet: true };
            }
          } catch (error) {
            console.error('Error checking starter pet status:', error);
          }
        }

        return { success: true, user: userData };
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser(data); // Fallback
        return { success: true, user: data };
      }
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra' };
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      const data = await authAPI.register(userData);
      
      if (data.token) {
        // Lưu token vào localStorage
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRole', data.role);

        // Cập nhật state
        setToken(data.token);
        setUser(data);

        // User mới đăng ký sẽ được redirect đến trang chọn starter pet
        if (data.role === 'user') {
          router.push('/choose-starter');
        }

        return { success: true, user: data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra' };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    // Clear state
    setUser(null);
    setToken(null);
    
    // Force re-render by dispatching event
    window.dispatchEvent(new CustomEvent('userDataUpdated', { 
      detail: null 
    }));
    
    // Redirect to home page
    router.push('/');
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const isAdmin = () => {
    // Ưu tiên user từ state, nếu không có thì kiểm tra localStorage
    if (user?.role === 'admin') return true;
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') === 'admin';
    }
    
    return false;
  };

  const getUserRole = () => {
    // Ưu tiên user từ state, nếu không có thì lấy từ localStorage
    if (user?.role) return user.role;
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    
    return null;
  };

  const getToken = () => {
    // Ưu tiên token từ state, nếu không có thì lấy từ localStorage
    if (token) return token;
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken');
    }
    
    return null;
  };

  return {
    user,
    loading,
    token,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    getUserRole,
    getToken
  };
}; 