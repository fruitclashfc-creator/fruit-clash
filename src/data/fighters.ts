import { FruitFighter, Ability } from '@/types/game';

// Helper to create abilities
const createAbility = (
  id: string,
  name: string,
  type: 'attack' | 'defense' | 'special',
  damage: number,
  defense: number,
  description: string,
  cooldown: number = 0
): Ability => ({
  id,
  name,
  type,
  damage,
  defense,
  description,
  cooldown,
});

export const FRUIT_FIGHTERS: FruitFighter[] = [
  // Common Tier
  {
    id: 'bomb',
    name: 'Bomb',
    fruitType: 'bomb',
    rarity: 'common',
    health: 80,
    maxHealth: 80,
    attack: 20,
    defense: 10,
    speed: 15,
    abilities: [
      createAbility('bomb-1', 'Bomb Throw', 'attack', 25, 0, 'Throw an explosive bomb at the enemy'),
      createAbility('bomb-2', 'Self Destruct', 'special', 50, 0, 'Massive explosion dealing heavy damage', 2),
    ],
    emoji: '💣',
    color: 'from-gray-600 to-gray-800',
  },
  {
    id: 'spike',
    name: 'Spike',
    fruitType: 'spike',
    rarity: 'common',
    health: 85,
    maxHealth: 85,
    attack: 22,
    defense: 12,
    speed: 14,
    abilities: [
      createAbility('spike-1', 'Spike Barrage', 'attack', 20, 0, 'Launch a volley of sharp spikes'),
      createAbility('spike-2', 'Thorn Shield', 'defense', 0, 30, 'Create a protective thorn barrier'),
    ],
    emoji: '🦔',
    color: 'from-stone-500 to-stone-700',
  },
  {
    id: 'chop',
    name: 'Chop',
    fruitType: 'chop',
    rarity: 'common',
    health: 90,
    maxHealth: 90,
    attack: 18,
    defense: 15,
    speed: 12,
    abilities: [
      createAbility('chop-1', 'Divide', 'attack', 22, 0, 'Split body to attack from multiple angles'),
    ],
    emoji: '🪓',
    color: 'from-amber-700 to-amber-900',
  },
  {
    id: 'spring',
    name: 'Spring',
    fruitType: 'spring',
    rarity: 'common',
    health: 75,
    maxHealth: 75,
    attack: 15,
    defense: 8,
    speed: 25,
    abilities: [
      createAbility('spring-1', 'Spring Leap', 'attack', 18, 0, 'Bounce attack with spring legs'),
      createAbility('spring-2', 'Coil Defense', 'defense', 0, 25, 'Coil up to absorb damage'),
    ],
    emoji: '🌀',
    color: 'from-pink-400 to-pink-600',
  },

  // Rare Tier
  {
    id: 'smoke',
    name: 'Smoke',
    fruitType: 'smoke',
    rarity: 'rare',
    health: 90,
    maxHealth: 90,
    attack: 24,
    defense: 14,
    speed: 20,
    abilities: [
      createAbility('smoke-1', 'White Blow', 'attack', 28, 0, 'Dense smoke punch attack'),
      createAbility('smoke-2', 'Smoke Screen', 'defense', 0, 35, 'Create smoke cloud for protection'),
      createAbility('smoke-3', 'White Out', 'special', 45, 0, 'Overwhelming smoke assault', 2),
    ],
    emoji: '💨',
    color: 'from-gray-400 to-gray-600',
  },
  {
    id: 'flame',
    name: 'Flame',
    fruitType: 'flame',
    rarity: 'rare',
    health: 95,
    maxHealth: 95,
    attack: 28,
    defense: 12,
    speed: 22,
    abilities: [
      createAbility('flame-1', 'Fire Fist', 'attack', 30, 0, 'Blazing punch of flames'),
      createAbility('flame-2', 'Flame Pillar', 'special', 50, 0, 'Erupting column of fire', 2),
    ],
    emoji: '🔥',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'ice',
    name: 'Ice',
    fruitType: 'ice',
    rarity: 'rare',
    health: 100,
    maxHealth: 100,
    attack: 22,
    defense: 25,
    speed: 16,
    abilities: [
      createAbility('ice-1', 'Ice Saber', 'attack', 26, 0, 'Slash with a frozen blade'),
      createAbility('ice-2', 'Ice Wall', 'defense', 0, 40, 'Create an impenetrable ice barrier'),
      createAbility('ice-3', 'Ice Age', 'special', 55, 0, 'Freeze the entire battlefield', 3),
    ],
    emoji: '❄️',
    color: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'sand',
    name: 'Sand',
    fruitType: 'sand',
    rarity: 'rare',
    health: 95,
    maxHealth: 95,
    attack: 25,
    defense: 18,
    speed: 18,
    abilities: [
      createAbility('sand-1', 'Desert Spada', 'attack', 32, 0, 'Blade of compressed sand'),
      createAbility('sand-2', 'Sables', 'special', 48, 0, 'Sandstorm vortex attack', 2),
    ],
    emoji: '🏜️',
    color: 'from-yellow-600 to-amber-700',
  },

  // Epic Tier
  {
    id: 'dark',
    name: 'Dark',
    fruitType: 'dark',
    rarity: 'epic',
    health: 105,
    maxHealth: 105,
    attack: 32,
    defense: 16,
    speed: 24,
    abilities: [
      createAbility('dark-1', 'Dark Vortex', 'attack', 35, 0, 'Pull enemies into darkness'),
      createAbility('dark-2', 'Black Hole', 'special', 60, 0, 'Devastating gravity attack', 3),
      createAbility('dark-3', 'Liberation', 'special', 70, 0, 'Release absorbed darkness', 4),
    ],
    emoji: '🌑',
    color: 'from-purple-900 to-gray-900',
  },
  {
    id: 'light',
    name: 'Light',
    fruitType: 'light',
    rarity: 'epic',
    health: 95,
    maxHealth: 95,
    attack: 35,
    defense: 10,
    speed: 30,
    abilities: [
      createAbility('light-1', 'Light Beam', 'attack', 38, 0, 'Concentrated beam of light'),
      createAbility('light-2', 'Mirror Shield', 'defense', 0, 35, 'Reflect incoming attacks'),
      createAbility('light-3', 'Yata Mirror', 'special', 65, 0, 'Ultimate light devastation', 3),
    ],
    emoji: '✨',
    color: 'from-yellow-300 to-amber-500',
  },
  {
    id: 'quake',
    name: 'Quake',
    fruitType: 'quake',
    rarity: 'epic',
    health: 120,
    maxHealth: 120,
    attack: 30,
    defense: 22,
    speed: 12,
    abilities: [
      createAbility('quake-1', 'Tremor Punch', 'attack', 40, 0, 'Earth-shattering fist'),
      createAbility('quake-2', 'Seismic Wave', 'special', 58, 0, 'Massive earthquake attack', 3),
    ],
    emoji: '💥',
    color: 'from-slate-600 to-slate-800',
  },
  {
    id: 'dough',
    name: 'Dough',
    fruitType: 'dough',
    rarity: 'epic',
    health: 115,
    maxHealth: 115,
    attack: 28,
    defense: 24,
    speed: 14,
    abilities: [
      createAbility('dough-1', 'Mochi Punch', 'attack', 34, 0, 'Sticky powerful strike'),
      createAbility('dough-2', 'Mochi Shield', 'defense', 0, 45, 'Absorbing dough barrier'),
      createAbility('dough-3', 'Buzz Cut Mochi', 'special', 62, 0, 'Spinning dough assault', 3),
    ],
    emoji: '🍡',
    color: 'from-pink-300 to-pink-500',
  },

  // Legendary Tier
  {
    id: 'magma',
    name: 'Magma',
    fruitType: 'magma',
    rarity: 'legendary',
    health: 130,
    maxHealth: 130,
    attack: 40,
    defense: 18,
    speed: 14,
    abilities: [
      createAbility('magma-1', 'Meteor Fist', 'attack', 45, 0, 'Molten lava punch'),
      createAbility('magma-2', 'Great Eruption', 'special', 75, 0, 'Volcanic eruption assault', 4),
      createAbility('magma-3', 'Meteor Volcano', 'special', 90, 0, 'Rain of magma meteors', 5),
    ],
    emoji: '🌋',
    color: 'from-red-600 to-orange-700',
  },
  {
    id: 'buddha',
    name: 'Buddha',
    fruitType: 'buddha',
    rarity: 'legendary',
    health: 150,
    maxHealth: 150,
    attack: 25,
    defense: 35,
    speed: 10,
    abilities: [
      createAbility('buddha-1', 'Enlightened Fist', 'attack', 35, 0, 'Giant golden punch'),
      createAbility('buddha-2', 'Divine Shield', 'defense', 0, 60, 'Impenetrable golden barrier'),
      createAbility('buddha-3', 'Transformation', 'special', 55, 20, 'Giant form power boost', 4),
    ],
    emoji: '🧘',
    color: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    fruitType: 'phoenix',
    rarity: 'legendary',
    health: 110,
    maxHealth: 110,
    attack: 35,
    defense: 20,
    speed: 26,
    abilities: [
      createAbility('phoenix-1', 'Blue Flames', 'attack', 42, 0, 'Healing blue fire attack'),
      createAbility('phoenix-2', 'Regeneration', 'defense', 0, 50, 'Heal and protect with flames'),
      createAbility('phoenix-3', 'Rebirth', 'special', 80, 0, 'Rise from ashes with power', 5),
    ],
    emoji: '🦅',
    color: 'from-blue-400 to-cyan-600',
  },

  // Mythic Tier
  {
    id: 'dragon',
    name: 'Dragon',
    fruitType: 'dragon',
    rarity: 'mythic',
    health: 140,
    maxHealth: 140,
    attack: 45,
    defense: 25,
    speed: 22,
    abilities: [
      createAbility('dragon-1', 'Dragon Claw', 'attack', 48, 0, 'Devastating dragon slash'),
      createAbility('dragon-2', 'Dragon Scales', 'defense', 0, 55, 'Impervious dragon armor'),
      createAbility('dragon-3', 'Dragon Breath', 'special', 85, 0, 'Scorching dragon fire', 4),
    ],
    emoji: '🐉',
    color: 'from-emerald-500 to-teal-700',
  },
  {
    id: 'leopard',
    name: 'Leopard',
    fruitType: 'leopard',
    rarity: 'mythic',
    health: 125,
    maxHealth: 125,
    attack: 48,
    defense: 18,
    speed: 35,
    abilities: [
      createAbility('leopard-1', 'Predator Rush', 'attack', 52, 0, 'Lightning-fast pounce'),
      createAbility('leopard-2', 'Spirit of Drums', 'special', 90, 0, 'Ultimate beast awakening', 5),
      createAbility('leopard-3', 'Thunder Bagua', 'special', 100, 0, 'Devastating god strike', 6),
    ],
    emoji: '🐆',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    id: 'soul',
    name: 'Soul',
    fruitType: 'soul',
    rarity: 'mythic',
    health: 135,
    maxHealth: 135,
    attack: 42,
    defense: 22,
    speed: 20,
    abilities: [
      createAbility('soul-1', 'Soul Steal', 'attack', 45, 0, 'Drain life force from enemy'),
      createAbility('soul-2', 'Homie Defense', 'defense', 0, 50, 'Summon homies to protect'),
      createAbility('soul-3', 'Soul Pocus', 'special', 95, 0, 'Command over souls', 5),
    ],
    emoji: '👻',
    color: 'from-pink-500 to-purple-600',
  },
];

export const getRandomFighter = (): FruitFighter => {
  const index = Math.floor(Math.random() * FRUIT_FIGHTERS.length);
  return { ...FRUIT_FIGHTERS[index] };
};

export const getRandomTeam = (size: number = 6): FruitFighter[] => {
  const shuffled = [...FRUIT_FIGHTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, size).map(f => ({ ...f }));
};

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'mythic':
      return 'text-pink-400 border-pink-400';
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
