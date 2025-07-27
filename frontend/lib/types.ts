// Skill Effects Interface
export interface SkillEffects {
  status?: {
    stun?: boolean;
    poison?: boolean;
    burn?: boolean;
    freeze?: boolean;
    paralyze?: boolean;
    sleep?: boolean;
    confusion?: boolean;
  };
  buff?: {
    attack?: number;
    defense?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
    criticalRate?: number;
  };
  debuff?: {
    attack?: number;
    defense?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
    criticalRate?: number;
  };
  special?: {
    heal?: number;
    drain?: number;
    reflect?: boolean;
    counter?: boolean;
    priority?: number;
    multiHit?: number;
    recoil?: number;
  };
  duration?: {
    status?: number;
    buff?: number;
    debuff?: number;
  };
}

// Skill Interface
export interface Skill {
  _id: string;
  name: string;
  type: string;
  power?: number;
  energyCost?: number;
  accuracy?: number;
  criticalRate?: number;
  effects?: any;
}

export interface UserPet {
  _id: string;
  pet: {
    _id: string;
    name: string;
    img: string;
    description: string;
    element: string;
    rarity: string;
    normalSkill?: Skill;
    ultimateSkill?: Skill;
    passiveSkill?: Skill;
  };
  level: number;
  exp: number;
  isActive: boolean;
  actualStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    accuracy: number;
    evasion: number;
    criticalRate: number;
  };
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  actualCombatPower: number;
  baseCombatPower: number;
  petClass: string;
  rating: number;
  expNeededForNextLevel: number;
  canLevelUp: boolean;
  createdAt: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  evasion: number;
  criticalRate: number;
}

export interface EnemyPet {
  _id: string;
  name: string;
  img: string;
  element: string;
  level: number;
  rarity: string;
}

// Pet Interface
export interface Pet {
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

// Battle Types
export interface BattleParticipant {
  petId: string;
  name: string;
  element: string;
  currentHp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    accuracy: number;
    evasion: number;
    criticalRate: number;
  };
  statusEffects: Record<string, any>;
  buffs: Record<string, number>;
  debuffs: Record<string, number>;
  isDefending: boolean;
  canAct: boolean;
  skills: Skill[];
}

export interface BattleState {
  battleId: string;
  state: string;
  turn: number;
  turnState: string;
  currentParticipant: BattleParticipant | null;
  participants: {
    player: BattleParticipant[];
    enemy: BattleParticipant[];
  };
  turnOrder: number[];
  battleLog: Array<{
    turn: number;
    message: string;
    timestamp: number;
  }>;
  currentTurnLog: Array<{
    turn: number;
    message: string;
    timestamp: number;
  }>;
  winner: string | null;
}

export interface BattleAction {
  actionType: string;
  skillId?: string;
  targetIndex?: number;
}

export interface ActionResult {
  success: boolean;
  damage?: number;
  isCritical?: boolean;
  effectiveness?: number;
  targetDead?: boolean;
  message?: string;
} 