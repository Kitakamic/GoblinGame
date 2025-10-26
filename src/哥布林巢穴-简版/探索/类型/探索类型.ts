// 探索相关的类型定义
import { Character } from '../../人物管理/类型/人物类型';

// 据点类型 - 细化为不同大陆和种族的据点类型
export type LocationType =
  // 通用据点类型
  | 'village' // 村庄
  | 'town' // 城镇
  | 'city' // 城市
  | 'ruins' // 遗迹
  | 'trade_caravan' // 贸易商队
  | 'adventurer_party' // 冒险者小队
  // 古拉尔大陆（流放之地）- 混居
  | 'exile_outpost' // 流放者据点
  | 'bandit_camp' // 盗匪营地
  | 'elven_forest' // 精灵森林
  | 'fox_colony' // 狐族殖民地
  // 瓦尔基里大陆（黑暗精灵）
  | 'dark_spire' // 巢都尖塔
  | 'slave_camp' // 奴隶营地
  | 'dark_fortress' // 黑暗要塞
  | 'obsidian_mine' // 黑曜石矿场
  | 'raid_dock' // 劫掠舰码头
  // 香草群岛（狐族）
  | 'fox_water_town' // 狐族水乡
  | 'shrine' // 神社
  | 'trading_port' // 贸易港口
  | 'warship_dock' // 军舰泊地
  | 'spice_plantation' // 香料种植园
  // 赛菲亚大陆（人类帝国）
  | 'imperial_city' // 帝国城市
  | 'noble_estate' // 贵族庄园
  | 'mining_district' // 矿业区域
  | 'border_fortress' // 边境要塞
  | 'cathedral' // 教堂
  | 'academy' // 学院
  // 世界树圣域（永恒精灵）
  | 'tree_city' // 树城
  | 'elven_temple' // 精灵圣殿
  | 'guardian_outpost' // 守卫哨所
  | 'canopy_palace'; // 树冠宫殿

// 据点类型
export interface Location {
  id: string;
  name: string;
  type: LocationType;
  icon: string;
  description: string;
  difficulty: number; // 星级难度 (1-10星)
  distance: number; // 距离巢穴的距离（公里）
  rewards: {
    gold?: number;
    food?: number;
    slaves?: number;
    items?: string[];
    heroes?: Character[]; // 英雄人物信息（完整角色信息）
  };
  status: 'unknown' | 'scouted' | 'attacked' | 'conquered';
  lastScouted?: number; // 最后侦察时间戳
  lastAttacked?: number; // 最后攻击时间戳
  race?: string; // 据点主要种族
  continent?: string; // 据点所属大陆
  region?: string; // 据点所属区域
  baseGuards?: number; // 基础守军总人数
  specialUnit?: {
    name: string;
    race: string;
    unitType: 'physical' | 'magical'; // 统一使用 unitType 字段
    attributes: {
      attack: number;
      defense: number;
      intelligence: number;
      speed: number;
      health: number;
    };
  }; // 特殊单位信息
  // 敌方单位信息（战斗时生成并固定）
  enemyUnits?: EnemyUnit[];
  // 敌方单位生成时间戳（用于判断是否需要重新生成）
  enemyUnitsGeneratedAt?: number;
  // AI英雄生成标记
  needsAIHero?: boolean;
  // 图片资源信息
  pictureResource?: {
    id: string;
    race: string;
    class: string;
    prompt: string;
    imageUrl?: string; // 完整的图片URL
    generatedName?: {
      fullName: string;
    }; // 生成的人物名称
  };
}

// 敌方单位类型定义
export interface EnemyUnit {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  troopCount: number; // 该单位下辖的部队数量
  attributes: {
    attack: number;
    defense: number;
    intelligence: number;
    speed: number;
    health: number;
  };
  avatar?: string; // 头像
  country?: string; // 所属国家
  // 战斗相关属性
  unitType: 'physical' | 'magical'; // 单位类型（必须字段）
  canLeadRaces?: string[]; // 可领导的种族
  // 英雄相关属性
  isHero?: boolean; // 是否为英雄单位
  heroId?: string; // 英雄人物ID（如果是英雄单位）
  // 部下信息
  troops?: {
    type: string; // 部下单位类型
    count: number; // 部下数量
  };
}

// 侦察结果
export interface ScoutResult {
  locationId: string;
  information: {
    rewards: Partial<Location['rewards']>;
    status: Location['status'];
  };
  cost: {
    gold: number;
    food: number;
  };
  error?: string; // 可选的错误信息
  needsUserDecision?: boolean; // 是否需要用户决策（AI生成失败时）
  aiFailureData?: {
    location: Location;
    originalCost: { gold: number; food: number };
  }; // AI失败时的数据
}

// 攻击目标面板
export interface AttackTarget {
  location: Location;
  selectedGoblins: {
    normal: number;
    warriors: number;
    shamans: number;
    paladins: number;
  };
}

// 探索状态记录
export interface ExploreState {
  scoutedLocations: string[]; // 已侦察的据点ID列表
  conqueredLocations: string[]; // 已征服的据点ID列表
}
