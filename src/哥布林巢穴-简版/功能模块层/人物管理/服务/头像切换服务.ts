/**
 * 头像切换服务
 * 负责根据人物的堕落值自动切换对应的头像
 */

import type { Character } from '../类型/人物类型';

export class AvatarSwitchService {
  /**
   * 根据堕落值获取对应的头像（不包含完全堕落状态）
   * @param character 人物对象
   * @returns 对应的头像URL，如果不存在则返回空字符串（避免undefined）
   */
  static getAvatarByCorruptionLevel(character: Character): string {
    const loyalty = character.loyalty;

    // 完全堕落状态（100%）：如果已经切换到完全堕落头像，则保持；否则检查是否应该使用完全堕落头像
    if (loyalty >= 100) {
      // 如果当前头像已经是完全堕落头像（通过比较 URL 判断），则保持
      if (character.avatar === character.fullyCorruptedAvatar && character.fullyCorruptedAvatar) {
        return character.avatar || '';
      }
      // 否则，如果存在完全堕落头像，使用完全堕落头像；否则回退到正常头像
      return character.fullyCorruptedAvatar || character.avatar || '';
    }

    // 半堕落（50%及以上，但小于100%）
    if (loyalty >= 50 && loyalty < 100) {
      // 如果有半堕落头像则使用，否则回退到正常头像
      return character.corruptedAvatar || character.avatar || '';
    }

    // 正常状态（50%以下）显示正常头像
    return character.avatar || '';
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
    // 如果人物已经处于完全堕落状态（loyalty >= 100）且当前头像已经是完全堕落头像，则不更新
    // 避免将已经完全堕落的头像切换回半堕落或正常头像
    if (character.loyalty >= 100) {
      // 检查当前头像是否已经是完全堕落头像
      const isCurrentlyFullyCorrupted =
        character.avatar === character.fullyCorruptedAvatar && character.fullyCorruptedAvatar;
      if (isCurrentlyFullyCorrupted) {
        // 如果已经是完全堕落头像，保持现状，不更新
        return character;
      }
    }

    // 获取对应堕落值的头像（已包含回退逻辑）
    const newAvatar = this.getAvatarByCorruptionLevel(character);

    // 确保 avatar 字段不会变成 undefined
    return {
      ...character,
      avatar: newAvatar || character.avatar || '',
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

    // 如果人物已经处于完全堕落状态且当前头像已经是完全堕落头像，则不更新头像
    // 避免将已经完全堕落的头像切换回半堕落或正常头像
    let updatedCharacter: Character;
    if (
      character.loyalty >= 100 &&
      character.avatar === character.fullyCorruptedAvatar &&
      character.fullyCorruptedAvatar
    ) {
      // 如果已经是完全堕落头像，保持现状，不更新
      updatedCharacter = character;
    } else {
      // 否则正常更新头像
      updatedCharacter = this.updateCharacterAvatar(character);
    }

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
      // 如果有完全堕落头像则使用，否则回退到正常头像，如果都没有则使用空字符串
      avatar: character.fullyCorruptedAvatar || character.avatar || '',
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
