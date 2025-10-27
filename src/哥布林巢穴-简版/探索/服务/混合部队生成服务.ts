import type { Character } from '../../人物管理/类型/人物类型';
import { getUnitsByRace } from '../../战斗/类型/单位数据表';
import type { EnemyUnit, Location } from '../类型/探索类型';

/**
 * 混合部队生成服务
 * 根据据点信息生成多样化的敌方部队构成
 */
export class MixedTroopGenerationService {
  /**
   * 种族肖像库 - 仅为据点生成的特殊单位提供基于种族的随机肖像选择
   * 注意：人物（英雄单位）和普通单位使用自己的独特肖像，不使用此肖像库
   * 用户可以在这里添加各种族的肖像URL链接
   */
  private static readonly RACE_PORTRAIT_LIBRARY: Record<string, string[]> = {
    人类: [
      'https://kitakamis.online/comunit_portaits/人类通用单位1.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位2.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位3.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位4.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位5.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位6.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位7.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位8.png',
      'https://kitakamis.online/comunit_portaits/人类通用单位9.png',
    ],
    永恒精灵: [
      'https://kitakamis.online/comunit_portaits/永恒精灵通用单位1.png',
      'https://kitakamis.online/comunit_portaits/永恒精灵通用单位2.png',
      'https://kitakamis.online/comunit_portaits/永恒精灵通用单位3.png',
      'https://kitakamis.online/comunit_portaits/永恒精灵通用单位4.png',
    ],
    黑暗精灵: [
      'https://kitakamis.online/comunit_portaits/黑暗精灵通用单位1.png',
      'https://kitakamis.online/comunit_portaits/黑暗精灵通用单位2.png',
      'https://kitakamis.online/comunit_portaits/黑暗精灵通用单位3.png',
      'https://kitakamis.online/comunit_portaits/黑暗精灵通用单位4.png',
      'https://kitakamis.online/comunit_portaits/黑暗精灵通用单位5.png',
      'https://kitakamis.online/comunit_portaits/黑暗精灵通用单位6.png',
    ],
    狐族: [
      'https://kitakamis.online/comunit_portaits/狐族通用单位1.png',
      'https://kitakamis.online/comunit_portaits/狐族通用单位2.png',
      'https://kitakamis.online/comunit_portaits/狐族通用单位3.png',
      'https://kitakamis.online/comunit_portaits/狐族通用单位4.png',
      'https://kitakamis.online/comunit_portaits/狐族通用单位5.png',
    ],
    亡灵: [
      'https://kitakamis.online/comunit_portaits/亡灵通用单位1.png',
      'https://kitakamis.online/comunit_portaits/亡灵通用单位2.png',
      'https://kitakamis.online/comunit_portaits/亡灵通用单位3.png',
      'https://kitakamis.online/comunit_portaits/亡灵通用单位4.png',
    ],
    魔族: [
      'https://kitakamis.online/comunit_portaits/魔族通用单位1.png',
      'https://kitakamis.online/comunit_portaits/魔族通用单位2.png',
      'https://kitakamis.online/comunit_portaits/魔族通用单位3.png',
      'https://kitakamis.online/comunit_portaits/魔族通用单位4.png',
    ],
    天使: [
      'https://kitakamis.online/comunit_portaits/天使通用单位1.png',
      'https://kitakamis.online/comunit_portaits/天使通用单位2.png',
      'https://kitakamis.online/comunit_portaits/天使通用单位3.png',
      'https://kitakamis.online/comunit_portaits/天使通用单位4.png',
    ],
  };
  /**
   * 为据点生成混合部队
   * @param location 据点信息
   * @param baseGuards 基础守军总人数
   * @param specialUnit 特殊单位信息（可选）
   * @param currentTurn 当前回合数（用于难度调整）
   * @returns 生成的敌方单位数组
   */
  static generateMixedTroops(
    location: Location,
    baseGuards: number,
    specialUnit?: {
      name: string;
      race: string;
      unitType: string;
      troopCount: number;
      attributes: {
        attack: number;
        defense: number;
        intelligence: number;
        speed: number;
        health: number;
      };
    },
    currentTurn: number = 1,
  ): EnemyUnit[] {
    const { type, difficulty, race } = location;

    console.log(`🚀 [混合部队生成] 开始生成混合部队:`, {
      据点: location.name,
      类型: type,
      难度: difficulty,
      种族: race,
      基础守军: baseGuards,
      特殊单位: !!specialUnit,
      英雄数量: location.rewards?.heroes?.length || 0,
    });

    // 计算实际守军数量（考虑回合数影响）
    const adjustedGuards = this.calculateAdjustedGuards(baseGuards, difficulty, currentTurn);
    console.log(`🔍 [混合部队生成] 调整后守军数量:`, adjustedGuards);

    // 确定部队种类数量
    const troopTypesCount = this.determineTroopTypesCount(difficulty, type, !!specialUnit);

    // 获取主要种族的单位数据
    const primaryRaceUnits = getUnitsByRace(race || '人类');
    console.log(`🔍 [混合部队生成] 获取到的种族单位数据:`, {
      种族: race || '人类',
      单位数量: primaryRaceUnits.length,
      单位列表: primaryRaceUnits.map(u => ({ id: u.id, name: u.name, level: u.level })),
    });

    // 生成基础部队构成
    const troopComposition = this.generateTroopComposition(
      adjustedGuards,
      troopTypesCount,
      primaryRaceUnits,
      difficulty,
      specialUnit,
      location,
    );

    // 为所有单位分配部下类型（在创建敌方单位之前）
    this.assignTroopTypesToUnits(troopComposition);

    console.log(`[混合部队生成] 部下分配完成:`, {
      单位详情: troopComposition.map(unit => ({
        名称: unit.name,
        部队数量: unit.troopCount,
        部下类型: (unit as any).troops?.type || '无',
        部下数量: (unit as any).troops?.count || 0,
      })),
    });

    // 创建敌方单位
    const enemyUnits: EnemyUnit[] = [];

    for (let i = 0; i < troopComposition.length; i++) {
      const composition = troopComposition[i];
      const unit = this.createEnemyUnit(composition, location.id, i);
      if (unit) {
        enemyUnits.push(unit);
      }
    }

    return enemyUnits;
  }

  /**
   * 计算调整后的守军数量
   */
  private static calculateAdjustedGuards(baseGuards: number, difficulty: number, currentTurn: number): number {
    // 根据回合数调整难度
    const turnMultiplier = Math.min(1 + (currentTurn - 1) * 0.1, 2.0); // 最多2倍

    // 根据难度调整
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    return Math.floor(baseGuards * turnMultiplier * difficultyMultiplier);
  }

  /**
   * 获取难度倍数
   */
  private static getDifficultyMultiplier(difficulty: number): number {
    // 根据星级计算倍数：1星=0.8倍，10星=1.8倍
    return 0.7 + (difficulty - 1) * 0.1;
  }

  /**
   * 确定部队种类数量
   */
  private static determineTroopTypesCount(difficulty: number, type: string, hasSpecialUnit: boolean): number {
    const maxTypes = hasSpecialUnit ? 5 : 6; // 如果有特殊单位，最多5种，否则6种

    // 根据难度和类型确定种类数量
    let baseCount = 2;

    // 根据星级难度调整：1-2星=3种，3-4星=4种，5-6星=5种，7-8星=6种，9-10星=6种
    // 提高低难度据点的类型数量，避免部队分配不足
    if (difficulty <= 2) {
      baseCount = 3; // 从2改为3，确保有基础部队
    } else if (difficulty <= 4) {
      baseCount = 4;
    } else if (difficulty <= 6) {
      baseCount = 5;
    } else if (difficulty <= 8) {
      baseCount = 6;
    } else {
      baseCount = 6;
    }

    // 根据据点类型调整（高级据点增加兵种类型）
    const highLevelTypes = [
      'city',
      'dark_spire',
      'dark_fortress',
      'imperial_city',
      'border_fortress',
      'tree_city',
      'elven_temple',
      'canopy_palace',
      'warship_dock',
      'cathedral',
    ];
    if (highLevelTypes.includes(type)) {
      baseCount = Math.min(baseCount + 1, maxTypes);
    }

    return Math.min(baseCount, maxTypes);
  }

  /**
   * 生成部队构成
   */
  private static generateTroopComposition(
    totalGuards: number,
    troopTypesCount: number,
    primaryRaceUnits: Character[],
    difficulty: number,
    specialUnit?: any,
    location?: Location,
  ): Array<{
    name: string;
    race: string;
    unitType: string;
    troopCount: number;
    level: number;
    attributes: {
      attack: number;
      defense: number;
      intelligence: number;
      speed: number;
      health: number;
    };
  }> {
    const composition: any[] = [];
    let remainingGuards = totalGuards;

    // 处理据点的英雄人物（状态为enemy且可战斗的人物）- 优先级最高
    if (location && location.rewards?.heroes && location.rewards.heroes.length > 0) {
      const enemyHeroes = location.rewards.heroes.filter(hero => hero.status === 'enemy' && hero.canCombat);

      for (const hero of enemyHeroes) {
        // 英雄人物作为队长，分配更多部下（不低于30%）
        const heroTroopPercentage = 0.3 + Math.random() * 0.1; // 30-40%
        const heroTroopCount = Math.max(1, Math.floor(remainingGuards * heroTroopPercentage));

        console.log(`[混合部队生成] 英雄单位 ${hero.name}:`, {
          剩余守军: remainingGuards,
          分配比例: heroTroopPercentage,
          分配数量: heroTroopCount,
          堕落等级: 1,
          兵种定位: this.getUnitTierByLevel(difficulty + 1),
          据点难度: difficulty,
        });

        if (heroTroopCount > 0) {
          // 敌人状态角色的等级固定为1（表示堕落等级）
          const heroLevel = 1;
          // 实际的兵种定位基于据点难度等级+1
          const combatTier = this.getUnitTierByLevel(difficulty + 1);

          // 英雄单位使用自己的独特肖像，不从种族肖像库中选择
          const heroAvatar = hero.avatar || this.getDefaultAvatarByRace(hero.race);

          composition.push({
            name: hero.name,
            race: hero.race,
            class: hero.unitType, // 保持向后兼容
            unitType: hero.unitType, // 添加unitType字段供战斗系统使用
            troopCount: heroTroopCount,
            level: heroLevel, // 固定为1（堕落等级）
            avatar: heroAvatar, // 使用英雄自己的肖像
            attributes: {
              attack: hero.attributes.attack,
              defense: hero.attributes.defense,
              intelligence: hero.attributes.intelligence,
              speed: hero.attributes.speed,
              health: hero.attributes.health,
            },
            // 标记为英雄单位
            isHero: true,
            heroId: hero.id,
            // 添加兵种定位标记（基于据点难度+1）
            tier: combatTier,
            // 标记为队长单位，需要分配部下
            isCaptain: true,
          });
          remainingGuards -= heroTroopCount;
        }
      }
    }

    // 如果有特殊单位，在英雄单位之后分配
    if (specialUnit) {
      // 自动分配特殊单位部队人数（占剩余守军的20-30%）
      const specialTroopPercentage = 0.2 + Math.random() * 0.1; // 20-30%
      const specialTroopCount = Math.max(1, Math.floor(remainingGuards * specialTroopPercentage));

      console.log(`[混合部队生成] 特殊单位 ${specialUnit.name}:`, {
        剩余守军: remainingGuards,
        分配比例: specialTroopPercentage,
        分配数量: specialTroopCount,
      });

      // 特殊单位等级不超过据点的最大等级，但比其他单位稍高
      const maxLevel = this.getUnitLevelForDifficulty(difficulty);
      const specialLevel = Math.min(maxLevel, maxLevel - 1 + Math.floor(maxLevel / 2)); // 特殊单位等级稍高

      // 为特殊单位分配随机肖像（如果没有指定头像）
      const specialUnitAvatar = specialUnit.avatar || this.getRandomPortraitFromLibrary(specialUnit.race);

      console.log(`[混合部队生成] 特殊单位等级:`, {
        据点难度: difficulty,
        据点最大等级: maxLevel,
        特殊单位等级: specialLevel,
      });

      composition.push({
        name: specialUnit.name,
        race: specialUnit.race,
        unitType: specialUnit.unitType, // 使用 unitType 而不是 class
        troopCount: specialTroopCount,
        level: specialLevel,
        avatar: specialUnitAvatar,
        attributes: specialUnit.attributes,
        // 标记为特殊单位
        isSpecial: true,
        // 添加兵种定位标记
        tier: this.getUnitTierByLevel(specialLevel),
        // 标记为队长单位，需要分配部下
        isCaptain: true,
      });
      remainingGuards -= specialTroopCount;
    }

    // 为村落等据点添加民兵单位
    if (location && this.shouldAddMilitia(location)) {
      const militiaUnits = this.getMilitiaUnits(location.race || '人类');
      // 根据难度调整民兵比例
      const militiaPercentage = this.getMilitiaPercentageByDifficulty(difficulty);
      const militiaCount = Math.floor(remainingGuards * militiaPercentage);

      if (militiaCount > 0 && militiaUnits.length > 0) {
        const selectedMilitia = militiaUnits[Math.floor(Math.random() * militiaUnits.length)];

        // 民兵单位使用自己的头像，不从种族肖像库中选择
        const militiaAvatar = selectedMilitia.avatar || this.getDefaultAvatarByRace(selectedMilitia.race);

        composition.push({
          name: selectedMilitia.name,
          race: selectedMilitia.race,
          unitType: selectedMilitia.unitType, // 使用 unitType 而不是 class
          troopCount: militiaCount,
          level: selectedMilitia.level, // 使用实际等级
          avatar: militiaAvatar, // 使用民兵自己的头像
          attributes: {
            attack: selectedMilitia.attributes.attack,
            defense: selectedMilitia.attributes.defense,
            intelligence: selectedMilitia.attributes.intelligence,
            speed: selectedMilitia.attributes.speed,
            health: selectedMilitia.attributes.health,
          },
          // 添加兵种定位标记
          tier: this.getUnitTierByLevel(selectedMilitia.level),
        });
        remainingGuards -= militiaCount;
      }
    }

    // 生成基础部队
    const heroCount =
      location && location.rewards?.heroes
        ? location.rewards.heroes.filter(hero => hero.status === 'enemy' && hero.canCombat).length
        : 0;
    const baseTroopTypes = Math.max(
      1,
      troopTypesCount - (specialUnit ? 1 : 0) - (location && this.shouldAddMilitia(location) ? 1 : 0) - heroCount,
    );

    console.log(`[混合部队生成] 部队类型分配:`, {
      总类型数: troopTypesCount,
      特殊单位: specialUnit ? 1 : 0,
      民兵单位: location && this.shouldAddMilitia(location) ? 1 : 0,
      英雄单位: heroCount,
      基础部队类型数: baseTroopTypes,
      剩余守军: remainingGuards,
    });
    const availableUnits = this.filterUnitsByDifficulty(primaryRaceUnits, difficulty);

    if (availableUnits.length === 0) {
      return composition;
    }

    // 随机选择不重复的单位类型
    const selectedUnits = this.selectUniqueUnits(availableUnits, baseTroopTypes);

    // 根据单位等级和难度智能分配剩余守军
    const troopCounts = this.distributeByLevelAndDifficulty(remainingGuards, selectedUnits, difficulty);

    console.log(`[混合部队生成] 基础部队生成:`, {
      剩余守军: remainingGuards,
      基础部队类型数: baseTroopTypes,
      可用单位数: availableUnits.length,
      选中单位数: selectedUnits.length,
      分配数量: troopCounts,
    });

    for (let i = 0; i < baseTroopTypes && i < troopCounts.length; i++) {
      const unit = selectedUnits[i];
      const troopCount = troopCounts[i];

      if (troopCount > 0) {
        // 普通单位使用自己的头像，不从种族肖像库中选择
        const unitAvatar = unit.avatar || this.getDefaultAvatarByRace(unit.race);

        composition.push({
          name: unit.name,
          race: unit.race,
          unitType: unit.unitType, // 使用 unitType 而不是 class
          troopCount: troopCount,
          level: unit.level,
          avatar: unitAvatar, // 使用单位自己的头像
          attributes: {
            attack: unit.attributes.attack,
            defense: unit.attributes.defense,
            intelligence: unit.attributes.intelligence,
            speed: unit.attributes.speed,
            health: unit.attributes.health,
          },
          // 添加兵种定位标记
          tier: this.getUnitTierByLevel(unit.level),
        });
      }
    }

    console.log(`[混合部队生成] 部队构成生成完成:`, {
      总守军: totalGuards,
      剩余守军: remainingGuards,
      已分配单位数: composition.length,
      单位详情: composition.map(unit => ({
        名称: unit.name,
        部队数量: unit.troopCount,
        等级: unit.level,
        兵种定位: unit.tier || '未知',
        类型: unit.isHero ? '英雄' : unit.isSpecial ? '特殊' : '普通',
      })),
    });

    return composition;
  }

  /**
   * 根据难度过滤单位
   * 确保只返回符合据点难度范围的单位
   */
  private static filterUnitsByDifficulty(units: Character[], difficulty: number): Character[] {
    const maxLevel = this.getUnitLevelForDifficulty(difficulty);
    const minLevel = this.getMinUnitLevelForDifficulty(difficulty);

    console.log(`[混合部队生成] 单位过滤:`, {
      据点难度: difficulty,
      最小等级: minLevel,
      最大等级: maxLevel,
      过滤前单位数: units.length,
    });

    const filtered = units.filter(unit => unit.level >= minLevel && unit.level <= maxLevel);

    console.log(`[混合部队生成] 过滤后单位数:`, {
      过滤后单位数: filtered.length,
      单位详情: filtered.map(u => ({ name: u.name, level: u.level })),
    });

    return filtered;
  }

  /**
   * 获取难度对应的单位等级上限
   * 据点的部队等级不应该超过据点的难度等级
   * @param difficulty 据点难度（1-10星）
   * @returns 该难度允许的最大单位等级（等于据点难度）
   */
  private static getUnitLevelForDifficulty(difficulty: number): number {
    // 据点难度就是据点等级，部队等级不应超过据点等级
    // 1星据点 → 最多1级单位
    // 2星据点 → 最多2级单位
    // ...
    // 10星据点 → 最多10级单位
    return difficulty;
  }

  /**
   * 获取难度的最小单位等级
   * 确保低级据点不会全是1级单位，高级据点不会出现太多低级单位
   */
  private static getMinUnitLevelForDifficulty(difficulty: number): number {
    // 据点等级越高，最小单位等级也越高
    // 这样确保高级据点不会出现太多低级单位
    if (difficulty <= 2) {
      return 1; // 1-2星：可以是1级
    } else if (difficulty <= 4) {
      return difficulty - 2; // 3-4星：至少1级或2级
    } else if (difficulty <= 6) {
      return difficulty - 2; // 5-6星：至少3级或4级
    } else if (difficulty <= 8) {
      return difficulty - 3; // 7-8星：至少4级或5级
    } else {
      return difficulty - 4; // 9-10星：至少5级或6级
    }
  }

  /**
   * 根据单位等级和难度智能分配部队数量
   */
  private static distributeByLevelAndDifficulty(
    totalGuards: number,
    selectedUnits: any[],
    difficulty: number,
  ): number[] {
    if (selectedUnits.length === 0) return [];

    // 计算每个单位的权重（等级越高，权重越低）
    const weights = selectedUnits.map(unit => {
      const level = unit.level || 1;
      // 基础权重：等级越高权重越低
      let baseWeight = Math.max(1, 6 - level); // 等级1=5权重，等级2=4权重，...等级5=1权重

      // 根据星级难度调整权重分布
      if (difficulty <= 2) {
        // 1-2星：低级单位获得更多数量
        baseWeight = level <= 2 ? baseWeight * 2 : baseWeight * 0.5;
      } else if (difficulty <= 4) {
        // 3-4星：均衡分配
        // 保持原权重
      } else if (difficulty <= 6) {
        // 5-6星：高级单位可以获得更多数量
        baseWeight = level >= 3 ? baseWeight * 1.5 : baseWeight;
      } else if (difficulty <= 8) {
        // 7-8星：高级单位获得更多数量
        baseWeight = level >= 4 ? baseWeight * 1.8 : baseWeight * 0.8;
      } else {
        // 9-10星：高级单位获得显著更多数量
        baseWeight = level >= 4 ? baseWeight * 2 : baseWeight * 0.7;
      }

      return Math.max(0.1, baseWeight); // 确保最小权重
    });

    // 计算总权重
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // 按权重比例分配部队
    const distribution: number[] = [];
    let allocatedTotal = 0;

    for (let i = 0; i < selectedUnits.length - 1; i++) {
      const proportion = weights[i] / totalWeight;
      const allocation = Math.floor(totalGuards * proportion);
      distribution.push(allocation);
      allocatedTotal += allocation;
    }

    // 最后一个单位获得剩余数量
    distribution.push(Math.max(0, totalGuards - allocatedTotal));

    // 确保每个单位至少有1个士兵（除非总数太少）
    for (let i = 0; i < distribution.length; i++) {
      if (distribution[i] === 0 && totalGuards >= selectedUnits.length) {
        distribution[i] = 1;
        // 从最大的分配中减去1
        const maxIndex = distribution.indexOf(Math.max(...distribution));
        if (maxIndex !== i && distribution[maxIndex] > 1) {
          distribution[maxIndex]--;
        }
      }
    }

    return distribution;
  }

  /**
   * 选择不重复的单位类型
   */
  private static selectUniqueUnits(availableUnits: any[], count: number): any[] {
    if (availableUnits.length <= count) {
      // 如果可用单位数量不足，直接返回所有单位
      return [...availableUnits];
    }

    // 随机选择不重复的单位
    const selected: any[] = [];
    const available = [...availableUnits];

    for (let i = 0; i < count && available.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      const selectedUnit = available[randomIndex];

      // 检查是否已经选择了相同名称的单位
      const isDuplicate = selected.some(
        unit =>
          unit.name === selectedUnit.name && unit.race === selectedUnit.race && unit.unitType === selectedUnit.unitType,
      );

      if (!isDuplicate) {
        selected.push(selectedUnit);
      }

      // 移除已选择的单位，避免重复选择
      available.splice(randomIndex, 1);
    }

    return selected;
  }

  /**
   * 创建敌方单位
   */
  private static createEnemyUnit(composition: any, locationId?: string, unitIndex?: number): EnemyUnit | null {
    try {
      // 使用据点ID和单位索引生成固定ID，确保唯一性
      const baseId = locationId ? `${locationId}_${unitIndex || 0}` : `enemy_${Date.now()}`;
      const id = `enemy_${composition.name.replace(/\s+/g, '_').toLowerCase()}_${baseId}`;

      const enemyUnit: EnemyUnit = {
        id,
        name: composition.name,
        race: composition.race,
        class: composition.unitType, // 保持 class 字段用于显示
        level: composition.level,
        troopCount: composition.troopCount,
        attributes: {
          attack: composition.attributes.attack,
          defense: composition.attributes.defense,
          intelligence: composition.attributes.intelligence,
          speed: composition.attributes.speed,
          health: composition.attributes.health,
        },
        avatar: composition.avatar || this.getAvatarFromDatabase(composition.race),
        country: this.getCountryFromDatabase(composition.race),
        unitType: this.getUnitTypeForComposition(composition), // 使用正确的 unitType
        canLeadRaces: [composition.race],
        // 添加部下信息
        troops: composition.troops,
      };

      // 如果是英雄单位，添加特殊标记
      if (composition.isHero && composition.heroId) {
        (enemyUnit as any).isHero = true;
        (enemyUnit as any).heroId = composition.heroId;
      }

      return enemyUnit;
    } catch (error) {
      console.error('创建敌方单位失败:', error);
      return null;
    }
  }

  /**
   * 判断是否需要添加民兵单位
   */
  private static shouldAddMilitia(location?: Location): boolean {
    if (!location) return false;

    // 村落、城镇等民用据点需要民兵
    return location.type === 'village' || location.type === 'town';
  }

  /**
   * 获取民兵单位（等级1）
   */
  private static getMilitiaUnits(race: string): Character[] {
    const raceUnits = getUnitsByRace(race);
    // 根据等级筛选民兵单位（等级1）
    const militiaUnits = raceUnits.filter(unit => unit.level === 1);

    // 如果没有找到对应种族的民兵，返回所有种族的民兵单位
    if (militiaUnits.length === 0) {
      const allUnits = getUnitsByRace('人类').concat(
        getUnitsByRace('狐族'),
        getUnitsByRace('黑暗精灵'),
        getUnitsByRace('永恒精灵'),
      );
      return allUnits.filter(unit => unit.level === 1);
    }

    return militiaUnits;
  }

  /**
   * 根据难度获取民兵比例
   */
  private static getMilitiaPercentageByDifficulty(difficulty: number): number {
    // 根据星级计算民兵比例：1星=50%，10星=10%
    return Math.max(0.1, 0.5 - (difficulty - 1) * 0.04);
  }

  /**
   * 根据等级判断兵种定位
   * 兵种定位划分：
   * - 1级：民兵（平民、村民等）
   * - 2-4级：基础兵种（守卫、战士、弓箭手等）
   * - 5-7级：精英兵种（法师、骑士、祭司等）
   * - 8-9级：禁卫兵种（圣骑士、天使等）
   * - 10级：传说兵种（恶魔领主等）
   */
  private static getUnitTierByLevel(level: number): string {
    if (level === 1) {
      return '民兵';
    } else if (level >= 2 && level <= 4) {
      return '基础';
    } else if (level >= 5 && level <= 7) {
      return '精英';
    } else if (level >= 8 && level <= 9) {
      return '禁卫';
    } else if (level >= 10) {
      return '传说';
    } else {
      return '未知';
    }
  }

  /**
   * 为所有单位分配部下类型
   * 英雄和特殊单位使用据点生成的最强基础单位作为部下
   * 普通单位使用自己作为部下
   */
  private static assignTroopTypesToUnits(composition: any[]): void {
    console.log(`[混合部队生成] 开始分配部下类型:`, {
      总单位数: composition.length,
      单位详情: composition.map(u => ({
        name: u.name,
        isHero: u.isHero,
        isSpecial: u.isSpecial,
        isCaptain: u.isCaptain,
      })),
    });

    // 1. 收集所有基础单位（排除英雄和特殊单位）
    const baseUnits = composition.filter(unit => !unit.isHero && !unit.isSpecial);

    console.log(
      `[混合部队生成] 基础单位列表:`,
      baseUnits.map(unit => ({
        名称: unit.name,
        等级: unit.level,
        兵种定位: unit.tier || '未知',
        种族: unit.race,
      })),
    );

    // 2. 为英雄和特殊单位选择部下类型
    this.assignTroopsToCaptains(composition, baseUnits);

    // 3. 为普通单位分配部下类型
    this.assignTroopsToRegularUnits(composition);
  }

  /**
   * 为队长单位（英雄和特殊单位）分配部下类型
   */
  private static assignTroopsToCaptains(composition: any[], baseUnits: any[]): void {
    console.log(`[混合部队生成] 开始为队长单位分配部下:`, {
      总单位数: composition.length,
      基础单位数: baseUnits.length,
      所有单位: composition.map(u => ({
        name: u.name,
        isCaptain: u.isCaptain,
        isHero: u.isHero,
        isSpecial: u.isSpecial,
      })),
    });

    const captainUnits = composition.filter(unit => unit.isCaptain || unit.isHero || unit.isSpecial);

    console.log(`[混合部队生成] 找到队长单位:`, {
      队长数量: captainUnits.length,
      队长列表: captainUnits.map(u => ({ name: u.name, isCaptain: u.isCaptain })),
    });

    if (captainUnits.length === 0) {
      console.log(`[混合部队生成] 没有队长单位需要分配部下`);
      return;
    }

    // 为每个队长单位选择合适的部下类型
    captainUnits.forEach(captain => {
      const suitableTroops = this.selectSuitableTroopsForCaptain(captain, baseUnits);

      captain.troops = {
        type: suitableTroops.name,
        count: captain.troopCount,
      };

      console.log(`[混合部队生成] ${captain.name} 部下类型: ${suitableTroops.name} (${captain.troopCount}名)`);
    });
  }

  /**
   * 为队长选择合适的部下类型
   */
  private static selectSuitableTroopsForCaptain(captain: any, baseUnits: any[]): any {
    if (baseUnits.length === 0) {
      console.log(`[混合部队生成] 没有基础单位，使用默认精英单位`);
      return this.getDefaultEliteUnit();
    }

    // 确定队长的单位类型（物理或魔法）
    const captainUnitType = this.getUnitTypeForComposition(captain);
    console.log(`[混合部队生成] 队长 ${captain.name} 的单位类型: ${captainUnitType}`);

    // 优先选择同种族的单位
    const sameRaceUnits = baseUnits.filter(unit => unit.race === captain.race);
    const availableUnits = sameRaceUnits.length > 0 ? sameRaceUnits : baseUnits;

    // 优先选择与自己单位类型一致的单位
    const sameTypeUnits = availableUnits.filter(unit => {
      const unitType = this.getUnitTypeForComposition(unit);
      return unitType === captainUnitType;
    });

    let selectedTroop;
    let selectionReason;

    if (sameTypeUnits.length > 0) {
      // 有同类型单位，选择其中等级最高的
      const sortedByLevel = sameTypeUnits.sort((a, b) => b.level - a.level);
      selectedTroop = sortedByLevel[0];
      selectionReason = `选择同类型(${captainUnitType})中等级最高的单位`;
    } else {
      // 没有同类型单位，选择等级最高的
      const sortedByLevel = availableUnits.sort((a, b) => b.level - a.level);
      selectedTroop = sortedByLevel[0];
      selectionReason = `据点没有同类型单位，选择等级最高的单位`;
    }

    console.log(`[混合部队生成] 为队长 ${captain.name} 选择部下:`, {
      队长等级: captain.level,
      队长种族: captain.race,
      队长单位类型: captainUnitType,
      候选单位: availableUnits.map(u => ({
        name: u.name,
        level: u.level,
        race: u.race,
        unitType: this.getUnitTypeForComposition(u),
      })),
      选中单位: selectedTroop.name,
      选择理由: selectionReason,
    });

    return selectedTroop;
  }

  /**
   * 为普通单位分配部下类型
   */
  private static assignTroopsToRegularUnits(composition: any[]): void {
    const regularUnits = composition.filter(unit => !unit.isCaptain);

    regularUnits.forEach(unit => {
      unit.troops = {
        type: unit.name,
        count: unit.troopCount,
      };
      console.log(`[混合部队生成] ${unit.name} 部下类型: ${unit.name} (${unit.troopCount}名)`);
    });
  }

  /**
   * 获取默认精英单位（当据点没有基础单位时使用）
   */
  private static getDefaultEliteUnit(): any {
    // 返回一个通用的精英单位
    return {
      name: '精英战士',
      level: 3,
      race: '人类',
      attributes: {
        attack: 8,
        defense: 6,
        intelligence: 4,
        speed: 5,
        health: 25,
      },
    };
  }

  /**
   * 为部队构成获取合适的单位类型
   */
  private static getUnitTypeForComposition(composition: any): 'physical' | 'magical' {
    try {
      // 如果是英雄单位，优先使用自己的unitType
      if (composition.isHero && composition.unitType) {
        console.log(`[混合部队生成] 英雄单位 ${composition.name} 使用自己的unitType:`, composition.unitType);
        return composition.unitType === 'magical' ? 'magical' : 'physical';
      }

      // 如果是特殊单位（AI生成的），直接使用其unitType
      if (composition.isSpecial && composition.unitType) {
        return composition.unitType === 'magical' ? 'magical' : 'physical';
      }

      // 如果已经有unitType字段（普通单位），直接使用
      if (composition.unitType === 'physical' || composition.unitType === 'magical') {
        console.log(`[混合部队生成] 普通单位 ${composition.name} 使用自己的unitType:`, composition.unitType);
        return composition.unitType;
      }

      // 如果是队长单位（特殊单位），使用其部下的单位类型
      if (composition.isCaptain && composition.troops) {
        return this.getUnitTypeFromDatabase(composition.troops.type, composition.race);
      }

      // 最后尝试从数据库中获取单位类型
      return this.getUnitTypeFromDatabase(composition.unitType || composition.name, composition.race);
    } catch (error) {
      console.error(`[混合部队生成] 获取部队单位类型失败:`, error);
      return 'physical';
    }
  }

  /**
   * 从单位数据表中获取单位类型
   */
  private static getUnitTypeFromDatabase(unitClass: string, race: string): 'physical' | 'magical' {
    try {
      // 获取该种族的所有单位
      const raceUnits = getUnitsByRace(race);

      // 如果获取不到单位数据，返回默认类型
      if (!raceUnits || raceUnits.length === 0) {
        console.warn(`[混合部队生成] 未找到种族 ${race} 的单位数据，使用默认类型`);
        return 'physical';
      }

      // 尝试通过名称匹配
      let matchingUnit = raceUnits.find(unit => unit.name === unitClass);

      // 如果没找到，尝试通过ID匹配
      if (!matchingUnit) {
        matchingUnit = raceUnits.find(unit => unit.id === unitClass);
      }

      // 如果还是没找到，尝试模糊匹配
      if (!matchingUnit) {
        matchingUnit = raceUnits.find(
          unit => unit.name && unitClass && (unit.name.includes(unitClass) || unitClass.includes(unit.name)),
        );
      }

      if (matchingUnit) {
        return matchingUnit.unitType === 'magical' ? 'magical' : 'physical';
      }

      // 如果都没找到，返回默认类型
      console.warn(`[混合部队生成] 未找到单位类型: ${unitClass} (${race})，使用默认类型`);
      return 'physical';
    } catch (error) {
      console.error(`[混合部队生成] 获取单位类型失败:`, error);
      return 'physical';
    }
  }

  /**
   * 添加种族肖像到肖像库
   * @param race 种族名称
   * @param portraitUrl 肖像URL
   */
  static addPortraitToLibrary(race: string, portraitUrl: string): void {
    try {
      if (!this.RACE_PORTRAIT_LIBRARY[race]) {
        this.RACE_PORTRAIT_LIBRARY[race] = [];
      }

      // 避免重复添加
      if (!this.RACE_PORTRAIT_LIBRARY[race].includes(portraitUrl)) {
        this.RACE_PORTRAIT_LIBRARY[race].push(portraitUrl);
        console.log(`[混合部队生成] 已为种族 ${race} 添加肖像: ${portraitUrl}`);
      } else {
        console.log(`[混合部队生成] 种族 ${race} 的肖像已存在: ${portraitUrl}`);
      }
    } catch (error) {
      console.error(`[混合部队生成] 添加种族肖像失败:`, error);
    }
  }

  /**
   * 批量添加种族肖像到肖像库
   * @param race 种族名称
   * @param portraitUrls 肖像URL数组
   */
  static addPortraitsToLibrary(race: string, portraitUrls: string[]): void {
    try {
      if (!this.RACE_PORTRAIT_LIBRARY[race]) {
        this.RACE_PORTRAIT_LIBRARY[race] = [];
      }

      let addedCount = 0;
      for (const portraitUrl of portraitUrls) {
        if (!this.RACE_PORTRAIT_LIBRARY[race].includes(portraitUrl)) {
          this.RACE_PORTRAIT_LIBRARY[race].push(portraitUrl);
          addedCount++;
        }
      }

      console.log(`[混合部队生成] 已为种族 ${race} 批量添加 ${addedCount} 个肖像`);
    } catch (error) {
      console.error(`[混合部队生成] 批量添加种族肖像失败:`, error);
    }
  }

  /**
   * 获取种族肖像库中的所有肖像
   * @param race 种族名称
   * @returns 该种族的所有肖像URL数组
   */
  static getRacePortraits(race: string): string[] {
    return this.RACE_PORTRAIT_LIBRARY[race] || [];
  }

  /**
   * 清空种族肖像库
   * @param race 种族名称
   */
  static clearRacePortraits(race: string): void {
    if (this.RACE_PORTRAIT_LIBRARY[race]) {
      this.RACE_PORTRAIT_LIBRARY[race] = [];
      console.log(`[混合部队生成] 已清空种族 ${race} 的肖像库`);
    }
  }

  /**
   * 从种族肖像库中随机选择URL肖像
   * @param race 种族名称
   * @returns 随机选择的肖像URL，如果没有则返回默认emoji
   */
  private static getRandomPortraitFromLibrary(race: string): string {
    try {
      const racePortraits = this.RACE_PORTRAIT_LIBRARY[race];

      if (!racePortraits || racePortraits.length === 0) {
        console.log(`[混合部队生成] 种族 ${race} 没有配置肖像库，使用默认头像`);
        return this.getDefaultAvatarByRace(race);
      }

      // 随机选择一个肖像URL
      const randomIndex = Math.floor(Math.random() * racePortraits.length);
      const selectedPortrait = racePortraits[randomIndex];

      console.log(`[混合部队生成] 种族 ${race} 随机选择肖像: ${selectedPortrait} (索引: ${randomIndex})`);
      return selectedPortrait;
    } catch (error) {
      console.error(`[混合部队生成] 获取种族肖像失败:`, error);
      return this.getDefaultAvatarByRace(race);
    }
  }

  /**
   * 获取种族的默认emoji头像（当肖像库为空时使用）
   */
  private static getDefaultAvatarByRace(race: string): string {
    const raceAvatars: Record<string, string> = {
      人类: '👤',
      狐族: '🦊',
      永恒精灵: '🧝‍♀️',
      黑暗精灵: '🧝‍♂️',
    };

    return raceAvatars[race] || '👤';
  }

  /**
   * 从单位数据表中获取头像（保持向后兼容）
   */
  private static getAvatarFromDatabase(race: string): string {
    try {
      // 优先使用肖像库中的随机肖像
      const portraitFromLibrary = this.getRandomPortraitFromLibrary(race);
      if (portraitFromLibrary !== this.getDefaultAvatarByRace(race)) {
        return portraitFromLibrary;
      }

      // 如果没有肖像库，使用默认emoji头像
      const defaultAvatar = this.getDefaultAvatarByRace(race);
      console.log(`[混合部队生成] 种族 ${race} 使用默认头像: ${defaultAvatar}`);
      return defaultAvatar;
    } catch (error) {
      console.error(`[混合部队生成] 获取种族头像失败:`, error);
      return '👤';
    }
  }

  /**
   * 从单位数据表中获取国家
   */
  private static getCountryFromDatabase(race: string): string {
    try {
      // 获取该种族的第一个单位作为代表
      const raceUnits = getUnitsByRace(race);
      if (raceUnits.length > 0) {
        return raceUnits[0].country || '未知';
      }

      // 如果没找到，返回默认国家
      console.warn(`[混合部队生成] 未找到种族国家: ${race}，使用默认国家`);
      return '未知';
    } catch (error) {
      console.error(`[混合部队生成] 获取种族国家失败:`, error);
      return '未知';
    }
  }
}
