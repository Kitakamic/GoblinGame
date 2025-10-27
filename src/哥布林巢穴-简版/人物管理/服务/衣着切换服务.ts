/**
 * 衣着切换服务
 * 负责根据人物的堕落值自动切换对应的衣着
 */

import type { Character, CharacterClothing } from '../类型/人物类型';

export class ClothingSwitchService {
  /**
   * 根据堕落值获取对应的衣着
   * @param character 人物对象
   * @returns 对应的衣着信息
   */
  static getClothingByCorruptionLevel(character: Character): CharacterClothing | undefined {
    if (!character.appearance) return undefined;

    const loyalty = character.loyalty;

    // 完全堕落状态（loyalty = 100）
    if (loyalty >= 100) {
      return character.appearance.corruptedClothing || character.appearance.clothing;
    }

    // 正常状态（loyalty < 100）
    return character.appearance.clothing;
  }

  /**
   * 检查是否需要切换衣着
   * @param character 人物对象
   * @param previousLoyalty 之前的堕落值
   * @returns 是否需要切换衣着
   */
  static shouldSwitchClothing(character: Character, previousLoyalty: number): boolean {
    if (!character.appearance) return false;

    const currentLoyalty = character.loyalty;

    // 检查是否跨越了关键阈值（100）
    const previousLevel = this.getCorruptionLevel(previousLoyalty);
    const currentLevel = this.getCorruptionLevel(currentLoyalty);

    return previousLevel !== currentLevel;
  }

  /**
   * 获取堕落等级
   * @param loyalty 堕落值
   * @returns 堕落等级
   */
  private static getCorruptionLevel(loyalty: number): 'normal' | 'corrupted' {
    if (loyalty >= 100) {
      return 'corrupted';
    } else {
      return 'normal';
    }
  }

  /**
   * 更新人物的当前衣着
   * @param character 人物对象
   * @returns 更新后的人物对象
   */
  static updateCharacterClothing(character: Character): Character {
    if (!character.appearance) return character;

    const newClothing = this.getClothingByCorruptionLevel(character);

    return {
      ...character,
      appearance: {
        ...character.appearance,
        clothing: newClothing,
      },
    };
  }

  /**
   * 处理堕落值变化时的衣着切换
   * @param character 人物对象
   * @param previousLoyalty 之前的堕落值
   * @returns 更新后的人物对象和切换信息
   */
  static handleCorruptionChange(
    character: Character,
    previousLoyalty: number,
  ): { character: Character; switched: boolean; level: string } {
    const switched = this.shouldSwitchClothing(character, previousLoyalty);
    const updatedCharacter = this.updateCharacterClothing(character);
    const level = this.getCorruptionLevel(character.loyalty);

    return {
      character: updatedCharacter,
      switched,
      level,
    };
  }

  /**
   * 手动切换到堕落衣着
   * @param character 人物对象
   * @returns 更新后的人物对象
   */
  static switchToCorruptedClothing(character: Character): Character {
    if (!character.appearance) return character;

    return {
      ...character,
      appearance: {
        ...character.appearance,
        clothing: character.appearance.corruptedClothing || character.appearance.clothing,
      },
    };
  }

  /**
   * 获取堕落等级的描述文本
   * @param loyalty 堕落值
   * @returns 等级描述
   */
  static getCorruptionLevelDescription(loyalty: number): string {
    if (loyalty >= 100) {
      return '完全堕落';
    } else {
      return '正常';
    }
  }

  /**
   * 检查人物是否有对应状态的衣着
   * @param character 人物对象
   * @param level 堕落等级
   * @returns 是否有对应衣着
   */
  static hasClothingForLevel(character: Character, level: 'normal' | 'corrupted'): boolean {
    if (!character.appearance) return false;

    switch (level) {
      case 'normal':
        return !!character.appearance.clothing;
      case 'corrupted':
        return !!character.appearance.corruptedClothing;
      default:
        return false;
    }
  }

  /**
   * 获取所有可用的衣着信息
   * @param character 人物对象
   * @returns 衣着信息数组
   */
  static getAllClothing(
    character: Character,
  ): Array<{ level: string; clothing: CharacterClothing | undefined; description: string }> {
    return [
      {
        level: 'normal',
        clothing: character.appearance?.clothing,
        description: '正常状态衣着',
      },
      {
        level: 'corrupted',
        clothing: character.appearance?.corruptedClothing,
        description: '堕落状态衣着',
      },
    ];
  }

  /**
   * 设置堕落衣着
   * @param character 人物对象
   * @param corruptedClothing 堕落衣着信息
   * @returns 更新后的人物对象
   */
  static setCorruptedClothing(character: Character, corruptedClothing: CharacterClothing): Character {
    if (!character.appearance) {
      return {
        ...character,
        appearance: {
          height: 160,
          weight: 50,
          measurements: 'B80-W60-H85',
          corruptedClothing,
        },
      };
    }

    return {
      ...character,
      appearance: {
        ...character.appearance,
        corruptedClothing,
      },
    };
  }
}
