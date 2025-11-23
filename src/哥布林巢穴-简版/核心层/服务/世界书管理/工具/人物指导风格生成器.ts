import type { Character } from '../../../../功能模块层/人物管理/类型/人物类型';

/**
 * 基于忠诚度的指导风格项
 * 当用于配置数组时，loyalty 字段必填
 * 当用于返回结果时，loyalty 字段可选（只需 content）
 */
export interface LoyaltyGuidelineItem {
  /** 忠诚度阈值（当忠诚度 >= 此值时应用，-100表示未捕获，100表示完全堕落） */
  loyalty?: number;
  /** 提示词内容（指导原则） */
  content: string;
}

/**
 * 指导风格主题（可复用的模板）
 */
export interface GuidelineTheme {
  /** 主题名称 */
  name: string;
  /** 主题描述 */
  description?: string;
  /** 基于忠诚度的指导风格配置 */
  loyaltyGuidelines: LoyaltyGuidelineItem[];
}

/**
 * 主题库配置（以主题ID为key）
 */
export type GuidelineThemeLibrary = Record<string, GuidelineTheme>;

/**
 * 人物指导风格生成器
 * 负责根据人物属性生成调教设置和指导原则
 */
export class CharacterGuidelineGenerator {
  /**
   * 获取默认的完整配置（包含所有忠诚度区间）
   */
  static getDefaultGuidelines(): LoyaltyGuidelineItem[] {
    return [
      {
        loyalty: -100,
        content:
          '角色尚未被哥布林巢穴捕获，保持其原始身份和立场，根据角色的种族、身份和性格特征来塑造其行为，对哥布林巢穴可能持有敌意或警惕态度。',
      },
      {
        loyalty: 0,
        content:
          '角色刚被捕获并开始接受调教，表现出强烈的抗拒和敌意，会试图反抗或逃跑，对哥布林表现出明显的厌恶，根据当前忠诚度和体力状态调整回应，在调教过程中会逐渐改变对巢穴以及哥布林之王的态度，根据角色的种族特征来塑造其行为和对话风格，保持角色的背景设定，根据人生经历调整回应。',
      },
      {
        loyalty: 20,
        content:
          '角色仍然保持一定的抵抗心理，会质疑哥布林的权威，表现出对现状的不满，但开始出现轻微的动摇迹象，根据当前忠诚度和体力状态调整回应，在调教过程中会逐渐改变对巢穴以及哥布林之王的态度，根据角色的种族特征来塑造其行为和对话风格，保持角色的背景设定，根据人生经历调整回应。',
      },
      {
        loyalty: 40,
        content:
          '角色开始出现动摇的迹象，会逐渐接受现实，对哥布林的态度开始软化，虽然仍有抗拒心理，但已经开始配合部分要求，根据当前忠诚度和体力状态调整回应，在调教过程中会逐渐改变对巢穴以及哥布林之王的态度，根据角色的种族特征来塑造其行为和对话风格，保持角色的背景设定，根据人生经历调整回应。',
      },
      {
        loyalty: 60,
        content:
          '角色逐渐接受现实，开始配合哥布林的要求，对哥布林的态度明显改善，抗拒心理减弱，开始出现主动配合的迹象，根据当前忠诚度和体力状态调整回应，在调教过程中会逐渐改变对巢穴以及哥布林之王的态度，根据角色的种族特征来塑造其行为和对话风格，保持角色的背景设定，根据人生经历调整回应。',
      },
      {
        loyalty: 80,
        content:
          '角色已经基本认同现状，开始主动配合哥布林，对哥布林表现出一定的忠诚，抗拒心理基本消失，会根据哥布林的要求主动调整自己的行为，根据当前忠诚度和体力状态调整回应，在调教过程中会逐渐改变对巢穴以及哥布林之王的态度，根据角色的种族特征来塑造其行为和对话风格，保持角色的背景设定，根据人生经历调整回应。',
      },
      {
        loyalty: 100,
        content:
          '角色已经完全堕落，对主人绝对忠诚和服从，表现出对主人的崇拜和依赖，主动寻求主人的关注和认可，语言风格更加顺从和谄媚，会主动配合主人的所有要求，表现出对过去身份的完全抛弃，在对话中会主动提及对主人的忠诚，对主人的任何要求都会欣然接受，会主动讨好主人，寻求主人的喜爱，已经完全认同自己作为哥布林奴隶的身份，根据角色的种族特征来塑造其行为和对话风格。',
      },
    ];
  }

  /**
   * 获取默认配置中的指定忠诚度区间内容
   * 注意：loyalty 是阈值，生成的内容应该适用于该阈值及以上的区间
   */
  static getDefaultContentByLoyaltyValue(loyalty: number): string {
    const defaultGuidelines = this.getDefaultGuidelines();
    const guideline = defaultGuidelines.find(item => item.loyalty === loyalty);
    if (guideline) {
      return guideline.content;
    }
    // 如果没有找到精确匹配，返回未捕获状态的默认内容
    return defaultGuidelines.find(item => item.loyalty === -100)?.content || '';
  }
  /**
   * 根据人物属性动态构建调教设置（完全依赖主题库）
   * 优先级：人物关联的主题 > 全局默认主题 > 默认配置
   */
  static buildTrainingSettings(character: Character): LoyaltyGuidelineItem {
    // 将状态转换为忠诚度值
    let loyaltyValue: number;
    if (character.status === 'uncaptured' || character.status === 'enemy') {
      loyaltyValue = -100; // 未捕获/敌人状态
    } else if (character.status === 'surrendered') {
      loyaltyValue = 100; // 完全堕落状态
    } else {
      // 正常状态（包括 imprisoned 关押中、training 训练中等），使用实际忠诚度值
      loyaltyValue = character.loyalty;
    }

    // 获取配置（完全依赖主题库）
    let guidelines: LoyaltyGuidelineItem[] | null = null;
    try {
      const globalVars = getVariables({ type: 'global' });
      const themeLibraryKey = 'guideline_theme_library';
      const globalDefaultThemeKey = 'guideline_default_theme_id';

      // 获取主题库
      const themeLibrary: GuidelineThemeLibrary | null =
        globalVars[themeLibraryKey] && typeof globalVars[themeLibraryKey] === 'object'
          ? (globalVars[themeLibraryKey] as GuidelineThemeLibrary)
          : null;

      // 1. 如果人物信息中有关联的主题ID，使用该主题
      if (character.guidelineThemeId && themeLibrary?.[character.guidelineThemeId]) {
        guidelines = themeLibrary[character.guidelineThemeId].loyaltyGuidelines;
        console.log(
          `使用人物关联的主题配置: ${character.name} (${character.id}) -> 主题 ${character.guidelineThemeId}`,
        );
      }

      // 2. 如果没有人物关联主题，使用全局默认主题
      if (!guidelines && themeLibrary) {
        const defaultThemeId = globalVars[globalDefaultThemeKey] as string | undefined;
        if (defaultThemeId && themeLibrary[defaultThemeId]) {
          guidelines = themeLibrary[defaultThemeId].loyaltyGuidelines;
          console.log(`使用全局默认主题配置: ${character.name} (${character.id}) -> 主题 ${defaultThemeId}`);
        }
      }

      // 3. 如果都没有，使用默认配置
      if (!guidelines) {
        guidelines = this.getDefaultGuidelines();
        console.log(`使用默认指导风格配置: ${character.name} (${character.id})`);
      }
    } catch (error) {
      console.warn('读取人物指导风格配置失败，使用默认配置:', error);
      // 如果读取失败，使用默认配置
      guidelines = this.getDefaultGuidelines();
    }

    // 根据忠诚度值查找匹配的配置（降序匹配，选择第一个匹配的）
    if (guidelines && guidelines.length > 0) {
      // 过滤出有 loyalty 字段的配置项并按忠诚度降序排序
      const validGuidelines = guidelines.filter(
        (item): item is LoyaltyGuidelineItem & { loyalty: number } => item.loyalty !== undefined,
      );
      const sortedGuidelines = [...validGuidelines].sort((a, b) => b.loyalty - a.loyalty);

      // 找到第一个匹配的忠诚度阈值
      const matchedGuideline = sortedGuidelines.find(item => loyaltyValue >= item.loyalty);
      if (matchedGuideline) {
        console.log(
          `使用忠诚度指导风格: 角色 ${character.name}, 忠诚度值 ${loyaltyValue} >= ${matchedGuideline.loyalty}`,
        );
        return { content: matchedGuideline.content };
      }
    }

    // 如果没有找到匹配的配置，使用默认配置
    console.warn(`未找到匹配的忠诚度配置，使用默认配置。角色: ${character.name}, 忠诚度值: ${loyaltyValue}`);
    return { content: this.getDefaultContentByLoyaltyValue(-100) };
  }
}
