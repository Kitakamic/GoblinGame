/**
 * 属性变化解析服务
 * 解析AI输出的属性变化数据并应用随机化
 * 使用实际数值计算，参考人物解析服务的计算逻辑
 */

export interface AttributeChange {
  loyalty?: number; // 忠诚度变化值（百分比）
  stamina?: number; // 体力变化值（实际数值）
}

export interface ParsedAttributeChanges {
  loyalty: number;
  stamina: number;
}

export class AttributeChangeParseService {
  /**
   * 解析AI输出的属性变化数据
   */
  static parseAttributeChanges(aiResponse: string): AttributeChange | null {
    console.log('🔍 开始解析属性变化数据...');
    console.log('📝 AI回复内容:', aiResponse);

    try {
      // 提取JSON数据
      const jsonMatch = aiResponse.match(/\[OPTIONS_JSON\]([\s\S]*?)\[\/OPTIONS_JSON\]/);
      if (!jsonMatch) {
        console.warn('❌ 未找到OPTIONS_JSON标签');
        console.log('📄 完整AI回复:', aiResponse);
        return null;
      }

      const jsonStr = jsonMatch[1].trim();
      console.log('📋 提取的JSON字符串:', jsonStr);

      const data = JSON.parse(jsonStr);
      console.log('📊 解析的JSON数据:', data);

      if (data.attribute_changes) {
        console.log('✅ 找到属性变化数据:', data.attribute_changes);
        return data.attribute_changes as AttributeChange;
      }

      console.warn('⚠️ JSON数据中未找到attribute_changes字段');
      console.log('📋 可用字段:', Object.keys(data));
      return null;
    } catch (error) {
      console.error('❌ 解析属性变化数据失败:', error);
      console.log('📄 原始AI回复:', aiResponse);
      return null;
    }
  }

  /**
   * 应用属性变化并添加随机化
   */
  static applyAttributeChanges(
    changes: AttributeChange,
    currentLoyalty: number,
    currentStamina: number,
    maxStamina: number = 200,
  ): ParsedAttributeChanges {
    console.log('🎯 开始应用属性变化...');
    console.log('📊 当前属性:', { loyalty: currentLoyalty, stamina: currentStamina, maxStamina });
    console.log('📈 变化数据:', changes);

    const result: ParsedAttributeChanges = {
      loyalty: currentLoyalty,
      stamina: currentStamina,
    };

    // 应用忠诚度变化（百分比）
    if (changes.loyalty !== undefined) {
      const loyaltyChange = this.getRandomLoyaltyChange(changes.loyalty);
      const newLoyalty = Math.max(0, Math.min(100, currentLoyalty + loyaltyChange));
      result.loyalty = newLoyalty;
      console.log(`💖 忠诚度变化: ${currentLoyalty} + ${loyaltyChange} = ${newLoyalty}`);
    } else {
      console.log('💖 忠诚度无变化');
    }

    // 应用体力变化（实际数值）
    if (changes.stamina !== undefined) {
      const staminaChange = this.getRandomStaminaChange(changes.stamina);
      const newStamina = Math.max(0, Math.min(maxStamina, currentStamina + staminaChange));
      result.stamina = newStamina;
      console.log(`💪 体力变化: ${currentStamina} + ${staminaChange} = ${newStamina}`);
    } else {
      console.log('💪 体力无变化');
    }

    console.log('✅ 最终属性结果:', result);
    return result;
  }

  /**
   * 获取忠诚度变化的随机值
   * 基于AI输出的基础值进行随机化，微微上调增加幅度
   */
  private static getRandomLoyaltyChange(baseValue: number): number {
    // 忠诚度变化范围：基础值的 ±30%，并增加基础奖励
    const baseBonus = 1; // 每轮对话额外增加1点忠诚度
    const adjustedBaseValue = baseValue + baseBonus;
    const variation = Math.floor(adjustedBaseValue * 0.3);
    const min = Math.max(-10, adjustedBaseValue - variation);
    const max = Math.min(12, adjustedBaseValue + variation); // 提高上限到12
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(
      `🎲 忠诚度随机化: 基础值=${baseValue}, 调整后=${adjustedBaseValue}, 变化范围=[${min}, ${max}], 结果=${result}`,
    );
    return result;
  }

  /**
   * 获取体力变化的随机值
   * 基于AI输出的基础值进行随机化，微微上调消耗幅度
   */
  private static getRandomStaminaChange(baseValue: number): number {
    // 体力变化范围：基础值的 ±50%，并增加基础消耗
    const baseConsumption = 2; // 每轮对话额外消耗2点体力
    const adjustedBaseValue = baseValue - baseConsumption; // 减少体力
    const variation = Math.floor(Math.abs(adjustedBaseValue) * 0.5);
    const min = adjustedBaseValue - variation;
    const max = adjustedBaseValue + variation;
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(
      `🎲 体力随机化: 基础值=${baseValue}, 调整后=${adjustedBaseValue}, 变化范围=[${min}, ${max}], 结果=${result}`,
    );
    return result;
  }

  /**
   * 检查体力是否过低（基于实际数值）
   */
  static isStaminaTooLow(stamina: number): boolean {
    return stamina < 20; // 体力低于25时无法继续调教（因为每轮消耗更多体力）
  }

  /**
   * 验证属性变化是否合理
   */
  static validateAttributeChanges(changes: AttributeChange): boolean {
    // 检查忠诚度变化范围（调整上限）
    if (changes.loyalty !== undefined) {
      if (changes.loyalty < -10 || changes.loyalty > 12) {
        console.warn('忠诚度变化范围不合理:', changes.loyalty);
        return false;
      }
    }

    // 检查体力变化范围（调整下限，因为现在消耗更多）
    if (changes.stamina !== undefined) {
      if (changes.stamina < -25 || changes.stamina > 5) {
        console.warn('体力变化范围不合理:', changes.stamina);
        return false;
      }
    }

    return true;
  }
}
