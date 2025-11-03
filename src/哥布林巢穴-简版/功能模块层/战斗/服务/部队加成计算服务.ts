/**
 * 部队加成计算服务
 * 负责计算部队属性加成，包含递减机制和评级系数
 */

/**
 * 计算部队属性加成（无递减，用于我方单位）
 * @param troopCount 部队数量
 * @param baseAttribute 单位基础属性值
 * @param troopLevel 部队等级（用于计算等级加成）
 * @returns 计算后的加成值
 */
export function calculateTroopBonus(troopCount: number, baseAttribute: number, troopLevel: number = 10): number {
  if (troopCount <= 0 || baseAttribute <= 0) return 0;

  // 计算等级加成比例（最高等级10，加成比例 = level/10）
  const troopMultiplier = Math.min(troopLevel, 10) / 10;
  const baseBonusPerTroop = baseAttribute * troopMultiplier;

  // 线性计算，无递减
  return Math.floor(troopCount * baseBonusPerTroop);
}

/**
 * 计算带递减机制的部队属性加成（用于敌方单位）
 * @param troopCount 部队数量
 * @param baseAttribute 单位基础属性值
 * @param troopLevel 部队等级（用于计算等级加成）
 * @param options 可选配置
 * @returns 计算后的加成值
 */
export function calculateTroopBonusWithDecay(
  troopCount: number,
  baseAttribute: number,
  troopLevel: number = 10,
  options: {
    threshold?: number; // 递减阈值，默认1000
    decayRate?: number; // 每100人递减率，默认0.05（5%）
    minEfficiency?: number; // 最低效率，默认0.5（50%）
  } = {},
): number {
  if (troopCount <= 0 || baseAttribute <= 0) return 0;

  const {
    threshold = 500, // 超过600人开始递减
    decayRate = 0.07, // 每100人递减7.5%（让1000人时总效率约70%）
    minEfficiency = 0.1, // 最低10%效率
  } = options;

  // 计算等级加成比例（最高等级10，加成比例 = level/10）
  const troopMultiplier = Math.min(troopLevel, 10) / 10;
  const baseBonusPerTroop = baseAttribute * troopMultiplier;

  // 如果部队数量在阈值内，正常计算
  if (troopCount <= threshold) {
    return Math.floor(troopCount * baseBonusPerTroop);
  }

  // 超出阈值部分，计算递减
  const normalCount = threshold;
  const excessCount = troopCount - threshold;

  // 计算超出部分的递减效率
  const decaySteps = Math.floor(excessCount / 100); // 每100人一个递减阶梯
  const efficiency = Math.max(minEfficiency, 1 - decaySteps * decayRate);

  // 阈值内的正常加成 + 超出部分的递减加成
  const normalBonus = normalCount * baseBonusPerTroop;
  const excessBonus = excessCount * baseBonusPerTroop * efficiency;

  return Math.floor(normalBonus + excessBonus);
}

/**
 * 获取评级对应的等级系数
 * @param rating 人物评级
 * @returns 等级系数（用于计算可携带部队数量）
 */
export function getRatingLevelMultiplier(rating: string): number {
  const multiplierMap: Record<string, number> = {
    S: 2.0, // S级：2倍
    A: 1.5, // A级：1.5倍
    B: 1.2, // B级：1.2倍
    C: 1.0, // C级：1倍
    D: 0.8, // D级：0.8倍
  };
  return multiplierMap[rating] || 1.0;
}

/**
 * 计算普通哥布林的最大数量
 * @param level 人物等级
 * @param rating 人物评级
 * @returns 最大普通哥布林数量
 */
export function calculateMaxNormalGoblins(level: number, rating: string): number {
  const multiplier = getRatingLevelMultiplier(rating);
  return Math.floor(level * multiplier * 10);
}

/**
 * 计算特殊哥布林的最大数量（战士/萨满/圣骑士总计）
 * @param level 人物等级
 * @param rating 人物评级
 * @returns 最大特殊哥布林数量
 */
export function calculateMaxSpecialGoblins(level: number, rating: string): number {
  const multiplier = getRatingLevelMultiplier(rating);
  return Math.floor(level * multiplier);
}
