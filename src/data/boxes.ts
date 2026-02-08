import { BoxInfo, Rarity } from '@/types/game';

export const BOXES: BoxInfo[] = [
  {
    type: 'basic',
    name: 'Basic Box',
    cost: 50,
    emoji: '📦',
    description: 'Contains common and rare fruits with a chance for gems',
    gemChance: 0.3,
    gemRange: [5, 15],
    fruitRarityWeights: {
      common: 60,
      rare: 30,
      epic: 8,
      mythic: 2,
      legendary: 0,
    },
  },
  {
    type: 'premium',
    name: 'Premium Box',
    cost: 150,
    emoji: '🎁',
    description: 'Higher chance for epic and mythic fruits plus more gems',
    gemChance: 0.5,
    gemRange: [10, 30],
    fruitRarityWeights: {
      common: 20,
      rare: 35,
      epic: 30,
      mythic: 12,
      legendary: 3,
    },
  },
  {
    type: 'legendary',
    name: 'Legendary Box',
    cost: 400,
    emoji: '👑',
    description: 'Guaranteed epic or higher with legendary chance and tons of gems',
    gemChance: 0.8,
    gemRange: [25, 60],
    fruitRarityWeights: {
      common: 0,
      rare: 10,
      epic: 40,
      mythic: 35,
      legendary: 15,
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
