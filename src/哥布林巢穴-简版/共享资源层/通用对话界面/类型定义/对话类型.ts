// 对话配置接口
export interface DialogueConfig {
  title: string;
  subtitle?: string;
  welcomeText: string;
  welcomeHint: string;
  customPlaceholder?: string;
  initialOptions?: DialogueOption[];
  onOptionSelect?: (option: DialogueOption) => boolean | void;
  onCustomInput?: (text: string) => void;
  onAIGenerate?: (userInput: string) => Promise<string>;
  onDialogueEnd?: () => void;
  onDialogueClose?: () => void;
  saveKey?: string; // 用于数据持久化的键
  onRetry?: () => Promise<void> | void; // 重试前的回调，用于恢复状态
  onAIReply?: (aiResponse: string, characterName: string) => Promise<void>; // AI回复后的回调
  onUserMessage?: (userMessage: string) => Promise<void>; // 用户消息的回调
  characterName?: string; // AI角色名称
  showCustomInput?: boolean; // 是否显示自定义输入功能
}

// 对话选项接口
export interface DialogueOption {
  text: string;
  label?: string;
  value?: any;
}

// 对话事件类型
export type DialogueEventType =
  | 'option-selected'
  | 'custom-input'
  | 'ai-generated'
  | 'dialogue-ended'
  | 'dialogue-closed';

// 对话状态
export interface DialogueState {
  isActive: boolean;
  currentPage: number;
  totalPages: number;
  hasOptions: boolean;
  isSending: boolean;
}

// 对话消息
export interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  characterName?: string;
}

// 对话页面
export interface DialoguePage {
  id: string;
  html: string;
  timestamp: number;
  messageIndex: number;
}
