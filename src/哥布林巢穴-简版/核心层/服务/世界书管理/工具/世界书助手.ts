import type { WorldbookEntry } from '../类型/世界书类型定义';

/**
 * 世界书助手类 - 提供通用的世界书操作方法
 */
export class WorldbookHelper {
  /**
   * 检查世界书是否存在
   */
  static async exists(worldbookName: string): Promise<boolean> {
    try {
      const worldbook = await window.TavernHelper.getWorldbook(worldbookName);
      return worldbook !== null && worldbook !== undefined;
    } catch (error) {
      console.error('检查世界书存在性失败:', error);
      return false;
    }
  }

  /**
   * 确保世界书存在，如果不存在则创建
   */
  static async ensureExists(worldbookName: string): Promise<void> {
    const exists = await this.exists(worldbookName);
    if (!exists) {
      console.log(`世界书 ${worldbookName} 不存在，正在创建...`);
      await window.TavernHelper.createWorldbook(worldbookName, []);
      console.log(`已创建世界书: ${worldbookName}`);
    }
  }

  /**
   * 获取世界书内容
   */
  static async get(worldbookName: string): Promise<WorldbookEntry[]> {
    return await window.TavernHelper.getWorldbook(worldbookName);
  }

  /**
   * 替换世界书内容
   */
  static async replace(worldbookName: string, worldbook: WorldbookEntry[]): Promise<void> {
    await window.TavernHelper.replaceWorldbook(worldbookName, worldbook);
  }

  /**
   * 绑定世界书到当前聊天
   */
  static async bindToCurrent(worldbookName: string): Promise<void> {
    await window.TavernHelper.rebindChatWorldbook('current', worldbookName);
  }

  /**
   * 查找指定类型的条目索引
   */
  static findEntryIndex(worldbook: WorldbookEntry[], predicate: (entry: WorldbookEntry) => boolean): number {
    return worldbook.findIndex(predicate);
  }

  /**
   * 查找指定类型的条目
   */
  static findEntry(
    worldbook: WorldbookEntry[],
    predicate: (entry: WorldbookEntry) => boolean,
  ): WorldbookEntry | undefined {
    return worldbook.find(predicate);
  }

  /**
   * 更新或创建条目
   */
  static async updateOrCreateEntry(
    worldbookName: string,
    predicate: (entry: WorldbookEntry) => boolean,
    updateFn: (entry: WorldbookEntry) => WorldbookEntry,
    createFn: () => WorldbookEntry,
  ): Promise<void> {
    await this.ensureExists(worldbookName);
    const worldbook = await this.get(worldbookName);
    const entryIndex = this.findEntryIndex(worldbook, predicate);

    if (entryIndex !== -1) {
      worldbook[entryIndex] = updateFn(worldbook[entryIndex]);
    } else {
      worldbook.push(createFn());
    }

    await this.replace(worldbookName, worldbook);
  }

  /**
   * 检查是否为player角色
   */
  static isPlayerCharacter(characterId: string, characterName: string, characterStatus?: string): boolean {
    return characterStatus === 'player' || characterId === 'player-1' || characterName === '哥布林之王';
  }

  /**
   * 生成基于 characterId 的固定 UID
   * 使用简单的哈希算法确保同一个 characterId 总是生成相同的 UID
   * 所有剧情记录管理器都应该使用这个统一的方法
   */
  static generateStoryHistoryUID(characterId: string): number {
    let hash = 0;
    const str = `story_history_${characterId}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // 确保返回正数，并且在合理范围内
    return Math.abs(hash) % 2147483647;
  }

  /**
   * 从内容中提取并去重summary标签（仅支持新格式<summary_N>）
   * @param content 要处理的内容
   * @returns 去重后的summary数组，按序号排序，每个序号只保留第一个出现的
   */
  static extractAndDeduplicateSummaries(
    content: string,
  ): Array<{ index: number; content: string; innerContent: string }> {
    const summaryIndexMap = new Map<number, { content: string; innerContent: string }>();
    const summaryMatches = content.matchAll(/<summary_(\d+)>([\s\S]*?)<\/summary_\1>/g);

    for (const match of summaryMatches) {
      const index = parseInt(match[1]);
      const innerContent = match[2].trim(); // 标签内的实际内容

      // 只保留非空的summary标签
      if (innerContent.length > 0) {
        // 如果该序号已存在，只保留第一次出现的（避免重复）
        if (!summaryIndexMap.has(index)) {
          summaryIndexMap.set(index, {
            content: match[0], // 完整的标签对
            innerContent,
          });
        } else {
          console.warn(`⚠️ 发现重复的summary_${index}标签，已去重（只保留第一个）`);
        }
      } else {
        console.warn(`⚠️ 发现空的summary_${index}标签，已过滤`);
      }
    }

    // 将去重后的summary按序号排序
    const result: Array<{ index: number; content: string; innerContent: string }> = [];
    for (const [index, summary] of summaryIndexMap.entries()) {
      result.push({
        index,
        content: summary.content,
        innerContent: summary.innerContent,
      });
    }
    // 按序号排序
    result.sort((a, b) => a.index - b.index);

    return result;
  }

  /**
   * 从内容中移除所有summary标签，保留其他内容
   * @param content 要处理的内容
   * @returns 移除summary标签后的内容
   */
  static removeAllSummaries(content: string): string {
    return content.replace(/<summary_\d+>[\s\S]*?<\/summary_\d+>\n*/g, '').trim();
  }

  /**
   * 组合summary标签数组为完整内容
   * @param summaries summary数组
   * @param separator 分隔符，默认为'\n\n'
   * @returns 组合后的字符串
   */
  static combineSummaries(
    summaries: Array<{ index: number; content: string; innerContent: string }>,
    separator: string = '\n\n',
  ): string {
    return summaries.map(s => s.content).join(separator);
  }

  /**
   * 创建人物剧情记录世界书条目
   * 统一的方法，供所有管理器使用，避免代码重复
   */
  static createCharacterStoryHistoryEntry(characterId: string, characterName: string, content: string): WorldbookEntry {
    return {
      uid: this.generateStoryHistoryUID(characterId),
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
        depth: 2,
        order: 300,
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
}
