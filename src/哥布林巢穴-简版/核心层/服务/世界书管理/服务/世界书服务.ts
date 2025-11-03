import type { Character } from '../../../../功能模块层/人物管理/类型/人物类型';
import type { Continent } from '../../../../功能模块层/探索/类型/大陆探索类型';
import { ChainOfThoughtManager, ChainOfThoughtMode } from '../工具/思维链管理器';
import { CharacterWorldbookManager } from '../管理器/人物信息管理器';
import { GameEventLorebookManager } from '../管理器/冒头事件管理器';
import { PreBattleDialogueManager } from '../管理器/战前对话管理器';
import { BattleSummaryManager } from '../管理器/战斗总结管理器';
import { ConquestRecordManager } from '../管理器/据点征服管理器';
import { TrainingRecordManager } from '../管理器/调教记录管理器';
import { ResourcesWorldbookManager } from '../管理器/资源同步管理器';
import type { HistoryRecord } from '../类型/世界书类型定义';

// 导出思维链模式枚举供外部使用
export { ChainOfThoughtMode } from '../工具/思维链管理器';

/**
 * 世界书服务类 - 门面模式统一入口
 *
 * 这是一个门面类,提供简化的API来协调各个专门的管理器:
 * - CharacterWorldbookManager: 人物世界书管理
 * - PreBattleDialogueManager: 战前对话记录管理
 * - BattleSummaryManager: 战斗总结记录管理
 * - TrainingRecordManager: 调教记录管理
 * - ResourcesWorldbookManager: 资源世界书管理
 * - ConquestRecordManager: 据点征服记录管理
 * - GameEventLorebookManager: 游戏冒头事件记录管理
 * - ChainOfThoughtManager: 思维链管理
 */
export class WorldbookService {
  private static currentWorldbookName: string = '哥布林巢穴-人物档案';

  /**
   * 设置世界书名称（由外部调用）
   */
  static setWorldbookName(worldbookName: string): void {
    this.currentWorldbookName = worldbookName;
  }

  /**
   * 获取当前世界书名称
   */
  private static getCurrentWorldbookName(): string {
    return this.currentWorldbookName;
  }

  // ==================== 人物世界书管理 ====================

  /**
   * 为人物创建世界书并绑定到当前聊天
   */
  static async createCharacterWorldbook(character: Character): Promise<string> {
    const worldbookName = this.getCurrentWorldbookName();
    return CharacterWorldbookManager.createCharacterWorldbook(character, worldbookName);
  }

  /**
   * 获取人物世界书条目
   */
  static async getCharacterEntry(characterId: string): Promise<any> {
    const worldbookName = this.getCurrentWorldbookName();
    return CharacterWorldbookManager.getCharacterEntry(worldbookName, characterId);
  }

  /**
   * 更新人物世界书条目
   */
  static async updateCharacterEntry(character: Character): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return CharacterWorldbookManager.updateCharacterEntry(worldbookName, character);
  }

  /**
   * 删除人物世界书条目
   */
  static async deleteCharacterEntry(characterId: string): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return CharacterWorldbookManager.deleteCharacterEntry(worldbookName, characterId);
  }

  /**
   * 删除指定人物的剧情记录条目（包含所有调教、对话等历史记录）
   */
  static async deleteCharacterStoryHistoryEntry(characterId: string): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();

    // 删除整个剧情记录条目
    await TrainingRecordManager.deleteTrainingHistory(characterId, worldbookName);
  }

  /**
   * 清空所有人物档案、剧情记录、据点征服记录和游戏事件记录世界书条目
   */
  static async clearCharacterAndStoryEntries(): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return CharacterWorldbookManager.clearCharacterAndStoryEntries(worldbookName);
  }

  // ==================== 资源世界书管理 ====================

  /**
   * 初始化资源世界书条目（游戏开始时创建）
   */
  static async initializeResourcesWorldbook(resources: any, continents: Continent[] = []): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return ResourcesWorldbookManager.initialize(worldbookName, resources, continents);
  }

  /**
   * 更新资源世界书条目
   */
  static async updateResourcesWorldbook(resources: any, continents: Continent[] = []): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return ResourcesWorldbookManager.update(worldbookName, resources, continents);
  }

  // ==================== 战前对话记录管理 ====================

  /**
   * 批量添加战前对话记录
   */
  static async addMultipleDialogueRecords(
    characterId: string,
    characterName: string,
    dialogueRecords: HistoryRecord[],
    characterStatus?: string,
  ): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return PreBattleDialogueManager.addMultipleDialogueRecords(
      characterId,
      characterName,
      worldbookName,
      dialogueRecords,
      characterStatus,
    );
  }

  // ==================== 战斗总结记录管理 ====================

  /**
   * 批量添加战斗总结记录
   */
  static async addMultipleBattleSummaryRecords(
    characterId: string,
    characterName: string,
    battleSummaryRecords: HistoryRecord[],
    characterStatus?: string,
  ): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return BattleSummaryManager.addMultipleBattleSummaryRecords(
      characterId,
      characterName,
      worldbookName,
      battleSummaryRecords,
      characterStatus,
    );
  }

  // ==================== 调教记录管理 ====================

  /**
   * 获取现有的调教记录
   */
  static async getExistingTrainingHistory(characterName: string): Promise<HistoryRecord[]> {
    const worldbookName = this.getCurrentWorldbookName();
    return TrainingRecordManager.getExistingTrainingHistory(characterName, worldbookName);
  }

  /**
   * 批量添加调教记录
   */
  static async addMultipleTrainingRecords(
    characterId: string,
    characterName: string,
    trainingRecords: HistoryRecord[],
    characterStatus?: string,
  ): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return TrainingRecordManager.addMultipleTrainingRecords(
      characterId,
      characterName,
      worldbookName,
      trainingRecords,
      characterStatus,
    );
  }

  // ==================== 据点征服记录管理 ====================

  /**
   * 添加据点征服记录到世界书
   */
  static async addConquestRecord(
    location: any,
    battleResult: any,
    gameTime: string,
    regionDescription?: string,
  ): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return ConquestRecordManager.addConquestRecord(worldbookName, location, battleResult, gameTime, regionDescription);
  }

  // ==================== 游戏冒头事件记录管理 ====================

  /**
   * 创建游戏事件故事记录到世界书
   */
  static async createEventStoryRecord(
    eventId: string,
    eventName: string,
    eventContent: string,
    gameTime: string,
  ): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return GameEventLorebookManager.createEventStoryRecord(worldbookName, eventId, eventName, eventContent, gameTime);
  }

  // ==================== 思维链管理 ====================

  /**
   * 设置思维链模式（共用同一个世界书条目，调用时更新内容）
   * @param mode 思维链模式
   */
  static async setChainOfThoughtMode(mode: ChainOfThoughtMode): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return ChainOfThoughtManager.addChainToWorldbook(worldbookName, mode);
  }

  /**
   * 初始化思维链条目（首次使用时创建）
   */
  static async initializeChainOfThought(): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return ChainOfThoughtManager.initializeChainToWorldbook(worldbookName);
  }

  /**
   * 移除思维链条目
   */
  static async removeChainOfThought(): Promise<void> {
    const worldbookName = this.getCurrentWorldbookName();
    return ChainOfThoughtManager.removeChainFromWorldbook(worldbookName);
  }

  /**
   * 检查思维链条目是否存在
   */
  static async chainOfThoughtExists(): Promise<boolean> {
    const worldbookName = this.getCurrentWorldbookName();
    return ChainOfThoughtManager.chainExistsInWorldbook(worldbookName);
  }
}
