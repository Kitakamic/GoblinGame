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

    try {
      // 提取JSON数据
      const jsonMatch = aiResponse.match(/\[OPTIONS_JSON\]([\s\S]*?)\[\/OPTIONS_JSON\]/);
      if (!jsonMatch) {
        console.warn('❌ 未找到OPTIONS_JSON标签');
        console.log('📄 完整AI回复:', aiResponse);
        return { moraleChange: 0, reason: '未找到士气数据', confidence: 0 };
      }

      const jsonStr = jsonMatch[1].trim();
      console.log('📋 提取的JSON字符串:', jsonStr);

      const data = JSON.parse(jsonStr);
      console.log('📊 解析的JSON数据:', data);

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
      return { moraleChange: 0, reason: '未找到士气变化数据', confidence: 0 };
    } catch (error) {
      console.error('❌ 解析士气变化数据失败:', error);
      console.log('📄 原始AI回复:', aiResponse);
      return { moraleChange: 0, reason: '解析失败', confidence: 0 };
    }
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
