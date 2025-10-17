/**
 * 头像切换服务
 * 负责根据人物的堕落值自动切换对应的头像
 */

import type { Character } from '../类型/人物类型';

export class AvatarSwitchService {
  /**
   * 根据堕落值获取对应的头像（不包含完全堕落状态）
   * @param character 人物对象
   * @returns 对应的头像URL
   */
  static getAvatarByCorruptionLevel(character: Character): string | undefined {
    const loyalty = character.loyalty;

    // 半堕落（50%及以上，但小于100%）
    if (loyalty >= 50 && loyalty < 100) {
      return character.corruptedAvatar || character.avatar;
    }

    // 正常状态（50%以下）和完全堕落状态（100%）都显示正常头像
    // 完全堕落头像需要通过堕落按钮手动切换
    return character.avatar;
  }

  /**
   * 检查是否需要切换头像（不包含完全堕落状态）
   * @param character 人物对象
   * @param previousLoyalty 之前的堕落值
   * @returns 是否需要切换头像
   */
  static shouldSwitchAvatar(character: Character, previousLoyalty: number): boolean {
    const currentLoyalty = character.loyalty;

    // 检查是否跨越了关键阈值（排除完全堕落状态）
    const previousLevel = this.getCorruptionLevel(previousLoyalty);
    const currentLevel = this.getCorruptionLevel(currentLoyalty);

    // 只有在正常状态和半堕落状态之间切换时才自动切换头像
    // 完全堕落状态需要通过堕落按钮手动切换
    return previousLevel !== currentLevel && previousLevel !== 'fully_corrupted' && currentLevel !== 'fully_corrupted';
  }

  /**
   * 获取堕落等级
   * @param loyalty 堕落值
   * @returns 堕落等级
   */
  private static getCorruptionLevel(loyalty: number): 'normal' | 'corrupted' | 'fully_corrupted' {
    if (loyalty >= 100) {
      return 'fully_corrupted';
    } else if (loyalty >= 50) {
      return 'corrupted';
    } else {
      return 'normal';
    }
  }

  /**
   * 更新人物的当前头像
   * @param character 人物对象
   * @returns 更新后的人物对象
   */
  static updateCharacterAvatar(character: Character): Character {
    const newAvatar = this.getAvatarByCorruptionLevel(character);

    return {
      ...character,
      avatar: newAvatar,
    };
  }

  /**
   * 处理堕落值变化时的头像切换
   * @param character 人物对象
   * @param previousLoyalty 之前的堕落值
   * @returns 更新后的人物对象和切换信息
   */
  static handleCorruptionChange(
    character: Character,
    previousLoyalty: number,
  ): { character: Character; switched: boolean; level: string } {
    const switched = this.shouldSwitchAvatar(character, previousLoyalty);
    const updatedCharacter = this.updateCharacterAvatar(character);
    const level = this.getCorruptionLevel(character.loyalty);

    return {
      character: updatedCharacter,
      switched,
      level,
    };
  }

  /**
   * 手动切换到完全堕落头像（通过堕落按钮触发）
   * @param character 人物对象
   * @returns 更新后的人物对象
   */
  static switchToFullyCorruptedAvatar(character: Character): Character {
    return {
      ...character,
      avatar: character.fullyCorruptedAvatar || character.avatar,
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
    } else if (loyalty >= 50) {
      return '半堕落';
    } else {
      return '正常';
    }
  }

  /**
   * 检查人物是否有对应状态的头像
   * @param character 人物对象
   * @param level 堕落等级
   * @returns 是否有对应头像
   */
  static hasAvatarForLevel(character: Character, level: 'normal' | 'corrupted' | 'fully_corrupted'): boolean {
    switch (level) {
      case 'normal':
        return !!character.avatar;
      case 'corrupted':
        return !!character.corruptedAvatar;
      case 'fully_corrupted':
        return !!character.fullyCorruptedAvatar;
      default:
        return false;
    }
  }

  /**
   * 获取所有可用的头像信息
   * @param character 人物对象
   * @returns 头像信息数组
   */
  static getAllAvatars(character: Character): Array<{ level: string; url: string | undefined; description: string }> {
    return [
      {
        level: 'normal',
        url: character.avatar,
        description: '正常状态头像',
      },
      {
        level: 'corrupted',
        url: character.corruptedAvatar,
        description: '半堕落头像',
      },
      {
        level: 'fully_corrupted',
        url: character.fullyCorruptedAvatar,
        description: '完全堕落头像',
      },
    ];
  }
}
