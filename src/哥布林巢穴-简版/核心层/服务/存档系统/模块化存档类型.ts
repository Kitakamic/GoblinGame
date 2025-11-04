/**
 * 模块化存档类型定义
 * 统一管理游戏数据结构和初始配置
 */
import type { Character } from '../../../功能模块层/人物管理/类型/人物类型';
import { CUSTOM_CHARACTERS, CUSTOM_LOCATIONS } from '../../../功能模块层/人物管理/类型/传奇人物和据点';
import type { Continent, ContinentExploreState, Region } from '../../../功能模块层/探索/类型/大陆探索类型';
import type { Location } from '../../../功能模块层/探索/类型/探索类型';

// ==================== 游戏配置常量 ====================

export const GAME_VERSION = '1.0.0';
export const DATABASE_NAME = 'GoblinNestGame';
export const DATABASE_VERSION = 5; // 升级版本以创建 trainingHistoryData 存储

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
  {
    id: 'legendarychar_Priestess',
    name: '雫',
    title: '女神神殿神官',
    avatar: 'https://kitakamis.online/hero_portaits/雫1.png',
    corruptedAvatar: 'https://kitakamis.online/hero_portaits/雫2.png',
    fullyCorruptedAvatar: 'https://kitakamis.online/hero_portaits/雫3.png',
    status: 'imprisoned',
    canCombat: true,
    unitType: 'magical',
    loyalty: 0,
    stamina: 140,
    maxStamina: 140,
    fertility: 140,
    maxFertility: 140,
    offspring: 0,
    rating: 'A',
    favorite: false,
    level: 0,
    attributes: {
      attack: 15,
      defense: 20,
      intelligence: 40,
      speed: 25,
      health: 150,
    },
    race: '人类',
    age: 19,
    country: '赛菲亚帝国',
    background: '平民',
    sexExperience: '雫是一名纯洁的神官，从未有过性经验。她在神殿中长大，从小接受严格的宗教教育，对于情欲之事一无所知。',
    sensitivePoints: ['胸部'],
    sensitivePointsDetail: [
      {
        part: '乳头',
        isSensitive: true,
        description:
          '她的乳房娇小而挺拔，乳晕呈现淡淡的粉红色，直径约两厘米。乳头小巧，在未受刺激时呈现稚嫩的粉红色。十九岁的身体还在发育中，触感柔软而富有弹性。受到刺激时，乳头会迅速充血变硬，敏感度极高。',
      },
    ],
    lifeStory: {
      childhood: [
        "雫从小在赛菲亚帝国边境的一座女神神殿中长大。她是孤儿，被遗弃在神殿门口时只有襁褓中的婴儿。神殿的老祭司收养了她，给她取名为雫，意为'从天而降的露水'。在神殿中，她接受了严格的宗教教育，学习祈祷、治疗术和女神的教义。她的童年虽然孤独，但神殿的宁静和老祭司的慈爱让她感到温暖。十岁那年，一个浑身是伤的冒险者闯入神殿，雫用她刚刚学会的治疗术救了他。那个冒险者没有留下名字就离开了，但这次经历让雫第一次意识到，外面的世界充满了危险。",
      ],
      adolescence: [
        '十三岁时，老祭司去世了，雫成为了神殿中唯一的神官。她独自维持着神殿的运作，为路过的旅人提供治疗和祝福。两年后，一群哥布林袭击了附近的村庄，雫和几个新人冒险者组队前去讨伐。那是她第一次离开神殿，也是她第一次真正面对哥布林的残暴。她的队友几乎全军覆没，她自己也被哥布林的毒箭射中左肩。就在她以为自己必死无疑时，当年她救过的那个冒险者出现了——一个总是戴着头盔、专门讨伐哥布林的战士。他救了她，并告诉她，对付哥布林不能心慈手软。从那以后，雫开始跟随那位战士讨伐哥布林，她学会了在法袍下穿锁子甲，学会了使用投石索支援，也学会了在危险中生存。',
      ],
      adulthood: [
        '如今十九岁的雫已经是一名经验丰富的冒险者。她跟随那位战士讨伐了无数哥布林巢穴，见证了太多女性被哥布林蹂躏的悲惨景象。这些经历让她变得更加坚定，也更加明白哥布林的威胁有多么可怕。但在某次讨伐行动中，她与那位战士走散了。她被一群哥布林包围，尽管她拼命战斗，但最终还是被俘虏了。现在她被带到了古拉尔大陆的一个哥布林巢穴中，成为了囚犯。她知道哥布林会对她做什么，她见过太多这样的受害者。她只能在心中默默祈祷，希望那位战士能够找到她，希望女神能够保佑她。',
      ],
      currentState: [
        '雫被关押在巢穴的牢房中。她的左肩上还有当年被毒箭射中留下的伤疤，现在这个伤疤似乎在提醒她，她又一次陷入了绝境。她不知道那位战士是否知道她被俘虏了，也不知道他是否会来救她。她只能等待，等待命运的审判。她知道，如果她无法逃脱，她将会面临比死亡更可怕的命运。',
      ],
    },
    personality: ['温柔善良', '坚定虔诚', '天真纯洁', '勇敢无畏'],
    fears:
      '雫最大的恐惧是失去对女神的信仰，或者被迫背叛自己的信念。她见过太多被哥布林俘虏的女性，她们的眼神空洞，灵魂已经死去。她害怕自己也会变成那样。她也害怕那位一直保护她的战士永远找不到她，害怕自己会在这个巢穴中度过余生，成为哥布林的生育机器。',
    secrets:
      '雫最大的秘密是她对那位救过她的战士的感情。虽然她从未向任何人透露过，但她内心深处对那个冷酷但温柔的男人有着超越战友关系的情感。她希望能够一直和他在一起，希望能够成为他真正的伙伴。但她知道，那位战士对哥布林的仇恨深入骨髓，他不会为了任何人停下脚步。她也知道，自己可能永远无法向他表达这份感情。现在她被俘虏了，这个秘密可能会成为她心中永远的遗憾。她只希望，如果她真的无法逃脱，至少能够在生命的最后时刻，再见他一面。',
    appearance: {
      height: 155,
      weight: 42,
      measurements: '78-60-82',
      cupSize: 'B',
      description:
        '雫的身材娇小纤细，如同尚未完全绽放的花蕾。她拥有一头如阳光般灿烂的金色长发，发丝柔顺而富有光泽，通常垂至腰间，几缕碎发自然地垂落在脸颊两侧，为她增添了一丝少女的柔美。她的肌肤白皙如雪，细腻娇嫩，仿佛从未经历过风霜雨露的摧残，在光线下泛着淡淡的珍珠般的光泽。她的五官精致可爱，眉毛纤细而自然，高挺的鼻梁下是一张樱桃小嘴，总是抿着，透露着少女的青涩和不安。她最引人注目的是那双如天空般清澈的蓝色眼眸，眼神中既有少女的纯真也有神官的虔诚，睫毛纤长而卷翘，在脸上投下淡淡的阴影。她的颈项修长优雅，锁骨精致而突出，乳房刚刚发育，娇小而挺拔。她的腰肢纤细，盈盈不足一握。臀部小巧圆润，曲线柔和，有着修长纤细的双腿。她的手指纤细修长，从未做过重活，保养得极好，指甲修剪整齐，呈现健康的粉色。她的左肩膀上有一道淡淡的伤疤，那是被哥布林毒箭射中留下的印记，这是她成长历程的见证。',
      clothing: {
        head: '神官帽子',
        top: '白色的神官袍',
        bottom: '白色的神官长裙',
        socks: '白色长筒袜',
        shoes: '棕色的长筒靴',
        underwear: '朴素的白色内衣',
        accessories: '女神圣徽',
        toys: '无',
      },
      originalClothing: {
        head: '神官帽子',
        top: '白色的神官袍',
        bottom: '白色的神官长裙',
        socks: '白色长筒袜',
        shoes: '棕色的长筒靴',
        underwear: '朴素的白色内衣',
        accessories: '女神圣徽',
        toys: '无',
      },
      corruptedClothing: {
        head: '半透明的蕾丝头饰',
        top: '低胸的雪纺战袍（镂空蕾丝装饰）',
        bottom: '高开叉的丝质长裙',
        socks: '无',
        shoes: '高跟黑色漆皮长靴',
        underwear: '精致的黑色蕾丝内衣',
        accessories: '暗黑项圈/暗黑法杖',
        toys: '淫纹',
      },
    },
    locationId: 'abandoned_fort',
    capturedAt: '帝国历1074年1月1日',
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
    rewards: { gold: 500, food: 300, slaves: 50 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '人类',
    baseGuards: 80,
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
    rewards: { gold: 1000, food: 200, slaves: 30 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '人类',
    baseGuards: 200,
    specialUnit: {
      name: '商队护卫',
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
    name: '废弃要塞',
    type: 'ruins',
    icon: '🏰',
    description:
      '一座古老的军事要塞，曾经是某个王国的边境防御工事。随着王国的衰落，要塞被遗弃，但其中仍保留着许多珍贵的军事装备和宝藏。要塞内部结构复杂，有地下通道和秘密房间。然而，这里也被亡灵和古代诅咒所占据，成为了危险的地方。要塞的城墙虽然破败，但仍然坚固，内部可能隐藏着强大的魔法物品。',
    difficulty: 3,
    distance: 12,
    rewards: {
      gold: 2000,
      food: 100,
      slaves: 0,
    },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '巢穴附近',
    race: '亡灵',
    baseGuards: 100,
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
    rewards: { gold: 800, food: 400, slaves: 80 },
    status: 'unknown',
    continent: '古拉尔大陆',
    region: '流放者之地',
    race: '人类',
    baseGuards: 150,
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
  continents: Continent[]; // 大陆数据（包含默认和自定义）
  continentExploreState: ContinentExploreState; // 大陆探索状态
  // 自定义大陆配置（可选，用于存储用户自定义的大陆和区域）
  customContinents?: Continent[]; // 用户自定义的大陆数据
  customRegions?: Region[]; // 用户自定义的区域数据
  customConfigVersion?: string; // 自定义配置版本
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
