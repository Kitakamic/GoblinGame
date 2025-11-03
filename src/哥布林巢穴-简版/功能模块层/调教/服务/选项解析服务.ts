import type { ParsedOptionsResult } from '../类型/调教类型';

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

    let jsonStr = '';
    let parseMethod = '';

    // ========== 方法1: 尝试匹配 [OPTIONS_JSON] 标签格式 ==========
    const tagMatch = text.match(/\[OPTIONS_JSON\]([\s\S]*?)\[\/OPTIONS_JSON\]/i);
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
        const extractedJson = this.extractFirstJson(tagContent);
        if (extractedJson) {
          jsonStr = extractedJson;
          parseMethod = '纯标签格式';
          console.log('📋 使用纯标签格式提取的JSON字符串:', jsonStr);
        }
      }
    }

    // ========== 方法2: 尝试匹配独立的```json代码块格式 ==========
    if (!jsonStr) {
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
        parseMethod = '独立代码块格式';
        console.log('📋 使用独立代码块格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 方法3: 尝试从大括号开始到结尾的格式（纯JSON） ==========
    if (!jsonStr) {
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0].trim();
        parseMethod = '纯JSON格式（大括号到结尾）';
        console.log('📋 使用纯JSON格式提取的JSON字符串:', jsonStr);
      }
    }

    // ========== 尝试解析JSON并提取options ==========
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr) as {
          options?: Array<{ strategy?: '保守' | '激进' | '平稳' | string; text: string; label?: string }>;
        };
        console.log(`📊 使用${parseMethod}解析的JSON数据:`, parsed);
        console.log('📋 选项数组:', parsed.options);

        if (Array.isArray(parsed.options) && parsed.options.length > 0) {
          const mapped = parsed.options
            .filter(o => o && typeof o.text === 'string')
            .map(o => ({
              text: o.text,
              label: o.label || o.strategy || undefined,
            }))
            .slice(0, 3);
          console.log('🎯 映射后的选项:', mapped);
          if (mapped.length > 0) {
            console.log('✅ 成功解析选项，数量:', mapped.length);
            return { options: mapped };
          }
        }

        console.warn('⚠️ JSON数据中未找到有效的options数组');
        console.log('📋 可用字段:', Object.keys(parsed));
      } catch (jsonError) {
        console.warn(`⚠️ 使用${parseMethod}解析JSON失败:`, jsonError);
      }
    }

    // ========== 方法4: 单独寻找选项格式 ==========
    console.log('🔍 尝试单独寻找选项格式...');
    // 尝试寻找 "options": [...] 格式
    const optionsPattern = /"options"\s*:\s*\[([\s\S]*?)\]/i;
    const optionsMatch = text.match(optionsPattern);
    if (optionsMatch) {
      try {
        // 提取选项数组内容
        const optionsArrayStr = `[${optionsMatch[1]}]`;
        const optionsArray = JSON.parse(optionsArrayStr) as Array<{
          text?: string;
          strategy?: string;
          label?: string;
        }>;

        if (Array.isArray(optionsArray) && optionsArray.length > 0) {
          const mapped = optionsArray
            .filter(o => o && (typeof o.text === 'string' || (o as any).label))
            .map(o => ({
              text: (o.text || (o as any).label || '').toString(),
              label: o.label || o.strategy || undefined,
            }))
            .filter(o => o.text)
            .slice(0, 3);

          if (mapped.length > 0) {
            console.log(`✅ 找到独立的options数组: ${mapped.length}个选项`);
            return { options: mapped };
          }
        }
      } catch (error) {
        console.warn('⚠️ 解析独立options数组失败:', error);
      }
    }

    // ========== 所有方法都失败 ==========
    console.warn('❌ 所有解析方法都失败，未找到有效选项');
    return { options: [] };
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
