import { modularSaveManager } from '../存档系统/模块化存档服务';
import type { BaseResources } from '../存档系统/模块化存档类型';
import { CharacterLevelUpService } from './人物升级服务';

/**
 * 哥布林类型配置
 */
export interface GoblinType {
  id: keyof BaseResources;
  name: string;
  icon: string;
  requiredAmount: number; // 每升1级需要的固定数量
}

/**
 * 献祭的哥布林数量
 */
export interface SacrificeAmounts {
  normalGoblins: number;
  warriorGoblins: number;
  shamanGoblins: number;
  paladinGoblins: number;
}

/**
 * 献祭结果
 */
export interface SacrificeResult {
  success: boolean;
  oldLevel: number;
  newLevel: number;
  characterName?: string;
  message?: string;
}

/**
 * 献祭服务
 * 负责处理献祭哥布林升级的相关逻辑
 */
export class SacrificeService {
  /**
   * 哥布林类型配置
   * 每升1级需要的固定数量（根据稀有度设置）
   */
  static readonly GOBLIN_TYPES: GoblinType[] = [
    { id: 'normalGoblins', name: '普通哥布林', icon: '👹', requiredAmount: 100 }, // 最常见，需要最多
    { id: 'warriorGoblins', name: '哥布林战士', icon: '⚔️', requiredAmount: 20 }, // 较稀有
    { id: 'shamanGoblins', name: '哥布林萨满', icon: '🔮', requiredAmount: 10 }, // 稀有
    { id: 'paladinGoblins', name: '哥布林圣骑士', icon: '🛡️', requiredAmount: 5 }, // 最稀有，需要最少
  ];

  /**
   * 获取指定类型的哥布林数量
   */
  static getGoblinCount(goblinTypeId: keyof BaseResources): number {
    const resources = modularSaveManager.resources.value;
    return resources[goblinTypeId] || 0;
  }

  /**
   * 检查献祭数量是否满足升1级的条件
   * 只需要满足任意一种类型的固定数量要求即可升1级
   * @param sacrificeAmounts 献祭数量
   * @returns 是否满足升1级条件，以及满足的类型
   */
  static checkCanLevelUp(sacrificeAmounts: SacrificeAmounts): {
    canLevelUp: boolean;
    satisfiedType?: GoblinType;
  } {
    for (const type of this.GOBLIN_TYPES) {
      const amount = sacrificeAmounts[type.id as keyof SacrificeAmounts] || 0;
      if (amount >= type.requiredAmount) {
        return {
          canLevelUp: true,
          satisfiedType: type,
        };
      }
    }
    return { canLevelUp: false };
  }

  /**
   * 计算献祭可以升多少级
   * 每种类型独立计算，叠加总和
   * @param sacrificeAmounts 献祭数量
   * @returns 可以升级的等级数
   */
  static calculateLevelUps(sacrificeAmounts: SacrificeAmounts): number {
    let totalLevelUps = 0;
    for (const type of this.GOBLIN_TYPES) {
      const amount = sacrificeAmounts[type.id as keyof SacrificeAmounts] || 0;
      const levelUps = Math.floor(amount / type.requiredAmount);
      totalLevelUps += levelUps;
    }
    return totalLevelUps;
  }

  /**
   * 计算每种类型可以升多少级（用于显示详细信息）
   * @param sacrificeAmounts 献祭数量
   * @returns 每种类型的升级信息
   */
  static calculateLevelUpsByType(sacrificeAmounts: SacrificeAmounts): Array<{
    type: GoblinType;
    amount: number;
    levelUps: number;
  }> {
    const results: Array<{ type: GoblinType; amount: number; levelUps: number }> = [];
    for (const type of this.GOBLIN_TYPES) {
      const amount = sacrificeAmounts[type.id as keyof SacrificeAmounts] || 0;
      if (amount > 0) {
        const levelUps = Math.floor(amount / type.requiredAmount);
        results.push({ type, amount, levelUps });
      }
    }
    return results;
  }

  /**
   * 验证献祭数量是否有效
   * @param sacrificeAmounts 献祭数量
   * @returns 验证结果和错误信息
   */
  static validateSacrificeAmounts(sacrificeAmounts: SacrificeAmounts): {
    valid: boolean;
    error?: string;
  } {
    for (const type of this.GOBLIN_TYPES) {
      const amount = sacrificeAmounts[type.id as keyof SacrificeAmounts] || 0;
      const available = this.getGoblinCount(type.id);
      if (amount > available) {
        return {
          valid: false,
          error: `${type.name}数量不足（需要 ${amount}，可用 ${available}）`,
        };
      }
      if (amount < 0) {
        return {
          valid: false,
          error: `${type.name}数量不能为负数`,
        };
      }
    }
    return { valid: true };
  }

  /**
   * 执行献祭
   * @param characterId 目标人物ID
   * @param sacrificeAmounts 献祭的哥布林数量
   * @returns 献祭结果
   */
  static performSacrifice(characterId: string, sacrificeAmounts: SacrificeAmounts): SacrificeResult {
    try {
      // 验证献祭数量
      const validation = this.validateSacrificeAmounts(sacrificeAmounts);
      if (!validation.valid) {
        const currentLevel = CharacterLevelUpService.getCharacterLevel(characterId);
        return {
          success: false,
          oldLevel: currentLevel,
          newLevel: currentLevel,
          message: validation.error,
        };
      }

      // 检查是否满足升1级条件
      const levelUpCheck = this.checkCanLevelUp(sacrificeAmounts);
      if (!levelUpCheck.canLevelUp) {
        const currentLevel = CharacterLevelUpService.getCharacterLevel(characterId);
        const requiredInfo = this.GOBLIN_TYPES.map(t => `${t.name}需要${t.requiredAmount}只`).join('、');
        return {
          success: false,
          oldLevel: currentLevel,
          newLevel: currentLevel,
          message: `献祭数量不足，无法升级。需要满足以下条件之一：${requiredInfo}`,
        };
      }

      // 先计算可以升多少级，确保能够升级再消耗资源
      const calculatedLevelUps = this.calculateLevelUps(sacrificeAmounts);
      if (calculatedLevelUps <= 0) {
        const currentLevel = CharacterLevelUpService.getCharacterLevel(characterId);
        const requiredInfo = this.GOBLIN_TYPES.map(t => `${t.name}需要${t.requiredAmount}只`).join('、');
        return {
          success: false,
          oldLevel: currentLevel,
          newLevel: currentLevel,
          message: `献祭数量不足，无法升级。需要满足以下条件之一：${requiredInfo}`,
        };
      }

      // 消耗哥布林资源
      const resourceChanges = this.GOBLIN_TYPES.map(type => {
        const amount = sacrificeAmounts[type.id as keyof SacrificeAmounts] || 0;
        if (amount > 0) {
          return {
            type: type.id,
            amount: amount,
            reason: '献祭哥布林',
          };
        }
        return null;
      }).filter(Boolean) as Array<{
        type: keyof BaseResources;
        amount: number;
        reason: string;
      }>;

      if (!modularSaveManager.consumeResources(resourceChanges)) {
        const currentLevel = CharacterLevelUpService.getCharacterLevel(characterId);
        return {
          success: false,
          oldLevel: currentLevel,
          newLevel: currentLevel,
          message: '消耗哥布林资源失败',
        };
      }

      // 执行献祭升级（此时资源已消耗，确保升级成功）
      const result = CharacterLevelUpService.sacrificeGoblinsForLevel(characterId, sacrificeAmounts);

      return {
        success: result.success,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
        characterName: result.message?.split(' ')[0], // 提取人物名称
        message: result.message,
      };
    } catch (error) {
      console.error('献祭失败:', error);
      const currentLevel = CharacterLevelUpService.getCharacterLevel(characterId);
      return {
        success: false,
        oldLevel: currentLevel,
        newLevel: currentLevel,
        message: `献祭失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取献祭提示信息
   */
  static getSacrificeMessage(
    characterId: string,
    sacrificeAmounts: SacrificeAmounts,
  ): {
    totalAmount: number;
    levelUps: number;
    predictedLevel: number;
    canLevelUp: boolean;
    message: string;
  } {
    const currentLevel = CharacterLevelUpService.getCharacterLevel(characterId);
    const totalAmount =
      sacrificeAmounts.normalGoblins +
      sacrificeAmounts.warriorGoblins +
      sacrificeAmounts.shamanGoblins +
      sacrificeAmounts.paladinGoblins;
    const levelUps = this.calculateLevelUps(sacrificeAmounts);
    const predictedLevel = currentLevel + levelUps;
    const canLevelUp = levelUps > 0;

    let message = '';
    if (canLevelUp) {
      message = `将升级至等级 ${predictedLevel}（提升${levelUps}级）`;
    } else {
      const requiredInfo = this.GOBLIN_TYPES.map(t => `${t.name}需要${t.requiredAmount}只`).join('、');
      message = `数量不足，无法升级。需要满足以下条件之一：${requiredInfo}`;
    }

    return {
      totalAmount,
      levelUps,
      predictedLevel,
      canLevelUp,
      message,
    };
  }
}
