/**
 * 模块化存档类型定义
 * 统一管理游戏数据结构和初始配置
 */
import type { Character } from '../人物管理/类型/人物类型';
import { CUSTOM_CHARACTERS, CUSTOM_LOCATIONS } from '../人物管理/类型/传奇人物和据点';
import type { Continent, ContinentExploreState } from '../探索/类型/大陆探索类型';
import type { Location } from '../探索/类型/探索类型';

// ==================== 游戏配置常量 ====================

export const GAME_VERSION = '1.0.0';
export const DATABASE_NAME = 'GoblinNestGame';
export const DATABASE_VERSION = 4;

// ==================== 初始数据配置 ====================

// 初始资源配置
export const INITIAL_RESOURCES: BaseResources = {
  gold: 1000,
  food: 1000,
  threat: 0,
  slaves: 0,
  normalGoblins: 100,
  warriorGoblins: 0,
  shamanGoblins: 0,
  paladinGoblins: 0,
  trainingSlaves: 1,
  rounds: 0,
  // 行动力系统初始值
  actionPoints: 3, // 初始行动力为3
  maxActionPoints: 3, // 初始上限为3
  conqueredRegions: 0, // 初始征服区域为0
} as const;

// 初始巢穴数据（包含建筑数据）
export const INITIAL_NEST_DATA: NestModuleData = {
  breedingSlots: [
    {
      building: {
        id: 'breeding',
        name: '繁殖间',
        icon: '👶',
        description: '用于俘虏生育哥布林',
        cost: { gold: 50, food: 30 },
        category: 'breeding',
        effects: [{ type: 'breeding', icon: '👶', description: '俘虏生育哥布林' }],
      },
      unlocked: true,
    },
    {
      building: null,
      unlocked: false,
    },
  ],
  resourceSlots: [
    {
      building: {
        id: 'food',
        name: '食物间',
        icon: '🍖',
        description: '每回合生成食物',
        cost: { gold: 100, food: 50 },
        category: 'resource',
        income: { food: 20 },
        effects: [{ type: 'food', icon: '🍖', description: '每回合+20食物' }],
      },
      unlocked: true,
    },
    {
      building: {
        id: 'trade',
        name: '贸易间',
        icon: '💰',
        description: '每回合生成金钱',
        cost: { gold: 150, food: 30 },
        category: 'resource',
        income: { gold: 30 },
        effects: [{ type: 'gold', icon: '💰', description: '每回合+30金钱' }],
      },
      unlocked: true,
    },
    {
      building: null,
      unlocked: false,
    },
  ],
  activeTab: 'breeding',
  totalIncome: {
    gold: 30, // 贸易间收入
    food: 20, // 食物间收入
  },
  breedingRoomInfo: [], // 初始为空，表示没有繁殖间被占用
};

// 初始历史日志数据
export const INITIAL_HISTORY_DATA: HistoryModuleData = {
  roundHistory: [],
  maxHistoryEntries: 100, // 最多保存100条历史记录
};

// 基础调教数据
const BASE_TRAINING_CHARACTERS: Character[] = [
  // 玩家角色 - 特殊的玩家角色，不能调教，不显示在调教界面
  // 等级将根据我方人物中等级最高的人动态计算
  {
    id: 'player-1',
    name: '哥布林之王',
    title: '哥布林巢穴之主',
    avatar: 'https://files.catbox.moe/x4g8t7.jpg',
    status: 'player',
    canCombat: true,
    unitType: 'magical',
    loyalty: 100,
    stamina: 100,
    fertility: 0,
    offspring: 0,
    rating: 'S',
    favorite: true,
    level: 1, // 初始等级，实际等级将根据我方最高等级人物动态计算
    attributes: {
      attack: 40,
      defense: 50,
      intelligence: 70,
      speed: 20,
      health: 150,
    },
    race: '人类',
    age: 25,
    country: '哥布林巢穴',
    background: '贵族',
    sexExperience: '哥布林巢穴的统治者',
    sensitivePoints: [],
    sensitivePointsDetail: [],
    lifeStory: {
      childhood: [''],
      adolescence: [''],
      adulthood: [''],
      currentState: [''],
    },
    personality: [''],
    fears: '',
    secrets: '',
    appearance: {
      height: 150,
      weight: 45,
      measurements: '',
      description: '',
    },
  },
];

// 初始调教数据
export const INITIAL_TRAINING_DATA: TrainingModuleData = {
  characters: [...BASE_TRAINING_CHARACTERS, ...CUSTOM_CHARACTERS],
  trainingMessages: [], // 初始为空的消息记录
};

// 基础据点数据
const BASE_LOCATIONS: Location[] = [
  {
    id: 'small_village_1',
    name: '小村庄',
    type: 'village',
    icon: '🏘️',
    description: '一个普通的人类村庄，防御薄弱',
    difficulty: 1,
    distance: 5,
    rewards: { gold: 50, food: 30, slaves: 2 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '人类',
    baseGuards: 10,
  },
  {
    id: 'merchant_camp',
    name: '商队营地',
    type: 'village',
    icon: '🏕️',
    description: '临时商队营地，有丰富的货物',
    difficulty: 1,
    distance: 8,
    rewards: { gold: 100, food: 20 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '人类',
    baseGuards: 40,
  },
  {
    id: 'abandoned_fort',
    name: '废弃要塞',
    type: 'ruins',
    icon: '🏰',
    description: '古老的废弃要塞，可能有宝藏',
    difficulty: 3,
    distance: 12,
    rewards: { gold: 200 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '亡灵',
    baseGuards: 100,
    specialUnit: {
      name: '古代守卫',
      race: '亡灵',
      class: '骷髅战士',
      attributes: {
        attack: 25,
        defense: 30,
        intelligence: 15,
        speed: 20,
        health: 80,
      },
    },
  },
  {
    id: 'exile_village',
    name: '流放者村落',
    type: 'village',
    icon: '🏚️',
    description: '被流放种族的小型聚居地，环境恶劣但居民顽强',
    difficulty: 2,
    distance: 15,
    rewards: { gold: 80, food: 40, slaves: 3 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '流放者之地',
    race: '人类',
    baseGuards: 30,
  },
] as const;

// 合并基础据点和自定义据点
export const INITIAL_LOCATIONS: Location[] = [...BASE_LOCATIONS, ...CUSTOM_LOCATIONS];

// ==================== 数据类型定义 ====================

// 基础资源数据（所有模块共享）
export interface BaseResources {
  gold: number;
  food: number;
  threat: number;
  slaves: number;
  normalGoblins: number;
  warriorGoblins: number;
  shamanGoblins: number;
  paladinGoblins: number;
  trainingSlaves: number;
  rounds: number;
  // 行动力系统
  actionPoints: number; // 当前行动力
  maxActionPoints: number; // 最大行动力上限
  conqueredRegions: number; // 已征服的区域数量
}

// 历史日志模块数据
export interface HistoryModuleData {
  roundHistory: Array<{
    title: string;
    changes: Array<{
      type: string;
      amount: number;
    }>;
    timestamp: number;
  }>;
  maxHistoryEntries: number; // 最大历史记录条数
}

// 探索状态类型
export interface ExplorationState {
  scoutedLocations: string[];
  conqueredLocations: string[];
}

// 探索模块数据
export interface ExplorationModuleData {
  locations: Location[]; // 据点数据
  state: ExplorationState; // 探索状态
  scoutingLocations: string[]; // 正在侦察的据点ID列表
  scoutingAnimation: string[]; // 正在播放侦察动画的据点ID列表
  // 大陆探索数据
  continents: Continent[]; // 大陆数据
  continentExploreState: ContinentExploreState; // 大陆探索状态
}

// 调教消息记录
export interface TrainingMessage {
  id: string;
  characterId: string;
  characterName: string; // 人物名称
  sender: string;
  content: string;
  timestamp: number;
  gameTime: number; // 游戏中的时间
  role: 'user' | 'assistant' | 'system';
}

// 繁殖间占用信息
export interface BreedingRoomInfo {
  roomId: string; // 繁殖间ID (breeding-0, breeding-1, etc.)
  characterId?: string; // 占用的人物ID
  characterName?: string; // 占用的人物名称
  status: 'imprisoned' | 'breeding'; // 人物在繁殖间中的状态
  occupiedAt?: Date; // 占用时间
}

// 调教模块数据
export interface TrainingModuleData {
  characters: Character[]; // 人物数据列表（包含完整的人物信息，包括未捕获的英雄）
  trainingMessages: TrainingMessage[]; // 调教消息记录
}

// 巢穴模块统一接口
export interface NestModuleData {
  // 建筑槽位数据
  breedingSlots: {
    building: {
      id: string;
      name: string;
      icon: string;
      description: string;
      cost: { gold: number; food: number };
      category: 'breeding' | 'resource';
      income?: { gold?: number; food?: number };
      effects: { type: string; icon: string; description: string }[];
    } | null;
    unlocked: boolean;
  }[];
  resourceSlots: {
    building: {
      id: string;
      name: string;
      icon: string;
      description: string;
      cost: { gold: number; food: number };
      category: 'breeding' | 'resource';
      income?: { gold?: number; food?: number };
      effects: { type: string; icon: string; description: string }[];
    } | null;
    unlocked: boolean;
  }[];
  // 界面状态
  activeTab: 'breeding' | 'resource';
  // 巢穴收入总值（每回合计算后存储）
  totalIncome: {
    gold: number;
    food: number;
  };
  // 繁殖间占用信息
  breedingRoomInfo: BreedingRoomInfo[];
}

// 游戏元数据
export interface GameMetadata {
  gameVersion: string;
  lastSaved: number;
  totalPlayTime: number;
  gameStartTime: number;
}

// 完整的游戏数据（组合类型）
export type ModularGameData = {
  baseResources: BaseResources;
  exploration: ExplorationModuleData;
  nest: NestModuleData;
  history: HistoryModuleData;
  training: TrainingModuleData;
  metadata: GameMetadata;
};

// ==================== 存档系统接口 ====================

// 存档槽位数据
export interface ModularSaveSlot {
  slot: number;
  data: ModularGameData | null;
  timestamp: number;
  version: string;
  saveName: string;
}

// 存档操作选项
export interface ModularSaveOptions {
  slot: number;
  saveName?: string;
  gameData: ModularGameData;
}

export interface ModularLoadOptions {
  slot: number;
}

export interface ModularDeleteOptions {
  slot: number;
}

// 模块数据操作选项
export interface ModuleUpdateOptions {
  moduleName: 'exploration' | 'nest' | 'history' | 'training';
  data: any;
}

export interface ModuleDataOptions {
  moduleName: 'exploration' | 'nest' | 'history' | 'training';
}

// 存档管理事件
export interface ModularSaveManagerEvents {
  onSave?: (slot: number, data: ModularGameData) => void;
  onLoad?: (slot: number, data: ModularGameData) => void;
  onDelete?: (slot: number) => void;
  onModuleUpdate?: (moduleName: string, data: any) => void;
  onError?: (error: Error) => void;
}

// 创建完整游戏数据
export function createFullGameData(): ModularGameData {
  return {
    baseResources: { ...INITIAL_RESOURCES },
    exploration: {
      locations: [...INITIAL_LOCATIONS],
      state: {
        scoutedLocations: [],
        conqueredLocations: [],
      } as ExplorationState,
      scoutingLocations: [],
      scoutingAnimation: [],
      // 大陆探索初始数据
      continents: [],
      continentExploreState: {
        unlockedContinents: [],
        conqueredContinents: [],
        currentContinent: '',
        continentProgress: {},
      },
    },
    nest: { ...INITIAL_NEST_DATA },
    history: { ...INITIAL_HISTORY_DATA },
    training: { ...INITIAL_TRAINING_DATA },
    metadata: {
      gameVersion: GAME_VERSION,
      lastSaved: Date.now(),
      totalPlayTime: 0,
      gameStartTime: Date.now(),
    },
  };
}
