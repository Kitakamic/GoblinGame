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
  "race": "{据点种族，人类/永恒精灵/黑暗精灵/狐族/混居，只允许选择一个种族，但是允许和大陆区域种族不一致，只要符合据点现实即可}",
  "baseGuards": {此值为据点守军总人数，根据据点难度和类型合理设定，也要符合现实，比如*一个村落不可能有几百人的部队，同时一个要塞不可能只有几十人守军*。参考标准：小村庄50-200人，大村庄/小镇200-500人，城镇500-1500人，要塞1000-3000人，大城市2000-8000人，重要城市5000-15000人，首都/重要据点10000-50000人},
  "rewards": {
    "gold": {金币数量},
    "food": {食物数量},
    "slaves": {女性奴隶数量，请参考据点实际情况，数量符合现实即可}
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

      // 根据大陆和区域信息设置难度范围
      if (continentName && regionName) {
        const continent = continentExploreService.continents.value.find(c => c.name === continentName);
        const region = continent?.regions.find(r => r.name === regionName);

        if (continent && region) {
          const minDifficulty = continent.difficulty;
          const maxDifficulty = continent.difficulty + region.difficulty;
          finalPrompt = finalPrompt.replace('{星级难度，1-10的数字}', `{${minDifficulty}-${maxDifficulty}}`);
          finalPrompt += `\n# 区域难度信息：当前区域的难度范围应在 ${minDifficulty}-${maxDifficulty} 星之间`;
        }
      }

      finalPrompt += customInstruction || '';

      // 直接调用酒馆助手的生成接口
      const aiResponse = await window.TavernHelper.generate({
        user_input: finalPrompt,
      });

      if (!aiResponse) {
        return { success: false, error: '侦察队未返回有效报告' };
      }

      if (count === 1) {
        // 单个据点处理
        const result = LocationParser.parseLocations(aiResponse);

        if (!result || Array.isArray(result)) {
          return { success: false, error: '无法解析据点信息', aiResponse: aiResponse };
        }

        const location = result;

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
        // 多个据点处理
        const result = LocationParser.parseLocations(aiResponse);

        if (!result || !Array.isArray(result)) {
          return {
            success: false,
            locations: [],
            errors: ['无法从侦察报告中提取据点信息'],
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
