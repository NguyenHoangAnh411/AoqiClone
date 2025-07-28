'use client';

import React, { useState, useCallback } from 'react';
import { useFormation, UserPet, Formation } from '../../../../lib/hooks/useFormation';
import { LoadingSpinner, ErrorMessage, PetCard } from '../../../common';
import { formatCombatPower } from '../../../../lib/utils';
import styles from '../../../../app/page.module.css';

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormationModal: React.FC<FormationModalProps> = ({ isOpen, onClose }) => {
  const {
    formations,
    selectedFormation,
    availablePets,
    error,
    createFormation,
    deleteFormation,
    setActiveFormation,
    addPetToFormation,
    removePetFromFormation,
    setSelectedFormation: setSelectedFormationCallback,
    clearError,
  } = useFormation();

  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFormationName, setNewFormationName] = useState('');
  const [selectedPet, setSelectedPet] = useState<UserPet | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [processingSlots, setProcessingSlots] = useState<Set<number>>(new Set());

  // Handle formation creation
  const handleCreateFormation = useCallback(async () => {
    if (!newFormationName.trim()) return;
    
    const newFormation = await createFormation(newFormationName.trim());
    if (newFormation) {
      setNewFormationName('');
      setShowCreateForm(false);
    }
  }, [newFormationName, createFormation]);

  // Handle pet selection
  const handlePetSelect = useCallback((pet: UserPet) => {
    setSelectedPet(selectedPet?._id === pet._id ? null : pet);
  }, [selectedPet]);

  // Get pet at position
  const getPetAtPosition = useCallback((position: number) => {
    if (!selectedFormation) return null;
    return selectedFormation.pets.find(pet => pet.position === position && pet.isActive);
  }, [selectedFormation]);

  // Check if slot is occupied
  const isSlotOccupied = useCallback((position: number) => {
    return selectedFormation?.pets.some(p => p.position === position && p.isActive) || false;
  }, [selectedFormation]);

  // Check if slot is being processed
  const isSlotProcessing = useCallback((position: number) => {
    return processingSlots.has(position);
  }, [processingSlots]);

  // Handle slot click with immediate feedback
  const handleSlotClick = useCallback(async (position: number) => {
    if (!selectedFormation || isSlotProcessing(position)) return;

    const petSlot = getPetAtPosition(position);
    const isOccupied = isSlotOccupied(position);

    // Set processing state immediately
    setProcessingSlots(prev => new Set(prev).add(position));

    try {
      if (selectedPet && !isOccupied) {
        // Add pet to slot
        const activePets = selectedFormation.pets.filter(p => p.isActive);
        if (activePets.length >= 5) {
          clearError();
          return;
        }
        
        const success = await addPetToFormation(selectedFormation._id, selectedPet._id, position);
        if (success) {
          setSelectedPet(null);
        }
      } else if (isOccupied && petSlot) {
        if (selectedPet) {
          // Move pet to this slot - optimize by doing both operations in parallel
          const oldPosition = selectedFormation.pets.find(p => p.userPet._id === selectedPet._id && p.isActive)?.position;
          
          if (oldPosition) {
            // Remove from old position and add to new position in parallel
            await Promise.all([
              removePetFromFormation(selectedFormation._id, oldPosition),
              addPetToFormation(selectedFormation._id, selectedPet._id, position)
            ]);
          } else {
            await addPetToFormation(selectedFormation._id, selectedPet._id, position);
          }
          
          setSelectedPet(null);
        } else {
          // Remove pet from slot
          await removePetFromFormation(selectedFormation._id, position);
        }
      }
    } catch (error) {
      console.error('Error handling slot click:', error);
    } finally {
      // Clear processing state
      setProcessingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(position);
        return newSet;
      });
    }
  }, [
    selectedFormation, 
    selectedPet, 
    addPetToFormation, 
    removePetFromFormation, 
    clearError, 
    getPetAtPosition, 
    isSlotOccupied,
    isSlotProcessing
  ]);

  // Render formation slot with optimistic updates
  const renderFormationSlot = useCallback((position: number) => {
    const petSlot = getPetAtPosition(position);
    const isOccupied = isSlotOccupied(position);
    const isHovered = hoveredSlot === position;
    const canPlacePet = selectedPet && !isOccupied;
    const isSelectedPetInSlot = selectedPet && petSlot && petSlot.userPet._id === selectedPet._id;
    const isProcessing = isSlotProcessing(position);

    return (
      <div
        key={position}
        className={`
          ${styles.formationSlot3x3}
          ${canPlacePet ? styles.formationSlotActive : ''}
          ${isSelectedPetInSlot ? styles.formationSlotSelected : ''}
          ${selectedPet && !canPlacePet && !isSelectedPetInSlot ? styles.formationSlotInactive : ''}
          ${isHovered ? styles.formationSlotHovered : ''}
          ${isProcessing ? styles.formationSlotProcessing : ''}
        `}
        onClick={() => handleSlotClick(position)}
        onMouseEnter={() => setHoveredSlot(position)}
        onMouseLeave={() => setHoveredSlot(null)}
      >
        <div className={styles.slotNumber3x3}>{position}</div>
        
        {isProcessing && (
          <div className={styles.processingOverlay}>
            <LoadingSpinner size="small" />
          </div>
        )}
        
        {petSlot ? (
          <div className={styles.petInSlot3x3}>
            <div className={styles.petImageContainer}>
              <img 
                src={petSlot.userPet.pet?.img || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZmY3NzAwIi8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBldDwvdGV4dD4KPC9zdmc+"} 
                alt={petSlot.userPet.pet?.name}
                className={styles.petImage}
              />
              <div className={styles.petLevel}>Lv.{petSlot.userPet.level}</div>
            </div>
            <div className={styles.petActionHint}>
              {isSelectedPetInSlot ? 'Click để hủy' : 'Click để xóa'}
            </div>
          </div>
        ) : (
          <div className={styles.emptySlot3x3}>
            <div className={styles.emptySlotHint}>
              {selectedPet ? 'Click để thêm pet' : 'Trống'}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    getPetAtPosition,
    isSlotOccupied,
    hoveredSlot,
    selectedPet,
    handleSlotClick,
    isSlotProcessing,
    styles
  ]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.formationModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🎯 Lập Đội Hình</h3>
          <div className={styles.modalHeaderActions}>
            <button 
              className={styles.closeButton}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>
        
        <div className={styles.formationModalContent}>
          {error && <ErrorMessage message={error} onClose={clearError} />}

          {/* Left Section: Formation List */}
          <div className={styles.formationListSection}>
            <div className={styles.formationListHeader}>
              <h4>Danh Sách Đội Hình</h4>
              <button
                onClick={() => setShowCreateForm(true)}
                className={styles.createFormationBtn}
              >
                + Tạo Mới
              </button>
            </div>

            {showCreateForm && (
              <div className={styles.createFormationForm}>
                <input
                  type="text"
                  placeholder="Nhập tên đội hình..."
                  value={newFormationName}
                  onChange={(e) => setNewFormationName(e.target.value)}
                  className={styles.formationNameInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFormation()}
                />
                <div className={styles.createFormationActions}>
                  <button onClick={handleCreateFormation}>
                    Tạo
                  </button>
                  <button onClick={() => setShowCreateForm(false)}>Hủy</button>
                </div>
              </div>
            )}

            <div className={styles.formationList}>
              {formations.length === 0 ? (
                <div className={styles.emptyFormationList}>
                  <p>Chưa có đội hình nào</p>
                  <p>Tạo đội hình đầu tiên của bạn!</p>
                </div>
              ) : (
                formations.map((formation) => (
                  <div
                    key={formation._id}
                    className={`
                      ${styles.formationListItem}
                      ${selectedFormation?._id === formation._id ? styles.selectedFormationItem : ''}
                    `}
                    onClick={() => setSelectedFormationCallback(formation)}
                  >
                    <div className={styles.formationItemInfo}>
                      <h5>{formation.name}</h5>
                      <div className={styles.combatPower}>
                        {formatCombatPower(formation.totalCombatPower)}
                      </div>
                      {formation.isActive && (
                        <span className={styles.activeBadge}>Active</span>
                      )}
                    </div>
                    
                    <div className={styles.formationItemActions}>
                      {!formation.isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFormation(formation._id);
                          }}
                          className={styles.setActiveBtn}
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFormation(formation._id);
                        }}
                        className={styles.deleteFormationBtn}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Section: Formation Grid */}
          <div className={styles.formationCenterSection}>
            {selectedFormation && (
              <>
                <div className={styles.combatPowerSection}>
                  <h4>Tổng Lực Chiến</h4>
                  <div className={styles.combatPowerDisplay}>
                    {formatCombatPower(selectedFormation.totalCombatPower)}
                  </div>
                </div>

                <div className={styles.selectedFormationSection}>
                  <div className={styles.formationInfo}>
                    <div className={styles.formationHint}>
                      {selectedPet && (
                        <div className={styles.actionContainer}>
                          <button
                            className={styles.cancelActionBtn}
                            onClick={() => setSelectedPet(null)}
                          >
                            ✕ Hủy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.formationGridWrapper}>
                    <div className={styles.formationGrid3x3}>
                      {Array.from({ length: 9 }, (_, i) => renderFormationSlot(i + 1))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Section: Available Pets */}
          <div className={styles.availablePetsSection}>
            <h4>Linh Thú Có Sẵn</h4>
            
            <div className={styles.availablePetsList}>
              {availablePets.length === 0 ? (
                <div className={styles.petListEmpty}>
                  <p>Không có linh thú nào có sẵn</p>
                </div>
              ) : (
                availablePets.map((pet) => (
                  <div
                    key={pet._id}
                    className={`
                      ${styles.availablePetItem}
                      ${selectedPet?._id === pet._id ? styles.selectedAvailablePet : ''}
                    `}
                    onClick={() => handlePetSelect(pet)}
                  >
                    <PetCard
                      pet={pet}
                      size="small"
                      selected={selectedPet?._id === pet._id}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 