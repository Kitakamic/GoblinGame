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
   * 注意：调用此方法前需要先应用酒馆正则处理文本
   * 支持多种格式：标签格式、代码块格式、纯JSON格式、单独字段格式
   */
  static parseAttributeChanges(processedResponse: string): AttributeChange | null {
    console.log('🔍 开始解析属性变化数据...');
    console.log('📝 已处理的AI回复内容:', processedResponse);

    let jsonStr = '';
    let parseMethod = '';

    // ========== 方法1: 尝试匹配 [OPTIONS_JSON] 标签格式 ==========
    const tagMatch = processedResponse.match(/\[OPTIONS_JSON\]([\s\S]*?)\[\/OPTIONS_JSON\]/);
    if (tagMatch) {
      const tagContent = tagMatch[1].trim();
      console.log('📋 提取的标签内容:', tagContent);

      // 检查标签内容是否包含```json代码块
      const codeBlockMatch = tagContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        // 嵌套格式：标签内包含代码块
        jsonStr = codeBlockMatch[1].trim();
        parseMethod = '嵌套格式（标签+代码块）';
        console.log('📋 使用嵌套格式（标签+代码块）提取的JSON字符串:', jsonStr);
      } else {
        // 纯标签格式：直接使用标签内容
        jsonStr = tagContent;
        parseMethod = '纯标签格式';
        console.log('📋 使用纯标签格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 方法2: 尝试匹配独立的```json代码块格式 ==========
    if (!jsonStr) {
      const codeBlockMatch = processedResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
        parseMethod = '独立代码块格式';
        console.log('📋 使用独立代码块格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 方法3: 尝试从大括号开始到结尾的格式（纯JSON） ==========
    if (!jsonStr) {
      const braceMatch = processedResponse.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0].trim();
        parseMethod = '纯JSON格式（大括号到结尾）';
        console.log('📋 使用纯JSON格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 尝试解析JSON并提取attribute_changes ==========
    if (jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        console.log(`📊 使用${parseMethod}解析的JSON数据:`, data);

        if (data.attribute_changes) {
          console.log('✅ 找到属性变化数据:', data.attribute_changes);
          return data.attribute_changes as AttributeChange;
        }

        console.warn('⚠️ JSON数据中未找到attribute_changes字段');
        console.log('📋 可用字段:', Object.keys(data));
      } catch (jsonError) {
        console.warn(`⚠️ 使用${parseMethod}解析JSON失败:`, jsonError);
      }
    }

    // ========== 方法4: 单独寻找 loyalty 和 stamina 字段 ==========
    console.log('🔍 尝试单独寻找属性变化字段...');
    const result: AttributeChange = {};
    let foundAny = false;

    // 尝试寻找 "loyalty": 数字 格式
    const loyaltyPattern = /["']?loyalty["']?\s*:\s*(-?\d+\.?\d*)/i;
    const loyaltyMatch = processedResponse.match(loyaltyPattern);
    if (loyaltyMatch) {
      const loyaltyValue = parseFloat(loyaltyMatch[1]);
      if (!isNaN(loyaltyValue)) {
        result.loyalty = loyaltyValue;
        foundAny = true;
        console.log(`✅ 找到独立的loyalty值: ${loyaltyValue}`);
      }
    }

    // 尝试寻找 "stamina": 数字 格式
    const staminaPattern = /["']?stamina["']?\s*:\s*(-?\d+\.?\d*)/i;
    const staminaMatch = processedResponse.match(staminaPattern);
    if (staminaMatch) {
      const staminaValue = parseFloat(staminaMatch[1]);
      if (!isNaN(staminaValue)) {
        result.stamina = staminaValue;
        foundAny = true;
        console.log(`✅ 找到独立的stamina值: ${staminaValue}`);
      }
    }

    if (foundAny) {
      console.log('✅ 通过单独字段提取找到属性变化数据:', result);
      return result;
    }

    // ========== 所有方法都失败，使用保底机制 ==========
    console.warn('❌ 所有解析方法都失败，启用保底机制');
    console.log('📄 完整处理后的回复:', processedResponse);

    // 保底机制：给予小幅度的正面属性变化（忠诚度+1，体力-2）
    const fallbackChanges: AttributeChange = {
      loyalty: 2, // 默认增加1点忠诚度
      stamina: -2, // 默认消耗2点体力
    };
    console.log('🛡️ 保底机制生效：默认属性变化', fallbackChanges);
    return fallbackChanges;
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
