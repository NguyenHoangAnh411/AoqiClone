import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { validation } from '../utils/validation';

export interface UserPet {
  _id: string;
  pet: {
    _id: string;
    name: string;
    img: string;
    rarity: string;
    element: string;
  };
  level: number;
  actualCombatPower: number;
}

export interface Formation {
  _id: string;
  name: string;
  pets: Array<{
    userPet: UserPet;
    position: number;
    isActive: boolean;
  }>;
  totalCombatPower: number;
  isActive: boolean;
}

export const useFormation = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [availablePets, setAvailablePets] = useState<UserPet[]>([]);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());
  const api = useApi();

  const setSelectedFormationCallback = useCallback((formation: Formation | null) => {
    setSelectedFormation(formation);
  }, []);

  // Update selected formation when formations change
  useEffect(() => {
    if (formations.length > 0 && !selectedFormation) {
      setSelectedFormation(formations[0]);
    }
  }, [formations, selectedFormation]);

  // Optimistic update helper
  const updateFormationOptimistically = useCallback((formationId: string, updater: (formation: Formation) => Formation) => {
    setFormations(prev => prev.map(f => 
      f._id === formationId ? updater(f) : f
    ));
    
    setSelectedFormation(prev => 
      prev?._id === formationId ? updater(prev) : prev
    );
  }, []);

  // Calculate total combat power for a formation
  const calculateFormationCombatPower = useCallback((pets: Formation['pets']) => {
    return pets
      .filter(pet => pet.isActive)
      .reduce((total, pet) => total + (pet.userPet.actualCombatPower || 0), 0);
  }, []);

  const fetchFormations = useCallback(async () => {
    const result = await api.execute<{ formations: Formation[] }>('/api/formations');
    if (result) {
      setFormations(result.formations || []);
      // Set first formation as selected if no formation is selected
      setSelectedFormation(prev => {
        if (!prev && result.formations && result.formations.length > 0) {
          return result.formations[0];
        }
        return prev;
      });
    }
  }, [api]);

  const fetchAvailablePets = useCallback(async (formationId?: string) => {
    const targetFormationId = formationId || selectedFormation?._id;
    if (!targetFormationId) return;
    
    const result = await api.execute<{ availablePets: UserPet[] }>(
      `/api/formations/${targetFormationId}/available-pets`
    );
    if (result) {
      setAvailablePets(result.availablePets || []);
    }
  }, [api]);

  const createFormation = useCallback(async (name: string): Promise<Formation | null> => {
    if (!validation.isValidFormationName(name)) {
      api.setError('Tên đội hình không hợp lệ');
      return null;
    }

    const result = await api.execute<{ formation: Formation }>('/api/formations', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() })
    });

    if (result) {
      const newFormation = result.formation;
      setFormations(prev => [...prev, newFormation]);
      setSelectedFormation(newFormation);
      return newFormation;
    }
    return null;
  }, [api]);

  const deleteFormation = useCallback(async (formationId: string): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId)) {
      api.setError('ID đội hình không hợp lệ');
      return false;
    }

    // Optimistic update
    setFormations(prev => {
      const newFormations = prev.filter(f => f._id !== formationId);
      setSelectedFormation(current => {
        if (current?._id === formationId) {
          return newFormations[0] || null;
        }
        return current;
      });
      return newFormations;
    });

    const result = await api.execute(`/api/formations/${formationId}`, {
      method: 'DELETE'
    });

    if (result === null) {
      // Revert on error
      fetchFormations();
      return false;
    }
    return true;
  }, [api, fetchFormations]);

  const setActiveFormation = useCallback(async (formationId: string): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId)) {
      api.setError('ID đội hình không hợp lệ');
      return false;
    }

    // Optimistic update
    setFormations(prev => prev.map(f => ({
      ...f,
      isActive: f._id === formationId
    })));

    const result = await api.execute<{ formation: Formation }>(
      `/api/formations/${formationId}/set-active`,
      { method: 'POST' }
    );

    if (result) {
      const updatedFormation = result.formation;
      setSelectedFormation(updatedFormation);
      return true;
    } else {
      // Revert on error
      fetchFormations();
      return false;
    }
  }, [api, fetchFormations]);

  const addPetToFormation = useCallback(async (
    formationId: string,
    petId: string,
    position: number
  ): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId) || !validation.isValidPetId(petId) || !validation.isValidPosition(position)) {
      api.setError('Dữ liệu không hợp lệ');
      return false;
    }

    // Find the pet to add
    const petToAdd = availablePets.find(p => p._id === petId);
    if (!petToAdd) {
      api.setError('Không tìm thấy linh thú');
      return false;
    }

    // Optimistic update
    const updateKey = `${formationId}-add-${petId}-${position}`;
    setOptimisticUpdates(prev => new Set(prev).add(updateKey));

    updateFormationOptimistically(formationId, (formation) => {
      // Remove pet from old position if exists
      const existingPetIndex = formation.pets.findIndex(p => 
        p.userPet._id === petId && p.isActive
      );
      
      let newPets = formation.pets;
      if (existingPetIndex !== -1) {
        newPets = formation.pets.map((p, index) => 
          index === existingPetIndex ? { ...p, isActive: false } : p
        );
      }

      // Add pet to new position
      const newPetEntry = {
        userPet: petToAdd,
        position,
        isActive: true
      };

      // Remove any existing pet at this position
      newPets = newPets.map(p => 
        p.position === position ? { ...p, isActive: false } : p
      );

      newPets.push(newPetEntry);

      return {
        ...formation,
        pets: newPets,
        totalCombatPower: calculateFormationCombatPower(newPets)
      };
    });

    // Update available pets optimistically
    setAvailablePets(prev => prev.filter(p => p._id !== petId));

    const result = await api.execute<{ formation: Formation }>(
      `/api/formations/${formationId}/add-pet`,
      {
        method: 'POST',
        body: JSON.stringify({ userPetId: petId, position })
      }
    );

    // Remove optimistic update flag
    setOptimisticUpdates(prev => {
      const newSet = new Set(prev);
      newSet.delete(updateKey);
      return newSet;
    });

    if (result) {
      // Sync with server data
      const updatedFormation = result.formation;
      setSelectedFormation(updatedFormation);
      setFormations(prev => prev.map(f => 
        f._id === formationId ? updatedFormation : f
      ));
      return true;
    } else {
      // Revert on error
      fetchFormations();
      // Refresh available pets
      if (selectedFormation?._id) {
        const refreshResult = await api.execute<{ availablePets: UserPet[] }>(
          `/api/formations/${selectedFormation._id}/available-pets`
        );
        if (refreshResult) {
          setAvailablePets(refreshResult.availablePets || []);
        }
      }
      return false;
    }
  }, [api, availablePets, updateFormationOptimistically, calculateFormationCombatPower, fetchFormations, selectedFormation?._id]);

  const removePetFromFormation = useCallback(async (
    formationId: string,
    position: number
  ): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId) || !validation.isValidPosition(position)) {
      api.setError('Dữ liệu không hợp lệ');
      return false;
    }

    // Find the pet to remove
    const formation = formations.find(f => f._id === formationId);
    const petToRemove = formation?.pets.find(p => p.position === position && p.isActive);
    
    if (!petToRemove) {
      api.setError('Không tìm thấy linh thú ở vị trí này');
      return false;
    }

    // Optimistic update
    const updateKey = `${formationId}-remove-${position}`;
    setOptimisticUpdates(prev => new Set(prev).add(updateKey));

    updateFormationOptimistically(formationId, (formation) => {
      const newPets = formation.pets.map(p => 
        p.position === position ? { ...p, isActive: false } : p
      );

      return {
        ...formation,
        pets: newPets,
        totalCombatPower: calculateFormationCombatPower(newPets)
      };
    });

    // Add pet back to available pets optimistically
    setAvailablePets(prev => [...prev, petToRemove.userPet]);

    const result = await api.execute<{ formation: Formation }>(
      `/api/formations/${formationId}/remove-pet/${position}`,
      { method: 'DELETE' }
    );

    // Remove optimistic update flag
    setOptimisticUpdates(prev => {
      const newSet = new Set(prev);
      newSet.delete(updateKey);
      return newSet;
    });

    if (result) {
      // Sync with server data
      const updatedFormation = result.formation;
      setSelectedFormation(updatedFormation);
      setFormations(prev => prev.map(f => 
        f._id === formationId ? updatedFormation : f
      ));
      return true;
    } else {
      // Revert on error
      fetchFormations();
      // Refresh available pets
      if (selectedFormation?._id) {
        const refreshResult = await api.execute<{ availablePets: UserPet[] }>(
          `/api/formations/${selectedFormation._id}/available-pets`
        );
        if (refreshResult) {
          setAvailablePets(refreshResult.availablePets || []);
        }
      }
      return false;
    }
  }, [api, formations, updateFormationOptimistically, calculateFormationCombatPower, fetchFormations, selectedFormation?._id]);

  // Auto-fetch formations when hook is initialized
  useEffect(() => {
    fetchFormations();
  }, []); // Empty dependency array to run only once

  // Auto-fetch available pets when formation changes
  useEffect(() => {
    if (selectedFormation?._id) {
      fetchAvailablePets(selectedFormation._id);
    }
  }, [selectedFormation?._id]); // Remove fetchAvailablePets from dependencies

  return {
    formations,
    selectedFormation,
    availablePets,
    loading: api.loading,
    error: api.error,
    optimisticUpdates,
    fetchFormations,
    fetchAvailablePets,
    createFormation,
    deleteFormation,
    setActiveFormation,
    addPetToFormation,
    removePetFromFormation,
    setSelectedFormation: setSelectedFormationCallback,
    clearError: api.clearError,
  };
}; 