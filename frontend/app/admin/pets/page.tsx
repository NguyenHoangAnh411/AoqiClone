'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';
import styles from './pets.module.css';

interface Pet {
  _id: string;
  name: string;
  img: string;
  description: string;
  element: string;
  rarity: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  isActive: boolean;
  isStarter: boolean;
  createdAt: string;
  // Thông tin tính toán động
  baseCombatPower?: number;
  petClass?: string;
  rating?: number;
  // Skills
  normalSkill?: Skill;
  ultimateSkill?: Skill;
  passiveSkill?: Skill;
}

interface Skill {
  _id: string;
  name: string;
  type: string;
  power?: number;
  energyCost?: number;
  accuracy?: number;
  criticalRate?: number;
}

export default function AdminPets() {
  const { getToken, isAdmin } = useAuthContext();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    element: '',
    rarity: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadPets();
  }, [currentPage, filters, mounted]);

  const loadPets = async () => {
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

      const data = await adminAPI.getPets(token, params);
      console.log('API Response:', data); // Debug log
      setPets(data.pets || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Lỗi khi tải danh sách linh thú');
      console.error('Load pets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId: string) => {
    if (!confirm('Bạn có chắc muốn xóa linh thú này?\n\n⚠️ CẢNH BÁO:\n- Tất cả skills liên quan sẽ bị xóa\n- Tất cả UserPet records (linh thú của người chơi) sẽ bị xóa\n- Hành động này không thể hoàn tác!')) return;

    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        return;
      }
      
      const response = await adminAPI.deletePet(token, petId);
      
      // Hiển thị thông báo thành công với thông tin chi tiết
      if (response.message) {
        const skillsInfo = response.deletedSkillsCount > 0 ? `${response.deletedSkillsCount} skills` : '0 skills';
        const userPetsInfo = response.deletedUserPetsCount > 0 ? `${response.deletedUserPetsCount} UserPet records` : '0 UserPet records';
        const successMessage = `${response.message}\n- Đã xóa: ${skillsInfo}\n- Đã xóa: ${userPetsInfo}`;
        alert(successMessage);
      }
      
      loadPets(); // Reload list
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa linh thú');
      console.error('Delete pet error:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
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
        <h1>Quản lý Linh thú</h1>
        <Link href="/admin/pets/create" className={styles.addButton}>
          + Thêm Linh thú mới
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
          <label>Hệ:</label>
          <select 
            value={filters.element} 
            onChange={(e) => handleFilterChange('element', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="fire">Hỏa</option>
            <option value="water">Thủy</option>
                            <option value="wind">Phong</option>
                <option value="thunder">Lôi</option>
                <option value="ice">Băng</option>
                <option value="grass">Thảo</option>
                <option value="rock">Nham</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Độ hiếm:</label>
          <select 
            value={filters.rarity} 
            onChange={(e) => handleFilterChange('rarity', e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="common">Thường</option>
            <option value="rare">Hiếm</option>
            <option value="epic">Siêu hiếm</option>
            <option value="legendary">Huyền thoại</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tên linh thú..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Pets Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên</th>
              <th>Hệ</th>
              <th>Độ hiếm</th>
              <th>Lực chiến</th>
              <th>Starter</th>
              <th>Chỉ số cơ bản</th>
              <th>Kỹ năng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pets.map((pet) => (
              <tr key={pet._id}>
                <td>
                  <img 
                    src={pet.img} 
                    alt={pet.name} 
                    className={styles.petImage}
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIxNSIgZmlsbD0iI2NjYyIvPgogIDxwYXRoIGQ9Ik0zMCA3MCBRNTAgNTAgNzAgNzAiIHN0cm9rZT0iI2NjYyIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+CiAgPHRleHQgeD0iNTAiIHk9Ijg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iOCIgZmlsbD0iIzk5OSI+UGV0PC90ZXh0Pgo8L3N2Zz4=';
                    }}
                  />
                </td>
                <td>
                  <div className={styles.petInfo}>
                    <strong>{pet.name}</strong>
                    <p>{pet.description}</p>
                  </div>
                </td>
                <td>
                  <span className={`${styles.element} ${styles[pet.element]}`}>
                    {pet.element}
                  </span>
                </td>
                <td>
                  <span className={`${styles.rarity} ${styles[pet.rarity]}`}>
                    {pet.rarity}
                  </span>
                </td>
                <td>
                  <div className={styles.combatPower}>
                    <div className={styles.combatPowerValue}>
                      ⚔️ {pet.baseCombatPower ? pet.baseCombatPower.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.starterStatus}>
                    {pet.isStarter ? (
                      <span className={styles.starterBadge}>🌟 Starter</span>
                    ) : (
                      <span className={styles.notStarter}>-</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.stats}>
                    <div>HP: {pet.baseHp}</div>
                    <div>ATK: {pet.baseAttack}</div>
                    <div>DEF: {pet.baseDefense}</div>
                    <div>SPD: {pet.baseSpeed}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.skills}>
                    {pet.normalSkill && (
                      <div className={styles.skillItem}>
                        <span className={styles.skillType}>N:</span>
                        <span className={styles.skillName}>{pet.normalSkill.name}</span>
                        <span className={styles.skillPower}>⚔️{pet.normalSkill.power}</span>
                      </div>
                    )}
                    {pet.ultimateSkill && (
                      <div className={styles.skillItem}>
                        <span className={styles.skillType}>U:</span>
                        <span className={styles.skillName}>{pet.ultimateSkill.name}</span>
                        <span className={styles.skillPower}>⚔️{pet.ultimateSkill.power}</span>
                      </div>
                    )}
                    {pet.passiveSkill && (
                      <div className={styles.skillItem}>
                        <span className={styles.skillType}>P:</span>
                        <span className={styles.skillName}>{pet.passiveSkill.name}</span>
                      </div>
                    )}
                    {!pet.normalSkill && !pet.ultimateSkill && !pet.passiveSkill && (
                      <div className={styles.noSkills}>Chưa có kỹ năng</div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`${styles.status} ${pet.isActive ? styles.active : styles.inactive}`}>
                    {pet.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/admin/pets/${pet._id}`} className={styles.editButton}>
                      Sửa
                    </Link>
                    <button 
                      onClick={() => handleDelete(pet._id)}
                      className={styles.deleteButton}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pets.length === 0 && (
          <div className={styles.noData}>
            <p>Không tìm thấy linh thú nào</p>
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