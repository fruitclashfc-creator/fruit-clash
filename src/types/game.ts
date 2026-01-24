export type FruitType = 
  | 'flame'
  | 'ice'
  | 'light'
  | 'dark'
  | 'magma'
  | 'buddha'
  | 'phoenix'
  | 'dragon';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface FruitFighter {
  id: string;
  name: string;
  fruitType: FruitType;
  rarity: Rarity;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  ability: string;
  abilityDescription: string;
  emoji: string;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  trophies: number;
  level: number;
  selectedFighter: FruitFighter | null;
  fighters: FruitFighter[];
}

export interface BattleState {
  player: {
    fighter: FruitFighter;
    currentHealth: number;
    energy: number;
  };
  opponent: {
    fighter: FruitFighter;
    currentHealth: number;
    energy: number;
    isBot: boolean;
  };
  turn: 'player' | 'opponent';
  battleLog: string[];
  isActive: boolean;
  winner: 'player' | 'opponent' | null;
}

export type GameScreen = 'lobby' | 'fighters' | 'battle' | 'settings' | 'mode-select';
