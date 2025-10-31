import type { BreedingRecord, BreedingResult, GoblinType } from '../人物管理/类型/人物类型';

// 生育服务类
export class BreedingService {
  /**
   * 计算单个角色的生育结果
   * @param character 角色信息
   * @param currentRound 当前回合数
   * @returns 生育结果
   */
  static calculateBreeding(character: any, currentRound: number): BreedingResult {
    const records: BreedingRecord[] = [];
    let totalOffspring = 0;

    // 基础生育数量计算（受忠诚度和生育值加成）
    const loyaltyBonus = Math.floor(character.loyalty / 15); // 每15点忠诚度+1点加成（提高忠诚度影响）
    const fertilityBonus = Math.floor(character.fertility / 40); // 每25点生育值+1点加成（因为生育值范围是0-200）
    const totalBonus = loyaltyBonus + fertilityBonus;

    // 根据角色评级决定可生育的哥布林类型
    const canBreedAll = character.rating === 'S' || character.rating === 'A';
    const canBreedWarrior = canBreedAll || ['B', 'C', 'D'].includes(character.rating);

    // 普通哥布林 (所有角色都可以生育)
    const normalGoblins = this.calculateGoblinCount(5, 10, totalBonus);
    if (normalGoblins > 0) {
      records.push({
        type: '普通哥布林',
        count: normalGoblins,
        date: new Date(),
        round: currentRound,
      });
      totalOffspring += normalGoblins;
    }

    // 哥布林战士 (B级以上角色可以生育)
    if (canBreedWarrior) {
      const warriorGoblins = this.calculateGoblinCount(3, 5, totalBonus);
      if (warriorGoblins > 0) {
        records.push({
          type: '哥布林战士',
          count: warriorGoblins,
          date: new Date(),
          round: currentRound,
        });
        totalOffspring += warriorGoblins;
      }
    }

    // 哥布林萨满 (只有S和A级角色可以生育)
    if (canBreedAll) {
      const shamanGoblins = this.calculateGoblinCount(2, 4, totalBonus);
      if (shamanGoblins > 0) {
        records.push({
          type: '哥布林萨满',
          count: shamanGoblins,
          date: new Date(),
          round: currentRound,
        });
        totalOffspring += shamanGoblins;
      }
    }

    // 哥布林圣骑士 (只有S和A级角色可以生育)
    if (canBreedAll) {
      const paladinGoblins = this.calculateGoblinCount(1, 3, totalBonus);
      if (paladinGoblins > 0) {
        records.push({
          type: '哥布林圣骑士',
          count: paladinGoblins,
          date: new Date(),
          round: currentRound,
        });
        totalOffspring += paladinGoblins;
      }
    }

    return {
      characterId: character.id,
      characterName: character.name,
      totalOffspring,
      records,
    };
  }

  /**
   * 计算特定类型哥布林的数量
   * @param minCount 最小数量
   * @param maxCount 最大数量
   * @param bonus 加成值
   * @returns 实际数量
   */
  private static calculateGoblinCount(minCount: number, maxCount: number, bonus: number): number {
    const baseCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    const bonusCount = Math.floor(bonus / 2); // 每2点加成+1个
    return Math.max(0, baseCount + bonusCount);
  }

  /**
   * 获取角色评级对应的生育权限描述
   * @param rating 角色评级
   * @returns 生育权限描述
   */
  static getBreedingPermissions(rating: string): string {
    switch (rating) {
      case 'S':
      case 'A':
        return '可生育：普通哥布林、哥布林战士、哥布林萨满、哥布林圣骑士';
      case 'B':
      case 'C':
      case 'D':
        return '可生育：普通哥布林、哥布林战士';
      default:
        return '可生育：普通哥布林';
    }
  }

  /**
   * 格式化生育记录为可读文本
   * @param records 生育记录数组
   * @returns 格式化后的文本
   */
  static formatBreedingRecords(records: BreedingRecord[]): string {
    if (records.length === 0) return '无生育记录';

    return records.map(record => `${record.type} x${record.count}`).join('、');
  }

  /**
   * 获取生育记录统计
   * @param records 生育记录数组
   * @returns 统计信息
   */
  static getBreedingStats(records: BreedingRecord[]): { [key in GoblinType]: number } {
    const stats: { [key in GoblinType]: number } = {
      普通哥布林: 0,
      哥布林战士: 0,
      哥布林萨满: 0,
      哥布林圣骑士: 0,
    };

    records.forEach(record => {
      stats[record.type] += record.count;
    });

    return stats;
  }

  /**
   * 处理奴隶生育逻辑
   * @param slaveCount 奴隶数量
   * @param currentRound 当前回合数（预留参数，未来可能用于影响生育率）
   * @returns 奴隶生育结果
   */
  static processSlaveBreeding(
    slaveCount: number,
    _currentRound: number,
  ): {
    newGoblins: number;
    deadSlaves: number;
    remainingSlaves: number;
    messages: string[];
  } {
    if (slaveCount <= 0) {
      return {
        newGoblins: 0,
        deadSlaves: 0,
        remainingSlaves: 0,
        messages: ['没有奴隶，无法生育'],
      };
    }

    const messages: string[] = [];

    // 降低奴隶生育率：每个奴隶生育2-4个普通哥布林（原来是5-10个）
    const goblinsPerSlave = Math.floor(Math.random() * 3) + 2; // 2-4个
    const totalNewGoblins = slaveCount * goblinsPerSlave;

    // 提高奴隶死亡率：40-70%（原来是20-40%）
    const deathRate = (Math.random() * 0.3 + 0.4) * 100; // 40-70%
    const deadSlaves = Math.floor((slaveCount * deathRate) / 100);
    const remainingSlaves = slaveCount - deadSlaves;

    messages.push(`奴隶们生育了 ${totalNewGoblins} 个普通哥布林`);
    messages.push(`${deadSlaves} 个奴隶死亡 (死亡率: ${deathRate.toFixed(1)}%)`);
    messages.push(`剩余奴隶: ${remainingSlaves} 个`);

    return {
      newGoblins: totalNewGoblins,
      deadSlaves,
      remainingSlaves,
      messages,
    };
  }

  /**
   * 格式化奴隶生育结果为可读文本
   * @param result 奴隶生育结果
   * @returns 格式化后的文本
   */
  static formatSlaveBreedingResult(result: {
    newGoblins: number;
    deadSlaves: number;
    remainingSlaves: number;
    messages: string[];
  }): string {
    return result.messages.join('；');
  }
}
