'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/components/AuthProvider';
import { userPetAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './choose-starter.module.css';

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
  effects?: any;
}

export default function ChooseStarter() {
  const { getToken, isAuthenticated, isAdmin } = useAuthContext();
  const router = useRouter();
  const [starterPets, setStarterPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (isAdmin()) {
      // Admin không cần chọn starter pet
      router.push('/');
      return;
    }

    loadStarterPets();
  }, [mounted, isAuthenticated]);

  const loadStarterPets = async () => {
    try {
      const data = await userPetAPI.getStarterPets();
      if (data.success) {
        setStarterPets(data.starterPets || []);
      } else {
        setError('Lỗi khi tải danh sách linh thú mở đầu');
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách linh thú mở đầu');
      console.error('Load starter pets error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePet = async () => {
    if (!selectedPet) {
      setError('Vui lòng chọn một linh thú');
      return;
    }

    setChoosing(true);
    try {
      const token = getToken();
      if (!token) {
        setError('Không có token xác thực');
        return;
      }

      const response = await userPetAPI.chooseStarterPet(token, selectedPet);
      if (response.success) {
        // Hiển thị thông tin về vị trí đặt pet
        const locationText = response.location === 'bag' ? 'túi' : 'kho';
        alert(`Chọn linh thú mở đầu thành công! Pet đã được đặt vào ${locationText}.`);
        router.push('/');
      } else {
        setError(response.error || 'Lỗi khi chọn linh thú');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi chọn linh thú');
      console.error('Choose starter pet error:', err);
    } finally {
      setChoosing(false);
    }
  };

  const getElementColor = (element: string) => {
    const colors: { [key: string]: string } = {
      'fire': '#ff4444',
      'water': '#4444ff',
      'wind': '#44ff44',
      'thunder': '#ffff44',
      'ice': '#44ffff',
      'grass': '#44ff44',
      'rock': '#ff8844'
    };
    return colors[element] || '#888888';
  };

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      'common': '#888888',
      'rare': '#4444ff',
      'epic': '#8844ff',
      'legendary': '#ff8844'
    };
    return colors[rarity] || '#888888';
  };

  const getElementName = (element: string) => {
    const names: { [key: string]: string } = {
      'fire': 'Hỏa',
      'water': 'Thủy',
      'wind': 'Phong',
      'thunder': 'Lôi',
      'ice': 'Băng',
      'grass': 'Thảo',
      'rock': 'Nham'
    };
    return names[element] || element;
  };

  const getRarityName = (rarity: string) => {
    const names: { [key: string]: string } = {
      'common': 'Thường',
      'rare': 'Hiếm',
      'epic': 'Sử thi',
      'legendary': 'Huyền thoại'
    };
    return names[rarity] || rarity;
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Đang tải danh sách linh thú mở đầu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🌟 Chọn Linh thú Mở đầu</h1>
        <p>Chọn một linh thú để bắt đầu cuộc phiêu lưu của bạn!</p>
        <div className={styles.infoBox}>
          <p>📦 <strong>Cơ chế đặt pet:</strong></p>
          <ul>
            <li>• Pet sẽ được ưu tiên đặt vào <strong>túi</strong> (tối đa 20 pet)</li>
            <li>• Nếu túi đầy, pet sẽ được đặt vào <strong>kho</strong></li>
            <li>• Bạn có thể di chuyển pet tự do giữa túi và kho sau này</li>
          </ul>
        </div>
        <p className={styles.warning}>⚠️ Lưu ý: Bạn chỉ có thể chọn một lần và không thể thay đổi sau này!</p>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button onClick={() => setError('')} className={styles.closeError}>×</button>
        </div>
      )}

      <div className={styles.petsGrid}>
        {starterPets.map((pet) => (
          <div 
            key={pet._id} 
            className={`${styles.petCard} ${selectedPet === pet._id ? styles.selected : ''}`}
            onClick={() => setSelectedPet(pet._id)}
          >
            <div className={styles.petImage}>
              <img src={pet.img} alt={pet.name} />
              {selectedPet === pet._id && (
                <div className={styles.selectedIndicator}>✓</div>
              )}
            </div>
            
            <div className={styles.petInfo}>
              <h3 className={styles.petName}>{pet.name}</h3>
              <p className={styles.description}>{pet.description}</p>
              
              <div className={styles.elementRarity}>
                <span 
                  className={styles.element} 
                  style={{ backgroundColor: getElementColor(pet.element) }}
                >
                  {getElementName(pet.element)}
                </span>
                <span 
                  className={styles.rarity} 
                  style={{ backgroundColor: getRarityColor(pet.rarity) }}
                >
                  {getRarityName(pet.rarity)}
                </span>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>HP:</span>
                  <span className={styles.statValue}>{pet.baseHp.toLocaleString()}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Tấn công:</span>
                  <span className={styles.statValue}>{pet.baseAttack.toLocaleString()}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Phòng thủ:</span>
                  <span className={styles.statValue}>{pet.baseDefense.toLocaleString()}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Tốc độ:</span>
                  <span className={styles.statValue}>{pet.baseSpeed.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.skills}>
                <h4>Kỹ năng:</h4>
                {pet.normalSkill && (
                  <div className={styles.skillItem}>
                    <span className={styles.skillName}>⚔️ {pet.normalSkill.name}</span>
                    <span className={styles.skillType}>Thường</span>
                  </div>
                )}
                {pet.ultimateSkill && (
                  <div className={styles.skillItem}>
                    <span className={styles.skillName}>💥 {pet.ultimateSkill.name}</span>
                    <span className={styles.skillType}>Tuyệt kỹ</span>
                  </div>
                )}
                {pet.passiveSkill && (
                  <div className={styles.skillItem}>
                    <span className={styles.skillName}>🛡️ {pet.passiveSkill.name}</span>
                    <span className={styles.skillType}>Bị động</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button 
          className={`${styles.chooseButton} ${!selectedPet || choosing ? styles.disabled : ''}`}
          onClick={handleChoosePet}
          disabled={!selectedPet || choosing}
        >
          {choosing ? 'Đang chọn...' : 'Chọn linh thú này'}
        </button>
        
        <Link href="/" className={styles.cancelButton}>
          Hủy bỏ
        </Link>
      </div>

      {starterPets.length === 0 && (
        <div className={styles.emptyState}>
          <h3>Không có linh thú mở đầu</h3>
          <p>Hiện tại chưa có linh thú mở đầu nào trong hệ thống.</p>
          <Link href="/" className={styles.button}>
            Về trang chủ
          </Link>
        </div>
      )}
    </div>
  );
} 