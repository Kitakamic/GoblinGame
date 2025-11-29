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
  {
    id: 'audience_hall',
    name: '谒见厅',
    icon: '👑',
    description: '主事大厅，可以选择一位秘书官玩耍',
    cost: { gold: 0, food: 0 },
    category: 'global',
    effects: [
      { type: 'audience', icon: '👑', description: '接待访客' },
      { type: 'report', icon: '📄', description: '听取报告和事件' },
    ],
    maxCount: 1,
  },
  // 暂时屏蔽其他全局建筑，只保留谒见厅
  // {
  //   id: 'brothel',
  //   name: '妓院',
  //   icon: '💋',
  //   description: '提供特殊服务，每回合获得大量金钱收入',
  //   cost: { gold: 500, food: 200 },
  //   category: 'global',
  //   income: { gold: 100 },
  //   effects: [{ type: 'income', icon: '💰', description: '每回合+100金钱' }],
  //   maxCount: 1, // 每个全局建筑只能建造一个
  // },
  // {
  //   id: 'shop',
  //   name: '商店',
  //   icon: '🏪',
  //   description: '奇奇妙妙小道具，根据看板娘喜好随机出售',
  //   cost: { gold: 400, food: 150 },
  //   category: 'global',
  //   income: { gold: 60 },
  //   effects: [{ type: 'income', icon: '💰', description: '每回合+60金钱' }],
  //   maxCount: 1,
  // },
  // {
  //   id: 'embassy',
  //   name: '大使馆',
  //   icon: '🏛️',
  //   description: '和其他势力人物进行外交沟通，拜托不要乱来啊！！！',
  //   cost: { gold: 800, food: 300 },
  //   category: 'global',
  //   income: { gold: 50 },
  //   effects: [
  //     { type: 'diplomacy', icon: '🤝', description: '提升外交关系' },
  //     { type: 'income', icon: '💰', description: '每回合+50金钱' },
  //   ],
  //   maxCount: 1,
  // },
  // {
  //   id: 'meeting_room',
  //   name: '会议室',
  //   icon: '🏛️',
  //   description: '召开重要会议，提升管理效率和决策能力',
  //   cost: { gold: 600, food: 250 },
  //   category: 'global',
  //   effects: [{ type: 'management', icon: '📋', description: '提升管理效率' }],
  //   maxCount: 1,
  // },
  // {
  //   id: 'bedroom',
  //   name: '卧室',
  //   icon: '🛏️',
  //   description: '还可以品品茶聊聊天',
  //   cost: { gold: 300, food: 100 },
  //   category: 'global',
  //   effects: [{ type: 'rest', icon: '💤', description: '提升体力恢复速度' }],
  //   maxCount: 1,
  // },
  // {
  //   id: 'mercenary_camp',
  //   name: '冒险者营地',
  //   icon: '⚔️',
  //   description: '招募和管理冒险者，增强巢穴的战斗力',
  //   cost: { gold: 700, food: 400 },
  //   category: 'global',
  //   effects: [{ type: 'mercenary', icon: '⚔️', description: '招募和管理冒险者' }],
  //   maxCount: 1,
  // },
];
