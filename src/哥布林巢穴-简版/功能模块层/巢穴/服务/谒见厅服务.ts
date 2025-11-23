/**
 * 谒见厅服务
 * 负责管理谒见厅的业务逻辑，包括秘书官管理、事件检查和事件报告生成
 */

import { modularSaveManager } from '../../../核心层/服务/存档系统/模块化存档服务';
import type { Character } from '../../人物管理/类型/人物类型';
import { RandomEventService } from '../../随机事件/服务/随机事件服务';
import type { RandomEvent } from '../../随机事件/类型/事件类型';

// ==================== 类型定义 ====================

/**
 * 事件报告接口
 */
export interface EventReport {
  eventId: string;
  eventName: string;
  eventDescription: string;
  triggerRound: number;
  reportContent?: string; // AI生成的事件报告内容
  createdAt: number; // 创建时间戳
  viewed: boolean; // 是否已查看
}

/**
 * 谒见厅状态接口
 */
export interface AudienceHallState {
  /** 可用人物列表 */
  availableCharacters: Character[];
  /** 选中的秘书官 */
  selectedSecretary: Character | null;
  /** 待处理事件 */
  pendingEvent: RandomEvent | null;
  /** 事件报告列表 */
  eventReports: EventReport[];
}

/**
 * 谒见厅服务类
 */
export class AudienceHallService {
  private static instance: AudienceHallService;
  private eventService: RandomEventService;

  private constructor() {
    this.eventService = RandomEventService.getInstance();
  }

  public static getInstance(): AudienceHallService {
    if (!AudienceHallService.instance) {
      AudienceHallService.instance = new AudienceHallService();
    }
    return AudienceHallService.instance;
  }

  /**
   * 加载可用人物列表（可作为秘书官的候选人）
   */
  public loadAvailableCharacters(): Character[] {
    try {
      const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
      if (trainingData && trainingData.characters) {
        // 筛选出可用的角色（已投降或已编制状态，排除玩家角色）
        const characters = trainingData.characters.filter(
          (char: Character) =>
            char.status !== 'uncaptured' &&
            char.status !== 'enemy' &&
            char.id !== 'player-1' &&
            char.status !== 'player',
        );
        console.log('可用秘书官候选人:', characters);
        return characters;
      }
      return [];
    } catch (error) {
      console.error('加载人物数据失败:', error);
      return [];
    }
  }

  /**
   * 加载已保存的秘书官
   */
  public loadSavedSecretary(availableCharacters: Character[]): Character | null {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      if (nestData && nestData.secretaryId) {
        const secretary = availableCharacters.find(char => char.id === nestData.secretaryId);
        if (secretary) {
          console.log('已加载保存的秘书官:', secretary.name);
          return secretary;
        }
      }
      return null;
    } catch (error) {
      console.error('加载秘书官失败:', error);
      return null;
    }
  }

  /**
   * 保存秘书官
   */
  public saveSecretary(secretary: Character | null): void {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      modularSaveManager.updateModuleData({
        moduleName: 'nest',
        data: {
          ...nestData,
          secretaryId: secretary?.id || null,
        },
      });
      console.log('秘书官已保存:', secretary?.name || '无');
    } catch (error) {
      console.error('保存秘书官失败:', error);
    }
  }

  /**
   * 检查随机事件
   * @param gameState 游戏状态（可选），用于更准确的事件条件检查
   */
  public checkRandomEvents(gameState?: any): RandomEvent | null {
    try {
      const rounds = modularSaveManager.resources.value.rounds || 0;

      // 如果没有传入游戏状态，尝试从存档中获取
      const state = gameState || this.buildGameState();

      const result = this.eventService.checkRoundStartEvents(rounds, state);
      if (result.triggered && result.event) {
        console.log('检测到随机事件:', result.event.name);
        return result.event;
      }
      return null;
    } catch (error) {
      console.error('检查随机事件失败:', error);
      return null;
    }
  }

  /**
   * 构建游戏状态对象（用于事件条件检查）
   */
  private buildGameState(): any {
    try {
      const resources = modularSaveManager.resources.value;
      const exploreData = modularSaveManager.getModuleData({ moduleName: 'exploration' }) as any;

      return {
        resources: {
          gold: resources.gold || 0,
          food: resources.food || 0,
          threat: resources.threat || 0,
          slaves: resources.slaves || 0,
        },
        threat: resources.threat || 0,
        continents: exploreData?.continents || {},
      };
    } catch (error) {
      console.error('构建游戏状态失败:', error);
      return {};
    }
  }

  /**
   * 保存待处理事件列表
   */
  public savePendingEvents(events: RandomEvent[]): void {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      modularSaveManager.updateModuleData({
        moduleName: 'nest',
        data: {
          ...nestData,
          pendingEvents: events,
        },
      });
      console.log('待处理事件列表已保存，共', events.length, '个事件');
    } catch (error) {
      console.error('保存待处理事件列表失败:', error);
    }
  }

  /**
   * 加载待处理事件列表
   */
  public loadPendingEvents(): RandomEvent[] {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      if (nestData && nestData.pendingEvents && Array.isArray(nestData.pendingEvents)) {
        console.log('已加载待处理事件列表，共', nestData.pendingEvents.length, '个事件');
        return nestData.pendingEvents as RandomEvent[];
      }
      // 兼容旧数据：如果存在单个 pendingEvent，转换为数组
      if (nestData && nestData.pendingEvent) {
        const events = [nestData.pendingEvent as RandomEvent];
        this.savePendingEvents(events);
        return events;
      }
      return [];
    } catch (error) {
      console.error('加载待处理事件列表失败:', error);
      return [];
    }
  }

  /**
   * 添加待处理事件（如果不存在）
   */
  public addPendingEvent(event: RandomEvent): void {
    try {
      const events = this.loadPendingEvents();
      // 检查是否已存在
      const exists = events.some(e => e.id === event.id);
      if (!exists) {
        events.push(event);
        this.savePendingEvents(events);
        console.log('待处理事件已添加:', event.name);
      }
    } catch (error) {
      console.error('添加待处理事件失败:', error);
    }
  }

  /**
   * 移除待处理事件
   */
  public removePendingEvent(eventId: string): void {
    try {
      const events = this.loadPendingEvents();
      const filtered = events.filter(e => e.id !== eventId);
      this.savePendingEvents(filtered);
      console.log('待处理事件已移除:', eventId);
    } catch (error) {
      console.error('移除待处理事件失败:', error);
    }
  }

  /**
   * 清除所有待处理事件
   */
  public clearPendingEvents(): void {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      modularSaveManager.updateModuleData({
        moduleName: 'nest',
        data: {
          ...nestData,
          pendingEvents: [],
          pendingEvent: null, // 清除旧数据
        },
      });
      console.log('待处理事件列表已清除');
    } catch (error) {
      console.error('清除待处理事件列表失败:', error);
    }
  }

  /**
   * @deprecated 使用 loadPendingEvents 代替
   */
  public loadPendingEvent(): RandomEvent | null {
    const events = this.loadPendingEvents();
    return events.length > 0 ? events[0] : null;
  }

  /**
   * @deprecated 使用 addPendingEvent 代替
   */
  public savePendingEvent(event: RandomEvent): void {
    this.addPendingEvent(event);
  }

  /**
   * @deprecated 使用 clearPendingEvents 代替
   */
  public clearPendingEvent(): void {
    this.clearPendingEvents();
  }

  /**
   * 获取所有事件报告
   */
  public getEventReports(): EventReport[] {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      return nestData?.eventReports || [];
    } catch (error) {
      console.error('获取事件报告失败:', error);
      return [];
    }
  }

  /**
   * 标记事件报告为已查看
   */
  public markEventReportAsViewed(reportId: string): void {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      const reports = nestData?.eventReports || [];
      const report = reports.find(
        (r: EventReport) => r.eventId === reportId && r.triggerRound === modularSaveManager.resources.value.rounds,
      );
      if (report) {
        report.viewed = true;
        modularSaveManager.updateModuleData({
          moduleName: 'nest',
          data: {
            ...nestData,
            eventReports: reports,
          },
        });
      }
    } catch (error) {
      console.error('标记事件报告失败:', error);
    }
  }
}
