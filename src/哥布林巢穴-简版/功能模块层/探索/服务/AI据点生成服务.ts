import { generateWithChainOfThought } from '../../../核心层/服务/世界书管理/工具/AI生成助手';
import { ChainOfThoughtMode } from '../../../核心层/服务/世界书管理/工具/思维链管理器';
import type { Location, LocationType } from '../类型/探索类型';
import { LocationParser } from './AI据点解析服务';
import { continentExploreService } from './大陆探索服务';
import { exploreService } from './探索服务';

/**
 * 侦察队服务
 * 集成消息服务和探索服务，实现侦察队发现目标的完整流程
 */
export class AILocationGenerationService {
  /**
   * 获取据点类型的中文描述（公共方法，供外部使用）
   */
  static getLocationTypeDescription(type: LocationType): string {
    const typeDescriptions: Record<LocationType, string> = {
      // 通用类型
      village: '村庄',
      town: '城镇',
      city: '城市',
      ruins: '遗迹',
      trade_caravan: '贸易商队',
      adventurer_party: '冒险者小队',
      // 古拉尔大陆
      exile_outpost: '流放者据点',
      bandit_camp: '盗匪营地',
      elven_forest: '精灵森林',
      fox_colony: '狐族殖民地',
      // 瓦尔基里大陆
      dark_spire: '巢都尖塔',
      slave_camp: '奴隶营地',
      dark_fortress: '黑暗要塞',
      obsidian_mine: '黑曜石矿场',
      raid_dock: '劫掠舰码头',
      // 香草群岛
      fox_water_town: '狐族水乡',
      shrine: '神社',
      trading_port: '贸易港口',
      warship_dock: '军舰泊地',
      spice_plantation: '香料种植园',
      // 赛菲亚大陆
      imperial_city: '帝国城市',
      noble_estate: '贵族庄园',
      mining_district: '矿业区域',
      border_fortress: '边境要塞',
      cathedral: '教堂',
      academy: '学院',
      // 世界树圣域
      tree_city: '树城',
      elven_temple: '精灵圣殿',
      guardian_outpost: '守卫哨所',
      canopy_palace: '树冠宫殿',
    };
    return typeDescriptions[type] || type;
  }

  /**
   * 据点类型到允许种族的映射关系
   */
  private static readonly LOCATION_TYPE_TO_ALLOWED_RACES: Record<string, string[]> = {
    // ==================== 通用据点类型（所有种族） ====================
    village: ['人类', '永恒精灵', '黑暗精灵', '狐族'], // 村庄：所有种族都可能建立
    town: ['人类', '永恒精灵', '黑暗精灵', '狐族'], // 城镇：所有种族都可能建立
    city: ['人类', '永恒精灵', '黑暗精灵', '狐族'], // 城市：所有种族都可能建立
    ruins: ['人类', '永恒精灵', '黑暗精灵', '狐族'], // 遗迹：可能被任何种族占据
    trade_caravan: ['人类', '永恒精灵', '黑暗精灵', '狐族'], // 贸易商队：所有种族都可能参与
    adventurer_party: ['人类', '永恒精灵', '黑暗精灵', '狐族'], // 冒险者小队：所有种族都可能参与

    // ==================== 古拉尔大陆（流放混居之地）====================
    exile_outpost: ['人类'], // 流放者据点：人类流亡者
    bandit_camp: ['人类'], // 盗匪营地：人类盗匪
    elven_forest: ['永恒精灵'], // 精灵森林：永恒精灵殖民地
    fox_colony: ['狐族'], // 狐族殖民地：狐族移民

    // ==================== 瓦尔基里大陆（黑暗精灵）====================
    dark_spire: ['黑暗精灵'], // 巢都尖塔：黑暗精灵最高权力中心
    slave_camp: ['黑暗精灵'], // 奴隶营地：黑暗精灵奴隶主
    dark_fortress: ['黑暗精灵'], // 黑暗要塞：黑暗精灵军事要塞
    obsidian_mine: ['黑暗精灵'], // 黑曜石矿场：黑暗精灵矿场
    raid_dock: ['黑暗精灵'], // 劫掠舰码头：黑暗精灵海盗

    // ==================== 香草群岛（狐族）====================
    fox_water_town: ['狐族'], // 狐族水乡：狐族水上居民区
    shrine: ['狐族'], // 神社：狐族九尾神信仰中心
    trading_port: ['狐族'], // 贸易港口：狐族商业港口
    warship_dock: ['狐族'], // 军舰泊地：狐族军事港口
    spice_plantation: ['狐族'], // 香料种植园：狐族种植园

    // ==================== 赛菲亚大陆（人类帝国）====================
    imperial_city: ['人类'], // 帝国城市：人类政治中心
    noble_estate: ['人类'], // 贵族庄园：人类贵族领地
    mining_district: ['人类'], // 矿业区域：人类矿工
    border_fortress: ['人类'], // 边境要塞：人类军事要塞
    cathedral: ['人类'], // 教堂：人类宗教中心
    academy: ['人类'], // 学院：人类学术机构

    // ==================== 世界树圣域（永恒精灵）====================
    tree_city: ['永恒精灵'], // 树城：永恒精灵城市
    elven_temple: ['永恒精灵'], // 精灵圣殿：永恒精灵宗教圣地
    guardian_outpost: ['永恒精灵'], // 守卫哨所：永恒精灵边境守卫
    canopy_palace: ['永恒精灵'], // 树冠宫殿：永恒精灵最高权力中心
  };

  /**
   * 获取据点类型允许的种族列表
   * @param locationType 据点类型
   * @returns 允许的种族列表字符串
   */
  private static getAllowedRacesForLocationType(locationType?: LocationType): string {
    if (!locationType) {
      // 如果没有指定类型，返回所有可能的种族
      return '人类/永恒精灵/黑暗精灵/狐族，只允许选择一个种族';
    }

    const allowedRaces = this.LOCATION_TYPE_TO_ALLOWED_RACES[locationType];
    if (!allowedRaces || allowedRaces.length === 0) {
      return '人类/永恒精灵/黑暗精灵/狐族，只允许选择一个种族';
    }

    if (allowedRaces.length === 1) {
      return allowedRaces[0];
    }

    return `${allowedRaces.join('/')}, 只允许选择一个种族`;
  }

  /**
   * 获取据点类型的详细介绍
   * @param locationType 据点类型
   * @returns 据点类型的详细介绍
   */
  private static getLocationTypeIntroduction(locationType: LocationType): string {
    const introductions: Record<LocationType, string> = {
      // 通用类型
      village: '小型村落聚居地',
      town: '中等规模的商业中心',
      city: '大型政治文化中心',
      ruins: '古代遗迹或废弃建筑',
      trade_caravan: '移动的贸易商队',
      adventurer_party: '由冒险者组成的小队',
      // 古拉尔大陆
      exile_outpost: '流放者建立的据点',
      bandit_camp: '盗匪的临时营地',
      elven_forest: '永恒精灵的森林殖民地',
      fox_colony: '狐族移民建立的定居点',
      // 瓦尔基里大陆
      dark_spire: '黑暗精灵的最高权力中心',
      slave_camp: '黑暗精灵的奴隶营地',
      dark_fortress: '黑暗精灵的军事要塞',
      obsidian_mine: '黑暗精灵的黑曜石矿场',
      raid_dock: '黑暗精灵的劫掠舰码头',
      // 香草群岛
      fox_water_town: '狐族的水上居民区',
      shrine: '狐族的九尾神信仰中心',
      trading_port: '狐族的商业港口',
      warship_dock: '狐族的军事港口',
      spice_plantation: '狐族的香料种植园',
      // 赛菲亚大陆
      imperial_city: '人类帝国的政治中心',
      noble_estate: '人类贵族的私人领地',
      mining_district: '人类帝国的矿业区域',
      border_fortress: '人类帝国的边境要塞',
      cathedral: '人类帝国的宗教中心',
      academy: '人类帝国的学术机构',
      // 世界树圣域
      tree_city: '永恒精灵的树城',
      elven_temple: '永恒精灵的宗教圣地',
      guardian_outpost: '永恒精灵的边境守卫哨所',
      canopy_palace: '永恒精灵的最高权力中心',
    };
    return introductions[locationType] || '未知的据点类型';
  }

  /**
   * 生成据点类型的提示词字符串
   * @param continentName 大陆名称
   * @param specifiedType 用户指定的据点类型（如果有）
   * @returns 据点类型提示词字符串
   */
  private static getLocationTypesPrompt(continentName: string, specifiedType?: LocationType): string {
    // 如果用户指定了类型，直接返回该类型的中文描述
    if (specifiedType) {
      return this.getLocationTypeDescription(specifiedType);
    }

    // 通用据点类型（中文）
    const commonTypes = ['村庄', '城镇', '城市', '遗迹', '贸易商队', '冒险者小队'];

    // 各大陆专属据点类型（中文）
    const continentSpecificTypes: Record<string, string[]> = {
      古拉尔大陆: ['流放者据点', '盗匪营地', '精灵森林', '狐族殖民地'],
      瓦尔基里大陆: ['巢都尖塔', '奴隶营地', '黑暗要塞', '黑曜石矿场', '劫掠舰码头'],
      香草群岛: ['狐族水乡', '神社', '贸易港口', '军舰泊地', '香料种植园'],
      赛菲亚大陆: ['帝国城市', '贵族庄园', '矿业区域', '边境要塞', '教堂', '学院'],
      世界树圣域: ['树城', '精灵圣殿', '守卫哨所', '树冠宫殿'],
    };

    const specificTypes = continentSpecificTypes[continentName] || [];

    // 构建提示词：通用类型 | 大陆特色类型
    const commonPart = `通用：${commonTypes.join('|')}`;
    const specificPart = specificTypes.length > 0 ? `，${continentName}特色：${specificTypes.join('|')}` : '';

    return `${commonPart}${specificPart}`;
  }
  /**
   * 统一据点生成提示词模板
   */
  private static readonly LOCATION_GENERATION_PROMPT = `
# 据点侦察模式规则：
1. 生成指定数量的符合哥布林巢穴游戏设定和当前大陆/区域特色的据点
2. 难度要合理分布，奖励要与难度匹配
3. ***specialUnit不允许是人物，只允许是部队***
4. ***此模式只输出侦察json数据，无需输出剧情正文***
5. ***必须严格遵守据点类型和种族***


\`\`\`json
{
  "name": "{据点名称，要符合当前大陆和区域的特色}",
  "type": "{LOCATION_TYPES}",
  "icon": "{emoji图标}",
  "description": "{据点描述，要体现当前大陆和区域的特色}",
  "difficulty": {星级难度，1-10的数字},
  "distance": {距离公里数},
  "continent": "{大陆名称}",
  "region": "{区域名称}",
  "race": "{ALLOWED_RACES}",
  "baseGuards": {此值为据点守军总人数，根据据点难度和类型合理设定，也要符合现实，比如*一个村落不可能有几百人的部队，同时一个要塞不可能只有几十人守军*。参考标准：小村庄50-200人，大村庄/小镇200-500人，城镇500-1500人，要塞1000-3000人，大城市2000-8000人，重要城市5000-15000人，首都/重要据点10000-50000人},
  "rewards": {
    "gold": {金币数量},
    "food": {食物数量},
    "slaves": {女性奴隶数量，请参考据点实际情况，数量要符合现实，村落可能只有几十个奴隶，城镇可能几百个奴隶，大城市可能几千个奴隶}
  },
  "specialUnit": {
    "name": "{特殊单位名称，一般为据点精英/特色单位，***请注意：非必须，请符合常识生成***}",
    "race": "{特殊单位种族}",
    "unitType": "{单位类型，必须是以下之一：physical(物理单位)|magical(魔法单位)}",
    "attributes": {
      "attack": {攻击力，10-50范围},
      "defense": {防御力，10-50范围},
      "intelligence": {智力，10-50范围},
      "speed": {速度，10-50范围},
      "health": {生命值，100-200范围}
    }
  }
}
\`\`\`
`;

  /**
   * 统一据点生成方法（支持单个和多个据点，支持条件筛选）
   * @param count 据点数量，默认为1
   * @param customInstruction 自定义指令 (可选)
   * @param continentName 大陆名称 (可选)
   * @param regionName 区域名称 (可选)
   * @param conditions 筛选条件 (可选)
   * @returns Promise<侦察结果>
   */
  static async generateLocations(
    count: number = 1,
    customInstruction?: string,
    continentName?: string,
    regionName?: string,
    conditions?: {
      type?: Location['type'];
    },
  ): Promise<{
    success: boolean;
    location?: Location;
    locations?: Location[];
    error?: string;
    errors?: string[];
    totalAdded?: number;
    aiResponse?: string;
  }> {
    try {
      // 使用统一的提示词模板
      let finalPrompt = this.LOCATION_GENERATION_PROMPT;

      // 添加据点数量信息
      finalPrompt += `\n\n# 据点数量要求：\n请生成 ${count} 个据点${count === 1 ? '' : '，返回JSON数组格式'}`;

      // 如果提供了大陆和区域信息，替换提示词中的占位符并添加描述信息
      if (continentName && regionName) {
        finalPrompt = finalPrompt.replace('{大陆名称}', continentName);
        finalPrompt = finalPrompt.replace('{区域名称}', regionName);

        // 获取大陆描述信息
        const continent = continentExploreService.continents.value.find(c => c.name === continentName);
        if (continent) {
          finalPrompt += `\n# 大陆描述参考：${continent.description}`;
        }

        // 获取区域描述信息
        const region = continent?.regions.find(r => r.name === regionName);
        if (region) {
          finalPrompt += `\n# 区域描述参考：${region.description}`;

          // 检查并添加首都名称限制
          if (region.capital) {
            finalPrompt += `\n# ⚠️ 重要限制：该区域的首都名为"${region.capital}"，已被定义，禁止生成与此名称相同或相似的据点名称`;
          }
        }
      }

      // 替换据点类型占位符
      if (continentName) {
        const locationTypesPrompt = this.getLocationTypesPrompt(continentName, conditions?.type);
        finalPrompt = finalPrompt.replace('{LOCATION_TYPES}', locationTypesPrompt);
      }

      // 替换允许种族占位符
      const allowedRaces = this.getAllowedRacesForLocationType(conditions?.type);
      finalPrompt = finalPrompt.replace('{ALLOWED_RACES}', `${allowedRaces}`);
      console.log(`🎯 [据点生成] 据点类型 "${conditions?.type || '未指定'}" 允许的种族:`, allowedRaces);

      // 如果指定了据点类型，添加类型介绍和种族要求
      if (conditions?.type) {
        const typeDescription = this.getLocationTypeDescription(conditions.type);
        const typeIntroduction = this.getLocationTypeIntroduction(conditions.type);
        finalPrompt += `\n\n# 当前已指定内容：\ntype：${typeDescription}（${typeIntroduction}）\nrace：${allowedRaces}`;
      }

      // 根据大陆和区域信息设置难度范围
      if (continentName && regionName) {
        const continent = continentExploreService.continents.value.find(c => c.name === continentName);
        const region = continent?.regions.find(r => r.name === regionName);

        if (continent && region) {
          // 提高下限，让不同区域做出区分
          // 最小难度 = 大陆难度 + 区域难度的一半（向下取整），确保不同区域有区分度
          const minDifficulty = continent.difficulty + Math.floor(region.difficulty / 2);
          const maxDifficulty = continent.difficulty + region.difficulty;
          finalPrompt = finalPrompt.replace('{星级难度，1-10的数字}', `{${minDifficulty}-${maxDifficulty}}`);
          finalPrompt += `\n# 区域难度信息：当前区域的难度范围应在 ${minDifficulty}-${maxDifficulty} 星之间`;
        }
      }

      finalPrompt += customInstruction || '';

      // 读取流式传输设置
      const globalVars = getVariables({ type: 'global' });
      const enableStreamOutput =
        typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : false; // 默认关闭

      // 使用带思维链的AI生成（自动切换到据点生成思维链）
      const aiResponse = await generateWithChainOfThought(ChainOfThoughtMode.LOCATION_GENERATION, {
        user_input: finalPrompt,
        should_stream: enableStreamOutput, // 根据设置启用流式传输
      });

      if (!aiResponse) {
        return { success: false, error: '侦察队未返回有效报告' };
      }

      if (count === 1) {
        // 创建重新解析回调函数
        const onRetry = async (editedText: string): Promise<void> => {
          console.log('🔄 [据点生成] 用户触发重新解析...');
          const retryResult = await LocationParser.parseLocations(editedText, editedText, onRetry);

          if (!retryResult) {
            throw new Error('重新解析失败，请检查编辑后的内容是否正确');
          }

          // 重新解析成功，更新据点
          const retryLocation = Array.isArray(retryResult) ? retryResult[0] : retryResult;

          if (!retryLocation) {
            throw new Error('重新解析后的据点数据为空');
          }

          // 验证据点数据
          const validation = LocationParser.validateLocation(retryLocation);
          if (!validation.valid) {
            throw new Error(`据点数据验证失败: ${validation.errors.join(', ')}`);
          }

          // 添加据点到探索服务
          const added = exploreService.addLocation(retryLocation);
          if (!added) {
            throw new Error('据点已存在，无法重复添加');
          }

          console.log('✅ [据点生成] 重新解析并添加据点成功:', retryLocation.name);
        };

        // 单个据点处理
        const result = await LocationParser.parseLocations(aiResponse, aiResponse, onRetry);

        if (!result) {
          // parseLocations 已经显示了错误弹窗，这里直接返回失败
          // 不需要再次显示错误信息，避免重复提示
          return { success: false, error: '据点信息解析失败，请检查AI输出格式', aiResponse: aiResponse };
        }

        // 如果返回的是数组，取第一个元素
        const location = Array.isArray(result) ? result[0] : result;

        if (!location) {
          return { success: false, error: '据点数据为空', aiResponse: aiResponse };
        }

        // 验证据点数据
        const validation = LocationParser.validateLocation(location);
        if (!validation.valid) {
          return {
            success: false,
            error: `据点数据验证失败: ${validation.errors.join(', ')}`,
            aiResponse: aiResponse,
          };
        }

        // 据点已包含基础守军和特殊单位信息，无需额外生成
        const locationWithEnemies = location;

        // 据点生成时不添加英雄信息，英雄将在侦察时生成

        // 将生成的据点添加到探索服务中
        const added = exploreService.addLocation(locationWithEnemies);

        if (!added) {
          return { success: false, error: '据点已存在，无法重复添加' };
        }

        return {
          success: true,
          location: locationWithEnemies,
          aiResponse: aiResponse,
        };
      } else {
        // 创建重新解析回调函数（多个据点）
        const onRetryMultiple = async (editedText: string): Promise<void> => {
          console.log('🔄 [批量据点生成] 用户触发重新解析...');
          const retryResult = await LocationParser.parseLocations(editedText, editedText, onRetryMultiple);

          if (!retryResult || !Array.isArray(retryResult)) {
            throw new Error('重新解析失败，请检查编辑后的内容是否正确');
          }

          // 重新解析成功，处理所有据点
          const retryLocations = retryResult;
          const errors: string[] = [];
          let addedCount = 0;

          for (const location of retryLocations) {
            try {
              const validation = LocationParser.validateLocation(location);
              if (!validation.valid) {
                errors.push(`据点 ${location.name}: ${validation.errors.join(', ')}`);
                continue;
              }

              const added = exploreService.addLocation(location);
              if (added) {
                addedCount++;
                console.log(`✅ [批量据点生成] 重新解析并添加据点成功: ${location.name}`);
              } else {
                errors.push(`据点 ${location.name}: 据点已存在`);
              }
            } catch (error) {
              errors.push(`据点 ${location.name}: ${(error as Error).message}`);
            }
          }

          if (addedCount === 0) {
            throw new Error(`所有据点添加失败: ${errors.join('; ')}`);
          }

          console.log(`✅ [批量据点生成] 重新解析完成，成功添加 ${addedCount}/${retryLocations.length} 个据点`);
        };

        // 多个据点处理
        const result = await LocationParser.parseLocations(aiResponse, aiResponse, onRetryMultiple);

        if (!result || !Array.isArray(result)) {
          // parseLocations 已经显示了错误弹窗，这里直接返回失败
          // 不需要再次显示错误信息，避免重复提示
          return {
            success: false,
            locations: [],
            errors: ['据点信息解析失败，请检查AI输出格式'],
            totalAdded: 0,
            aiResponse: aiResponse,
          };
        }

        const locations = result;

        const errors: string[] = [];
        const validLocations: Location[] = [];

        // 处理每个生成的据点
        for (const location of locations) {
          try {
            // 验证据点数据
            const validation = LocationParser.validateLocation(location);
            if (!validation.valid) {
              errors.push(`据点 ${location.name}: ${validation.errors.join(', ')}`);
              continue;
            }

            // 据点已包含基础守军和特殊单位信息，无需额外生成
            const locationWithEnemies = location;

            // 将生成的据点添加到探索服务中
            const added = exploreService.addLocation(locationWithEnemies);

            if (added) {
              validLocations.push(locationWithEnemies);
            } else {
              errors.push(`据点 ${location.name} 已存在，无法重复添加`);
            }
          } catch (error) {
            console.error(`处理据点 ${location.name} 时出错:`, error);
            errors.push(`据点 ${location.name} 处理失败: ${error}`);
          }
        }

        return {
          success: validLocations.length > 0,
          locations: validLocations,
          errors: errors,
          totalAdded: validLocations.length,
          aiResponse: aiResponse,
        };
      }
    } catch (error) {
      console.error('据点生成失败:', error);
      return {
        success: false,
        error: `据点生成失败: ${error}`,
      };
    }
  }
}
