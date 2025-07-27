'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginResult, setLoginResult] = useState<any>(null);

  // Theo dõi thay đổi state và redirect khi cần thiết
  useEffect(() => {
    if (loginResult?.success && user && isAuthenticated()) {
      console.log('=== REDIRECT DEBUG ===');
      console.log('Login result:', loginResult);
      console.log('User from context:', user);
      console.log('Is authenticated:', isAuthenticated());
      console.log('=====================');
      
      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        // Kiểm tra xem user có cần chọn starter pet không
        if (loginResult.needsStarterPet) {
          router.push('/choose-starter');
        } else {
          // User thường sẽ được redirect về trang chính
          router.push('/');
        }
      }
    }
  }, [loginResult, user, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.username, formData.password);
      
      console.log('=== LOGIN PAGE DEBUG ===');
      console.log('Login result:', result);
      console.log('==================');
      
      if (result.success) {
        setLoginResult(result);
        console.log('Login successful, waiting for state update...');
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>Đăng Nhập</h1>
          <p>Chào mừng bạn trở lại!</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Nhập tên đăng nhập"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className={styles.link}>
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 