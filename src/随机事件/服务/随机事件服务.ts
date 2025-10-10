import { roundStartEvents } from '../事件配置/回合开始事件';
import { EventProcessResult, EventRarity, EventTriggerResult, EventType, RandomEvent } from '../类型定义/事件类型';

/**
 * 随机事件服务
 * 负责管理随机事件的触发、处理和存储
 */
export class RandomEventService {
  private static instance: RandomEventService;
  private registeredEvents: Map<string, RandomEvent> = new Map();
  private eventHistory: string[] = [];

  private constructor() {
    this.initializeEvents();
  }

  public static getInstance(): RandomEventService {
    if (!RandomEventService.instance) {
      RandomEventService.instance = new RandomEventService();
    }
    return RandomEventService.instance;
  }

  /**
   * 初始化事件
   */
  private initializeEvents(): void {
    // 注册回合开始事件
    roundStartEvents.forEach(event => {
      this.registerEvent(event);
    });
  }

  /**
   * 注册事件
   */
  public registerEvent(event: RandomEvent): void {
    this.registeredEvents.set(event.id, event);
  }

  /**
   * 获取所有注册的事件
   */
  public getAllEvents(): RandomEvent[] {
    return Array.from(this.registeredEvents.values());
  }

  /**
   * 根据类型获取事件
   */
  public getEventsByType(type: EventType): RandomEvent[] {
    return this.getAllEvents().filter(event => event.type === type);
  }

  /**
   * 根据稀有度获取事件
   */
  public getEventsByRarity(rarity: EventRarity): RandomEvent[] {
    return this.getAllEvents().filter(event => event.rarity === rarity);
  }

  /**
   * 检查回合开始事件触发
   */
  public checkRoundStartEvents(currentRound: number, gameState?: any): EventTriggerResult {
    const availableEvents = this.getEventsByType(EventType.RANDOM).filter(event =>
      this.isEventAvailable(event, currentRound, gameState),
    );

    if (availableEvents.length === 0) {
      return { triggered: false, reason: '没有可用的事件' };
    }

    // 计算触发概率
    const totalProbability = availableEvents.reduce((sum, event) => {
      return sum + (event.trigger.probability ?? 0.2);
    }, 0);

    const randomValue = Math.random();

    if (randomValue < totalProbability) {
      // 选择触发的事件（基于概率权重）
      const selectedEvent = this.selectEventByProbability(availableEvents);
      if (selectedEvent) {
        this.eventHistory.push(selectedEvent.id);
        return { triggered: true, event: selectedEvent };
      }
    }

    return { triggered: false, reason: '概率未触发' };
  }

  /**
   * 检查事件是否可用
   */
  private isEventAvailable(event: RandomEvent, currentRound: number, gameState?: any): boolean {
    const trigger = event.trigger;

    // 检查回合数条件
    if (trigger.minRound && currentRound < trigger.minRound) {
      return false;
    }
    if (trigger.maxRound && currentRound > trigger.maxRound) {
      return false;
    }

    // 检查资源条件
    if (trigger.requiredResources && gameState) {
      for (const [resource, amount] of Object.entries(trigger.requiredResources)) {
        if (!gameState.resources || gameState.resources[resource] < amount) {
          return false;
        }
      }
    }

    // 检查威胁度条件
    if (trigger.requiredThreat && gameState) {
      if (!gameState.threat || gameState.threat < trigger.requiredThreat) {
        return false;
      }
    }

    return true;
  }

  /**
   * 根据概率选择事件
   */
  private selectEventByProbability(events: RandomEvent[]): RandomEvent | null {
    if (events.length === 0) return null;

    const totalWeight = events.reduce((sum, event) => {
      return sum + (event.trigger.probability ?? 0.2);
    }, 0);

    let randomValue = Math.random() * totalWeight;

    for (const event of events) {
      const weight = event.trigger.probability ?? 0.2;
      if (randomValue <= weight) {
        return event;
      }
      randomValue -= weight;
    }

    return events[events.length - 1];
  }

  /**
   * 处理事件结果
   */
  public processEventResult(event: RandomEvent, userChoice: string): EventProcessResult {
    try {
      // 这里可以根据事件类型和用户选择处理不同的结果
      // 目前返回基本的结果信息
      console.log(`处理事件 "${event.name}" 的用户选择: ${userChoice}`);
      return {
        success: true,
        message: `事件 "${event.name}" 处理完成`,
        rewards: event.rewards || [],
        penalties: event.penalties || [],
      };
    } catch (error) {
      console.error('处理事件结果失败:', error);
      return {
        success: false,
        message: '处理事件结果时发生错误',
      };
    }
  }
}
