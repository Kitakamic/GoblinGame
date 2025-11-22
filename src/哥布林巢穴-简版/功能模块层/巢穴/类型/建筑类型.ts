/**
 * 建筑效果接口
 */
export interface BuildingEffect {
  type: string;
  icon: string;
  description: string;
}

/**
 * 建筑成本接口
 */
export interface BuildingCost {
  gold: number;
  food: number;
}

/**
 * 建筑收入接口
 */
export interface BuildingIncome {
  gold?: number;
  food?: number;
}

/**
 * 建筑接口定义
 */
export interface Building {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: BuildingCost;
  category: 'breeding' | 'resource' | 'global';
  income?: BuildingIncome; // 每回合收入
  effects: BuildingEffect[];
}

/**
 * 建筑槽位接口定义
 */
export interface BuildingSlot {
  building: Building | null;
  unlocked: boolean;
}

/**
 * 槽位类型
 */
export type SlotType = 'breeding' | 'resource' | 'global';

/**
 * 槽位成本接口
 */
export interface SlotCost {
  gold: number;
  food: number;
}
