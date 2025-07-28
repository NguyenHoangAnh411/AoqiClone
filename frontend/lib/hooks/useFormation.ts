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

    const result = await api.execute(`/api/formations/${formationId}`, {
      method: 'DELETE'
    });

    if (result !== null) {
      setFormations(prev => {
        const newFormations = prev.filter(f => f._id !== formationId);
        // Update selected formation if the deleted one was selected
        setSelectedFormation(current => {
          if (current?._id === formationId) {
            return newFormations[0] || null;
          }
          return current;
        });
        return newFormations;
      });
      return true;
    }
    return false;
  }, [api]);

  const setActiveFormation = useCallback(async (formationId: string): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId)) {
      api.setError('ID đội hình không hợp lệ');
      return false;
    }

    const result = await api.execute<{ formation: Formation }>(
      `/api/formations/${formationId}/set-active`,
      { method: 'POST' }
    );

    if (result) {
      const updatedFormation = result.formation;
      setFormations(prev => prev.map(f => ({
        ...f,
        isActive: f._id === formationId
      })));
      setSelectedFormation(updatedFormation);
      return true;
    }
    return false;
  }, [api]);

  const addPetToFormation = useCallback(async (
    formationId: string,
    petId: string,
    position: number
  ): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId) || !validation.isValidPetId(petId) || !validation.isValidPosition(position)) {
      api.setError('Dữ liệu không hợp lệ');
      return false;
    }

    const result = await api.execute<{ formation: Formation }>(
      `/api/formations/${formationId}/add-pet`,
      {
        method: 'POST',
        body: JSON.stringify({ userPetId: petId, position })
      }
    );

    if (result) {
      const updatedFormation = result.formation;
      setSelectedFormation(updatedFormation);
      setFormations(prev => prev.map(f => 
        f._id === formationId ? updatedFormation : f
      ));
      return true;
    }
    return false;
  }, [api]);

  const removePetFromFormation = useCallback(async (
    formationId: string,
    position: number
  ): Promise<boolean> => {
    if (!validation.isValidFormationId(formationId) || !validation.isValidPosition(position)) {
      api.setError('Dữ liệu không hợp lệ');
      return false;
    }

    const result = await api.execute<{ formation: Formation }>(
      `/api/formations/${formationId}/remove-pet/${position}`,
      { method: 'DELETE' }
    );

    if (result) {
      const updatedFormation = result.formation;
      setSelectedFormation(updatedFormation);
      setFormations(prev => prev.map(f => 
        f._id === formationId ? updatedFormation : f
      ));
      return true;
    }
    return false;
  }, [api]);

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