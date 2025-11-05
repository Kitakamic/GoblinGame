import { continentExploreService } from '../../探索/服务/大陆探索服务';
import type { Location } from '../../探索/类型/探索类型';
import type { Character } from '../类型/人物类型';
import { CharacterAttributeCalculator } from './人物属性计算服务';
import { CharacterParser } from './人物解析服务';

/**
 * 英雄人物判定服务
 * 根据据点类型和难度判定是否出现英雄人物
 *
 * 使用累计制随机机制（按据点类型独立累积）：
 * - 每次未出现英雄时，该类型累积10%概率
 * - 出现英雄后，重置该类型的累积概率
 * - 不同据点类型的累积值独立计算
 */
export class HeroDeterminationService {
  /**
   * 按据点类型存储的累积概率加成（百分比）
   * 每种据点类型独立累积，互不影响
   */
  private static accumulatedBonusByType: Map<Location['type'], number> = new Map();

  /**
   * 人物性格风格分类 - 用于随机筛子
   * 每个类别独立，避免重叠
   */
  private static readonly PERSONALITY_CATEGORIES = {
    // 基础性格 - 核心人格气质，不涉及性/道德方面
    基础性格类: ['高傲冷艳', '温柔亲切', '坚强不屈', '敏感脆弱', '开朗外向', '内敛沉静'],

    // 道德倾向 - 专门针对性和道德的立场态度
    道德倾向类: ['目无王法', '胆大妄为', '玩世不恭', '循规蹈矩', '道德楷模', '圣人再世'],

    // 行为方式 - 行动和互动中的主动/被动倾向
    行为方式类: ['主动出击', '被动等待', '喜欢控制', '甘愿被控', '决不投降', '逆来顺受'],

    // 情感需求 - 内心深处的渴望和需求
    情感需求类: ['淫荡至极', '放荡不羁', '好色贪欢', '冰清玉洁'],
  };

  /**
   * 从指定类别中随机选择一个性格特质
   * @param category 性格类别名称
   * @returns 随机选择的性格特质
   */
  static rollPersonalityFromCategory(category: keyof typeof this.PERSONALITY_CATEGORIES): string {
    const traits = this.PERSONALITY_CATEGORIES[category];
    const randomIndex = Math.floor(Math.random() * traits.length);
    return traits[randomIndex];
  }

  /**
   * 随机选择3个类别，每个类别抽取1个性格特质
   * @returns 性格风格描述
   */
  static rollPersonalityStylesCombination(): string {
    // 获取所有类别名称
    const allCategories = Object.keys(this.PERSONALITY_CATEGORIES) as Array<keyof typeof this.PERSONALITY_CATEGORIES>;

    // 随机选择3个类别
    const shuffledCategories = [...allCategories].sort(() => 0.5 - Math.random());
    const selectedCategories = shuffledCategories.slice(0, 3);

    // 从每个选中的类别中抽取1个特质
    const selectedTraits = selectedCategories.map(category => this.rollPersonalityFromCategory(category));

    console.log('🎲 [性格筛子] 选中的类别:', selectedCategories);
    console.log('🎯 [性格筛子] 抽取的特质:', selectedTraits);

    return selectedTraits.join('、');
  }

  /**
   * 获取性格风格的统计信息
   * @returns 性格风格统计信息
   */
  static getPersonalityStylesStats(): {
    totalCategories: number;
    totalTraits: number;
    categories: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    let totalTraits = 0;

    Object.entries(this.PERSONALITY_CATEGORIES).forEach(([categoryName, traits]) => {
      categories[categoryName] = traits.length;
      totalTraits += traits.length;
    });

    return {
      totalCategories: Object.keys(this.PERSONALITY_CATEGORIES).length,
      totalTraits,
      categories,
    };
  }
  /**
   * 根据据点类型和难度判定是否出现英雄（使用按类型独立累计的随机机制）
   * @param locationType 据点类型
   * @param difficulty 难度
   * @returns 是否出现英雄
   */
  static shouldHaveHero(locationType: Location['type'], difficulty: number): boolean {
    const random = Math.random();
    const baseProbability = this.getBaseProbability(locationType, difficulty);

    // 获取该类型当前的累积加成（如果不存在则初始化为0）
    const currentBonus = this.accumulatedBonusByType.get(locationType) || 0;

    // 获取玩家设置的额外修正（全局变量中的比例，0-1）
    let extraModifier = 0;
    try {
      const globalVars = getVariables({ type: 'global' });
      const savedModifier = globalVars['hero_generation_modifier'];
      if (typeof savedModifier === 'number') {
        extraModifier = Math.max(0, Math.min(1, savedModifier)); // 限制在 0-1 之间
      }
    } catch (error) {
      console.warn('无法读取英雄生成修正值:', error);
    }

    // 计算最终概率 = 基础概率 + 该类型的累积加成 + 玩家额外修正
    const finalProbability = Math.min(0.95, baseProbability + currentBonus + extraModifier);

    console.log('🎲 [英雄判定]', {
      据点类型: locationType,
      难度: difficulty,
      基础概率: `${(baseProbability * 100).toFixed(1)}%`,
      该类型累积: `${(currentBonus * 100).toFixed(0)}%`,
      额外修正: `${(extraModifier * 100).toFixed(0)}%`,
      最终概率: `${(finalProbability * 100).toFixed(1)}%`,
      随机数: random.toFixed(3),
    });

    const hasHero = random < finalProbability;

    if (hasHero) {
      // 出现英雄，重置该类型的累积
      console.log(`✅ [英雄判定] ${locationType} 类型出现英雄！重置该类型累积概率`);
      this.accumulatedBonusByType.set(locationType, 0);
    } else {
      // 未出现英雄，增加该类型的10%累积
      const newBonus = Math.min(0.9, currentBonus + 0.1);
      this.accumulatedBonusByType.set(locationType, newBonus);
      console.log(`📈 [英雄判定] ${locationType} 类型未出英雄，该类型累积增加至 ${(newBonus * 100).toFixed(0)}%`);
    }

    return hasHero;
  }

  /**
   * 重置指定类型的累积概率
   * @param locationType 据点类型（不传则重置所有）
   */
  static resetAccumulatedBonus(locationType?: Location['type']): void {
    if (locationType) {
      this.accumulatedBonusByType.set(locationType, 0);
      console.log(`🔄 [英雄判定] ${locationType} 类型累积概率已重置`);
    } else {
      this.accumulatedBonusByType.clear();
      console.log('🔄 [英雄判定] 所有类型累积概率已重置');
    }
  }

  /**
   * 获取指定类型的当前累积概率
   * @param locationType 据点类型
   * @returns 当前累积概率
   */
  static getAccumulatedBonus(locationType: Location['type']): number {
    return this.accumulatedBonusByType.get(locationType) || 0;
  }

  /**
   * 获取所有类型的累积概率（用于调试）
   * @returns 所有类型的累积状态
   */
  static getAllAccumulatedBonus(): Record<string, number> {
    const result: Record<string, number> = {};
    this.accumulatedBonusByType.forEach((bonus, type) => {
      result[type] = bonus;
    });
    return result;
  }

  /**
   * 获取基础概率（降低所有概率，不受大陆和难度影响）
   * @param locationType 据点类型
   * @param _difficulty 难度（保留参数以兼容现有代码，但不再使用）
   * @returns 基础概率
   */
  private static getBaseProbability(locationType: Location['type'], _difficulty: number): number {
    // 根据据点类型的基础概率（统一降低，不再区分大陆）
    const typeProbabilities: Partial<Record<Location['type'], number>> = {
      // 通用类型 - 基础较低
      village: 0.15, // 村庄：15%
      town: 0.2, // 城镇：20%
      city: 0.25, // 城市：25%
      ruins: 0.1, // 遗迹：10%
      trade_caravan: 0.12, // 贸易商队：12%
      adventurer_party: 0.18, // 冒险者小队：18%
      // 古拉尔大陆 - 流放混居之地
      exile_outpost: 0.15, // 流放者据点：15%
      bandit_camp: 0.18, // 盗匪营地：18%
      elven_forest: 0.2, // 精灵森林：20%
      fox_colony: 0.17, // 狐族殖民地：17%
      // 瓦尔基里大陆 - 黑暗精灵
      dark_spire: 0.3, // 巢都尖塔：30%（最高权力）
      slave_camp: 0.12, // 奴隶营地：12%
      dark_fortress: 0.25, // 黑暗要塞：25%
      obsidian_mine: 0.15, // 黑曜石矿场：15%
      raid_dock: 0.2, // 劫掠舰码头：20%
      // 香草群岛 - 狐族
      fox_water_town: 0.18, // 狐族水乡：18%
      shrine: 0.22, // 神社：22%
      trading_port: 0.17, // 贸易港口：17%
      warship_dock: 0.2, // 军舰泊地：20%
      spice_plantation: 0.14, // 香料种植园：14%
      // 赛菲亚大陆 - 人类帝国
      imperial_city: 0.28, // 帝国城市：28%
      noble_estate: 0.23, // 贵族庄园：23%
      mining_district: 0.16, // 矿业区域：16%
      border_fortress: 0.22, // 边境要塞：22%
      cathedral: 0.24, // 教堂：24%
      academy: 0.21, // 学院：21%
      // 世界树圣域 - 永恒精灵
      tree_city: 0.26, // 树城：26%
      elven_temple: 0.27, // 精灵圣殿：27%
      guardian_outpost: 0.21, // 守卫哨所：21%
      canopy_palace: 0.3, // 树冠宫殿：30%（最高统治）
    };

    // 不再使用难度修正，直接返回基础概率
    const baseProb = typeProbabilities[locationType] || 0.15;

    return baseProb;
  }

  /**
   * 生成英雄人物提示词（JSON格式）
   * @param locationType 据点类型
   * @param difficulty 难度
   * @param locationDescription 据点描述
   * @param continent 大陆名称
   * @param region 区域名称
   * @param pictureResource 据点的图片资源信息
   * @returns 英雄人物生成提示词
   */
  static generateHeroPrompt(
    locationType: Location['type'],
    difficulty: number,
    locationDescription?: string,
    continent?: string,
    region?: string,
    pictureResource?: Location['pictureResource'],
  ): string {
    // 获取区域描述信息
    let regionDescription = '';
    if (continent && region) {
      const continentData = continentExploreService.continents.value.find(c => c.name === continent);
      if (continentData) {
        const regionData = continentData.regions.find(r => r.name === region);
        if (regionData) {
          regionDescription = regionData.description;
        }
      }
    }

    // 50%概率使用自定义性格风格，50%概率让AI自由发挥
    const useCustomPersonality = Math.random() < 0.5;
    const personalityStyle = useCustomPersonality ? this.rollPersonalityStylesCombination() : null;
    if (personalityStyle) {
      console.log('🎲 [人物生成] 使用自定义性格风格:', personalityStyle);
    } else {
      console.log('🎲 [人物生成] 不使用自定义性格风格，AI自由发挥');
    }

    // 构建图片资源提示词
    let pictureResourcePrompt = '';
    let generatedName = '';
    if (pictureResource) {
      console.log('🖼️ [人物生成] 据点图片资源信息:', {
        id: pictureResource.id,
        race: pictureResource.race,
        class: pictureResource.class,
        prompt: pictureResource.prompt.substring(0, 100) + '...',
        generatedName: pictureResource.generatedName?.fullName || '未生成',
      });

      // 使用生成的名称
      if (pictureResource.generatedName?.fullName) {
        generatedName = pictureResource.generatedName.fullName;
        console.log('🎭 [人物生成] 使用生成的名称:', generatedName);
      }

      pictureResourcePrompt = `
人物外貌参考：
- 种族：${pictureResource.race}
- 职业：${pictureResource.class}
- 绘图tags：${pictureResource.prompt}

请根据以上信息，在人物外貌描述中体现相应的视觉风格，确保人物形象绘图tags串基本一致。`;
    }

    return `


{
  "基础信息": {
    "姓名": "${generatedName}，请参考这个名称，可以适当根据人物身份种族进行修改，**注意优先音译，禁止直译，狐族日式名称可译为中文汉字**",
    "种族": "人类/狐族/永恒精灵/黑暗精灵",
    "年龄": 数字,
    "国家": "国家名称，可虚构国家名称，但不要与已知国家重名，也可以使用大陆的名称",
    "身份": "具体身份而非单纯的职业，如"白玫瑰骑士团团长/翡翠王国公主等"，10个字以内",
    "出身": "出身等级，只能选择：平民/贵族/王族",
    "性格": ["性格1", "性格2"...必须为四个**四字词语**${personalityStyle ? `，需要体现"${personalityStyle}"的特征，但不要完全一样` : ''}],
    "可战斗": true/false {可战斗属性：根据身份判断，例如：战士、骑士、法师等战斗职业为true，商人、工匠、学者等非战斗职业为false},
    "单位类型": "physical/magical" {魔法攻击职业为magical，物理攻击职业为physical}
  },
  "外貌数据": {
    "身高": 数字,
    "体重": 数字,
    "三围": "胸围-腰围-臀围，不需要带字母",
    "罩杯": "A/B/C/D/E/F/G",
    "描述": "使用100字左右优美细致的语言，从头到脚由宏观到细节描述人物整体，包含体型、肌肤/头发颜色、长度/眼睛/面容细节/四肢，**绝不要包含衣物**，如同是在拍摄写真一般，要有画面感${personalityStyle ? `。外貌描述需要体现"${personalityStyle}"的气质特征` : ''}",
    "衣着": { "所有衣着描述请使用**形容词+名词，例如深蓝色碎花裙**格式，无需量词，且如果此部位未穿着可以不输出此行",
      "头部": "头部装饰/帽子/头盔",
      "上装": "上装",
      "下装": "下装",
      "袜子": "袜子",
      "鞋子": "鞋子",
      "内衣": "内衣",
      "装饰品": "装饰品",
      "玩具": "性玩具/跳蛋/手铐/锁链",
    }
  },
  "敏感点": "例如：嘴巴/胸部/乳头/阴道/子宫/后庭/阴蒂/G点，选择一个部位",
  "描述": "详细描述此敏感点的物理特征和细节，最少30字",
  "隐藏特质": {
    "性经历": "性经验描述，最少10字${personalityStyle ? `，需要符合"${personalityStyle}"的特征` : ''}",
    "恐惧": "恐惧内容，最少10字${personalityStyle ? `，与"${personalityStyle}"相关的内心恐惧` : ''}",
    "害怕": "害怕内容，必须与恐惧字段内容完全一致${personalityStyle ? `，与"${personalityStyle}"相关的内心恐惧` : ''}",
    "秘密": "秘密内容，最少10字${personalityStyle ? `，体现"${personalityStyle}"的隐藏面` : ''}"
  },
  "成长经历": {
    "童年": "童年经历描述，最少50字${personalityStyle ? `，需要体现"${personalityStyle}"性格的形成原因` : ''}",
    "青年": "青年经历描述，最少50字${personalityStyle ? `，展现"${personalityStyle}"特征的发展` : ''}", 
    "成年": "成年经历描述，最少50字${personalityStyle ? `，体现"${personalityStyle}"的成熟表现` : ''}",
    "当前": "当前状态描述，最少50字${personalityStyle ? `，完全展现"${personalityStyle}"的特征` : ''}"
  }
}

<herorules>
请为这个据点生成一个英雄人物，严格按照JSON格式输出，不要添加任何其他内容：

据点信息（以下信息请严格参考，增加代入感）：
- 类型：${locationType}
- 难度：${difficulty}/10
- 描述：${locationDescription}
- 大陆：${continent}
- 区域：${region}:${regionDescription}
${pictureResourcePrompt}

人物要求：
1. 与据点类型和难度相匹配的实力
2. 英雄的背景和身份应该与据点描述相符
3. 严格按照以下JSON格式输出，不要添加任何其他内容${
      personalityStyle
        ? `
4. **人物整体风格为：${personalityStyle}** - 请在人物的性格、外貌描述、成长经历、隐藏特质等各个方面都体现这种风格特征
5. 人物的性格特征、行为表现、内心想法都应该与"${personalityStyle}"这一风格保持一致
6. `
        : ''
    }**重要**：***人物的种族和基础外貌描述必须与图片Tags保持一致，但职业可以做参考，不要求完全一致，前提是符合Tags的人物装束***
</herorules>
`;
  }

  /**
   * 生成英雄人物提示词（YAML格式）
   * @param locationType 据点类型
   * @param difficulty 难度
   * @param locationDescription 据点描述
   * @param continent 大陆名称
   * @param region 区域名称
   * @param pictureResource 据点的图片资源信息
   * @returns 英雄人物生成提示词
   */
  static generateHeroPromptYaml(
    locationType: Location['type'],
    difficulty: number,
    locationDescription?: string,
    continent?: string,
    region?: string,
    pictureResource?: Location['pictureResource'],
  ): string {
    // 获取区域描述信息
    let regionDescription = '';
    if (continent && region) {
      const continentData = continentExploreService.continents.value.find(c => c.name === continent);
      if (continentData) {
        const regionData = continentData.regions.find(r => r.name === region);
        if (regionData) {
          regionDescription = regionData.description;
        }
      }
    }

    // 50%概率使用自定义性格风格，50%概率让AI自由发挥
    const useCustomPersonality = Math.random() < 0.5;
    const personalityStyle = useCustomPersonality ? this.rollPersonalityStylesCombination() : null;
    if (personalityStyle) {
      console.log('🎲 [人物生成] 使用自定义性格风格:', personalityStyle);
    } else {
      console.log('🎲 [人物生成] 不使用自定义性格风格，AI自由发挥');
    }

    // 构建图片资源提示词
    let pictureResourcePrompt = '';
    let generatedName = '';
    if (pictureResource) {
      console.log('🖼️ [人物生成] 据点图片资源信息:', {
        id: pictureResource.id,
        race: pictureResource.race,
        class: pictureResource.class,
        prompt: pictureResource.prompt.substring(0, 100) + '...',
        generatedName: pictureResource.generatedName?.fullName || '未生成',
      });

      // 使用生成的名称
      if (pictureResource.generatedName?.fullName) {
        generatedName = pictureResource.generatedName.fullName;
        console.log('🎭 [人物生成] 使用生成的名称:', generatedName);
      }

      pictureResourcePrompt = `
人物外貌参考：
- 种族：${pictureResource.race}
- 职业：${pictureResource.class}
- 绘图tags：${pictureResource.prompt}

请根据以上信息，在人物外貌描述中体现相应的视觉风格，确保人物形象绘图tags串基本一致。`;
    }

    return `
基础信息:
  姓名: "${generatedName}，请参考这个名称，可以适当根据人物身份种族进行修改，**注意优先音译，禁止直译，狐族日式名称可译为中文汉字**"
  种族: "人类/狐族/永恒精灵/黑暗精灵"
  年龄: 数字
  国家: "国家名称，可虚构国家名称，但不要与已知国家重名，也可以使用大陆的名称"
  身份: "具体身份而非单纯的职业，如"白玫瑰骑士团团长/翡翠王国公主等"，10个字以内"
  出身: "出身等级，只能选择：平民/贵族/王族"
  性格:
    - "性格1"
    - "性格2"
    - "性格3"
    - "性格4"
    # 必须为四个**四字词语**${personalityStyle ? `，需要体现"${personalityStyle}"的特征，但不要完全一样` : ''}
  可战斗: true/false
    # 可战斗属性：根据身份判断，例如：战士、骑士、法师等战斗职业为true，商人、工匠、学者等非战斗职业为false
  单位类型: "physical/magical"
    # 魔法攻击职业为magical，物理攻击职业为physical

外貌数据:
  身高: 数字
  体重: 数字
  三围: "胸围-腰围-臀围，不需要带字母"
  罩杯: "A/B/C/D/E/F/G"
  描述: "使用100字左右优美细致的语言，从头到脚由宏观到细节描述人物整体，包含体型、肌肤/头发颜色、长度/眼睛/面容细节/四肢，**绝不要包含衣物**，如同是在拍摄写真一般，要有画面感${personalityStyle ? `。外貌描述需要体现"${personalityStyle}"的气质特征` : ''}"
  衣着: "所有衣着描述请使用**形容词+名词，例如深蓝色碎花裙**格式，无需量词，且如果此部位未穿着可以不输出此行"
    头部: "头部装饰/帽子/头盔"
    上装: "上装"
    下装: "下装"
    袜子: "袜子"
    鞋子: "鞋子"
    内衣: "内衣"
    装饰品: "装饰品"
    玩具: "性玩具/跳蛋/手铐/锁链"

敏感点: "例如：嘴巴/胸部/乳头/阴道/子宫/后庭/阴蒂/G点，选择一个部位"
描述: "详细描述此敏感点的物理特征和细节，最少50字"

隐藏特质:
  性经历: "性经验描述，最少10字${personalityStyle ? `，需要符合"${personalityStyle}"的特征` : ''}"
  恐惧: "恐惧内容，最少10字${personalityStyle ? `，与"${personalityStyle}"相关的内心恐惧` : ''}"
  害怕: "害怕内容，必须与恐惧字段内容完全一致${personalityStyle ? `，与"${personalityStyle}"相关的内心恐惧` : ''}"
  秘密: "秘密内容，最少10字${personalityStyle ? `，体现"${personalityStyle}"的隐藏面` : ''}"

成长经历:
  童年: "童年经历描述，最少50字${personalityStyle ? `，需要体现"${personalityStyle}"性格的形成原因` : ''}"
  青年: "青年经历描述，最少50字${personalityStyle ? `，展现"${personalityStyle}"特征的发展` : ''}"
  成年: "成年经历描述，最少50字${personalityStyle ? `，体现"${personalityStyle}"的成熟表现` : ''}"
  当前: "当前状态描述，最少50字${personalityStyle ? `，完全展现"${personalityStyle}"的特征` : ''}"

<herorules>
请为这个据点生成一个英雄人物，严格按照YAML格式输出，不要添加任何其他内容：

据点信息（以下信息请严格参考，增加代入感）：
- 类型：${locationType}
- 难度：${difficulty}/10
- 描述：${locationDescription}
- 大陆：${continent}
- 区域：${region}:${regionDescription}
${pictureResourcePrompt}

人物要求：
1. 与据点类型和难度相匹配的实力
2. 英雄的背景和身份应该与据点描述相符
3. 严格按照以上YAML格式输出，不要添加任何其他内容${
      personalityStyle
        ? `
4. **人物整体风格为：${personalityStyle}** - 请在人物的性格、外貌描述、成长经历、隐藏特质等各个方面都体现这种风格特征
5. 人物的性格特征、行为表现、内心想法都应该与"${personalityStyle}"这一风格保持一致
6. `
        : ''
    }**重要**：***人物的种族和基础外貌描述必须与图片Tags保持一致，但职业可以做参考，不要求完全一致，前提是符合Tags的人物装束***
</herorules>
`;
  }

  /**
   * 获取人物生成格式模板（纯格式定义，不包含据点信息）
   * 用于完全自定义模式，只返回格式要求，不包含游戏世界相关的设定
   * @param format 格式类型：'json' 或 'yaml'
   * @returns 格式模板字符串（只包含格式定义部分）
   */
  static getCharacterFormatTemplate(format: 'json' | 'yaml' = 'json'): string {
    if (format === 'yaml') {
      return `
基础信息:
  姓名: "角色名称，参考玩家指导"
  种族: "任意种族，参考玩家指导"
  年龄: 数字
  国家: "国家名称，可虚构国家名称，但不要与已知国家重名"
  身份: "具体身份而非单纯的职业，如"白玫瑰骑士团团长/翡翠王国公主等"，10个字以内"
  出身: "出身等级，只能选择：平民/贵族/王族"
  性格:
    - "性格1"
    - "性格2"
    - "性格3"
    - "性格4"
  单位类型: "physical/magical"
    # 魔法攻击职业为magical，物理攻击职业为physical
  战斗属性: {物理职业依赖攻击，魔法职业依赖智力}
    攻击: 数字 {0-100之间的整数，根据角色实力设定}
    防御: 数字 {0-100之间的整数，根据角色实力设定}
    智力: 数字 {0-100之间的整数，根据角色实力设定}
    速度: 数字 {0-100之间的整数，根据角色实力设定}
    生命: 数字 {0-100之间的整数，根据角色实力设定}
  体力: 数字 {100-200之间的整数，根据角色体质设定}
  生育力: 数字 {100-200之间的整数，根据角色体质设定}

外貌数据:
  身高: 数字
  体重: 数字
  三围: "胸围-腰围-臀围，不需要带字母"
  罩杯: "A/B/C/D/E/F/G"
  描述: "使用100字左右优美细致的语言，从头到脚由宏观到细节描述人物整体，包含体型、肌肤/头发颜色、长度/眼睛/面容细节/四肢，**绝不要包含衣物**，如同是在拍摄写真一般，要有画面感"
  衣着:
    头部: "头部装饰/帽子/头盔"
    上装: "上装"
    下装: "下装"
    袜子: "袜子"
    鞋子: "鞋子"
    内衣: "内衣"
    装饰品: "装饰品"
    玩具: "性玩具/跳蛋/手铐/锁链"
    # 所有衣着描述请使用**形容词+名词，例如深蓝色碎花裙**格式，无需量词，且如果此部位未穿着可以不输出此行

敏感点: "例如：嘴巴/胸部/乳头/阴道/子宫/后庭/阴蒂/G点，选择一个部位"
描述: "详细描述此敏感点的物理特征和细节，最少30字"

隐藏特质:
  性经历: "性经验描述，最少10字"
  恐惧: "恐惧内容，最少10字"
  害怕: "害怕内容，必须与恐惧字段内容完全一致"
  秘密: "秘密内容，最少10字"

成长经历:
  童年: "童年经历描述，最少50字"
  青年: "青年经历描述，最少50字"
  成年: "成年经历描述，最少50字"
  当前: "当前状态描述，最少50字"
`;
    } else {
      return `


{
  "基础信息": {
    "姓名": "角色名称，参考玩家指导",
    "种族": "任意种族，参考玩家指导",
    "年龄": 数字,
    "国家": "国家名称，可虚构国家名称，但不要与已知国家重名",
    "身份": "具体身份而非单纯的职业，如"白玫瑰骑士团团长/翡翠王国公主等"，10个字以内",
    "出身": "出身等级，只能选择：平民/贵族/王族",
    "性格": ["性格1", "性格2"...],
    "单位类型": "physical/magical" {魔法攻击职业为magical，物理攻击职业为physical},
    "战斗属性": {(物理职业依赖攻击，魔法职业依赖智力)
      "攻击": 数字 {0-100之间的整数，根据角色实力设定},
      "防御": 数字 {0-100之间的整数，根据角色实力设定},
      "智力": 数字 {0-100之间的整数，根据角色实力设定},
      "速度": 数字 {0-100之间的整数，根据角色实力设定},
      "生命": 数字 {0-100之间的整数，根据角色实力设定}
    },
    "体力": 数字 {100-200之间的整数，根据角色体质设定},
    "生育力": 数字 {100-200之间的整数，根据角色体质设定}
  },
  "外貌数据": {
    "身高": 数字,
    "体重": 数字,
    "三围": "胸围-腰围-臀围，不需要带字母",
    "罩杯": "A/B/C/D/E/F/G",
    "描述": "使用100字左右优美细致的语言，从头到脚由宏观到细节描述人物整体，包含体型、肌肤/头发颜色、长度/眼睛/面容细节/四肢，**绝不要包含衣物**，如同是在拍摄写真一般，要有画面感",
    "衣着": { "所有衣着描述请使用**形容词+名词，例如深蓝色碎花裙**格式，无需量词，且如果此部位未穿着可以不输出此行",
      "头部": "头部装饰/帽子/头盔",
      "上装": "上装",
      "下装": "下装",
      "袜子": "袜子",
      "鞋子": "鞋子",
      "内衣": "内衣",
      "装饰品": "装饰品",
      "玩具": "性玩具/跳蛋/手铐/锁链",
    }
  },
  "敏感点": "例如：嘴巴/胸部/乳头/阴道/子宫/后庭/阴蒂/G点，选择一个部位",
  "描述": "详细描述此敏感点的物理特征和细节，最少30字",
  "隐藏特质": {
    "性经历": "性经验描述，最少10字",
    "恐惧": "恐惧内容，最少10字",
    "害怕": "害怕内容，必须与恐惧字段内容完全一致",
    "秘密": "秘密内容，最少10字"
  },
  "成长经历": {
    "童年": "童年经历描述，最少50字",
    "青年": "青年经历描述，最少50字",
    "成年": "成年经历描述，最少50字",
    "当前": "当前状态描述，最少50字"
  }
}
`;
    }
  }

  /**
   * 解析英雄人物信息（支持JSON和YAML格式）
   * @param heroText 英雄人物文本
   * @param locationId 来源据点ID
   * @param locationType 据点类型
   * @param pictureResource 据点的图片资源信息（可选）
   * @returns 解析后的人物对象
   */
  static async parseHeroCharacter(
    heroText: string,
    locationId: string,
    locationType: Location['type'],
    pictureResource?: Location['pictureResource'],
    onCharacterUpdated?: (character: Character) => Promise<void>,
    isFullCustom: boolean = false,
  ): Promise<Character | null> {
    console.log('🚀 [人物生成] 开始处理英雄人物信息...');
    console.log('📍 [人物生成] 据点信息:', {
      据点ID: locationId,
      据点类型: locationType,
    });
    console.log('📝 [人物生成] AI输出长度:', heroText.length);

    // 先应用酒馆正则处理
    console.log('🔧 [人物生成] 应用酒馆正则处理...');
    const processedText = formatAsTavernRegexedString(heroText, 'ai_output', 'prompt');
    console.log('✅ [人物生成] 酒馆正则处理完成，文本长度:', processedText.length);

    // 1. 根据设置解析数据
    console.log('🔍 [人物生成] 步骤1: 开始解析数据...');

    // 获取人物生成格式设置
    const globalVars = getVariables({ type: 'global' });
    const format = (globalVars['character_generation_format'] as string) || 'json';

    console.log('📋 [人物生成] 使用解析格式:', format);

    // 创建重新解析回调函数
    const onRetry = async (editedText: string): Promise<void> => {
      console.log('🔄 [人物生成] 用户触发重新解析...');
      console.log('📝 [人物生成] 编辑后的文本长度:', editedText.length);

      // 重新应用酒馆正则处理
      const retryProcessedText = formatAsTavernRegexedString(editedText, 'ai_output', 'prompt');

      // 重新解析
      const retryParsedData =
        format === 'yaml'
          ? await CharacterParser.parseCharacterYaml(
              retryProcessedText,
              pictureResource,
              editedText,
              onRetry,
              isFullCustom,
            )
          : await CharacterParser.parseCharacterJson(
              retryProcessedText,
              pictureResource,
              editedText,
              onRetry,
              isFullCustom,
            );

      if (!retryParsedData) {
        console.error(`❌ [人物生成] ${format.toUpperCase()} 重新解析失败`);
        throw new Error(`重新解析失败，请检查编辑后的内容是否正确`);
      }

      console.log(`✅ [人物生成] ${format.toUpperCase()} 重新解析成功`);

      // 计算属性并构建完整的人物对象
      const retryCharacter = await CharacterAttributeCalculator.buildCharacter(
        retryParsedData,
        locationId,
        locationType,
        undefined,
        isFullCustom,
      );

      if (!retryCharacter) {
        console.error('❌ [人物生成] 重新解析后的人物构建失败');
        throw new Error('重新解析后的人物构建失败');
      }

      console.log('🎉 [人物生成] 重新解析并构建人物成功!');
      console.log('👤 [人物生成] 重新生成的人物:', retryCharacter.name);

      // 如果提供了回调函数，调用它来更新外部状态
      if (onCharacterUpdated) {
        await onCharacterUpdated(retryCharacter);
        console.log('✅ [人物生成] 已通过回调更新外部状态');
      }
    };

    // 根据设置选择解析方式
    const parsedData =
      format === 'yaml'
        ? await CharacterParser.parseCharacterYaml(processedText, pictureResource, heroText, onRetry, isFullCustom)
        : await CharacterParser.parseCharacterJson(processedText, pictureResource, heroText, onRetry, isFullCustom);

    if (!parsedData) {
      console.error(`❌ [人物生成] ${format.toUpperCase()} 解析失败，无法继续处理`);
      return null;
    }

    console.log(`✅ [人物生成] ${format.toUpperCase()} 解析成功，获得解析数据`);

    // 2. 计算属性并构建完整的人物对象
    console.log('🔧 [人物生成] 步骤2: 开始计算属性并构建人物对象...');
    const character = await CharacterAttributeCalculator.buildCharacter(
      parsedData,
      locationId,
      locationType,
      undefined,
      isFullCustom,
    );

    if (character) {
      console.log('🎉 [人物生成] 英雄人物生成成功!');
      console.log('👤 [人物生成] 最终人物:', character.name);
    } else {
      console.error('❌ [人物生成] 人物构建失败');
    }

    return character;
  }
}
