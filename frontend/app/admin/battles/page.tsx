'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';
import styles from './battles.module.css';

interface Battle {
  _id: string;
  player1: {
    _id: string;
    username: string;
  };
  player1Pet: {
    _id: string;
    nickname: string;
    pet: {
      name: string;
      element: string;
    };
  };
  player2: {
    _id: string;
    username: string;
  };
  player2Pet: {
    _id: string;
    nickname: string;
    pet: {
      name: string;
      element: string;
    };
  };
  winner: {
    _id: string;
    username: string;
  };
  loser: {
    _id: string;
    username: string;
  };
  result: string;
  battleType: string;
  duration: number;
  rounds: number;
  expGained: number;
  coinsGained: number;
  startedAt: string;
  endedAt: string;
  createdAt: string;
}

export default function AdminBattles() {
  const { getToken, isAdmin } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    battleType: '',
    result: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadBattles();
  }, [mounted, currentPage, filters]);

  const loadBattles = async () => {
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

      const data = await adminAPI.getBattles(token, params);
      setBattles(data.battles || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải lịch sử chiến đấu');
      console.error('Load battles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'player1_win': return 'Người chơi 1 thắng';
      case 'player2_win': return 'Người chơi 2 thắng';
      case 'draw': return 'Hòa';
      case 'disconnect': return 'Ngắt kết nối';
      default: return result;
    }
  };

  const getBattleTypeLabel = (type: string) => {
    switch (type) {
      case 'pvp': return 'PvP';
      case 'pve': return 'PvE';
      case 'tournament': return 'Giải đấu';
      case 'friendly': return 'Thân thiện';
      default: return type;
    }
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
        <h1>Lịch sử Chiến đấu</h1>
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
          <label>Loại trận:</label>
          <select 
            value={filters.battleType} 
            onChange={(e) => handleFilterChange('battleType', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="pvp">PvP</option>
            <option value="pve">PvE</option>
            <option value="tournament">Giải đấu</option>
            <option value="friendly">Thân thiện</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Kết quả:</label>
          <select 
            value={filters.result} 
            onChange={(e) => handleFilterChange('result', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="player1_win">Người chơi 1 thắng</option>
            <option value="player2_win">Người chơi 2 thắng</option>
            <option value="draw">Hòa</option>
            <option value="disconnect">Ngắt kết nối</option>
          </select>
        </div>
      </div>

      {/* Battles Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Người chơi 1</th>
              <th>Người chơi 2</th>
              <th>Kết quả</th>
              <th>Loại trận</th>
              <th>Thời gian</th>
              <th>Phần thưởng</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {battles.map((battle) => (
              <tr key={battle._id}>
                <td>
                  <div className={styles.playerInfo}>
                    <strong>{battle.player1.username}</strong>
                    <div className={styles.petInfo}>
                      <span className={`${styles.element} ${styles[battle.player1Pet.pet.element]}`}>
                        {battle.player1Pet.pet.element}
                      </span>
                      <span>{battle.player1Pet.nickname || battle.player1Pet.pet.name}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.playerInfo}>
                    <strong>{battle.player2.username}</strong>
                    <div className={styles.petInfo}>
                      <span className={`${styles.element} ${styles[battle.player2Pet.pet.element]}`}>
                        {battle.player2Pet.pet.element}
                      </span>
                      <span>{battle.player2Pet.nickname || battle.player2Pet.pet.name}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.resultInfo}>
                    <span className={`${styles.result} ${styles[battle.result]}`}>
                      {getResultLabel(battle.result)}
                    </span>
                    {battle.winner && (
                      <div className={styles.winner}>
                        Người thắng: {battle.winner.username}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`${styles.battleType} ${styles[battle.battleType]}`}>
                    {getBattleTypeLabel(battle.battleType)}
                  </span>
                </td>
                <td>
                  <div className={styles.battleStats}>
                    <div>Thời gian: {formatDuration(battle.duration)}</div>
                    <div>Lượt: {battle.rounds}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.rewards}>
                    <div>EXP: {battle.expGained}</div>
                    <div>Coins: {battle.coinsGained}</div>
                  </div>
                </td>
                <td>
                  <span className={styles.date}>
                    {formatDate(battle.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {battles.length === 0 && (
          <div className={styles.noData}>
            <p>Không tìm thấy trận đấu nào</p>
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