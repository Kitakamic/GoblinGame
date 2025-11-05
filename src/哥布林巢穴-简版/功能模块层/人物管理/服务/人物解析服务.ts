/**
 * 人物信息解析器
 * 专门负责解析AI输出的人物信息JSON文本，返回原始数据
 */
import { parse as parseYaml } from 'yaml';
import { GenerationErrorService } from '../../../核心层/服务/通用服务/生成错误服务';
import type { BackgroundType, SensitivePart } from '../类型/人物类型';

/** 图片资源信息 */
export interface PictureResource {
  id: string;
  race: string;
  class: string;
  prompt: string;
  imageUrl?: string;
}

// ==================== 解析数据类型定义 ====================

/** 解析后的敏感点信息 */
export interface ParsedSensitivePoint {
  part: SensitivePart;
  isSensitive: boolean;
  description: string;
}

/** 解析后的成长经历 */
export interface ParsedLifeStory {
  childhood: string[];
  adolescence: string[];
  adulthood: string[];
  currentState: string[];
}

/** 解析后的衣着信息 */
export interface ParsedClothing {
  head?: string;
  top?: string;
  bottom?: string;
  socks?: string;
  shoes?: string;
  underwear?: string;
  accessories?: string;
  toys?: string;
}

/** 解析后的外貌数据 */
export interface ParsedAppearance {
  height: number;
  weight: number;
  measurements: string;
  cupSize: string;
  description: string;
  clothing?: ParsedClothing;
  originalClothing?: ParsedClothing;
}

/** 解析后的隐藏特质 */
export interface ParsedHiddenTraits {
  sexExperience: string;
  fears: string;
  secrets: string;
}

/** 解析后的人物数据 */
export interface ParsedCharacterData {
  // 基础信息
  name: string;
  race: string;
  age: number;
  country: string;
  identity: string;
  background: BackgroundType;
  personality: string[];
  canCombat: boolean;
  unitType?: 'physical' | 'magical';

  // 完全自定义模式的属性（可选）
  customAttributes?: {
    attack?: number;
    defense?: number;
    intelligence?: number;
    speed?: number;
    health?: number;
  };
  customStamina?: number;
  customFertility?: number;

  // 外貌数据
  appearance: ParsedAppearance;

  // 敏感点信息
  sensitivePointsDetail: ParsedSensitivePoint[];

  // 成长经历
  lifeStory: ParsedLifeStory;

  // 隐藏特质
  hiddenTraits: ParsedHiddenTraits;

  // 头像信息
  avatar?: string;
}

/** 解析错误信息 */
export interface ParseError {
  field: string; // 字段名称
  message: string; // 错误消息
  category: '基础信息' | '外貌数据' | '隐藏特质' | '成长经历' | '敏感点' | '格式错误'; // 错误分类
  actualValue?: any; // 实际值
  expectedType?: string; // 期望类型
}

/** 错误收集器 */
class ParseErrorCollector {
  private errors: ParseError[] = [];

  /**
   * 添加错误
   */
  addError(error: ParseError): void {
    this.errors.push(error);
    console.error(`❌ [人物解析] 错误: [${error.category}] ${error.field} - ${error.message}`);
  }

  /**
   * 是否有错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * 获取所有错误
   */
  getErrors(): ParseError[] {
    return [...this.errors];
  }

  /**
   * 获取错误摘要
   */
  getSummary(): string {
    if (this.errors.length === 0) return '';

    const categoryCount: Record<string, number> = {};
    for (const error of this.errors) {
      categoryCount[error.category] = (categoryCount[error.category] || 0) + 1;
    }

    const categoryList = Object.entries(categoryCount)
      .map(([category, count]) => `${category}: ${count}个错误`)
      .join('、');

    return `共发现 ${this.errors.length} 个错误（${categoryList}）`;
  }

  /**
   * 格式化错误详情
   */
  formatDetails(): string {
    if (this.errors.length === 0) return '';

    const details: string[] = [];
    const categoryGroups: Record<string, ParseError[]> = {};

    // 按分类分组
    for (const error of this.errors) {
      if (!categoryGroups[error.category]) {
        categoryGroups[error.category] = [];
      }
      categoryGroups[error.category].push(error);
    }

    // 按分类输出
    for (const [category, errors] of Object.entries(categoryGroups)) {
      details.push(`\n【${category}】`);
      for (const error of errors) {
        let errorText = `  • ${error.field}: ${error.message}`;
        if (error.actualValue !== undefined) {
          const valueStr =
            typeof error.actualValue === 'string' ? `"${error.actualValue}"` : JSON.stringify(error.actualValue);
          errorText += `\n    实际值: ${valueStr}`;
        }
        if (error.expectedType) {
          errorText += `\n    期望类型: ${error.expectedType}`;
        }
        details.push(errorText);
      }
    }

    return details.join('\n');
  }

  /**
   * 清空错误
   */
  clear(): void {
    this.errors = [];
  }
}

export class CharacterParser {
  // 错误收集器实例
  private static errorCollector = new ParseErrorCollector();

  /**
   * 显示解析错误弹窗
   */
  private static async showParseErrorDialog(
    error: Error | null,
    rawText?: string,
    onRetry?: (editedText: string) => Promise<void>,
  ): Promise<void> {
    const hasErrors = this.errorCollector.hasErrors();

    let title = '人物信息解析失败';
    let message = '';
    let details = '';

    if (hasErrors) {
      // 使用收集的错误信息
      title = `人物信息解析失败 - ${this.errorCollector.getSummary()}`;
      message = 'AI生成的人物信息存在以下错误，请检查并重新生成：';
      details = this.errorCollector.formatDetails();
    } else if (error) {
      // 使用捕获的异常
      title = '人物信息解析失败';
      message = error.message || '解析过程中发生未知错误';
      details = error.stack || '';
    } else {
      // 默认错误信息
      title = '人物信息解析失败';
      message = '解析过程中发生未知错误';
      details = '请检查AI输出格式是否正确';
    }

    // 显示错误弹窗
    await GenerationErrorService.showError({
      title,
      message,
      summary: hasErrors ? this.errorCollector.getSummary() : undefined,
      details,
      rawText,
      onRetry,
    });
  }

  // ==================== 辅助方法 ====================

  /**
   * 健壮地读取字段值，支持多种位置和键名变体
   * 用于处理可能的字符编码或键名匹配问题
   * @param data 数据对象
   * @param fieldName 字段名称（如"恐惧"、"性经历"、"秘密"）
   * @param parentKey 父级键名（如"隐藏特质"），如果提供则优先从此处读取
   * @returns 字段值，如果不存在返回 undefined
   */
  private static robustGetField(
    data: any,
    fieldName: string,
    parentKey?: string,
  ): { value: any; source: string; allKeys?: string[] } {
    // 如果提供了父级键，先尝试从父级对象读取
    if (parentKey && data[parentKey] && typeof data[parentKey] === 'object') {
      const parentObj = data[parentKey];
      const parentKeys = Object.keys(parentObj);

      // 直接匹配
      if (fieldName in parentObj) {
        return { value: parentObj[fieldName], source: `${parentKey}.${fieldName}`, allKeys: parentKeys };
      }

      // 遍历所有键，尝试找到相似的键（处理可能的编码问题）
      for (const key of parentKeys) {
        if (key === fieldName || key.trim() === fieldName.trim()) {
          console.warn(`⚠️ [人物解析] 字段 "${fieldName}" 在 "${parentKey}" 中找到相似键: "${key}"`);
          return { value: parentObj[key], source: `${parentKey}.${key}`, allKeys: parentKeys };
        }
      }

      // 输出所有可用的键以便调试
      console.warn(`⚠️ [人物解析] 在 "${parentKey}" 中未找到字段 "${fieldName}"，可用键:`, parentKeys);
    }

    // 尝试从顶级字段读取
    const topLevelKeys = Object.keys(data);
    if (fieldName in data) {
      return { value: data[fieldName], source: `顶级.${fieldName}`, allKeys: topLevelKeys };
    }

    // 遍历顶级键，尝试找到相似的键
    for (const key of topLevelKeys) {
      if (key === fieldName || key.trim() === fieldName.trim()) {
        console.warn(`⚠️ [人物解析] 字段 "${fieldName}" 在顶级找到相似键: "${key}"`);
        return { value: data[key], source: `顶级.${key}`, allKeys: topLevelKeys };
      }
    }

    // 如果都找不到，输出调试信息
    if (parentKey) {
      console.warn(`⚠️ [人物解析] 字段 "${fieldName}" 在 "${parentKey}" 和顶级都未找到`);
      if (data[parentKey]) {
        console.warn(`⚠️ [人物解析] "${parentKey}" 对象的所有键:`, Object.keys(data[parentKey]));
      }
    }
    console.warn(`⚠️ [人物解析] 顶级对象的所有键:`, topLevelKeys);

    return {
      value: undefined,
      source: '未找到',
      allKeys: parentKey && data[parentKey] ? Object.keys(data[parentKey]) : topLevelKeys,
    };
  }

  /**
   * 读取恐惧/害怕字段（优先恐惧，如果没有再读取害怕）
   * 支持从父级对象和顶级字段读取，优先使用"恐惧"，如果没有再使用"害怕"
   * @param data 数据对象
   * @param parentKey 父级键名（如"隐藏特质"），如果提供则优先从此处读取
   * @returns 字段值和来源
   */
  private static getFearsField(data: any, parentKey?: string): { value: any; source: string; allKeys?: string[] } {
    // 优先尝试读取"恐惧"字段（支持父级对象和顶级字段）
    const fearsField = this.robustGetField(data, '恐惧', parentKey);
    if (fearsField.value !== undefined && fearsField.value !== null && fearsField.value !== '') {
      return fearsField;
    }

    // 如果"恐惧"字段不存在或为空，尝试读取"害怕"字段（支持父级对象和顶级字段）
    const fearField = this.robustGetField(data, '害怕', parentKey);
    if (fearField.value !== undefined && fearField.value !== null && fearField.value !== '') {
      console.log('ℹ️ [人物解析] "恐惧"字段不存在，使用"害怕"字段作为替代');
      return fearField;
    }

    // 如果两个字段都不存在，返回undefined
    return {
      value: undefined,
      source: '未找到（恐惧和害怕都未找到）',
      allKeys: fearsField.allKeys || fearField.allKeys,
    };
  }

  // ==================== 主要解析方法 ====================

  /**
   * 解析AI输出的人物信息JSON
   * @param text AI输出的人物信息JSON文本
   * @param pictureResource 据点的图片资源信息（可选）
   * @param rawText 原始AI输出文本（用于调试，可选）
   * @param onRetry 重新解析回调函数（可选）
   * @returns 解析后的原始数据对象
   */
  static async parseCharacterJson(
    text: string,
    pictureResource?: PictureResource,
    rawText?: string,
    onRetry?: (editedText: string) => Promise<void>,
    isFullCustom: boolean = false,
  ): Promise<ParsedCharacterData | null> {
    // 清空错误收集器
    this.errorCollector.clear();

    try {
      console.log('🔍 [人物解析] 开始解析AI输出的人物信息...');
      console.log('📝 [人物解析] 原始AI输出长度:', text.length);

      // 清理文本，移除多余的空白字符
      const cleanText = text.trim();
      console.log('🧹 [人物解析] 清理后文本长度:', cleanText.length);

      // 尝试提取JSON部分
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [人物解析] 未找到有效的JSON格式');
        this.errorCollector.addError({
          field: 'JSON格式',
          message: '未找到有效的JSON格式',
          category: '格式错误',
        });
        await this.showParseErrorDialog(null, rawText || text, onRetry);
        return null;
      }

      const jsonText = jsonMatch[0];
      console.log('📄 [人物解析] 提取的JSON长度:', jsonText.length);

      const data = JSON.parse(jsonText);
      console.log('✅ [人物解析] JSON解析成功');
      console.log('🔍 [人物解析] 完整JSON结构检查:', {
        所有键: Object.keys(data),
        衣着字段: data.衣着,
        衣着字段类型: typeof data.衣着,
        衣着字段存在: '衣着' in data,
      });
      console.log('📊 [人物解析] 解析后的数据结构:', {
        基础信息: data.基础信息 ? '存在' : '缺失',
        外貌数据: data.外貌数据 ? '存在' : '缺失',
        成长经历: data.成长经历 ? '存在' : '缺失',
        隐藏特质: data.隐藏特质 ? '存在' : '缺失',
        敏感点: data.敏感点 ? '存在' : '缺失',
        衣着: data.衣着 ? '存在' : '缺失',
      });

      // 验证必要字段
      if (!data.基础信息 || !data.基础信息.姓名) {
        console.error('❌ [人物解析] JSON格式缺少必要字段');
        this.errorCollector.addError({
          field: '基础信息',
          message: '缺少必要字段：基础信息.姓名',
          category: '格式错误',
        });
        throw new Error('JSON格式缺少必要字段');
      }

      console.log('✅ [人物解析] 基础信息验证通过');
      console.log('👤 [人物解析] 人物姓名:', data.基础信息.姓名);

      // 提前检查隐藏特质数据
      console.log('🔍 [人物解析] 提前检查隐藏特质数据（JSON）...');

      // 使用健壮的字段读取方法
      const sexExperienceField = this.robustGetField(data, '性经历', '隐藏特质');
      const fearsField = this.getFearsField(data, '隐藏特质'); // 优先恐惧，其次害怕
      const secretsField = this.robustGetField(data, '秘密', '隐藏特质');

      console.log('📊 [人物解析] 隐藏特质原始数据:', {
        隐藏特质存在: !!data.隐藏特质,
        隐藏特质类型: typeof data.隐藏特质,
        隐藏特质内容: JSON.stringify(data.隐藏特质, null, 2),
        隐藏特质所有键: data.隐藏特质 ? Object.keys(data.隐藏特质) : [],
        性经历_值: sexExperienceField.value,
        性经历_来源: sexExperienceField.source,
        性经历_隐藏特质可用键: sexExperienceField.allKeys,
        恐惧_值: fearsField.value,
        恐惧_来源: fearsField.source,
        恐惧_隐藏特质可用键: fearsField.allKeys,
        秘密_值: secretsField.value,
        秘密_来源: secretsField.source,
        秘密_隐藏特质可用键: secretsField.allKeys,
      });

      // 处理图片资源信息
      if (pictureResource?.imageUrl) {
        console.log('🖼️ [人物解析] 据点图片资源信息:', {
          id: pictureResource.id,
          race: pictureResource.race,
          class: pictureResource.class,
          imageUrl: pictureResource.imageUrl,
        });
      } else {
        console.log('⚠️ [人物解析] 未提供据点图片资源信息');
      }

      // 解析敏感点信息
      console.log('🔍 [人物解析] 开始解析敏感点信息...');
      const sensitivePointsDetail: ParsedSensitivePoint[] = [];
      const parts: SensitivePart[] = ['嘴巴', '胸部', '乳头', '阴道', '子宫', '后庭', '阴蒂', 'G点'];

      // 获取敏感部位和描述（新简化格式）
      let sensitivePart: string | undefined = undefined;
      let sensitiveDescription = '';

      if (typeof data.敏感点 === 'string') {
        sensitivePart = data.敏感点;
        console.log('🎯 [人物解析] 敏感部位:', sensitivePart);
      }

      // 尝试读取"描述"字段
      if (typeof data.描述 === 'string') {
        sensitiveDescription = data.描述;
        console.log('📝 [人物解析] 敏感部位描述:', sensitiveDescription.substring(0, 50) + '...');
      }

      // 为所有部位创建信息（但只有一个是敏感的）
      for (const part of parts) {
        const isSensitive = sensitivePart === part;

        sensitivePointsDetail.push({
          part,
          isSensitive,
          description: isSensitive && sensitiveDescription ? sensitiveDescription : `${part}部位`,
        });

        console.log(`🎯 [人物解析] ${part}部位: ${isSensitive ? '敏感' : '不敏感'}`);
      }

      const sensitiveCount = sensitivePointsDetail.filter(p => p.isSensitive).length;
      console.log(`📊 [人物解析] 敏感点解析完成，敏感部位数量: ${sensitiveCount}`);

      // 解析成长经历
      console.log('📚 [人物解析] 开始解析成长经历...');
      const lifeStory: ParsedLifeStory = {
        childhood: data.成长经历?.童年 ? [data.成长经历.童年] : [],
        adolescence: data.成长经历?.青年 ? [data.成长经历.青年] : [],
        adulthood: data.成长经历?.成年 ? [data.成长经历.成年] : [],
        currentState: data.成长经历?.当前 ? [data.成长经历.当前] : [],
      };

      console.log('📊 [人物解析] 成长经历解析完成:', {
        童年: lifeStory.childhood.length > 0 ? '存在' : '缺失',
        青年: lifeStory.adolescence.length > 0 ? '存在' : '缺失',
        成年: lifeStory.adulthood.length > 0 ? '存在' : '缺失',
        当前: lifeStory.currentState.length > 0 ? '存在' : '缺失',
      });

      // 解析衣着信息
      console.log('👗 [人物解析] 开始解析衣着信息...');
      console.log('🔍 [人物解析] 检查衣着数据:', {
        顶级衣着存在: !!data.衣着,
        外貌数据衣着存在: !!(data.外貌数据 && data.外貌数据.衣着),
        外貌数据衣着类型: data.外貌数据 ? typeof data.外貌数据.衣着 : 'undefined',
        外貌数据衣着内容: data.外貌数据 ? data.外貌数据.衣着 : 'undefined',
      });
      const clothing: ParsedClothing = {};

      // 衣着信息可能在外貌数据内部
      const clothingData = data.衣着 || (data.外貌数据 && data.外貌数据.衣着);
      if (clothingData) {
        console.log('✅ [人物解析] 衣着数据存在，开始解析...');

        // 解析各个衣着部位
        if (clothingData.头部) {
          clothing.head = clothingData.头部;
          console.log('👑 [人物解析] 头部装饰:', clothing.head);
        }
        if (clothingData.上装) {
          clothing.top = clothingData.上装;
          console.log('👕 [人物解析] 上装:', clothing.top);
        }
        if (clothingData.下装) {
          clothing.bottom = clothingData.下装;
          console.log('👖 [人物解析] 下装:', clothing.bottom);
        }
        if (clothingData.袜子) {
          clothing.socks = clothingData.袜子;
          console.log('🧦 [人物解析] 袜子:', clothing.socks);
        }
        if (clothingData.鞋子) {
          clothing.shoes = clothingData.鞋子;
          console.log('👠 [人物解析] 鞋子:', clothing.shoes);
        }
        if (clothingData.内衣) {
          clothing.underwear = clothingData.内衣;
          console.log('🩱 [人物解析] 内衣:', clothing.underwear);
        }
        if (clothingData.装饰品) {
          clothing.accessories = clothingData.装饰品;
          console.log('💎 [人物解析] 装饰品:', clothing.accessories);
        }
        if (clothingData.玩具) {
          clothing.toys = clothingData.玩具;
          console.log('🎀 [人物解析] 玩具:', clothing.toys);
        }

        const clothingCount = Object.keys(clothing).length;
        console.log(`📊 [人物解析] 衣着解析完成，衣着部位数量: ${clothingCount}`);
      } else {
        console.log('⚠️ [人物解析] 衣着数据缺失，使用默认值');
      }

      // 保存原始服装信息（深拷贝）
      const originalClothing = JSON.parse(JSON.stringify(clothing));

      // 构建解析后的原始数据对象
      console.log('🏗️ [人物解析] 开始构建解析后的数据对象...');
      console.log('🔍 [人物解析] 开始严格验证基础信息...');

      // 完全自定义模式：解析战斗属性、体力、生育力
      let customAttributes: ParsedCharacterData['customAttributes'] | undefined;
      let customStamina: number | undefined;
      let customFertility: number | undefined;
      let canCombat: boolean;

      if (isFullCustom) {
        console.log('🎨 [人物解析] 完全自定义模式：解析AI生成的属性');

        // 默认可战斗为true
        canCombat = true;

        // 解析战斗属性
        if (data.基础信息?.战斗属性) {
          const attr = data.基础信息.战斗属性;
          customAttributes = {
            attack: typeof attr.攻击 === 'number' ? attr.攻击 : undefined,
            defense: typeof attr.防御 === 'number' ? attr.防御 : undefined,
            intelligence: typeof attr.智力 === 'number' ? attr.智力 : undefined,
            speed: typeof attr.速度 === 'number' ? attr.速度 : undefined,
            health: typeof attr.生命 === 'number' ? attr.生命 : undefined,
          };
          console.log('📊 [人物解析] 完全自定义模式 - 解析的战斗属性:', customAttributes);
        }

        // 解析体力
        if (typeof data.基础信息?.体力 === 'number') {
          customStamina = data.基础信息.体力;
          console.log('💪 [人物解析] 完全自定义模式 - 解析的体力:', customStamina);
        }

        // 解析生育力
        if (typeof data.基础信息?.生育力 === 'number') {
          customFertility = data.基础信息.生育力;
          console.log('🌱 [人物解析] 完全自定义模式 - 解析的生育力:', customFertility);
        }
      } else {
        // 普通模式：使用原有逻辑
        canCombat = this.validateCanCombat(data.基础信息.可战斗, '基础信息');
      }

      const parsedData: ParsedCharacterData = {
        // 基础信息（严格验证，不允许保底）
        name: this.validateRequiredString(data.基础信息.姓名, '姓名', '基础信息'),
        race: this.validateRequiredString(data.基础信息.种族, '种族', '基础信息'),
        age: this.validateRequiredNumber(data.基础信息.年龄, '年龄', '基础信息'),
        country: this.validateRequiredString(data.基础信息.国家, '国家', '基础信息'),
        identity: this.validateRequiredString(data.基础信息.身份, '身份', '基础信息'),
        background: this.validateBackground(data.基础信息.出身, '基础信息'),
        personality: this.validatePersonality(data.基础信息.性格, '基础信息'),
        canCombat,
        unitType: this.validateUnitType(data.基础信息.单位类型),

        // 完全自定义模式的属性（可选）
        customAttributes,
        customStamina,
        customFertility,

        // 外貌数据（严格验证）
        appearance: {
          height: this.validateRequiredNumber(data.外貌数据?.身高, '身高', '外貌数据'),
          weight: this.validateRequiredNumber(data.外貌数据?.体重, '体重', '外貌数据'),
          measurements: this.validateRequiredString(data.外貌数据?.三围, '三围', '外貌数据'),
          cupSize: this.validateCupSize(data.外貌数据?.罩杯, '外貌数据'),
          description: this.validateRequiredString(data.外貌数据?.描述, '外貌描述', '外貌数据'),
          clothing: Object.keys(clothing).length > 0 ? clothing : undefined,
          originalClothing: Object.keys(originalClothing).length > 0 ? originalClothing : undefined,
        },

        // 敏感点信息
        sensitivePointsDetail,

        // 成长经历
        lifeStory,

        // 隐藏特质（性经历必须，恐惧和秘密改为可选）
        // 兼容AI可能将"性经历"、"恐惧"和"秘密"放在顶级字段的情况
        // 使用健壮的字段读取方法，处理可能的字符编码或键名匹配问题
        hiddenTraits: {
          sexExperience: this.validateRequiredString(
            this.robustGetField(data, '性经历', '隐藏特质').value,
            '性经历',
            '隐藏特质',
          ),
          fears: this.validateOptionalString(
            this.getFearsField(data, '隐藏特质').value, // 优先恐惧，其次害怕
            '恐惧',
            '隐藏特质',
            '未知',
          ),
          secrets: this.validateOptionalString(
            this.robustGetField(data, '秘密', '隐藏特质').value,
            '秘密',
            '隐藏特质',
            '未知',
          ),
        },

        // 头像信息（来自据点图片资源）
        avatar: pictureResource?.imageUrl,
      };

      console.log('✅ [人物解析] 所有字段验证通过');
      console.log('🎉 [人物解析] 人物数据解析成功:', {
        姓名: parsedData.name,
        种族: parsedData.race,
        年龄: parsedData.age,
        国家: parsedData.country,
        身份: parsedData.identity,
        出身: parsedData.background,
        性格数量: parsedData.personality.length,
        身高: parsedData.appearance.height,
        体重: parsedData.appearance.weight,
        罩杯: parsedData.appearance.cupSize,
        衣着数量: parsedData.appearance.clothing ? Object.keys(parsedData.appearance.clothing).length : 0,
        头像URL: parsedData.avatar || '未设置',
      });
      console.log('📤 [人物解析] 返回解析后的数据对象');
      return parsedData;
    } catch (error) {
      console.error('解析人物信息失败:', error);
      // 显示错误弹窗
      await this.showParseErrorDialog(
        error instanceof Error ? error : new Error(String(error)),
        rawText || text,
        onRetry,
      );
      return null;
    }
  }

  // ==================== 验证方法 ====================

  /**
   * 验证解析后的人物数据
   * @param parsedData 解析后的人物数据
   * @returns 验证结果
   */
  static validateParsedData(parsedData: ParsedCharacterData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证必要字段
    if (!parsedData.name || parsedData.name.trim() === '') {
      errors.push('姓名为空');
    }

    if (!parsedData.race || parsedData.race.trim() === '') {
      errors.push('种族为空');
    }

    if (parsedData.age < 1 || parsedData.age > 100) {
      errors.push('年龄不在有效范围内');
    }

    // 验证敏感点数据
    if (parsedData.sensitivePointsDetail) {
      const sensitiveCount = parsedData.sensitivePointsDetail.filter(p => p.isSensitive).length;
      if (sensitiveCount > 1) {
        errors.push('敏感点数量超过限制（只能有1个）');
      }
    }

    // 验证外貌数据
    if (parsedData.appearance) {
      if (parsedData.appearance.height < 100 || parsedData.appearance.height > 250) {
        errors.push('身高不在有效范围内');
      }
      if (parsedData.appearance.weight < 30 || parsedData.appearance.weight > 150) {
        errors.push('体重不在有效范围内');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 严格验证出身等级（必须由AI明确输出）
   * @param background 出身等级
   * @param category 错误分类
   * @returns 验证后的出身等级
   * @throws Error 如果出身等级缺失或无效
   */
  private static validateBackground(background: any, category: string = '基础信息'): BackgroundType {
    if (!background || typeof background !== 'string') {
      const error: ParseError = {
        field: '出身',
        message: '字段缺失，AI必须明确指定：平民/贵族/王族',
        category: category as any,
        actualValue: background,
        expectedType: 'string (平民/贵族/王族)',
      };
      this.errorCollector.addError(error);
      throw new Error('出身等级字段缺失，AI必须明确指定：平民/贵族/王族');
    }

    const validBackgrounds: BackgroundType[] = ['平民', '贵族', '王族'];
    if (!validBackgrounds.includes(background as BackgroundType)) {
      const error: ParseError = {
        field: '出身',
        message: `无效值，必须是：平民/贵族/王族`,
        category: category as any,
        actualValue: background,
        expectedType: '平民/贵族/王族',
      };
      this.errorCollector.addError(error);
      throw new Error(`出身等级无效：${background}，必须是：平民/贵族/王族`);
    }

    return background as BackgroundType;
  }

  /**
   * 验证必需的字符串字段
   * @param value 字段值
   * @param fieldName 字段名称
   * @param category 错误分类
   * @returns 验证后的字符串
   * @throws Error 如果字段缺失或无效
   */
  private static validateRequiredString(value: any, fieldName: string, category: string = '基础信息'): string {
    // 添加详细的调试信息
    console.log(`🔍 [人物解析] 验证字段 "${fieldName}":`, {
      值: value,
      类型: typeof value,
      是否为null: value === null,
      是否为undefined: value === undefined,
      是否为空字符串: value === '',
      是否为假值: !value,
      去除空白后: typeof value === 'string' ? `"${value.trim()}"` : 'N/A',
      去除空白后长度: typeof value === 'string' ? value.trim().length : 'N/A',
    });

    // 检查是否为 null 或 undefined
    if (value === null || value === undefined) {
      const error: ParseError = {
        field: fieldName,
        message: `字段缺失（值为 ${value}），AI必须提供有效的${fieldName}`,
        category: category as any,
        actualValue: value,
        expectedType: 'string',
      };
      this.errorCollector.addError(error);
      throw new Error(`${fieldName}字段缺失（值为 ${value}），AI必须提供有效的${fieldName}`);
    }

    // 检查是否为字符串类型
    if (typeof value !== 'string') {
      const error: ParseError = {
        field: fieldName,
        message: `字段类型错误（期望字符串，实际为 ${typeof value}）`,
        category: category as any,
        actualValue: value,
        expectedType: 'string',
      };
      this.errorCollector.addError(error);
      throw new Error(
        `${fieldName}字段类型错误（期望字符串，实际为 ${typeof value}），AI必须提供有效的字符串类型的${fieldName}`,
      );
    }

    // 检查去除空白后是否为空
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      const error: ParseError = {
        field: fieldName,
        message: `字段为空（原始值: "${value}"），AI必须提供有效的非空${fieldName}`,
        category: category as any,
        actualValue: value,
        expectedType: 'string (非空)',
      };
      this.errorCollector.addError(error);
      throw new Error(`${fieldName}字段为空（原始值: "${value}"），AI必须提供有效的非空${fieldName}`);
    }

    console.log(`✅ [人物解析] 字段 "${fieldName}" 验证通过，值: "${trimmedValue}"`);
    return trimmedValue;
  }

  /**
   * 验证可选的字符串字段（宽松验证，自动类型转换）
   * 如果缺失则使用默认值，不抛出错误
   * 不强制要求字符串类型，任何类型都会自动转换为字符串
   * @param value 字段值（可以是任何类型）
   * @param fieldName 字段名称
   * @param category 错误分类
   * @param defaultValue 默认值（如果字段缺失）
   * @returns 验证后的字符串
   */
  private static validateOptionalString(
    value: any,
    fieldName: string,
    _category: string = '基础信息',
    defaultValue: string = '',
  ): string {
    // 添加详细的调试信息
    console.log(`🔍 [人物解析] 验证可选字段 "${fieldName}":`, {
      值: value,
      类型: typeof value,
      是否为null: value === null,
      是否为undefined: value === undefined,
      是否为空字符串: value === '',
      是否为假值: !value,
    });

    // 如果值为 null 或 undefined，使用默认值（不报错）
    if (value === null || value === undefined) {
      console.warn(`⚠️ [人物解析] 可选字段 "${fieldName}" 缺失（null/undefined），使用默认值: "${defaultValue}"`);
      return defaultValue;
    }

    // 直接将任何类型的值转换为字符串（不检查类型）
    // 这样可以处理 number、boolean 等各种类型
    const stringValue = String(value);
    const trimmedValue = stringValue.trim();

    // 检查去除空白后是否为空
    if (trimmedValue === '' || trimmedValue === 'undefined' || trimmedValue === 'null') {
      // 如果为空字符串或特殊值，使用默认值（不报错）
      console.warn(
        `⚠️ [人物解析] 可选字段 "${fieldName}" 转换为字符串后为空（原始值: ${JSON.stringify(value)}，类型: ${typeof value}），使用默认值: "${defaultValue}"`,
      );
      return defaultValue;
    }

    // 如果原始类型不是字符串，记录转换信息（但继续使用转换后的值）
    if (typeof value !== 'string') {
      console.log(
        `ℹ️ [人物解析] 可选字段 "${fieldName}" 类型为 ${typeof value}，已自动转换为字符串: "${trimmedValue}"`,
      );
    }

    console.log(`✅ [人物解析] 可选字段 "${fieldName}" 验证通过，值: "${trimmedValue}"`);
    return trimmedValue;
  }

  /**
   * 验证必需的数字字段
   * @param value 字段值
   * @param fieldName 字段名称
   * @param category 错误分类
   * @returns 验证后的数字
   * @throws Error 如果字段缺失或无效
   */
  private static validateRequiredNumber(value: any, fieldName: string, category: string = '基础信息'): number {
    // 添加详细的调试信息
    console.log(`🔍 [人物解析] 验证数字字段 "${fieldName}":`, {
      值: value,
      类型: typeof value,
      是否为null: value === null,
      是否为undefined: value === undefined,
    });

    // 检查是否为 null 或 undefined
    if (value === undefined || value === null) {
      const error: ParseError = {
        field: fieldName,
        message: '字段缺失或无效，AI必须提供有效的数字',
        category: category as any,
        actualValue: value,
        expectedType: 'number',
      };
      this.errorCollector.addError(error);
      throw new Error(`${fieldName}字段缺失或无效，AI必须提供有效的数字`);
    }

    // 如果已经是数字类型，直接验证并返回
    if (typeof value === 'number') {
      if (isNaN(value)) {
        const error: ParseError = {
          field: fieldName,
          message: '字段值为NaN，AI必须提供有效的数字',
          category: category as any,
          actualValue: value,
          expectedType: 'number',
        };
        this.errorCollector.addError(error);
        throw new Error(`${fieldName}字段值为NaN，AI必须提供有效的数字`);
      }
      console.log(`✅ [人物解析] 字段 "${fieldName}" 验证通过，值: ${value}`);
      return value;
    }

    // 如果是字符串类型，尝试转换为数字（兼容YAML解析器可能将数字解析为字符串的情况）
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      // 尝试转换为数字
      const numValue = Number(trimmedValue);
      if (!isNaN(numValue) && isFinite(numValue)) {
        console.log(`✅ [人物解析] 字段 "${fieldName}" 从字符串 "${trimmedValue}" 转换为数字: ${numValue}`);
        return numValue;
      } else {
        const error: ParseError = {
          field: fieldName,
          message: `字段类型错误（期望数字，实际为字符串 "${trimmedValue}"），无法转换为有效数字`,
          category: category as any,
          actualValue: value,
          expectedType: 'number',
        };
        this.errorCollector.addError(error);
        throw new Error(`${fieldName}字段类型错误（期望数字，实际为字符串 "${trimmedValue}"），无法转换为有效数字`);
      }
    }

    // 其他类型都不接受
    const error: ParseError = {
      field: fieldName,
      message: `字段类型错误（期望数字，实际为 ${typeof value}）`,
      category: category as any,
      actualValue: value,
      expectedType: 'number',
    };
    this.errorCollector.addError(error);
    throw new Error(`${fieldName}字段类型错误（期望数字，实际为 ${typeof value}），AI必须提供有效的数字`);
  }

  /**
   * 验证性格数组
   * @param personality 性格数组
   * @param category 错误分类
   * @returns 验证后的性格数组
   * @throws Error 如果性格字段无效
   */
  private static validatePersonality(personality: any, category: string = '基础信息'): string[] {
    if (!Array.isArray(personality)) {
      const error: ParseError = {
        field: '性格',
        message: '字段必须是数组格式',
        category: category as any,
        actualValue: personality,
        expectedType: 'array<string>',
      };
      this.errorCollector.addError(error);
      throw new Error('性格字段必须是数组格式');
    }
    return personality.filter(item => typeof item === 'string' && item.trim() !== '');
  }

  /**
   * 验证罩杯大小
   * @param cupSize 罩杯大小
   * @param category 错误分类
   * @returns 验证后的罩杯大小
   * @throws Error 如果罩杯大小无效
   */
  private static validateCupSize(cupSize: any, category: string = '外貌数据'): string {
    if (!cupSize || typeof cupSize !== 'string') {
      const error: ParseError = {
        field: '罩杯',
        message: '字段缺失或无效，AI必须提供有效的罩杯大小',
        category: category as any,
        actualValue: cupSize,
        expectedType: 'string (A/B/C/D/E/F/G)',
      };
      this.errorCollector.addError(error);
      throw new Error('罩杯字段缺失或无效，AI必须提供有效的罩杯大小');
    }

    const validCupSizes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const upperCupSize = cupSize.toUpperCase();
    if (!validCupSizes.includes(upperCupSize)) {
      const error: ParseError = {
        field: '罩杯',
        message: `无效值，必须是：A/B/C/D/E/F/G`,
        category: category as any,
        actualValue: cupSize,
        expectedType: 'A/B/C/D/E/F/G',
      };
      this.errorCollector.addError(error);
      throw new Error(`罩杯大小无效：${cupSize}，必须是：A/B/C/D/E/F/G`);
    }

    return upperCupSize;
  }

  /**
   * 验证可战斗属性
   * @param canCombat 可战斗属性
   * @param category 错误分类
   * @returns 验证后的可战斗属性
   * @throws Error 如果可战斗属性无效
   */
  private static validateCanCombat(canCombat: any, category: string = '基础信息'): boolean {
    if (canCombat === undefined || canCombat === null) {
      const error: ParseError = {
        field: '可战斗',
        message: '字段缺失，AI必须明确指定：true/false',
        category: category as any,
        actualValue: canCombat,
        expectedType: 'boolean',
      };
      this.errorCollector.addError(error);
      throw new Error('可战斗字段缺失，AI必须明确指定：true/false');
    }

    if (typeof canCombat !== 'boolean') {
      const error: ParseError = {
        field: '可战斗',
        message: `字段无效，必须是：true/false`,
        category: category as any,
        actualValue: canCombat,
        expectedType: 'boolean',
      };
      this.errorCollector.addError(error);
      throw new Error(`可战斗字段无效：${canCombat}，必须是：true/false`);
    }

    return canCombat;
  }

  /**
   * 验证单位类型
   * @param unitType 单位类型
   * @returns 验证后的单位类型
   * @throws Error 如果单位类型无效
   */
  private static validateUnitType(unitType: any): 'physical' | 'magical' {
    if (unitType === undefined || unitType === null) {
      // 如果AI没有提供单位类型，默认为physical
      console.log('⚠️ [人物解析] 单位类型字段缺失，默认为physical');
      return 'physical';
    }

    if (typeof unitType !== 'string') {
      throw new Error(`单位类型字段无效：${unitType}，必须是：physical/magical`);
    }

    const validTypes = ['physical', 'magical'];
    if (!validTypes.includes(unitType)) {
      throw new Error(`单位类型字段无效：${unitType}，必须是：physical/magical`);
    }

    console.log(`✅ [人物解析] 单位类型验证通过: ${unitType}`);
    return unitType as 'physical' | 'magical';
  }

  /**
   * 修复YAML字符串值中的引号问题
   * 处理双引号字符串内部的中文引号和未转义的英文双引号
   * @param yamlText 原始YAML文本
   * @returns 修复后的YAML文本
   */
  private static fixYamlQuotes(yamlText: string): string {
    // 处理YAML字符串值中的引号嵌套问题
    // 问题：YAML中如果用双引号包裹字符串，内部的任何引号（包括英文双引号"和中文引号""）都必须转义
    // 例如：key: "value with "quotes"" 会解析失败，需要改为 key: "value with \"quotes\""
    // 解决方案：将字符串值内部的所有未转义引号都转义为 \"

    // 按行处理，找到所有包含双引号字符串值的行
    const lines = yamlText.split('\n');
    const fixedLines = lines.map(line => {
      // 匹配格式：  key: "value" 或 key: "value with "quotes""
      // 使用贪婪匹配：找到冒号后的双引号开始，到行尾最后一个双引号结束
      const stringValueMatch = line.match(/^(\s+\S+:\s*")(.*)"(\s*)$/);

      if (stringValueMatch) {
        const prefix = stringValueMatch[1]; // key: "
        let content = stringValueMatch[2]; // 字符串内容（不包含最后的引号）
        const suffix = stringValueMatch[3]; // 结尾的空白字符

        // 处理内容中的引号：转义所有未转义的引号（包括英文双引号和中文引号）
        // 需要转义：英文双引号 " 和中文引号 " "
        // 但已经转义的 \" 不应该再转义

        // 方法：从右到左处理，将未转义的双引号转义
        // 但由于JavaScript的限制，我们用更简单的方法：
        // 1. 先转义中文引号（因为它们是不同的字符，不会和转义序列冲突）
        content = content.replace(/“/g, '\\"'); // 中文左引号 "
        content = content.replace(/”/g, '\\"'); // 中文右引号 "

        // 2. 然后转义未转义的英文双引号
        // 使用负向后顾断言来避免转义已经转义的引号
        // 但由于JS不支持负向后顾，我们采用其他方法：
        // 将 \" 临时替换为占位符，然后替换所有 "，最后还原占位符
        content = content.replace(/\\"/g, '__ESCAPED_QUOTE__');
        content = content.replace(/"/g, '\\"'); // 转义所有未转义的英文双引号
        content = content.replace(/__ESCAPED_QUOTE__/g, '\\"'); // 还原已转义的引号

        // 重建行：prefix + 处理后的content + 结束引号 + suffix
        return prefix + content + '"' + suffix;
      }

      return line;
    });

    return fixedLines.join('\n');
  }

  /**
   * 解析AI输出的人物信息YAML
   * @param text AI输出的人物信息YAML文本
   * @param pictureResource 据点的图片资源信息（可选）
   * @param rawText 原始AI输出文本（用于调试，可选）
   * @param onRetry 重新解析回调函数（可选）
   * @returns 解析后的原始数据对象
   */
  static async parseCharacterYaml(
    text: string,
    pictureResource?: PictureResource,
    rawText?: string,
    onRetry?: (editedText: string) => Promise<void>,
    isFullCustom: boolean = false,
  ): Promise<ParsedCharacterData | null> {
    // 清空错误收集器
    this.errorCollector.clear();

    try {
      console.log('🔍 [人物解析] 开始解析AI输出的人物信息（YAML格式）...');
      console.log('📝 [人物解析] 原始AI输出长度:', text.length);

      // 清理文本，移除多余的空白字符
      const cleanText = text.trim();
      console.log('🧹 [人物解析] 清理后文本长度:', cleanText.length);

      // 尝试提取YAML部分（去掉<herorules>标签等）
      let yamlText = cleanText;

      // 先尝试提取markdown代码块中的内容
      const yamlCodeBlockMatch = yamlText.match(/```yaml\s*([\s\S]*?)\s*```/i);
      if (yamlCodeBlockMatch) {
        yamlText = yamlCodeBlockMatch[1];
        console.log('✅ [人物解析] 从YAML代码块中提取内容');
      } else {
        // 尝试其他类型的代码块
        const codeBlockMatch = yamlText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          yamlText = codeBlockMatch[1];
          console.log('✅ [人物解析] 从代码块中提取内容');
        }
      }

      // 移除 XML 标签
      yamlText = yamlText.replace(/<herorules>[\s\S]*?<\/herorules>/gi, '');

      yamlText = yamlText.trim();

      if (!yamlText) {
        console.error('❌ [人物解析] 未找到有效的YAML格式内容');
        this.errorCollector.addError({
          field: 'YAML格式',
          message: '未找到有效的YAML格式内容',
          category: '格式错误',
        });
        await this.showParseErrorDialog(null, rawText || text, onRetry);
        return null;
      }

      console.log('📄 [人物解析] 提取的YAML长度:', yamlText.length);

      // 修复YAML字符串值中的引号问题
      // 处理双引号字符串内部的中文引号和未转义的英文双引号
      yamlText = this.fixYamlQuotes(yamlText);

      // 解析YAML
      const data = parseYaml(yamlText);
      console.log('✅ [人物解析] YAML解析成功');
      console.log('📊 [人物解析] 解析后的数据结构:', {
        基础信息: data.基础信息 ? '存在' : '缺失',
        外貌数据: data.外貌数据 ? '存在' : '缺失',
        成长经历: data.成长经历 ? '存在' : '缺失',
        隐藏特质: data.隐藏特质 ? '存在' : '缺失',
        敏感点: data.敏感点 ? '存在' : '缺失',
      });

      // 验证必要字段
      if (!data.基础信息 || !data.基础信息.姓名) {
        console.error('❌ [人物解析] YAML格式缺少必要字段');
        this.errorCollector.addError({
          field: '基础信息',
          message: '缺少必要字段：基础信息.姓名',
          category: '格式错误',
        });
        throw new Error('YAML格式缺少必要字段');
      }

      console.log('✅ [人物解析] 基础信息验证通过');
      console.log('👤 [人物解析] 人物姓名:', data.基础信息.姓名);

      // 提前检查隐藏特质数据
      console.log('🔍 [人物解析] 提前检查隐藏特质数据（YAML）...');

      // 使用健壮的字段读取方法
      const sexExperienceField = this.robustGetField(data, '性经历', '隐藏特质');
      const fearsField = this.getFearsField(data, '隐藏特质'); // 优先恐惧，其次害怕
      const secretsField = this.robustGetField(data, '秘密', '隐藏特质');

      console.log('📊 [人物解析] 隐藏特质原始数据:', {
        隐藏特质存在: !!data.隐藏特质,
        隐藏特质类型: typeof data.隐藏特质,
        隐藏特质内容: JSON.stringify(data.隐藏特质, null, 2),
        隐藏特质所有键: data.隐藏特质 ? Object.keys(data.隐藏特质) : [],
        性经历_值: sexExperienceField.value,
        性经历_来源: sexExperienceField.source,
        性经历_隐藏特质可用键: sexExperienceField.allKeys,
        恐惧_值: fearsField.value,
        恐惧_来源: fearsField.source,
        恐惧_隐藏特质可用键: fearsField.allKeys,
        秘密_值: secretsField.value,
        秘密_来源: secretsField.source,
        秘密_隐藏特质可用键: secretsField.allKeys,
      });

      // 处理图片资源信息
      if (pictureResource?.imageUrl) {
        console.log('🖼️ [人物解析] 据点图片资源信息:', {
          id: pictureResource.id,
          race: pictureResource.race,
          class: pictureResource.class,
          imageUrl: pictureResource.imageUrl,
        });
      } else {
        console.log('⚠️ [人物解析] 未提供据点图片资源信息');
      }

      // 解析敏感点信息
      console.log('🔍 [人物解析] 开始解析敏感点信息...');
      const sensitivePointsDetail: ParsedSensitivePoint[] = [];
      const parts: SensitivePart[] = ['嘴巴', '胸部', '乳头', '阴道', '子宫', '后庭', '阴蒂', 'G点'];

      // 获取敏感部位和描述（新简化格式）
      let sensitivePart: string | undefined = undefined;
      let sensitiveDescription = '';

      if (typeof data.敏感点 === 'string') {
        sensitivePart = data.敏感点;
        console.log('🎯 [人物解析] 敏感部位:', sensitivePart);
      }

      // 尝试读取"描述"字段
      if (typeof data.描述 === 'string') {
        sensitiveDescription = data.描述;
        console.log('📝 [人物解析] 敏感部位描述:', sensitiveDescription.substring(0, 50) + '...');
      }

      // 为所有部位创建信息（但只有一个是敏感的）
      for (const part of parts) {
        const isSensitive = sensitivePart === part;

        sensitivePointsDetail.push({
          part,
          isSensitive,
          description: isSensitive && sensitiveDescription ? sensitiveDescription : `${part}部位`,
        });

        console.log(`🎯 [人物解析] ${part}部位: ${isSensitive ? '敏感' : '不敏感'}`);
      }

      const sensitiveCount = sensitivePointsDetail.filter(p => p.isSensitive).length;
      console.log(`📊 [人物解析] 敏感点解析完成，敏感部位数量: ${sensitiveCount}`);

      // 解析成长经历
      console.log('📚 [人物解析] 开始解析成长经历...');
      const lifeStory: ParsedLifeStory = {
        childhood: data.成长经历?.童年 ? [data.成长经历.童年] : [],
        adolescence: data.成长经历?.青年 ? [data.成长经历.青年] : [],
        adulthood: data.成长经历?.成年 ? [data.成长经历.成年] : [],
        currentState: data.成长经历?.当前 ? [data.成长经历.当前] : [],
      };

      console.log('📊 [人物解析] 成长经历解析完成:', {
        童年: lifeStory.childhood.length > 0 ? '存在' : '缺失',
        青年: lifeStory.adolescence.length > 0 ? '存在' : '缺失',
        成年: lifeStory.adulthood.length > 0 ? '存在' : '缺失',
        当前: lifeStory.currentState.length > 0 ? '存在' : '缺失',
      });

      // 解析衣着信息
      console.log('👗 [人物解析] 开始解析衣着信息...');
      console.log('🔍 [人物解析] 检查衣着数据:', {
        顶级衣着存在: !!data.衣着,
        外貌数据衣着存在: !!(data.外貌数据 && data.外貌数据.衣着),
      });
      const clothing: ParsedClothing = {};

      // 衣着信息可能在外貌数据内部
      const clothingData = data.衣着 || (data.外貌数据 && data.外貌数据.衣着);
      if (clothingData) {
        console.log('✅ [人物解析] 衣着数据存在，开始解析...');

        // 解析各个衣着部位
        if (clothingData.头部) {
          clothing.head = clothingData.头部;
          console.log('👑 [人物解析] 头部装饰:', clothing.head);
        }
        if (clothingData.上装) {
          clothing.top = clothingData.上装;
          console.log('👕 [人物解析] 上装:', clothing.top);
        }
        if (clothingData.下装) {
          clothing.bottom = clothingData.下装;
          console.log('👖 [人物解析] 下装:', clothing.bottom);
        }
        if (clothingData.袜子) {
          clothing.socks = clothingData.袜子;
          console.log('🧦 [人物解析] 袜子:', clothing.socks);
        }
        if (clothingData.鞋子) {
          clothing.shoes = clothingData.鞋子;
          console.log('👠 [人物解析] 鞋子:', clothing.shoes);
        }
        if (clothingData.内衣) {
          clothing.underwear = clothingData.内衣;
          console.log('🩱 [人物解析] 内衣:', clothing.underwear);
        }
        if (clothingData.装饰品) {
          clothing.accessories = clothingData.装饰品;
          console.log('💎 [人物解析] 装饰品:', clothing.accessories);
        }
        if (clothingData.玩具) {
          clothing.toys = clothingData.玩具;
          console.log('🎀 [人物解析] 玩具:', clothing.toys);
        }

        const clothingCount = Object.keys(clothing).length;
        console.log(`📊 [人物解析] 衣着解析完成，衣着部位数量: ${clothingCount}`);
      } else {
        console.log('⚠️ [人物解析] 衣着数据缺失，使用默认值');
      }

      // 保存原始服装信息（深拷贝）
      const originalClothing = JSON.parse(JSON.stringify(clothing));

      // 构建解析后的原始数据对象
      console.log('🏗️ [人物解析] 开始构建解析后的数据对象...');
      console.log('🔍 [人物解析] 开始严格验证基础信息...');

      // 完全自定义模式：解析战斗属性、体力、生育力
      let customAttributes: ParsedCharacterData['customAttributes'] | undefined;
      let customStamina: number | undefined;
      let customFertility: number | undefined;
      let canCombat: boolean;

      if (isFullCustom) {
        console.log('🎨 [人物解析] 完全自定义模式：解析AI生成的属性');

        // 默认可战斗为true
        canCombat = true;

        // 解析战斗属性
        if (data.基础信息?.战斗属性) {
          const attr = data.基础信息.战斗属性;
          customAttributes = {
            attack: typeof attr.攻击 === 'number' ? attr.攻击 : undefined,
            defense: typeof attr.防御 === 'number' ? attr.防御 : undefined,
            intelligence: typeof attr.智力 === 'number' ? attr.智力 : undefined,
            speed: typeof attr.速度 === 'number' ? attr.速度 : undefined,
            health: typeof attr.生命 === 'number' ? attr.生命 : undefined,
          };
          console.log('📊 [人物解析] 完全自定义模式 - 解析的战斗属性:', customAttributes);
        }

        // 解析体力
        if (typeof data.基础信息?.体力 === 'number') {
          customStamina = data.基础信息.体力;
          console.log('💪 [人物解析] 完全自定义模式 - 解析的体力:', customStamina);
        }

        // 解析生育力
        if (typeof data.基础信息?.生育力 === 'number') {
          customFertility = data.基础信息.生育力;
          console.log('🌱 [人物解析] 完全自定义模式 - 解析的生育力:', customFertility);
        }
      } else {
        // 普通模式：使用原有逻辑
        canCombat = this.validateCanCombat(data.基础信息.可战斗, '基础信息');
      }

      const parsedData: ParsedCharacterData = {
        // 基础信息（严格验证，不允许保底）
        name: this.validateRequiredString(data.基础信息.姓名, '姓名', '基础信息'),
        race: this.validateRequiredString(data.基础信息.种族, '种族', '基础信息'),
        age: this.validateRequiredNumber(data.基础信息.年龄, '年龄', '基础信息'),
        country: this.validateRequiredString(data.基础信息.国家, '国家', '基础信息'),
        identity: this.validateRequiredString(data.基础信息.身份, '身份', '基础信息'),
        background: this.validateBackground(data.基础信息.出身, '基础信息'),
        personality: this.validatePersonality(data.基础信息.性格, '基础信息'),
        canCombat,
        unitType: this.validateUnitType(data.基础信息.单位类型),

        // 完全自定义模式的属性（可选）
        customAttributes,
        customStamina,
        customFertility,

        // 外貌数据（严格验证）
        appearance: {
          height: this.validateRequiredNumber(data.外貌数据?.身高, '身高', '外貌数据'),
          weight: this.validateRequiredNumber(data.外貌数据?.体重, '体重', '外貌数据'),
          measurements: this.validateRequiredString(data.外貌数据?.三围, '三围', '外貌数据'),
          cupSize: this.validateCupSize(data.外貌数据?.罩杯, '外貌数据'),
          description: this.validateRequiredString(data.外貌数据?.描述, '外貌描述', '外貌数据'),
          clothing: Object.keys(clothing).length > 0 ? clothing : undefined,
          originalClothing: Object.keys(originalClothing).length > 0 ? originalClothing : undefined,
        },

        // 敏感点信息
        sensitivePointsDetail,

        // 成长经历
        lifeStory,

        // 隐藏特质（性经历必须，恐惧和秘密改为可选）
        // 兼容AI可能将"性经历"、"恐惧"和"秘密"放在顶级字段的情况
        // 使用健壮的字段读取方法，处理可能的字符编码或键名匹配问题
        hiddenTraits: {
          sexExperience: this.validateRequiredString(
            this.robustGetField(data, '性经历', '隐藏特质').value,
            '性经历',
            '隐藏特质',
          ),
          fears: this.validateOptionalString(
            this.getFearsField(data, '隐藏特质').value, // 优先恐惧，其次害怕
            '恐惧',
            '隐藏特质',
            '未知',
          ),
          secrets: this.validateOptionalString(
            this.robustGetField(data, '秘密', '隐藏特质').value,
            '秘密',
            '隐藏特质',
            '未知',
          ),
        },

        // 头像信息（来自据点图片资源）
        avatar: pictureResource?.imageUrl,
      };

      console.log('✅ [人物解析] 所有字段验证通过');
      console.log('🎉 [人物解析] 人物数据解析成功:', {
        姓名: parsedData.name,
        种族: parsedData.race,
        年龄: parsedData.age,
        国家: parsedData.country,
        身份: parsedData.identity,
        出身: parsedData.background,
        性格数量: parsedData.personality.length,
        身高: parsedData.appearance.height,
        体重: parsedData.appearance.weight,
        罩杯: parsedData.appearance.cupSize,
        衣着数量: parsedData.appearance.clothing ? Object.keys(parsedData.appearance.clothing).length : 0,
        头像URL: parsedData.avatar || '未设置',
      });
      console.log('📤 [人物解析] 返回解析后的数据对象');
      return parsedData;
    } catch (error) {
      console.error('解析人物信息失败（YAML）:', error);
      // 显示错误弹窗
      await this.showParseErrorDialog(
        error instanceof Error ? error : new Error(String(error)),
        rawText || text,
        onRetry,
      );
      return null;
    }
  }
}
