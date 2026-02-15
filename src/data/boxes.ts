import { BoxInfo, Rarity } from '@/types/game';

export const BOXES: BoxInfo[] = [
  {
    type: 'basic',
    name: 'Basic Box',
    cost: 50,
    emoji: '📦',
    description: 'All rarities possible! Lower legendary chance',
    gemChance: 0.4,
    gemRange: [5, 20],
    fruitRarityWeights: {
      common: 50,
      rare: 28,
      epic: 14,
      mythic: 6,
      legendary: 2,
    },
  },
  {
    type: 'premium',
    name: 'Premium Box',
    cost: 150,
    emoji: '🎁',
    description: 'Better odds for epic+ and more gems',
    gemChance: 0.6,
    gemRange: [15, 40],
    fruitRarityWeights: {
      common: 20,
      rare: 30,
      epic: 28,
      mythic: 15,
      legendary: 7,
    },
  },
  {
    type: 'legendary',
    name: 'Legendary Box',
    cost: 400,
    emoji: '👑',
    description: 'Highest legendary chance with massive gem rewards',
    gemChance: 0.85,
    gemRange: [30, 80],
    fruitRarityWeights: {
      common: 5,
      rare: 15,
      epic: 30,
      mythic: 30,
      legendary: 20,
    },
  },
];

export const getBoxByType = (type: string): BoxInfo | undefined => {
  return BOXES.find(b => b.type === type);
};

export const rollBox = (box: BoxInfo): { fruit: Rarity; gems: number } => {
  // Roll rarity
  const totalWeight = Object.values(box.fruitRarityWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let fruit: Rarity = 'common';
  
  for (const [rarity, weight] of Object.entries(box.fruitRarityWeights)) {
    roll -= weight;
    if (roll <= 0) {
      fruit = rarity as Rarity;
      break;
    }
  }

  // Roll gems
  let gems = 0;
  if (Math.random() < box.gemChance) {
    gems = Math.floor(Math.random() * (box.gemRange[1] - box.gemRange[0] + 1)) + box.gemRange[0];
  }

  return { fruit, gems };
};
