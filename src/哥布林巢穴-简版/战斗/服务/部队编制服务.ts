import type { Character, TroopDeployment } from '../../人物管理/类型/人物类型';
import { databaseService } from '../../存档管理/数据库服务';
import { modularSaveManager } from '../../存档管理/模块化存档服务';
import { GOBLIN_UNIT_CHARACTERS } from '../类型/单位数据表';
import type { BattleUnit } from '../类型/战斗属性';
import type { Captain, FormationConfig } from '../类型/队长类型';
import { calculateTroopBonus } from './部队加成计算服务';

/**
 * 部队编制服务
 * 用于获取和管理已编制的部队数据
 */
export class FormationService {
  /**
   * 获取已编制的部队数据
   */
  static getFormationData(): BattleUnit[] {
    try {
      // 从存档系统获取人物数据
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        console.log('没有找到游戏数据');
        return [];
      }

      console.log('获取到的游戏数据:', gameData);
      const characters = gameData.training.characters;
      console.log('人物数据:', characters);
      const battleUnits: BattleUnit[] = [];

      // 遍历所有人物，查找已编制的人物
      characters.forEach((character: Character) => {
        console.log(
          `检查人物 ${character.name}: status=${character.status}, troopDeployment=`,
          character.troopDeployment,
        );
        if (character.status === 'deployed') {
          const captain = character;
          const troops = character.troopDeployment;

          // 计算人物等级（优先使用 level 字段，如果没有则使用 offspring/10 计算，都没有则返回1）
          const characterLevel = character.level ?? Math.floor((character.offspring ?? 0) / 10) ?? 1;

          // 评级加成系数（暂时不使用，与部队编制界面保持一致）
          // const ratingBonusMultiplier = this.getRatingBonusMultiplier(character.rating);

          // 计算部队属性加成
          let troopAttackBonus = 0;
          let troopDefenseBonus = 0;
          let troopIntelligenceBonus = 0;
          let troopSpeedBonus = 0;
          let troopHealthBonus = 0;

          if (troops) {
            // 将英文键名映射为中文名称
            const troopTypeMap: { [key: string]: string } = {
              normalGoblins: '普通哥布林',
              warriorGoblins: '哥布林战士',
              shamanGoblins: '哥布林萨满',
              paladinGoblins: '哥布林圣骑士',
            };

            Object.entries(troops).forEach(([type, count]) => {
              const troopCount = count as number;
              if (troopCount > 0) {
                // 将英文键名转换为中文名称
                const chineseType = troopTypeMap[type];
                if (chineseType) {
                  const goblinUnit = GOBLIN_UNIT_CHARACTERS.find(unit => unit.id === chineseType);
                  if (goblinUnit) {
                    // 使用线性计算的部队加成（我方单位，无递减）
                    const troopLevel = Math.min(goblinUnit.level, 10);

                    // 计算部队属性加成（与部队编制界面保持一致）
                    const attackBonus = calculateTroopBonus(troopCount, goblinUnit.attributes.attack, troopLevel);
                    const defenseBonus = calculateTroopBonus(troopCount, goblinUnit.attributes.defense, troopLevel);
                    const intelligenceBonus = calculateTroopBonus(
                      troopCount,
                      goblinUnit.attributes.intelligence,
                      troopLevel,
                    );
                    const speedBonus = calculateTroopBonus(troopCount, goblinUnit.attributes.speed, troopLevel);
                    const healthBonus = calculateTroopBonus(troopCount, goblinUnit.attributes.health, troopLevel);

                    // 累加加成
                    troopAttackBonus += attackBonus;
                    troopDefenseBonus += defenseBonus;
                    troopIntelligenceBonus += intelligenceBonus;
                    troopSpeedBonus += speedBonus;
                    troopHealthBonus += healthBonus;

                    console.log(`部队加成计算: ${chineseType} x${troopCount}`, {
                      单位属性: goblinUnit.attributes,
                      等级: troopLevel,
                      加成比例: troopLevel / 10,
                      计算加成: {
                        attack: attackBonus,
                        defense: defenseBonus,
                        intelligence: intelligenceBonus,
                        speed: speedBonus,
                        health: healthBonus,
                      },
                    });
                  }
                }
              }
            });
          }

          // 创建队长战斗单位（包含部队属性加成）
          const captainBattleUnit: BattleUnit = {
            id: `${captain.id}_captain`,
            name: captain.name,
            type: captain.unitType || 'physical', // 使用人物的实际单位类型，默认为物理型
            level: characterLevel, // 使用计算出的等级
            attributes: {
              attack: captain.attributes.attack + troopAttackBonus,
              defense: captain.attributes.defense + troopDefenseBonus,
              intelligence: captain.attributes.intelligence + troopIntelligenceBonus,
              speed: captain.attributes.speed + troopSpeedBonus,
            },
            maxHealth: captain.attributes.health + troopHealthBonus,
            currentHealth: captain.attributes.health + troopHealthBonus,
            isAlive: true,
            troops: troops, // 包含部队信息
            avatar: captain.avatar, // 包含头像信息
          };

          console.log(`队长 ${captain.name} 属性加成计算:`, {
            原始属性: captain.attributes,
            部队加成: {
              attack: troopAttackBonus,
              defense: troopDefenseBonus,
              intelligence: troopIntelligenceBonus,
              speed: troopSpeedBonus,
              health: troopHealthBonus,
            },
            最终属性: captainBattleUnit.attributes,
            最终血量: captainBattleUnit.maxHealth,
          });
          battleUnits.push(captainBattleUnit);
        }
      });

      console.log('获取到部队编制数据:', battleUnits);
      return battleUnits;
    } catch (error) {
      console.error('获取部队编制数据失败:', error);
      return [];
    }
  }

  /**
   * 检查是否有已编制的部队
   */
  static hasFormationData(): boolean {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        console.log('hasFormationData: 没有找到游戏数据');
        return false;
      }

      const characters = gameData.training.characters;
      console.log('hasFormationData: 检查人物数据:', characters);

      // 检查是否有任何人物被编制（允许队长单独出战）
      const hasFormation = characters.some((character: Character) => {
        const isDeployed = character.status === 'deployed';
        console.log(`人物 ${character.name}: isDeployed=${isDeployed}, troopDeployment=`, character.troopDeployment);
        return isDeployed;
      });

      console.log('hasFormationData: 检查结果:', hasFormation);

      // 显示详细的调试信息
      if (!hasFormation) {
        console.log('=== 部队编制调试信息 ===');
        console.log('已编制的人物数量:', characters.filter(c => c.status === 'deployed').length);
        characters
          .filter(c => c.status === 'deployed')
          .forEach(char => {
            console.log(`人物: ${char.name}`);
            console.log(`  状态: ${char.status}`);
            console.log(`  部队编制:`, char.troopDeployment);
            if (char.troopDeployment) {
              const totalTroops = Object.values(char.troopDeployment).reduce((sum, count) => sum + count, 0);
              console.log(`  总部队数: ${totalTroops}`);
            } else {
              console.log(`  无部队编制（队长单独出战）`);
            }
          });
        console.log('========================');
      }

      return hasFormation;
    } catch (error) {
      console.error('检查部队编制数据失败:', error);
      return false;
    }
  }

  /**
   * 获取部队编制统计信息
   */
  static getFormationStats(): {
    totalUnits: number;
    totalCaptains: number;
    unitTypes: Record<string, number>;
  } {
    const battleUnits = this.getFormationData();
    const unitTypes: Record<string, number> = {};

    battleUnits.forEach(unit => {
      unitTypes[unit.type] = (unitTypes[unit.type] || 0) + 1;
    });

    // 计算队长数量（已编制的人物数量）
    const gameData = modularSaveManager.getCurrentGameData();
    const totalCaptains = gameData
      ? gameData.training.characters.filter(
          (char: Character) =>
            char.status === 'deployed' &&
            char.troopDeployment &&
            Object.values(char.troopDeployment).some((count: number) => count > 0),
        ).length
      : 0;

    return {
      totalUnits: battleUnits.length,
      totalCaptains,
      unitTypes,
    };
  }

  /**
   * 保存部队编制数据到存档系统
   */
  static async saveFormationData(captainSlots: (Captain | null)[]): Promise<boolean> {
    try {
      console.log('开始保存部队编制数据:', captainSlots);
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        console.error('没有找到游戏数据，无法保存部队编制');
        return false;
      }

      console.log('保存前的游戏数据:', gameData);
      console.log('保存前的人物数据:', gameData.training.characters);

      // 首先清除所有现有的人物编制状态
      gameData.training.characters.forEach((character: Character) => {
        if (character.status === 'deployed') {
          console.log(`清除人物 ${character.name} 的编制状态`);
          character.status = 'surrendered'; // 恢复为已投降状态
          character.troopDeployment = undefined;
          character.formationPosition = undefined; // 清除位置信息
        }
      });

      // 处理新的编制数据
      captainSlots.forEach((captain: Captain | null, index) => {
        console.log(`处理队长槽位 ${index}:`, captain);
        if (captain && captain.troops) {
          // 找到对应的人物
          const character = gameData.training.characters.find((char: Character) => char.id === captain.id);
          if (character) {
            console.log(`找到对应人物 ${character.name}，设置编制状态`);
            // 设置人物状态为已编制
            character.status = 'deployed';

            // 保存部队编制信息
            const troopDeployment: TroopDeployment = {
              normalGoblins: captain.troops.普通哥布林 || 0,
              warriorGoblins: captain.troops.哥布林战士 || 0,
              shamanGoblins: captain.troops.哥布林萨满 || 0,
              paladinGoblins: captain.troops.哥布林圣骑士 || 0,
            };
            character.troopDeployment = troopDeployment;
            // 保存位置信息（1-6）
            character.formationPosition = index + 1;
            console.log(`人物 ${character.name} 的部队编制:`, troopDeployment, `位置: ${character.formationPosition}`);
          } else {
            console.warn(`未找到ID为 ${captain.id} 的人物`);
          }
        }
      });

      console.log('保存后的人物数据:', gameData.training.characters);

      // 更新存档数据
      modularSaveManager.updateModuleData({
        moduleName: 'training',
        data: gameData.training,
      });

      console.log('部队编制数据已保存到存档系统');
      return true;
    } catch (error) {
      console.error('保存部队编制数据失败:', error);
      return false;
    }
  }

  /**
   * 从存档系统加载部队编制数据
   */
  static loadFormationData(): (Captain | null)[] {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        console.log('没有找到游戏数据');
        return [];
      }

      const captainSlots: (Captain | null)[] = Array(6).fill(null);
      const characters = gameData.training.characters;

      // 查找所有已编制的人物
      const deployedCharacters = characters.filter(
        (char: Character) => char.status === 'deployed' && char.troopDeployment,
      );

      console.log(
        '找到已编制的人物:',
        deployedCharacters.map(c => ({ name: c.name, position: c.formationPosition })),
      );

      // 根据位置信息恢复队长槽位数据
      deployedCharacters.forEach((character: Character) => {
        if (character.troopDeployment && character.formationPosition) {
          const position = character.formationPosition - 1; // 转换为0-5的索引
          if (position >= 0 && position < 6) {
            const captain: Captain = {
              id: character.id,
              name: character.name,
              avatar: character.avatar || '',
              level: character.level ?? Math.floor((character.offspring ?? 0) / 10) ?? 1,
              offspring: character.offspring,
              attributes: character.attributes,
              description: character.title || '',
              unitType: character.unitType || 'physical',
              rating: character.rating || 'C',
              isUsed: true,
              troops: {
                普通哥布林: character.troopDeployment.normalGoblins,
                哥布林战士: character.troopDeployment.warriorGoblins,
                哥布林萨满: character.troopDeployment.shamanGoblins,
                哥布林圣骑士: character.troopDeployment.paladinGoblins,
              },
            };
            captainSlots[position] = captain;
            console.log(`人物 ${character.name} 恢复到位置 ${character.formationPosition}`);
          } else {
            console.warn(`人物 ${character.name} 的位置信息无效: ${character.formationPosition}`);
          }
        } else {
          console.warn(`人物 ${character.name} 缺少位置信息，跳过恢复`);
        }
      });

      console.log('从存档系统加载部队编制数据:', captainSlots);
      return captainSlots;
    } catch (error) {
      console.error('加载部队编制数据失败:', error);
      return [];
    }
  }

  // ==================== 栏目式存档功能 ====================

  /**
   * 获取当前存档ID
   */
  private static getCurrentArchiveId(): string {
    try {
      // 从数据库服务获取当前存档ID
      const currentSaveId = databaseService.getCurrentSaveId();
      if (currentSaveId) {
        return currentSaveId;
      }

      // 如果没有当前存档ID，尝试从游戏数据获取
      const gameData = modularSaveManager.getCurrentGameData();
      if (gameData) {
        // 使用默认槽位0作为存档ID
        return 'slot_0';
      }

      console.warn('没有找到游戏数据，使用默认存档ID');
      return 'slot_0';
    } catch (error) {
      console.error('获取存档ID失败:', error);
      return 'slot_0';
    }
  }

  /**
   * 获取所有保存的部队配置（仅限当前存档）
   */
  static getFormationConfigs(): FormationConfig[] {
    try {
      return this.loadConfigsFromArchive();
    } catch (error) {
      console.error('获取部队配置列表失败:', error);
      return [];
    }
  }

  /**
   * 保存部队配置
   */
  static saveFormationConfig(config: Omit<FormationConfig, 'id' | 'createdAt' | 'lastModified' | 'archiveId'>): string {
    try {
      const configs = this.getFormationConfigs();
      const currentArchiveId = this.getCurrentArchiveId();
      const newConfig: FormationConfig = {
        ...config,
        id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        lastModified: Date.now(),
        archiveId: currentArchiveId,
      };

      configs.push(newConfig);
      this.saveConfigsToArchive(configs);

      console.log('部队配置已保存:', newConfig);
      return newConfig.id;
    } catch (error) {
      console.error('保存部队配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新部队配置
   */
  static updateFormationConfig(
    configId: string,
    updates: Partial<Omit<FormationConfig, 'id' | 'createdAt' | 'archiveId'>>,
  ): boolean {
    try {
      const configs = this.getFormationConfigs();
      const configIndex = configs.findIndex(config => config.id === configId);

      if (configIndex === -1) {
        console.error('未找到指定的部队配置');
        return false;
      }

      configs[configIndex] = {
        ...configs[configIndex],
        ...updates,
        lastModified: Date.now(),
      };

      this.saveConfigsToArchive(configs);
      console.log('部队配置已更新:', configs[configIndex]);
      return true;
    } catch (error) {
      console.error('更新部队配置失败:', error);
      return false;
    }
  }

  /**
   * 删除部队配置
   */
  static deleteFormationConfig(configId: string): boolean {
    try {
      const configs = this.getFormationConfigs();
      const filteredConfigs = configs.filter(config => config.id !== configId);

      if (filteredConfigs.length === configs.length) {
        console.error('未找到指定的部队配置');
        return false;
      }

      this.saveConfigsToArchive(filteredConfigs);
      console.log('部队配置已删除:', configId);
      return true;
    } catch (error) {
      console.error('删除部队配置失败:', error);
      return false;
    }
  }

  /**
   * 加载指定的部队配置
   */
  static loadFormationConfig(configId: string): (Captain | null)[] {
    try {
      const configs = this.getFormationConfigs();
      const config = configs.find(c => c.id === configId);

      if (!config) {
        console.error('未找到指定的部队配置');
        return Array(6).fill(null);
      }

      // 验证配置是否属于当前存档
      const currentArchiveId = this.getCurrentArchiveId();
      if (config.archiveId && config.archiveId !== currentArchiveId) {
        console.error('配置不属于当前存档，无法加载');
        return Array(6).fill(null);
      }

      console.log('加载部队配置:', config);
      return config.captainSlots;
    } catch (error) {
      console.error('加载部队配置失败:', error);
      return Array(6).fill(null);
    }
  }

  /**
   * 获取指定配置的详细信息
   */
  static getFormationConfig(configId: string): FormationConfig | null {
    try {
      const configs = this.getFormationConfigs();
      const config = configs.find(c => c.id === configId);

      if (!config) return null;

      // 验证配置是否属于当前存档
      const currentArchiveId = this.getCurrentArchiveId();
      if (config.archiveId && config.archiveId !== currentArchiveId) {
        console.error('配置不属于当前存档');
        return null;
      }

      return config;
    } catch (error) {
      console.error('获取部队配置详情失败:', error);
      return null;
    }
  }

  // ==================== 存档集成功能 ====================

  /**
   * 保存当前部队编制到存档
   */
  static saveCurrentFormationToArchive(captainSlots: (Captain | null)[]): void {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        console.warn('没有找到游戏数据，无法保存部队编制');
        return;
      }

      // 更新部队编制数据
      gameData.formation.currentFormation = captainSlots;

      // 更新存档
      modularSaveManager.updateModuleData({
        moduleName: 'formation',
        data: gameData.formation,
      });

      console.log('部队编制已保存到存档');
    } catch (error) {
      console.error('保存部队编制到存档失败:', error);
    }
  }

  /**
   * 从存档加载当前部队编制
   */
  static loadCurrentFormationFromArchive(): (Captain | null)[] {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData || !gameData.formation) {
        console.log('没有找到存档中的部队编制数据，返回空编制');
        return Array(6).fill(null);
      }

      return gameData.formation.currentFormation || Array(6).fill(null);
    } catch (error) {
      console.error('从存档加载部队编制失败:', error);
      return Array(6).fill(null);
    }
  }

  /**
   * 保存配置列表到存档
   */
  static saveConfigsToArchive(configs: FormationConfig[]): void {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData) {
        console.warn('没有找到游戏数据，无法保存配置列表');
        return;
      }

      // 更新配置列表数据
      gameData.formation.savedConfigs = configs;

      // 更新存档
      modularSaveManager.updateModuleData({
        moduleName: 'formation',
        data: gameData.formation,
      });

      console.log('配置列表已保存到存档');
    } catch (error) {
      console.error('保存配置列表到存档失败:', error);
    }
  }

  /**
   * 从存档加载配置列表
   */
  static loadConfigsFromArchive(): FormationConfig[] {
    try {
      const gameData = modularSaveManager.getCurrentGameData();
      if (!gameData || !gameData.formation) {
        console.log('没有找到存档中的配置列表数据，返回空列表');
        return [];
      }

      return gameData.formation.savedConfigs || [];
    } catch (error) {
      console.error('从存档加载配置列表失败:', error);
      return [];
    }
  }
}
