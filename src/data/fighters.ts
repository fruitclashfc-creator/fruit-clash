import { FruitFighter, Ability } from '@/types/game';

// Helper to create abilities
const createAbility = (
  id: string,
  name: string,
  type: 'attack' | 'defense' | 'special',
  damage: number,
  defense: number,
  description: string,
  cooldown: number = 0,
  options?: {
    reflectsDamage?: boolean;
    reflectTargetRarity?: ('common' | 'rare')[];
    canDefendWhileAttacking?: boolean;
    unstoppable?: boolean;
  }
): Ability => ({
  id,
  name,
  type,
  damage,
  defense,
  description,
  cooldown,
  ...options,
});

export const FRUIT_FIGHTERS: FruitFighter[] = [
  // ===== Common Tier =====
  {
    id: 'slime',
    name: 'Slime',
    fruitType: 'slime',
    rarity: 'common',
    health: 100,
    maxHealth: 100,
    attack: 15,
    defense: 10,
    speed: 12,
    abilities: [
      createAbility('slime-1', 'Goo Smack', 'attack', 50, 0, 'A squishy but powerful slap'),
      createAbility('slime-2', 'Bounce Back', 'defense', 100, 50, 'Reflects attacks back at common/rare attackers', 0, {
        reflectsDamage: true,
        reflectTargetRarity: ['common', 'rare'],
      }),
    ],
    emoji: '🟪',
    color: 'from-pink-400 to-pink-600',
  },
  {
    id: 'light',
    name: 'Light',
    fruitType: 'light',
    rarity: 'common',
    health: 300,
    maxHealth: 300,
    attack: 20,
    defense: 8,
    speed: 18,
    abilities: [
      createAbility('light-1', 'Spark Strike', 'attack', 50, 0, 'A simple light attack'),
      createAbility('light-2', 'Radiant Beam', 'special', 100, 0, 'Powerful light beam that can block while attacking', 0, {
        canDefendWhileAttacking: true,
      }),
    ],
    emoji: '⭐',
    color: 'from-yellow-200 to-amber-400',
  },
  {
    id: 'buddha',
    name: 'Buddha',
    fruitType: 'buddha',
    rarity: 'common',
    health: 500,
    maxHealth: 500,
    attack: 25,
    defense: 15,
    speed: 8,
    abilities: [
      createAbility('buddha-1', 'Palm Strike', 'attack', 50, 0, 'A powerful palm attack'),
      createAbility('buddha-2', 'Divine Beam', 'special', 250, 0, 'Unstoppable energy beam that cannot be blocked by Slime', 0, {
        unstoppable: true,
      }),
    ],
    emoji: '☸️',
    color: 'from-yellow-400 to-amber-500',
  },
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

  // ===== Rare Tier =====
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
  // NEW: Barrier
  {
    id: 'barrier',
    name: 'Barrier',
    fruitType: 'spring', // reuse spring type
    rarity: 'rare',
    health: 110,
    maxHealth: 110,
    attack: 16,
    defense: 30,
    speed: 10,
    abilities: [
      createAbility('barrier-1', 'Barrier Crash', 'attack', 24, 0, 'Ram enemies with a solid barrier'),
      createAbility('barrier-2', 'Bari Bari Wall', 'defense', 0, 50, 'Create an unbreakable barrier wall'),
      createAbility('barrier-3', 'Barrier Ball', 'special', 40, 0, 'Encase in barrier and charge', 2),
    ],
    emoji: '🛡️',
    color: 'from-violet-400 to-violet-600',
  },
  // NEW: Rubber
  {
    id: 'rubber',
    name: 'Rubber',
    fruitType: 'spring', // reuse spring type
    rarity: 'rare',
    health: 105,
    maxHealth: 105,
    attack: 26,
    defense: 16,
    speed: 22,
    abilities: [
      createAbility('rubber-1', 'Gum Pistol', 'attack', 30, 0, 'Stretch arm for a powerful punch'),
      createAbility('rubber-2', 'Gum Gatling', 'special', 48, 0, 'Rapid barrage of stretchy punches', 2),
      createAbility('rubber-3', 'Gum Balloon', 'defense', 0, 35, 'Inflate body to deflect attacks'),
    ],
    emoji: '🥊',
    color: 'from-red-400 to-red-600',
  },

  // ===== Epic Tier =====
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
  // NEW: Gravity
  {
    id: 'gravity',
    name: 'Gravity',
    fruitType: 'dark', // reuse dark type
    rarity: 'epic',
    health: 110,
    maxHealth: 110,
    attack: 34,
    defense: 18,
    speed: 16,
    abilities: [
      createAbility('gravity-1', 'Gravity Blade', 'attack', 38, 0, 'Slash with gravitational force'),
      createAbility('gravity-2', 'Gravity Pull', 'special', 55, 0, 'Crush enemies with intense gravity', 3),
      createAbility('gravity-3', 'Meteor Rain', 'special', 68, 0, 'Pull meteors from the sky', 4),
    ],
    emoji: '🪐',
    color: 'from-indigo-600 to-indigo-900',
  },
  // NEW: Portal
  {
    id: 'portal',
    name: 'Portal',
    fruitType: 'dark', // reuse dark type
    rarity: 'epic',
    health: 100,
    maxHealth: 100,
    attack: 30,
    defense: 20,
    speed: 22,
    abilities: [
      createAbility('portal-1', 'Warp Strike', 'attack', 36, 0, 'Teleport behind enemy and strike'),
      createAbility('portal-2', 'Dimension Rift', 'special', 58, 0, 'Open a rift to another dimension', 3),
      createAbility('portal-3', 'Void Shield', 'defense', 0, 42, 'Create a portal to absorb attacks'),
    ],
    emoji: '🌀',
    color: 'from-fuchsia-500 to-purple-700',
  },

  // ===== Mythic Tier =====
  {
    id: 'magma',
    name: 'Magma',
    fruitType: 'magma',
    rarity: 'mythic',
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
    id: 'phoenix',
    name: 'Phoenix',
    fruitType: 'phoenix',
    rarity: 'mythic',
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
  // NEW: Venom
  {
    id: 'venom',
    name: 'Venom',
    fruitType: 'smoke', // reuse smoke type
    rarity: 'mythic',
    health: 120,
    maxHealth: 120,
    attack: 38,
    defense: 16,
    speed: 20,
    abilities: [
      createAbility('venom-1', 'Poison Fang', 'attack', 44, 0, 'Inject deadly venom into enemies'),
      createAbility('venom-2', 'Toxic Cloud', 'special', 70, 0, 'Release a cloud of toxic gas', 4),
      createAbility('venom-3', 'Venom Demon', 'special', 88, 0, 'Transform into a giant venom demon', 5),
    ],
    emoji: '☠️',
    color: 'from-purple-600 to-green-700',
  },
  // NEW: Control
  {
    id: 'control',
    name: 'Control',
    fruitType: 'dark', // reuse dark type
    rarity: 'mythic',
    health: 115,
    maxHealth: 115,
    attack: 36,
    defense: 22,
    speed: 18,
    abilities: [
      createAbility('control-1', 'Room', 'attack', 40, 0, 'Create a sphere of absolute control'),
      createAbility('control-2', 'Shambles', 'special', 72, 0, 'Rearrange anything in your room', 4),
      createAbility('control-3', 'Gamma Knife', 'special', 85, 0, 'Internal devastation attack', 5),
    ],
    emoji: '⚡',
    color: 'from-blue-500 to-yellow-500',
  },

  // ===== Legendary Tier =====
  {
    id: 'dragon',
    name: 'Dragon',
    fruitType: 'dragon',
    rarity: 'legendary',
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
    rarity: 'legendary',
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
    rarity: 'legendary',
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
  // NEW: Mammoth
  {
    id: 'mammoth',
    name: 'Mammoth',
    fruitType: 'quake', // reuse quake type
    rarity: 'legendary',
    health: 150,
    maxHealth: 150,
    attack: 44,
    defense: 28,
    speed: 10,
    abilities: [
      createAbility('mammoth-1', 'Hybrid Charge', 'attack', 50, 0, 'Massive hybrid beast charge'),
      createAbility('mammoth-2', 'Mammoth Shield', 'defense', 0, 60, 'Ancient beast armor'),
      createAbility('mammoth-3', 'Extinction Impact', 'special', 98, 0, 'World-ending stomp', 5),
    ],
    emoji: '🦣',
    color: 'from-amber-600 to-stone-700',
  },
  // NEW: Spirit
  {
    id: 'spirit',
    name: 'Spirit',
    fruitType: 'soul', // reuse soul type
    rarity: 'legendary',
    health: 130,
    maxHealth: 130,
    attack: 46,
    defense: 20,
    speed: 28,
    abilities: [
      createAbility('spirit-1', 'Spirit Fist', 'attack', 50, 0, 'Strike with pure spirit energy'),
      createAbility('spirit-2', 'Astral Form', 'defense', 0, 52, 'Phase into the spirit world'),
      createAbility('spirit-3', 'Awakening', 'special', 96, 0, 'Unleash full spiritual power', 5),
    ],
    emoji: '🔮',
    color: 'from-cyan-400 to-purple-600',
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
    case 'legendary':
      return 'text-pink-400 border-pink-400';
    case 'mythic':
      return 'text-game-legendary border-game-legendary';
    case 'epic':
      return 'text-game-epic border-game-epic';
    case 'rare':
      return 'text-game-rare border-game-rare';
    default:
      return 'text-game-common border-game-common';
  }
};
