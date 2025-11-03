import { WorldbookHelper } from '../工具/世界书助手';
import { RecordBuilder } from '../工具/记录构建器';
import type { HistoryRecord, WorldbookEntry } from '../类型/世界书类型定义';

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

      // 【旧存档兼容性处理】在追加前先检查并合并重复的"游戏事件记录"条目
      await this.mergeDuplicateEventStoryEntries(worldbookName);

      // 获取当前世界书
      const currentWorldbook = await WorldbookHelper.get(worldbookName);

      // 查找统一的游戏事件记录条目（所有事件共享一个条目，避免同名重复）
      const unifiedEventEntryIndex = currentWorldbook.findIndex(
        entry => entry.extra?.entry_type === 'game_event_story' && entry.name === '游戏事件记录',
      );

      const newRecordContent = RecordBuilder.buildEventStoryContent([newStoryRecord]);

      if (unifiedEventEntryIndex !== -1) {
        // 如果已存在统一的游戏事件记录条目，追加新记录
        console.log(`游戏事件故事记录已存在，追加新内容: ${eventName}`);

        const existingEntry = currentWorldbook[unifiedEventEntryIndex];

        // 检查是否有 summary 标签（仅支持新格式<summary_N>），如果有则插入到 summary 和原始内容之间
        let updatedContent = '';
        if (/<summary_\d+>/.test(existingEntry.content)) {
          // 提取所有 summary 部分并去重（仅支持新格式<summary_N>）
          const summaries = WorldbookHelper.extractAndDeduplicateSummaries(existingEntry.content);
          const summaryContent = WorldbookHelper.combineSummaries(summaries);
          const originalContent = WorldbookHelper.removeAllSummaries(existingEntry.content);

          // 在新记录追加到原始内容后面
          const updatedOriginalContent = originalContent + '\n\n' + newRecordContent;

          // 拼接 summary + 更新后的原始内容
          updatedContent = summaryContent + '\n\n' + updatedOriginalContent;
        } else {
          // 没有 summary，直接追加
          updatedContent = existingEntry.content + '\n\n' + newRecordContent;
        }

        // 更新条目
        // 保留现有的 event_id 和 event_name（使用第一个事件的，或更新为最新事件的）
        const existingEventIds = existingEntry.extra?.event_ids || [];
        const existingEventNames = existingEntry.extra?.event_names || [];
        if (!existingEventIds.includes(eventId)) {
          existingEventIds.push(eventId);
          existingEventNames.push(eventName);
        }

        const updatedEntry: WorldbookEntry = {
          ...existingEntry,
          content: updatedContent,
          extra: {
            ...existingEntry.extra,
            event_ids: existingEventIds,
            event_names: existingEventNames,
            updated_at: new Date().toISOString(),
          },
        };

        currentWorldbook[unifiedEventEntryIndex] = updatedEntry;
        await WorldbookHelper.replace(worldbookName, currentWorldbook);
        console.log(`游戏事件故事记录追加成功: ${eventName}`);
      } else {
        // 如果不存在统一的条目，创建新的条目
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
            event_ids: [eventId],
            event_name: eventName,
            event_names: [eventName],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };

        // 添加到世界书
        await WorldbookHelper.replace(worldbookName, [...currentWorldbook, worldbookEntry]);
        console.log(`游戏事件故事记录创建成功: ${eventName}`);
      }
    } catch (error) {
      console.error('处理游戏事件故事记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取统一的游戏事件故事记录条目
   * 现在所有游戏事件记录都合并到一个条目中，避免同名重复
   */
  static async getUnifiedEventStoryEntry(worldbookName: string): Promise<WorldbookEntry | null> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      if (!worldbook || worldbook.length === 0) {
        return null;
      }

      // 查找统一的游戏事件记录条目
      const entry = worldbook.find(
        (entry: WorldbookEntry) => entry.extra?.entry_type === 'game_event_story' && entry.name === '游戏事件记录',
      );

      return entry || null;
    } catch (error) {
      console.error('获取游戏事件故事记录失败:', error);
      return null;
    }
  }

  /**
   * 合并重复的"游戏事件记录"条目（旧存档兼容性处理）
   * 如果检测到多条同名的"游戏事件记录"条目，将它们合并为一个条目
   */
  static async mergeDuplicateEventStoryEntries(worldbookName: string): Promise<boolean> {
    try {
      await WorldbookHelper.ensureExists(worldbookName);
      const worldbook = await WorldbookHelper.get(worldbookName);

      // 查找所有名为"游戏事件记录"且类型为 game_event_story 的条目
      const duplicateEntries = worldbook.filter(
        entry => entry.extra?.entry_type === 'game_event_story' && entry.name === '游戏事件记录',
      );

      // 如果没有重复条目或只有一个条目，无需合并
      if (duplicateEntries.length <= 1) {
        return false;
      }

      console.log(`🔄 [旧存档兼容] 检测到 ${duplicateEntries.length} 条重复的"游戏事件记录"条目，开始合并...`);

      // 按 UID 排序，确保合并顺序一致（保留最早的条目作为主条目）
      duplicateEntries.sort((a, b) => (a.uid || 0) - (b.uid || 0));

      // 第一个条目作为主条目
      const mainEntry = duplicateEntries[0];
      const otherEntries = duplicateEntries.slice(1);

      // 收集所有事件ID和名称
      const allEventIds: string[] = [];
      const allEventNames: string[] = [];

      // 从主条目中提取 event_ids 和 event_names（如果存在）
      if (mainEntry.extra?.event_ids && Array.isArray(mainEntry.extra.event_ids)) {
        allEventIds.push(...mainEntry.extra.event_ids);
      } else if (mainEntry.extra?.event_id) {
        allEventIds.push(mainEntry.extra.event_id);
      }

      if (mainEntry.extra?.event_names && Array.isArray(mainEntry.extra.event_names)) {
        allEventNames.push(...mainEntry.extra.event_names);
      } else if (mainEntry.extra?.event_name) {
        allEventNames.push(mainEntry.extra.event_name);
      }

      // 合并所有条目的内容
      let mergedContent = mainEntry.content || '';

      // 提取主条目的 summary（如果存在）
      let mainSummary = '';
      if (mergedContent.includes('<summary>') || /<summary_\d+>/.test(mergedContent)) {
        const summaryMatches = mergedContent.matchAll(/<summary(?:_\d+)?>([\s\S]*?)<\/summary(?:_\d+)?>/g);
        const summaries: string[] = [];
        for (const match of summaryMatches) {
          summaries.push(match[0]);
        }
        mainSummary = summaries.join('\n\n') + '\n\n';
        // 移除 summary 部分，只保留原始内容
        mergedContent = mergedContent.replace(/<summary(?:_\d+)?>[\s\S]*?<\/summary(?:_\d+)?>\n*/g, '').trim();
      }

      // 合并其他条目的内容
      for (const entry of otherEntries) {
        let entryContent = entry.content || '';

        // 提取该条目的 summary（如果存在）
        if (entryContent.includes('<summary>') || /<summary_\d+>/.test(entryContent)) {
          // 移除 summary，只保留原始内容用于合并
          entryContent = entryContent.replace(/<summary(?:_\d+)?>[\s\S]*?<\/summary(?:_\d+)?>\n*/g, '').trim();
        }

        // 如果内容不为空，追加到合并内容中
        if (entryContent.trim()) {
          mergedContent = mergedContent.trim() + '\n\n' + entryContent.trim();
        }

        // 收集事件ID和名称
        if (entry.extra?.event_ids && Array.isArray(entry.extra.event_ids)) {
          for (const eventId of entry.extra.event_ids) {
            if (!allEventIds.includes(eventId)) {
              allEventIds.push(eventId);
            }
          }
        } else if (entry.extra?.event_id && !allEventIds.includes(entry.extra.event_id)) {
          allEventIds.push(entry.extra.event_id);
        }

        if (entry.extra?.event_names && Array.isArray(entry.extra.event_names)) {
          for (const eventName of entry.extra.event_names) {
            if (!allEventNames.includes(eventName)) {
              allEventNames.push(eventName);
            }
          }
        } else if (entry.extra?.event_name && !allEventNames.includes(entry.extra.event_name)) {
          allEventNames.push(entry.extra.event_name);
        }
      }

      // 如果有 summary，将其放在最前面
      if (mainSummary) {
        mergedContent = mainSummary + mergedContent.trim();
      }

      // 更新主条目
      const mergedEntry: WorldbookEntry = {
        ...mainEntry,
        content: mergedContent,
        extra: {
          ...mainEntry.extra,
          event_ids: allEventIds.length > 0 ? allEventIds : undefined,
          event_names: allEventNames.length > 0 ? allEventNames : undefined,
          event_id: allEventIds[0] || mainEntry.extra?.event_id,
          event_name: allEventNames[0] || mainEntry.extra?.event_name,
          updated_at: new Date().toISOString(),
        },
      };

      // 构建新的世界书数组：保留主条目，删除其他重复条目
      const newWorldbook = worldbook.filter(
        entry =>
          !(
            entry.extra?.entry_type === 'game_event_story' &&
            entry.name === '游戏事件记录' &&
            entry.uid !== mainEntry.uid
          ),
      );

      // 将合并后的主条目替换到正确的位置
      const mainEntryIndex = newWorldbook.findIndex(entry => entry.uid === mainEntry.uid);
      if (mainEntryIndex !== -1) {
        newWorldbook[mainEntryIndex] = mergedEntry;
      } else {
        // 如果找不到，直接添加
        newWorldbook.push(mergedEntry);
      }

      // 保存合并后的世界书
      await WorldbookHelper.replace(worldbookName, newWorldbook);

      console.log(
        `✅ [旧存档兼容] 成功合并 ${duplicateEntries.length} 条重复条目为 1 条，保留事件ID: ${allEventIds.join(', ')}`,
      );

      return true;
    } catch (error) {
      console.error('合并重复的游戏事件记录条目失败:', error);
      return false;
    }
  }
}
