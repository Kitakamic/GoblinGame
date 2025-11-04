// 大陆探索相关的类型定义

// 数据来源类型
export type DataSource = 'default' | 'custom' | 'merged';

// 大陆元数据
export interface ContinentMetadata {
  createdAt?: number; // 创建时间戳
  modifiedAt?: number; // 修改时间戳
  customFields?: Record<string, any>; // 自定义扩展字段
}

// 大陆信息
export interface Continent {
  name: string;
  description: string;
  difficulty: number; // 1-5，对应探索顺序
  icon: string;
  // 探索成本
  explorationCost: {
    gold: number;
    food: number;
  };
  // 威胁度倍数
  threatMultiplier: number;
  // 解锁条件
  unlockCondition: {
    previousContinentName?: string;
    conquestPercentage: number; // 需要征服前一个大陆的百分比
  };
  // 大陆状态
  isUnlocked: boolean;
  isConquered: boolean;
  conquestProgress: number; // 0-100
  // 区域列表
  regions: Region[];
  // 扩展字段（可选，用于向后兼容）
  source?: DataSource; // 数据来源：'default'（系统默认）| 'custom'（用户自定义）| 'merged'（合并后）
  version?: string; // 数据版本，用于数据迁移
  metadata?: ContinentMetadata; // 元数据
}

// 区域元数据
export interface RegionMetadata {
  createdAt?: number; // 创建时间戳
  modifiedAt?: number; // 修改时间戳
  customFields?: Record<string, any>; // 自定义扩展字段
}

// 区域信息
export interface Region {
  name: string;
  continentName: string;
  description: string;
  difficulty: number;
  icon: string;
  // 区域状态
  isUnlocked: boolean;
  isConquered: boolean;
  conquestProgress: number;
  // 征服和解锁条件
  requiredStars: number; // 征服需要总星级
  unlockStars: number; // 解锁星级
  capital: string; // 首都名称（可选）
  isCapitalConquered: boolean; // 首都是否已征服
  // 威胁度
  threatLevel: number;
  // 据点列表
  locations: string[]; // 据点ID列表
  // 扩展字段（可选，用于向后兼容）
  source?: DataSource; // 数据来源：'default'（系统默认）| 'custom'（用户自定义）| 'merged'（合并后）
  version?: string; // 数据版本，用于数据迁移
  metadata?: RegionMetadata; // 元数据
}

// 大陆探索状态
export interface ContinentExploreState {
  unlockedContinents: string[]; // 已解锁的大陆名称
  conqueredContinents: string[]; // 已征服的大陆名称
  currentContinent: string; // 当前探索的大陆名称
  continentProgress: Record<string, number>; // 各大陆征服进度
  selectedContinent?: string; // 探索界面中当前选择的大陆名称
  selectedRegion?: string; // 探索界面中当前选择的区域名称
}

// 自定义大陆配置
export interface CustomContinentConfig {
  version: string; // 配置版本
  continents: Continent[]; // 自定义大陆列表
  regions?: Region[]; // 自定义区域列表（可选）
  metadata?: {
    createdAt: number;
    modifiedAt: number;
    author?: string; // 作者（可选）
    description?: string; // 配置描述（可选）
  };
}

// 数据合并选项
export interface MergeOptions {
  /** 合并策略：'custom-first'（自定义优先）| 'default-first'（默认优先）| 'merge'（智能合并） */
  strategy?: 'custom-first' | 'default-first' | 'merge';
  /** 是否允许覆盖同名大陆 */
  allowOverride?: boolean;
  /** 是否保留默认数据 */
  preserveDefault?: boolean;
}
