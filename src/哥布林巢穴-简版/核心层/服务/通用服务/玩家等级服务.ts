import type { Character } from '../../../功能模块层/人物管理/类型/人物类型';
import { modularSaveManager } from '../存档系统/模块化存档服务';

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
        console.log('没有游戏数据，返回默认等级1');
        return 1; // 默认等级
      }

      const characters = gameData.training.characters;
      console.log(`总人物数量: ${characters.length}`);

      // 筛选出我方人物（排除玩家角色和敌方角色）
      const myCharacters = characters.filter(
        (character: Character) =>
          character.status !== 'player' && character.status !== 'enemy' && character.status !== 'uncaptured',
      );

      console.log(`我方人物数量: ${myCharacters.length}`);
      console.log(
        '我方人物详情:',
        myCharacters.map(c => ({
          name: c.name,
          level: c.level ?? Math.floor((c.offspring ?? 0) / 10) ?? 1,
          offspring: c.offspring,
        })),
      );

      if (myCharacters.length === 0) {
        console.log('没有我方人物，返回默认等级1');
        return 1; // 没有我方人物时返回默认等级
      }

      // 计算所有我方人物的等级，取最高值
      // 优先使用 level 字段，如果没有则使用 offspring/10 计算，都没有则返回1
      const levels = myCharacters.map((character: Character) => {
        return character.level ?? Math.floor((character.offspring ?? 0) / 10) ?? 1;
      });
      const maxLevel = Math.max(...levels);
      console.log(`计算出的等级: ${levels}, 最高等级: ${maxLevel}`);

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
        console.log('没有游戏数据，无法更新玩家等级');
        return;
      }

      const playerCharacter = gameData.training.characters.find((char: Character) => char.id === 'player-1');
      console.log('找到玩家角色:', playerCharacter ? '是' : '否');

      if (playerCharacter) {
        const newLevel = this.getMaxLevelFromMyCharacters();
        const oldLevel = playerCharacter.level;
        playerCharacter.level = newLevel;

        console.log(`玩家角色等级更新: ${oldLevel} -> ${newLevel}`);

        // 更新存档
        modularSaveManager.updateModuleData({
          moduleName: 'training',
          data: gameData.training,
        });

        console.log(`玩家角色等级已更新为: ${newLevel}`);
      } else {
        console.log('未找到玩家角色 (id: player-1)');
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

      // 玩家角色的等级直接使用 level 字段（不需要从offspring计算，因为玩家等级是从最高级人物计算的）
      return playerCharacter?.level ?? 1;
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

    console.log(`检查玩家等级更新: 当前等级=${currentPlayerLevel}, 我方最高等级=${maxLevelFromMyCharacters}`);

    // 如果等级不同，就更新（不一定要更高才更新）
    if (maxLevelFromMyCharacters !== currentPlayerLevel) {
      console.log(`需要更新玩家等级: ${currentPlayerLevel} -> ${maxLevelFromMyCharacters}`);
      this.updatePlayerLevel();
    } else {
      console.log(`玩家等级无需更新: ${currentPlayerLevel} = ${maxLevelFromMyCharacters}`);
    }
  }
}
