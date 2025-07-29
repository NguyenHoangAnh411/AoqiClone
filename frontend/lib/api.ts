const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api";

import { SkillEffects } from './types';

// ===== AUTH API =====
export const authAPI = {
  register: async (data: { username: string; password: string; email: string }) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  login: async (data: { username: string; password: string }) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  }
};

// ===== ADMIN API =====
export const adminAPI = {
  // Dashboard
  getDashboard: async (token: string) => {
    const response = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Pet Management
  getPets: async (token: string, params?: {
    page?: number;
    limit?: number;
    element?: string;
    rarity?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.element) searchParams.append('element', params.element);
    if (params?.rarity) searchParams.append('rarity', params.rarity);
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${BASE_URL}/admin/pets?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getPetStats: async (token: string) => {
    const response = await fetch(`${BASE_URL}/admin/pets/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  createPet: async (token: string, data: {
    name: string;
    img: string;
    description?: string;
    element: string;
    rarity: string;
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    baseAccuracy: number;
    baseEvasion: number;
    baseCriticalRate: number;
  }) => {
    const response = await fetch(`${BASE_URL}/admin/pets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updatePet: async (token: string, petId: string, data: any) => {
    const response = await fetch(`${BASE_URL}/admin/pets/${petId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deletePet: async (token: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/admin/pets/${petId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getPet: async (token: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/admin/pets/${petId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Preview Combat Power
  previewCombatPower: async (token: string, data: {
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    rarity: string;
    element: string;
  }) => {
    const response = await fetch(`${BASE_URL}/admin/pets/preview-combat-power`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Skill Management
  getSkills: async (token: string, params?: {
    page?: number;
    limit?: number;
    element?: string;
    type?: string;
    petId?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.element) searchParams.append('element', params.element);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.petId) searchParams.append('petId', params.petId);
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${BASE_URL}/admin/skills?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getSkill: async (token: string, skillId: string) => {
    const response = await fetch(`${BASE_URL}/admin/skills/${skillId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  createSkill: async (token: string, data: {
    name: string;
    description?: string;
    type: 'normal' | 'ultimate' | 'passive';
    petId: string;
    power?: number;
    energyCost?: number;
    energyGeneration?: number;
    accuracy?: number;
    criticalRate?: number;
    targetType?: string;
    range?: number;
    effects?: any;
    conditions?: any;
    requiredLevel?: number;
    comboBonus?: number;
    formationBonus?: number;
  }) => {
    const response = await fetch(`${BASE_URL}/admin/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  createSkillSet: async (token: string, data: {
    petId: string;
    skillSet: {
      normal: {
        name: string;
        description: string;
        power?: number;
        energyGeneration?: number;
        accuracy?: number;
        criticalRate?: number;
        targetType?: string;
        range?: number;
        effects?: any;
        conditions?: any;
        requiredLevel?: number;
        comboBonus?: number;
        formationBonus?: number;
      };
      ultimate: {
        name: string;
        description: string;
        power?: number;
        energyCost?: number;
        accuracy?: number;
        criticalRate?: number;
        targetType?: string;
        range?: number;
        effects?: any;
        conditions?: any;
        requiredLevel?: number;
        comboBonus?: number;
        formationBonus?: number;
      };
      passive?: {
        name: string;
        description: string;
        targetType?: string;
        effects?: any;
        conditions?: any;
        requiredLevel?: number;
        formationBonus?: number;
      };
    };
  }) => {
    const response = await fetch(`${BASE_URL}/admin/skills/skill-set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateSkill: async (token: string, skillId: string, data: any) => {
    const response = await fetch(`${BASE_URL}/admin/skills/${skillId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteSkill: async (token: string, skillId: string) => {
    const response = await fetch(`${BASE_URL}/admin/skills/${skillId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  deletePetSkillSet: async (token: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/admin/skills/pet/${petId}/skill-set`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getPetSkillSet: async (token: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/admin/skills/pet/${petId}/skill-set`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Battle Management
  getBattles: async (token: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.userId) searchParams.append('userId', params.userId);

    const response = await fetch(`${BASE_URL}/admin/battles?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // User Management
  getUsers: async (token: string, params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${BASE_URL}/admin/users?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};

// ===== BATTLE API =====
export const battleAPI = {
  startBattle: async (token: string, data: {
    playerPets: Array<{ petId: string }>;
    enemyPets: Array<{ petId: string; userId?: string }>;
    battleType?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/battle/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  getBattleState: async (token: string, battleId: string) => {
    const response = await fetch(`${BASE_URL}/battle/state/${battleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  selectAction: async (token: string, battleId: string, data: {
    actionType: string;
    skillId?: string;
    targetIndex?: number;
  }) => {
    const response = await fetch(`${BASE_URL}/battle/action/${battleId}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  executeAction: async (token: string, battleId: string) => {
    const response = await fetch(`${BASE_URL}/battle/action/${battleId}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  executeAITurn: async (token: string, battleId: string) => {
    const response = await fetch(`${BASE_URL}/battle/action/${battleId}/ai-turn`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  endBattle: async (token: string, battleId: string) => {
    const response = await fetch(`${BASE_URL}/battle/end/${battleId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getBattleHistory: async (token: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${BASE_URL}/battle/history?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getActiveBattles: async (token: string) => {
    const response = await fetch(`${BASE_URL}/battle/active`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};

// ===== USER PET API =====
export const userPetAPI = {
  // Starter Pet
  getStarterPets: async () => {
    const response = await fetch(`${BASE_URL}/userpets/starter-pets`);
    return response.json();
  },

  chooseStarterPet: async (token: string, petId: string) => {
    const response = await fetch(`${BASE_URL}/userpets/choose-starter-pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ petId })
    });
    return response.json();
  },

  // Pet Management
  getAllPets: async (token: string) => {
    const response = await fetch(`${BASE_URL}/userpets/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Bag Management
  getBagPets: async (token: string) => {
    const response = await fetch(`${BASE_URL}/userpets/bag`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Storage Management
  getStoragePets: async (token: string) => {
    const response = await fetch(`${BASE_URL}/userpets/storage`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Move Pets
  movePetToBag: async (token: string, userPetId: string, replacePetId?: string) => {
    const response = await fetch(`${BASE_URL}/userpets/move-to-bag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userPetId, replacePetId })
    });
    return response.json();
  },

  movePetToStorage: async (token: string, userPetId: string) => {
    const response = await fetch(`${BASE_URL}/userpets/move-to-storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userPetId })
    });
    return response.json();
  },

  // Receive Pet
  receivePet: async (token: string, data: {
    petId: string;
    level?: number;
    exp?: number;
  }) => {
    const response = await fetch(`${BASE_URL}/userpets/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};



// ===== USER API =====
export const userAPI = {
  getProfile: async (token: string) => {
    const response = await fetch(`${BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getUserData: async (token: string) => {
    const response = await fetch(`${BASE_URL}/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  updateProfile: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// ===== PET API (User) =====
export const petAPI = {
  // Lấy tất cả pet của user (cả túi và kho)
  getMyPets: async (token: string) => {
    const response = await fetch(`${BASE_URL}/userpets/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Lấy pet trong túi
  getBagPets: async (token: string) => {
    const response = await fetch(`${BASE_URL}/userpets/bag`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Lấy pet trong kho
  getStoragePets: async (token: string) => {
    const response = await fetch(`${BASE_URL}/userpets/storage`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Nhận pet mới
  receivePet: async (token: string, data: {
    petId: string;
    level?: number;
    exp?: number;
  }) => {
    const response = await fetch(`${BASE_URL}/userpets/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

// ===== FORMATION API =====
export const formationAPI = {
  // Lấy tất cả đội hình của user
  getUserFormations: async (token: string) => {
    const response = await fetch(`${BASE_URL}/formation`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Lấy đội hình cụ thể
  getFormation: async (token: string, formationId: string) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Tạo đội hình mới
  createFormation: async (token: string, data: {
    name: string;
    pets?: Array<{
      userPet: string;
      position: number;
      isActive: boolean;
    }>;
  }) => {
    const response = await fetch(`${BASE_URL}/formation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Cập nhật đội hình
  updateFormation: async (token: string, formationId: string, data: {
    name?: string;
    pets?: Array<{
      userPet: string;
      position: number;
      isActive: boolean;
    }>;
  }) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Xóa đội hình
  deleteFormation: async (token: string, formationId: string) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Set đội hình active
  setActiveFormation: async (token: string, formationId: string) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}/set-active`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Thêm pet vào đội hình
  addPetToFormation: async (token: string, formationId: string, data: {
    userPetId: string;
    position: number;
  }) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}/add-pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Xóa pet khỏi đội hình
  removePetFromFormation: async (token: string, formationId: string, position: number) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}/remove-pet/${position}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Di chuyển pet trong đội hình
  movePetInFormation: async (token: string, formationId: string, data: {
    fromPosition: number;
    toPosition: number;
  }) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}/move-pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Lấy danh sách pet có thể thêm vào đội hình
  getAvailablePets: async (token: string, formationId: string) => {
    const response = await fetch(`${BASE_URL}/formation/${formationId}/available-pets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  // Cập nhật lại lực chiến cho tất cả đội hình
  recalculateAllFormations: async (token: string) => {
    const response = await fetch(`${BASE_URL}/formation/recalculate-combat-power`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};