import {
  EventHistory,
  EventProcessResult,
  EventRarity,
  EventTriggerResult,
  EventType,
  RandomEvent,
} from '../类型/事件类型';
import { roundStartEvents } from '../配置/回合开始事件';

/**
 * 随机事件服务
 * 负责管理随机事件的触发、处理和存储
 */
export class RandomEventService {
  private static instance: RandomEventService;
  private registeredEvents: Map<string, RandomEvent> = new Map();
  private eventHistory: EventHistory[] = []; // 改为存储详细的历史记录

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
    // 获取所有可用的事件（包括所有类型的事件）
    const availableEvents = this.getAllEvents().filter(event => this.isEventAvailable(event, currentRound, gameState));

    if (availableEvents.length === 0) {
      return { triggered: false, reason: '没有可用的事件' };
    }

    // 优先检查初见事件（初次接触时直接触发）
    const firstContactEvents = availableEvents.filter(event => event.trigger.triggerOnFirstContact);
    if (firstContactEvents.length > 0) {
      const selectedEvent = firstContactEvents[0]; // 选择第一个初见事件
      this.recordEventTrigger(selectedEvent, currentRound);
      console.log(`触发初见事件: ${selectedEvent.name}`);
      return { triggered: true, event: selectedEvent };
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
        this.recordEventTrigger(selectedEvent, currentRound);
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

    // 检查大陆征服度条件
    if (trigger.requiredContinentConquest && gameState) {
      const { continentName, minConquestProgress } = trigger.requiredContinentConquest;
      if (!gameState.continents || !gameState.continents[continentName]) {
        return false;
      }
      const continentConquestProgress = gameState.continents[continentName].conquestProgress || 0;
      if (continentConquestProgress < minConquestProgress) {
        return false;
      }
    }

    // 检查是否只触发一次（如果已经触发过则不再触发）
    if (trigger.triggerOnce && this.hasEventTriggered(event.id)) {
      return false;
    }

    // 检查CD冷却时间
    if (trigger.cooldownRounds && this.isEventInCooldown(event.id, currentRound)) {
      return false;
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
   * 记录事件触发
   */
  private recordEventTrigger(event: RandomEvent, currentRound: number): void {
    const cooldownRounds = event.trigger.cooldownRounds || 0;
    const cooldownUntil = cooldownRounds > 0 ? currentRound + cooldownRounds : undefined;

    this.eventHistory.push({
      eventId: event.id,
      triggerRound: currentRound,
      cooldownUntil: cooldownUntil,
    });

    console.log(
      `记录事件触发: ${event.name} (第${currentRound}回合)${cooldownUntil ? `, CD到第${cooldownUntil}回合` : ''}`,
    );
  }

  /**
   * 检查事件是否已触发过
   */
  private hasEventTriggered(eventId: string): boolean {
    return this.eventHistory.some(history => history.eventId === eventId);
  }

  /**
   * 检查事件是否在CD中
   */
  private isEventInCooldown(eventId: string, currentRound: number): boolean {
    const eventHistory = this.eventHistory.find(history => history.eventId === eventId);
    if (!eventHistory || !eventHistory.cooldownUntil) {
      return false;
    }

    const isInCooldown = currentRound < eventHistory.cooldownUntil;
    if (isInCooldown) {
      console.log(`事件 ${eventId} 在CD中，冷却到第${eventHistory.cooldownUntil}回合 (当前第${currentRound}回合)`);
    }

    return isInCooldown;
  }

  /**
   * 获取事件CD状态
   */
  public getEventCooldownStatus(
    eventId: string,
    currentRound: number,
  ): { inCooldown: boolean; cooldownUntil?: number; remainingRounds?: number } {
    const eventHistory = this.eventHistory.find(history => history.eventId === eventId);
    if (!eventHistory || !eventHistory.cooldownUntil) {
      return { inCooldown: false };
    }

    const inCooldown = currentRound < eventHistory.cooldownUntil;
    const remainingRounds = inCooldown ? eventHistory.cooldownUntil - currentRound : 0;

    return {
      inCooldown,
      cooldownUntil: eventHistory.cooldownUntil,
      remainingRounds: remainingRounds > 0 ? remainingRounds : undefined,
    };
  }

  /**
   * 清理过期的CD记录（可选优化）
   */
  public cleanupExpiredCooldowns(currentRound: number): void {
    this.eventHistory = this.eventHistory.filter(history => {
      if (history.cooldownUntil && currentRound >= history.cooldownUntil) {
        console.log(`清理过期CD: ${history.eventId} (CD已结束)`);
        return false;
      }
      return true;
    });
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
