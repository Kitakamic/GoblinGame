import { WorldbookHelper } from './世界书助手';
import type { WorldbookEntry } from './世界书类型定义';

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

      // 获取现有记录
      let existingRecords: Record<string, Record<string, string[]>> = {};
      if (conquestEntryIndex !== -1) {
        existingRecords = this.parseExistingConquestRecords(worldbook[conquestEntryIndex].content);
      }

      // 构建新内容（合并现有记录和新记录）
      const conquestContent = this.buildConquestRecordsContent(
        location,
        battleResult,
        gameTime,
        regionDescription,
        existingRecords,
      );

      if (conquestEntryIndex !== -1) {
        // 更新现有条目
        worldbook[conquestEntryIndex] = {
          ...worldbook[conquestEntryIndex],
          content: conquestContent,
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

  // ==================== 私有方法 ====================

  /**
   * 解析现有的据点征服记录
   */
  private static parseExistingConquestRecords(content: string): Record<string, Record<string, string[]>> {
    const groupedRecords: Record<string, Record<string, string[]>> = {};

    try {
      // 按行分割内容
      const lines = content.split('\n');
      let currentContinent = '';
      let currentRegion = '';

      for (const line of lines) {
        // 匹配大陆行（顶格的非空行，以冒号结尾）
        const continentMatch = line.match(/^([^:\s]+):\s*$/);
        if (continentMatch) {
          currentContinent = continentMatch[1];
          if (!groupedRecords[currentContinent]) {
            groupedRecords[currentContinent] = {};
          }
          continue;
        }

        // 匹配区域行（两个空格缩进，包含冒号和描述）
        const regionMatch = line.match(/^ {2}([^:]+):\s*(.*)$/);
        if (regionMatch && currentContinent) {
          currentRegion = regionMatch[1];
          if (!groupedRecords[currentContinent][currentRegion]) {
            groupedRecords[currentContinent][currentRegion] = [];
          }
          continue;
        }

        // 匹配记录行（以 "  - " 开头）
        const recordMatch = line.match(/^ {2}- (.+)$/);
        if (recordMatch && currentContinent && currentRegion) {
          groupedRecords[currentContinent][currentRegion].push(`  - ${recordMatch[1]}`);
        }
      }

      console.log('解析现有据点征服记录:', groupedRecords);
    } catch (error) {
      console.error('解析现有据点征服记录失败:', error);
    }

    return groupedRecords;
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
        const heroNames = heroes.map((hero: any) => `${hero.name}(${hero.title})`).join('、');
        heroInfo = `-英雄:${heroNames}`;
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
            const currentRegionDescription = regionDescription || '未知区域';
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
