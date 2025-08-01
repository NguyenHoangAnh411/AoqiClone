'use client';
import { useState } from 'react';
import { useAuth } from '@/lib';

export default function AuthForm() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form data
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // Register form data
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(loginData.username, loginData.password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register(registerData.username, registerData.email, registerData.password);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md">
        {/* Tabs Header */}
        <div className="flex border-b border-slate-600">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${
              activeTab === 'login'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            🔐 Đăng Nhập
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${
              activeTab === 'register'
                ? 'text-green-400 border-b-2 border-green-400 bg-slate-700/50'
                : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
            }`}
          >
            ⚔️ Đăng Ký
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  👤 Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 transition-all"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🔒 Mật khẩu
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400 transition-all"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg font-semibold"
              >
                {loading ? '⏳ Đang đăng nhập...' : '🎮 Vào Game'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  👤 Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 transition-all"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 transition-all"
                  placeholder="Nhập email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🔒 Mật khẩu
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 transition-all"
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🔐 Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-slate-400 transition-all"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 shadow-lg font-semibold"
              >
                {loading ? '⏳ Đang đăng ký...' : '⚔️ Đăng Ký Ngay'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
} 