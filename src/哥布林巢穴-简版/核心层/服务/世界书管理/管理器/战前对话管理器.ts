import { WorldbookHelper } from '../工具/世界书助手';
import { RecordBuilder } from '../工具/记录构建器';
import type { HistoryRecord } from '../类型/世界书类型定义';

/**
 * 战前对话管理器 - 专门负责战前对话记录的管理
 */
export class PreBattleDialogueManager {
  /**
   * 获取现有的战前对话记录
   */
  static async getExistingDialogueHistory(characterId: string, worldbookName: string): Promise<HistoryRecord[]> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const historyEntry = WorldbookHelper.findEntry(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
      );

      if (historyEntry) {
        return this.parseDialogueHistory(historyEntry.content);
      }
      return [];
    } catch (error) {
      console.error('获取现有战前对话记录失败:', error);
      return [];
    }
  }

  /**
   * 批量添加战前对话记录（增量追加模式）
   * 直接读取旧的世界书内容，追加新记录，避免重复解析
   */
  static async addMultipleDialogueRecords(
    characterId: string,
    characterName: string,
    worldbookName: string,
    dialogueRecords: HistoryRecord[],
    characterStatus?: string,
  ): Promise<void> {
    try {
      // 检查是否为player角色
      if (WorldbookHelper.isPlayerCharacter(characterId, characterName, characterStatus)) {
        console.log(`跳过player角色 ${characterName} 的战前对话记录`);
        return;
      }

      // 直接获取旧的世界书条目
      const worldbook = await WorldbookHelper.get(worldbookName);
      const existingEntry = WorldbookHelper.findEntry(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
      );

      let newContent: string;

      if (existingEntry && existingEntry.content) {
        // 如果存在旧条目，直接在旧内容基础上追加新记录
        newContent = this.appendDialogueRecords(existingEntry.content, dialogueRecords);
      } else {
        // 如果不存在旧条目，直接构建新内容（带XML标签）
        newContent = RecordBuilder.buildDialogueSection(dialogueRecords);
      }

      // 更新世界书
      await this.updateDialogueEntry(characterId, characterName, worldbookName, newContent);

      console.log(`✅ 已增量添加 ${dialogueRecords.length} 条战前对话记录到 ${characterName}`);
    } catch (error) {
      console.error('批量添加战前对话记录失败:', error);
      throw error;
    }
  }

  /**
   * 在现有内容基础上追加新的对话记录
   * 直接操作字符串，避免解析和重建
   * 保留其他类型的记录（战斗总结、调教记录）
   */
  private static appendDialogueRecords(existingContent: string, newRecords: HistoryRecord[]): string {
    // 查找 </dialogue_history> 标签的位置
    const closingTagMatch = existingContent.match(/<\/dialogue_history>/);

    if (!closingTagMatch) {
      // 如果没有找到结束标签，检查是否有其他记录
      console.warn('未找到战前对话标签，尝试构建新的对话记录');
      const newDialogueSection = RecordBuilder.buildDialogueSection(newRecords);

      // 如果有其他记录，将新的对话记录插入到最前面
      if (existingContent.trim()) {
        return newDialogueSection + existingContent;
      }
      return newDialogueSection;
    }

    // 构建新记录的文本
    const newRecordsText = newRecords
      .map(record => {
        const time = record.gameTime || '未知时间';
        const sender = record.sender === 'user' ? '{{user}}' : record.sender;
        return `[${time}] ${sender}: ${record.content}`;
      })
      .join('\n');

    // 在 </dialogue_history> 之前插入新记录
    const insertPosition = closingTagMatch.index!;
    const beforeClosing = existingContent.substring(0, insertPosition);
    const afterClosing = existingContent.substring(insertPosition);

    // 确保在插入前有换行符
    const needsNewline = !beforeClosing.endsWith('\n');
    return beforeClosing + (needsNewline ? '\n' : '') + newRecordsText + '\n' + afterClosing;
  }

  /**
   * 更新战前对话世界书条目
   */
  private static async updateDialogueEntry(
    characterId: string,
    characterName: string,
    worldbookName: string,
    content: string,
  ): Promise<void> {
    await WorldbookHelper.ensureExists(worldbookName);
    const worldbook = await WorldbookHelper.get(worldbookName);
    const historyEntryIndex = WorldbookHelper.findEntryIndex(
      worldbook,
      entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
    );

    const historyEntry = WorldbookHelper.createCharacterStoryHistoryEntry(characterId, characterName, content);

    if (historyEntryIndex !== -1) {
      // 更新现有条目（UID 已经是固定的，直接替换）
      worldbook[historyEntryIndex] = historyEntry;
    } else {
      // 创建新条目
      worldbook.push(historyEntry);
    }

    await WorldbookHelper.replace(worldbookName, worldbook);
  }

  /**
   * 解析战前对话记录
   */
  private static parseDialogueHistory(content: string): HistoryRecord[] {
    const dialogueHistory: HistoryRecord[] = [];
    const dialogueMatch = content.match(/<dialogue_history>([\s\S]*?)<\/dialogue_history>/);

    if (!dialogueMatch) {
      return dialogueHistory;
    }

    const dialogueContent = dialogueMatch[1];
    const lines = dialogueContent.split('\n');
    let currentRecord: Partial<HistoryRecord> | null = null;

    lines.forEach(line => {
      const recordMatch = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (.+?): (.+)$/);
      if (recordMatch) {
        if (currentRecord) {
          dialogueHistory.push(currentRecord as HistoryRecord);
        }

        const [, timeStr, sender, content] = recordMatch;
        currentRecord = {
          gameTime: timeStr, // 直接使用存储的时间字符串
          sender: sender === '{{user}}' ? 'user' : sender,
          content: content.trim(),
          timestamp: Date.now(),
        };
      } else if (currentRecord && line.trim()) {
        currentRecord.content += '\n' + line.trim();
      }
    });

    if (currentRecord) {
      dialogueHistory.push(currentRecord as HistoryRecord);
    }

    return dialogueHistory;
  }

  /**
   * 删除战前对话记录
   */
  static async deleteDialogueHistory(characterId: string, worldbookName: string): Promise<void> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const historyEntryIndex = WorldbookHelper.findEntryIndex(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
      );

      if (historyEntryIndex !== -1) {
        worldbook.splice(historyEntryIndex, 1);
        await WorldbookHelper.replace(worldbookName, worldbook);
        console.log(`✅ 已删除角色 ${characterId} 的战前对话记录`);
      }
    } catch (error) {
      console.error('删除战前对话记录失败:', error);
      throw error;
    }
  }
}
