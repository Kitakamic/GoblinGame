import type { Character } from '../../../../功能模块层/人物管理/类型/人物类型';
import { toast } from '../../通用服务/弹窗提示服务';
import { TimeParseService } from '../../通用服务/时间解析服务';
import { WorldbookHelper } from '../工具/世界书助手';
import { CharacterGuidelineGenerator } from '../工具/人物指导风格生成器';
import type { WorldbookEntry } from '../类型/世界书类型定义';

/**
 * 人物世界书管理器 - 负责人物相关的世界书操作
 */
export class CharacterWorldbookManager {
  /**
   * 为人物创建或更新世界书条目（核心逻辑）
   * @param character 人物对象
   * @param worldbookName 世界书名称
   * @param bindToChat 是否绑定到当前聊天
   * @returns 世界书名称
   */
  private static async upsertCharacterEntry(
    character: Character,
    worldbookName: string,
    bindToChat: boolean = false,
  ): Promise<string> {
    // 检查是否为player角色
    if (WorldbookHelper.isPlayerCharacter(character.id, character.name, character.status)) {
      console.log(`跳过player角色 ${character.name} 的世界书操作`);
      return worldbookName;
    }

    await WorldbookHelper.ensureExists(worldbookName);
    const worldbook = await WorldbookHelper.get(worldbookName);

    // 检查条目是否已存在
    const entryIndex = WorldbookHelper.findEntryIndex(worldbook, entry => entry.extra?.character_id === character.id);

    if (entryIndex !== -1) {
      // 条目已存在，更新
      console.log(`人物 ${character.name} 的世界书条目已存在，执行更新`);
      const updatedContent = this.buildCharacterContent(character);

      // 根据角色设置更新 strategy
      const strategyType = character.isGlobalCharacter ? 'constant' : 'selective';
      const secondaryKeys = character.worldbookSecondaryKeys || [];

      worldbook[entryIndex] = {
        ...worldbook[entryIndex],
        content: updatedContent,
        strategy: {
          ...worldbook[entryIndex].strategy,
          type: strategyType,
          keys: [character.name, character.title || ''],
          keys_secondary: {
            ...worldbook[entryIndex].strategy.keys_secondary,
            keys: secondaryKeys,
          },
        },
        extra: {
          ...worldbook[entryIndex].extra,
          updated_at: new Date().toISOString(),
        },
      };
      await WorldbookHelper.replace(worldbookName, worldbook);
      if (bindToChat) {
        await WorldbookHelper.bindToCurrent(worldbookName);
      }
      console.log(`已更新人物 ${character.name} 的世界书条目`);
    } else {
      // 条目不存在，创建新条目
      const worldbookEntry = this.createCharacterEntry(character);
      worldbook.push(worldbookEntry);
      await WorldbookHelper.replace(worldbookName, worldbook);
      if (bindToChat) {
        await WorldbookHelper.bindToCurrent(worldbookName);
      }
      console.log(`已将人物 ${character.name} 添加到世界书: ${worldbookName}`);
    }

    return worldbookName;
  }

  /**
   * 为人物创建世界书并绑定到当前聊天
   * 如果条目已存在，则更新而不是创建新条目
   */
  static async createCharacterWorldbook(character: Character, worldbookName: string): Promise<string> {
    try {
      return await this.upsertCharacterEntry(character, worldbookName, true);
    } catch (error) {
      toast.error(`创建人物世界书失败: ${error}`);
      throw error;
    }
  }

  /**
   * 获取人物世界书条目
   */
  static async getCharacterEntry(worldbookName: string, characterId: string): Promise<WorldbookEntry | null> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      return WorldbookHelper.findEntry(worldbook, entry => entry.extra?.character_id === characterId) || null;
    } catch (error) {
      toast.error(`获取人物世界书条目失败: ${error}`);
      throw error;
    }
  }

  /**
   * 更新人物世界书条目
   * 如果条目不存在，则创建新条目
   * 不会绑定到当前聊天（用于静默更新）
   */
  static async updateCharacterEntry(worldbookName: string, character: Character): Promise<void> {
    try {
      await this.upsertCharacterEntry(character, worldbookName, false);
    } catch (error) {
      toast.error(`更新人物世界书条目失败: ${error}`);
      throw error;
    }
  }

  /**
   * 删除人物世界书条目
   */
  static async deleteCharacterEntry(worldbookName: string, characterId: string): Promise<void> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const filteredWorldbook = worldbook.filter(entry => entry.extra?.character_id !== characterId);
      await WorldbookHelper.replace(worldbookName, filteredWorldbook);
      toast.success('已删除人物世界书条目');
    } catch (error) {
      toast.error(`删除人物世界书条目失败: ${error}`);
      throw error;
    }
  }

  /**
   * 清空所有人物档案、剧情记录、据点征服记录和游戏事件记录世界书条目
   */
  static async clearCharacterAndStoryEntries(worldbookName: string): Promise<void> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      const filteredWorldbook = worldbook.filter(
        entry =>
          !entry.extra?.character_id &&
          entry.extra?.entry_type !== 'character_story_history' &&
          entry.extra?.entry_type !== 'conquest_records' &&
          entry.extra?.entry_type !== 'game_event_story',
      );
      await WorldbookHelper.replace(worldbookName, filteredWorldbook);
      console.log('已清空所有人物档案、剧情记录、据点征服记录和游戏事件记录世界书条目');
    } catch (error) {
      console.error('清空人物档案、剧情记录、据点征服记录和游戏事件记录世界书条目失败:', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 创建人物世界书条目
   */
  private static createCharacterEntry(character: Character): WorldbookEntry {
    const content = this.buildCharacterContent(character);
    const entryName = `${character.title || '角色'}-${character.name}`;

    // 根据角色设置决定 strategy type
    const strategyType = character.isGlobalCharacter ? 'constant' : 'selective';

    // 获取额外关键词（用于 keys_secondary）
    const secondaryKeys = character.worldbookSecondaryKeys || [];

    return {
      uid: parseInt(character.id.replace(/\D/g, '')) || Date.now(),
      name: entryName,
      enabled: true,
      strategy: {
        type: strategyType,
        keys: [character.name, character.title || ''],
        keys_secondary: {
          logic: 'and_any',
          keys: secondaryKeys,
        },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'at_depth',
        role: 'system',
        depth: 4,
        order: 150,
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
        character_id: character.id,
        created_at: new Date().toISOString(),
        character_type: 'manual_training',
      },
    };
  }

  /**
   * 构建人物条目内容（JSON格式）
   */
  private static buildCharacterContent(character: Character, gameTime?: number): string {
    const currentGameTime = gameTime || 0;

    const fixedInfo = {
      basicInfo: {
        name: character.name,
        title: character.title || '未知',
        race: character.race || '未知',
        age: character.age || '未知',
        country: character.country || '未知',
        background: character.background || '未知',
        rating: character.rating || '未知',
      },
      background: {
        sexExperience: character.sexExperience,
        personality: character.personality || [],
        sensitivePoints: character.sensitivePoints || [],
        fears: character.fears,
        secrets: character.secrets,
      },
      appearance: character.appearance
        ? {
            height: character.appearance.height,
            weight: character.appearance.weight,
            measurements: character.appearance.measurements,
            cupSize: character.appearance.cupSize,
            description: character.appearance.description,
            clothing: character.appearance.clothing,
          }
        : null,
      lifeStory: character.lifeStory
        ? {
            childhood: character.lifeStory.childhood || [],
            adolescence: character.lifeStory.adolescence || [],
            adulthood: character.lifeStory.adulthood || [],
            currentState:
              character.status === 'surrendered'
                ? [...(character.lifeStory.currentState || []), '已完全堕落']
                : character.lifeStory.currentState || [],
          }
        : null,
      sensitivePointsDetail: character.sensitivePointsDetail || [],
      breedingRecords:
        character.breedingRecords && character.breedingRecords.length > 0
          ? `生育哥布林总数量${character.breedingRecords.reduce((sum, record) => sum + record.count, 0)}个`
          : '无生育记录',
      locationInfo: {
        capturedAt: character.capturedAt ? TimeParseService.getTimeInfo(currentGameTime).formattedDate : undefined,
      },
      trainingSettings: CharacterGuidelineGenerator.buildTrainingSettings(character),
      additionalInformation: {
        Notes: character.additionalInformation?.Notes || '',
      },
    };

    return `# ${character.name}-角色设定

\`\`\`json
${JSON.stringify(fixedInfo, null, 2)}
\`\`\``;
  }
}
