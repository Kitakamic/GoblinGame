import type { Character } from '../../../../功能模块层/人物管理/类型/人物类型';
import { toast } from '../../通用服务/弹窗提示服务';
import { TimeParseService } from '../../通用服务/时间解析服务';
import { WorldbookHelper } from '../工具/世界书助手';
import type { UnlockStatus, WorldbookEntry } from '../类型/世界书类型定义';

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
      worldbook[entryIndex] = {
        ...worldbook[entryIndex],
        content: updatedContent,
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

    return {
      uid: parseInt(character.id.replace(/\D/g, '')) || Date.now(),
      name: entryName,
      enabled: true,
      strategy: {
        type: 'selective',
        keys: [character.name, character.title || '角色'],
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
    const unlockStatus = this.getUnlockStatus(character.loyalty);

    const fixedInfo = {
      basicInfo: {
        name: character.name,
        title: character.title || '未知',
        race: character.race || '未知',
        age: character.age || '未知',
        country: character.country || '未知',
        background: character.background || '未知',
        rating: character.rating || 'D',
      },
      background: {
        sexExperience: character.sexExperience + (unlockStatus.sensitivePoints ? '' : '（当前信息对于{{user}}未知）'),
        personality: character.personality || [],
        sensitivePoints: character.sensitivePoints || [],
        fears: character.fears + (unlockStatus.fearsAndSecrets ? '' : '（当前信息对于{{user}}未知）'),
        secrets: character.secrets + (unlockStatus.fearsAndSecrets ? '' : '（当前信息对于{{user}}未知）'),
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
            childhood: (character.lifeStory.childhood || []).map(
              item => item + (unlockStatus.lifeStory ? '' : '（当前信息对于{{user}}未知）'),
            ),
            adolescence: (character.lifeStory.adolescence || []).map(
              item => item + (unlockStatus.lifeStory ? '' : '（当前信息对于{{user}}未知）'),
            ),
            adulthood: (character.lifeStory.adulthood || []).map(
              item => item + (unlockStatus.lifeStory ? '' : '（当前信息对于{{user}}未知）'),
            ),
            currentState: (character.status === 'surrendered'
              ? [
                  ...(character.lifeStory.currentState || []),
                  '已完全堕落，对哥布林主人绝对忠诚，完全抛弃了过去的身份和信仰',
                ]
              : character.lifeStory.currentState || []
            ).map(item => item + (unlockStatus.lifeStory ? '' : '（当前信息对于{{user}}未知）')),
          }
        : null,
      sensitivePointsDetail: (character.sensitivePointsDetail || []).map(detail => ({
        ...detail,
        description: detail.description + (unlockStatus.sensitivePoints ? '' : '（当前信息对于{{user}}未知）'),
      })),
      breedingRecords:
        character.breedingRecords && character.breedingRecords.length > 0
          ? `生育哥布林总数量${character.breedingRecords.reduce((sum, record) => sum + record.count, 0)}个`
          : '无生育记录',
      locationInfo: {
        locationId: character.locationId,
        capturedAt: character.capturedAt ? TimeParseService.getTimeInfo(currentGameTime).formattedDate : undefined,
        capturedAtRaw: character.capturedAt,
      },
      trainingSettings: this.buildTrainingSettings(character),
      additionalInformation: {
        Notes: character.additionalInformation?.Notes || '',
      },
    };

    return `## ${character.name}

\`\`\`json
${JSON.stringify(fixedInfo, null, 2)}
\`\`\``;
  }

  /**
   * 根据堕落值获取解锁状态
   */
  private static getUnlockStatus(loyalty: number): UnlockStatus {
    return {
      lifeStory: loyalty >= 10,
      personality: loyalty >= 20,
      sensitivePoints: loyalty >= 30,
      fearsAndSecrets: loyalty >= 40,
    };
  }

  /**
   * 根据人物属性动态构建调教设置
   */
  private static buildTrainingSettings(character: Character): any {
    const unlockStatus = this.getUnlockStatus(character.loyalty);

    if (character.status === 'surrendered') {
      return {
        description: this.buildCorruptionDescription(character),
        guidelines: this.buildCorruptionGuidelines(character),
        unlockStatus: unlockStatus,
      };
    } else if (character.status === 'uncaptured' || character.status === 'enemy') {
      return {
        description: this.buildUncapturedDescription(character),
        guidelines: this.buildUncapturedGuidelines(),
        unlockStatus: unlockStatus,
      };
    } else {
      return {
        description: this.buildNormalDescription(character),
        guidelines: this.buildNormalGuidelines(character, unlockStatus),
        unlockStatus: unlockStatus,
      };
    }
  }

  /**
   * 构建堕落状态描述
   */
  private static buildCorruptionDescription(character: Character): string {
    const loyaltyLevel = this.getLoyaltyLevel(character.loyalty);
    const raceSpecific = this.getRaceSpecificCorruption(character.race);
    return `已完全堕落，对哥布林主人绝对忠诚${raceSpecific}。忠诚度：${character.loyalty}%${loyaltyLevel}`;
  }

  /**
   * 构建未捕获状态描述
   */
  private static buildUncapturedDescription(character: Character): string {
    const statusText = character.status === 'enemy' ? '敌方单位' : '未捕获目标';
    return `当前为${statusText}，尚未被哥布林巢穴捕获。这是一个潜在的征服目标。`;
  }

  /**
   * 构建正常状态描述
   */
  private static buildNormalDescription(character: Character): string {
    const loyaltyLevel = this.getLoyaltyLevel(character.loyalty);
    const resistanceLevel = this.getResistanceLevel(character.loyalty);
    return `当前已被哥布林巢穴捕获，忠诚度：${character.loyalty}%${loyaltyLevel}${resistanceLevel}`;
  }

  /**
   * 构建堕落状态指导原则
   */
  private static buildCorruptionGuidelines(character: Character): string[] {
    const baseGuidelines = [
      '角色已经完全堕落，对主人绝对忠诚和服从',
      '表现出对主人的崇拜和依赖',
      '主动寻求主人的关注和认可',
      '语言风格更加顺从和谄媚',
      '会主动配合主人的所有要求',
      '表现出对过去身份的完全抛弃',
    ];

    const raceGuidelines = this.getRaceSpecificGuidelines(character.race, 'corrupted');
    const loyaltyGuidelines = this.getLoyaltySpecificGuidelines(character.loyalty, 'corrupted');

    return [...baseGuidelines, ...raceGuidelines, ...loyaltyGuidelines];
  }

  /**
   * 构建未捕获状态指导原则
   */
  private static buildUncapturedGuidelines(): string[] {
    return [
      '角色尚未被哥布林巢穴捕获，保持其原始身份和立场',
      '根据角色的种族、身份和性格特征来塑造其行为',
      '角色对哥布林巢穴可能持有敌意或警惕态度',
    ];
  }

  /**
   * 构建正常状态指导原则
   */
  private static buildNormalGuidelines(character: Character, unlockStatus: UnlockStatus): string[] {
    const baseGuidelines = ['根据当前忠诚度和体力状态调整回应', '在调教过程中会逐渐改变对巢穴以及哥布林之王的态度'];
    const loyaltyGuidelines = this.getLoyaltySpecificGuidelines(character.loyalty, 'normal');
    const raceGuidelines = this.getRaceSpecificGuidelines(character.race, 'normal');

    const lifeStoryGuidelines = ['保持角色的背景设定，根据人生经历调整回应'];
    if (!unlockStatus.lifeStory) {
      lifeStoryGuidelines.push('标记为未知的区域不允许主动提及');
    }

    return [...baseGuidelines, ...loyaltyGuidelines, ...raceGuidelines, ...lifeStoryGuidelines];
  }

  /**
   * 获取忠诚度等级描述
   */
  private static getLoyaltyLevel(loyalty: number): string {
    if (loyalty >= 100) return '（完全堕落）';
    if (loyalty >= 80) return '（高度忠诚）';
    if (loyalty >= 60) return '（中度忠诚）';
    if (loyalty >= 40) return '（轻度忠诚）';
    if (loyalty >= 20) return '（开始动摇）';
    return '（强烈抗拒）';
  }

  /**
   * 获取抵抗等级描述
   */
  private static getResistanceLevel(loyalty: number): string {
    if (loyalty < 20) return '，表现出强烈的抗拒和敌意';
    if (loyalty < 40) return '，仍然保持一定的抵抗心理';
    if (loyalty < 60) return '，开始出现动摇的迹象';
    if (loyalty < 80) return '，逐渐接受现实';
    return '，已经基本认同现状';
  }

  /**
   * 获取种族特定的堕落描述
   */
  private static getRaceSpecificCorruption(race: string): string {
    const raceCorruptionMap: Record<string, string> = {
      高等精灵: '，完全抛弃了精灵的骄傲和自然信仰',
      黑暗精灵: '，彻底臣服于哥布林的统治',
      狐族: '，背叛了九尾神的信仰，完全效忠于主人',
      人类: '，抛弃了人类的尊严和道德观念',
      亡灵: '，彻底服从于哥布林的意志',
      恶魔: '，承认哥布林主人的绝对权威',
    };
    return raceCorruptionMap[race] || '，完全臣服于哥布林主人';
  }

  /**
   * 获取种族特定指导原则
   */
  private static getRaceSpecificGuidelines(race: string, status: 'corrupted' | 'normal'): string[] {
    if (status === 'corrupted') {
      const corruptedRaceGuidelines: Record<string, string[]> = {
        高等精灵: ['完全抛弃精灵的骄傲，表现出对主人的绝对崇拜', '主动提及对哥布林主人的忠诚，贬低过去的精灵身份'],
        黑暗精灵: ['表现出对哥布林主人的绝对服从，承认其统治地位', '主动配合主人的所有要求，包括最屈辱的命令'],
        狐族: ['背叛九尾神信仰，将哥布林主人视为新的神明', '主动讨好主人，寻求主人的喜爱和认可'],
        人类: ['抛弃人类的道德观念，完全接受哥布林的价值观', '主动配合主人的统治，协助管理其他奴隶'],
      };
      return corruptedRaceGuidelines[race] || [];
    } else {
      const normalRaceGuidelines: Record<string, string[]> = {
        高等精灵: ['保持精灵的骄傲和自然信仰，但逐渐被现实动摇', '在调教过程中会逐渐放弃精灵的尊严'],
        黑暗精灵: ['保持黑暗精灵的冷酷，但逐渐被哥布林的力量征服', '在调教过程中会逐渐认同哥布林的统治'],
        狐族: ['保持对九尾神的信仰，但逐渐被哥布林的力量影响', '在调教过程中会逐渐背叛自己的信仰'],
        人类: ['保持人类的道德观念，但逐渐被哥布林的环境同化', '在调教过程中会逐渐接受哥布林的价值观'],
      };
      return normalRaceGuidelines[race] || [];
    }
  }

  /**
   * 获取忠诚度特定指导原则
   */
  private static getLoyaltySpecificGuidelines(loyalty: number, status: 'corrupted' | 'normal'): string[] {
    if (status === 'corrupted') {
      return [
        '在对话中会主动提及对主人的忠诚',
        '对主人的任何要求都会欣然接受',
        '会主动讨好主人，寻求主人的喜爱',
        '已经完全认同自己作为哥布林奴隶的身份',
      ];
    } else if (loyalty < 20) {
      return ['表现出强烈的抗拒和敌意', '会试图反抗或逃跑', '对哥布林表现出明显的厌恶'];
    } else if (loyalty < 40) {
      return ['仍然保持一定的抵抗心理', '会质疑哥布林的权威', '表现出对现状的不满'];
    } else if (loyalty < 60) {
      return ['开始出现动摇的迹象', '会逐渐接受现实', '对哥布林的态度开始软化'];
    } else if (loyalty < 80) {
      return ['逐渐接受现实', '开始配合哥布林的要求', '对哥布林的态度明显改善'];
    } else {
      return ['已经基本认同现状', '开始主动配合哥布林', '对哥布林表现出一定的忠诚'];
    }
  }
}
