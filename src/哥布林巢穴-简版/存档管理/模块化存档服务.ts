/**
 * 模块化存档服务
 * 基于 IndexedDB 的模块化存档管理系统
 * 集成资源管理和Vue响应式功能
 */

import { computed, ref } from 'vue';
import { WorldbookService } from '../世界书管理/世界书服务';
import { databaseService } from './数据库服务';
import type {
  BaseResources,
  ModularDeleteOptions,
  ModularGameData,
  ModularLoadOptions,
  ModularSaveManagerEvents,
  ModularSaveOptions,
  ModularSaveSlot,
  ModuleDataOptions,
  ModuleUpdateOptions,
  NestModuleData,
} from './模块化存档类型';
import { createFullGameData, INITIAL_NEST_DATA, INITIAL_RESOURCES } from './模块化存档类型';

// 使用 BaseResources 接口替代重复的 GameResources

// 资源变化接口
export interface ResourceChange {
  type: keyof BaseResources;
  amount: number;
  reason?: string;
}

export class ModularSaveManager {
  private static readonly MAX_SLOTS = 5;
  private static readonly CURRENT_VERSION = '1.0.0';

  private events: ModularSaveManagerEvents = {};
  private currentGameData: ModularGameData | null = null;

  // Vue响应式资源状态
  public resources = ref<BaseResources>({ ...INITIAL_RESOURCES });
  public resourceDisplay = computed(() => ({
    gold: `💰 ${this.resources.value.gold}`,
    food: `🍖 ${this.resources.value.food}`,
    threat: `⚠️ ${this.resources.value.threat}`,
    slaves: `🔒 ${this.resources.value.slaves}`,
    trainingSlaves: `💋 ${this.resources.value.trainingSlaves}`,
    rounds: `🔄 ${this.resources.value.rounds}`,
    actionPoints: `❤️ ${this.resources.value.actionPoints}/${this.resources.value.maxActionPoints}`,
    conqueredRegions: `🏰 ${this.resources.value.conqueredRegions}`,
  }));

  constructor(events?: ModularSaveManagerEvents) {
    if (events) {
      this.events = events;
    }
  }

  /**
   * 根据存档ID推导槽位号
   * 兼容新格式: slot_{n} 与旧格式: save_{ts}_{n}
   */
  private deriveSlotFromId(id: string): number {
    if (id.startsWith('slot_')) {
      const n = parseInt(id.substring('slot_'.length));
      return Number.isFinite(n) ? n : 0;
    }

    const parts = id.split('_');
    const last = parts[parts.length - 1];
    const n = parseInt(last);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * 设置事件监听器
   */
  setEvents(events: ModularSaveManagerEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * 初始化存档管理器
   */
  async init(): Promise<void> {
    try {
      await databaseService.init();

      // 确保默认世界书存在
      await this.ensureDefaultWorldbook();

      console.log('模块化存档管理器初始化成功');
    } catch (error) {
      console.error('模块化存档管理器初始化失败，尝试强制重新初始化:', error);

      try {
        await databaseService.forceReinit();

        // 确保默认世界书存在
        await this.ensureDefaultWorldbook();

        console.log('模块化存档管理器强制重新初始化成功');
      } catch (reinitError) {
        console.error('模块化存档管理器强制重新初始化失败:', reinitError);
        throw reinitError;
      }
    }
  }

  /**
   * 获取所有存档槽位
   */
  async getAllSlots(): Promise<ModularSaveSlot[]> {
    try {
      const saves = await databaseService.getAllSaves();
      const slots: ModularSaveSlot[] = [];

      // 为每个存档创建槽位信息
      for (const save of saves) {
        const slotIdx = this.deriveSlotFromId(save.id);
        const gameData = await databaseService.loadSave(save.id);
        slots.push({
          slot: slotIdx,
          data: gameData as ModularGameData | null,
          timestamp: save.lastPlayed.getTime(),
          version: save.version,
          saveName: save.name,
        });
      }

      // 确保返回所有槽位（0-5），包括空的
      const allSlots: ModularSaveSlot[] = [];
      for (let i = 0; i <= ModularSaveManager.MAX_SLOTS; i++) {
        const existingSlot = slots.find(slot => slot.slot === i);
        if (existingSlot) {
          allSlots.push(existingSlot);
        } else {
          // 创建空槽位
          allSlots.push({
            slot: i,
            data: null,
            timestamp: 0,
            version: ModularSaveManager.CURRENT_VERSION,
            saveName: i === 0 ? '自动存档' : `槽位 ${i}`,
          });
        }
      }

      return allSlots;
    } catch (error) {
      console.error('获取存档槽位失败:', error);
      this.handleError(error as Error);
      return [];
    }
  }

  /**
   * 获取指定槽位
   */
  async getSlot(slotNumber: number): Promise<ModularSaveSlot> {
    try {
      if (slotNumber < 0 || slotNumber > ModularSaveManager.MAX_SLOTS) {
        throw new Error(`无效的槽位编号: ${slotNumber}`);
      }

      const saves = await databaseService.getAllSaves();
      // 优先新格式
      let save = saves.find(s => s.id === `slot_${slotNumber}`);
      // 兼容旧格式: 末尾 _{n}
      if (!save) save = saves.find(s => s.id.endsWith(`_${slotNumber}`));

      if (save) {
        const gameData = await databaseService.loadSave(save.id);
        return {
          slot: slotNumber,
          data: gameData as ModularGameData | null,
          timestamp: save.lastPlayed.getTime(),
          version: save.version,
          saveName: save.name,
        };
      }

      return {
        slot: slotNumber,
        data: null,
        timestamp: 0,
        version: ModularSaveManager.CURRENT_VERSION,
        saveName: `槽位 ${slotNumber}`,
      };
    } catch (error) {
      console.error(`获取槽位 ${slotNumber} 失败:`, error);
      this.handleError(error as Error);
      return {
        slot: slotNumber,
        data: null,
        timestamp: 0,
        version: ModularSaveManager.CURRENT_VERSION,
        saveName: `槽位 ${slotNumber}`,
      };
    }
  }

  /**
   * 保存到指定槽位
   */
  async saveToSlot(options: ModularSaveOptions): Promise<boolean> {
    try {
      const { slot, gameData } = options;

      if (slot < 0 || slot > ModularSaveManager.MAX_SLOTS) {
        throw new Error(`无效的槽位编号: ${slot}`);
      }

      // 更新元数据
      gameData.metadata.lastSaved = Date.now();
      gameData.metadata.gameVersion = ModularSaveManager.CURRENT_VERSION;

      // 创建或更新存档（稳定的主键：使用槽位号作为 ID，保证覆盖写入而非创建多个）
      const saveId = `slot_${slot}`;

      // 保存到 IndexedDB
      await databaseService.saveGameData(saveId, gameData as any);
      await databaseService.upsertSaveMeta(saveId, options.saveName ?? (slot === 0 ? '自动存档' : `槽位 ${slot}`));

      // 设置当前存档ID
      databaseService.setCurrentSaveId(saveId);

      // 更新当前游戏数据
      this.currentGameData = gameData;

      // 保存当前世界书数据到数据库
      await this.saveWorldbookToDatabase(slot);

      // 触发保存事件
      if (this.events.onSave) {
        this.events.onSave(slot, gameData);
      }

      console.log(`游戏已保存到槽位 ${slot}`);
      return true;
    } catch (error) {
      console.error('保存游戏失败:', error);
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * 从指定槽位读取
   */
  async loadFromSlot(options: ModularLoadOptions): Promise<ModularGameData | null> {
    try {
      const { slot } = options;

      if (slot < 0 || slot > ModularSaveManager.MAX_SLOTS) {
        throw new Error(`无效的槽位编号: ${slot}`);
      }

      const slotData = await this.getSlot(slot);

      if (!slotData.data) {
        throw new Error(`槽位 ${slot} 没有存档`);
      }

      // 更新当前游戏数据
      this.currentGameData = slotData.data;

      // 设置当前存档ID（直接使用稳定键）
      databaseService.setCurrentSaveId(`slot_${slot}`);

      // 从数据库恢复世界书数据到当前世界书
      await this.restoreWorldbookFromDatabase(slot);

      // 触发读取事件
      if (this.events.onLoad) {
        this.events.onLoad(slot, slotData.data);
      }

      console.log(`游戏已从槽位 ${slot} 读取`);
      return slotData.data;
    } catch (error) {
      console.error('读取游戏失败:', error);
      this.handleError(error as Error);
      return null;
    }
  }

  /**
   * 删除指定槽位
   */
  async deleteSlot(options: ModularDeleteOptions): Promise<boolean> {
    try {
      const { slot } = options;

      if (slot < 0 || slot > ModularSaveManager.MAX_SLOTS) {
        throw new Error(`无效的槽位编号: ${slot}`);
      }

      const saves = await databaseService.getAllSaves();
      const save = saves.find(s => s.id.includes(`_${slot}_`));

      if (save) {
        await databaseService.deleteSave(save.id);
      }

      // 删除存档对应的世界书数据
      await this.deleteWorldbookDataFromDatabase(slot);

      // 触发删除事件
      if (this.events.onDelete) {
        this.events.onDelete(slot);
      }

      console.log(`槽位 ${slot} 的存档已删除`);
      return true;
    } catch (error) {
      console.error('删除存档失败:', error);
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * 检查槽位是否有存档
   */
  async hasSave(slot: number): Promise<boolean> {
    const slotData = await this.getSlot(slot);
    return slotData.timestamp > 0;
  }

  /**
   * 获取当前游戏数据
   */
  getCurrentGameData(): ModularGameData | null {
    return this.currentGameData;
  }

  /**
   * 同步资源状态到Vue响应式状态
   */
  syncResourcesToReactive(): void {
    if (this.currentGameData) {
      this.resources.value = { ...this.currentGameData.baseResources };
    }
  }

  /**
   * 从Vue响应式状态同步资源到游戏数据
   */
  syncReactiveToResources(): void {
    if (this.currentGameData) {
      this.currentGameData.baseResources = { ...this.resources.value };
    }
  }

  /**
   * 更新模块数据（直接覆盖）
   */
  updateModuleData(options: ModuleUpdateOptions): void {
    if (!this.currentGameData) {
      console.warn('没有加载的游戏数据，无法更新模块数据');
      return;
    }

    const { moduleName, data } = options;

    // 直接覆盖数据
    this.currentGameData[moduleName] = data;

    // 触发模块更新事件
    if (this.events.onModuleUpdate) {
      this.events.onModuleUpdate(moduleName, this.currentGameData[moduleName]);
    }

    console.log(`模块 ${moduleName} 数据已更新`);
  }

  /**
   * 获取模块数据
   */
  getModuleData<T>(options: ModuleDataOptions): T | null {
    if (!this.currentGameData) {
      return null;
    }

    return this.currentGameData[options.moduleName] as T;
  }

  /**
   * 更新基础资源
   */
  updateBaseResources(resources: Partial<BaseResources>): void {
    if (!this.currentGameData) {
      console.warn('没有加载的游戏数据，无法更新基础资源');
      return;
    }

    this.currentGameData.baseResources = {
      ...this.currentGameData.baseResources,
      ...resources,
    };

    console.log('基础资源已更新');
  }

  /**
   * 创建新游戏
   */
  createNewGame(): ModularGameData {
    this.currentGameData = createFullGameData();
    return this.currentGameData;
  }

  /**
   * 保存当前游戏数据
   */
  async saveCurrentGameData(slot: number, saveName?: string): Promise<boolean> {
    if (!this.currentGameData) {
      console.warn('没有当前游戏数据，创建新游戏');
      this.createNewGame();
    }

    return await this.saveToSlot({
      slot,
      saveName,
      gameData: this.currentGameData!,
    });
  }

  /**
   * 格式化时间
   */
  formatTime(timestamp: number): string {
    if (!timestamp) return '无存档';

    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 获取存档统计信息
   */
  async getSaveStats(): Promise<{ totalSlots: number; usedSlots: number; emptySlots: number }> {
    const slots = await this.getAllSlots();
    const usedSlots = slots.filter(slot => slot.timestamp > 0).length;

    return {
      totalSlots: ModularSaveManager.MAX_SLOTS,
      usedSlots,
      emptySlots: ModularSaveManager.MAX_SLOTS - usedSlots,
    };
  }

  /**
   * 清理所有存档
   */
  async clearAllSaves(): Promise<boolean> {
    try {
      const saves = await databaseService.getAllSaves();
      for (const save of saves) {
        await databaseService.deleteSave(save.id);
      }

      console.log('所有存档已清除');
      return true;
    } catch (error) {
      console.error('清除存档失败:', error);
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * 导出存档数据（包含世界书数据）
   */
  async exportSave(slot: number): Promise<string | null> {
    try {
      const slotData = await this.getSlot(slot);
      if (!slotData.data) {
        throw new Error(`槽位 ${slot} 没有存档`);
      }

      // 获取对应的世界书数据
      const saveId = `slot_${slot}`;
      const worldbookData = await databaseService.loadWorldbookData(saveId);

      // 创建包含世界书数据的导出对象
      const exportData = {
        gameData: slotData.data,
        worldbookData: worldbookData || [],
        metadata: {
          slot: slotData.slot,
          timestamp: slotData.timestamp,
          version: slotData.version,
          exportTime: new Date().toISOString(),
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出存档失败:', error);
      this.handleError(error as Error);
      return null;
    }
  }

  /**
   * 导入存档数据（包含世界书数据）
   */
  async importSave(slot: number, saveData: string, saveName?: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(saveData);

      // 判断是否是新的导出格式（包含 worldbookData）
      let gameData: ModularGameData;
      let worldbookData: any[] = [];

      if (parsed.gameData && parsed.worldbookData !== undefined) {
        // 新格式：包含世界书数据
        gameData = parsed.gameData;
        worldbookData = parsed.worldbookData;
      } else {
        // 旧格式：只有游戏数据（向后兼容）
        gameData = parsed;
      }

      // 保存游戏数据
      const saveId = `slot_${slot}`;
      await databaseService.saveGameData(saveId, gameData as any);
      await databaseService.upsertSaveMeta(saveId, saveName ?? (slot === 0 ? '自动存档' : `槽位 ${slot}`));

      // 如果有世界书数据，也保存
      if (worldbookData && worldbookData.length > 0) {
        await databaseService.saveWorldbookData(saveId, worldbookData);
      } else {
        // 如果没有世界书数据，清空世界书数据
        await databaseService.saveWorldbookData(saveId, []);
      }

      // 设置当前存档ID
      databaseService.setCurrentSaveId(saveId);

      // 更新当前游戏数据
      this.currentGameData = gameData;

      // 触发保存事件
      if (this.events.onSave) {
        this.events.onSave(slot, gameData);
      }

      console.log(`存档已导入到槽位 ${slot}`);
      return true;
    } catch (error) {
      console.error('导入存档失败:', error);
      this.handleError(error as Error);
      return false;
    }
  }

  // ==================== 资源管理功能 ====================

  /**
   * 获取当前资源
   */
  getCurrentResources(): BaseResources {
    if (!this.currentGameData) {
      this.createNewGame();
    }
    return this.currentGameData!.baseResources;
  }

  /**
   * 设置资源值
   */
  setResource(type: keyof BaseResources, value: number): void {
    if (!this.currentGameData) {
      this.createNewGame();
    }
    this.currentGameData!.baseResources[type] = value;
    this.currentGameData!.metadata.lastSaved = Date.now();

    // 同步到Vue响应式状态
    this.syncResourcesToReactive();
  }

  /**
   * 获取资源值
   */
  getResource(type: keyof BaseResources): number {
    if (!this.currentGameData) {
      this.createNewGame();
    }
    return this.currentGameData!.baseResources[type];
  }

  /**
   * 增加资源
   */
  addResource(type: keyof BaseResources, amount: number, reason?: string): boolean {
    console.log(`addResource 被调用: ${type}, 数量: ${amount}, 原因: ${reason}`);

    if (!this.currentGameData) {
      console.log('没有当前游戏数据，创建新游戏');
      this.createNewGame();
    }

    const currentValue = this.currentGameData!.baseResources[type];
    const newValue = currentValue + amount;
    console.log(`资源 ${type}: 当前值 ${currentValue} -> 新值 ${newValue}`);

    // 检查是否会导致负数（对于某些资源类型）
    if (
      type === 'gold' ||
      type === 'food' ||
      type === 'normalGoblins' ||
      type === 'warriorGoblins' ||
      type === 'shamanGoblins' ||
      type === 'paladinGoblins' ||
      type === 'actionPoints'
    ) {
      if (newValue < 0) {
        console.warn(`资源 ${type} 不足，无法减少 ${amount}`);
        return false;
      }
    }

    this.currentGameData!.baseResources[type] = newValue;
    this.currentGameData!.metadata.lastSaved = Date.now();

    // 同步到Vue响应式状态
    console.log('同步到Vue响应式状态...');
    this.syncResourcesToReactive();
    console.log('Vue响应式状态已更新:', this.resources.value[type]);

    if (reason) {
      console.log(`${reason}: ${type} ${amount > 0 ? '+' : ''}${amount} (当前: ${newValue})`);
    }

    return true;
  }

  /**
   * 消耗资源
   */
  consumeResource(type: keyof BaseResources, amount: number, reason?: string): boolean {
    if (!this.currentGameData) {
      this.createNewGame();
    }

    const currentValue = this.currentGameData!.baseResources[type];
    if (currentValue < amount) {
      console.warn(`资源 ${type} 不足: 需要 ${amount}，当前 ${currentValue}`);
      return false;
    }

    this.currentGameData!.baseResources[type] = currentValue - amount;
    this.currentGameData!.metadata.lastSaved = Date.now();

    // 同步到Vue响应式状态
    this.syncResourcesToReactive();

    if (reason) {
      console.log(`${reason}: ${type} -${amount} (剩余: ${currentValue - amount})`);
    }

    return true;
  }

  /**
   * 批量消耗资源
   */
  consumeResources(changes: ResourceChange[]): boolean {
    if (!this.currentGameData) {
      this.createNewGame();
    }

    // 先检查所有资源是否足够
    for (const change of changes) {
      const currentValue = this.currentGameData!.baseResources[change.type];
      if (currentValue < change.amount) {
        console.warn(`资源 ${change.type} 不足: 需要 ${change.amount}，当前 ${currentValue}`);
        return false;
      }
    }

    // 执行消耗
    for (const change of changes) {
      this.currentGameData!.baseResources[change.type] -= change.amount;
      if (change.reason) {
        console.log(`${change.reason}: ${change.type} -${change.amount}`);
      }
    }

    this.currentGameData!.metadata.lastSaved = Date.now();

    // 同步到Vue响应式状态
    this.syncResourcesToReactive();

    return true;
  }

  /**
   * 检查资源是否足够
   */
  hasEnoughResources(changes: ResourceChange[]): boolean {
    if (!this.currentGameData) {
      this.createNewGame();
    }

    for (const change of changes) {
      const currentValue = this.currentGameData!.baseResources[change.type];
      if (currentValue < change.amount) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取资源不足的提示
   */
  getInsufficientResourcesMessage(changes: ResourceChange[]): string {
    if (!this.currentGameData) {
      this.createNewGame();
    }

    const insufficient: string[] = [];
    for (const change of changes) {
      const currentValue = this.currentGameData!.baseResources[change.type];
      if (currentValue < change.amount) {
        insufficient.push(`${change.type}: 需要 ${change.amount}，当前 ${currentValue}`);
      }
    }
    return insufficient.join('; ');
  }

  /**
   * 重置资源到初始值
   */
  resetResources(): void {
    if (!this.currentGameData) {
      this.createNewGame();
    }

    const initialResources = { ...INITIAL_RESOURCES };
    this.currentGameData!.baseResources = { ...initialResources };
    this.currentGameData!.metadata.lastSaved = Date.now();

    // 同步到Vue响应式状态
    this.syncResourcesToReactive();
  }

  /**
   * 获取初始巢穴数据
   */
  getInitialNestData(): NestModuleData | null {
    try {
      return INITIAL_NEST_DATA;
    } catch (error) {
      console.error('获取初始巢穴数据失败:', error);
      return null;
    }
  }

  /**
   * 获取巢穴收入（供回合结束处理使用）
   */
  getNestIncome(): { gold: number; food: number } {
    if (!this.currentGameData || !this.currentGameData.nest) {
      return { gold: 0, food: 0 };
    }

    const nestData = this.currentGameData.nest;
    return nestData.totalIncome || { gold: 0, food: 0 };
  }

  /**
   * 处理巢穴收入（供回合结束处理使用）
   */
  processNestIncome(): { messages: string[]; changes: any[] } {
    const messages: string[] = [];
    const changes: any[] = [];

    const income = this.getNestIncome();

    if (income.gold > 0) {
      const success = this.addResource('gold', income.gold, '巢穴建筑收入');
      if (success) {
        changes.push({
          type: 'gold',
          amount: income.gold,
          reason: '巢穴建筑收入',
        });
        messages.push(`巢穴建筑产生了 ${income.gold} 金钱`);
      }
    }

    if (income.food > 0) {
      const success = this.addResource('food', income.food, '巢穴建筑收入');
      if (success) {
        changes.push({
          type: 'food',
          amount: income.food,
          reason: '巢穴建筑收入',
        });
        messages.push(`巢穴建筑产生了 ${income.food} 食物`);
      }
    }

    return { messages, changes };
  }

  // ==================== 世界书管理功能 ====================

  /**
   * 获取当前存档的世界书名称（始终使用默认世界书）
   */
  getCurrentWorldbookName(): string {
    // 始终使用默认世界书，通过数据库管理不同存档的世界书内容
    return '哥布林巢穴-人物档案';
  }

  /**
   * 保存当前世界书数据到数据库
   */
  async saveWorldbookToDatabase(slot: number): Promise<void> {
    try {
      // 始终从默认世界书获取内容
      let currentWorldbook: any[] = [];

      try {
        currentWorldbook = await window.TavernHelper.getWorldbook('哥布林巢穴-人物档案');
        console.log(`从默认世界书获取到 ${currentWorldbook.length} 个条目`);
      } catch (error) {
        console.log('默认世界书不存在或为空，保存空的世界书数据');
      }

      // 保存到数据库
      const saveId = `slot_${slot}`;
      await databaseService.saveWorldbookData(saveId, currentWorldbook);
      console.log(`世界书数据已保存到数据库，存档: ${saveId}`);
    } catch (error) {
      console.error('保存世界书数据到数据库失败:', error);
    }
  }

  /**
   * 从数据库恢复世界书数据到当前世界书
   */
  async restoreWorldbookFromDatabase(slot: number): Promise<void> {
    try {
      const saveId = `slot_${slot}`;
      const defaultWorldbookName = '哥布林巢穴-人物档案';

      // 从数据库读取世界书数据
      const worldbookData = await databaseService.loadWorldbookData(saveId);

      if (worldbookData && worldbookData.length > 0) {
        // 直接尝试恢复世界书内容到默认世界书
        try {
          await window.TavernHelper.replaceWorldbook(defaultWorldbookName, worldbookData);
          console.log(`已从数据库恢复 ${worldbookData.length} 个世界书条目到默认世界书`);
        } catch (error) {
          // 如果世界书不存在，先创建再恢复
          console.log(`默认世界书不存在，正在创建...`);
          await window.TavernHelper.createWorldbook(defaultWorldbookName, []);
          await window.TavernHelper.replaceWorldbook(defaultWorldbookName, worldbookData);
          console.log(`已从数据库恢复 ${worldbookData.length} 个世界书条目到默认世界书`);
        }
      } else {
        console.log(`存档 ${saveId} 没有世界书数据，清空默认世界书`);
        // 清空默认世界书内容
        try {
          await window.TavernHelper.replaceWorldbook(defaultWorldbookName, []);
        } catch (error) {
          // 如果世界书不存在，创建空的世界书
          console.log(`默认世界书不存在，正在创建空的世界书...`);
          await window.TavernHelper.createWorldbook(defaultWorldbookName, []);
        }
      }
    } catch (error) {
      console.error('从数据库恢复世界书数据失败:', error);
    }
  }

  /**
   * 获取当前绑定的世界书内容
   */
  async getCurrentBoundWorldbook(): Promise<any[]> {
    try {
      // 获取当前绑定的世界书名称
      const currentWorldbookName = await this.getCurrentBoundWorldbookName();
      if (currentWorldbookName) {
        // 检查世界书是否存在
        const exists = await this.checkWorldbookExists(currentWorldbookName);
        if (exists) {
          return await window.TavernHelper.getWorldbook(currentWorldbookName);
        } else {
          console.log(`当前世界书 ${currentWorldbookName} 不存在，返回空内容`);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('获取当前世界书内容失败:', error);
      return [];
    }
  }

  /**
   * 确保默认世界书存在
   */
  async ensureDefaultWorldbook(): Promise<void> {
    try {
      const defaultWorldbookName = '哥布林巢穴-人物档案';
      const exists = await this.checkWorldbookExists(defaultWorldbookName);
      if (!exists) {
        console.log('创建默认世界书...');
        await window.TavernHelper.createWorldbook(defaultWorldbookName, []);
        console.log('默认世界书创建成功');
      }
    } catch (error) {
      console.error('创建默认世界书失败:', error);
    }
  }

  /**
   * 获取当前绑定的世界书名称
   */
  async getCurrentBoundWorldbookName(): Promise<string | null> {
    // 始终使用默认世界书，通过数据库管理不同存档的世界书内容
    return '哥布林巢穴-人物档案';
  }

  /**
   * 切换世界书关联到当前存档
   */
  async switchWorldbookToCurrentSave(): Promise<void> {
    try {
      const worldbookName = this.getCurrentWorldbookName();

      // 设置世界书服务的世界书名称
      WorldbookService.setWorldbookName(worldbookName);

      // 确保世界书存在
      const exists = await this.checkWorldbookExists(worldbookName);
      if (!exists) {
        console.log(`世界书 ${worldbookName} 不存在，正在创建...`);
        await window.TavernHelper.createWorldbook(worldbookName, []);
        console.log(`已创建世界书: ${worldbookName}`);
      }

      await window.TavernHelper.rebindChatWorldbook('current', worldbookName);
      console.log(`世界书已切换到: ${worldbookName}`);
    } catch (error) {
      console.error('切换世界书关联失败:', error);
    }
  }

  /**
   * 检查世界书是否存在
   */
  async checkWorldbookExists(worldbookName: string): Promise<boolean> {
    try {
      const worldbook = await window.TavernHelper.getWorldbook(worldbookName);
      return worldbook !== null && worldbook !== undefined;
    } catch (error) {
      console.error('检查世界书存在性失败:', error);
      return false;
    }
  }

  /**
   * 从数据库删除存档的世界书数据
   */
  async deleteWorldbookDataFromDatabase(slot: number): Promise<void> {
    try {
      const saveId = `slot_${slot}`;
      await databaseService.deleteWorldbookData(saveId);
      console.log(`已删除存档 ${saveId} 的世界书数据`);
    } catch (error) {
      console.error('删除存档世界书数据失败:', error);
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    if (this.events.onError) {
      this.events.onError(error);
    }
  }
}

// 创建全局模块化存档管理器实例
export const modularSaveManager = new ModularSaveManager();
