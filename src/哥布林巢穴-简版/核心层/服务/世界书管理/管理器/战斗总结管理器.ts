import { WorldbookHelper } from '../工具/世界书助手';
import { RecordBuilder } from '../工具/记录构建器';
import type { HistoryRecord } from '../类型/世界书类型定义';

/**
 * 战斗总结管理器 - 专门负责战斗总结记录的管理
 */
export class BattleSummaryManager {
  /**
   * 获取现有的战斗总结记录
   */
  static async getExistingBattleSummaryHistory(characterId: string, worldbookName: string): Promise<HistoryRecord[]> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const historyEntry = WorldbookHelper.findEntry(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
      );

      if (historyEntry) {
        return this.parseBattleSummaryHistory(historyEntry.content);
      }
      return [];
    } catch (error) {
      console.error('获取现有战斗总结记录失败:', error);
      return [];
    }
  }

  /**
   * 批量添加战斗总结记录（替换模式）
   * 替换现有的战斗总结内容，保留其他类型的记录
   */
  static async addMultipleBattleSummaryRecords(
    characterId: string,
    characterName: string,
    worldbookName: string,
    battleSummaryRecords: HistoryRecord[],
    characterStatus?: string,
  ): Promise<void> {
    try {
      // 检查是否为player角色
      if (WorldbookHelper.isPlayerCharacter(characterId, characterName, characterStatus)) {
        console.log(`跳过player角色 ${characterName} 的战斗总结记录`);
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
        // 如果存在旧条目，替换战斗总结部分（保留其他记录）
        newContent = this.replaceBattleSummaryRecords(existingEntry.content, battleSummaryRecords);
      } else {
        // 如果不存在旧条目，直接构建新内容（带XML标签）
        newContent = RecordBuilder.buildBattleSummarySection(battleSummaryRecords);
      }

      // 更新世界书
      await this.updateBattleSummaryEntry(characterId, characterName, worldbookName, newContent);

      console.log(`✅ 已替换 ${characterName} 的战斗总结记录`);
    } catch (error) {
      console.error('批量添加战斗总结记录失败:', error);
      throw error;
    }
  }

  /**
   * 替换现有内容中的战斗总结记录
   * 保留其他类型的记录（战前对话、调教记录）
   */
  private static replaceBattleSummaryRecords(existingContent: string, newRecords: HistoryRecord[]): string {
    // 查找战斗总结部分的开始和结束标签
    const startTagMatch = existingContent.match(/<battlesummary>/);
    const endTagMatch = existingContent.match(/<\/battlesummary>/);

    if (!startTagMatch || !endTagMatch) {
      // 如果没有找到战斗总结标签，插入新的战斗总结部分
      console.warn('未找到战斗总结标签，插入新的战斗总结记录');
      const newBattleSummarySection = RecordBuilder.buildBattleSummarySection(newRecords);

      // 查找合适的插入位置（在战前对话之后，调教记录之前）
      const dialogueEndMatch = existingContent.match(/<\/dialogue_history>\n\n/);
      if (dialogueEndMatch) {
        const insertPos = dialogueEndMatch.index! + dialogueEndMatch[0].length;
        return existingContent.substring(0, insertPos) + newBattleSummarySection + existingContent.substring(insertPos);
      }

      // 如果没有战前对话，查找调教记录的开始位置
      const trainingStartMatch = existingContent.match(/<training_history>/);
      if (trainingStartMatch) {
        const insertPos = trainingStartMatch.index!;
        return existingContent.substring(0, insertPos) + newBattleSummarySection + existingContent.substring(insertPos);
      }

      // 如果都没有，追加到末尾
      return existingContent + newBattleSummarySection;
    }

    // 构建新的战斗总结内容
    const newRecordsText = newRecords
      .map(record => {
        const time = record.gameTime || '未知时间';
        return `[${time}] ${record.content}`;
      })
      .join('\n');

    // 替换旧的战斗总结内容
    const startPos = startTagMatch.index! + startTagMatch[0].length;
    const endPos = endTagMatch.index!;

    const beforeBattleSummary = existingContent.substring(0, startPos);
    const afterBattleSummary = existingContent.substring(endPos);

    return beforeBattleSummary + '\n' + newRecordsText + '\n' + afterBattleSummary;
  }

  /**
   * 更新战斗总结世界书条目
   */
  private static async updateBattleSummaryEntry(
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
   * 解析战斗总结记录
   */
  private static parseBattleSummaryHistory(content: string): HistoryRecord[] {
    const battleSummaryHistory: HistoryRecord[] = [];
    const battleSummaryMatch = content.match(/<battlesummary>([\s\S]*?)<\/battlesummary>/);

    if (!battleSummaryMatch) {
      return battleSummaryHistory;
    }

    const battleSummaryContent = battleSummaryMatch[1];
    const lines = battleSummaryContent.split('\n').filter(line => line.trim());

    // 解析每一行战斗总结记录
    lines.forEach(line => {
      // 尝试匹配带时间戳的格式：[时间] 内容
      const timeMatch = line.match(/^\[(.+?)\]\s*(.+)$/);
      if (timeMatch) {
        const [, gameTime, summaryContent] = timeMatch;
        battleSummaryHistory.push({
          gameTime: gameTime.trim(),
          content: summaryContent.trim(),
          timestamp: Date.now(),
        });
      } else if (line.trim()) {
        // 如果没有时间戳，使用空字符串
        battleSummaryHistory.push({
          gameTime: '',
          content: line.trim(),
          timestamp: Date.now(),
        });
      }
    });

    return battleSummaryHistory;
  }

  /**
   * 删除战斗总结记录
   */
  static async deleteBattleSummaryHistory(characterId: string, worldbookName: string): Promise<void> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const historyEntryIndex = WorldbookHelper.findEntryIndex(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
      );

      if (historyEntryIndex !== -1) {
        worldbook.splice(historyEntryIndex, 1);
        await WorldbookHelper.replace(worldbookName, worldbook);
        console.log(`✅ 已删除角色 ${characterId} 的战斗总结记录`);
      }
    } catch (error) {
      console.error('删除战斗总结记录失败:', error);
      throw error;
    }
  }
}
