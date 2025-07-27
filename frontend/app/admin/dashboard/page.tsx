'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { adminAPI, userAPI } from '@/lib/api';
import Link from 'next/link';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalUsers: number;
  totalPets: number;
  totalSkills: number;
  totalBattles: number;
  recentUsers: any[];
  recentPets: any[];
}

export default function AdminDashboard() {
  const { user, getToken, isAdmin, loading: authLoading } = useAuthContext();

  // Function để force load user data từ localStorage
  const forceLoadUserData = async () => {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      try {
        const userData = await userAPI.getUserData(userToken);
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: { userData, token: userToken } 
        }));
      } catch (error) {
        console.error('Error force loading user data:', error);
      }
    }
  };
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;
    
    const loadDashboard = async () => {
      try {
        const token = getToken();
        if (!token) {
          setError('Không có token xác thực');
          setLoading(false);
          return;
        }

        const data = await adminAPI.getDashboard(token);
        setStats(data);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Lỗi khi tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user && isAdmin()) {
      loadDashboard();
    }
  }, [getToken, mounted, user, isAdmin, authLoading]);

  if (!mounted || authLoading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Không có quyền truy cập</h2>
          <p>Bạn cần quyền admin để truy cập trang này.</p>
          <Link href="/" className={styles.button}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.button}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Chào mừng, {user?.username || 'Admin'}!</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{stats?.totalUsers || 0}</h3>
            <p>Tổng người dùng</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🐾</div>
          <div className={styles.statContent}>
            <h3>{stats?.totalPets || 0}</h3>
            <p>Tổng linh thú</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚔️</div>
          <div className={styles.statContent}>
            <h3>{stats?.totalSkills || 0}</h3>
            <p>Tổng kỹ năng</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏆</div>
          <div className={styles.statContent}>
            <h3>{stats?.totalBattles || 0}</h3>
            <p>Tổng trận đấu</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2>Quản lý nhanh</h2>
        <div className={styles.actionGrid}>
          <Link href="/admin/pets" className={styles.actionCard}>
            <div className={styles.actionIcon}>🐾</div>
            <h3>Quản lý Linh thú</h3>
            <p>Thêm, sửa, xóa linh thú và kỹ năng</p>
          </Link>

          <Link href="/admin/users" className={styles.actionCard}>
            <div className={styles.actionIcon}>👥</div>
            <h3>Quản lý Người dùng</h3>
            <p>Xem danh sách và thống kê người dùng</p>
          </Link>

          <Link href="/admin/battles" className={styles.actionCard}>
            <div className={styles.actionIcon}>⚔️</div>
            <h3>Lịch sử Chiến đấu</h3>
            <p>Xem thống kê và lịch sử trận đấu</p>
          </Link>

          <Link href="/admin/skills" className={styles.actionCard}>
            <div className={styles.actionIcon}>🔮</div>
            <h3>Quản lý Kỹ năng</h3>
            <p>Tạo và quản lý các kỹ năng</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.section}>
        <h2>Hoạt động gần đây</h2>
        <div className={styles.activityGrid}>
          <div className={styles.activityCard}>
            <h3>Người dùng mới</h3>
            <div className={styles.activityList}>
              {stats?.recentUsers?.slice(0, 5).map((user: any, index: number) => (
                <div key={index} className={styles.activityItem}>
                  <span className={styles.activityText}>{user.username}</span>
                  <span className={styles.activityTime}>
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
              {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                <p className={styles.noData}>Chưa có người dùng mới</p>
              )}
            </div>
          </div>

          <div className={styles.activityCard}>
            <h3>Linh thú mới</h3>
            <div className={styles.activityList}>
              {stats?.recentPets?.slice(0, 5).map((pet: any, index: number) => (
                <div key={index} className={styles.activityItem}>
                  <span className={styles.activityText}>{pet.name}</span>
                  <span className={styles.activityTime}>
                    {new Date(pet.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
              {(!stats?.recentPets || stats.recentPets.length === 0) && (
                <p className={styles.noData}>Chưa có linh thú mới</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 