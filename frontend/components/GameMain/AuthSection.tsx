'use client';

import { useState } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import styles from '../../app/page.module.css';

export const AuthSection = () => {
  const { login, register } = useAuthContext();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(loginData.username, loginData.password);
      setShowLogin(false);
      setLoginData({ username: '', password: '' });
    } catch (error: any) {
      setError(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register(registerData);
      setShowRegister(false);
      setShowLogin(true);
      setRegisterData({ username: '', email: '', password: '' });
    } catch (error: any) {
      setError(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginForm}>
      
      {!showLogin && !showRegister ? (
        <div className={styles.welcomeButtons}>
          <button 
            onClick={() => setShowLogin(true)}
            className={styles.loginButton}
          >
            Đăng nhập để chơi
          </button>
          <button 
            onClick={() => setShowRegister(true)}
            className={styles.registerButton}
          >
            Đăng ký tài khoản mới
          </button>
        </div>
      ) : showLogin ? (
        <form onSubmit={handleLogin} className={styles.authForm}>
          <h3>Đăng nhập</h3>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.formGroup}>
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Mật khẩu:</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowLogin(false);
                setError('');
              }}
              className={styles.cancelButton}
            >
              Hủy
            </button>
          </div>
          <div className={styles.switchForm}>
            <span>Chưa có tài khoản? </span>
            <button 
              type="button" 
              onClick={() => {
                setShowLogin(false);
                setShowRegister(true);
                setError('');
              }}
              className={styles.switchButton}
            >
              Đăng ký ngay
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className={styles.authForm}>
          <h3>Đăng ký</h3>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.formGroup}>
            <label>Tên đăng nhập:</label>
            <input
              type="text"
              value={registerData.username}
              onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              value={registerData.email}
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              required
              placeholder="Nhập email của bạn"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Mật khẩu:</label>
            <input
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowRegister(false);
                setError('');
              }}
              className={styles.cancelButton}
            >
              Hủy
            </button>
          </div>
          <div className={styles.switchForm}>
            <span>Đã có tài khoản? </span>
            <button 
              type="button" 
              onClick={() => {
                setShowRegister(false);
                setShowLogin(true);
                setError('');
              }}
              className={styles.switchButton}
            >
              Đăng nhập ngay
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 