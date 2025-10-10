import { WorldbookHelper } from './世界书助手';
import type { HistoryRecord, WorldbookEntry } from './世界书类型定义';
import { RecordBuilder } from './记录构建器';

/**
 * 游戏冒头事件世界书管理器
 * 专门管理随机事件的故事记录
 */
export class GameEventLorebookManager {
  /**
   * 创建或追加游戏事件故事记录到世界书
   */
  static async createEventStoryRecord(
    worldbookName: string,
    eventId: string,
    eventName: string,
    eventContent: string,
    gameTime: string,
  ): Promise<void> {
    try {
      console.log(`开始处理游戏事件故事记录: ${eventName}`);

      // 构建新的故事记录
      const newStoryRecord: HistoryRecord = {
        gameTime,
        sender: '游戏事件记录',
        content: eventContent,
        timestamp: Date.now(),
      };

      // 确保世界书存在
      await WorldbookHelper.ensureExists(worldbookName);

      // 检查是否已存在相同的事件记录
      const existingEntry = await this.getEventStoryEntry(worldbookName, eventId);

      if (existingEntry) {
        // 如果已存在，直接在现有内容后面追加新记录
        console.log(`游戏事件故事记录已存在，追加新内容: ${eventName}`);

        const newRecordContent = RecordBuilder.buildEventStoryContent([newStoryRecord]);
        const updatedContent = existingEntry.content + '\n\n' + newRecordContent;

        // 更新条目
        const updatedEntry: WorldbookEntry = {
          ...existingEntry,
          content: updatedContent,
          extra: {
            ...existingEntry.extra,
            updated_at: new Date().toISOString(),
          },
        };

        // 更新世界书中的条目
        const currentWorldbook = await WorldbookHelper.get(worldbookName);
        const entryIndex = currentWorldbook.findIndex(entry => entry.uid === existingEntry.uid);

        if (entryIndex !== -1) {
          currentWorldbook[entryIndex] = updatedEntry;
          await WorldbookHelper.replace(worldbookName, currentWorldbook);
          console.log(`游戏事件故事记录追加成功: ${eventName}`);
        } else {
          console.warn(`未找到要更新的条目: ${eventId}`);
        }
      } else {
        // 如果不存在，创建新的条目
        console.log(`创建新的游戏事件故事记录: ${eventName}`);

        const entryContent = RecordBuilder.buildEventStoryContent([newStoryRecord]);

        // 创建世界书条目
        const worldbookEntry: WorldbookEntry = {
          name: '游戏事件记录',
          content: entryContent,
          uid: Date.now(),
          enabled: true,
          strategy: {
            type: 'constant',
            keys: [],
            keys_secondary: {
              logic: 'and_any',
              keys: [],
            },
            scan_depth: 'same_as_global',
          },
          position: {
            type: 'after_character_definition',
            role: 'system',
            depth: 0,
            order: 120,
          },
          probability: 100,
          recursion: {
            prevent_incoming: true,
            prevent_outgoing: true,
            delay_until: null,
          },
          effect: {
            sticky: null,
            cooldown: null,
            delay: null,
          },
          extra: {
            entry_type: 'game_event_story',
            event_id: eventId,
            event_name: eventName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };

        // 添加到世界书
        const currentWorldbook = await WorldbookHelper.get(worldbookName);
        await WorldbookHelper.replace(worldbookName, [...currentWorldbook, worldbookEntry]);
        console.log(`游戏事件故事记录创建成功: ${eventName}`);
      }
    } catch (error) {
      console.error('处理游戏事件故事记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取游戏事件故事记录
   */
  static async getEventStoryEntry(worldbookName: string, eventId: string): Promise<WorldbookEntry | null> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      if (!worldbook || worldbook.length === 0) {
        return null;
      }

      // 查找匹配的条目
      const entry = worldbook.find(
        (entry: WorldbookEntry) => entry.extra?.entry_type === 'game_event_story' && entry.extra?.event_id === eventId,
      );

      return entry || null;
    } catch (error) {
      console.error('获取游戏事件故事记录失败:', error);
      return null;
    }
  }
}
