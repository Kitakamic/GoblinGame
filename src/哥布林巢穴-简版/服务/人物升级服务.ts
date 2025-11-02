import type { Character } from '../人物管理/类型/人物类型';
import { modularSaveManager } from '../存档管理/模块化存档服务';

/**
 * 升级结果
 */
export interface LevelUpResult {
  success: boolean;
  oldLevel: number;
  newLevel: number;
  message?: string;
}

/**
 * 人物升级服务
 * 负责处理人物等级升级的相关逻辑
 */
export class CharacterLevelUpService {
  /**
   * 献祭哥布林升级人物等级
   * 根据固定数量计算可以升多少级（每种类型独立计算，取最大值）
   * @param characterId 目标人物ID
   * @param sacrificedGoblins 献祭的哥布林数量，按类型分组
   * @returns 升级结果
   */
  static sacrificeGoblinsForLevel(
    characterId: string,
    sacrificedGoblins: {
      normalGoblins?: number;
      warriorGoblins?: number;
      shamanGoblins?: number;
      paladinGoblins?: number;
    },
  ): LevelUpResult {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        return {
          success: false,
          oldLevel: 1,
          newLevel: 1,
          message: '没有游戏数据，无法献祭',
        };
      }

      const character = gameData.training.characters.find((char: Character) => char.id === characterId);
      if (!character) {
        return {
          success: false,
          oldLevel: 1,
          newLevel: 1,
          message: `未找到人物 (id: ${characterId})`,
        };
      }

      const currentLevel = character.level || 1;

      // 计算可以升多少级（每种类型独立计算，叠加总和）
      // 固定数量要求：普通哥布林100只/级，哥布林战士20只/级，哥布林萨满10只/级，哥布林圣骑士5只/级
      const goblinRequirements = {
        normalGoblins: 100,
        warriorGoblins: 20,
        shamanGoblins: 10,
        paladinGoblins: 5,
      };

      // 计算可以升多少级（每种类型独立计算，叠加总和）
      // 使用 || 0 处理 undefined，确保即使是 0 也会计算
      let totalLevelUps = 0;
      totalLevelUps += Math.floor((sacrificedGoblins.normalGoblins || 0) / goblinRequirements.normalGoblins);
      totalLevelUps += Math.floor((sacrificedGoblins.warriorGoblins || 0) / goblinRequirements.warriorGoblins);
      totalLevelUps += Math.floor((sacrificedGoblins.shamanGoblins || 0) / goblinRequirements.shamanGoblins);
      totalLevelUps += Math.floor((sacrificedGoblins.paladinGoblins || 0) / goblinRequirements.paladinGoblins);

      const levelUps = totalLevelUps;

      // 如果等级提升了，更新人物等级
      if (levelUps > 0) {
        const newLevel = currentLevel + levelUps;
        character.level = newLevel;

        // 更新存档
        modularSaveManager.updateModuleData({
          moduleName: 'training',
          data: gameData.training,
        });

        console.log(`${character.name} 献祭哥布林升级成功: ${currentLevel} -> ${newLevel}（提升${levelUps}级）`);
        return {
          success: true,
          oldLevel: currentLevel,
          newLevel: newLevel,
          message: `${character.name} 等级提升: ${currentLevel} -> ${newLevel}（提升${levelUps}级）`,
        };
      } else {
        console.log(`${character.name} 献祭哥布林数量不足，无法升级。当前等级: ${currentLevel}`);
        return {
          success: false,
          oldLevel: currentLevel,
          newLevel: currentLevel,
          message: `${character.name} 献祭数量不足，无法升级`,
        };
      }
    } catch (error) {
      console.error('献祭哥布林升级失败:', error);
      return {
        success: false,
        oldLevel: 1,
        newLevel: 1,
        message: `献祭失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取可升级的人物列表
   * 包括：已堕落且可战斗的人物、已编制且可战斗的人物（不包括玩家角色，因为玩家等级等于人物最高级）
   * @returns 可升级的人物列表
   */
  static getUpgradableCharacters(): Character[] {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        return [];
      }

      const characters = gameData.training.characters;

      // 筛选出可升级的人物（不包括玩家角色）：
      // 1. 已堕落且可战斗的人物
      // 2. 已编制且可战斗的人物
      const upgradableCharacters = characters.filter((character: Character) => {
        // 排除玩家角色（玩家等级会自动跟随最高级人物）
        if (character.status === 'player') {
          return false;
        }
        // 必须是可战斗的人物
        if (character.canCombat !== true) {
          return false;
        }
        // 已堕落且可战斗
        if (character.status === 'surrendered') {
          return true;
        }
        // 已编制且可战斗
        if (character.status === 'deployed') {
          return true;
        }
        return false;
      });

      return upgradableCharacters;
    } catch (error) {
      console.error('获取可升级人物列表失败:', error);
      return [];
    }
  }

  /**
   * 获取人物当前等级
   * @param characterId 人物ID
   * @returns 人物等级，如果找不到返回1
   */
  static getCharacterLevel(characterId: string): number {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        return 1;
      }

      const character = gameData.training.characters.find((char: Character) => char.id === characterId);
      if (!character) {
        return 1;
      }

      // 优先使用 level 字段，如果没有则使用 offspring/10 计算，都没有则返回1
      return character.level ?? Math.floor(character.offspring / 10) ?? 1;
    } catch (error) {
      console.error('获取人物等级失败:', error);
      return 1;
    }
  }
}
