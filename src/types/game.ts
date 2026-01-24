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
  | 'light'
  | 'magma'
  | 'quake'
  | 'buddha'
  | 'phoenix'
  | 'dragon'
  | 'leopard'
  | 'dough'
  | 'soul';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type AbilityType = 'attack' | 'defense' | 'special';

export interface Ability {
  id: string;
  name: string;
  type: AbilityType;
  damage: number;
  defense: number;
  description: string;
  cooldown: number;
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
  selectedTeam: FruitFighter[];
  fighters: FruitFighter[];
}

export interface TeamMember {
  fighter: FruitFighter;
  currentHealth: number;
  isAlive: boolean;
  cooldowns: Record<string, number>;
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

export type GameScreen = 'lobby' | 'fighters' | 'team-select' | 'battle' | 'settings' | 'mode-select';
