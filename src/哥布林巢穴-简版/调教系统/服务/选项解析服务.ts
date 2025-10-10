import type { ParsedOptionsResult } from '../类型定义/调教类型';

/**
 * 选项解析服务：从AI输出中提取“下一步选项”列表
 */
export class OptionParseService {
  /**
   * 从文本中解析下一步选项
   */
  static parseNextStepOptions(text: string): ParsedOptionsResult {
    // 解析 JSON 格式：[OPTIONS_JSON]{ ... }
    try {
      const jsonBlock = OptionParseService.extractJsonBlock(text);
      if (jsonBlock) {
        const parsed = JSON.parse(jsonBlock) as {
          options?: Array<{ strategy: '保守' | '激进' | '平稳'; text: string }>;
        };
        if (Array.isArray(parsed.options) && parsed.options.length > 0) {
          const mapped = parsed.options
            .filter(o => o && typeof o.text === 'string')
            .map(o => ({ text: o.text, label: o.strategy }))
            .slice(0, 3);
          if (mapped.length > 0) return { options: mapped };
        }
      }
    } catch (error) {
      console.warn('JSON 解析失败:', error);
    }

    // 如果 JSON 解析失败，返回空选项
    return { options: [] };
  }

  private static extractJsonBlock(text: string): string | null {
    // 支持 [OPTIONS_JSON] ... [/OPTIONS_JSON] 或仅 [OPTIONS_JSON] 后紧随 JSON
    const tagged = text.match(/\[OPTIONS_JSON\]([\s\S]*?)(?:\[\/OPTIONS_JSON\]|$)/i);
    if (tagged && tagged[1]) {
      const body = tagged[1].trim();
      const json = OptionParseService.extractFirstJson(body);
      if (json) return json;
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
