'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '../../../../components/AuthProvider';
import { userPetAPI } from '../../../../lib/api';
import styles from '../../../../app/page.module.css';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetMoved?: () => void; // Callback khi pet được di chuyển
}

// Function để xác định màu khung dựa trên rarity
const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return '#9e9e9e'; // Gray
    case 'rare':
      return '#2196f3'; // Blue
    case 'epic':
      return '#9c27b0'; // Purple
    case 'legendary':
      return '#ff9800'; // Orange
    default:
      return '#9e9e9e'; // Default gray
  }
};

export const StorageModal = ({ isOpen, onClose, onPetMoved }: StorageModalProps) => {
  const { getToken } = useAuthContext();
  const [storagePets, setStoragePets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [movingPet, setMovingPet] = useState(false);
  const [bagInfo, setBagInfo] = useState<any>(null);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [filters, setFilters] = useState({
    element: 'all',
    rarity: 'all'
  });
  const [showFilterCount, setShowFilterCount] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const petsPerPage = 10;
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedReplacePet, setSelectedReplacePet] = useState<string>('');
  const [bagPets, setBagPets] = useState<any[]>([]);
  const [petToMove, setPetToMove] = useState<string>('');

  // Load storage pets khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadStoragePets();
    }
  }, [isOpen]);

  const loadStoragePets = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await userPetAPI.getStoragePets(token);
      if (response.success) {
        const newStoragePets = response.storagePets || [];
        setStoragePets(newStoragePets);
        setBagInfo(response.bagInfo);
        
        // Cập nhật selectedPet dựa trên danh sách mới
        if (newStoragePets.length > 0) {
          // Nếu selectedPet hiện tại không còn trong danh sách, chọn pet đầu tiên
          const currentPetExists = newStoragePets.some((pet: any) => pet._id === selectedPet?._id);
          if (!currentPetExists) {
            setSelectedPet(newStoragePets[0]);
          }
        } else {
          // Nếu storage trống, xóa selectedPet
          setSelectedPet(null);
        }
      }
    } catch (error) {
      console.error('Error loading storage pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBagPets = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await userPetAPI.getBagPets(token);
      if (response.success) {
        setBagPets(response.bagPets || []);
      }
    } catch (error) {
      console.error('Error loading bag pets:', error);
    }
  };

  // Lọc pets theo filter
  const filteredPets = storagePets.filter(pet => {
    if (filters.element !== 'all' && pet.pet?.element !== filters.element) return false;
    if (filters.rarity !== 'all' && pet.pet?.rarity !== filters.rarity) return false;
    return true;
  });

  // Tính toán pagination
  const totalPages = Math.ceil(filteredPets.length / petsPerPage);
  const startIndex = (currentPage - 1) * petsPerPage;
  const endIndex = startIndex + petsPerPage;
  const currentPets = filteredPets.slice(startIndex, endIndex);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Cập nhật selectedPet khi filteredPets thay đổi
  useEffect(() => {
    if (filteredPets.length > 0) {
      // Kiểm tra xem selectedPet hiện tại có còn trong danh sách đã lọc không
      const currentPetInFiltered = filteredPets.some((pet: any) => pet._id === selectedPet?._id);
      if (!currentPetInFiltered) {
        // Nếu không còn, chọn pet đầu tiên trong danh sách đã lọc
        setSelectedPet(filteredPets[0]);
      }
    } else {
      // Nếu không có pet nào phù hợp với filter, xóa selectedPet
      setSelectedPet(null);
    }
  }, [filteredPets, selectedPet]);

  const movePetToBag = async (userPetId: string) => {
    try {
      setMovingPet(true);
      const token = getToken();
      if (!token) return;

      const response = await userPetAPI.movePetToBag(token, userPetId);
      
      if (response.success) {
        // Reload storage pets
        await loadStoragePets();
        // Gọi callback để cập nhật UI bên ngoài
        if (onPetMoved) {
          onPetMoved();
        }
      } else if (response.error === 'BAG_FULL') {
        // Túi đầy, hiển thị modal chọn pet thay thế
        setPetToMove(userPetId);
        await loadBagPets();
        setShowReplaceModal(true);
      }
    } catch (error) {
      console.error('Error moving pet to bag:', error);
    } finally {
      setMovingPet(false);
    }
  };

  const confirmReplacePet = async () => {
    if (!selectedReplacePet) return;
    
    try {
      setMovingPet(true);
      const token = getToken();
      if (!token) return;

      const response = await userPetAPI.movePetToBag(token, petToMove, selectedReplacePet);
      if (response.success) {
        // Reload storage pets
        await loadStoragePets();
        // Gọi callback để cập nhật UI bên ngoài
        if (onPetMoved) {
          onPetMoved();
        }
        // Đóng modal và reset state
        setShowReplaceModal(false);
        setSelectedReplacePet('');
        setPetToMove('');
      }
    } catch (error) {
      console.error('Error replacing pet:', error);
    } finally {
      setMovingPet(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.storageModalNew} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.storageModalHeader}>
          <div className={styles.storageHeaderContent}>
            <div className={styles.storageTitle}>
              <span className={styles.storageIcon}>📦</span>
              <h3>Kho linh thú</h3>
            </div>
            {bagInfo && (
              <div className={styles.storageBagStatus}>
                <div className={styles.bagStatusCard}>
                  <span className={styles.bagStatusIcon}>🎒</span>
                  <div className={styles.bagStatusInfo}>
                    <span className={styles.bagStatusText}>Túi chiến đấu</span>
                    <span className={styles.bagStatusCount}>
                      {bagInfo.current}/{bagInfo.max}
                    </span>
                  </div>
                  <div className={styles.bagStatusIndicator}>
                    {bagInfo.current >= bagInfo.max ? '🟡' : '🟢'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className={styles.storageCloseButton} onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className={styles.storageModalContentNew}>
          {/* Phần 1: Pet Details (50-60% chiều cao) */}
          <div className={styles.petDetailsSection}>
            <div className={styles.petImageColumn}>
              <div className={styles.petImageContainer}>
                {selectedPet ? (
                  <img 
                    src={selectedPet.pet?.img || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGV0PC90ZXh0Pgo8L3N2Zz4K"} 
                    alt={selectedPet.pet?.name}
                    className={styles.petDetailImage}
                  />
                ) : (
                  <div className={styles.petImagePlaceholder}>
                    <span>{storagePets.length === 0 ? 'Kho trống' : 'Chọn linh thú'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.petStatsColumn}>
              <div className={styles.petStatsContainer}>
                {selectedPet ? (
                  <div className={styles.petStatsContent}>
                    <h4 className={styles.petStatsTitle}>{selectedPet.pet?.name}</h4>
                    <div className={styles.petStatsGrid}>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Level:</span>
                        <span className={styles.petStatValue}>{selectedPet.level}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>HP:</span>
                        <span className={styles.petStatValue}>{selectedPet.hp}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Attack:</span>
                        <span className={styles.petStatValue}>{selectedPet.attack}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Defense:</span>
                        <span className={styles.petStatValue}>{selectedPet.defense}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>Speed:</span>
                        <span className={styles.petStatValue}>{selectedPet.speed}</span>
                      </div>
                      <div className={styles.petStatItem}>
                        <span className={styles.petStatLabel}>EXP:</span>
                        <span className={styles.petStatValue}>{selectedPet.exp}</span>
                      </div>
                    </div>
                    <div className={styles.petActions}>
                      <button 
                        className={styles.petMoveToBagBtn}
                        onClick={() => selectedPet && movePetToBag(selectedPet._id)}
                        disabled={movingPet || (bagInfo?.current >= bagInfo?.max)}
                      >
                        {movingPet ? '⏳ Đang di chuyển...' : '🎒 Vào túi'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.petStatsPlaceholder}>
                    <span>{storagePets.length === 0 ? 'Kho trống' : 'Chọn linh thú để xem stats'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phần 2: Filters (mỏng) */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersContainer}>
              <div className={styles.filtersHeader}>
                <h4>Bộ lọc theo hệ và độ hiếm</h4>
                <div className={styles.filterStats}>
                  <span className={styles.filterCount}>
                    {filteredPets.length} / {storagePets.length} linh thú
                  </span>
                  {(filters.element !== 'all' || filters.rarity !== 'all') && (
                    <button 
                      className={styles.clearFiltersBtn}
                      onClick={() => setFilters({ element: 'all', rarity: 'all' })}
                    >
                      🗑️ Xóa bộ lọc
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.filtersContent}>
                <div className={styles.filterGroup}>
                  <label>Hệ:</label>
                  <select 
                    value={filters.element} 
                    onChange={(e) => setFilters({...filters, element: e.target.value})}
                    className={styles.filterSelect}
                  >
                    <option value="all">Tất cả hệ</option>
                    <option value="fire">🔥 Hoả</option>
                    <option value="water">💧 Thuỷ</option>
                    <option value="wind">💨 Phong</option>
                    <option value="thunder">⚡ Lôi</option>
                    <option value="grass">🌿 Thảo</option>
                    <option value="rock">🪨 Nham</option>
                    <option value="ice">❄️ Băng</option>
                  </select>
                </div>
                
                <div className={styles.filterGroup}>
                  <label>Độ hiếm:</label>
                  <select 
                    value={filters.rarity} 
                    onChange={(e) => setFilters({...filters, rarity: e.target.value})}
                    className={styles.filterSelect}
                  >
                    <option value="all">Tất cả độ hiếm</option>
                    <option value="common">⚪ Thường</option>
                    <option value="rare">🔵 Hiếm</option>
                    <option value="epic">🟣 Huyền thoại</option>
                    <option value="legendary">🟡 Thần thoại</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Phần 3: Pet List & Pagination (20-30% chiều cao) */}
          <div className={styles.petListSection}>
            <div className={styles.petListContainer}>
              <h4>Danh sách và phân trang</h4>
              
              {loading ? (
                <div className={styles.petListLoading}>
                  <span>⏳ Đang tải...</span>
                </div>
              ) : filteredPets.length > 0 ? (
                <>
                  <div className={styles.petListGrid}>
                    {currentPets.map((pet: any, index: number) => (
                      <div 
                        key={pet._id || index} 
                        className={`${styles.petListItem} ${selectedPet?._id === pet._id ? styles.selectedPetItem : ''}`}
                        onClick={() => setSelectedPet(pet)}
                        style={{
                          borderColor: getRarityColor(pet.pet?.rarity || 'common')
                        }}
                      >
                        <img 
                          src={pet.pet?.img || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBldDwvdGV4dD4KPC9zdmc+"} 
                          alt={pet.pet?.name}
                          className={styles.petListItemImage}
                        />
                        <div className={styles.petListItemInfo}>
                          <span className={styles.petListItemLevel}>Lv.{pet.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className={styles.paginationContainer}>
                      <div className={styles.paginationInfo}>
                        <span>Trang {currentPage} / {totalPages}</span>
                        <span>• {filteredPets.length} linh thú</span>
                      </div>
                      
                      <div className={styles.paginationButtons}>
                        <button 
                          className={styles.paginationBtn}
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          title="Trang trước"
                        >
                          ←
                        </button>
                        
                        {/* Hiển thị tối đa 5 nút trang */}
                        {(() => {
                          const pages = [];
                          const maxVisiblePages = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                          let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                          
                          if (endPage - startPage + 1 < maxVisiblePages) {
                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                          }
                          
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(i);
                          }
                          
                          return pages.map(page => (
                            <button 
                              key={page}
                              className={`${styles.paginationBtn} ${currentPage === page ? styles.activePage : ''}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          ));
                        })()}
                        
                        <button 
                          className={styles.paginationBtn}
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          title="Trang sau"
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.petListEmpty}>
                  <span>
                    {storagePets.length === 0 
                      ? 'Kho trống. Di chuyển linh thú từ túi vào đây để lưu trữ.' 
                      : 'Không có linh thú nào phù hợp với bộ lọc'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Replace Pet Modal */}
      {showReplaceModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReplaceModal(false)}>
          <div className={styles.replaceModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.replaceModalHeader}>
              <h3>🔄 Thay thế linh thú</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowReplaceModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.replaceModalContent}>
              <div className={styles.replaceModalInfo}>
                <p>🎒 Túi đã đầy! Bạn cần chọn một linh thú trong túi để thay thế:</p>
                <div className={styles.bagStatus}>
                  <span>📊 Túi: {bagInfo?.current}/{bagInfo?.max}</span>
                </div>
              </div>
              
              <div className={styles.replacePetList}>
                <h4>Chọn linh thú để thay thế:</h4>
                <div className={styles.replacePetGrid}>
                  {bagPets.map((pet: any) => (
                    <div 
                      key={pet._id}
                      className={`${styles.replacePetItem} ${selectedReplacePet === pet._id ? styles.selectedReplacePet : ''}`}
                      onClick={() => setSelectedReplacePet(pet._id)}
                    >
                      <img 
                        src={pet.pet?.img || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBldDwvdGV4dD4KPC9zdmc+"} 
                        alt={pet.pet?.name}
                        className={styles.replacePetImage}
                      />
                      <div className={styles.replacePetInfo}>
                        <span className={styles.replacePetName}>{pet.pet?.name}</span>
                        <span className={styles.replacePetLevel}>Lv.{pet.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.replaceModalActions}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => setShowReplaceModal(false)}
                >
                  ❌ Hủy
                </button>
                <button 
                  className={styles.confirmButton}
                  onClick={confirmReplacePet}
                  disabled={!selectedReplacePet || movingPet}
                >
                  {movingPet ? '⏳ Đang xử lý...' : '✅ Xác nhận thay thế'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 