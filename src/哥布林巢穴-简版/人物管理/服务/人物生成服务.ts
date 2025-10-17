import { continentExploreService } from '../../探索/服务/大陆探索服务';
import type { Location } from '../../探索/类型/探索类型';
import type { Character } from '../类型/人物类型';
import { CharacterAttributeCalculator } from './人物属性计算服务';
import { CharacterParser } from './人物解析服务';

/**
 * 英雄人物判定服务
 * 根据据点类型和难度判定是否出现英雄人物
 */
export class HeroDeterminationService {
  /**
   * 人物性格风格分类 - 用于随机筛子
   */
  private static readonly PERSONALITY_CATEGORIES = {
    // 基础性格 - 突出人物的核心性格特征
    基础性格类: ['淫荡放纵', '纯洁无暇', '高傲冷漠', '温柔善良', '坚强勇敢', '懦弱胆小'],

    // 道德倾向 - 突出对性和道德的态度
    道德倾向类: ['已经堕落', '正在堕落', '完全纯洁', '半推半就', '内心挣扎', '自甘堕落'],

    // 行为方式 - 突出行动和处事风格
    行为方式类: ['主动出击', '被动等待', '喜欢控制', '甘愿被控', '反抗精神', '顺从听话'],

    // 情感需求 - 突出内心的情感渴望
    情感需求类: ['好色贪欢', '渴望关爱', '害怕亲密', '依赖他人', '独立自主', '孤独寂寞'],

    // 心理状态 - 突出内心的特殊状态或创伤
    心理状态类: ['心理创伤', '童年阴影', '复仇心切', '愧疚自责', '自卑敏感', '骄傲自大'],
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
   * 根据据点类型和难度判定是否出现英雄
   * @param locationType 据点类型
   * @param difficulty 难度
   * @returns 是否出现英雄
   */
  static shouldHaveHero(locationType: Location['type'], difficulty: number): boolean {
    const random = Math.random();
    const baseProbability = this.getBaseProbability(locationType, difficulty);
    return random < baseProbability;
  }

  /**
   * 获取基础概率
   * @param locationType 据点类型
   * @param difficulty 难度
   * @returns 基础概率
   */
  private static getBaseProbability(locationType: Location['type'], difficulty: number): number {
    // 根据据点类型的基础概率
    const typeProbabilities: Record<Location['type'], number> = {
      village: 0.3, // 村庄：30%概率
      town: 0.5, // 城镇：50%概率
      fortress: 0.7, // 要塞：70%概率
      ruins: 0.2, // 废墟：20%概率
      dungeon: 0.4, // 地牢：40%概率
      city: 0.8, // 城市：80%概率
    };

    // 根据星级难度计算修正系数：1星=0.5倍，10星=1.5倍
    const difficultyMultiplier = 0.4 + (difficulty - 1) * 0.1; // 1星=0.4，10星=1.3

    const baseProb = typeProbabilities[locationType] || 0.3;

    return Math.min(0.9, baseProb * difficultyMultiplier); // 最大90%概率
  }

  /**
   * 生成英雄人物提示词
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

    // 随机选择性格风格组合
    const personalityStyle = this.rollPersonalityStylesCombination();
    console.log('🎲 [人物生成] 随机性格筛子结果:', personalityStyle);

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
    "姓名": "${generatedName}，请参考这个名称，可以适当根据人物身份进行修改，**注意优先音译，禁止直译**",
    "种族": "人类/狐族/永恒精灵/黑暗精灵",
    "年龄": 数字,
    "国家": "国家名称",
    "身份": "具体身份而非单纯的职业，如"白玫瑰骑士团团长/翡翠王国公主等"，10个字以内",
    "出身": "出身等级，只能选择：平民/贵族/王族",
    "性格": ["性格1", "性格2"...必须为四个**四字词语**，需要体现"${personalityStyle}"的特征，但不要完全一样],
    "可战斗": true/false {可战斗属性：根据身份判断，例如：战士、骑士、法师等战斗职业为true，商人、工匠、学者等非战斗职业为false},
    "单位类型": "physical/magical" {魔法攻击职业为magical，物理攻击职业为physical}
  },
  "外貌数据": {
    "身高": 数字,
    "体重": 数字,
    "三围": "胸围-腰围-臀围，不需要带字母",
    "罩杯": "A/B/C/D/E/F/G",
    "描述": "使用最少150字优美细致的语言，从头到脚由宏观到细节描述人物整体，包含体型、肌肤/头发颜色、长度/眼睛/面容细节/四肢，如同是在拍摄写真一般，要有画面感。外貌描述需要体现"${personalityStyle}"的气质特征"
    "衣着": {
      "头部": "头部装饰/帽子/头盔，所有衣着描述请使用**形容词+名词结构，例如深蓝色碎花裙**格式，且如果此部位未穿着可以不输出此行",
      "上装": "上装",
      "下装": "下装",
      "袜子": "袜子",
      "鞋子": "鞋子",
      "内衣": "内衣",
      "装饰品": "装饰品",
      "玩具": "性玩具/跳蛋/手铐/锁链",
    }
  },
  "成长经历": {
    "童年": "童年经历描述，最少100字，需要体现"${personalityStyle}"性格的形成原因",
    "青年": "青年经历描述，最少100字，展现"${personalityStyle}"特征的发展", 
    "成年": "成年经历描述，最少100字，体现"${personalityStyle}"的成熟表现",
    "当前": "当前状态描述，最少100字，完全展现"${personalityStyle}"的特征"
  },
  "隐藏特质": {
    "性经历": "性经验描述，最少20字，需要符合"${personalityStyle}"的特征",
    "恐惧": "恐惧内容，最少20字，与"${personalityStyle}"相关的内心恐惧",
    "秘密": "秘密内容，最少20字，体现"${personalityStyle}"的隐藏面"
  },
  "敏感点": {
    "嘴巴": {
      "敏感": true/false,
      "描述": "最少30字细节描述此器官，**注意只能有一个部位为true，其他都为false**"
    },
    "胸部": {
      "敏感": true/false,
      "描述": "最少30字细节描述此器官"
    },
    "阴道": {
      "敏感": true/false,
      "描述": "最少30字细节描述此器官"
    },
    "子宫": {
      "敏感": true/false,
      "描述": "最少30字细节描述此器官"
    },
    "后庭": {
      "敏感": true/false,
      "描述": "最少30字细节描述此器官"
    }
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
3. 严格按照以下JSON格式输出，不要添加任何其他内容
4. **人物整体风格为：${personalityStyle}** - 请在人物的性格、外貌描述、成长经历、隐藏特质等各个方面都体现这种风格特征
5. 人物的性格特征、行为表现、内心想法都应该与"${personalityStyle}"这一风格保持一致
6. **重要**：***人物的种族和基础外貌描述必须与图片Tags保持一致，但职业可以做参考，不要求完全一致，前提是符合Tags的人物装束***
</herorules>
`;
  }

  /**
   * 解析英雄人物信息
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
  ): Promise<Character | null> {
    console.log('🚀 [人物生成] 开始处理英雄人物信息...');
    console.log('📍 [人物生成] 据点信息:', {
      据点ID: locationId,
      据点类型: locationType,
    });
    console.log('📝 [人物生成] AI输出长度:', heroText.length);

    // 1. 解析JSON数据
    console.log('🔍 [人物生成] 步骤1: 开始解析JSON数据...');
    const parsedData = CharacterParser.parseCharacterJson(heroText, pictureResource);
    if (!parsedData) {
      console.error('❌ [人物生成] JSON解析失败，无法继续处理');
      return null;
    }
    console.log('✅ [人物生成] JSON解析成功，获得解析数据');

    // 2. 计算属性并构建完整的人物对象
    console.log('🔧 [人物生成] 步骤2: 开始计算属性并构建人物对象...');
    const character = await CharacterAttributeCalculator.buildCharacter(parsedData, locationId, locationType);

    if (character) {
      console.log('🎉 [人物生成] 英雄人物生成成功!');
      console.log('👤 [人物生成] 最终人物:', character.name);
    } else {
      console.error('❌ [人物生成] 人物构建失败');
    }

    return character;
  }
}
