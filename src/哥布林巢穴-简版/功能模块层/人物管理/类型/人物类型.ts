/**
 * 人物类型定义文件
 * 包含所有与人物相关的类型定义
 */

// ==================== 基础枚举类型 ====================

/** 人物状态枚举 */
export type CharacterStatus =
  | 'imprisoned'
  | 'training'
  | 'breeding'
  | 'uncaptured'
  | 'surrendered'
  | 'deployed'
  | 'player'
  | 'enemy';

/**
 * 人物状态说明：
 * - 'imprisoned'（关押中）：已捕获但未投降的人物
 * - 'surrendered'（已投降）：已投降的人物，可以进行训练和生育
 * - 'deployed'（已编制）：已编制到部队中的人物
 * - 'training'（训练中）：正在训练的人物
 * - 'breeding'（生育中）：正在生育的人物
 * - 'uncaptured'（未捕获）：尚未捕获的人物
 * - 'player'（玩家角色）：特殊的玩家角色，不能调教，不显示在调教界面
 * - 'enemy'（敌方）：作为敌方参战的人物
 *
 * 状态互斥规则：
 * - 'deployed'（已编制）与 'breeding'（生育中）互斥
 * - 已编制的人物不能进行生育，需要先解除编制
 * - 'player'（玩家角色）与其他所有状态互斥，具有特殊性质
 * - 'enemy'（敌方）与玩家控制状态互斥
 */

/** 人物评级枚举 */
export type CharacterRating = 'S' | 'A' | 'B' | 'C' | 'D';

/** 哥布林类型枚举 */
export type GoblinType = '普通哥布林' | '哥布林战士' | '哥布林萨满' | '哥布林圣骑士';

/** 种族类型枚举 */
export type RaceType = '人类' | '狐族' | '永恒精灵' | '黑暗精灵' | '哥布林' | '亡灵' | '天使' | '魔族';

/** 出身等级枚举 */
export type BackgroundType = '平民' | '贵族' | '王族';

// ==================== 战斗相关类型 ====================

/** 人物五维属性 */
export interface CharacterAttributes {
  /** 攻击力 */
  attack: number;
  /** 防御力 */
  defense: number;
  /** 智力 */
  intelligence: number;
  /** 速度 */
  speed: number;
  /** 血量 */
  health: number;
}

/** 部队编制信息 */
export interface TroopDeployment {
  /** 普通哥布林数量 */
  normalGoblins: number;
  /** 哥布林战士数量 */
  warriorGoblins: number;
  /** 哥布林萨满数量 */
  shamanGoblins: number;
  /** 哥布林圣骑士数量 */
  paladinGoblins: number;
}

// ==================== 外观相关类型 ====================

/** 衣着信息 */
export interface CharacterClothing {
  /** 头部装饰 */
  head?: string;
  /** 上装 */
  top?: string;
  /** 下装 */
  bottom?: string;
  /** 袜子 */
  socks?: string;
  /** 鞋子 */
  shoes?: string;
  /** 内衣 */
  underwear?: string;
  /** 装饰品 */
  accessories?: string;
  /** 玩具 */
  toys?: string;
}

/** 人物外观信息 */
export interface CharacterAppearance {
  /** 基础身体数据 */
  height: number; // 身高(cm)
  weight: number; // 体重(kg)
  measurements: string; // 三围
  cupSize?: string; // 罩杯
  /** 外貌详细描述 */
  description?: string;
  /** 衣着信息（正常状态） */
  clothing?: CharacterClothing;
  /** 原始衣着信息（用于重置功能） */
  originalClothing?: CharacterClothing;
  /** 堕落衣着信息（loyalty=100时显示） */
  corruptedClothing?: CharacterClothing;
}

// ==================== 敏感点相关类型 ====================

/** 敏感点信息 */
export interface SensitivePoint {
  /** 部位名称 */
  part: string;
  /** 是否敏感 */
  isSensitive: boolean;
  /** 详细描述 */
  description: string;
}

/** 敏感点类型 */
export type SensitivePart = '嘴巴' | '胸部' | '乳头' | '阴道' | '子宫' | '后庭' | '阴蒂' | 'G点';

// ==================== 人生经历类型 ====================

/** 人物人生经历 */
export interface CharacterLifeStory {
  childhood: string[]; // 童年经历
  adolescence: string[]; // 青少年经历
  adulthood: string[]; // 成年经历
  currentState: string[]; // 当前状态
}

// ==================== 生育相关类型 ====================

/** 生育记录 */
export interface BreedingRecord {
  type: GoblinType; // 哥布林类型
  count: number; // 数量
  date: Date; // 日期
  round: number; // 回合
}

/** 生育结果 */
export interface BreedingResult {
  characterId: string;
  characterName: string;
  totalOffspring: number;
  records: BreedingRecord[];
}

// ==================== 额外附加信息 ====================

/** 额外附加信息（允许玩家自定义） */
export interface AdditionalInformation {
  Notes: string;
}

// ==================== 主要人物类型 ====================

/** 统一的人物数据类型定义 */
export interface Character {
  // ========== 基础信息 ==========
  /** 唯一标识符 */
  id: string;
  /** 姓名 */
  name: string;
  /** 身份/称号 */
  title: string;
  /** 头像 */
  avatar?: string;
  /** 半堕落头像 */
  corruptedAvatar?: string;
  /** 完全堕落头像 */
  fullyCorruptedAvatar?: string;
  /** 初始头像（生成时的头像，用于恢复） */
  originalAvatar?: string;
  /** 初始半堕落头像（生成时的头像，用于恢复） */
  originalCorruptedAvatar?: string;
  /** 初始完全堕落头像（生成时的头像，用于恢复） */
  originalFullyCorruptedAvatar?: string;

  // ========== 状态信息 ==========
  /** 当前状态 */
  status: CharacterStatus;
  /** 原始状态（用于回合结束事件完毕后恢复） */
  originalStatus?: CharacterStatus;
  /** 位置信息（据点名称或交配间ID） */
  locationId?: string;
  /** 捕获时间（游戏内日期，格式化字符串或Date对象用于兼容） */
  capturedAt?: Date | string;
  /** 是否可以战斗（决定能否作为敌方单位或战斗队长） */
  canCombat: boolean;

  // ========== 属性信息 ==========
  /** 忠诚度 */
  loyalty: number;
  /** 体力 */
  stamina: number;
  /** 生育力 */
  fertility: number;
  /** 后代数量 */
  offspring: number;
  /** 最大体力值（生成时的最大值） */
  maxStamina?: number;
  /** 最大生育力值（生成时的最大值） */
  maxFertility?: number;
  /** 评级 */
  rating: CharacterRating;
  /** 是否收藏 */
  favorite?: boolean;
  /** 是否支持一键调教（默认为 true，关闭时跳过批量调教） */
  autoTrainEnabled?: boolean;
  /** 是否支持一键生育（默认为 true，关闭时跳过批量生育） */
  autoBreedEnabled?: boolean;

  // ========== 战斗属性 ==========
  /** 等级（决定可下辖哥布林数量） */
  level: number;
  /** 人物基础五维属性 */
  attributes: CharacterAttributes;
  /** 编制部队后的五维属性（基础属性+部队加成+评级加成） */
  deployedAttributes?: CharacterAttributes;
  /** 部队编制信息 */
  troopDeployment?: TroopDeployment;
  /** 部队编制位置（1-6） */
  formationPosition?: number;

  // ========== 调教信息 ==========
  /** 最后调教时间 */
  lastTraining?: Date;
  /** 指导风格主题ID（关联到主题库中的主题） */
  guidelineThemeId?: string;
  /** 人物触发额外关键词（加入到世界书的第二提示词 keys_secondary 里面触发） */
  worldbookSecondaryKeys?: string[];
  /** 是否为全局人物（将人物的条目 selective 改为 constant，总是触发） */
  isGlobalCharacter?: boolean;

  // ========== 生育记录 ==========
  /** 生育记录 */
  breedingRecords?: BreedingRecord[];

  // ========== 详细人物信息 ==========
  /** 种族 */
  race: RaceType;
  /** 年龄 */
  age: number;
  /** 国家 */
  country: string;
  /** 出身等级 */
  background: BackgroundType;
  /** 单位类型（用于战斗系统） */
  unitType?: 'physical' | 'magical';
  /** 可带领的种族（用于敌方单位队长） */
  canLeadRaces?: RaceType[];
  /** 性经验 */
  sexExperience?: string;
  /** 敏感点 */
  sensitivePoints?: string[];
  /** 敏感点详细信息 */
  sensitivePointsDetail?: SensitivePoint[];
  /** 人生经历 */
  lifeStory?: CharacterLifeStory;
  /** 性格特征 */
  personality?: string[];
  /** 恐惧 */
  fears?: string;
  /** 秘密 */
  secrets?: string;
  /** 外观信息 */
  appearance?: CharacterAppearance;
  /** 额外附加信息 */
  additionalInformation?: AdditionalInformation;
}
