'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../../components/AuthProvider';
import { userPetAPI } from '../../../../lib/api';
import { StorageModal } from './StorageModal';
import ExpDisplay from '../../../../components/ExpDisplay';
import styles from '../../../../app/page.module.css';

interface PetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Function để xác định màu khung dựa trên rarity
const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return '#9e9e9e'; // Gray
    case 'uncommon':
      return '#4caf50'; // Green
    case 'rare':
      return '#2196f3'; // Blue
    case 'epic':
      return '#9c27b0'; // Purple
    case 'legendary':
      return '#ff9800'; // Orange
    case 'mythic':
      return '#f44336'; // Red
    default:
      return '#9e9e9e'; // Default gray
  }
};

export const PetsModal = ({ isOpen, onClose }: PetsModalProps) => {
  const { user, getToken } = useAuthContext();
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'upgrade'>('stats');
  const [bagPets, setBagPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bagInfo, setBagInfo] = useState<any>(null);
  const [movingPet, setMovingPet] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  // Load bag pets khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadBagPets();
    }
  }, [isOpen]);

  const loadBagPets = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await userPetAPI.getBagPets(token);
      
      if (response.success) {
        setBagPets(response.bagPets || []);
        setBagInfo(response.bagInfo);
        
        // Chọn pet đầu tiên làm default nếu chưa có pet nào được chọn
        if (!selectedPet && response.bagPets && response.bagPets.length > 0) {
          setSelectedPet(response.bagPets[0]);
        }
      }
    } catch (error) {
      console.error('Error loading bag pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const movePetToStorage = async (userPetId: string) => {
    try {
      setMovingPet(true);
      const token = getToken();
      if (!token) return;

      const response = await userPetAPI.movePetToStorage(token, userPetId);
      if (response.success) {
        // Reload bag pets
        await loadBagPets();
        // Bỏ chọn pet nếu đã di chuyển
        if (selectedPet?._id === userPetId) {
          setSelectedPet(null);
        }
      }
    } catch (error) {
      console.error('Error moving pet to storage:', error);
    } finally {
      setMovingPet(false);
    }
  };

  const handleStoragePetMoved = () => {
    // Reload bag pets khi có pet được di chuyển từ storage
    loadBagPets();
  };

  if (!isOpen) return null;

  // Tạo mảng slots dựa trên maxSize từ bagInfo
  const maxSlots = bagInfo?.max || 20;
  const petSlots = [
    ...bagPets,
    ...Array.from({ length: Math.max(0, maxSlots - bagPets.length) }, (_, i) => ({
      _id: `empty-${i}`,
      isEmpty: true
    }))
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.petsModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🐾 Túi linh thú</h3>
          {bagInfo && (
            <div className={styles.bagInfo}>
              <span className={styles.bagCount}>{bagInfo.current}/{bagInfo.max}</span>
              <span className={styles.bagStatus}>
                {bagInfo.current >= bagInfo.max ? '🟡 Đầy' : '🟢 Còn chỗ'}
              </span>
            </div>
          )}
          <div className={styles.modalHeaderActions}>
            <button 
              className={styles.storageButton}
              onClick={() => setIsStorageOpen(true)}
              title="Mở kho linh thú"
            >
              📦 Kho
            </button>
            <button 
              className={styles.closeButton}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>
        
        <div className={styles.petsModalContent}>
          {/* Top Section */}
          <div className={styles.petsTopSection}>
            {/* Left: Pet Display Area */}
            <div className={styles.petDisplayArea}>
              {selectedPet ? (
                <div 
                  className={styles.petDisplay}
                  style={{
                    borderColor: getRarityColor(selectedPet.pet?.rarity || 'common')
                  }}
                >

                  
                  <img 
                    src={selectedPet.pet?.img || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGV0PC90ZXh0Pgo8L3N2Zz4K"} 
                    className={styles.petDisplayImage}
                    alt={selectedPet.pet?.name || "Pet"}
                    onError={(e) => {
                      console.log('Image failed to load:', selectedPet.pet?.img);
                      e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGV0PC90ZXh0Pgo8L3N2Zz4K";
                    }}
                  />
                </div>
              ) : (
                <div className={styles.petDisplayPlaceholder}>
                  <p>Chọn một linh thú để xem chi tiết</p>
                </div>
              )}
            </div>

            {/* Right: Information Area with Tabs */}
            <div className={styles.petInfoArea}>
              <div className={styles.petTabs}>
                <button 
                  className={`${styles.petTab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  📊 Chỉ số
                </button>
                <button 
                  className={`${styles.petTab} ${activeTab === 'upgrade' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('upgrade')}
                >
                  ⚡ Nâng cấp
                </button>
              </div>

              <div className={styles.petTabContent}>
                {activeTab === 'stats' && selectedPet && (
                  <div className={styles.petStatsTab}>
                    <div className={styles.petStatsHeader}>
                      <h4>{selectedPet.pet?.name || 'Unknown Pet'}</h4>
                      <div className={styles.petActions}>
                        <button 
                          className={styles.moveToStorageBtn}
                          onClick={() => movePetToStorage(selectedPet._id)}
                          disabled={movingPet}
                        >
                          {movingPet ? '⏳' : '📦'} Chuyển vào kho
                        </button>
                      </div>
                    </div>
                    

                    
                    {/* Exp Display - Thay thế trường Level */}
                    <ExpDisplay
                      currentExp={selectedPet.exp || 0}
                      expNeeded={selectedPet.expNeededForNextLevel || 100}
                      canLevelUp={selectedPet.canLevelUp || false}
                      level={selectedPet.level || 1}
                      progressPercentage={selectedPet.progressPercentage || 0}
                      showProgressBar={true}
                    />
                    
                    <div className={styles.petStatsGrid}>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>HP:</span>
                        <span className={styles.petStatValue}>{selectedPet.hp || 0}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Attack:</span>
                        <span className={styles.petStatValue}>{selectedPet.attack || 0}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Defense:</span>
                        <span className={styles.petStatValue}>{selectedPet.defense || 0}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Speed:</span>
                        <span className={styles.petStatValue}>{selectedPet.speed || 0}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Accuracy:</span>
                        <span className={styles.petStatValue}>{selectedPet.accuracy || 0}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Evasion:</span>
                        <span className={styles.petStatValue}>{selectedPet.evasion || 0}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Critical Rate:</span>
                        <span className={styles.petStatValue}>{selectedPet.criticalRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'upgrade' && selectedPet && (
                  <div className={styles.petUpgradeTab}>
                    <h4>Nâng cấp linh thú</h4>
                    
                    {/* Exp Display for Upgrade Tab */}
                    <ExpDisplay
                      currentExp={selectedPet.exp}
                      expNeeded={selectedPet.expNeededForNextLevel || 100}
                      canLevelUp={selectedPet.canLevelUp || false}
                      level={selectedPet.level}
                      progressPercentage={selectedPet.progressPercentage || 0}
                      showProgressBar={true}
                    />
                    
                    <div className={styles.upgradeInfo}>
                      <p>EXP hiện tại: {selectedPet.exp}</p>
                      <p>EXP cần để level up: {selectedPet.expNeededForNextLevel || 100}</p>
                    </div>
                    <div className={styles.upgradeItems}>
                      <h5>Vật phẩm nâng cấp:</h5>
                      <div className={styles.upgradeItem}>
                        <span>💊 Thuốc tăng EXP</span>
                        <button className={styles.useButton}>Sử dụng</button>
                      </div>
                      <div className={styles.upgradeItem}>
                        <span>⭐ Đá tăng cấp</span>
                        <button className={styles.useButton}>Sử dụng</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Pet List */}
          <div className={styles.petListArea}>
            <div className={styles.petListHeader}>
              <h4>Danh sách linh thú trong túi</h4>
              {loading && <span className={styles.loadingText}>Đang tải...</span>}
            </div>
            {petSlots.length > 0 ? (
              <div className={styles.petList}>
                {petSlots.map((slot: any, index: number) => (
                  <div 
                    key={slot._id || index} 
                    className={`${styles.petListItem} ${!slot.isEmpty && selectedPet?._id === slot._id ? styles.selectedPet : ''} ${slot.isEmpty ? styles.emptySlot : ''}`}
                    onClick={() => !slot.isEmpty && setSelectedPet(slot)}
                  >
                    {slot.isEmpty ? (
                      <div className={styles.emptySlotContent}>
                        <span className={styles.plusIcon}>+</span>
                        <span className={styles.emptySlotText}>Trống</span>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={slot.pet?.img || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBldDwvdGV4dD4KPC9zdmc+"} 
                          className={styles.petListImage}
                        />
                        <div className={styles.petListInfo}>
                          <span className={styles.petListName}>{slot.pet?.name}</span>
                          <span className={styles.petListLevel}>Lv.{slot.level}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.petListEmpty}>
                <p>Bạn chưa có linh thú nào trong túi</p>
                <p className={styles.emptyHint}>Hãy nhận linh thú mới hoặc di chuyển từ kho vào túi</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Storage Modal */}
      <StorageModal 
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        onPetMoved={handleStoragePetMoved}
      />
    </div>
  );
}; 