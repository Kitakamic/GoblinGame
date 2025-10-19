import type { ParsedOptionsResult } from '../类型定义/调教类型';

/**
 * 选项解析服务：从AI输出中提取“下一步选项”列表
 */
export class OptionParseService {
  /**
   * 从文本中解析下一步选项
   */
  static parseNextStepOptions(text: string): ParsedOptionsResult {
    console.log('🔍 开始解析选项...');
    console.log('📝 输入文本:', text);

    // 解析 JSON 格式：[OPTIONS_JSON]{ ... }
    try {
      const jsonBlock = OptionParseService.extractJsonBlock(text);
      console.log('📋 提取的JSON块:', jsonBlock);

      if (jsonBlock) {
        const parsed = JSON.parse(jsonBlock) as {
          options?: Array<{ strategy: '保守' | '激进' | '平稳'; text: string }>;
        };
        console.log('📊 解析的JSON数据:', parsed);
        console.log('📋 选项数组:', parsed.options);

        if (Array.isArray(parsed.options) && parsed.options.length > 0) {
          const mapped = parsed.options
            .filter(o => o && typeof o.text === 'string')
            .map(o => ({ text: o.text, label: o.strategy }))
            .slice(0, 3);
          console.log('🎯 映射后的选项:', mapped);
          if (mapped.length > 0) {
            console.log('✅ 成功解析选项，数量:', mapped.length);
            return { options: mapped };
          }
        }
      }
    } catch (error) {
      console.warn('❌ JSON 解析失败:', error);
    }

    // 如果 JSON 解析失败，返回空选项
    console.log('⚠️ 未找到有效选项');
    return { options: [] };
  }

  private static extractJsonBlock(text: string): string | null {
    // 首先尝试匹配 [OPTIONS_JSON] 标签格式
    const tagMatch = text.match(/\[OPTIONS_JSON\]([\s\S]*?)(?:\[\/OPTIONS_JSON\]|$)/i);
    if (tagMatch && tagMatch[1]) {
      const tagContent = tagMatch[1].trim();
      console.log('📋 提取的标签内容:', tagContent);

      // 检查标签内容是否包含```json代码块
      const codeBlockMatch = tagContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        // 嵌套格式：标签内包含代码块
        const jsonStr = codeBlockMatch[1].trim();
        console.log('📋 使用嵌套格式（标签+代码块）提取的JSON字符串:', jsonStr);
        return jsonStr;
      } else {
        // 纯标签格式：直接使用标签内容
        const json = OptionParseService.extractFirstJson(tagContent);
        if (json) return json;
      }
    }

    // 如果没找到标签格式，尝试匹配独立的```json代码块格式
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const jsonStr = codeBlockMatch[1].trim();
      console.log('📋 使用独立代码块格式提取的JSON字符串:', jsonStr);
      return jsonStr;
    }

    // 兜底：直接在文本中寻找首个 JSON 对象
    return OptionParseService.extractFirstJson(text);
  }

  private static extractFirstJson(text: string): string | null {
    const start = text.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }
    return null;
  }
}
