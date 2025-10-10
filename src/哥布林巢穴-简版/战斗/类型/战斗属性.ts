/**
 * 战斗属性类型
 * 攻：物理攻击力
 * 防：防御力
 * 知：法术攻击力/智力
 * 速：速度，决定出手顺序
 */
export interface BattleAttributes {
  /** 物理攻击力 */
  attack: number;
  /** 防御力 */
  defense: number;
  /** 法术攻击力/智力 */
  intelligence: number;
  /** 速度 */
  speed: number;
}

/**
 * 部队编制信息
 */
export interface TroopDeployment {
  /** 普通哥布林数量 */
  normalGoblins?: number;
  /** 哥布林战士数量 */
  warriorGoblins?: number;
  /** 哥布林萨满数量 */
  shamanGoblins?: number;
  /** 哥布林圣骑士数量 */
  paladinGoblins?: number;
  /** 敌方部队数量 */
  count?: number;
  /** 敌方部队类型 */
  type?: string;
}

/**
 * 战斗中的单位实例
 * 基于人物数据，只包含战斗特有的临时状态
 */
export interface BattleUnit {
  /** 单位ID */
  id: string;
  /** 单位名称 */
  name: string;
  /** 单位类型 */
  type: string;
  /** 等级 */
  level: number;
  /** 战斗属性 */
  attributes: BattleAttributes;
  /** 最大生命值 */
  maxHealth: number;
  /** 当前生命值（战斗中的临时状态） */
  currentHealth: number;
  /** 是否存活（战斗中的临时状态） */
  isAlive: boolean;
  /** 是否已行动（战斗中的临时状态） */
  hasActed?: boolean;
  /** 下辖部队信息（可选） */
  troops?: TroopDeployment;
  /** 头像（可选） */
  avatar?: string;
  /** 回退头像（emoji，当avatar是图片链接时使用） */
  fallbackAvatar?: string;
}

/**
 * 战斗行动类型
 */
export enum ActionType {
  /** 物理攻击 */
  PHYSICAL_ATTACK = 'physical_attack',
  /** 法术攻击 */
  MAGICAL_ATTACK = 'magical_attack',
  /** 防御 */
  DEFEND = 'defend',
  /** 技能 */
  SKILL = 'skill',
  /** 逃跑 */
  FLEE = 'flee',
}

/**
 * 战斗行动
 */
export interface BattleAction {
  /** 行动类型 */
  type: ActionType;
  /** 执行者 */
  actor: BattleUnit;
  /** 目标 */
  target?: BattleUnit;
  /** 伤害值 */
  damage?: number;
  /** 是否命中 */
  hit?: boolean;
  /** 是否暴击 */
  critical?: boolean;
  /** 行动描述 */
  description: string;
}

/**
 * 战斗回合
 */
export interface BattleTurn {
  /** 回合编号 */
  turnNumber: number;
  /** 行动列表（按速度排序） */
  actions: BattleAction[];
  /** 回合开始时的状态 */
  startState: BattleState;
  /** 回合结束时的状态 */
  endState: BattleState;
}

/**
 * 战斗状态
 */
export interface BattleState {
  /** 我方单位 */
  allies: BattleUnit[];
  /** 敌方单位 */
  enemies: BattleUnit[];
  /** 当前回合 */
  currentTurn: number;
  /** 战斗是否结束 */
  isFinished: boolean;
  /** 胜利方 */
  winner?: 'allies' | 'enemies';
}

/**
 * 战斗结果
 */
export interface BattleResult {
  /** 是否胜利 */
  victory: boolean;
  /** 战斗回合数 */
  totalTurns: number;
  /** 战斗回合详情 */
  turns: BattleTurn[];
  /** 最终状态 */
  finalState: BattleState;
  /** 战斗统计 */
  statistics: {
    totalDamageDealt: number;
    totalDamageReceived: number;
    criticalHits: number;
    misses: number;
  };
  /** 初始部队状态 */
  initialTroopState?: Record<string, any>;
}
