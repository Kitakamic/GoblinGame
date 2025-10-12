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
    loyalty: 100,
    stamina: 100,
    fertility: 0,
    offspring: 0,
    rating: 'S',
    favorite: true,
    level: 1, // 初始等级，实际等级将根据我方最高等级人物动态计算
    attributes: {
      attack: 30,
      defense: 40,
      intelligence: 30,
      speed: 20,
      health: 120,
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
    id: 'knight_commander_elena',
    name: '艾琳娜·萨尔',
    title: '白玫瑰骑士团长',
    avatar: 'https://kitakamis.online/人类_女医生_人类_双马尾_银色_中胸_corrupted_00001_.png',
    status: 'surrendered',
    canCombat: true,
    loyalty: 0,
    stamina: 180,
    maxStamina: 180,
    fertility: 165,
    maxFertility: 165,
    offspring: 0,
    rating: 'A',
    favorite: false,
    level: 1,
    attributes: {
      attack: 42, // 攻击力：物理攻击能力，战士类角色较高
      defense: 38, // 防御力：物理防御能力，坦克类角色较高
      intelligence: 28, // 智力：魔法攻击和法术能力，法师类角色较高
      speed: 32, // 速度：行动速度和闪避能力，刺客类角色较高
      health: 220, // 生命值：生存能力，所有角色都需要
    },
    race: '人类',
    age: 28,
    country: '赛菲亚帝国',
    background: '贵族',
    sexExperience:
      '艾琳娜的性经验仅限于与已故的未婚夫，一位同样在战斗中牺牲的骑士。两人的关系纯洁而深情，但从未有过真正的亲密接触。自从未婚夫去世后，她便全身心投入到骑士团的工作中，将所有精力都投入到保卫帝国的使命中，但内心深处那份被压抑的渴望有时会在梦中苏醒。',
    sensitivePoints: ['胸部'],
    sensitivePointsDetail: [
      {
        part: '嘴巴',
        isSensitive: false,
        description:
          '艾琳娜的嘴唇薄而性感，天然带着淡粉色的光泽。她的唇形完美，上唇略薄而下唇丰盈，接吻时会有微微的颤抖。她的舌头灵活而湿润，口腔内部温暖紧致，当被深入侵犯时会本能地吸吮和纠缠。',
      },
      {
        part: '胸部',
        isSensitive: true,
        description:
          '艾琳娜的胸部丰满挺拔，D罩杯的乳房在紧身盔甲下展现出完美的形状。她的乳房触感柔软却富有弹性，乳晕呈现淡粉色，直径约三厘米，乳头在未受刺激时呈现可爱的粉红色。由于长期穿着盔甲作战，她的乳房保持着极佳的形状，几乎没有下垂。当被抚摸时，乳头会迅速充血变硬，整体敏感度极高，这是她最大的弱点。',
      },
      {
        part: '阴道',
        isSensitive: false,
        description:
          '艾琳娜的阴道因为从未有过性经验而保持着处女般的紧致度。外阴唇饱满而富有弹性，内阴唇小巧粉嫩，阴蒂隐藏在包皮之下。阴道内壁布满细密的褶皱，收缩力极强，在被插入时会本能地紧紧吸附。由于从未有过这方面的经验，她的阴道保持着完全的紧闭状态，初次进入需要充分的润滑和扩张。',
      },
      {
        part: '子宫',
        isSensitive: false,
        description:
          '艾琳娜的子宫保持着处女般的状态，从未被任何异物触碰过。她的子宫口紧闭，内部温度正常，当被精液灌满时会产生强烈的满足感。由于从未有过性经验，她的子宫保持着完全的原始状态，等待着第一次的探索和开发。',
      },
      {
        part: '后庭',
        isSensitive: false,
        description:
          '艾琳娜的后庭紧致而从未被开发过，臀部饱满圆润，臀肉紧实而富有弹性。她的肛门呈现健康的浅粉色，周围皮肤细腻光滑。由于从未有过这方面的经验，她的后庭保持着完全的紧闭状态，即使是手指也难以轻易进入。她对这个部位有着本能的抗拒和羞耻感，认为从后方被侵犯是极度屈辱的行为。',
      },
    ],
    lifeStory: {
      childhood: [
        '艾琳娜出生于赛菲亚帝国的一个贵族家庭，她的家族世代为帝国效力，父亲是一位著名的骑士团长。从小她就被灌输着正义和荣誉的理念，在父亲的严格训练下，她学会了剑术、骑术和战术。在那个充满战争的童年里，她目睹了无数哥布林对边境村庄的袭击，这让她从小就立志要成为一名骑士，保护无辜的平民。她的母亲是一位宫廷魔法师，教会了她基础的魔法知识，这为她后来成为指挥官奠定了基础。',
      ],
      adolescence: [
        '十五岁那年，艾琳娜正式加入了帝国骑士团，成为了一名见习骑士。在骑士团中，她以优异的成绩和坚定的意志赢得了同僚们的尊重。十八岁时，她参加了第一次对哥布林巢穴的围剿行动，在战斗中表现出色，被提升为小队长。二十岁时，她率领自己的小队成功击退了哥布林对边境要塞的袭击，因此被授予了银剑骑士的称号。那段时期是她人生中最充实的时光，她与战友们并肩作战，为保护帝国的安全而奋斗。',
      ],
      adulthood: [
        '二十五岁时，艾琳娜被任命为边境骑士团的指挥官，负责监视和防御哥布林巢穴的威胁。作为指挥官，她不仅要指挥战斗，还要管理营地的日常事务，协调与帝国其他部队的合作。她以铁腕手段管理着骑士团，用雷霆手段镇压了数次哥布林的袭击。在血与火的洗礼中，她从一个年轻的骑士成长为一位成熟的指挥官，向所有人证明了女性同样可以成为优秀的军事领袖。',
      ],
      currentState: [
        '如今二十八岁的艾琳娜已经担任指挥官三年，她将骑士团管理得井井有条，甚至开始向哥布林巢穴发起主动攻击。但作为女性指挥官，她也面临着来自同僚的质疑和挑战。夜深人静时，她常常会想念家乡的亲人，但为了帝国的安全，她必须坚守在这个危险的前哨站。最近哥布林的活动越来越频繁，她预感到一场更大的战斗即将来临，为此她加强了营地的防御，同时派出侦察兵侦查哥布林巢穴的动向。',
      ],
    },
    personality: ['坚毅不屈', '正义凛然', '外冷内热'],
    fears:
      '艾琳娜最大的恐惧是失去战友和让无辜的平民受到伤害。作为指挥官，她深知每一次决策都关系到战友们的生死。她害怕因为自己的失误而导致战友牺牲，害怕无法保护那些信任她的平民。这种恐惧驱使她必须时刻保持警惕，绝不在任何战斗中掉以轻心。',
    secrets:
      '艾琳娜的秘密是她内心深处对爱情的渴望和对被保护的渴望。作为指挥官，她必须时刻保持坚强，但内心深处她渴望有一个能够保护她、理解她的男人。这个秘密让她既困扰又羞耻，她害怕被人发现这个弱点，害怕被人认为她不够坚强。',
    appearance: {
      height: 175,
      weight: 65,
      measurements: '88-65-92',
      cupSize: 'D',
      description:
        '艾琳娜拥有一头如瀑布般倾泻而下的银白色长发，在阳光下闪烁着金属般的光泽，平时她会将长发编成复杂的辫子盘在脑后，显得既优雅又干练。她的肌肤呈现出健康的小麦色，这是长期在户外训练和战斗留下的痕迹，却丝毫不减其魅力，反而增添了一种野性的美感。她的五官精致而立体，高挺的鼻梁，薄而性感的嘴唇，一双如蓝宝石般深邃的眼眸中闪烁着坚定的光芒，眼神中既有女性的柔美也有战士的坚毅。她的身材高挑匀称，双肩宽阔而有力，D罩杯的丰满胸部在紧身的骑士装束下勾勒出诱人的曲线。纤细的腰肢和浑圆饱满的臀部形成完美的对比，修长笔直的双腿肌肉线条流畅，显然经过长期的战斗训练。她的手指修长但掌心有厚茧，那是常年握剑留下的痕迹。在她的右臂上有一道淡淡的伤疤，那是早年与哥布林战斗时留下的纪念。她的锁骨精致迷人，每当她穿着低领的便装时，那若隐若现的锁骨线条总能吸引无数目光。她习惯佩戴家族传承的银剑项链，剑形的吊坠正好垂落在她深邃的乳沟之间。',
      clothing: {
        head: '银白色花纹头盔',
        top: '银白色精钢胸甲',
        bottom: '银白色锁子战裙',
        socks: '白色棉质长袜',
        shoes: '银白色花纹战靴',
        underwear: '白色棉质内衣',
        accessories: '银白色剑形项链',
        toys: '无',
      },
    },
    locationId: 'knight_camp_near_nest',
    capturedAt: '帝国历1074年1月1日', // 使用游戏开始时间作为默认值
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
    needsAIHero: true,
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
