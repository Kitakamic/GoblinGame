/**
 * 大陆数据合并服务
 * 负责合并系统默认数据、用户自定义数据和存档数据
 */
import type { Continent, DataSource, MergeOptions, Region } from '../类型/大陆探索类型';

export class ContinentDataMerger {
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * 合并大陆数据
   * @param defaultData 系统默认数据（从CSV加载）
   * @param customData 用户自定义数据（从存档加载）
   * @param savedData 存档中的运行时数据（包含游戏进度）
   * @param options 合并选项
   * @returns 合并后的大陆数据
   */
  static mergeContinents(
    defaultData: Continent[],
    customData: Continent[] = [],
    savedData: Continent[] = [],
    options: MergeOptions = {},
  ): Continent[] {
    const { strategy = 'merge', allowOverride = true, preserveDefault = true } = options;

    // 1. 标记默认数据的来源
    const markedDefaultData = defaultData.map(continent => ({
      ...continent,
      source: 'default' as DataSource,
      version: this.CURRENT_VERSION,
      regions: continent.regions.map(region => ({
        ...region,
        source: 'default' as DataSource,
        version: this.CURRENT_VERSION,
      })),
    }));

    // 2. 标记自定义数据的来源
    const markedCustomData = customData.map(continent => ({
      ...continent,
      source: 'custom' as DataSource,
      version: this.CURRENT_VERSION,
      metadata: {
        ...continent.metadata,
        createdAt: continent.metadata?.createdAt || Date.now(),
        modifiedAt: Date.now(),
      },
      regions: continent.regions.map(region => ({
        ...region,
        source: 'custom' as DataSource,
        version: this.CURRENT_VERSION,
        metadata: {
          ...region.metadata,
          createdAt: region.metadata?.createdAt || Date.now(),
          modifiedAt: Date.now(),
        },
      })),
    }));

    // 3. 根据策略合并数据
    let mergedContinents: Continent[] = [];

    switch (strategy) {
      case 'custom-first':
        // 自定义优先：自定义数据覆盖默认数据
        mergedContinents = this.mergeCustomFirst(markedDefaultData, markedCustomData, allowOverride);
        break;

      case 'default-first':
        // 默认优先：默认数据覆盖自定义数据（除非明确允许覆盖）
        mergedContinents = this.mergeDefaultFirst(markedDefaultData, markedCustomData, allowOverride);
        break;

      case 'merge':
      default:
        // 智能合并：保留所有数据，但自定义数据优先
        mergedContinents = this.mergeIntelligent(markedDefaultData, markedCustomData, allowOverride);
        break;
    }

    // 4. 先标记为合并后的数据（但保留自定义大陆的 source 标记）
    // 注意：必须在 applySavedProgress 之前标记，以确保后续步骤能正确保留 source
    const customContinentNames = new Set(markedCustomData.map(c => c.name));
    console.log(`🔍 [合并数据] 自定义大陆名称集合:`, Array.from(customContinentNames));
    console.log(
      `🔍 [合并数据] 合并后的大陆名称:`,
      mergedContinents.map(c => c.name),
    );
    mergedContinents = mergedContinents.map(continent => {
      // 如果大陆原本是自定义的，保留 custom 标记；否则标记为 merged
      const isCustom = customContinentNames.has(continent.name);
      console.log(
        `🔍 [合并数据] 大陆 "${continent.name}": isCustom=${isCustom}, 将标记为 ${isCustom ? 'custom' : 'merged'}`,
      );
      return {
        ...continent,
        source: isCustom ? ('custom' as DataSource) : ('merged' as DataSource),
      };
    });

    // 5. 如果有存档数据，优先使用存档数据中的游戏进度（此时 source 已被正确标记）
    if (savedData.length > 0) {
      mergedContinents = this.applySavedProgress(mergedContinents, savedData);
    }

    // 6. 如果设置了保留默认数据，确保所有默认数据都被包含
    if (preserveDefault) {
      mergedContinents = this.ensureDefaultDataPreserved(mergedContinents, markedDefaultData);
    }

    return mergedContinents;
  }

  /**
   * 自定义优先合并策略
   */
  private static mergeCustomFirst(
    defaultData: Continent[],
    customData: Continent[],
    allowOverride: boolean,
  ): Continent[] {
    const result: Continent[] = [];
    const addedNames = new Set<string>();

    // 先添加自定义数据
    for (const custom of customData) {
      result.push(custom);
      addedNames.add(custom.name);
    }

    // 然后添加默认数据（如果不存在同名自定义数据）
    if (allowOverride) {
      // 如果允许覆盖，只添加不存在于自定义数据中的默认数据
      for (const defaultContinent of defaultData) {
        if (!addedNames.has(defaultContinent.name)) {
          result.push(defaultContinent);
        }
      }
    } else {
      // 如果不允许覆盖，添加所有默认数据
      result.push(...defaultData);
    }

    return result;
  }

  /**
   * 默认优先合并策略
   */
  private static mergeDefaultFirst(
    defaultData: Continent[],
    customData: Continent[],
    allowOverride: boolean,
  ): Continent[] {
    const result: Continent[] = [];
    const customMap = new Map<string, Continent>();

    // 建立自定义数据索引
    for (const custom of customData) {
      customMap.set(custom.name, custom);
    }

    // 先添加默认数据
    for (const defaultContinent of defaultData) {
      if (allowOverride && customMap.has(defaultContinent.name)) {
        // 如果允许覆盖且有自定义数据，使用自定义数据
        result.push(customMap.get(defaultContinent.name)!);
      } else {
        result.push(defaultContinent);
      }
    }

    // 然后添加不存在于默认数据中的自定义数据
    for (const custom of customData) {
      if (!defaultData.some(d => d.name === custom.name)) {
        result.push(custom);
      }
    }

    return result;
  }

  /**
   * 智能合并策略
   */
  private static mergeIntelligent(
    defaultData: Continent[],
    customData: Continent[],
    allowOverride: boolean,
  ): Continent[] {
    const result: Continent[] = [];
    const defaultMap = new Map<string, Continent>();
    const customMap = new Map<string, Continent>();

    // 建立索引
    for (const continent of defaultData) {
      defaultMap.set(continent.name, continent);
    }
    for (const continent of customData) {
      customMap.set(continent.name, continent);
    }

    // 合并策略：
    // 1. 如果自定义数据存在，优先使用自定义数据
    // 2. 如果不存在自定义数据，使用默认数据
    // 3. 合并区域数据（区域也遵循相同策略）
    const allNames = new Set([...defaultMap.keys(), ...customMap.keys()]);

    for (const name of allNames) {
      const defaultContinent = defaultMap.get(name);
      const customContinent = customMap.get(name);

      if (customContinent) {
        // 有自定义数据，优先使用
        if (defaultContinent && allowOverride) {
          // 如果允许覆盖，合并区域数据
          const mergedRegions = this.mergeRegions(
            defaultContinent.regions,
            customContinent.regions,
            defaultContinent.name,
          );
          result.push({
            ...customContinent,
            regions: mergedRegions,
          });
        } else {
          result.push(customContinent);
        }
      } else if (defaultContinent) {
        // 只有默认数据
        result.push(defaultContinent);
      }
    }

    return result;
  }

  /**
   * 合并区域数据
   */
  private static mergeRegions(defaultRegions: Region[], customRegions: Region[], continentName: string): Region[] {
    const result: Region[] = [];
    const customRegionMap = new Map<string, Region>();

    // 建立自定义区域索引
    for (const region of customRegions) {
      customRegionMap.set(region.name, region);
    }

    // 先添加自定义区域
    for (const customRegion of customRegions) {
      result.push(customRegion);
    }

    // 然后添加默认区域（如果不存在同名自定义区域）
    for (const defaultRegion of defaultRegions) {
      if (!customRegionMap.has(defaultRegion.name)) {
        // 确保区域属于正确的大陆
        result.push({
          ...defaultRegion,
          continentName,
        });
      }
    }

    return result;
  }

  /**
   * 应用存档中的游戏进度
   */
  private static applySavedProgress(mergedData: Continent[], savedData: Continent[]): Continent[] {
    const savedMap = new Map<string, Continent>();

    // 建立存档数据索引
    for (const saved of savedData) {
      savedMap.set(saved.name, saved);
    }

    // 应用存档中的游戏进度
    return mergedData.map(continent => {
      const saved = savedMap.get(continent.name);
      if (saved) {
        // 保留合并后的数据结构和自定义字段（包括 source 标记），但更新游戏进度
        // 优先使用合并后的 source（因为它已经在步骤 6 被正确标记），如果没有则使用存档中的
        const preservedSource = continent.source || saved.source;
        console.log(
          `🔍 [应用存档进度] 大陆 "${continent.name}": 保留 source=${preservedSource}, 存档中的 source=${saved.source}`,
        );
        return {
          ...continent,
          // 保留 source 标记（优先使用合并后的）
          source: preservedSource,
          // 更新游戏状态
          isUnlocked: saved.isUnlocked,
          isConquered: saved.isConquered,
          conquestProgress: saved.conquestProgress,
          // 更新区域状态
          regions: continent.regions.map(region => {
            const savedRegion = saved.regions.find(r => r.name === region.name);
            if (savedRegion) {
              return {
                ...region,
                // 保留 source 标记（如果存在）
                source: region.source || savedRegion.source,
                isUnlocked: savedRegion.isUnlocked,
                isConquered: savedRegion.isConquered,
                conquestProgress: savedRegion.conquestProgress,
                isCapitalConquered: savedRegion.isCapitalConquered,
                threatLevel: savedRegion.threatLevel,
                locations: savedRegion.locations,
              };
            }
            return region;
          }),
        };
      }
      return continent;
    });
  }

  /**
   * 确保默认数据被保留
   */
  private static ensureDefaultDataPreserved(mergedData: Continent[], defaultData: Continent[]): Continent[] {
    const mergedNames = new Set(mergedData.map(c => c.name));
    const result = [...mergedData];

    // 添加缺失的默认数据
    for (const defaultContinent of defaultData) {
      if (!mergedNames.has(defaultContinent.name)) {
        result.push(defaultContinent);
      }
    }

    return result;
  }

  /**
   * 验证大陆数据完整性
   */
  static validateContinent(continent: Continent): boolean {
    if (!continent.name || !continent.description) {
      console.error('大陆验证失败：缺少必要字段（name 或 description）', continent);
      return false;
    }
    if (continent.difficulty < 1 || continent.difficulty > 10) {
      console.error('大陆验证失败：难度必须在 1-10 之间', continent);
      return false;
    }
    if (!continent.explorationCost || typeof continent.explorationCost.gold !== 'number') {
      console.error('大陆验证失败：探索成本格式错误', continent);
      return false;
    }
    if (continent.explorationCost.gold < 0 || continent.explorationCost.food < 0) {
      console.error('大陆验证失败：探索成本不能为负数', continent);
      return false;
    }
    if (!Array.isArray(continent.regions)) {
      console.error('大陆验证失败：regions 必须是数组', continent);
      return false;
    }
    // 验证区域数据
    for (const region of continent.regions) {
      if (!this.validateRegion(region, continent.name)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 验证区域数据完整性
   */
  static validateRegion(region: Region, continentName: string): boolean {
    if (!region.name || !region.description) {
      console.error('区域验证失败：缺少必要字段（name 或 description）', region);
      return false;
    }
    if (region.continentName !== continentName) {
      console.error(
        `区域验证失败：区域所属大陆不匹配（期望: ${continentName}, 实际: ${region.continentName}）`,
        region,
      );
      return false;
    }
    if (region.difficulty < 1 || region.difficulty > 10) {
      console.error('区域验证失败：难度必须在 1-10 之间', region);
      return false;
    }
    if (region.requiredStars < 0 || region.unlockStars < 0) {
      console.error('区域验证失败：星级不能为负数', region);
      return false;
    }
    if (!Array.isArray(region.locations)) {
      console.error('区域验证失败：locations 必须是数组', region);
      return false;
    }
    return true;
  }

  /**
   * 验证并修复大陆数据
   * @param continent 要验证的大陆数据
   * @returns 修复后的大陆数据（如果验证失败，返回 null）
   */
  static validateAndFixContinent(continent: Continent): Continent | null {
    try {
      // 先确定大陆名称（用于后续处理区域）
      const continentName = continent.name || '未命名大陆';

      // 基本字段修复
      const fixed: Continent = {
        ...continent,
        name: continentName,
        description: continent.description || '没有描述',
        difficulty: Math.max(1, Math.min(10, continent.difficulty || 1)),
        icon: continent.icon || '🌍',
        explorationCost: {
          gold: Math.max(0, continent.explorationCost?.gold || 0),
          food: Math.max(0, continent.explorationCost?.food || 0),
        },
        threatMultiplier: Math.max(0, continent.threatMultiplier || 1),
        unlockCondition: {
          previousContinentName: continent.unlockCondition?.previousContinentName,
          conquestPercentage: Math.max(0, Math.min(100, continent.unlockCondition?.conquestPercentage || 50)),
        },
        isUnlocked: Boolean(continent.isUnlocked),
        isConquered: Boolean(continent.isConquered),
        conquestProgress: Math.max(0, Math.min(100, continent.conquestProgress || 0)),
        regions: Array.isArray(continent.regions)
          ? (continent.regions
              .map(region => this.validateAndFixRegion(region, continentName))
              .filter(r => r !== null) as Region[])
          : [],
      };

      // 验证修复后的数据
      if (!this.validateContinent(fixed)) {
        console.error('大陆数据验证失败，无法修复', fixed);
        return null;
      }

      return fixed;
    } catch (error) {
      console.error('修复大陆数据时发生错误:', error);
      return null;
    }
  }

  /**
   * 验证并修复区域数据
   * @param region 要验证的区域数据
   * @param continentName 所属大陆名称
   * @returns 修复后的区域数据（如果验证失败，返回 null）
   */
  static validateAndFixRegion(region: Region, continentName: string): Region | null {
    try {
      // 基本字段修复
      const fixed: Region = {
        ...region,
        name: region.name || '未命名区域',
        continentName: continentName, // 强制设置为正确的大陆名称
        description: region.description || '没有描述',
        difficulty: Math.max(1, Math.min(10, region.difficulty || 1)),
        icon: region.icon || '🏘️',
        isUnlocked: Boolean(region.isUnlocked),
        isConquered: Boolean(region.isConquered),
        conquestProgress: Math.max(0, Math.min(100, region.conquestProgress || 0)),
        requiredStars: Math.max(0, region.requiredStars || 0),
        unlockStars: Math.max(0, region.unlockStars || 0),
        capital: region.capital || '',
        isCapitalConquered: Boolean(region.isCapitalConquered),
        threatLevel: Math.max(0, region.threatLevel || 0),
        locations: Array.isArray(region.locations) ? region.locations : [],
      };

      // 验证修复后的数据
      if (!this.validateRegion(fixed, continentName)) {
        console.error('区域数据验证失败，无法修复', fixed);
        return null;
      }

      return fixed;
    } catch (error) {
      console.error('修复区域数据时发生错误:', error);
      return null;
    }
  }

  /**
   * 批量验证大陆数据
   * @param continents 要验证的大陆数组
   * @returns 验证结果，包含有效的和无效的大陆
   */
  static validateContinents(continents: Continent[]): {
    valid: Continent[];
    invalid: Array<{ continent: Continent; error: string }>;
  } {
    const valid: Continent[] = [];
    const invalid: Array<{ continent: Continent; error: string }> = [];

    for (const continent of continents) {
      const fixed = this.validateAndFixContinent(continent);
      if (fixed) {
        valid.push(fixed);
      } else {
        invalid.push({
          continent,
          error: '大陆数据验证失败',
        });
      }
    }

    return { valid, invalid };
  }
}
