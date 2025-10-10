import { ref, watch } from 'vue';
import { modularSaveManager } from '../../存档管理/模块化存档服务';
import regionData from '../区域信息表.csv?raw';
import continentData from '../大陆信息表.csv?raw';
import type { Continent, ContinentExploreState, Region } from '../类型/大陆探索类型';
import type { Location } from '../类型/探索类型';

/**
 * 大陆探索服务类
 * 管理基于大陆的探索系统
 */
export class ContinentExploreService {
  // ==================== 响应式数据 ====================

  // 大陆数据
  public continents = ref<Continent[]>([]);

  // 探索状态
  public exploreState = ref<ContinentExploreState>({
    unlockedContinents: [],
    conqueredContinents: [],
    currentContinent: '',
    continentProgress: {},
  });

  // ==================== 构造函数和初始化 ====================

  constructor() {
    // 先初始化CSV数据
    this.initializeContinents();
    this.setupDataWatchers();
    // 延迟初始化，等待存档系统加载完成
    setTimeout(() => {
      this.initializeExploreData();
    }, 100);
  }

  // 初始化大陆数据
  private initializeContinents(): void {
    console.log('🔍 [大陆探索服务] 开始初始化大陆数据...');
    // 从CSV表格读取大陆数据
    const continents = this.loadContinentDataFromCSV();

    // 只有在没有数据时才设置，避免覆盖存档数据
    if (this.continents.value.length === 0) {
      this.continents.value = continents;
      console.log('🔍 [大陆探索服务] 大陆数据初始化完成，共', continents.length, '个大陆');
      console.log('🔍 [大陆探索服务] 大陆数据详情:', continents);
    } else {
      console.log('🔍 [大陆探索服务] 大陆数据已存在，跳过CSV初始化');
    }
  }

  // 从CSV表格加载大陆数据
  private loadContinentDataFromCSV(): Continent[] {
    console.log('🔍 [大陆探索服务] 开始解析CSV数据...');
    console.log('🔍 [大陆探索服务] 大陆CSV数据:', continentData);

    // 解析大陆CSV数据
    const continentLines = continentData.trim().split('\n');
    console.log('🔍 [大陆探索服务] 大陆CSV行数:', continentLines.length);
    const continentHeaders = continentLines[0].split(',');
    console.log('🔍 [大陆探索服务] 大陆CSV表头:', continentHeaders);
    const continentRows = continentLines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      continentHeaders.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      return row;
    });
    console.log('🔍 [大陆探索服务] 大陆CSV解析结果:', continentRows);

    // 解析区域CSV数据
    const regionLines = regionData.trim().split('\n');
    const regionHeaders = regionLines[0].split(',');
    const regionRows = regionLines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      regionHeaders.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      return row;
    });

    // 构建大陆数据
    const continents: Continent[] = continentRows.map(row => ({
      name: row['大陆名称'],
      icon: row['大陆图标'],
      description: row['大陆描述'],
      difficulty: parseInt(row['大陆难度']),
      explorationCost: {
        gold: parseInt(row['探索成本(金币)']),
        food: parseInt(row['探索成本(食物)']),
      },
      threatMultiplier: parseFloat(row['威胁倍数']),
      conquestProgress: 0,
      isUnlocked: row['是否解锁'] === 'true',
      isConquered: row['是否征服'] === 'true',
      unlockCondition: {
        conquestPercentage: 0,
        previousContinentName: undefined,
      },
      regions: [],
    }));

    // 构建区域数据
    const regions: Region[] = regionRows.map(row => ({
      name: row['区域名称'],
      icon: row['区域图标'],
      continentName: row['所属大陆'],
      description: row['区域描述'],
      difficulty: parseInt(row['区域难度']),
      isUnlocked: row['是否解锁'] === 'true',
      isConquered: row['是否征服'] === 'true',
      conquestProgress: 0,
      requiredStars: parseInt(row['征服需要总星级']) || 0,
      unlockStars: parseInt(row['解锁星级']) || 0,
      capital: row['首都'] || '',
      threatLevel: 0,
      locations: [],
    }));

    // 将区域分配给对应的大陆
    console.log('🔍 [大陆探索服务] 开始分配区域到大陆...');
    console.log(
      '🔍 [大陆探索服务] 大陆列表:',
      continents.map(c => ({ name: c.name })),
    );
    console.log(
      '🔍 [大陆探索服务] 区域列表:',
      regions.map(r => ({ name: r.name, continentName: r.continentName })),
    );

    const result = continents.map(continent => {
      const continentRegions = regions.filter(region => region.continentName === continent.name);
      console.log(
        `🔍 [大陆探索服务] 大陆 ${continent.name} 匹配到 ${continentRegions.length} 个区域:`,
        continentRegions.map(r => r.name),
      );
      return {
        ...continent,
        regions: continentRegions,
      };
    });

    console.log(
      '🔍 [大陆探索服务] 最终大陆数据:',
      result.map(c => ({ name: c.name, regionsCount: c.regions.length })),
    );
    return result;
  }

  // 初始化探索数据
  private async initializeExploreData(): Promise<void> {
    await this.loadExploreData();
  }

  // 手动初始化探索数据（供存档系统调用）
  public async initializeFromSave(): Promise<void> {
    await this.loadExploreData();
  }

  // 重新加载CSV数据（开发时使用）
  public reloadCSVData(): void {
    console.log('🔄 重新加载CSV数据...');
    this.initializeContinents();
    console.log('✅ CSV数据重新加载完成');
  }

  // 初始化新游戏数据（供存档系统调用）
  public initializeNewGame(): void {
    this.resetExploreData();
  }

  // ==================== 大陆管理功能 ====================

  // 获取所有大陆
  public getAllContinents(): Continent[] {
    return this.continents.value;
  }

  // 获取已解锁的大陆
  public getUnlockedContinents(): Continent[] {
    return this.continents.value.filter(continent => continent.isUnlocked);
  }

  // 获取当前可探索的大陆
  public getCurrentContinent(): Continent | null {
    const currentName = this.exploreState.value.currentContinent;
    return this.continents.value.find(c => c.name === currentName) || null;
  }

  // 解锁大陆
  public unlockContinent(continentName: string): boolean {
    try {
      const continent = this.continents.value.find(c => c.name === continentName);
      if (!continent) {
        console.warn(`大陆 ${continentName} 不存在`);
        return false;
      }

      // 检查解锁条件
      if (!this.checkUnlockConditions(continent)) {
        console.warn(`大陆 ${continent.name} 解锁条件未满足`);
        return false;
      }

      // 解锁大陆
      continent.isUnlocked = true;

      // 更新探索状态
      if (!this.exploreState.value.unlockedContinents.includes(continentName)) {
        this.exploreState.value.unlockedContinents.push(continentName);
      }

      // 设置当前大陆
      if (!this.exploreState.value.currentContinent) {
        this.exploreState.value.currentContinent = continentName;
      }

      console.log(`大陆 ${continent.name} 已解锁`);
      this.saveExploreData();

      return true;
    } catch (error) {
      console.error('解锁大陆失败:', error);
      return false;
    }
  }

  // 检查解锁条件
  private checkUnlockConditions(continent: Continent): boolean {
    const { previousContinentName } = continent.unlockCondition;

    // 如果没有前置大陆要求，直接解锁
    if (!previousContinentName) {
      return true;
    }

    // 检查前置大陆的征服进度是否达到50%
    const previousProgress = this.exploreState.value.continentProgress[previousContinentName] || 0;
    return previousProgress >= 50;
  }

  // 更新大陆征服进度
  public updateContinentProgress(continentName: string, progress: number): void {
    try {
      const continent = this.continents.value.find(c => c.name === continentName);
      if (!continent) {
        console.warn(`大陆 ${continentName} 不存在`);
        return;
      }

      // 更新征服进度
      continent.conquestProgress = Math.min(100, Math.max(0, progress));
      this.exploreState.value.continentProgress[continentName] = continent.conquestProgress;

      // 检查是否完全征服
      if (continent.conquestProgress >= 100 && !continent.isConquered) {
        continent.isConquered = true;
        if (!this.exploreState.value.conqueredContinents.includes(continentName)) {
          this.exploreState.value.conqueredContinents.push(continentName);
        }
        console.log(`大陆 ${continent.name} 已完全征服`);
      }

      // 检查是否可以解锁下一个大陆
      this.checkNextContinentUnlock(continentName);

      this.saveExploreData();
    } catch (error) {
      console.error('更新大陆征服进度失败:', error);
    }
  }

  // 基于区域征服自动计算大陆征服进度
  public calculateContinentProgressFromRegions(continentName: string): void {
    try {
      const continent = this.continents.value.find(c => c.name === continentName);
      if (!continent) {
        console.warn(`大陆 ${continentName} 不存在`);
        return;
      }

      // 计算所有区域的平均征服进度（包括未解锁的区域）
      let totalProgress = 0;
      let regionCount = 0;

      console.log(`🔍 [大陆征服进度计算] 开始计算大陆 ${continent.name} 的征服进度`);
      continent.regions.forEach(region => {
        console.log(
          `🔍 [大陆征服进度计算] 区域 ${region.name}: 解锁=${region.isUnlocked}, 征服进度=${region.conquestProgress}%`,
        );
        // 计算所有区域的征服进度，不管是否解锁
        totalProgress += region.conquestProgress;
        regionCount++;
      });

      // 计算平均征服进度
      const averageProgress = regionCount > 0 ? totalProgress / regionCount : 0;
      continent.conquestProgress = Math.min(100, Math.max(0, averageProgress));

      console.log(
        `🔍 [大陆征服进度计算] 大陆 ${continent.name} 征服进度: ${continent.conquestProgress.toFixed(1)}% (基于${regionCount}个区域的平均值)`,
      );

      // 检查大陆是否完全征服
      if (continent.conquestProgress >= 100 && !continent.isConquered) {
        continent.isConquered = true;
        if (!this.exploreState.value.conqueredContinents.includes(continentName)) {
          this.exploreState.value.conqueredContinents.push(continentName);
        }
        console.log(`大陆 ${continent.name} 已完全征服`);
      }

      // 检查是否可以解锁下一个大陆
      this.checkNextContinentUnlock(continentName);

      this.saveExploreData();
    } catch (error) {
      console.error('计算大陆征服进度失败:', error);
    }
  }

  // 检查是否可以解锁下一个大陆
  private checkNextContinentUnlock(conqueredContinentName: string): void {
    const nextContinent = this.continents.value.find(
      c => c.unlockCondition.previousContinentName === conqueredContinentName,
    );

    if (nextContinent && !nextContinent.isUnlocked) {
      if (this.checkUnlockConditions(nextContinent)) {
        this.unlockContinent(nextContinent.name);
      }
    }
  }

  // ==================== 区域管理功能 ====================

  // 解锁区域
  public unlockRegion(regionName: string): boolean {
    try {
      const region = this.findRegionByName(regionName);
      if (!region) {
        console.warn(`区域 ${regionName} 不存在`);
        return false;
      }

      // 检查是否已经解锁
      if (region.isUnlocked) {
        console.log(`区域 ${region.name} 已经解锁`);
        return true;
      }

      // 检查大陆是否已解锁
      const continent = this.continents.value.find(c => c.name === region.continentName);
      if (!continent || !continent.isUnlocked) {
        console.warn(`区域 ${region.name} 所属大陆未解锁`);
        return false;
      }

      // 检查解锁条件（需要征服大陆上所有区域的据点总星级达到解锁星级）
      if (!this.checkRegionUnlockConditions(region)) {
        console.warn(`区域 ${region.name} 解锁条件未满足`);
        return false;
      }

      // 解锁区域
      region.isUnlocked = true;
      console.log(`区域 ${region.name} 已解锁`);
      this.saveExploreData();

      return true;
    } catch (error) {
      console.error('解锁区域失败:', error);
      return false;
    }
  }

  // 检查区域解锁条件
  private checkRegionUnlockConditions(region: Region): boolean {
    // 如果解锁星级为0，表示默认解锁
    if (region.unlockStars === 0) {
      return true;
    }

    // 计算大陆上所有区域的据点征服总星级
    const continent = this.continents.value.find(c => c.name === region.continentName);
    if (!continent) {
      return false;
    }

    const totalConqueredStars = this.calculateContinentConqueredStars(continent.name);
    return totalConqueredStars >= region.unlockStars;
  }

  // 计算大陆上所有区域的据点征服总星级
  private calculateContinentConqueredStars(continentName: string): number {
    try {
      // 从探索服务获取所有据点数据
      const exploreData = modularSaveManager.getModuleData({ moduleName: 'exploration' });
      if (!exploreData || !(exploreData as any).locations) {
        return 0;
      }

      const locations: Location[] = (exploreData as any).locations;
      const continent = this.continents.value.find(c => c.name === continentName);
      if (!continent) return 0;

      // 计算该大陆所有区域的已征服据点总星级
      let totalStars = 0;
      continent.regions.forEach(region => {
        const regionLocations = locations.filter(
          loc => loc.continent === continent.name && loc.region === region.name && loc.status === 'conquered',
        );

        regionLocations.forEach(location => {
          totalStars += location.difficulty || 0;
        });
      });

      return totalStars;
    } catch (error) {
      console.error('计算大陆征服星级失败:', error);
      return 0;
    }
  }

  // 根据名称查找区域
  private findRegionByName(regionName: string): Region | null {
    for (const continent of this.continents.value) {
      const region = continent.regions.find(r => r.name === regionName);
      if (region) {
        return region;
      }
    }
    return null;
  }

  // 更新区域征服进度
  public updateRegionProgress(regionName: string, progress: number): void {
    try {
      const region = this.findRegionByName(regionName);
      if (!region) {
        console.warn(`区域 ${regionName} 不存在`);
        return;
      }

      // 更新征服进度
      region.conquestProgress = Math.min(100, Math.max(0, progress));

      // 检查是否完全征服
      if (region.conquestProgress >= 100 && !region.isConquered) {
        region.isConquered = true;
        console.log(`区域 ${region.name} 已完全征服`);

        // 检查是否可以解锁下一个区域
        this.checkNextRegionUnlock(regionName);
      }

      this.saveExploreData();
    } catch (error) {
      console.error('更新区域征服进度失败:', error);
    }
  }

  // 基于据点征服自动计算区域征服进度
  public calculateRegionProgressFromLocations(regionName: string): void {
    try {
      const region = this.findRegionByName(regionName);
      if (!region) {
        console.warn(`区域 ${regionName} 不存在`);
        return;
      }

      // 计算该区域已征服的据点总星级
      const conqueredStars = this.calculateRegionConqueredStars(regionName);

      // 计算征服进度
      const progress = region.requiredStars > 0 ? Math.min(100, (conqueredStars / region.requiredStars) * 100) : 0;
      region.conquestProgress = progress;

      console.log(
        `区域 ${region.name} 征服进度: ${progress.toFixed(1)}% (${conqueredStars}/${region.requiredStars}星)`,
      );

      // 检查区域是否完全征服
      if (progress >= 100 && !region.isConquered) {
        region.isConquered = true;
        console.log(`区域 ${region.name} 已完全征服`);

        // 区域完全征服时增加行动力上限
        this.addActionPointsFromRegionConquest();

        // 检查是否可以解锁下一个区域
        this.checkNextRegionUnlock(regionName);
      }

      // 更新对应的大陆征服进度
      this.calculateContinentProgressFromRegions(region.continentName);

      this.saveExploreData();
    } catch (error) {
      console.error('计算区域征服进度失败:', error);
    }
  }

  // 计算区域已征服的据点总星级
  private calculateRegionConqueredStars(regionName: string): number {
    try {
      const region = this.findRegionByName(regionName);
      if (!region) return 0;

      // 从探索服务获取所有据点数据
      const exploreData = modularSaveManager.getModuleData({ moduleName: 'exploration' });
      if (!exploreData || !(exploreData as any).locations) {
        return 0;
      }

      const locations: Location[] = (exploreData as any).locations;
      const continent = this.continents.value.find(c => c.name === region.continentName);
      if (!continent) return 0;

      // 计算该区域已征服的据点总星级
      const regionLocations = locations.filter(
        loc => loc.continent === continent.name && loc.region === region.name && loc.status === 'conquered',
      );

      console.log(`🔍 [征服进度计算] 区域 ${region.name} 的据点匹配:`);
      console.log(`🔍 [征服进度计算] 大陆名称: ${continent.name}`);
      console.log(`🔍 [征服进度计算] 区域名称: ${region.name}`);
      console.log(`🔍 [征服进度计算] 匹配到的据点数量: ${regionLocations.length}`);
      regionLocations.forEach(loc => {
        console.log(`🔍 [征服进度计算] 据点: ${loc.name}, 难度: ${loc.difficulty}, 状态: ${loc.status}`);
      });

      let totalStars = 0;
      regionLocations.forEach(location => {
        totalStars += location.difficulty || 0;
      });

      console.log(`🔍 [征服进度计算] 区域 ${region.name} 总征服星级: ${totalStars}`);
      return totalStars;
    } catch (error) {
      console.error('计算区域征服星级失败:', error);
      return 0;
    }
  }

  // 根据区域征服增加行动力上限
  private addActionPointsFromRegionConquest(): void {
    try {
      // 每征服一个区域，增加1点行动力上限
      const currentMax = modularSaveManager.resources.value.maxActionPoints;
      const newMax = currentMax + 1;

      // 更新最大行动力
      modularSaveManager.setResource('maxActionPoints', newMax);

      // 更新征服区域计数
      const currentRegions = modularSaveManager.resources.value.conqueredRegions;
      modularSaveManager.setResource('conqueredRegions', currentRegions + 1);

      console.log(`征服区域增加行动力上限: ${currentMax} -> ${newMax} (已征服区域: ${currentRegions + 1})`);
    } catch (error) {
      console.error('增加行动力上限失败:', error);
    }
  }

  // 检查是否可以解锁下一个区域
  private checkNextRegionUnlock(conqueredRegionName: string): void {
    const conqueredRegion = this.findRegionByName(conqueredRegionName);
    if (!conqueredRegion) return;

    const continent = this.continents.value.find(c => c.name === conqueredRegion.continentName);
    if (!continent) return;

    // 检查该大陆的其他区域是否可以解锁
    continent.regions.forEach(region => {
      if (!region.isUnlocked && region.unlockStars > 0) {
        if (this.checkRegionUnlockConditions(region)) {
          this.unlockRegion(region.name);
        }
      }
    });
  }

  // 重新计算所有区域的征服进度（供外部调用）
  public recalculateAllRegionProgress(): void {
    try {
      console.log('🔄 重新计算所有区域征服进度...');

      this.continents.value.forEach(continent => {
        continent.regions.forEach(region => {
          this.calculateRegionProgressFromLocations(region.name);
        });
        // 重新计算大陆征服进度
        this.calculateContinentProgressFromRegions(continent.name);
      });

      console.log('✅ 所有区域征服进度重新计算完成');
    } catch (error) {
      console.error('重新计算区域征服进度失败:', error);
    }
  }

  // ==================== 数据持久化功能 ====================

  // 设置数据监听器
  private setupDataWatchers(): void {
    // 监听大陆数据变化
    watch(
      this.continents,
      () => {
        this.saveExploreData();
      },
      { deep: true },
    );

    // 监听探索状态变化
    watch(
      this.exploreState,
      () => {
        this.saveExploreData();
      },
      { deep: true },
    );
  }

  // 加载探索数据
  private async loadExploreData(): Promise<void> {
    try {
      const exploreData = modularSaveManager.getModuleData({ moduleName: 'exploration' });

      if (exploreData) {
        const data = exploreData as any;

        // 数据迁移和兼容性处理
        this.migrateExploreData(data);

        // 加载大陆数据 - 优先使用CSV数据，存档数据作为补充
        if (data.continents && Array.isArray(data.continents) && data.continents.length > 0) {
          this.continents.value = data.continents;
          console.log('从数据库加载大陆数据成功，共', data.continents.length, '个大陆');
        } else {
          // 如果存档中没有大陆数据，强制从CSV加载
          console.log('存档中无大陆数据，强制从CSV加载...');
          const continents = this.loadContinentDataFromCSV();
          this.continents.value = continents;
          console.log('从CSV加载大陆数据成功，共', continents.length, '个大陆');
        }

        // 加载大陆探索状态
        if (data.continentExploreState) {
          this.exploreState.value = data.continentExploreState;
          console.log('从数据库加载大陆探索状态成功');
        }

        console.log('从数据库加载大陆探索数据成功');
      } else {
        console.log('未找到大陆探索数据，使用默认数据');
        // 如果没有存档数据，从CSV加载
        this.initializeContinents();
      }
    } catch (error) {
      console.error('加载大陆探索数据失败:', error);
      // 出错时也从CSV加载
      this.initializeContinents();
    }
  }

  // 数据迁移和兼容性处理
  private migrateExploreData(data: any): void {
    try {
      // 处理旧版本数据迁移
      if (data.continents && !Array.isArray(data.continents)) {
        console.warn('检测到旧版本大陆数据格式，正在迁移...');
        data.continents = [];
      }

      if (data.continentExploreState && typeof data.continentExploreState !== 'object') {
        console.warn('检测到旧版本大陆探索状态格式，正在迁移...');
        data.continentExploreState = {
          unlockedContinents: [],
          conqueredContinents: [],
          currentContinent: '',
          continentProgress: {},
        };
      }

      // 确保大陆数据完整性
      if (data.continents && data.continents.length > 0) {
        data.continents.forEach((continent: any) => {
          // 确保必要字段存在
          if (!continent.regions) continent.regions = [];
          if (!continent.conquestProgress) continent.conquestProgress = 0;
          if (!continent.isUnlocked) continent.isUnlocked = false;
          if (!continent.isConquered) continent.isConquered = false;

          // 确保区域数据完整性
          continent.regions.forEach((region: any) => {
            if (!region.conquestProgress) region.conquestProgress = 0;
            if (!region.isUnlocked) region.isUnlocked = false;
            if (!region.isConquered) region.isConquered = false;
            if (!region.requiredStars) region.requiredStars = 0;
            if (!region.unlockStars) region.unlockStars = 0;
            if (!region.capital) region.capital = '';
            if (!region.threatLevel) region.threatLevel = 0;
            if (!region.locations) region.locations = [];
          });
        });
      }

      console.log('数据迁移和兼容性处理完成');
    } catch (error) {
      console.error('数据迁移失败:', error);
    }
  }

  // 保存探索数据
  public async saveExploreData(): Promise<void> {
    try {
      const currentData = modularSaveManager.getModuleData({ moduleName: 'exploration' }) || {};

      // 数据验证
      const validatedContinents = this.validateContinentsData(this.continents.value);
      const validatedExploreState = this.validateExploreStateData(this.exploreState.value);

      modularSaveManager.updateModuleData({
        moduleName: 'exploration',
        data: {
          ...currentData,
          continents: validatedContinents,
          continentExploreState: validatedExploreState,
        },
      });

      console.log('大陆探索数据已保存到数据库');
    } catch (error) {
      console.error('保存大陆探索数据失败:', error);
    }
  }

  // 验证大陆数据完整性
  private validateContinentsData(continents: any[]): any[] {
    return continents.map(continent => {
      // 确保必要字段存在
      return {
        ...continent,
        name: continent.name || '',
        description: continent.description || '',
        difficulty: continent.difficulty || 1,
        icon: continent.icon || '🌍',
        isUnlocked: Boolean(continent.isUnlocked),
        isConquered: Boolean(continent.isConquered),
        conquestProgress: Number(continent.conquestProgress) || 0,
        regions: continent.regions
          ? continent.regions.map((region: any) => ({
              ...region,
              name: region.name || '',
              continentName: region.continentName || continent.name,
              description: region.description || '',
              difficulty: region.difficulty || 1,
              icon: region.icon || '🏘️',
              isUnlocked: Boolean(region.isUnlocked),
              isConquered: Boolean(region.isConquered),
              conquestProgress: Number(region.conquestProgress) || 0,
              requiredStars: Number(region.requiredStars) || 0,
              unlockStars: Number(region.unlockStars) || 0,
              capital: region.capital || '',
              threatLevel: Number(region.threatLevel) || 0,
              locations: region.locations || [],
            }))
          : [],
      };
    });
  }

  // 验证探索状态数据完整性
  private validateExploreStateData(exploreState: any): any {
    return {
      unlockedContinents: Array.isArray(exploreState.unlockedContinents) ? exploreState.unlockedContinents : [],
      conqueredContinents: Array.isArray(exploreState.conqueredContinents) ? exploreState.conqueredContinents : [],
      currentContinent: exploreState.currentContinent || '',
      continentProgress: exploreState.continentProgress || {},
    };
  }

  // ==================== 数据重置功能 ====================

  // 重置探索数据
  public resetExploreData(): void {
    try {
      // 重置大陆状态
      this.continents.value.forEach(continent => {
        continent.isUnlocked = continent.name === 'gular'; // 只有古拉尔大陆默认解锁
        continent.isConquered = false;
        continent.conquestProgress = 0;
        continent.regions.forEach(region => {
          region.isUnlocked = false;
          region.isConquered = false;
          region.conquestProgress = 0;
          region.threatLevel = 0;
        });
      });

      // 重置探索状态
      this.exploreState.value = {
        unlockedContinents: ['gular'],
        conqueredContinents: [],
        currentContinent: 'gular',
        continentProgress: {},
      };

      console.log('大陆探索数据已重置');
      this.saveExploreData();
    } catch (error) {
      console.error('重置大陆探索数据失败:', error);
    }
  }
}

// 创建全局大陆探索服务实例
export const continentExploreService = new ContinentExploreService();
