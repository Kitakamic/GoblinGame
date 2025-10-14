// 随机事件类型枚举
export enum EventType {
  MERCHANT = 'merchant', // 神秘商人
  TREASURE = 'treasure', // 宝藏发现
  ENCOUNTER = 'encounter', // 遭遇事件
  DISASTER = 'disaster', // 灾难事件
  BLESSING = 'blessing', // 祝福事件
  QUEST = 'quest', // 任务事件
  RANDOM = 'random', // 随机事件
}

// 事件稀有度
export enum EventRarity {
  COMMON = 'common', // 普通 (60%)
  UNCOMMON = 'uncommon', // 不常见 (25%)
  RARE = 'rare', // 稀有 (12%)
  EPIC = 'epic', // 史诗 (2.5%)
  LEGENDARY = 'legendary', // 传说 (0.5%)
}

// 事件触发条件
export interface EventTrigger {
  minRound?: number; // 最小回合数
  maxRound?: number; // 最大回合数
  requiredResources?: {
    // 需要的资源
    [key: string]: number;
  };
  requiredThreat?: number; // 需要的威胁度
  requiredContinentConquest?: {
    // 需要的大陆征服度条件
    continentName: string; // 大陆名称
    minConquestProgress: number; // 最小征服进度 (0-100)
  };
  probability?: number; // 触发概率 (0-1)
  triggerOnce?: boolean; // 是否只触发一次
  triggerOnFirstContact?: boolean; // 是否在初次接触时触发
  cooldownRounds?: number; // 冷却回合数，触发后多少回合内不会再次触发
}

// 事件奖励
export interface EventReward {
  type: 'resource' | 'item' | 'character' | 'building' | 'special';
  id: string;
  amount?: number;
  description: string;
}

// 事件惩罚
export interface EventPenalty {
  type: 'resource' | 'threat' | 'character' | 'building';
  id: string;
  amount?: number;
  description: string;
}

// 随机事件接口
export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  rarity: EventRarity;
  trigger: EventTrigger;
  rewards?: EventReward[];
  penalties?: EventPenalty[];
  dialogueConfig: {
    title: string;
    subtitle?: string;
    welcomeText: string;
    welcomeHint: string;
    showCustomInput?: boolean; // 是否显示自定义输入区域
    initialOptions: Array<{
      text: string;
      label: string;
      value?: any;
    }>;
    onOptionSelect?: (option: any) => void;
    onCustomInput?: (text: string) => void;
    onAIGenerate?: (userInput: string) => Promise<string>;
    onDialogueClose?: () => void;
  };
}

// 事件触发结果
export interface EventTriggerResult {
  triggered: boolean;
  event?: RandomEvent;
  reason?: string;
}

// 事件处理结果
export interface EventProcessResult {
  success: boolean;
  rewards?: EventReward[];
  penalties?: EventPenalty[];
  message: string;
}

// 事件历史记录
export interface EventHistory {
  eventId: string;
  triggerRound: number;
  cooldownUntil?: number; // 冷却结束回合数
}
