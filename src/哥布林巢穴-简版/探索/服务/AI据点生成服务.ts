import type { Location } from '../类型/探索类型';
import { LocationParser } from './AI据点解析服务';
import { continentExploreService } from './大陆探索服务';
import { exploreService } from './探索服务';

/**
 * 侦察队服务
 * 集成消息服务和探索服务，实现侦察队发现目标的完整流程
 */
export class AILocationGenerationService {
  /**
   * 统一据点生成提示词模板
   */
  private static readonly LOCATION_GENERATION_PROMPT = `
# 据点侦察模式规则：
1. 生成指定数量的符合哥布林巢穴游戏设定类型的据点
2. 目标类型要多样化（村庄、城镇、城市、要塞、废墟、地牢）
3. 难度要合理分布，奖励要与难度匹配
4. ***pecialUnit不允许是人物，只允许是部队***

<json>
{
  "name": "{据点名称}",
  "type": "{城镇|村庄|城市|要塞|废墟|地牢}",
  "icon": "{emoji图标}",
  "description": "{据点描述}",
  "difficulty": {星级难度，1-10的数字},
  "distance": {距离公里数},
  "continent": "{大陆名称}",
  "region": "{区域名称}",
  "race": "{据点种族，人类/永恒精灵/黑暗精灵/狐族，只允许选择一个种族，但是允许和大陆区域种族不一致，只要符合据点现实即可}",
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
  },
}
</json>
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

      // 根据条件修改侦察指令
      if (conditions?.type) {
        finalPrompt += `\n\n侦察队重点寻找类型：${conditions.type}`;
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
