// 士气解析服务 - 解析AI输出中的士气变化数据

// 士气变化接口
export interface MoraleChange {
  morale?: number; // 士气变化值（百分比）
}

export interface ParsedMoraleResult {
  moraleChange: number;
  reason: string;
  confidence: number;
}

export class MoraleParseService {
  // 解析AI输出中的士气变化数据
  static parseMoraleChange(aiResponse: string): ParsedMoraleResult {
    console.log('🔍 开始解析士气变化数据...');
    console.log('📝 AI回复内容:', aiResponse);

    let jsonStr = '';
    let parseMethod = '';

    // ========== 方法1: 尝试匹配 [OPTIONS_JSON] 标签格式 ==========
    const tagMatch = aiResponse.match(/\[OPTIONS_JSON\]([\s\S]*?)\[\/OPTIONS_JSON\]/);
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
      const codeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
        parseMethod = '独立代码块格式';
        console.log('📋 使用独立代码块格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 方法3: 尝试从大括号开始到结尾的格式（纯JSON） ==========
    if (!jsonStr) {
      const braceMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0].trim();
        parseMethod = '纯JSON格式（大括号到结尾）';
        console.log('📋 使用纯JSON格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 尝试解析JSON并提取morale_changes ==========
    if (jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        console.log(`📊 使用${parseMethod}解析的JSON数据:`, data);

        if (data.morale_changes) {
          console.log('✅ 找到士气变化数据:', data.morale_changes);
          const moraleChange = data.morale_changes as MoraleChange;

          if (moraleChange.morale !== undefined) {
            const change = this.getRandomMoraleChange(moraleChange.morale);
            return {
              moraleChange: change,
              reason: `AI输出士气变化：${moraleChange.morale}%`,
              confidence: 1.0,
            };
          }
        }

        console.warn('⚠️ JSON数据中未找到morale_changes字段');
        console.log('📋 可用字段:', Object.keys(data));
      } catch (jsonError) {
        console.warn(`⚠️ 使用${parseMethod}解析JSON失败:`, jsonError);
      }
    }

    // ========== 方法4: 单独寻找 "morale": 数字 格式 ==========
    console.log('🔍 尝试单独寻找 "morale": 数字 格式...');
    // 支持 "morale": -5 或 'morale': -5 或 morale: -5 等格式
    const moralePattern = /["']?morale["']?\s*:\s*(-?\d+\.?\d*)/i;
    const moraleMatch = aiResponse.match(moralePattern);
    if (moraleMatch) {
      const moraleValue = parseFloat(moraleMatch[1]);
      if (!isNaN(moraleValue)) {
        console.log(`✅ 找到独立的morale值: ${moraleValue}`);
        const change = this.getRandomMoraleChange(moraleValue);
        return {
          moraleChange: change,
          reason: `AI输出士气变化：${moraleValue}%`,
          confidence: 0.8, // 降低置信度，因为是从文本中直接提取
        };
      }
    }

    // ========== 所有方法都失败，使用保底机制 ==========
    console.warn('❌ 所有解析方法都失败，启用保底机制');
    console.log('📄 完整AI回复:', aiResponse);

    // 保底机制：随机降低1-10点士气
    const fallbackChange = -(Math.floor(Math.random() * 10) + 1); // -1 到 -10 之间的随机数
    console.log(`🛡️ 保底机制生效：随机降低${Math.abs(fallbackChange)}点士气`);
    return {
      moraleChange: fallbackChange,
      reason: `保底机制：随机降低${Math.abs(fallbackChange)}%士气`,
      confidence: 0.3, // 降低置信度，因为是保底机制
    };
  }

  // 获取士气变化的随机值
  private static getRandomMoraleChange(baseValue: number): number {
    // 士气变化范围：基础值的 ±20%
    const variation = Math.floor(Math.abs(baseValue) * 0.2);
    const min = baseValue - variation;
    const max = baseValue + variation;
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`🎲 士气随机化: 基础值=${baseValue}, 变化范围=[${min}, ${max}], 结果=${result}`);
    return result;
  }

  // 获取士气状态描述
  static getMoraleStatusDescription(morale: number): string {
    if (morale >= 90) return '士气高昂';
    if (morale >= 70) return '士气良好';
    if (morale >= 50) return '士气一般';
    if (morale >= 30) return '士气低落';
    if (morale >= 10) return '士气极低';
    return '士气崩溃';
  }

  // 获取士气颜色
  static getMoraleColor(morale: number): string {
    if (morale >= 70) return '#22c55e'; // 绿色
    if (morale >= 40) return '#f59e0b'; // 黄色
    if (morale >= 20) return '#f97316'; // 橙色
    return '#dc2626'; // 红色
  }
}
