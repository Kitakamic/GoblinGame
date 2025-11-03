/**
 * 资源格式化服务
 * 提供资源相关的格式化、显示工具函数
 */
export class ResourceFormatService {
  /**
   * 格式化数字显示（支持 k, m, b）
   * @param num 要格式化的数字
   * @returns 格式化后的字符串
   */
  static formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }

    const absNum = Math.abs(num);

    if (absNum >= 1000000000) {
      return (absNum / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    } else if (absNum >= 1000000) {
      return (absNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    } else if (absNum >= 1000) {
      return (absNum / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return Math.floor(absNum).toString();
  }

  /**
   * 获取资源图标
   * @param type 资源类型
   * @returns 资源图标（emoji）
   */
  static getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
      gold: '💰',
      food: '🍖',
      threat: '⚠️',
      slaves: '🔒',
      normalGoblins: '👺',
      warriorGoblins: '⚔️',
      shamanGoblins: '🔮',
      paladinGoblins: '✨',
      trainingSlaves: '💋',
      rounds: '🔄',
    };
    return icons[type] || '❓';
  }

  /**
   * 获取资源名称
   * @param type 资源类型
   * @returns 资源中文名称
   */
  static getResourceName(type: string): string {
    const names: Record<string, string> = {
      gold: '金钱',
      food: '食物',
      threat: '威胁度',
      slaves: '俘虏',
      normalGoblins: '普通哥布林',
      warriorGoblins: '战士哥布林',
      shamanGoblins: '萨满哥布林',
      paladinGoblins: '圣骑士哥布林',
      trainingSlaves: '调教人物',
      rounds: '回合',
    };
    return names[type] || type;
  }

  /**
   * 获取稀有度系数
   * @param rating 稀有度等级 (S, A, B, C, D)
   * @returns 稀有度系数
   */
  static getRarityMultiplier(rating: string): number {
    const multipliers: Record<string, number> = {
      S: 3,
      A: 2.5,
      B: 2,
      C: 1.5,
      D: 1,
    };
    return multipliers[rating] || 1;
  }

  /**
   * 将哥布林类型映射到资源名称
   * @param goblinType 哥布林类型（中文）
   * @returns 资源类型（英文）
   */
  static mapGoblinTypeToResource(goblinType: string): string {
    const mapping: Record<string, string> = {
      普通哥布林: 'normalGoblins',
      哥布林战士: 'warriorGoblins',
      哥布林萨满: 'shamanGoblins',
      哥布林圣骑士: 'paladinGoblins',
    };
    return mapping[goblinType] || goblinType;
  }
}
