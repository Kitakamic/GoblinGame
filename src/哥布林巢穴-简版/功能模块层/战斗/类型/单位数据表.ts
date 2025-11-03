import { Character } from '../../人物管理/类型/人物类型';
import { UNIT_DATA_CSV, UnitDataParser } from './单位数据解析器';

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

/**
 * 根据种族获取单位数据的辅助函数
 */
export function getUnitsByRace(race: string): Character[] {
  return UnitDataParser.getUnitsByRace(race as any, ALL_UNIT_CHARACTERS);
}

/**
 * 根据名称获取单位数据的辅助函数
 */
export function getUnitByName(name: string): Character | undefined {
  return UnitDataParser.getUnitByName(name, ALL_UNIT_CHARACTERS);
}

/**
 * 根据ID获取单位数据的辅助函数（向后兼容）
 * @deprecated 请使用 getUnitByName 替代
 */
export function getUnitById(id: string): Character | undefined {
  return UnitDataParser.getUnitByName(id, ALL_UNIT_CHARACTERS);
}

/**
 * 根据等级范围获取单位数据的辅助函数
 */
export function getUnitsByLevelRange(minLevel: number, maxLevel: number): Character[] {
  return UnitDataParser.getUnitsByLevelRange(minLevel, maxLevel, ALL_UNIT_CHARACTERS);
}

/**
 * 根据单位类型获取单位数据的辅助函数
 */
export function getUnitsByType(unitType: string): Character[] {
  return UnitDataParser.getUnitsByType(unitType as any, ALL_UNIT_CHARACTERS);
}

/**
 * 随机获取单位数据
 */
export function getRandomUnitCharacter(): Character {
  const randomIndex = Math.floor(Math.random() * ALL_UNIT_CHARACTERS.length);
  return ALL_UNIT_CHARACTERS[randomIndex];
}

/**
 * 根据种族随机获取单位数据
 */
export function getRandomUnitCharacterByRace(race: string): Character {
  const characters = getUnitsByRace(race);
  if (characters.length === 0) return getRandomUnitCharacter();
  const randomIndex = Math.floor(Math.random() * characters.length);
  return characters[randomIndex];
}
