import { FruitFighter } from '@/types/game';

export const FRUIT_FIGHTERS: FruitFighter[] = [
  {
    id: 'flame-warrior',
    name: 'Blaze',
    fruitType: 'flame',
    rarity: 'rare',
    health: 100,
    maxHealth: 100,
    attack: 25,
    defense: 15,
    speed: 20,
    ability: 'Fire Storm',
    abilityDescription: 'Unleash a devastating fire storm dealing 40 damage',
    emoji: '🔥',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'ice-guardian',
    name: 'Frost',
    fruitType: 'ice',
    rarity: 'rare',
    health: 110,
    maxHealth: 110,
    attack: 20,
    defense: 25,
    speed: 15,
    ability: 'Frozen Barrier',
    abilityDescription: 'Create an ice shield blocking 30 damage',
    emoji: '❄️',
    color: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'light-sage',
    name: 'Lumina',
    fruitType: 'light',
    rarity: 'epic',
    health: 90,
    maxHealth: 90,
    attack: 30,
    defense: 10,
    speed: 30,
    ability: 'Divine Flash',
    abilityDescription: 'A blinding light attack dealing 50 damage',
    emoji: '✨',
    color: 'from-yellow-300 to-amber-500',
  },
  {
    id: 'dark-shadow',
    name: 'Umbra',
    fruitType: 'dark',
    rarity: 'epic',
    health: 95,
    maxHealth: 95,
    attack: 28,
    defense: 18,
    speed: 25,
    ability: 'Shadow Strike',
    abilityDescription: 'Strike from the shadows for 45 piercing damage',
    emoji: '🌑',
    color: 'from-purple-600 to-gray-900',
  },
  {
    id: 'magma-titan',
    name: 'Vulcan',
    fruitType: 'magma',
    rarity: 'legendary',
    health: 130,
    maxHealth: 130,
    attack: 35,
    defense: 20,
    speed: 10,
    ability: 'Volcanic Eruption',
    abilityDescription: 'Massive eruption dealing 60 damage to all',
    emoji: '🌋',
    color: 'from-red-600 to-orange-700',
  },
  {
    id: 'buddha-monk',
    name: 'Zenith',
    fruitType: 'buddha',
    rarity: 'legendary',
    health: 150,
    maxHealth: 150,
    attack: 22,
    defense: 35,
    speed: 8,
    ability: 'Giant Form',
    abilityDescription: 'Transform into a giant, boosting all stats by 50%',
    emoji: '🧘',
    color: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'phoenix-rise',
    name: 'Pyra',
    fruitType: 'phoenix',
    rarity: 'legendary',
    health: 85,
    maxHealth: 85,
    attack: 32,
    defense: 12,
    speed: 28,
    ability: 'Rebirth Flame',
    abilityDescription: 'Revive with 50% health once per battle',
    emoji: '🦅',
    color: 'from-orange-400 to-rose-600',
  },
  {
    id: 'dragon-lord',
    name: 'Draco',
    fruitType: 'dragon',
    rarity: 'legendary',
    health: 120,
    maxHealth: 120,
    attack: 40,
    defense: 25,
    speed: 22,
    ability: 'Dragon Breath',
    abilityDescription: 'Unleash dragon fire dealing 70 damage',
    emoji: '🐉',
    color: 'from-emerald-500 to-teal-700',
  },
];

export const getRandomFighter = (): FruitFighter => {
  const index = Math.floor(Math.random() * FRUIT_FIGHTERS.length);
  return { ...FRUIT_FIGHTERS[index] };
};

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary':
      return 'text-game-legendary border-game-legendary';
    case 'epic':
      return 'text-game-epic border-game-epic';
    case 'rare':
      return 'text-game-rare border-game-rare';
    default:
      return 'text-game-common border-game-common';
  }
};
