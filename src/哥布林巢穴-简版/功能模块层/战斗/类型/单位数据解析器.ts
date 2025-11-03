import { Character, RaceType } from '../../人物管理/类型/人物类型';

/**
 * 从CSV数据构建单位数据
 */
export class UnitDataParser {
  /**
   * 解析CSV数据并构建单位数组
   */
  static parseFromCSV(csvData: string): Character[] {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const units: Character[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const unit = this.parseUnitFromRow(headers, values);
      if (unit) {
        units.push(unit);
      }
    }

    return units;
  }

  /**
   * 从单行数据解析单位
   */
  private static parseUnitFromRow(headers: string[], values: string[]): Character | null {
    try {
      const data: { [key: string]: string } = {};
      headers.forEach((header, index) => {
        data[header.trim()] = values[index]?.trim() || '';
      });

      // 解析canLeadRaces数组
      const canLeadRaces = data.canLeadRaces ? data.canLeadRaces.split('|') : [];

      return {
        id: data.name, // 使用名称作为ID
        name: data.name,
        title: '', // title列已删除，设为空字符串
        avatar: data.avatar,
        canCombat: true,
        background: '平民',
        status: 'enemy',
        loyalty: 0,
        stamina: 0,
        fertility: 0,
        offspring: 0,
        maxStamina: 0,
        maxFertility: 0,
        rating: 'C',
        level: parseInt(data.level) || 1,
        attributes: {
          attack: parseInt(data.attack) || 0,
          defense: parseInt(data.defense) || 0,
          intelligence: parseInt(data.intelligence) || 0,
          speed: parseInt(data.speed) || 0,
          health: parseInt(data.health) || 1,
        },
        race: data.race as RaceType,
        age: 25,
        country: data.country,
        unitType: data.unitType as any,
        canLeadRaces: canLeadRaces as RaceType[],
      };
    } catch (error) {
      console.error('解析单位数据失败:', error, values);
      return null;
    }
  }

  /**
   * 根据种族获取单位数据
   */
  static getUnitsByRace(race: RaceType, allUnits: Character[]): Character[] {
    return allUnits.filter(unit => unit.race === race);
  }

  /**
   * 根据名称获取单位数据
   */
  static getUnitByName(name: string, allUnits: Character[]): Character | undefined {
    return allUnits.find(unit => unit.name === name);
  }

  /**
   * 根据等级范围获取单位数据
   */
  static getUnitsByLevelRange(minLevel: number, maxLevel: number, allUnits: Character[]): Character[] {
    return allUnits.filter(unit => unit.level >= minLevel && unit.level <= maxLevel);
  }

  /**
   * 根据单位类型获取单位数据
   */
  static getUnitsByType(unitType: string, allUnits: Character[]): Character[] {
    return allUnits.filter(unit => unit.unitType === unitType);
  }
}

// 导入CSV文件内容
import unitDataCsv from '../../../数据文件/战斗数据/单位数据表.csv?raw';

/**
 * 从外部CSV文件导入的单位数据
 */
export const UNIT_DATA_CSV = unitDataCsv;

/**
 * 从CSV数据构建的所有单位
 */
export const ALL_UNIT_CHARACTERS = UnitDataParser.parseFromCSV(UNIT_DATA_CSV);

/**
 * 哥布林单位数据
 */
export const GOBLIN_UNIT_CHARACTERS = UnitDataParser.getUnitsByRace('哥布林', ALL_UNIT_CHARACTERS);

/**
 * 人类单位数据
 */
export const HUMAN_UNIT_CHARACTERS = UnitDataParser.getUnitsByRace('人类', ALL_UNIT_CHARACTERS);

/**
 * 狐族单位数据
 */
export const FOX_UNIT_CHARACTERS = UnitDataParser.getUnitsByRace('狐族', ALL_UNIT_CHARACTERS);

/**
 * 黑暗精灵单位数据
 */
export const DARK_ELF_UNIT_CHARACTERS = UnitDataParser.getUnitsByRace('黑暗精灵', ALL_UNIT_CHARACTERS);

/**
 * 高等精灵单位数据
 */
export const ELF_UNIT_CHARACTERS = UnitDataParser.getUnitsByRace('永恒精灵', ALL_UNIT_CHARACTERS);

/**
 * 亡灵单位数据
 */
export const UNDEAD_UNIT_CHARACTERS = UnitDataParser.getUnitsByRace('亡灵', ALL_UNIT_CHARACTERS);
