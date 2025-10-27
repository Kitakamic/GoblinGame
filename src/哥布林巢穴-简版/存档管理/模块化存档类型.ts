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
  {
    id: 'legendarychar_Succubus',
    name: '莉莉丝',
    title: '魔族小公主',
    avatar: 'https://kitakamis.online/hero_portaits/魅魔1.png',
    corruptedAvatar: 'https://kitakamis.online/hero_portaits/魅魔2.png',
    fullyCorruptedAvatar: 'https://kitakamis.online/hero_portaits/魅魔3.png',
    status: 'imprisoned',
    canCombat: true,
    unitType: 'magical',
    loyalty: 100,
    stamina: 140,
    maxStamina: 140,
    fertility: 160,
    maxFertility: 160,
    offspring: 0,
    rating: 'A',
    favorite: false,
    level: 0,
    attributes: {
      attack: 35,
      defense: 25,
      intelligence: 50,
      speed: 40,
      health: 190,
    },
    race: '魔族',
    age: 18,
    country: '废弃要塞',
    background: '王族',
    sexExperience:
      '莉莉丝虽然只有十八岁，但作为魔族小公主，她有着强烈的冒险精神。她曾经偷偷来到人界，与一些人类男性有过肌肤之亲。她对自己的平胸感到自卑，但在诱惑人类时却发现了一些意想不到的效果——那些人类男性反而被她的傲娇气质和平胸特色所吸引。她学会了如何在床上展现自己的魅力，用傲娇的态度和精湛的技巧让人类男性对她欲罢不能。她享受着征服的感觉，但也更加自信地认为自己的平胸并不是缺陷，而是一种独特的魅力。',
    sensitivePoints: ['阴道'],
    sensitivePointsDetail: [
      {
        part: '嘴巴',
        isSensitive: false,
        description:
          '莉莉丝的嘴唇饱满而性感，呈现自然的深紫色，如同恶魔之花般妖媚。她的唇形完美，上唇略薄而下唇丰盈，接吻时会主动吸吮和挑逗。她的舌头灵活而湿润，口腔内部温暖紧致，当被深入侵犯时会本能地吸吮和纠缠。魔族的唾液具有魅惑效果，据说能够让人产生强烈的性冲动。',
      },
      {
        part: '胸部',
        isSensitive: false,
        description:
          '莉莉丝的胸部平坦小巧，A罩杯的乳房几乎没有凸起。她的乳晕呈现淡粉色，直径约一厘米，乳头在未受刺激时呈现小巧的粉红色。由于平胸，她从小就感到自卑，因此将所有注意力都转向磨练其他技巧。当被抚摸时，乳头会迅速充血变硬，但整体敏感度一般。这是她最大的自卑之源，如果有人嘲笑她的飞机场，她会立刻失去理智。',
      },
      {
        part: '阴道',
        isSensitive: true,
        description:
          '莉莉丝为了弥补平胸的自卑，私下花费了大量时间练习阴道肌肉的控制。她在人界与人类交合时，发现自己的阴道因为长期训练而变得极其敏感和有弹性，内壁布满细密的褶皱，收缩力极强，能够像八爪鱼一样紧紧吸附对方的器官。她能够精确控制阴道内每一寸肌肉的收缩和放松，用各种技巧给予对方极致快感。她的阴道不仅技巧精湛，更具有天生的魅惑能量，能够感知到对方的情绪和欲望状态，让对方在她体内达到前所未有的高潮。这是她弥补平胸遗憾的最大武器。',
      },
      {
        part: '子宫',
        isSensitive: false,
        description:
          '莉莉丝的子宫保持着魔族的原始状态，具有特殊的生命魔法，能够感知到生命的诞生。她的子宫口在兴奋时会微微张开，内部温度比阴道更高，当被精液灌满时会产生强烈的满足感。魔族的子宫具有魅惑魔法，能够在受精的同时魅惑对方的心灵。',
      },
      {
        part: '后庭',
        isSensitive: false,
        description:
          '莉莉丝的后庭紧致而富有弹性，臀部小巧圆润，臀肉柔软而富有弹性。她的肛门呈现深紫色，周围皮肤细腻光滑。她对人界男性开放了这个部位，虽然开始时有些抗拒和羞耻感，但在床上她发现自己能够通过这个部位给予对方极其强烈的快感。她开始接受这种行为，认为这是征服和臣服的象征，也让她在床上的吸引力进一步提升。',
      },
    ],
    lifeStory: {
      childhood: [
        '莉莉丝出生于魔界王室，是魅魔族的小公主。从小她就因为平胸而被其他同龄魅魔嘲笑，这让她从小就感到自卑。作为公主，她被保护得很好，从来不需要亲自战斗。表面上一副高傲小公主的样子，实际上内心充满了不安和对外面世界的好奇。她开始偷偷学习性知识，私下在房间中练习阴道肌肉的控制，希望能够通过技巧弥补平胸的遗憾。她发誓要让所有嘲笑她的人刮目相看，证明平胸也能有独特的魅力。',
      ],
      adolescence: [
        '十五岁时，莉莉丝厌倦了魔界的无聊生活，开始偷偷溜到人界冒险。她对人类世界充满了好奇，喜欢冒险和探索未知。她开始在人类世界中游历，与一些人类男性发生关系，发现自己的平胸反而成为一种独特的魅力。那些人类男性被她的傲娇气质和精湛技巧所征服，这让她变得越来越自信。她在人界四处流浪，寻找刺激和冒险，享受着征服人类的感觉。',
      ],
      adulthood: [
        '十七岁时，莉莉丝听说废弃要塞有一座废弃的据点，那里被人界视为危险之地，这激起了她的冒险精神。她来到废弃要塞，发现这里竟然成为了哥布林巢穴附近的一个据点。她开始暗中观察哥布林巢穴的发展，对他们的野心和崛起产生了浓厚的兴趣。表面上装作不屑一顾，称哥布林是低等生物，但内心深处却被他们的实力和雄心所震撼。她在废弃要塞建立了临时据点，继续观察这个新兴势力。',
      ],
      currentState: [
        '如今十八岁的莉莉丝已经决定投诚哥布林王。表面上一副傲娇的样子，说着"本公主只是看你有点潜力"、"要不是巢穴有前景我才不会来这里"之类的话，但内心深处她对这个势力充满了敬佩和好奇。她在人界的经历让她变得更加自信和成熟，不再是那个只会纸上谈兵的小公主。她对自己的平胸已经不再自卑，相信自己的魅力和技巧能够征服哥布林王。她决定要用自己的冒险精神和忠诚为巢穴效力，期待带领巢穴中闯出一片天地。',
      ],
    },
    personality: ['傲娇任性', '内心自卑', '主动出击', '渴望关爱'],
    fears:
      '莉莉丝最大的恐惧是有人嘲笑她的飞机场。平胸虽然在人界男性中成了一种独特的魅力，但在魔族中她还是会感到自卑。如果有人敢当面或背后讽刺她是飞机场，她会立刻炸毛，甚至会哭出来。她也很害怕自己的冒险经历会被魔族王室发现，担心被父王抓回魔界。她最大的恐惧是哥布林王会嫌弃她的平胸或者把她当成普通的性玩具，而不是真正的伙伴。',
    secrets:
      '莉莉丝最大的秘密是她曾经偷偷逃到人界冒险，与人类男性有过不少经验。她不敢让魔族王室知道，因为公主私自跑到人界是严重违规的。她在人界的经历让她成长了很多，也让她对自己的平胸有了新的认识。她投诚哥布林王是因为被他们的野心和实力所吸引，她想要在一个真正强大的势力中证明自己的价值，而不只是当一个花瓶公主。',
    appearance: {
      height: 160,
      weight: 45,
      measurements: '75-60-85',
      cupSize: 'A',
      description:
        '莉莉丝拥有一头如瀑布般倾泻而下的深紫色长发，发尾微微卷曲，通常编成精致的洛丽塔式卷发，头顶戴着繁复的蕾丝头饰。她头顶长着一对小巧玲珑的紫色恶魔角，犹如王冠般精致，身后拖着一条纤细的桃心尾巴，这是她作为魔族小公主的标志。她的肌肤白皙如雪，细腻娇嫩如同花蕾。她的五官精致可爱，带着一种傲娇的小公主气质，高挺的鼻梁微微翘起，樱桃小嘴总是撅着，一双如紫水晶般的大眼睛中闪烁着傲娇和不甘的光芒，眼神中既有少女的纯真也有魔族的高傲。她的身材娇小玲珑，穿着繁复的深紫色洛丽塔服饰，多层蕾丝和蝴蝶结装饰衬托出她小公主的气质。胸前平坦如镜，A罩杯的乳房小得可怜，蓬松的洛丽塔裙摆巧妙地掩盖了她的平胸，让她看起来就像一个精致的瓷娃娃。她的腰肢纤细，被紧身的洛丽塔腰带勾勒出完美的曲线，臀部小巧圆润，修长纤细的双腿穿着白色蕾丝长袜，看起来就像一个养尊处优的小公主。她的手指纤细修长，指甲涂成深紫色，保养得很好。她总是穿着繁复华丽的洛丽塔服饰，装作不在意自己平胸的样子，但每次看到其他丰满的女性时，眼中都会闪过一丝嫉妒和失落。',
      clothing: {
        head: '深紫色洛丽塔蕾丝头饰',
        top: '深紫色洛丽塔洋装',
        bottom: '蓬松洛丽塔裙摆',
        socks: '白色蕾丝长袜',
        shoes: '深紫色洛丽塔玛丽珍鞋',
        underwear: '深紫色蕾丝内衣套装',
        accessories: '紫宝石项链',
        toys: '无',
      },
      originalClothing: {
        head: '深紫色洛丽塔蕾丝头饰',
        top: '深紫色洛丽塔洋装',
        bottom: '蓬松洛丽塔裙摆',
        socks: '白色蕾丝长袜',
        shoes: '深紫色洛丽塔玛丽珍鞋',
        underwear: '深紫色蕾丝内衣套装',
        accessories: '紫宝石项链',
        toys: '无',
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
    rewards: { gold: 50, food: 30, slaves: 5 },
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
    rewards: { gold: 100, food: 20, slaves: 3 },
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
