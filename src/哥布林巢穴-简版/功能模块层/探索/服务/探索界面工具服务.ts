/**
 * 探索界面工具服务
 * 提供探索界面相关的工具函数，如格式化、显示、计算等
 */
import type { Location } from '../类型/探索类型';
import { exploreService } from './探索服务';

export class ExploreUIUtils {
  /**
   * 获取难度文本（星级显示）
   * @param difficulty 难度等级（1-10）
   * @returns 星级字符串，如 "★★★"
   */
  static getDifficultyText(difficulty: number): string {
    return '★'.repeat(difficulty);
  }

  /**
   * 获取据点的实际敌方部队总数
   * @param location 据点对象
   * @returns 敌方部队总数
   */
  static getTotalEnemyTroops(location: Location): number {
    // 如果据点已有敌方单位数据，计算实际总数
    if (location.enemyUnits && location.enemyUnits.length > 0) {
      return location.enemyUnits.reduce((total, unit) => total + unit.troopCount, 0);
    }

    // 如果没有敌方单位数据，返回基础守军数量
    return location.baseGuards || 0;
  }

  /**
   * 格式化侦察成本显示
   * @param difficulty 难度等级
   * @param distance 距离（可选）
   * @returns 格式化后的成本字符串，如 "💰200 🍖120"
   */
  static formatScoutCost(difficulty: number, distance?: number): string {
    const cost = exploreService.calculateScoutCost(difficulty, distance);
    return `💰${cost.gold} 🍖${cost.food}`;
  }

  /**
   * 获取据点状态文本
   * @param location 据点对象
   * @param isScouting 是否正在侦察中
   * @returns 状态文本
   */
  static getStatusText(location: Location, isScouting: boolean = false): string {
    // 如果正在侦察中，显示侦察中状态
    if (isScouting) {
      return '侦察中';
    }

    const statusMap: Record<string, string> = {
      unknown: '未知',
      scouted: '已侦察',
      attacked: '已攻击',
      conquered: '已征服',
    };
    return statusMap[location.status] || '未知';
  }

  /**
   * 获取据点状态CSS类名
   * @param location 据点对象
   * @param isScouting 是否正在侦察中
   * @returns CSS类名
   */
  static getStatusClass(location: Location, isScouting: boolean = false): string {
    // 如果正在侦察中，使用侦察中的样式
    if (isScouting) {
      return 'scouting';
    }

    return location.status;
  }

  /**
   * 检查据点是否为区域首都
   * @param location 据点对象
   * @param capitalName 首都名称
   * @returns 是否为首都
   */
  static isLocationCapital(location: Location, capitalName?: string): boolean {
    return capitalName === location.name;
  }

  /**
   * 根据大陆生成可用的据点类型选项
   * @param continentName 大陆名称
   * @returns 据点类型选项数组
   */
  static getAvailableLocationTypes(continentName: string): Array<{ value: string; label: string }> {
    // 通用据点类型（所有大陆都可使用）
    const commonTypes = [
      { value: '', label: '随机探索' },
      { value: 'village', label: '村庄' },
      { value: 'town', label: '城镇' },
      { value: 'city', label: '城市' },
      { value: 'ruins', label: '遗迹' },
      { value: 'trade_caravan', label: '贸易商队' },
      { value: 'adventurer_party', label: '冒险者小队' },
    ];

    // 根据当前大陆添加专属据点类型
    const continentSpecificTypes: Record<string, { value: string; label: string }[]> = {
      古拉尔大陆: [
        { value: 'exile_outpost', label: '流放者据点' },
        { value: 'bandit_camp', label: '盗匪营地' },
        { value: 'elven_forest', label: '精灵森林' },
        { value: 'fox_colony', label: '狐族殖民地' },
      ],
      瓦尔基里大陆: [
        { value: 'dark_spire', label: '巢都尖塔' },
        { value: 'slave_camp', label: '奴隶营地' },
        { value: 'dark_fortress', label: '黑暗要塞' },
        { value: 'obsidian_mine', label: '黑曜石矿场' },
        { value: 'raid_dock', label: '劫掠舰码头' },
      ],
      香草群岛: [
        { value: 'fox_water_town', label: '狐族水乡' },
        { value: 'shrine', label: '神社' },
        { value: 'trading_port', label: '贸易港口' },
        { value: 'warship_dock', label: '军舰泊地' },
        { value: 'spice_plantation', label: '香料种植园' },
      ],
      赛菲亚大陆: [
        { value: 'imperial_city', label: '帝国城市' },
        { value: 'noble_estate', label: '贵族庄园' },
        { value: 'mining_district', label: '矿业区域' },
        { value: 'border_fortress', label: '边境要塞' },
        { value: 'cathedral', label: '教堂' },
        { value: 'academy', label: '学院' },
      ],
      世界树圣域: [
        { value: 'tree_city', label: '树城' },
        { value: 'elven_temple', label: '精灵圣殿' },
        { value: 'guardian_outpost', label: '守卫哨所' },
        { value: 'canopy_palace', label: '树冠宫殿' },
      ],
    };

    const specificTypes = continentSpecificTypes[continentName] || [];
    return [...commonTypes, ...specificTypes];
  }
}
