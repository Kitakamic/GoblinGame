import { ref, watch } from 'vue';
import { modularSaveManager } from '../../存档管理/模块化存档服务';
import { INITIAL_LOCATIONS } from '../../存档管理/模块化存档类型';
import type { EnemyUnit, ExploreState, Location, ScoutResult } from '../类型/探索类型';
import { continentExploreService } from './大陆探索服务';
import { MixedTroopGenerationService } from './混合部队生成服务';

/**
 * 探索服务类
 * 管理探索相关的所有数据和功能
 */
export class ExploreService {
  // ==================== 响应式数据 ====================

  // 探索状态
  public state = ref<ExploreState>({
    scoutedLocations: [],
    conqueredLocations: [],
  });

  // 据点数据
  public locations = ref<Location[]>([...INITIAL_LOCATIONS]);

  // 侦察状态
  private scoutingLocations = new Set<string>();
  private scoutingAnimation = new Set<string>();

  // ==================== 构造函数和初始化 ====================

  constructor() {
    this.setupDataWatchers();
    // 延迟初始化，等待存档系统加载完成
    setTimeout(() => {
      this.initializeExploreData();
    }, 100);
  }

  // 初始化探索数据
  private async initializeExploreData(): Promise<void> {
    await this.loadExploreData();
  }

  // 手动初始化探索数据（供存档系统调用）
  public async initializeFromSave(): Promise<void> {
    await this.loadExploreData();
  }

  // ==================== 据点管理功能 ====================

  // 获取所有据点
  public getAllLocations(): Location[] {
    return this.locations.value;
  }

  // 添加新发现的据点
  public addLocation(location: Location): boolean {
    try {
      // 检查是否已存在同名据点
      const existingLocation = this.locations.value.find(loc => loc.name === location.name);
      if (existingLocation) {
        console.warn(`据点 ${location.name} 已存在，跳过添加`);
        return false;
      }

      // 如果据点已经是"已侦察"状态但没有敌方单位数据，立即生成
      if (location.status === 'scouted' && (!location.enemyUnits || location.enemyUnits.length === 0)) {
        console.log(`据点 ${location.name} 已侦察但无敌方单位数据，立即生成...`);
        try {
          const enemyUnits = this.getLocationEnemyUnits(location.id, 1);
          console.log(`据点 ${location.name} 敌方单位生成完成:`, enemyUnits.length, '个单位');
        } catch (error) {
          console.warn(`据点 ${location.name} 敌方单位生成失败:`, error);
        }
      }

      // 添加到据点列表
      console.log(`🔍 [探索服务] 添加据点前的完整数据:`, location);
      console.log(`🔍 [探索服务] 据点baseGuards字段:`, location.baseGuards);
      console.log(`🔍 [探索服务] 据点specialUnit字段:`, location.specialUnit);
      this.locations.value.push(location);
      console.log(`已添加新据点: ${location.name}`);

      // 据点解析后进行英雄概率判定
      this.checkAndMarkHeroGeneration(location);

      // 保存到数据库
      this.saveExploreData();

      return true;
    } catch (error) {
      console.error('添加据点失败:', error);
      return false;
    }
  }

  // 批量添加新发现的据点
  public addMultipleLocations(locations: Location[]): number {
    let addedCount = 0;
    for (const location of locations) {
      if (this.addLocation(location)) {
        addedCount++;
      }
    }
    return addedCount;
  }

  // 获取据点的敌方单位
  public getLocationEnemyUnits(locationId: string, currentTurn: number = 1): EnemyUnit[] {
    const location = this.locations.value.find(loc => loc.id === locationId);
    if (!location) {
      console.warn(`据点 ${locationId} 不存在`);
      return [];
    }

    // 如果据点已有敌方单位，直接返回（确保单位固定）
    if (location.enemyUnits && location.enemyUnits.length > 0) {
      console.log(`据点 ${locationId} 已有敌方单位，直接返回:`, location.enemyUnits.length, '个单位');
      return location.enemyUnits;
    }

    console.log(`为据点 ${locationId} 生成敌方单位...`);

    // 获取基础守军和特殊单位信息
    console.log(`🔍 [探索服务] 据点 ${locationId} 的baseGuards字段:`, location.baseGuards);
    console.log(`🔍 [探索服务] 据点 ${locationId} 的specialUnit字段:`, location.specialUnit);
    const baseGuards = location.baseGuards || 1000;
    const specialUnit = location.specialUnit;
    console.log(`🔍 [探索服务] 最终使用的baseGuards:`, baseGuards);
    console.log(`🔍 [探索服务] 最终使用的specialUnit:`, specialUnit);

    // 使用混合部队生成服务生成敌方单位
    console.log(`🔍 [探索服务] 调用混合部队生成服务，参数:`, {
      据点: location.name,
      基础守军: baseGuards,
      特殊单位: specialUnit,
      当前回合: currentTurn,
      英雄数量: location.rewards?.heroes?.length || 0,
    });

    const enemyUnits = MixedTroopGenerationService.generateMixedTroops(
      location,
      baseGuards,
      specialUnit
        ? {
            ...specialUnit,
            troopCount: 0, // 特殊单位的部队数量将由生成服务自动计算
          }
        : undefined,
      currentTurn,
    );

    console.log(`🔍 [探索服务] 混合部队生成服务返回:`, enemyUnits.length, '个单位');

    // 固定保存敌方单位，避免重复生成时单位变化
    location.enemyUnits = enemyUnits;
    location.enemyUnitsGeneratedAt = Date.now();

    console.log(`据点 ${locationId} 敌方单位生成完成:`, enemyUnits.length, '个单位');

    // 保存到数据库，确保持久化
    this.saveLocationsToDatabase();

    return enemyUnits;
  }

  // ==================== 英雄生成功能 ====================

  // 检查并标记据点是否需要生成英雄
  private async checkAndMarkHeroGeneration(location: Location): Promise<void> {
    try {
      // 导入英雄生成服务
      const { HeroDeterminationService } = await import('../../人物管理/服务/人物生成服务');

      // 检查据点是否已有英雄（避免传奇据点重复生成）
      const hasExistingHeroes = location.rewards?.heroes && location.rewards.heroes.length > 0;

      if (hasExistingHeroes) {
        console.log(`据点 ${location.name} 已有英雄数据，跳过AI生成标记`);
        return;
      }

      // 判定是否需要生成英雄
      const shouldHaveHero = HeroDeterminationService.shouldHaveHero(location.type, location.difficulty);

      if (shouldHaveHero) {
        console.log(`据点 ${location.name} 判定需要生成英雄，添加生成标记...`);

        // 添加AI生成标记（使用布尔属性）
        (location as any).needsAIHero = true;

        console.log(`据点 ${location.name} 已添加英雄生成标记`);
      } else {
        console.log(`据点 ${location.name} 判定不需要生成英雄`);
      }
    } catch (error) {
      console.error('英雄概率判定失败:', error);
    }
  }

  // ==================== 侦察功能 ====================

  // 侦察据点
  public async scoutLocation(locationId: string): Promise<ScoutResult> {
    const location = this.getAllLocations().find(loc => loc.id === locationId);
    if (!location) {
      throw new Error('据点不存在');
    }

    // 根据难度和距离计算侦察成本
    const cost = this.calculateScoutCost(location.difficulty, location.distance);

    // 检查资源是否足够
    if (modularSaveManager.resources.value.gold < cost.gold || modularSaveManager.resources.value.food < cost.food) {
      throw new Error(`资源不足，侦察需要 ${cost.gold} 金币和 ${cost.food} 食物`);
    }

    // 消耗资源
    modularSaveManager.consumeResource('gold', cost.gold);
    modularSaveManager.consumeResource('food', cost.food);

    // 模拟侦察过程
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 更新侦察状态
    if (!this.state.value.scoutedLocations.includes(locationId)) {
      this.state.value.scoutedLocations.push(locationId);
    }

    // 更新据点状态
    const locationIndex = this.locations.value.findIndex(loc => loc.id === locationId);

    if (locationIndex !== -1) {
      this.locations.value[locationIndex].status = 'scouted';
      this.locations.value[locationIndex].lastScouted = Date.now();

      // 检查据点是否需要AI生成英雄（支持预定义标记和概率判定标记）
      const location = this.locations.value[locationIndex];
      const needsAIHero = (location as any).needsAIHero || location.description.includes('[AI_HERO_GENERATE]');

      if (needsAIHero) {
        console.log('检测到据点有英雄生成标记，开始AI生成英雄...');

        let aiGenerationSuccess = false;

        try {
          // 导入英雄生成服务
          const { HeroDeterminationService } = await import('../../人物管理/服务/人物生成服务');

          // 生成英雄提示词
          const heroPrompt = HeroDeterminationService.generateHeroPrompt(
            location.type,
            location.difficulty,
            location.description,
            location.continent,
            location.region,
            location.pictureResource,
          );

          console.log('AI英雄生成提示词:', heroPrompt);

          // 调用AI生成英雄
          const aiResponse = await window.TavernHelper.generate({
            user_input: heroPrompt,
          });

          if (!aiResponse) {
            console.error('AI生成失败，未返回数据');
            aiGenerationSuccess = false;
          } else {
            console.log('AI返回数据:', aiResponse);

            // 使用人物生成服务解析AI返回的数据
            const character = await HeroDeterminationService.parseHeroCharacter(
              aiResponse,
              locationId,
              location.type,
              location.pictureResource,
            );

            if (character) {
              // 用真实英雄替换标记
              location.rewards.heroes = [character];
              console.log('AI英雄生成完成:', character.name);

              // 清除已生成的敌方单位，以便重新生成包含英雄的单位
              location.enemyUnits = undefined;
              location.enemyUnitsGeneratedAt = undefined;
              aiGenerationSuccess = true;
            } else {
              console.error('AI英雄解析失败');
              aiGenerationSuccess = false;
            }
          }
        } catch (error) {
          console.error('AI英雄生成失败:', error);
          aiGenerationSuccess = false;
        }

        // 如果AI生成失败，返回需要用户决策的结果
        if (!aiGenerationSuccess) {
          console.warn(`据点 ${location.name} AI英雄生成失败，需要用户决策`);

          // 暂时回滚据点状态，等待用户决策
          location.status = 'unknown';
          location.lastScouted = undefined;

          // 从已侦察列表中移除
          const scoutedIndex = this.state.value.scoutedLocations.indexOf(locationId);
          if (scoutedIndex !== -1) {
            this.state.value.scoutedLocations.splice(scoutedIndex, 1);
          }

          // 返回需要用户决策的结果
          return {
            locationId,
            information: {
              rewards: location.rewards,
              status: location.status,
            },
            cost: { gold: 0, food: 0 }, // 暂时显示为0，实际成本在用户决策后处理
            error: 'AI英雄生成失败',
            needsUserDecision: true,
            aiFailureData: {
              location: { ...location }, // 保存据点的完整信息
              originalCost: cost, // 保存原始侦察成本
            },
          };
        }
      }

      // 在AI英雄生成完成后，生成敌方单位数据，确保侦察结果显示正确的部队数量
      if (!location.enemyUnits || location.enemyUnits.length === 0) {
        console.log('侦察时生成敌方单位数据...');
        const enemyUnits = this.getLocationEnemyUnits(locationId, 1);
        console.log('侦察时敌方单位生成完成:', enemyUnits.length, '个单位');
      }

      // 如果据点有英雄信息，将英雄添加到调教模块
      if (location.rewards?.heroes && location.rewards.heroes.length > 0) {
        console.log('据点已有英雄信息，添加到调教模块...');

        const trainingData = (modularSaveManager.getModuleData({ moduleName: 'training' }) as any) || {
          characters: [],
          trainingMessages: [],
        };

        for (const hero of location.rewards.heroes) {
          // 检查是否已存在相同ID的英雄，避免重复添加
          const existingHeroIndex = trainingData.characters.findIndex((char: any) => char.id === hero.id);
          if (existingHeroIndex === -1) {
            trainingData.characters.push(hero);
            console.log('英雄已添加到调教模块:', hero.name);
          } else {
            console.log('英雄已存在于调教模块中:', hero.name);
          }
        }

        modularSaveManager.updateModuleData({
          moduleName: 'training',
          data: trainingData,
        });
      }
    }

    // 侦察完成，返回结果（包含英雄信息）
    const result: ScoutResult = {
      locationId,
      information: {
        rewards: location.rewards,
        status: location.status,
      },
      cost,
    };

    return result;
  }

  // 根据难度和距离计算侦察成本（固定费用）
  public calculateScoutCost(difficulty: number, distance?: number): { gold: number; food: number } {
    // 获取当前大陆的探索成本作为基础值
    const currentContinent = continentExploreService.getCurrentContinent();
    const baseCost = currentContinent?.explorationCost || { gold: 5, food: 3 };

    // 根据星级计算倍数：1星=1倍，10星=50倍
    const multiplier = Math.max(1, difficulty * 5);

    // 距离成本：每公里增加 5% 的成本
    const distanceMultiplier = distance ? 1 + distance * 0.05 : 1;

    // 移除随机因子，使用固定费用计算
    return {
      gold: Math.round(baseCost.gold * multiplier * distanceMultiplier),
      food: Math.round(baseCost.food * multiplier * distanceMultiplier),
    };
  }

  // ==================== AI失败处理功能 ====================

  /**
   * 处理用户选择放弃英雄，直接进攻
   * @param locationId 据点ID
   * @param _originalCost 原始侦察成本（暂未使用，保留用于未来扩展）
   * @returns 是否成功
   */
  public async handleAbandonHeroAndAttack(
    locationId: string,
    _originalCost: { gold: number; food: number },
  ): Promise<boolean> {
    try {
      const location = this.locations.value.find(loc => loc.id === locationId);
      if (!location) {
        console.error(`据点 ${locationId} 不存在`);
        return false;
      }

      console.log(`用户选择放弃英雄，直接进攻据点: ${location.name}`);

      // 更新据点状态为已侦察
      location.status = 'scouted';
      location.lastScouted = Date.now();

      // 添加到已侦察列表
      if (!this.state.value.scoutedLocations.includes(locationId)) {
        this.state.value.scoutedLocations.push(locationId);
      }

      // 清除AI英雄生成标记
      (location as any).needsAIHero = false;

      // 确保据点有基础奖励结构
      if (!location.rewards) {
        location.rewards = {};
      }

      // 移除英雄奖励（如果有的话）
      if (location.rewards.heroes) {
        location.rewards.heroes = [];
      }

      // 生成敌方单位数据（不包含英雄）
      if (!location.enemyUnits || location.enemyUnits.length === 0) {
        console.log('生成无英雄的敌方单位数据...');
        const enemyUnits = this.getLocationEnemyUnits(locationId, 1);
        console.log('无英雄敌方单位生成完成:', enemyUnits.length, '个单位');
      }

      // 保存数据
      await this.saveExploreData();

      console.log(`据点 ${location.name} 已设置为可直接进攻状态`);
      return true;
    } catch (error) {
      console.error('处理放弃英雄失败:', error);
      return false;
    }
  }

  /**
   * 处理用户选择重新侦察
   * @param locationId 据点ID
   * @param originalCost 原始侦察成本
   * @returns 是否成功退还资源
   */
  public async handleRetryScout(locationId: string, originalCost: { gold: number; food: number }): Promise<boolean> {
    try {
      console.log(`用户选择重新侦察据点: ${locationId}`);

      // 退还侦察成本
      modularSaveManager.addResource('gold', originalCost.gold, `重新侦察退还金币`);
      modularSaveManager.addResource('food', originalCost.food, `重新侦察退还食物`);
      console.log(`已退还侦察成本: ${originalCost.gold} 金币, ${originalCost.food} 食物`);

      return true;
    } catch (error) {
      console.error('处理重新侦察失败:', error);
      return false;
    }
  }

  // ==================== AI据点生成功能 ====================

  // ==================== 据点CRUD操作 ====================

  /**
   * 移除据点
   * @param locationId 据点ID
   * @returns 是否成功移除
   */
  public removeLocation(locationId: string): boolean {
    try {
      const locationIndex = this.locations.value.findIndex(loc => loc.id === locationId);
      if (locationIndex !== -1) {
        this.locations.value.splice(locationIndex, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('移除据点失败:', error);
      return false;
    }
  }

  /**
   * 更新据点信息
   * @param locationId 据点ID
   * @param updates 更新的字段
   * @returns 是否成功更新
   */
  public updateLocation(locationId: string, updates: Partial<Location>): boolean {
    try {
      const location = this.locations.value.find(loc => loc.id === locationId);
      if (location) {
        Object.assign(location, updates);
        return true;
      }
      return false;
    } catch (error) {
      console.error('更新据点失败:', error);
      return false;
    }
  }

  // ==================== 数据持久化功能 ====================

  // 加载探索数据
  private async loadExploreData(): Promise<void> {
    try {
      // 从数据库加载探索数据
      const explorationData = modularSaveManager.getModuleData({ moduleName: 'exploration' });

      if (explorationData) {
        if ((explorationData as any).locations) {
          this.locations.value = (explorationData as any).locations;
        }
        if ((explorationData as any).state) {
          this.state.value = (explorationData as any).state;
        }
        console.log('从数据库加载探索数据成功');

        // 检查已侦察但无敌方单位数据的据点，立即生成
        this.generateEnemyUnitsForScoutedLocations();
      } else {
        console.log('未找到探索数据，使用默认数据');
      }
    } catch (error) {
      console.error('加载探索数据失败:', error);
    }
  }

  // 设置数据监听器
  private setupDataWatchers(): void {
    // 监听据点数据变化 - 自动保存到数据库
    watch(
      this.locations,
      () => {
        this.saveExploreData();
      },
      { deep: true },
    );

    // 监听状态数据变化 - 自动保存到数据库
    watch(
      this.state,
      () => {
        this.saveExploreData();
      },
      { deep: true },
    );
  }

  // 更新侦察状态
  public updateScoutingState(scoutingLocations: string[], scoutingAnimation: string[]): void {
    this.scoutingLocations = new Set(scoutingLocations);
    this.scoutingAnimation = new Set(scoutingAnimation);
  }

  // 保存探索数据
  public async saveExploreData(): Promise<void> {
    try {
      // 使用模块化存档管理器保存探索数据
      modularSaveManager.updateModuleData({
        moduleName: 'exploration',
        data: {
          locations: this.locations.value,
          state: this.state.value,
          scoutingLocations: [...this.scoutingLocations],
          scoutingAnimation: [...this.scoutingAnimation],
        },
      });

      console.log('探索数据已保存到数据库:', {
        locations: this.locations.value.length,
        state: this.state.value,
        scoutingLocations: this.scoutingLocations.size,
        scoutingAnimation: this.scoutingAnimation.size,
      });
    } catch (error) {
      console.error('保存探索数据失败:', error);
    }
  }

  // ==================== 据点状态管理 ====================

  // 根据据点等级增加威胁度
  private addThreatFromConquest(location: Location): void {
    try {
      console.log('开始计算威胁度增加...', location);

      // 根据据点难度计算威胁度增加量
      const threatMultiplier = this.getThreatMultiplierByDifficulty(location.difficulty);
      console.log('难度倍数:', threatMultiplier);

      // 根据据点类型调整威胁度
      const typeMultiplier = this.getThreatMultiplierByType(location.type);
      console.log('类型倍数:', typeMultiplier);

      // 基础威胁度
      const baseThreat = 10;

      // 计算最终威胁度
      const threatIncrease = Math.floor(baseThreat * threatMultiplier * typeMultiplier);
      console.log('计算出的威胁度增加:', threatIncrease);

      // 增加威胁度资源
      const success = modularSaveManager.addResource('threat', threatIncrease, `征服据点${location.name}获得`);
      console.log('威胁度增加是否成功:', success);

      console.log(
        `征服据点 ${location.name} 增加威胁度: +${threatIncrease} (难度:${location.difficulty}, 类型:${location.type})`,
      );
    } catch (error) {
      console.error('增加威胁度失败:', error);
    }
  }

  // 检查并更新首都征服状态
  private async checkAndUpdateCapitalConquest(location: Location): Promise<void> {
    try {
      const { continentExploreService } = await import('./大陆探索服务');

      // 检查据点是否为区域首都
      const isCapital = continentExploreService.isLocationCapital(location.name, location.region || '');

      if (isCapital) {
        console.log(`据点 ${location.name} 是区域 ${location.region} 的首都，更新首都征服状态`);
        continentExploreService.updateCapitalConquestStatus(location.region || '', true);
      }
    } catch (error) {
      console.error('检查首都征服状态失败:', error);
    }
  }

  // 根据据点征服更新区域征服进度
  private async updateRegionProgressFromLocation(location: Location): Promise<void> {
    try {
      // 通知大陆探索服务重新计算区域征服进度
      const { continentExploreService } = await import('./大陆探索服务');
      continentExploreService.calculateRegionProgressFromLocations(location.region || '');
      console.log(`据点 ${location.name} 征服已触发区域进度重新计算`);
    } catch (error) {
      console.error('更新区域征服进度失败:', error);
    }
  }

  // 根据难度获取威胁度倍数
  private getThreatMultiplierByDifficulty(difficulty: number): number {
    // 根据星级计算威胁度倍数：1星=1倍，10星=10倍
    return Math.max(1.0, difficulty);
  }

  // 根据据点类型获取威胁度倍数
  private getThreatMultiplierByType(type: string): number {
    switch (type) {
      case 'village':
        return 1.0; // 村庄威胁度最低
      case 'town':
        return 1.5; // 城镇威胁度中等
      case 'city':
        return 2.5; // 城市威胁度最高
      case 'fortress':
        return 2.0; // 要塞威胁度较高
      case 'ruins':
        return 1.2; // 废墟威胁度较低
      case 'dungeon':
        return 1.8; // 地牢威胁度较高
      default:
        return 1.0;
    }
  }

  // 更新据点状态（专门用于战斗结果）
  public async updateLocationStatus(
    locationId: string,
    status: 'unknown' | 'scouted' | 'attacked' | 'conquered',
  ): Promise<boolean> {
    try {
      console.log(`探索服务更新据点状态: ${locationId} -> ${status}`);

      // 查找并更新据点状态
      const location = this.locations.value.find(loc => loc.id === locationId);
      if (location) {
        location.status = status;
        location.lastAttacked = Date.now();
        console.log(`据点 ${location.name} 状态已更新为: ${status}`);
      } else {
        console.warn(`未找到据点 ${locationId}，无法更新状态`);
        return false;
      }

      // 更新征服列表
      if (status === 'conquered') {
        if (!this.state.value.conqueredLocations) {
          this.state.value.conqueredLocations = [];
        }
        if (!this.state.value.conqueredLocations.includes(locationId)) {
          this.state.value.conqueredLocations.push(locationId);

          // 根据据点等级增加威胁度
          this.addThreatFromConquest(location);

          // 检查是否为区域首都
          await this.checkAndUpdateCapitalConquest(location);

          // 触发区域征服进度的重新计算
          await this.updateRegionProgressFromLocation(location);
        }
      }

      // 保存数据到数据库
      await this.saveExploreData();

      return true;
    } catch (error) {
      console.error('更新据点状态失败:', error);
      return false;
    }
  }

  // ==================== 存档恢复功能 ====================

  // 从存档数据恢复探索状态
  public async restoreFromSaveData(exploreData: any): Promise<void> {
    try {
      if (exploreData.locations) {
        this.locations.value = exploreData.locations;
      }
      if (exploreData.state) {
        this.state.value = exploreData.state;
      }
      // 保存到数据库
      await this.saveExploreData();
    } catch (error) {
      console.error('从存档恢复探索数据失败:', error);
    }
  }

  // ==================== 数据持久化功能 ====================

  // 保存据点数据到数据库
  private saveLocationsToDatabase(): void {
    try {
      // 保存据点数据到模块化存档
      modularSaveManager.updateModuleData({
        moduleName: 'exploration',
        data: {
          locations: this.locations.value,
          state: this.state.value,
        },
      });
    } catch (error) {
      console.error('保存据点数据失败:', error);
    }
  }

  // ==================== 敌方单位生成辅助功能 ====================

  // 为已侦察但无敌方单位数据的据点生成敌方单位
  private generateEnemyUnitsForScoutedLocations(): void {
    try {
      const scoutedLocations = this.locations.value.filter(
        location => location.status === 'scouted' && (!location.enemyUnits || location.enemyUnits.length === 0),
      );

      if (scoutedLocations.length > 0) {
        console.log(`发现 ${scoutedLocations.length} 个已侦察但无敌方单位数据的据点，开始生成...`);

        for (const location of scoutedLocations) {
          try {
            const enemyUnits = this.getLocationEnemyUnits(location.id, 1);
            console.log(`据点 ${location.name} 敌方单位生成完成:`, enemyUnits.length, '个单位');
          } catch (error) {
            console.warn(`据点 ${location.name} 敌方单位生成失败:`, error);
          }
        }
      }
    } catch (error) {
      console.error('为已侦察据点生成敌方单位失败:', error);
    }
  }

  // ==================== 数据重置功能 ====================

  // 重置探索数据
  public resetExploreData(): void {
    try {
      // 重置状态
      this.state.value = {
        scoutedLocations: [],
        conqueredLocations: [],
      };

      // 重置据点数据到初始状态
      this.locations.value = [...INITIAL_LOCATIONS];

      console.log('探索数据已初始化');
    } catch (error) {
      console.error('初始化探索数据失败:', error);
    }
  }
}

// 创建全局探索服务实例
export const exploreService = new ExploreService();
