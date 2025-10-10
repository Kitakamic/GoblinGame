/**
 * 队长接口
 * 用于部队编制系统中的队长数据
 */
export interface Captain {
  /** 唯一标识符 */
  id: string;
  /** 队长姓名 */
  name: string;
  /** 头像 */
  avatar: string;
  /** 等级 */
  level: number;
  /** 后代数量 */
  offspring: number;
  /** 属性 */
  attributes: {
    attack: number;
    defense: number;
    intelligence: number;
    speed: number;
    health: number;
  };
  /** 描述 */
  description: string;
  /** 是否已使用 */
  isUsed: boolean;
  /** 部队编制信息 */
  troops?: {
    普通哥布林: number;
    哥布林战士: number;
    哥布林萨满: number;
    哥布林圣骑士: number;
  };
  /** 原始属性（用于恢复） */
  originalAttributes?: {
    attack: number;
    defense: number;
    intelligence: number;
    speed: number;
    health: number;
  };
  /** 部队加成信息 */
  troopBonuses?: {
    attack: number;
    defense: number;
    intelligence: number;
    speed: number;
    health: number;
  };
}

/**
 * 部队配置接口
 */
export interface FormationConfig {
  id: string;
  name: string;
  description?: string;
  captainSlots: (Captain | null)[];
  createdAt: number;
  lastModified: number;
}
