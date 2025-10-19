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
  {
    id: 'legendarychar_Alicia',
    name: '维奥莱塔·德·翡翠',
    title: '翡翠王国女王',
    avatar: 'https://kitakamis.online/hero_portaits/女王1.png',
    corruptedAvatar: 'https://kitakamis.online/hero_portaits/女王2.png',
    fullyCorruptedAvatar: 'https://kitakamis.online/hero_portaits/女王3.png',
    status: 'surrendered',
    canCombat: true,
    unitType: 'magical',
    loyalty: 100,
    stamina: 160,
    maxStamina: 160,
    fertility: 185,
    maxFertility: 185,
    offspring: 0,
    rating: 'S',
    favorite: false,
    level: 0, // 初始等级基于后代数量，新角色为0级
    attributes: {
      attack: 38, // 攻击力：物理攻击能力，战士类角色较高
      defense: 32, // 防御力：物理防御能力，坦克类角色较高
      intelligence: 42, // 智力：魔法攻击和法术能力，法师类角色较高
      speed: 35, // 速度：行动速度和闪避能力，刺客类角色较高
      health: 240, // 生命值：生存能力，所有角色都需要
    },
    race: '人类',
    age: 32,
    country: '翡翠王国',
    background: '王族',
    sexExperience:
      '艾莉西亚的性经验仅限于与已故丈夫埃德温,两人的性生活和谐美满。埃德温温柔体贴，总是能让她达到高潮。自从丈夫去世后，她便守寡至今，将所有精力都投入到治国之中，但身体深处那份被压抑的欲望有时会在梦中苏醒。',
    sensitivePoints: ['子宫'],
    sensitivePointsDetail: [
      {
        part: '嘴巴',
        isSensitive: false,
        description:
          '艾莉西亚的嘴唇饱满柔软，天然带着玫瑰色的光泽。她的唇形完美，上唇略薄而下唇丰盈，接吻时会有微微的颤抖。她的舌头灵活而湿润，口腔内部温暖紧致，当被深入侵犯时会本能地吸吮和纠缠。',
      },
      {
        part: '胸部',
        isSensitive: false,
        description:
          '艾莉西亚的胸部丰满挺拔，E罩杯的乳房在紧身衣物下展现出完美的形状。她的乳房触感柔软却富有弹性，乳晕呈现淡粉色，直径约三厘米，乳头在未受刺激时呈现可爱的粉红色。由于长期穿着束胸作战，她的乳房保持着极佳的形状，几乎没有下垂。当被抚摸时，乳头会迅速充血变硬，但整体敏感度属于中等水平。',
      },
      {
        part: '阴道',
        isSensitive: false,
        description:
          '艾莉西亚的阴道因为只与丈夫有过性经验而保持着极佳的紧致度。外阴唇饱满而富有弹性，内阴唇小巧粉嫩，阴蒂隐藏在包皮之下。阴道内壁布满细密的褶皱，收缩力极强，在被插入时会本能地紧紧吸附。由于守寡多年，她的阴道已经恢复到近乎处女般的紧致状态，初次进入需要充分的润滑和扩张。',
      },
      {
        part: '子宫',
        isSensitive: true,
        description:
          '艾莉西亚最大的秘密就是她的子宫极度敏感，这是连她已故的丈夫都不完全了解的体质。当有异物深入触碰到子宫口时，她会产生近乎失控的快感，这种快感直接冲击大脑，让她几乎无法维持理智。她的子宫口在兴奋时会微微张开，内部温度比阴道更高，当被精液灌满时会产生强烈的满足感。正是因为这个过于敏感的弱点，她在与丈夫亲密时总是小心控制深度，害怕自己失态的模样被看到。如果这个秘密被人发现并利用，她引以为傲的理智和自制力将彻底崩溃。',
      },
      {
        part: '后庭',
        isSensitive: false,
        description:
          '艾莉西亚的后庭紧致而从未被开发过，臀部饱满圆润，臀肉紧实而富有弹性。她的肛门呈现健康的浅粉色，周围皮肤细腻光滑。由于从未有过这方面的经验，她的后庭保持着完全的紧闭状态，即使是手指也难以轻易进入。她对这个部位有着本能的抗拒和羞耻感，认为从后方被侵犯是极度屈辱的行为。',
      },
    ],
    lifeStory: {
      childhood: [
        '艾莉西亚出生于赛菲亚帝国的一个没落王族家庭，她的家族曾经显赫一时，但在一次宫廷政变中失势，被流放到古拉尔大陆。年幼的她跟随父母在这片死亡之地艰难求生，目睹了无数同行者在恶劣环境中死去。她的父亲是一位骑士，母亲则是宫廷魔法师，双方都将毕生所学倾囊相授。在那个充满危险的童年里，她学会了如何在荒野中寻找水源和食物，如何识别有毒的植物和生物，更学会了如何在绝望中保持希望。她的父亲常说"我们虽然失去了帝国，但没有失去血统的荣耀"，这句话深深烙印在她幼小的心灵中。',
      ],
      adolescence: [
        '十五岁那年，艾莉西亚的父母在一次哥布林袭击中双双丧生，她被当时翡翠王国的建立者——年轻的国王埃德温所救。埃德温被她的美貌和坚韧所吸引，更欣赏她身上那种王族的气质。在埃德温的培养下，她不仅学习了治国之道，更精进了战斗技艺。两人在患难中产生了深厚的感情,二十岁时她成为了翡翠王国的王后。作为王后，她协助埃德温建立了翡翠宫的防御体系，整合了大陆上的各个流亡族群，用铁腕手段镇压了数次叛乱。那段时期是她人生中最幸福的时光，她与埃德温并肩作战，将翡翠王国从一个简陋的据点发展成为古拉尔大陆上最强大的势力。',
      ],
      adulthood: [
        '二十八岁那年，一场突如其来的瘟疫席卷了翡翠王国，埃德温在照顾病患时不幸染病去世，没有留下子嗣。年轻的艾莉西亚突然成为了寡妇，面对着国内各派系的虎视眈眈和外部势力的不断侵扰。她以惊人的意志力稳住了局面，用雷霆手段处决了三个试图篡位的贵族，亲自率军击退了两次大规模的哥布林入侵。在血与火的洗礼中，她从一个温柔的王后蜕变为铁腕的女王。她取消了国王的称号，独自以王后之名统治翡翠王国，向所有人证明了女性同样可以成为强大的统治者。',
      ],
      currentState: [
        '如今三十二岁的艾莉西亚已经统治翡翠王国四年，她将这个小国治理得井井有条，甚至开始向周边地区扩张势力。但寡居的生活也让她倍感孤独，夜深人静时，她常常会想念已故的丈夫。朝堂上的她是铁血女王，但卸下王冠后，她也只是一个渴望被爱的女人。最近哥布林的活动越来越频繁，她预感到一场更大的风暴即将来临，为此她加强了翡翠宫的防御，同时派出探子侦查哥布林巢穴的动向。她不知道的是，她的美貌和身份已经让她成为了哥布林王风花的重点目标。',
      ],
    },
    personality: ['坚韧不屈', '深谋远虑', '外冷内热'],
    fears:
      '艾莉西亚最大的恐惧是失去控制和尊严。作为从底层爬起来的流亡王族，她深知权力的脆弱。她害怕再次经历童年时的无助，害怕被人当作玩物和弱者。这种恐惧驱使她必须时刻保持强势，绝不在任何人面前展露软弱。',
    secrets:
      '艾莉西亚的身体对于强烈的刺激有着异常敏感的反应，这是她从未告诉任何人的秘密。即使是与丈夫亲密时，她也会刻意控制自己的反应，因为她担心过于激烈的表现会有损王后的威严。这个秘密让她既困扰又羞耻，她害怕有一天会被人发现并利用这个弱点。',
    appearance: {
      height: 172,
      weight: 58,
      measurements: '96-62-94',
      cupSize: 'E',
      description:
        '维奥莱塔拥有一头如同瀑布般倾泻而下的棕色长发，发丝在光线下会泛起琥珀色的微光，平时她会将这头秀发编成精致的辫子盘于脑后，显露出优雅修长的颈项。她的肌肤呈现出健康的蜜色，这是长年在古拉尔大陆恶劣环境下生存留下的印记，却丝毫不减其魅力，反而增添了一种野性的韵味。她的五官轮廓分明，高挺的鼻梁，饱满的嘴唇带着天然的玫瑰色泽，一双碧绿色的眼眸如同翡翠般璀璨，眼神中既有女性的柔情也有统治者的威严。她的身材高挑匀称，双肩宽阔却不失女性的柔美线条，E罩杯的丰满胸部在紧身的王室礼服下勾勒出诱人的曲线。纤细的腰肢和浑圆饱满的臀部形成完美的对比，修长笔直的双腿肌肉线条流畅，显然经过长期的战斗训练。她的手指修长但掌心有薄茧，那是常年握剑留下的痕迹。在她的左肩胛骨处有一道淡淡的伤疤，那是早年一次暗杀中留下的纪念。她的锁骨精致迷人，每当她穿着露肩礼服时，那若隐若现的锁骨线条总能吸引无数目光。她习惯佩戴翡翠王国的象征——一条镶嵌着巨大翡翠的项链，宝石正好垂落在她深邃的乳沟之间。',
      clothing: {
        head: '翡翠宝石王冠',
        top: '深绿色丝质礼服',
        bottom: '深绿色宫廷长裙',
        socks: '深绿色丝质长袜',
        shoes: '深绿色翡翠高跟鞋',
        underwear: '淡绿色蕾丝内衣',
        accessories: '翡翠宝石项链',
        toys: '无',
      },
      originalClothing: {
        head: '翡翠宝石王冠',
        top: '深绿色丝质礼服',
        bottom: '深绿色宫廷长裙',
        socks: '深绿色丝质长袜',
        shoes: '深绿色翡翠高跟鞋',
        underwear: '淡绿色蕾丝内衣',
        accessories: '翡翠宝石项链',
        toys: '无',
      },
    },
    locationId: 'emerald_palace_capital',
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
    baseGuards: 80,
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
    baseGuards: 200,
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
    baseGuards: 500,
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
