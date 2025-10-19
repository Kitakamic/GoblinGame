import {
  characterNameGenerationService,
  type GeneratedName,
  type NameGenerationOptions,
} from '../../人物管理/服务/人物名称生成服务';
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
  generatedName?: GeneratedName; // 生成的人物名称
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

  // 已使用的图片ID记录（用于避免重复）
  private usedPictureIds: Set<string> = new Set();

  // 图片URL前缀
  private static readonly IMAGE_URL_PREFIX = 'https://kitakamis.online/portraits/';

  // 种族到职业的映射关系（基于角色绘制生成器的种族特色职业体系）
  private readonly RACE_TO_CLASS_MAPPING: Record<string, string[]> = {
    人类: [
      // 共通职业
      '法师',
      '医师',
      '吟游诗人',
      // 人类特色职业 - 体现军事霸权和贵族文化
      '骑士', // 精英骑士，体现军事霸权
      '牧师', // 圣职者，体现宗教文化
      '女王', // 统治者
      '公主', // 皇室成员
      '王后', // 皇室成员
      '战士', // 军事人员
      '学者', // 知识阶层
      '商人', // 贸易人员
      '盗贼', // 地下人员
      '教师', // 教育者
      '女仆',
    ],
    永恒精灵: [
      // 永恒精灵特色职业 - 体现自然和谐和魔法传承 - 无共通职业
      '德鲁伊', // 自然魔法使用者
      '游侠', // 森林守护者
      '祭司', // 自然信仰者
      '元素使', // 元素使
      '精灵侍女', // 精灵侍女
    ],
    黑暗精灵: [
      // 黑暗精灵特色职业 - 体现黑暗魔法和军事文化
      '奴主', // 奴隶主
      '女奴', // 黑暗女奴，类似女仆，但衣着更加暴露，性奴隶
      '血法师', // 血法师
      '巫灵姐妹', // 持鞭近战
      '狂战士', // 狂战士，暴露盔甲
      '暗影刺客', // 暗影刺客
    ],
    狐族: [
      // 共通职业
      '医师',
      '吟游诗人',
      // 狐族特色职业 - 体现神信仰和贸易文化
      '巫女', // 九尾神信仰者
      '姬武士', // 狐族武士
      '领主', // 狐族领主
      '海贼', // 海上劫掠者
      '船长', // 狐族船长
      '歌妓', // 狐族歌妓
    ],
  };

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
   * 根据种族和据点类型获取有效的职业列表
   * @param race 种族
   * @param locationType 据点类型
   * @returns 有效的职业列表
   */
  private getValidClassesForRaceAndLocation(race: string, locationType: string): string[] {
    // 获取据点类型允许的职业
    const locationClasses = this.LOCATION_TYPE_TO_CLASS_MAPPING[locationType as keyof LocationTypeToClassMapping] || [];

    // 获取种族允许的职业
    const raceClasses = this.RACE_TO_CLASS_MAPPING[race] || [];

    // 取交集，确保职业既符合据点类型又符合种族限制
    const validClasses = locationClasses.filter(cls => raceClasses.includes(cls));

    console.log(`🔍 [职业验证] 种族 "${race}" + 据点类型 "${locationType}" 职业验证:`, {
      据点允许职业: locationClasses,
      种族允许职业: raceClasses,
      有效职业: validClasses,
      验证结果: validClasses.length > 0 ? '通过' : '失败',
    });

    return validClasses;
  }

  /**
   * 随机选择一个匹配的图片资源（先选职业，再选图片）
   * @param locationType 据点类型
   * @param race 种族
   * @param generateName 是否生成人物名称，默认为true
   * @returns 随机选择的图片资源，如果没有匹配的则返回null
   */
  public getRandomMatchingPictureResource(
    locationType: string,
    race: string,
    generateName: boolean = true,
  ): PictureResource | null {
    console.log(`🎲 [随机选择] 开始随机选择图片资源（先选职业，再选图片）...`);

    // 第一步：根据种族和据点类型获取有效的职业列表
    const validClasses = this.getValidClassesForRaceAndLocation(race, locationType);
    console.log(`🎯 [职业选择] 种族 "${race}" + 据点类型 "${locationType}" 的有效职业列表:`, validClasses);

    if (validClasses.length === 0) {
      console.log(`❌ [职业选择] 种族 "${race}" 在据点类型 "${locationType}" 中没有有效的职业组合`);
      return null;
    }

    // 第二步：随机选择一个职业
    const randomClassIndex = Math.floor(Math.random() * validClasses.length);
    const selectedClass = validClasses[randomClassIndex];
    console.log(`🎲 [职业选择] 随机选择职业:`, {
      候选职业数: validClasses.length,
      随机索引: randomClassIndex,
      选中职业: selectedClass,
    });

    // 第三步：根据种族+职业获取匹配的图片资源
    const matchingResources = this.pictureResources.filter(
      resource => resource.race === race && resource.class === selectedClass,
    );

    console.log(`🔍 [图片匹配] 种族 "${race}" + 职业 "${selectedClass}" 匹配结果:`, {
      匹配图片数量: matchingResources.length,
      图片ID范围:
        matchingResources.length > 0
          ? `${matchingResources[0].id} - ${matchingResources[matchingResources.length - 1].id}`
          : '无',
      遍历状态: '已完成',
    });

    if (matchingResources.length === 0) {
      console.log(`❌ [图片匹配] 没有找到匹配的图片资源`);
      return null;
    }

    // 第四步：从匹配的图片中筛选未使用的
    const unusedMatchingResources = matchingResources.filter(resource => !this.usedPictureIds.has(resource.id));

    if (unusedMatchingResources.length > 0) {
      // 第五步：从未使用的图片中随机选择一个
      const randomPictureIndex = Math.floor(Math.random() * unusedMatchingResources.length);
      const selectedResource = unusedMatchingResources[randomPictureIndex];

      // 标记为已使用
      this.usedPictureIds.add(selectedResource.id);

      // 生成人物名称（如果需要）
      if (generateName) {
        try {
          const nameOptions: NameGenerationOptions = {
            race: selectedResource.race,
          };

          const generatedName = characterNameGenerationService.generateName(nameOptions);
          selectedResource.generatedName = generatedName;

          console.log(`🎭 [名称生成] 为图片资源生成名称:`, {
            id: selectedResource.id,
            name: generatedName.fullName,
          });
        } catch (error) {
          console.warn(`⚠️ [名称生成] 生成失败:`, error);
        }
      }

      console.log(`🎯 [图片选择] 第一优先级选择结果:`);
      console.log(`  - 匹配图片总数: ${matchingResources.length}`);
      console.log(`  - 未使用图片数: ${unusedMatchingResources.length}`);
      console.log(`  - 随机索引: ${randomPictureIndex}`);
      console.log(`  - 选中资源: ID=${selectedResource.id}, 职业=${selectedResource.class}`);
      console.log(`  - 图片URL: ${selectedResource.imageUrl}`);
      console.log(`  - 生成名称: ${selectedResource.generatedName?.fullName || '未生成'}`);
      console.log(`✅ [图片选择] 第一优先级选择完成`);

      return selectedResource;
    }

    console.log(`⚠️ [图片选择] 该职业的所有图片都已使用，尝试降级策略...`);

    // 降级策略：尝试其他职业
    const otherClasses = validClasses.filter((className: string) => className !== selectedClass);
    console.log(`🔄 [降级策略] 开始尝试其他职业:`, otherClasses);

    for (const className of otherClasses) {
      const otherMatchingResources = this.pictureResources.filter(
        resource => resource.race === race && resource.class === className,
      );
      const unusedOtherResources = otherMatchingResources.filter(resource => !this.usedPictureIds.has(resource.id));

      console.log(`🔍 [降级策略] 尝试职业 "${className}":`, {
        匹配图片数: otherMatchingResources.length,
        未使用图片数: unusedOtherResources.length,
      });

      if (unusedOtherResources.length > 0) {
        const randomIndex = Math.floor(Math.random() * unusedOtherResources.length);
        const selectedResource = unusedOtherResources[randomIndex];

        this.usedPictureIds.add(selectedResource.id);

        // 生成人物名称（如果需要）
        if (generateName) {
          try {
            const nameOptions: NameGenerationOptions = {
              race: selectedResource.race,
            };

            const generatedName = characterNameGenerationService.generateName(nameOptions);
            selectedResource.generatedName = generatedName;

            console.log(`🎭 [名称生成] 降级策略生成名称:`, {
              id: selectedResource.id,
              name: generatedName.fullName,
            });
          } catch (error) {
            console.warn(`⚠️ [名称生成] 降级策略生成失败:`, error);
          }
        }

        console.log(`🎯 [图片选择] 降级策略选择结果:`);
        console.log(`  - 降级职业: ${className}`);
        console.log(`  - 选中资源: ID=${selectedResource.id}, 职业=${selectedResource.class}`);
        console.log(`  - 图片URL: ${selectedResource.imageUrl}`);
        console.log(`  - 生成名称: ${selectedResource.generatedName?.fullName || '未生成'}`);
        console.log(`✅ [图片选择] 降级策略选择完成`);

        return selectedResource;
      }
    }

    console.log(`⚠️ [图片选择] 所有职业的图片都已使用，尝试同种族其他职业...`);

    // 进一步降级：同种族的其他职业
    const allSameRaceResources = this.pictureResources.filter(resource => resource.race === race);
    const unusedSameRaceResources = allSameRaceResources.filter(resource => !this.usedPictureIds.has(resource.id));

    console.log(`🔍 [同种族降级] 种族 "${race}" 所有职业匹配结果:`, {
      总图片数: allSameRaceResources.length,
      未使用图片数: unusedSameRaceResources.length,
      遍历状态: '已完成',
    });

    if (unusedSameRaceResources.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedSameRaceResources.length);
      const selectedResource = unusedSameRaceResources[randomIndex];

      this.usedPictureIds.add(selectedResource.id);

      // 生成人物名称（如果需要）
      if (generateName) {
        try {
          const nameOptions: NameGenerationOptions = {
            race: selectedResource.race,
          };

          const generatedName = characterNameGenerationService.generateName(nameOptions);
          selectedResource.generatedName = generatedName;

          console.log(`🎭 [名称生成] 同种族降级生成名称:`, {
            id: selectedResource.id,
            name: generatedName.fullName,
          });
        } catch (error) {
          console.warn(`⚠️ [名称生成] 同种族降级生成失败:`, error);
        }
      }

      console.log(`🎯 [图片选择] 同种族降级选择结果:`);
      console.log(`  - 选中资源: ID=${selectedResource.id}, 职业=${selectedResource.class}`);
      console.log(`  - 图片URL: ${selectedResource.imageUrl}`);
      console.log(`  - 生成名称: ${selectedResource.generatedName?.fullName || '未生成'}`);
      console.log(`✅ [图片选择] 同种族降级选择完成`);

      return selectedResource;
    }

    console.log(`❌ [图片选择] 所有图片资源都已使用，重置使用记录并重新选择`);

    // 如果所有图片都用完了，重置使用记录
    this.resetUsedPictureIds();

    // 重新尝试第一优先级
    const freshMatchingResources = this.pictureResources.filter(
      resource => resource.race === race && resource.class === selectedClass,
    );
    if (freshMatchingResources.length > 0) {
      const randomIndex = Math.floor(Math.random() * freshMatchingResources.length);
      const selectedResource = freshMatchingResources[randomIndex];

      this.usedPictureIds.add(selectedResource.id);

      // 生成人物名称（如果需要）
      if (generateName) {
        try {
          const nameOptions: NameGenerationOptions = {
            race: selectedResource.race,
          };

          const generatedName = characterNameGenerationService.generateName(nameOptions);
          selectedResource.generatedName = generatedName;

          console.log(`🎭 [名称生成] 重置后生成名称:`, {
            id: selectedResource.id,
            name: generatedName.fullName,
          });
        } catch (error) {
          console.warn(`⚠️ [名称生成] 重置后生成失败:`, error);
        }
      }

      console.log(`🔄 [图片选择] 重置后重新选择:`);
      console.log(`  - 选中资源: ID=${selectedResource.id}, 职业=${selectedResource.class}`);
      console.log(`  - 图片URL: ${selectedResource.imageUrl}`);
      console.log(`  - 生成名称: ${selectedResource.generatedName?.fullName || '未生成'}`);

      return selectedResource;
    }

    console.log(`❌ [图片选择] 没有匹配的图片资源，返回null`);
    return null;
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
   * 重置已使用的图片ID记录
   */
  public resetUsedPictureIds(): void {
    console.log(`🔄 [重置记录] 重置已使用的图片ID记录`);
    console.log(`📊 [重置记录] 重置前已使用数量: ${this.usedPictureIds.size}`);
    this.usedPictureIds.clear();
    console.log(`✅ [重置记录] 重置完成，已使用数量: ${this.usedPictureIds.size}`);
  }

  /**
   * 获取已使用的图片ID统计信息
   */
  public getUsedPictureIdsStats(): { usedCount: number; totalCount: number; usageRate: number } {
    const usedCount = this.usedPictureIds.size;
    const totalCount = this.pictureResources.length;
    const usageRate = totalCount > 0 ? (usedCount / totalCount) * 100 : 0;

    return {
      usedCount,
      totalCount,
      usageRate: Math.round(usageRate * 100) / 100, // 保留两位小数
    };
  }

  /**
   * 重新加载图片资源（开发时使用）
   */
  public reloadPictureResources(): void {
    console.log('重新加载图片资源...');
    this.pictureResources = [];
    this.usedPictureIds.clear(); // 重置使用记录
    this.loadPictureResources();
    console.log('图片资源重新加载完成');
  }
}

// 创建全局实例
export const pictureResourceMappingService = PictureResourceMappingService.getInstance();
