/**
 * 世界书相关的类型定义
 */

/**
 * 世界书条目类型定义
 */
export interface WorldbookEntry {
  name: string;
  content: string;
  uid: number;
  enabled: boolean;
  strategy: {
    type: 'selective' | 'constant' | 'vectorized';
    keys: (string | RegExp)[];
    keys_secondary: {
      logic: 'and_any' | 'and_all' | 'not_all' | 'not_any';
      keys: (string | RegExp)[];
    };
    scan_depth: 'same_as_global' | number;
  };
  position: {
    type:
      | 'at_depth'
      | 'before_character_definition'
      | 'after_character_definition'
      | 'before_example_messages'
      | 'after_example_messages'
      | 'before_author_note'
      | 'after_author_note';
    role: 'system' | 'user' | 'assistant';
    depth: number;
    order: number;
  };
  probability: number;
  recursion: {
    prevent_incoming: boolean;
    prevent_outgoing: boolean;
    delay_until: number | null;
  };
  effect: {
    sticky: number | null;
    cooldown: number | null;
    delay: number | null;
  };
  extra?: {
    entry_type?: string;
    character_id?: string;
    character_name?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  };
}

/**
 * 历史记录类型
 */
export interface HistoryRecord {
  gameTime: string; // 游戏时间（格式化日期字符串，如"帝国历1074年1月1日"）
  sender?: string;
  content: string;
  timestamp: number; // 时间戳（毫秒），用于排序
}

/**
 * 解锁状态类型
 */
export interface UnlockStatus {
  lifeStory: boolean;
  personality: boolean;
  sensitivePoints: boolean;
  fearsAndSecrets: boolean;
}

/**
 * 合并模式类型
 */
export type MergeMode = 'replace' | 'merge';

/**
 * 条目类型枚举
 */
export enum EntryType {
  CHARACTER = 'character',
  RESOURCES = 'resources',
  STORY_HISTORY = 'character_story_history',
  CONQUEST_RECORDS = 'conquest_records',
}
