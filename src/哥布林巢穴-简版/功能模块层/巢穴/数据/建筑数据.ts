import type { Building } from '../类型/建筑类型';

/**
 * 繁殖间建筑列表
 */
export const breedingBuildings: Building[] = [
  {
    id: 'breeding',
    name: '繁殖间',
    icon: '👶',
    description: '用于俘虏生育哥布林',
    cost: { gold: 50, food: 30 },
    category: 'breeding',
    effects: [{ type: 'breeding', icon: '👶', description: '俘虏生育哥布林' }],
  },
];

/**
 * 资源建筑列表
 */
export const resourceBuildings: Building[] = [
  {
    id: 'food',
    name: '食物间',
    icon: '🍖',
    description: '每回合+20食物',
    cost: { gold: 100, food: 50 },
    category: 'resource',
    income: { food: 20 },
    effects: [{ type: 'food', icon: '🍖', description: '每回合+20食物' }],
  },
  {
    id: 'trade',
    name: '贸易间',
    icon: '💰',
    description: '每回合+30金钱',
    cost: { gold: 150, food: 30 },
    category: 'resource',
    income: { gold: 30 },
    effects: [{ type: 'gold', icon: '💰', description: '每回合+30金钱' }],
  },
  {
    id: 'food_warehouse',
    name: '食物仓库',
    icon: '🏚️',
    description: '提高食物储存，食物总收入+10%',
    cost: { gold: 200, food: 120 },
    category: 'resource',
    effects: [{ type: 'food_multiplier', icon: '🍖', description: '食物收入+10%' }],
  },
  {
    id: 'gold_hall',
    name: '金币大厅',
    icon: '🏦',
    description: '改善金币储存，金币总收入+10%',
    cost: { gold: 260, food: 80 },
    category: 'resource',
    effects: [{ type: 'gold_multiplier', icon: '💰', description: '金钱收入+10%' }],
  },
  {
    id: 'sacrifice_altar',
    name: '献祭祭坛',
    icon: '🔥',
    description: '献祭哥布林升级人物等级',
    cost: { gold: 3000, food: 1500 },
    category: 'resource',
    effects: [{ type: 'sacrifice', icon: '🔥', description: '献祭哥布林升级等级' }],
  },
];

/**
 * 全局建筑列表
 */
export const globalBuildings: Building[] = [
  // 可以在这里添加全局建筑
];
