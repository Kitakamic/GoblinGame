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
    id: 'legendarychar_Hailan',
    name: '海岚·奥古斯塔·赛菲亚',
    title: '赛菲亚女帝',
    avatar: 'https://kitakamis.online/hero_portaits/女帝1.png',
    corruptedAvatar: 'https://kitakamis.online/hero_portaits/女帝1.png',
    fullyCorruptedAvatar: 'https://kitakamis.online/hero_portaits/女帝1.png',
    status: 'imprisoned',
    canCombat: true,
    unitType: 'physical',
    loyalty: 0,
    stamina: 200,
    maxStamina: 200,
    fertility: 200,
    maxFertility: 200,
    offspring: 0,
    rating: 'S',
    favorite: false,
    level: 0, // 初始等级基于后代数量，新角色为0级
    attributes: {
      attack: 50, // 攻击力：物理攻击能力，战士类角色较高
      defense: 48, // 防御力：物理防御能力，坦克类角色较高
      intelligence: 60, // 智力：魔法攻击和法术能力，法师类角色较高
      speed: 45, // 速度：行动速度和闪避能力，刺客类角色较高
      health: 350, // 生命值：生存能力，所有角色都需要
    },
    race: '人类',
    age: 42,
    country: '奥雷利安皇都',
    background: '王族',
    sexExperience:
      '海岚作为赛菲亚女帝，拥有至高无上的权力和丰富的政治经验。在人类皇室的文化中，女帝的贞洁被视为神圣的象征，但海岚因为专注于治国事业，她的性经验却相对有限。她曾经与几位帝国贵族有过短暂的亲密关系，但那都是在政治联姻中的逢场作戏。她的身体保持着良好的状态，但由于长期专注于政治，她对真正的爱情和肉体关系并不熟悉。作为女帝，她天生具有领导能力，这种能力让她在政治统治中无往不利，但她从未真正体验过深度的肉体接触。',
    sensitivePoints: ['胸部'],
    sensitivePointsDetail: [
      {
        part: '嘴巴',
        isSensitive: false,
        description:
          '海岚的嘴唇饱满而性感，呈现自然的粉红色，如同玫瑰花瓣般柔嫩。她的唇形完美，上唇略薄而下唇丰盈，接吻时会有微微的颤抖。她的舌头灵活而湿润，口腔内部温暖紧致，当被深入侵犯时会本能地吸吮和纠缠。人类的唾液具有轻微的甜味，据说能够让人产生安全感。',
      },
      {
        part: '胸部',
        isSensitive: true,
        description:
          '海岚的胸部丰满挺拔，F罩杯的乳房在紧身皇室装束下展现出完美的形状。她的乳房触感柔软却富有弹性，乳晕呈现淡粉色，直径约三厘米，乳头在未受刺激时呈现可爱的粉红色。由于长期穿着皇室礼服，她的乳房保持着极佳的形状，几乎没有下垂。当被抚摸时，乳头会迅速充血变硬，整体敏感度极高，这是她最大的弱点之一。',
      },
      {
        part: '阴道',
        isSensitive: false,
        description:
          '海岚的阴道因为性经验有限而保持着良好的紧致度。外阴唇饱满而富有弹性，内阴唇小巧粉嫩，阴蒂隐藏在包皮之下。阴道内壁布满细密的褶皱，收缩力极强，在被插入时会本能地紧紧吸附。人类的阴道具有特殊的温暖能量，能够感知到对方的情绪状态，但阴道本身的敏感度一般。',
      },
      {
        part: '子宫',
        isSensitive: false,
        description:
          '海岚的子宫保持着人类的原始状态，从未被任何异物触碰过。她的子宫口紧闭，内部温度正常，当被精液灌满时会产生强烈的满足感。人类的子宫具有特殊的生命魔法，能够感知到生命的诞生，作为女帝，她的子宫还具有特殊的净化能力，但敏感度并不算高。',
      },
      {
        part: '后庭',
        isSensitive: false,
        description:
          '海岚的后庭紧致而从未被开发过，臀部饱满圆润，臀肉紧实而富有弹性。她的肛门呈现健康的浅粉色，周围皮肤细腻光滑。由于从未有过这方面的经验，她的后庭保持着完全的紧闭状态，即使是手指也难以轻易进入。她对这个部位有着本能的抗拒和羞耻感，认为从后方被侵犯是极度屈辱的行为，特别是被哥布林这种低等生物侵犯。',
      },
    ],
    lifeStory: {
      childhood: [
        '海岚出生于赛菲亚帝国的奥雷利安皇都，是皇室家族的长女。从小她就被灌输着统治帝国和征服世界的理念，在父母的严格训练下，她学会了政治、魔法和军事指挥。在那个充满权力的童年里，她目睹了奥雷利安皇都的辉煌和帝国文明的强大，这让她从小就立志要成为一名女帝，为帝国征服世界。她的母亲是一位资深法师，教会了她高级的魔法知识，这为她后来成为女帝奠定了基础。',
      ],
      adolescence: [
        '十五岁时，海岚正式加入了帝国宫廷，成为了一名见习贵族。在宫廷中，她以优异的政治天赋和坚定的意志赢得了同僚们的尊重。十八岁时，她参加了第一次对外征服行动，在战斗中表现出色，被提升为小队长。二十岁时，她率领自己的小队成功征服了一个邻国，因此被授予了赛菲亚贵族的称号。那段时期是她人生中最充实的时光，她与战友们并肩作战，为帝国的扩张而奋斗。',
      ],
      adulthood: [
        '二十五岁时，海岚被任命为帝国的女帝，负责管理整个帝国的政治事务。作为女帝，她不仅要管理政治，还要管理帝国的日常事务，协调与各据点的合作。她以铁腕手段管理着帝国，用雷霆手段镇压了数次叛乱。在血与火的洗礼中，她从一个年轻的贵族成长为一位成熟的领袖，向所有人证明了人类女性同样可以成为优秀的政治领袖。',
      ],
      currentState: [
        '如今四十二岁的海岚已经担任女帝十七年，她将帝国管理得井井有条，甚至开始向周边地区扩张势力。但作为女帝，她也面临着来自各方的威胁和挑战。夜深人静时，她常常会想念故乡的亲人，但为了帝国的安全，她必须坚守在这个神圣的岗位上。最近哥布林的活动越来越频繁，她预感到一场更大的战斗即将来临，为此她加强了奥雷利安皇都的防御，同时派出侦察兵侦查哥布林巢穴的动向。她不知道的是，她的美貌和身份已经让她成为了哥布林王风花的重点目标。',
      ],
    },
    personality: ['高贵神圣', '智慧深邃', '外冷内热'],
    fears:
      '海岚最大的恐惧是失去权力和让帝国的利益受到损害。作为女帝，她深知每一次决策都关系到帝国的生死。她害怕因为自己的失误而导致帝国失败，害怕无法保护那些信任她的臣民。这种恐惧驱使她必须时刻保持警惕，绝不在任何战斗中掉以轻心。',
    secrets:
      '海岚的秘密是她内心深处对爱情的渴望和对被保护的渴望。作为女帝，她必须时刻保持神圣，但内心深处她渴望有一个能够保护她、理解她的男人。这个秘密让她既困扰又羞耻，她害怕被人发现这个弱点，害怕被人认为她不够神圣。',
    appearance: {
      height: 180,
      weight: 72,
      measurements: '104-70-102',
      cupSize: 'F',
      description:
        '海岚拥有一头如瀑布般倾泻而下的深红色长发，在阳光下闪烁着火焰般的光泽，平时她会将长发编成复杂的辫子盘在脑后，显得既优雅又神圣。她的肌肤呈现出健康的小麦色，这是长期在户外训练和战斗留下的痕迹，却丝毫不减其魅力，反而增添了一种野性的美感。她的五官精致而立体，高挺的鼻梁，薄而性感的嘴唇，一双如金宝石般深邃的眼眸中闪烁着坚定的光芒，眼神中既有女性的柔美也有统治者的威严。她的身材高挑匀称，双肩宽阔而有力，F罩杯的丰满胸部在紧身的皇室装束下勾勒出诱人的曲线。纤细的腰肢和浑圆饱满的臀部形成完美的对比，修长笔直的双腿肌肉线条流畅，显然经过长期的战斗训练。她的手指修长但掌心有薄茧，那是常年握剑留下的痕迹。在她的右臂上有一道淡淡的伤疤，那是早年与敌人战斗时留下的纪念。她的锁骨精致迷人，每当她穿着低领的便装时，那若隐若现的锁骨线条总能吸引无数目光。她习惯佩戴家族传承的皇冠项链，皇冠形的吊坠正好垂落在她深邃的乳沟之间。',
      clothing: {
        head: '金棕色皇室头饰',
        top: '金棕色皇室战袍',
        bottom: '金棕色皇室战裙',
        socks: '金棕色丝质长袜',
        shoes: '金棕色皇室战靴',
        underwear: '金棕色蕾丝内衣',
        accessories: '金棕色皇冠项链',
        toys: '无',
      },
      originalClothing: {
        head: '银白色精灵头饰',
        top: '银白色精灵战袍',
        bottom: '银白色精灵战裙',
        socks: '银白色丝质长袜',
        shoes: '银白色精灵战靴',
        underwear: '银白色蕾丝内衣',
        accessories: '银白色月影项链',
        toys: '无',
      },
    },
    locationId: 'aurelian_capital_capital',
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
    id: 'abandoned_fort',
    name: '废弃要塞',
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
