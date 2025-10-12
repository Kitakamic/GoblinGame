import picsheetData from '../../图片tags/Picsheet.csv?raw';

/**
 * 图片资源信息接口
 */
export interface PictureResource {
  id: string;
  race: string;
  class: string;
  prompt: string;
  imageUrl?: string; // 完整的图片URL
}

/**
 * 据点类型到职业的映射关系
 */
export interface LocationTypeToClassMapping {
  town: string[];
  village: string[];
  city: string[];
  fortress: string[];
  ruins: string[];
  dungeon: string[];
}

/**
 * 图片资源映射服务
 * 负责管理据点类型、种族、职业与图片资源的对应关系
 */
export class PictureResourceMappingService {
  private static instance: PictureResourceMappingService;
  private pictureResources: PictureResource[] = [];

  // 图片URL前缀
  private static readonly IMAGE_URL_PREFIX = 'https://kitakamis.online/portraits/';

  // 据点类型到职业的映射关系（基于角色绘制生成器的种族特色职业体系）
  private readonly LOCATION_TYPE_TO_CLASS_MAPPING: LocationTypeToClassMapping = {
    town: ['商人', '教师', '学者', '医师', '吟游诗人', '法师', '战士', '盗贼'], // 城镇：商业、教育、医疗、娱乐、魔法、军事、地下活动
    village: ['医师', '教师', '商人', '女仆', '精灵侍女', '德鲁伊', '游侠', '祭司', '元素使'], // 村庄：基础服务，包含精灵特色职业
    city: [
      '女王',
      '王后',
      '公主',
      '学者',
      '商人',
      '教师',
      '医师',
      '领主',
      '法师',
      '骑士',
      '牧师',
      '战士',
      '歌妓',
      '船长',
    ], // 城市：政治、文化、商业中心，包含各种族特色职业
    fortress: ['骑士', '战士', '法师', '牧师', '姬武士', '狂战士', '暗影刺客', '血法师', '巫灵姐妹', '奴主'], // 要塞：军事、宗教、黑暗势力，包含各种族军事职业
    ruins: ['盗贼', '法师', '学者', '游侠', '德鲁伊', '暗影刺客', '血法师', '元素使', '祭司', '女奴'], // 废墟：探险、研究、魔法遗迹，包含各种族探险职业
    dungeon: [
      '法师',
      '牧师',
      '战士',
      '盗贼',
      '血法师',
      '巫灵姐妹',
      '元素使',
      '暗影刺客',
      '狂战士',
      '奴主',
      '女奴',
      '德鲁伊',
    ], // 地牢：魔法、战斗、探险、黑暗势力，包含各种族危险职业
  };

  private constructor() {
    this.loadPictureResources();
  }

  /**
   * 将数字ID格式化为5位数字并生成完整的图片URL
   * @param id 原始ID（数字字符串）
   * @returns 完整的图片URL
   */
  private static formatImageUrl(id: string): string {
    // 将ID转换为5位数字格式（前面补0）
    const formattedId = id.padStart(5, '0');
    return `${PictureResourceMappingService.IMAGE_URL_PREFIX}${formattedId}.png`;
  }

  public static getInstance(): PictureResourceMappingService {
    if (!PictureResourceMappingService.instance) {
      PictureResourceMappingService.instance = new PictureResourceMappingService();
    }
    return PictureResourceMappingService.instance;
  }

  /**
   * 从CSV数据加载图片资源
   */
  private loadPictureResources(): void {
    try {
      const lines = picsheetData.trim().split('\n');
      const headers = lines[0].split(',');

      // 找到各列的索引
      const idIndex = headers.findIndex(h => h.trim() === '图片ID');
      const raceIndex = headers.findIndex(h => h.trim() === '种族');
      const classIndex = headers.findIndex(h => h.trim() === '职业');
      const promptIndex = headers.findIndex(h => h.trim() === '提示词');

      if (idIndex === -1 || raceIndex === -1 || classIndex === -1 || promptIndex === -1) {
        console.error('图片资源CSV格式错误，缺少必要的列');
        return;
      }

      // 解析数据行
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 4) {
          // 处理提示词中可能包含逗号的情况
          const prompt = values.slice(promptIndex).join(',').replace(/^"|"$/g, '');

          const id = values[idIndex]?.trim() || '';
          this.pictureResources.push({
            id: id,
            race: values[raceIndex]?.trim() || '',
            class: values[classIndex]?.trim() || '',
            prompt: prompt,
            imageUrl: PictureResourceMappingService.formatImageUrl(id),
          });
        }
      }

      console.log(`✅ [图片资源加载] 加载完成，共加载 ${this.pictureResources.length} 个图片资源`);

      // 统计各种族和职业的分布
      const raceStats = this.pictureResources.reduce(
        (acc, resource) => {
          acc[resource.race] = (acc[resource.race] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const classStats = this.pictureResources.reduce(
        (acc, resource) => {
          acc[resource.class] = (acc[resource.class] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log(`📊 [图片资源加载] 种族分布:`, raceStats);
      console.log(`📊 [图片资源加载] 职业分布:`, classStats);
    } catch (error) {
      console.error('加载图片资源失败:', error);
    }
  }

  /**
   * 根据据点类型和种族获取匹配的图片资源
   * @param locationType 据点类型
   * @param race 种族
   * @returns 匹配的图片资源列表
   */
  public getMatchingPictureResources(locationType: string, race: string): PictureResource[] {
    console.log(`🔍 [图片资源匹配] 开始匹配图片资源...`);
    console.log(`📍 [图片资源匹配] 据点信息: 类型=${locationType}, 种族=${race}`);

    // 获取该据点类型对应的职业列表
    const allowedClasses = this.LOCATION_TYPE_TO_CLASS_MAPPING[locationType as keyof LocationTypeToClassMapping] || [];
    console.log(`🎯 [图片资源匹配] 据点类型 "${locationType}" 对应的职业列表:`, allowedClasses);

    // 筛选匹配种族和职业的图片资源
    const matchingResources = this.pictureResources.filter(
      resource => resource.race === race && allowedClasses.includes(resource.class),
    );

    console.log(`📊 [图片资源匹配] 匹配结果:`);
    console.log(`  - 总图片资源数量: ${this.pictureResources.length}`);
    console.log(`  - 种族 "${race}" 的图片资源数量: ${this.pictureResources.filter(r => r.race === race).length}`);
    console.log(`  - 最终匹配数量: ${matchingResources.length}`);

    if (matchingResources.length > 0) {
      console.log(`🖼️ [图片资源匹配] 匹配到的图片资源详情:`);
      matchingResources.forEach((resource, index) => {
        console.log(`  ${index + 1}. ID: ${resource.id} | 职业: ${resource.class} | URL: ${resource.imageUrl}`);
      });
    } else {
      console.warn(`⚠️ [图片资源匹配] 未找到匹配的图片资源`);
      console.warn(`💡 [图片资源匹配] 可能的原因:`);
      console.warn(`  1. 种族 "${race}" 在图片库中不存在`);
      console.warn(`  2. 据点类型 "${locationType}" 对应的职业在图片库中不存在`);
      console.warn(`  3. 种族和职业组合不匹配`);
    }

    return matchingResources;
  }

  /**
   * 随机选择一个匹配的图片资源
   * @param locationType 据点类型
   * @param race 种族
   * @returns 随机选择的图片资源，如果没有匹配的则返回null
   */
  public getRandomMatchingPictureResource(locationType: string, race: string): PictureResource | null {
    console.log(`🎲 [随机选择] 开始随机选择图片资源...`);

    const matchingResources = this.getMatchingPictureResources(locationType, race);

    if (matchingResources.length === 0) {
      console.log(`❌ [随机选择] 没有匹配的图片资源，返回null`);
      return null;
    }

    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * matchingResources.length);
    const selectedResource = matchingResources[randomIndex];

    console.log(`🎯 [随机选择] 随机选择结果:`);
    console.log(`  - 候选数量: ${matchingResources.length}`);
    console.log(`  - 随机索引: ${randomIndex}`);
    console.log(`  - 选中资源: ID=${selectedResource.id}, 职业=${selectedResource.class}`);
    console.log(`  - 图片URL: ${selectedResource.imageUrl}`);
    console.log(`✅ [随机选择] 随机选择完成`);

    return selectedResource;
  }

  /**
   * 根据图片ID获取图片资源
   * @param pictureId 图片ID
   * @returns 图片资源，如果不存在则返回null
   */
  public getPictureResourceById(pictureId: string): PictureResource | null {
    return this.pictureResources.find(resource => resource.id === pictureId) || null;
  }

  /**
   * 获取所有种族列表
   * @returns 种族列表
   */
  public getAllRaces(): string[] {
    const races = [...new Set(this.pictureResources.map(resource => resource.race))];
    return races.sort();
  }

  /**
   * 获取所有职业列表
   * @returns 职业列表
   */
  public getAllClasses(): string[] {
    const classes = [...new Set(this.pictureResources.map(resource => resource.class))];
    return classes.sort();
  }

  /**
   * 获取指定种族的所有职业
   * @param race 种族
   * @returns 职业列表
   */
  public getClassesByRace(race: string): string[] {
    const classes = [
      ...new Set(this.pictureResources.filter(resource => resource.race === race).map(resource => resource.class)),
    ];
    return classes.sort();
  }

  /**
   * 获取指定职业的所有种族
   * @param className 职业
   * @returns 种族列表
   */
  public getRacesByClass(className: string): string[] {
    const races = [
      ...new Set(this.pictureResources.filter(resource => resource.class === className).map(resource => resource.race)),
    ];
    return races.sort();
  }

  /**
   * 根据图片ID获取完整的图片URL
   * @param pictureId 图片ID
   * @returns 完整的图片URL
   */
  public getImageUrlById(pictureId: string): string {
    return PictureResourceMappingService.formatImageUrl(pictureId);
  }

  /**
   * 重新加载图片资源（开发时使用）
   */
  public reloadPictureResources(): void {
    console.log('重新加载图片资源...');
    this.pictureResources = [];
    this.loadPictureResources();
    console.log('图片资源重新加载完成');
  }
}

// 创建全局实例
export const pictureResourceMappingService = PictureResourceMappingService.getInstance();
