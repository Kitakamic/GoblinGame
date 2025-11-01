/**
 * IndexedDB 数据库服务
 * 用于存储游戏存档数据，支持多存档隔离
 */

// 导入模块化游戏数据类型
import type { ModularGameData } from './模块化存档类型';
import { DATABASE_NAME, DATABASE_VERSION, createFullGameData } from './模块化存档类型';

export interface GameSave {
  id: string;
  name: string;
  createdAt: Date;
  lastPlayed: Date;
  version: string;
}

// 为了向后兼容，保留 GameData 类型别名
export type GameData = ModularGameData;

class DatabaseService {
  private dbName = DATABASE_NAME;
  private version = DATABASE_VERSION;
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('数据库打开失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('数据库连接成功，对象存储:', Array.from(this.db.objectStoreNames));
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('数据库升级中，版本:', event.oldVersion, '->', event.newVersion);

        // 创建存档元数据存储
        if (!db.objectStoreNames.contains('saves')) {
          const saveStore = db.createObjectStore('saves', { keyPath: 'id' });
          saveStore.createIndex('name', 'name', { unique: false });
          saveStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
          console.log('✅ 创建 saves 对象存储');
        }

        // 创建游戏数据存储
        if (!db.objectStoreNames.contains('gameData')) {
          const gameDataStore = db.createObjectStore('gameData', { keyPath: 'id' });
          gameDataStore.createIndex('saveId', 'id', { unique: true });
          console.log('✅ 创建 gameData 对象存储');
        }

        // 创建世界书数据存储
        if (!db.objectStoreNames.contains('worldbookData')) {
          const worldbookStore = db.createObjectStore('worldbookData', { keyPath: 'id' });
          worldbookStore.createIndex('saveId', 'id', { unique: true });
          console.log('✅ 创建 worldbookData 对象存储');
        }

        // 创建调教记录数据存储
        if (!db.objectStoreNames.contains('trainingHistoryData')) {
          const trainingHistoryStore = db.createObjectStore('trainingHistoryData', { keyPath: 'id' });
          trainingHistoryStore.createIndex('saveId', 'id', { unique: true });
          console.log('✅ 创建 trainingHistoryData 对象存储');
        }
      };
    });
  }

  /**
   * 强制重新初始化数据库
   */
  async forceReinit(): Promise<void> {
    try {
      console.log('强制重新初始化数据库...');

      // 关闭现有连接
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // 删除现有数据库
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      await new Promise<void>(resolve => {
        deleteRequest.onsuccess = () => {
          console.log('旧数据库删除成功');
          resolve();
        };
        deleteRequest.onerror = () => {
          console.log('删除旧数据库时出错，但继续执行:', deleteRequest.error);
          resolve(); // 继续执行，即使删除失败
        };
        deleteRequest.onblocked = () => {
          console.log('数据库被阻塞，等待...');
          setTimeout(() => resolve(), 1000);
        };
      });

      // 等待一段时间确保删除完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 重新初始化数据库
      await this.init();
      console.log('数据库强制重新初始化完成');
    } catch (error) {
      console.error('强制重新初始化数据库失败:', error);
      throw error;
    }
  }

  /**
   * 创建新存档
   */
  async createSave(saveName: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const save: GameSave = {
      id: saveId,
      name: saveName,
      createdAt: new Date(),
      lastPlayed: new Date(),
      version: '1.0.0',
    };

    // 创建存档元数据
    await this.putData('saves', save);

    // 创建存档专用的游戏数据存储
    await this.createSaveDataStore(saveId);

    return saveId;
  }

  /**
   * 为存档创建专用的数据存储
   */
  private async createSaveDataStore(saveId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 使用统一的初始资源配置
    const initialGameData = createFullGameData();

    // 使用通用的 gameData 存储，通过 saveId 作为 key
    await this.putData('gameData', { id: saveId, data: initialGameData });
  }

  /**
   * 获取所有存档列表
   */
  async getAllSaves(): Promise<GameSave[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saves'], 'readonly');
      const store = transaction.objectStore('saves');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 加载存档数据
   */
  async loadSave(saveId: string): Promise<ModularGameData | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 使用通用的 gameData 存储，通过 saveId 作为 key
      const result = await this.getData('gameData', saveId);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to load save:', error);
      return null;
    }
  }

  /**
   * 保存存档数据
   */
  async saveGameData(saveId: string, gameData: ModularGameData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 使用通用的 gameData 存储，通过 saveId 作为 key
    const plainData = this.toPlain(gameData);
    await this.putData('gameData', { id: saveId, data: plainData });

    // 更新存档的最后游戏时间
    const save = await this.getData('saves', saveId);
    if (save) {
      save.lastPlayed = new Date();
      await this.putData('saves', save);
    }
  }

  /**
   * 写入或更新存档元数据（saves 表）
   */
  async upsertSaveMeta(saveId: string, name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getData('saves', saveId);
    const meta: GameSave = {
      id: saveId,
      name: name,
      createdAt: existing?.createdAt ?? new Date(),
      lastPlayed: new Date(),
      version: '1.0.0',
    };

    await this.putData('saves', meta);
  }

  /**
   * 删除存档
   */
  async deleteSave(saveId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 删除存档元数据
    await this.deleteData('saves', saveId);

    // 删除存档数据
    await this.deleteData('gameData', saveId);
  }

  /**
   * 通用数据操作方法
   */
  private async getData(storeName: string, key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async putData(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // 检查对象存储是否存在
    if (!this.db.objectStoreNames.contains(storeName)) {
      throw new Error(`对象存储 '${storeName}' 不存在。可用存储: ${Array.from(this.db.objectStoreNames).join(', ')}`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`✅ 数据保存到 ${storeName} 成功`);
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ 数据保存到 ${storeName} 失败:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 将任意数据转换为可写入 IndexedDB 的纯对象
   * - 移除函数、原型、Proxy 等不可克隆内容
   * - 注意：Date 会被序列化为字符串/数字；本项目中已使用 number 表示时间戳
   */
  private toPlain<T>(value: T): T {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      console.error('toPlain 失败，使用原始值回退。请检查循环引用或不可序列化字段。', e);
      return value;
    }
  }

  private async deleteData(storeName: string, key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取当前存档ID（从酒馆变量中读取）
   */
  getCurrentSaveId(): string | null {
    return getVariables({ type: 'global' })?.currentSaveId || null;
  }

  /**
   * 设置当前存档ID（保存到酒馆变量中）
   */
  setCurrentSaveId(saveId: string): void {
    const currentVars = getVariables({ type: 'global' }) || {};
    replaceVariables({ ...currentVars, currentSaveId: saveId }, { type: 'global' });
  }

  /**
   * 清除当前存档ID（从酒馆变量中删除）
   */
  clearCurrentSaveId(): void {
    const currentVars = getVariables({ type: 'global' }) || {};
    delete currentVars.currentSaveId;
    replaceVariables(currentVars, { type: 'global' });
  }

  /**
   * 获取当前槽位号
   */
  getCurrentSlot(): number | null {
    const currentSaveId = this.getCurrentSaveId();
    if (currentSaveId && currentSaveId.startsWith('slot_')) {
      const slot = parseInt(currentSaveId.substring('slot_'.length));
      return isNaN(slot) ? null : slot;
    }
    return null;
  }

  /**
   * 保存世界书数据到数据库
   */
  async saveWorldbookData(saveId: string, worldbookData: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.putData('worldbookData', {
        id: saveId,
        data: worldbookData,
        savedAt: new Date(),
      });
      console.log(`世界书数据已保存到存档 ${saveId}`);
    } catch (error) {
      console.error('保存世界书数据失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库读取世界书数据
   */
  async loadWorldbookData(saveId: string): Promise<any[] | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.getData('worldbookData', saveId);
      return result ? result.data : null;
    } catch (error) {
      console.error('读取世界书数据失败:', error);
      return null;
    }
  }

  /**
   * 删除存档的世界书数据
   */
  async deleteWorldbookData(saveId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.deleteData('worldbookData', saveId);
      console.log(`已删除存档 ${saveId} 的世界书数据`);
    } catch (error) {
      console.error('删除世界书数据失败:', error);
      throw error;
    }
  }

  /**
   * 保存调教记录数据到数据库
   *
   * 数据格式说明：
   * - 顶层格式：{ [characterName]: HistoryRecord[] }
   * - HistoryRecord 格式：
   *   {
   *     gameTime: string,    // 游戏时间，如 "帝国历1074年1月1日"
   *     sender?: string,     // 发送者，'user' 表示用户消息，其他为角色名
   *     content: string,      // 消息内容
   *     timestamp: number     // 时间戳（毫秒），用于排序
   *   }
   * - pendingDialoguePairs 格式（可选）：
   *   {
   *     [characterName]: {
   *       userInput: string,
   *       aiResponse: string
   *     } | null
   *   }
   *
   * 示例：
   * {
   *   "艾莉丝": [
   *     {
   *       gameTime: "帝国历1074年1月1日",
   *       sender: "user",
   *       content: "你好",
   *       timestamp: 1704067200000
   *     },
   *     {
   *       gameTime: "帝国历1074年1月1日",
   *       sender: "艾莉丝",
   *       content: "你好...",
   *       timestamp: 1704067201000
   *     }
   *   ],
   *   pendingDialoguePairs: {
   *     "艾莉丝": {
   *       userInput: "观察她的情况",
   *       aiResponse: "她抬起头..."
   *     }
   *   }
   * }
   *
   * @param saveId 存档ID
   * @param trainingHistoryData 调教记录数据，格式为 { [characterName]: HistoryRecord[] }
   * @param pendingDialoguePairs 暂存的对话对（可选），格式为 { [characterName]: { userInput: string, aiResponse: string } | null }
   * @param pendingAttributeChanges 暂存的属性变化（可选），格式为 { [characterName]: { loyalty: number, stamina: number, character: Character } | null }
   * @param originalCharacters 原始人物属性（可选），格式为 { [characterName]: Character | null }
   */
  async saveTrainingHistoryData(
    saveId: string,
    trainingHistoryData: Record<string, any[]>,
    pendingDialoguePairs?: Record<string, { userInput: string; aiResponse: string } | null>,
    pendingAttributeChanges?: Record<string, { loyalty: number; stamina: number; character: any } | null>,
    originalCharacters?: Record<string, any | null>,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 检查对象存储是否存在，如果不存在则尝试重新初始化
      if (!this.db.objectStoreNames.contains('trainingHistoryData')) {
        console.warn('⚠️ trainingHistoryData 对象存储不存在，尝试重新初始化数据库...');
        // 关闭当前连接
        this.db.close();
        this.db = null;
        // 重新初始化（会触发 onupgradeneeded）
        await this.init();
      }

      // 构建完整的数据对象，包含所有暂存数据
      // 使用 toPlain 去除 Vue Proxy，确保可以序列化到 IndexedDB
      const fullData: any = {
        ...this.toPlain(trainingHistoryData),
      };

      // 处理暂存数据，去除 Vue Proxy
      if (pendingDialoguePairs) {
        const plainPairs: Record<string, { userInput: string; aiResponse: string } | null> = {};
        for (const [key, value] of Object.entries(pendingDialoguePairs)) {
          plainPairs[key] = value ? this.toPlain(value) : null;
        }
        fullData.pendingDialoguePairs = plainPairs;
      }

      if (pendingAttributeChanges) {
        const plainAttrs: Record<string, { loyalty: number; stamina: number; character: any } | null> = {};
        for (const [key, value] of Object.entries(pendingAttributeChanges)) {
          if (value) {
            plainAttrs[key] = {
              loyalty: value.loyalty,
              stamina: value.stamina,
              character: this.toPlain(value.character), // character 对象可能是 Vue Proxy
            };
          } else {
            plainAttrs[key] = null;
          }
        }
        fullData.pendingAttributeChanges = plainAttrs;
      }

      if (originalCharacters) {
        const plainChars: Record<string, any | null> = {};
        for (const [key, value] of Object.entries(originalCharacters)) {
          plainChars[key] = value ? this.toPlain(value) : null;
        }
        fullData.originalCharacters = plainChars;
      }

      await this.putData('trainingHistoryData', {
        id: saveId,
        data: fullData,
        savedAt: new Date(),
      });

      const pendingPairCount = pendingDialoguePairs
        ? Object.values(pendingDialoguePairs).filter(v => v !== null).length
        : 0;
      const pendingAttrCount = pendingAttributeChanges
        ? Object.values(pendingAttributeChanges).filter(v => v !== null).length
        : 0;
      const originalCharCount = originalCharacters
        ? Object.values(originalCharacters).filter(v => v !== null).length
        : 0;

      const extraInfo: string[] = [];
      if (pendingPairCount > 0) extraInfo.push(`${pendingPairCount} 个暂存对话对`);
      if (pendingAttrCount > 0) extraInfo.push(`${pendingAttrCount} 个暂存属性变化`);
      if (originalCharCount > 0) extraInfo.push(`${originalCharCount} 个原始人物属性`);

      if (extraInfo.length > 0) {
        console.log(`调教记录数据已保存到存档 ${saveId}，包含 ${extraInfo.join('、')}`);
      } else {
        console.log(`调教记录数据已保存到存档 ${saveId}`);
      }
    } catch (error) {
      console.error('保存调教记录数据失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库读取调教记录数据
   *
   * 返回格式：{ [characterName]: HistoryRecord[], pendingDialoguePairs?: ..., pendingAttributeChanges?: ..., originalCharacters?: ... }
   *
   * 在对话界面解析时：
   * 1. 通过 characterName 获取该角色的记录数组
   * 2. 遍历数组，根据 sender 字段判断是用户消息还是AI消息
   * 3. sender === 'user' 或 sender === '{{user}}' 表示用户消息
   * 4. 其他 sender 值为角色名，表示AI消息
   * 5. 使用 timestamp 字段进行排序
   * 6. 如果有 pendingDialoguePairs，也会返回暂存的对话对
   * 7. 如果有 pendingAttributeChanges，也会返回暂存的属性变化
   * 8. 如果有 originalCharacters，也会返回原始人物属性
   *
   * @param saveId 存档ID
   * @returns 调教记录数据，格式为 { [characterName]: HistoryRecord[], pendingDialoguePairs?: ..., pendingAttributeChanges?: ..., originalCharacters?: ... }，如果没有则返回null
   */
  async loadTrainingHistoryData(saveId: string): Promise<
    | (Record<string, any[]> & {
        pendingDialoguePairs?: Record<string, { userInput: string; aiResponse: string } | null>;
        pendingAttributeChanges?: Record<string, { loyalty: number; stamina: number; character: any } | null>;
        originalCharacters?: Record<string, any | null>;
      })
    | null
  > {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 检查对象存储是否存在，如果不存在则返回null（兼容旧数据库）
      if (!this.db.objectStoreNames.contains('trainingHistoryData')) {
        console.warn('⚠️ trainingHistoryData 对象存储不存在，可能需要升级数据库版本');
        return null;
      }

      const result = await this.getData('trainingHistoryData', saveId);
      return result ? result.data : null;
    } catch (error) {
      // 如果是 NotFoundError，说明对象存储不存在，返回null
      if (error instanceof Error && error.name === 'NotFoundError') {
        console.warn('⚠️ trainingHistoryData 对象存储不存在，返回空数据');
        return null;
      }
      console.error('读取调教记录数据失败:', error);
      return null;
    }
  }

  /**
   * 删除存档的调教记录数据
   * @param saveId 存档ID
   */
  async deleteTrainingHistoryData(saveId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.deleteData('trainingHistoryData', saveId);
      console.log(`已删除存档 ${saveId} 的调教记录数据`);
    } catch (error) {
      console.error('删除调教记录数据失败:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// 导出单例实例
export const databaseService = new DatabaseService();

// 初始化数据库
databaseService.init().catch(console.error);
