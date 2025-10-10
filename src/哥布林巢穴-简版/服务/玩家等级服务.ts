import type { Character } from '../人物管理/类型/人物类型';
import { modularSaveManager } from '../存档管理/模块化存档服务';

/**
 * 玩家等级服务
 * 负责计算和管理玩家角色的等级
 */
export class PlayerLevelService {
  /**
   * 获取我方人物中等级最高的人的等级
   */
  static getMaxLevelFromMyCharacters(): number {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        return 1; // 默认等级
      }

      const characters = gameData.training.characters;

      // 筛选出我方人物（排除玩家角色和敌方角色）
      const myCharacters = characters.filter(
        (character: Character) =>
          character.status !== 'player' && character.status !== 'enemy' && character.status !== 'uncaptured',
      );

      if (myCharacters.length === 0) {
        return 1; // 没有我方人物时返回默认等级
      }

      // 计算所有我方人物的等级，取最高值
      const maxLevel = Math.max(...myCharacters.map((character: Character) => Math.floor(character.offspring / 10)));

      return Math.max(1, maxLevel); // 确保等级至少为1
    } catch (error) {
      console.error('计算我方最高等级失败:', error);
      return 1; // 出错时返回默认等级
    }
  }

  /**
   * 更新玩家角色等级
   */
  static updatePlayerLevel(): void {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        return;
      }

      const playerCharacter = gameData.training.characters.find((char: Character) => char.id === 'player-1');

      if (playerCharacter) {
        const newLevel = this.getMaxLevelFromMyCharacters();
        playerCharacter.level = newLevel;

        // 更新存档
        modularSaveManager.updateModuleData({
          moduleName: 'training',
          data: gameData.training,
        });

        console.log(`玩家角色等级已更新为: ${newLevel}`);
      }
    } catch (error) {
      console.error('更新玩家角色等级失败:', error);
    }
  }

  /**
   * 获取玩家角色当前等级
   */
  static getPlayerLevel(): number {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        return 1;
      }

      const playerCharacter = gameData.training.characters.find((char: Character) => char.id === 'player-1');

      return playerCharacter?.level || 1;
    } catch (error) {
      console.error('获取玩家角色等级失败:', error);
      return 1;
    }
  }

  /**
   * 检查是否需要更新玩家等级
   * 当任何我方人物的后代数量发生变化时调用
   */
  static checkAndUpdatePlayerLevel(): void {
    const currentPlayerLevel = this.getPlayerLevel();
    const maxLevelFromMyCharacters = this.getMaxLevelFromMyCharacters();

    if (maxLevelFromMyCharacters > currentPlayerLevel) {
      this.updatePlayerLevel();
    }
  }
}
