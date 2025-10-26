import { WorldbookHelper } from './世界书助手';
import type { HistoryRecord } from './世界书类型定义';
import { RecordBuilder } from './记录构建器';

/**
 * 调教记录管理器 - 专门负责调教记录的管理
 */
export class TrainingRecordManager {
  /**
   * 获取现有的调教记录
   */
  static async getExistingTrainingHistory(characterName: string, worldbookName: string): Promise<HistoryRecord[]> {
    console.log('🔍 [调教记录管理器] 开始获取调教记录', {
      characterName,
      worldbookName,
    });

    try {
      console.log('📚 正在获取世界书数据...');
      const worldbook = await WorldbookHelper.get(worldbookName);
      console.log(`📊 世界书包含 ${worldbook.length} 个条目`);

      console.log('🔎 正在查找剧情记录条目...');
      const historyEntry = WorldbookHelper.findEntry(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterName,
      );

      if (historyEntry) {
        console.log('✅ 找到剧情记录条目:', {
          name: historyEntry.name,
          contentLength: historyEntry.content?.length || 0,
          contentPreview: historyEntry.content?.substring(0, 200) || '',
        });

        console.log('🔄 正在解析调教记录...');
        const records = this.parseTrainingHistory(historyEntry.content);
        console.log(`✅ 解析完成，共 ${records.length} 条记录`);

        return records;
      } else {
        console.log('ℹ️ 未找到该角色的剧情记录条目');
        console.log('📋 世界书中的所有条目类型:');
        worldbook.slice(0, 10).forEach((entry, index) => {
          console.log(`  [${index}]`, {
            name: entry.name,
            entryType: entry.extra?.entry_type,
            characterId: entry.extra?.character_id,
          });
        });
        if (worldbook.length > 10) {
          console.log(`  ... 还有 ${worldbook.length - 10} 个条目`);
        }
      }

      return [];
    } catch (error) {
      console.error('❌ 获取现有调教记录失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return [];
    }
  }

  /**
   * 批量添加调教记录（增量追加模式）
   * 直接读取旧的世界书内容，追加新记录，避免重复解析
   */
  static async addMultipleTrainingRecords(
    characterId: string,
    characterName: string,
    worldbookName: string,
    trainingRecords: HistoryRecord[],
    characterStatus?: string,
  ): Promise<void> {
    try {
      // 检查是否为player角色
      if (WorldbookHelper.isPlayerCharacter(characterId, characterName, characterStatus)) {
        console.log(`跳过player角色 ${characterName} 的调教记录`);
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
        newContent = this.appendTrainingRecords(existingEntry.content, trainingRecords);
      } else {
        // 如果不存在旧条目，直接构建新内容（带XML标签）
        newContent = RecordBuilder.buildTrainingSection(trainingRecords);
      }

      // 更新世界书
      await this.updateTrainingEntry(characterId, characterName, worldbookName, newContent);

      console.log(`✅ 已增量添加 ${trainingRecords.length} 条调教记录到 ${characterName}`);
    } catch (error) {
      console.error('批量添加调教记录失败:', error);
      throw error;
    }
  }

  /**
   * 在现有内容基础上追加新的调教记录
   * 直接操作字符串，避免解析和重建
   * 保留其他类型的记录（战前对话、战斗总结）
   */
  private static appendTrainingRecords(existingContent: string, newRecords: HistoryRecord[]): string {
    // 查找 </training_history> 标签的位置
    const closingTagMatch = existingContent.match(/<\/training_history>/);

    if (!closingTagMatch) {
      // 如果没有找到结束标签，检查是否有其他记录
      console.warn('未找到调教记录标签，尝试构建新的调教记录');
      const newTrainingSection = RecordBuilder.buildTrainingSection(newRecords);

      // 调教记录通常在最后，直接追加到末尾
      if (existingContent.trim()) {
        return existingContent + newTrainingSection;
      }
      return newTrainingSection;
    }

    // 构建新记录的文本
    const newRecordsText = newRecords
      .map(record => {
        const time = record.gameTime || '未知时间';
        const sender = record.sender === 'user' ? '{{user}}' : record.sender;
        return `[${time}] ${sender}: ${record.content}`;
      })
      .join('\n');

    // 在 </training_history> 之前插入新记录
    const insertPosition = closingTagMatch.index!;
    const beforeClosing = existingContent.substring(0, insertPosition);
    const afterClosing = existingContent.substring(insertPosition);

    // 确保在插入前有换行符
    const needsNewline = !beforeClosing.endsWith('\n');
    return beforeClosing + (needsNewline ? '\n' : '') + newRecordsText + '\n' + afterClosing;
  }

  /**
   * 更新调教记录世界书条目
   */
  private static async updateTrainingEntry(
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

    // 如果现有条目有summary（支持多种格式），保留它
    let finalContent = content;
    if (historyEntryIndex !== -1) {
      const existingEntry = worldbook[historyEntryIndex];
      // 提取所有summary标签（支持<summary>和<summary_N>格式）
      const allSummaries: string[] = [];
      const summaryMatches = existingEntry.content?.matchAll(/<summary(?:_\d+)?>([\s\S]*?)<\/summary(?:_\d+)?>/g);
      if (summaryMatches) {
        for (const match of summaryMatches) {
          allSummaries.push(match[0]);
        }
      }

      if (allSummaries.length > 0) {
        const summariesContent = allSummaries.join('\n\n');
        finalContent = summariesContent + '\n\n' + content;
      }
    }

    const historyEntry = this.createCharacterStoryHistoryEntry(characterId, characterName, finalContent);

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
   * 创建人物剧情记录世界书条目
   */
  private static createCharacterStoryHistoryEntry(characterId: string, characterName: string, content: string): any {
    return {
      uid: WorldbookHelper.generateStoryHistoryUID(characterId),
      name: `${characterName}-剧情记录`,
      enabled: true,
      strategy: {
        type: 'selective',
        keys: [characterName, '战斗总结', '调教记录', '战前对话', '剧情记录'],
        keys_secondary: {
          logic: 'and_any',
          keys: [],
        },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'at_depth',
        role: 'system',
        depth: 4,
        order: 160,
      },
      content: content,
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
        entry_type: 'character_story_history',
        character_id: characterId,
        character_name: characterName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * 解析调教记录
   */
  private static parseTrainingHistory(content: string): HistoryRecord[] {
    console.log('🔍 [解析调教记录] 开始解析');
    console.log('📄 内容长度:', content?.length || 0);

    const trainingHistory: HistoryRecord[] = [];

    // 移除所有 summary 标签及其内容（支持<summary>和<summary_N>格式）
    let parsedContent = content;
    if (content.includes('<summary>') || /<summary_\d+>/.test(content)) {
      parsedContent = content.replace(/<summary(?:_\d+)?>[\s\S]*?<\/summary(?:_\d+)?>\n*/g, '');
    }

    // 如果移除summary后内容为空，说明已经被总结压缩了
    if (!parsedContent.trim()) {
      console.log('⚠️ 条目已被总结压缩，返回空记录（后续追加会重建基础结构）');
      return trainingHistory;
    }

    const trainingMatch = parsedContent.match(/<training_history>([\s\S]*?)<\/training_history>/);

    if (!trainingMatch) {
      console.log('⚠️ 未找到 <training_history> 标签');
      console.log('📄 内容预览:', content?.substring(0, 300) || '(空内容)');
      return trainingHistory;
    }

    console.log('✅ 找到 <training_history> 标签');
    const trainingContent = trainingMatch[1];
    console.log('📊 标签内容长度:', trainingContent.length);
    console.log('📄 完整标签内容:');
    console.log('---开始---');
    console.log(trainingContent);
    console.log('---结束---');

    const lines = trainingContent.split('\n');
    console.log(`📋 分割成 ${lines.length} 行`);

    let currentRecord: Partial<HistoryRecord> | null = null;
    let recordCount = 0;

    lines.forEach((line, lineIndex) => {
      // 匹配格式：[任意时间格式] 发送者: 内容
      const recordMatch = line.match(/^\[(.+?)\] (.+?): (.*)$/);
      if (recordMatch) {
        // 如果有当前记录，先保存它
        if (currentRecord) {
          const record = currentRecord as HistoryRecord;
          // 对于AI回复，清理空行和格式
          if (record.sender && record.sender !== 'user' && record.content) {
            record.content = this.cleanAIContent(record.content);
            console.log(`  🧹 已清理AI回复的空行和格式`);
          }
          trainingHistory.push(record);
          console.log(`  ✅ 完成第 ${recordCount} 条记录`);
        }

        recordCount++;
        const [, timeStr, sender, content] = recordMatch;
        currentRecord = {
          gameTime: timeStr, // 直接使用存储的时间字符串（如：帝国历1074年1月8日）
          sender: sender === '{{user}}' ? 'user' : sender,
          content: content.trim(),
          timestamp: Date.now(),
        };

        console.log(`  📝 [行${lineIndex}] 开始新记录 #${recordCount}:`, {
          gameTime: timeStr,
          sender: currentRecord.sender,
          contentPreview: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
          hasContent: content.trim().length > 0,
        });
      } else if (currentRecord && line.trim()) {
        // 追加内容到当前记录
        if (!currentRecord.content || currentRecord.content.trim() === '') {
          currentRecord.content = line.trim();
        } else {
          currentRecord.content += '\n' + line.trim();
        }
        console.log(
          `    ➕ [行${lineIndex}] 追加内容到记录 #${recordCount}: "${line.trim().substring(0, 30)}${line.trim().length > 30 ? '...' : ''}"`,
        );
      } else if (line.trim() === '') {
        console.log(`    ⚪ [行${lineIndex}] 空行`);
      } else {
        console.log(`    ⚠️ [行${lineIndex}] 未匹配的行: "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
      }
    });

    if (currentRecord) {
      const record = currentRecord as HistoryRecord;
      // 对于AI回复，清理空行和格式
      if (record.sender && record.sender !== 'user' && record.content) {
        record.content = this.cleanAIContent(record.content);
        console.log(`  🧹 已清理AI回复的空行和格式`);
      }
      trainingHistory.push(record);
      console.log(`  ✅ 完成第 ${recordCount} 条记录（最后一条）`);
    }

    console.log(`✅ [解析完成] 共解析出 ${trainingHistory.length} 条记录`);
    return trainingHistory;
  }

  /**
   * 清理AI回复内容，删除多余空行并整理格式
   */
  private static cleanAIContent(content: string): string {
    return content
      .split('\n')
      .map(line => line.trim()) // 去除每行首尾空白
      .filter(line => line.length > 0) // 删除空行
      .join('\n\n'); // 用双换行连接，形成段落分隔
  }

  /**
   * 删除人物剧情记录条目（包含所有调教、对话等历史记录）
   */
  static async deleteTrainingHistory(characterId: string, worldbookName: string): Promise<void> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const historyEntryIndex = WorldbookHelper.findEntryIndex(
        worldbook,
        entry => entry.extra?.entry_type === 'character_story_history' && entry.extra?.character_id === characterId,
      );

      if (historyEntryIndex !== -1) {
        worldbook.splice(historyEntryIndex, 1);
        await WorldbookHelper.replace(worldbookName, worldbook);
        console.log(`✅ 已删除角色 ${characterId} 的剧情记录条目`);
      }
    } catch (error) {
      console.error('删除剧情记录条目失败:', error);
      throw error;
    }
  }
}
