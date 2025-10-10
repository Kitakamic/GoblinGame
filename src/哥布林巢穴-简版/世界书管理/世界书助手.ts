import type { WorldbookEntry } from './世界书类型定义';

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
}
