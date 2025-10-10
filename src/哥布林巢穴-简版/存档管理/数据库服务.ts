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
