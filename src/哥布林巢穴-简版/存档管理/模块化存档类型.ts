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

// 初始部队配置数据
export const INITIAL_FORMATION_DATA: FormationModuleData = {
  currentFormation: Array(6).fill(null), // 6个队长槽位，初始为空
  savedConfigs: [], // 保存的配置列表，初始为空
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
    level: 0, // 初始等级，实际等级将根据我方最高等级人物动态计算
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
  // 巢穴秘书官 - 猫娘
  {
    id: 'secretary_catgirl',
    name: '小月',
    title: '巢穴秘书官',
    avatar: 'https://files.catbox.moe/catgirl_secretary.jpg',
    corruptedAvatar: 'https://files.catbox.moe/catgirl_secretary_corrupted.jpg',
    fullyCorruptedAvatar: 'https://files.catbox.moe/catgirl_secretary_fully_corrupted.jpg',
    status: 'player',
    canCombat: true,
    unitType: 'magical',
    loyalty: 100,
    stamina: 100,
    maxStamina: 100,
    fertility: 85,
    maxFertility: 85,
    offspring: 0,
    rating: 'A',
    favorite: true,
    level: 3,
    attributes: {
      attack: 25,
      defense: 20,
      intelligence: 45,
      speed: 35,
      health: 100,
    },
    race: '魔族',
    age: 18,
    country: '哥布林巢穴',
    background: '平民',
    sexExperience:
      '小月从小被哥布林之王养大，身体还保持着纯洁，但内心对主人有着深深的依恋和爱慕。她经常在主人不注意时偷偷观察他，心跳加速。每当主人夸奖她时，她的猫耳会不自觉地抖动，尾巴也会开心地摇摆。她渴望能更亲近主人，但又害羞不敢主动表达。在夜深人静时，她会幻想与主人的亲密接触，虽然不知道具体该怎么做，但那种温暖的感觉让她沉醉。',
    sensitivePoints: ['猫耳', '尾巴', '脖子'],
    sensitivePointsDetail: [
      {
        part: '猫耳',
        isSensitive: true,
        description:
          '小月的猫耳非常敏感，银白色的毛发柔软如丝，轻抚会让她发出可爱的呼噜声，抚摸根部会让她全身颤抖，发出娇羞的呻吟声。她的猫耳会根据情绪变化而摆动，紧张时会贴向脑后，开心时会竖立起来。',
      },
      {
        part: '尾巴',
        isSensitive: true,
        description:
          '蓬松的银白色尾巴根部是她的最敏感点，抚摸这里会让她瞬间失去抵抗力，发出可爱的猫叫声。她的尾巴会根据心情摆动，紧张时会夹在两腿之间，开心时会高高翘起。',
      },
      {
        part: '脖子',
        isSensitive: true,
        description:
          '脖子是猫娘最敏感的部位之一，轻咬或亲吻会让她瞬间瘫软，发出可爱的猫叫声。她的脖子修长白皙，有着淡淡的体香，是她的致命弱点。',
      },
    ],
    lifeStory: {
      childhood: [
        '在寒冷的冬夜被遗弃在森林中，只有几个月大的小月蜷缩在树洞里瑟瑟发抖',
        '被路过的哥布林之王发现并救下，用温暖的怀抱将她带回巢穴',
        '在巢穴中得到了温暖和关爱，逐渐从恐惧中走出，开始信任这个救她的主人',
      ],
      adolescence: [
        '逐渐展现出聪慧的天赋，学习能力极强，很快掌握了人类语言和基本礼仪',
        '开始帮助哥布林之王处理巢穴事务，展现出卓越的管理才能',
        '学会了各种魔法和战斗技巧，成为主人的得力助手，但内心对主人的感情也在悄然变化',
      ],
      adulthood: [
        '成为了巢穴的秘书官，负责管理巢穴的日常事务，将一切打理得井井有条',
        '对哥布林之王有着深厚的感情，这种感情早已超越了主仆关系',
        '虽然身体还很纯洁，但内心渴望着与主人更亲密的接触',
      ],
      currentState: [
        '全心全意地侍奉着哥布林之王，将巢穴管理得井井有条',
        '期待着能为主人做更多的事情，渴望得到主人的认可和宠爱',
        '在夜深人静时，会偷偷观察主人的睡颜，内心充满爱慕之情',
      ],
    },
    personality: ['忠诚专一', '聪慧机敏', '温柔体贴', '勤奋努力', '娇羞可爱'],
    fears: '害怕被主人抛弃，担心自己不够好而失去主人的宠爱',
    secrets: '其实对哥布林之王有着超越主仆关系的感情，渴望成为主人的伴侣',
    appearance: {
      height: 155,
      weight: 42,
      measurements: 'B85/W58/H82',
      description:
        '一只可爱的猫娘，有着柔软的银白色猫耳和蓬松的尾巴。银白色的长发如瀑布般垂至腰间，碧绿色的眼睛如翡翠般清澈，身材娇小但比例完美。总是穿着整洁的黑色秘书装，白色衬衫，黑色短裙，显得既专业又可爱。她的肌肤白皙如雪，有着淡淡的体香，走起路来轻盈优雅，如猫般灵动。',
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
    name: '石溪村',
    type: 'village',
    icon: '🏘️',
    description:
      '位于古拉尔大陆边缘的小型人类村庄，以石溪为名。村民们以农耕和简单的手工艺为生，防御设施简陋，只有几座木制瞭望塔和简单的栅栏。村庄中心有一座小教堂，是村民们的信仰中心。这里的人们生活简朴，对外来者既好奇又警惕。',
    difficulty: 1,
    distance: 5,
    rewards: { gold: 50, food: 30, slaves: 5 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '人类',
    baseGuards: 80,
    specialUnit: {
      name: '村庄守卫队长',
      race: '人类',
      unitType: 'physical' as const,
      attributes: {
        attack: 15,
        defense: 20,
        intelligence: 12,
        speed: 18,
        health: 120,
      },
    },
  },
  {
    id: 'merchant_camp',
    name: '银月商队营地',
    type: 'trade_caravan',
    icon: '🏕️',
    description:
      '一支来自远方的贸易商队在此临时驻扎。商队由经验丰富的商人组成，携带着各种珍贵的货物和商品。营地周围有坚固的马车围栏，商队护卫们日夜巡逻。这里不仅有丰富的物资，还可能遇到来自其他大陆的稀有商品。商队头领是一位精明的商人，对哥布林的威胁有所耳闻。',
    difficulty: 1,
    distance: 8,
    rewards: { gold: 100, food: 20, slaves: 3 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '人类',
    baseGuards: 200,
    specialUnit: {
      name: '商队护卫队长',
      race: '人类',
      unitType: 'physical' as const,
      attributes: {
        attack: 18,
        defense: 22,
        intelligence: 16,
        speed: 20,
        health: 140,
      },
    },
  },
  {
    id: 'abandoned_fort',
    name: '暗影要塞',
    type: 'ruins',
    icon: '🏰',
    description:
      '一座古老的军事要塞，曾经是某个王国的边境防御工事。随着王国的衰落，要塞被遗弃，但其中仍保留着许多珍贵的军事装备和宝藏。要塞内部结构复杂，有地下通道和秘密房间。然而，这里也被亡灵和古代诅咒所占据，成为了危险的地方。要塞的城墙虽然破败，但仍然坚固，内部可能隐藏着强大的魔法物品。',
    difficulty: 3,
    distance: 12,
    rewards: { gold: 200, food: 10, slaves: 0 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '亡灵',
    baseGuards: 500,
    specialUnit: {
      name: '古代守卫',
      race: '亡灵',
      unitType: 'physical' as const,
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
    description:
      '位于古拉尔大陆边缘的流放者聚居地，由被各国驱逐的罪犯、政治犯和异端分子组成。村落建在贫瘠的山丘上，房屋简陋但防御严密。这里的居民虽然被主流社会抛弃，但形成了自己的生存法则和战斗技巧。他们对外来者极度警惕，对哥布林的威胁有着丰富的应对经验。村落中心有一座简陋的审判堂，是流放者们制定规则的地方。',
    difficulty: 2,
    distance: 15,
    rewards: { gold: 80, food: 40, slaves: 8 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '流放者之地',
    race: '人类',
    baseGuards: 150,
    specialUnit: {
      name: '流放者首领',
      race: '人类',
      unitType: 'physical' as const,
      attributes: {
        attack: 20,
        defense: 18,
        intelligence: 14,
        speed: 16,
        health: 130,
      },
    },
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

// 部队配置模块数据
export interface FormationModuleData {
  /** 当前部队编制数据 */
  currentFormation: (any | null)[];
  /** 保存的配置列表 */
  savedConfigs: any[];
}

// 完整的游戏数据（组合类型）
export type ModularGameData = {
  baseResources: BaseResources;
  exploration: ExplorationModuleData;
  nest: NestModuleData;
  history: HistoryModuleData;
  training: TrainingModuleData;
  formation: FormationModuleData;
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
  moduleName: 'exploration' | 'nest' | 'history' | 'training' | 'formation';
  data: any;
}

export interface ModuleDataOptions {
  moduleName: 'exploration' | 'nest' | 'history' | 'training' | 'formation';
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
    formation: { ...INITIAL_FORMATION_DATA },
    metadata: {
      gameVersion: GAME_VERSION,
      lastSaved: Date.now(),
      totalPlayTime: 0,
      gameStartTime: Date.now(),
    },
  };
}
