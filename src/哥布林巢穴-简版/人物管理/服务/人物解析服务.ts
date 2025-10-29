/**
 * 人物信息解析器
 * 专门负责解析AI输出的人物信息JSON文本，返回原始数据
 */
import { parse as parseYaml } from 'yaml';
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

export class CharacterParser {
  // ==================== 主要解析方法 ====================

  /**
   * 解析AI输出的人物信息JSON
   * @param text AI输出的人物信息JSON文本
   * @param pictureResource 据点的图片资源信息（可选）
   * @returns 解析后的原始数据对象
   */
  static parseCharacterJson(text: string, pictureResource?: PictureResource): ParsedCharacterData | null {
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
        throw new Error('JSON格式缺少必要字段');
      }

      console.log('✅ [人物解析] 基础信息验证通过');
      console.log('👤 [人物解析] 人物姓名:', data.基础信息.姓名);

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

      const parsedData: ParsedCharacterData = {
        // 基础信息（严格验证，不允许保底）
        name: this.validateRequiredString(data.基础信息.姓名, '姓名'),
        race: this.validateRequiredString(data.基础信息.种族, '种族'),
        age: this.validateRequiredNumber(data.基础信息.年龄, '年龄'),
        country: this.validateRequiredString(data.基础信息.国家, '国家'),
        identity: this.validateRequiredString(data.基础信息.身份, '身份'),
        background: this.validateBackground(data.基础信息.出身),
        personality: this.validatePersonality(data.基础信息.性格),
        canCombat: this.validateCanCombat(data.基础信息.可战斗),
        unitType: this.validateUnitType(data.基础信息.单位类型),

        // 外貌数据（严格验证）
        appearance: {
          height: this.validateRequiredNumber(data.外貌数据?.身高, '身高'),
          weight: this.validateRequiredNumber(data.外貌数据?.体重, '体重'),
          measurements: this.validateRequiredString(data.外貌数据?.三围, '三围'),
          cupSize: this.validateCupSize(data.外貌数据?.罩杯),
          description: this.validateRequiredString(data.外貌数据?.描述, '外貌描述'),
          clothing: Object.keys(clothing).length > 0 ? clothing : undefined,
          originalClothing: Object.keys(originalClothing).length > 0 ? originalClothing : undefined,
        },

        // 敏感点信息
        sensitivePointsDetail,

        // 成长经历
        lifeStory,

        // 隐藏特质（严格验证）
        hiddenTraits: {
          sexExperience: this.validateRequiredString(data.隐藏特质?.性经历, '性经历'),
          fears: this.validateRequiredString(data.隐藏特质?.恐惧, '恐惧'),
          secrets: this.validateRequiredString(data.隐藏特质?.秘密, '秘密'),
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
   * @returns 验证后的出身等级
   * @throws Error 如果出身等级缺失或无效
   */
  private static validateBackground(background: any): BackgroundType {
    if (!background || typeof background !== 'string') {
      throw new Error('出身等级字段缺失，AI必须明确指定：平民/贵族/王族');
    }

    const validBackgrounds: BackgroundType[] = ['平民', '贵族', '王族'];
    if (!validBackgrounds.includes(background as BackgroundType)) {
      throw new Error(`出身等级无效：${background}，必须是：平民/贵族/王族`);
    }

    return background as BackgroundType;
  }

  /**
   * 验证必需的字符串字段
   * @param value 字段值
   * @param fieldName 字段名称
   * @returns 验证后的字符串
   * @throws Error 如果字段缺失或无效
   */
  private static validateRequiredString(value: any, fieldName: string): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${fieldName}字段缺失或为空，AI必须提供有效的${fieldName}`);
    }
    return value.trim();
  }

  /**
   * 验证必需的数字字段
   * @param value 字段值
   * @param fieldName 字段名称
   * @returns 验证后的数字
   * @throws Error 如果字段缺失或无效
   */
  private static validateRequiredNumber(value: any, fieldName: string): number {
    if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
      throw new Error(`${fieldName}字段缺失或无效，AI必须提供有效的数字`);
    }
    return value;
  }

  /**
   * 验证性格数组
   * @param personality 性格数组
   * @returns 验证后的性格数组
   * @throws Error 如果性格字段无效
   */
  private static validatePersonality(personality: any): string[] {
    if (!Array.isArray(personality)) {
      throw new Error('性格字段必须是数组格式');
    }
    return personality.filter(item => typeof item === 'string' && item.trim() !== '');
  }

  /**
   * 验证罩杯大小
   * @param cupSize 罩杯大小
   * @returns 验证后的罩杯大小
   * @throws Error 如果罩杯大小无效
   */
  private static validateCupSize(cupSize: any): string {
    if (!cupSize || typeof cupSize !== 'string') {
      throw new Error('罩杯字段缺失或无效，AI必须提供有效的罩杯大小');
    }

    const validCupSizes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const upperCupSize = cupSize.toUpperCase();
    if (!validCupSizes.includes(upperCupSize)) {
      throw new Error(`罩杯大小无效：${cupSize}，必须是：A/B/C/D/E/F/G`);
    }

    return upperCupSize;
  }

  /**
   * 验证可战斗属性
   * @param canCombat 可战斗属性
   * @returns 验证后的可战斗属性
   * @throws Error 如果可战斗属性无效
   */
  private static validateCanCombat(canCombat: any): boolean {
    if (canCombat === undefined || canCombat === null) {
      throw new Error('可战斗字段缺失，AI必须明确指定：true/false');
    }

    if (typeof canCombat !== 'boolean') {
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
   * @returns 解析后的原始数据对象
   */
  static parseCharacterYaml(text: string, pictureResource?: PictureResource): ParsedCharacterData | null {
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
        throw new Error('YAML格式缺少必要字段');
      }

      console.log('✅ [人物解析] 基础信息验证通过');
      console.log('👤 [人物解析] 人物姓名:', data.基础信息.姓名);

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

      const parsedData: ParsedCharacterData = {
        // 基础信息（严格验证，不允许保底）
        name: this.validateRequiredString(data.基础信息.姓名, '姓名'),
        race: this.validateRequiredString(data.基础信息.种族, '种族'),
        age: this.validateRequiredNumber(data.基础信息.年龄, '年龄'),
        country: this.validateRequiredString(data.基础信息.国家, '国家'),
        identity: this.validateRequiredString(data.基础信息.身份, '身份'),
        background: this.validateBackground(data.基础信息.出身),
        personality: this.validatePersonality(data.基础信息.性格),
        canCombat: this.validateCanCombat(data.基础信息.可战斗),
        unitType: this.validateUnitType(data.基础信息.单位类型),

        // 外貌数据（严格验证）
        appearance: {
          height: this.validateRequiredNumber(data.外貌数据?.身高, '身高'),
          weight: this.validateRequiredNumber(data.外貌数据?.体重, '体重'),
          measurements: this.validateRequiredString(data.外貌数据?.三围, '三围'),
          cupSize: this.validateCupSize(data.外貌数据?.罩杯),
          description: this.validateRequiredString(data.外貌数据?.描述, '外貌描述'),
          clothing: Object.keys(clothing).length > 0 ? clothing : undefined,
          originalClothing: Object.keys(originalClothing).length > 0 ? originalClothing : undefined,
        },

        // 敏感点信息
        sensitivePointsDetail,

        // 成长经历
        lifeStory,

        // 隐藏特质（严格验证）
        hiddenTraits: {
          sexExperience: this.validateRequiredString(data.隐藏特质?.性经历, '性经历'),
          fears: this.validateRequiredString(data.隐藏特质?.恐惧, '恐惧'),
          secrets: this.validateRequiredString(data.隐藏特质?.秘密, '秘密'),
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
      return null;
    }
  }
}
