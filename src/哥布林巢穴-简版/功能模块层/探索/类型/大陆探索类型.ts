// 大陆探索相关的类型定义

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
