import type { Location } from '../../../../功能模块层/探索/类型/探索类型';
import { INITIAL_LOCATIONS } from '../../存档系统/模块化存档类型';
import { WorldbookHelper } from '../工具/世界书助手';
import type { WorldbookEntry } from '../类型/世界书类型定义';

/**
 * 据点征服记录管理器 - 负责据点征服记录的管理
 */
export class ConquestRecordManager {
  /**
   * 添加据点征服记录到世界书
   */
  static async addConquestRecord(
    worldbookName: string,
    location: any,
    battleResult: any,
    gameTime: string,
    regionDescription?: string,
  ): Promise<void> {
    try {
      await WorldbookHelper.ensureExists(worldbookName);
      const worldbook = await WorldbookHelper.get(worldbookName);
      const conquestEntryIndex = WorldbookHelper.findEntryIndex(
        worldbook,
        entry => entry.extra?.entry_type === 'conquest_records',
      );

      // 获取现有记录（包括区域描述）
      let existingRecords: Record<string, Record<string, string[]>> = {};
      let existingRegionDescriptions: Record<string, Record<string, string>> = {};
      let summaryContent = '';
      if (conquestEntryIndex !== -1) {
        const existingContent = worldbook[conquestEntryIndex].content;

        // 提取所有summary部分并去重（仅支持新格式<summary_N>）
        const summaries = WorldbookHelper.extractAndDeduplicateSummaries(existingContent);
        if (summaries.length > 0) {
          summaryContent = WorldbookHelper.combineSummaries(summaries) + '\n\n';
        }

        const parseResult = this.parseExistingConquestRecords(existingContent);
        existingRecords = parseResult.records;
        existingRegionDescriptions = parseResult.regionDescriptions;
      }

      // 构建新内容（合并现有记录和新记录）
      const conquestContent = this.buildConquestRecordsContent(
        location,
        battleResult,
        gameTime,
        regionDescription,
        existingRecords,
        existingRegionDescriptions,
      );

      if (conquestEntryIndex !== -1) {
        // 更新现有条目，保留summary
        const finalContent = summaryContent + conquestContent;
        worldbook[conquestEntryIndex] = {
          ...worldbook[conquestEntryIndex],
          content: finalContent,
          extra: {
            ...worldbook[conquestEntryIndex].extra,
            updated_at: new Date().toISOString(),
          },
        };
        console.log('已更新据点征服记录世界书条目');
      } else {
        // 创建新条目
        const newConquestEntry = this.createConquestRecordsEntry(conquestContent);
        worldbook.push(newConquestEntry);
        console.log('已创建新的据点征服记录世界书条目');
      }

      await WorldbookHelper.replace(worldbookName, worldbook);
      console.log('据点征服记录世界书条目更新完成');
    } catch (error) {
      console.error('添加据点征服记录失败:', error);
      throw error;
    }
  }

  /**
   * 修复据点征服记录中的无效英雄信息（用于旧存档兼容性）
   * @param worldbookName 世界书名称
   * @param savedLocations 存档中的据点列表（可选，用于获取完整的据点配置）
   * @returns 是否进行了修复
   */
  static async fixInvalidHeroesInConquestRecords(worldbookName: string, savedLocations?: Location[]): Promise<boolean> {
    try {
      console.log('🔧 [旧存档兼容] 开始检查据点征服记录中的英雄信息...');

      await WorldbookHelper.ensureExists(worldbookName);
      const worldbook = await WorldbookHelper.get(worldbookName);
      const conquestEntryIndex = WorldbookHelper.findEntryIndex(
        worldbook,
        entry => entry.extra?.entry_type === 'conquest_records',
      );

      if (conquestEntryIndex === -1) {
        console.log('📊 [旧存档兼容] 没有找到据点征服记录条目');
        return false;
      }

      const entry = worldbook[conquestEntryIndex];
      const originalContent = entry.content;

      // 提取所有summary部分
      const summaryMatches = originalContent.matchAll(/<summary(?:_\d+)?>([\s\S]*?)<\/summary(?:_\d+)?>/g);
      const summaries: string[] = [];
      for (const match of summaryMatches) {
        summaries.push(match[0]);
      }
      const summaryContent = summaries.length > 0 ? summaries.join('\n\n') + '\n\n' : '';

      // 移除summary部分，只处理原始记录
      let contentToFix = originalContent;
      if (summaries.length > 0) {
        contentToFix = originalContent.replace(/<summary(?:_\d+)?>[\s\S]*?<\/summary(?:_\d+)?>\n*/g, '');
      }

      // 获取所有据点配置（从存档数据和初始配置）
      const allLocationConfigs = this.getAllLocationConfigs(savedLocations);

      // 按行处理，修复英雄信息
      const lines = contentToFix.split('\n');
      const fixedLines: string[] = [];
      let hasFixed = false;

      for (const line of lines) {
        // 检查是否是记录行（以 "  - " 开头）
        if (line.trim().startsWith('- ')) {
          // 解析记录行，提取据点名称
          const recordMatch = line.match(/\[([^\]]+)\]\s+([^-]+)-([^-]+)-([^-]+)-([^-]+)-(.+?)(-英雄:.+)?$/);

          if (recordMatch) {
            const locationName = recordMatch[4].trim(); // 据点名称
            const existingHeroInfo = recordMatch[7] || ''; // 现有的英雄信息部分

            // 查找据点配置
            const locationConfig = allLocationConfigs.find(loc => loc.name === locationName);

            // 检查据点是否有英雄配置
            const hasHeroesInConfig =
              locationConfig?.rewards?.heroes &&
              Array.isArray(locationConfig.rewards.heroes) &&
              locationConfig.rewards.heroes.length > 0;

            if (hasHeroesInConfig) {
              // 据点配置中有英雄，需要确保记录中有正确的英雄信息
              const heroes = locationConfig.rewards.heroes!;
              const validHeroes = heroes.filter((hero: any) => {
                return (
                  hero?.name &&
                  typeof hero.name === 'string' &&
                  hero?.title &&
                  typeof hero.title === 'string' &&
                  hero.name.trim().length > 0 &&
                  hero.title.trim().length > 0
                );
              });

              if (validHeroes.length > 0) {
                const correctHeroInfo = `-英雄:${validHeroes.map((h: any) => `${h.name}(${h.title})`).join('、')}`;

                // 检查现有英雄信息是否有效
                if (existingHeroInfo) {
                  const heroMatch = existingHeroInfo.match(/-英雄:(.+)$/);
                  if (heroMatch) {
                    const heroInfo = heroMatch[1].trim();
                    const isValidHeroFormat = /^[^(]+\([^)]+\)/.test(heroInfo);

                    if (!isValidHeroFormat || heroInfo !== correctHeroInfo.replace('-英雄:', '')) {
                      // 无效或不匹配，替换为正确的英雄信息
                      const lineWithoutHero = line.substring(0, line.indexOf('-英雄:'));
                      fixedLines.push(lineWithoutHero + correctHeroInfo);
                      hasFixed = true;
                      console.log(`🔧 [旧存档兼容] 修复据点 ${locationName} 的英雄信息: ${correctHeroInfo}`);
                    } else {
                      // 有效且匹配，保留原样
                      fixedLines.push(line);
                    }
                  } else {
                    fixedLines.push(line);
                  }
                } else {
                  // 记录中没有英雄信息，添加正确的英雄信息
                  fixedLines.push(line + correctHeroInfo);
                  hasFixed = true;
                  console.log(`🔧 [旧存档兼容] 为据点 ${locationName} 添加英雄信息: ${correctHeroInfo}`);
                }
              } else if (existingHeroInfo) {
                // 配置中的英雄无效，移除记录中的英雄信息
                const lineWithoutHero = line.substring(0, line.indexOf('-英雄:'));
                fixedLines.push(lineWithoutHero);
                hasFixed = true;
                console.log(`🔧 [旧存档兼容] 据点 ${locationName} 配置中的英雄无效，移除英雄信息`);
              } else {
                fixedLines.push(line);
              }
            } else if (existingHeroInfo) {
              // 据点配置中没有英雄，移除记录中的英雄信息
              const heroMatch = existingHeroInfo.match(/-英雄:(.+)$/);
              if (heroMatch) {
                const heroInfo = heroMatch[1].trim();
                const isValidHeroFormat = /^[^(]+\([^)]+\)/.test(heroInfo);

                if (!isValidHeroFormat) {
                  // 无效的英雄信息，移除
                  const lineWithoutHero = line.substring(0, line.indexOf('-英雄:'));
                  fixedLines.push(lineWithoutHero);
                  hasFixed = true;
                  console.log(`🔧 [旧存档兼容] 据点 ${locationName} 不应有英雄，移除无效的英雄信息: ${heroInfo}`);
                } else {
                  // 格式正确但配置中没有，移除（可能是旧的配置）
                  const lineWithoutHero = line.substring(0, line.indexOf('-英雄:'));
                  fixedLines.push(lineWithoutHero);
                  hasFixed = true;
                  console.log(`🔧 [旧存档兼容] 据点 ${locationName} 配置中无英雄，移除英雄信息`);
                }
              } else {
                fixedLines.push(line);
              }
            } else {
              fixedLines.push(line);
            }
          } else {
            // 无法解析的记录行，保留原样
            fixedLines.push(line);
          }
        } else {
          // 非记录行，保留原样
          fixedLines.push(line);
        }
      }

      if (!hasFixed) {
        console.log('✅ [旧存档兼容] 据点征服记录中没有无效的英雄信息');
        return false;
      }

      // 重新组合内容
      const fixedContent = summaryContent + fixedLines.join('\n');

      // 更新世界书条目
      worldbook[conquestEntryIndex] = {
        ...entry,
        content: fixedContent,
        extra: {
          ...entry.extra,
          updated_at: new Date().toISOString(),
          fixed_invalid_heroes: true,
        },
      };

      await WorldbookHelper.replace(worldbookName, worldbook);
      console.log('✅ [旧存档兼容] 已修复据点征服记录中的无效英雄信息');
      return true;
    } catch (error) {
      console.error('❌ [旧存档兼容] 修复据点征服记录失败:', error);
      return false;
    }
  }

  /**
   * 获取所有据点配置（从存档数据和初始配置合并）
   */
  private static getAllLocationConfigs(savedLocations?: Location[]): Location[] {
    const allConfigs: Location[] = [];

    // 从初始配置获取（包括自定义据点和基础据点）
    allConfigs.push(...INITIAL_LOCATIONS);

    // 从传入的存档据点数据获取
    if (savedLocations) {
      // 合并存档中的据点（可能包含AI生成的据点）
      for (const savedLocation of savedLocations) {
        // 如果存档中的据点名称不在已有配置中，添加它
        if (!allConfigs.find(loc => loc.name === savedLocation.name)) {
          allConfigs.push(savedLocation);
        }
      }
    }

    return allConfigs;
  }

  // ==================== 私有方法 ====================

  /**
   * 解析现有的据点征服记录
   * 返回记录和区域描述的映射
   */
  private static parseExistingConquestRecords(content: string): {
    records: Record<string, Record<string, string[]>>;
    regionDescriptions: Record<string, Record<string, string>>;
  } {
    const groupedRecords: Record<string, Record<string, string[]>> = {};
    const regionDescriptions: Record<string, Record<string, string>> = {};

    try {
      // 移除所有 summary 标签及其内容（支持<summary>和<summary_N>格式），只解析原始格式
      let parsedContent = content;
      if (content.includes('<summary>') || /<summary_\d+>/.test(content)) {
        parsedContent = content.replace(/<summary(?:_\d+)?>[\s\S]*?<\/summary(?:_\d+)?>\n*/g, '');
      }

      // 如果移除summary后内容为空，说明已经被总结压缩了
      if (!parsedContent.trim()) {
        console.log('⚠️ 条目已被总结压缩，返回空记录（后续追加会重建基础结构）');
        return { records: {}, regionDescriptions: {} };
      }

      // 按行分割内容
      const lines = parsedContent.split('\n');
      let currentContinent = '';
      let currentRegion = '';

      for (const line of lines) {
        // 匹配大陆行（顶格的非空行，以冒号结尾）
        const continentMatch = line.match(/^([^:\s]+):\s*$/);
        if (continentMatch) {
          currentContinent = continentMatch[1];
          if (!groupedRecords[currentContinent]) {
            groupedRecords[currentContinent] = {};
            regionDescriptions[currentContinent] = {};
          }
          continue;
        }

        // 匹配区域行（两个空格缩进，包含冒号和描述）
        const regionMatch = line.match(/^ {2}([^:]+):\s*(.*)$/);
        if (regionMatch && currentContinent) {
          currentRegion = regionMatch[1];
          const regionDesc = regionMatch[2].trim();
          if (!groupedRecords[currentContinent][currentRegion]) {
            groupedRecords[currentContinent][currentRegion] = [];
          }
          // 保存区域描述
          if (!regionDescriptions[currentContinent]) {
            regionDescriptions[currentContinent] = {};
          }
          regionDescriptions[currentContinent][currentRegion] = regionDesc;
          continue;
        }

        // 匹配记录行（以 "  - " 开头）
        const recordMatch = line.match(/^ {2}- (.+)$/);
        if (recordMatch && currentContinent && currentRegion) {
          groupedRecords[currentContinent][currentRegion].push(`  - ${recordMatch[1]}`);
        }
      }

      console.log('解析现有据点征服记录:', groupedRecords);
      console.log('解析现有区域描述:', regionDescriptions);
    } catch (error) {
      console.error('解析现有据点征服记录失败:', error);
    }

    return { records: groupedRecords, regionDescriptions };
  }

  /**
   * 创建据点征服记录世界书条目
   */
  private static createConquestRecordsEntry(content: string): WorldbookEntry {
    return {
      uid: Date.now() + 1,
      name: '据点征服记录',
      enabled: true,
      strategy: {
        type: 'constant',
        keys: ['据点征服记录'],
        keys_secondary: {
          logic: 'and_any',
          keys: [],
        },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'at_depth',
        role: 'system',
        depth: 4,
        order: 120,
      },
      content: content,
      probability: 100,
      recursion: {
        prevent_incoming: true,
        prevent_outgoing: true,
        delay_until: null,
      },
      effect: {
        sticky: null,
        cooldown: null,
        delay: null,
      },
      extra: {
        entry_type: 'conquest_records',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * 构建据点征服记录内容
   */
  private static buildConquestRecordsContent(
    location: any,
    _battleResult: any,
    gameTime: string,
    regionDescription?: string,
    existingRecords: Record<string, Record<string, string[]>> = {},
    existingRegionDescriptions: Record<string, Record<string, string>> = {},
  ): string {
    const conqueredDate = gameTime; // gameTime 已经是格式化的日期字符串
    // 使用现有记录作为基础
    const groupedRecords: Record<string, Record<string, string[]>> = JSON.parse(JSON.stringify(existingRecords));

    if (location) {
      const continent = location.continent || '未知大陆';
      const region = location.region || '未知区域';
      const race = location.race || '未知种族';
      const type = this.getLocationTypeDescription(location.type);
      const name = location.name;
      const difficulty = '★'.repeat(location.difficulty);
      const description = location.description || '无描述';
      const heroes = location.rewards?.heroes || [];

      let heroInfo = '';
      if (heroes.length > 0) {
        console.log(`📊 [据点征服记录] 据点 ${name} 的英雄信息:`, heroes);

        // 验证heroes是否为有效数组（可能被错误赋值为字符串等）
        if (!Array.isArray(heroes)) {
          console.warn(`⚠️ [据点征服记录] 据点 ${name} 的英雄信息不是数组，实际类型:`, typeof heroes, heroes);
        } else {
          // 过滤掉无效的英雄信息
          const validHeroes = heroes.filter((hero: any) => {
            // 检查英雄是否是对象而非字符串等其他类型
            if (typeof hero !== 'object' || hero === null) {
              console.warn(`⚠️ [据点征服记录] 无效的英雄数据类型:`, typeof hero, hero);
              return false;
            }

            // 检查英雄名称和称号是否存在且有效
            const hasValidName = hero?.name && typeof hero.name === 'string' && hero.name.trim().length > 0;
            const hasValidTitle = hero?.title && typeof hero.title === 'string' && hero.title.trim().length > 0;

            if (!hasValidName || !hasValidTitle) {
              console.warn(`⚠️ [据点征服记录] 英雄缺少有效的name或title:`, hero);
              return false;
            }

            return true;
          });

          if (validHeroes.length > 0) {
            const heroNames = validHeroes.map((hero: any) => `${hero.name}(${hero.title})`).join('、');
            heroInfo = `-英雄:${heroNames}`;
            console.log(`✅ [据点征服记录] 据点 ${name} 有效英雄: ${heroNames}`);
          } else {
            console.warn(`⚠️ [据点征服记录] 据点 ${name} 的所有英雄信息都无效，已跳过`);
          }
        }
      }

      if (!groupedRecords[continent]) {
        groupedRecords[continent] = {};
      }
      if (!groupedRecords[continent][region]) {
        groupedRecords[continent][region] = [];
      }

      const newYamlRecord = `  - [${conqueredDate}] ${race}-${type}-${name}-${difficulty}-${description}${heroInfo}`;
      groupedRecords[continent][region].push(newYamlRecord);
    }

    // 构建YAML格式内容
    let yamlContent = '<ConquestRecords>\n# 据点征服记录\n';

    Object.keys(groupedRecords)
      .sort()
      .forEach(continent => {
        yamlContent += `${continent}:\n`;
        Object.keys(groupedRecords[continent])
          .sort()
          .forEach(region => {
            // 优先使用已保存的区域描述
            const savedDescription = existingRegionDescriptions[continent]?.[region];
            // 如果是当前新添加的区域，使用传入的描述；否则使用已保存的描述
            const isNewRegion = location && location.continent === continent && location.region === region;
            const currentRegionDescription =
              savedDescription || (isNewRegion && regionDescription ? regionDescription : null) || '未知区域';
            yamlContent += `  ${region}: ${currentRegionDescription}\n`;
            groupedRecords[continent][region].forEach(record => {
              yamlContent += record + '\n';
            });
          });
      });

    const content = `${yamlContent}\n
- 这些记录记录了哥布林巢穴对外扩张的历史
- 每次成功的征服都会增加巢穴的威胁度
</ConquestRecords>`;

    return content;
  }

  /**
   * 获取据点类型描述
   */
  private static getLocationTypeDescription(type: string): string {
    const typeMap: Record<string, string> = {
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
    return typeMap[type] || '未知类型';
  }
}
