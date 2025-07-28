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
      console.log('useAuth - Starting checkAuth...');
      
      if (typeof window === 'undefined') {
        console.log('useAuth - Window is undefined, setting loading to false');
        setLoading(false);
        return;
      }
      
      const userToken = localStorage.getItem('userToken');
      console.log('useAuth - User token from localStorage:', userToken ? 'exists' : 'not found');
      
      if (!userToken) {
        // Thử load user data từ localStorage nếu có
        const savedUserData = localStorage.getItem('userData');
        console.log('useAuth - Saved user data from localStorage:', savedUserData ? 'exists' : 'not found');
        
        if (savedUserData) {
          try {
            const parsedUserData = JSON.parse(savedUserData);
            console.log('useAuth - Setting user from localStorage:', parsedUserData);
            setUser(parsedUserData);
          } catch (error) {
            console.error('useAuth - Error parsing saved user data:', error);
            localStorage.removeItem('userData');
          }
        }
        setLoading(false);
        return;
      }

      try {
        console.log('useAuth - Fetching user data from API...');
        const response = await userAPI.getUserData(userToken);
        console.log('useAuth - API response:', response);
        console.log('useAuth - Response type:', typeof response);
        console.log('useAuth - Response keys:', response ? Object.keys(response) : 'null');
        
        // Extract user data from response
        const userData = response.user || response;
        console.log('useAuth - Extracted user data:', userData);
        console.log('useAuth - User data type:', typeof userData);
        console.log('useAuth - User data keys:', userData ? Object.keys(userData) : 'null');
        console.log('useAuth - User username:', userData?.username);
        console.log('useAuth - User coins:', userData?.coins);
        console.log('useAuth - User gems:', userData?.gems);
        
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (error) {
        console.error('useAuth - Error fetching user data:', error);
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

  // Debug logging for user state changes
  useEffect(() => {
    console.log('useAuth - User state changed:', user);
  }, [user]);

  useEffect(() => {
    console.log('useAuth - Loading state changed:', loading);
  }, [loading]);

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
          // Kiểm tra trường hasChosenStarterPet từ user data
          if (userData && !userData.hasChosenStarterPet) {
            return { success: true, user: userData, needsStarterPet: true };
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