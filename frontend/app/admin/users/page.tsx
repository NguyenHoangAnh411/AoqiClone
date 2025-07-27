'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';
import styles from './users.module.css';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  level: number;
  exp: number;
  score: number;
  coins: number;
  gems: number;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

export default function AdminUsers() {
  const { getToken, isAdmin } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    isActive: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadUsers();
  }, [mounted, currentPage, filters]);

  const loadUsers = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        setLoading(false);
        return;
      }

      const params = {
        page: currentPage,
        limit: 10,
        ...filters
      };

      const data = await adminAPI.getUsers(token, params);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách người dùng');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!mounted) {
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Người dùng</h1>
        <Link href="/admin/dashboard" className={styles.backButton}>
          ← Quay lại Dashboard
        </Link>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError('')} className={styles.closeError}>×</button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Vai trò:</label>
          <select 
            value={filters.role} 
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="user">Người dùng</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Trạng thái:</label>
          <select 
            value={filters.isActive} 
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Không hoạt động</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tên đăng nhập hoặc email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Thông tin cơ bản</th>
              <th>Vai trò</th>
              <th>Chỉ số game</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Đăng nhập cuối</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className={styles.userInfo}>
                    <strong>{user.username}</strong>
                    <p>{user.email}</p>
                  </div>
                </td>
                <td>
                  <span className={`${styles.role} ${styles[user.role]}`}>
                    {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                  </span>
                </td>
                <td>
                  <div className={styles.gameStats}>
                    <div>Level: {user.level}</div>
                    <div>EXP: {user.exp}</div>
                    <div>Score: {user.score}</div>
                    <div>Coins: {user.coins}</div>
                    <div>Gems: {user.gems}</div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}>
                    {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>
                  <span className={styles.date}>
                    {formatDate(user.createdAt)}
                  </span>
                </td>
                <td>
                  <span className={styles.date}>
                    {formatDate(user.lastLogin)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className={styles.noData}>
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.pageButton}
          >
            Trước
          </button>
          
          <span className={styles.pageInfo}>
            Trang {currentPage} / {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageButton}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
} 