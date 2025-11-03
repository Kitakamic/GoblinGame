/**
 * 行动力服务
 * 管理行动力的消耗和恢复
 */

import { modularSaveManager } from '../存档系统/模块化存档服务';

export interface ActionCost {
  actionType: string;
  cost: number;
  description: string;
}

export class ActionPointsService {
  // 行动力消耗配置
  private static readonly ACTION_COSTS: Record<string, ActionCost> = {
    // 探索相关
    scoutLocation: {
      actionType: 'scoutLocation',
      cost: 1,
      description: '侦察据点',
    },
    attackLocation: {
      actionType: 'attackLocation',
      cost: 1,
      description: '进攻据点',
    },
    sendScoutTeam: {
      actionType: 'sendScoutTeam',
      cost: 1,
      description: '派出侦察队',
    },
    // 调教相关
    singleTraining: {
      actionType: 'singleTraining',
      cost: 1,
      description: '调教',
    },
    singleBreeding: {
      actionType: 'singleBreeding',
      cost: 1,
      description: '生育',
    },
    batchTraining: {
      actionType: 'batchTraining',
      cost: 1,
      description: '全部调教',
    },
    batchBreeding: {
      actionType: 'batchBreeding',
      cost: 1,
      description: '全部生育',
    },
  };

  /**
   * 检查是否有足够的行动力
   */
  static hasEnoughActionPoints(actionType: string): boolean {
    const cost = this.ACTION_COSTS[actionType];
    if (!cost) {
      console.warn(`未知的行动类型: ${actionType}`);
      return false;
    }

    const currentActionPoints = modularSaveManager.resources.value.actionPoints;
    const hasEnough = currentActionPoints >= cost.cost;

    console.log(
      `行动力检查 - 类型: ${actionType}, 需要: ${cost.cost}, 当前: ${currentActionPoints}, 足够: ${hasEnough}`,
    );

    return hasEnough;
  }

  /**
   * 消耗行动力
   */
  static consumeActionPoints(actionType: string): boolean {
    const cost = this.ACTION_COSTS[actionType];
    if (!cost) {
      console.warn(`未知的行动类型: ${actionType}`);
      return false;
    }

    if (!this.hasEnoughActionPoints(actionType)) {
      console.warn(`行动力不足: 需要 ${cost.cost}，当前 ${modularSaveManager.resources.value.actionPoints}`);
      return false;
    }

    const success = modularSaveManager.consumeResource('actionPoints', cost.cost, cost.description);
    if (success) {
      console.log(`消耗行动力: ${cost.description} (-${cost.cost})`);
    }
    return success;
  }

  /**
   * 返还行动力（用于失败情况）
   */
  static refundActionPoints(actionType: string): boolean {
    const cost = this.ACTION_COSTS[actionType];
    if (!cost) {
      console.warn(`未知的行动类型: ${actionType}`);
      return false;
    }

    const maxActionPoints = modularSaveManager.resources.value.maxActionPoints;
    const currentActionPoints = modularSaveManager.resources.value.actionPoints;

    // 确保不超过上限
    const refundAmount = Math.min(cost.cost, maxActionPoints - currentActionPoints);

    if (refundAmount > 0) {
      const success = modularSaveManager.addResource('actionPoints', refundAmount, `${cost.description}失败返还`);
      if (success) {
        console.log(`返还行动力: ${cost.description} (+${refundAmount})`);
      }
      return success;
    }

    return true; // 如果已经满行动力，也算成功
  }

  /**
   * 获取行动力消耗信息
   */
  static getActionCost(actionType: string): ActionCost | null {
    return this.ACTION_COSTS[actionType] || null;
  }

  /**
   * 获取当前行动力状态
   */
  static getActionPointsStatus(): { current: number; max: number; remaining: number } {
    const current = modularSaveManager.resources.value.actionPoints;
    const max = modularSaveManager.resources.value.maxActionPoints;
    return {
      current,
      max,
      remaining: max - current,
    };
  }

  /**
   * 获取行动力不足的提示信息
   */
  static getInsufficientActionPointsMessage(actionType: string): string {
    const cost = this.ACTION_COSTS[actionType];
    if (!cost) {
      return `未知的行动类型: ${actionType}`;
    }

    const current = modularSaveManager.resources.value.actionPoints;
    return `行动力不足！${cost.description}需要 ${cost.cost} 点行动力，当前只有 ${current} 点`;
  }
}

// 导出单例
export const actionPointsService = ActionPointsService;
