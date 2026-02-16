export type FruitType = 
  | 'bomb'
  | 'spike'
  | 'chop'
  | 'spring'
  | 'smoke'
  | 'flame'
  | 'ice'
  | 'sand'
  | 'dark'
  | 'slime'
  | 'light'
  | 'magma'
  | 'quake'
  | 'buddha'
  | 'phoenix'
  | 'dragon'
  | 'leopard'
  | 'dough'
  | 'soul';

export type Rarity = 'common' | 'rare' | 'epic' | 'mythic' | 'legendary';

export type AbilityType = 'attack' | 'defense' | 'special' | 'freeze' | 'heal';

export interface Ability {
  id: string;
  name: string;
  type: AbilityType;
  damage: number;
  defense: number;
  description: string;
  cooldown: number;
  maxUses?: number; // Max uses per battle (undefined = unlimited)
  // Special ability flags
  reflectsDamage?: boolean;
  reflectTargetRarity?: ('common' | 'rare')[];
  canDefendWhileAttacking?: boolean;
  unstoppable?: boolean;
  freezeTurns?: number; // Number of turns to freeze target (for freeze abilities)
  healAmount?: number; // Amount of HP to heal (for heal abilities)
}

export interface FruitFighter {
  id: string;
  name: string;
  fruitType: FruitType;
  rarity: Rarity;
  health: number;
  maxHealth: number;
  currentHealth?: number;
  attack: number;
  defense: number;
  speed: number;
  abilities: Ability[];
  emoji: string;
  color: string;
  isAlive?: boolean;
  hasShield?: boolean;
}

export interface Player {
  id: string;
  name: string;
  trophies: number;
  level: number;
  totalWins: number;
  thunderPoints: number;
  gems: number;
  selectedTeam: FruitFighter[];
  fighters: FruitFighter[];
  avatarUrl?: string | null;
}

export interface BattleRewards {
  thunderPoints: number;
  gems: number;
  isVictory: boolean;
}

export type BoxType = 'basic' | 'premium' | 'legendary';

export interface BoxInfo {
  type: BoxType;
  name: string;
  cost: number;
  emoji: string;
  description: string;
  gemChance: number; // probability 0-1
  gemRange: [number, number]; // min-max gems from box
  fruitRarityWeights: Record<Rarity, number>;
}

export interface TeamMember {
  fighter: FruitFighter;
  currentHealth: number;
  isAlive: boolean;
  cooldowns: Record<string, number>;
  abilityUses: Record<string, number>; // track uses per ability id
  frozenTurns: number; // number of turns this fighter is frozen (0 = not frozen)
}

export interface BattlePlayer {
  team: TeamMember[];
  score: number;
  isBot: boolean;
}

export interface PendingAttack {
  attacker: TeamMember;
  target: TeamMember;
  ability: Ability;
  attackerIndex: number;
  targetIndex: number;
  isFromBot?: boolean;
}

export interface BattleState {
  player: BattlePlayer;
  opponent: BattlePlayer;
  turn: 'player' | 'opponent';
  phase: 'coin_toss' | 'select_action' | 'defense_choice' | 'executing' | 'game_over';
  coinTossWinner: 'player' | 'opponent' | null;
  pendingAttack: PendingAttack | null;
  battleLog: string[];
  winner: 'player' | 'opponent' | null;
  selectedFighterIndex: number | null;
}

export type GameScreen = 'lobby' | 'fighters' | 'team-select' | 'battle' | 'settings' | 'shop' | 'leaderboard' | 'admin' | 'profile';
