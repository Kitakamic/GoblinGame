/**
 * 人物属性计算服务
 * 负责计算人物的各项属性，并构建完整的Character对象
 */
import type {
  BackgroundType,
  Character,
  CharacterAppearance,
  CharacterAttributes,
  CharacterRating,
} from '../类型/人物类型';
import type { ParsedCharacterData } from './人物解析服务';

export class CharacterAttributeCalculator {
  // ==================== 主要计算方法 ====================

  /**
   * 计算人物评级
   * @param race 种族
   * @param age 年龄
   * @param appearance 外貌信息
   * @param background 出身等级
   * @returns 计算出的评级
   */
  static calculateRating(
    race: string,
    age: number,
    appearance: CharacterAppearance,
    background: BackgroundType = '平民',
  ): CharacterRating {
    let score = 0;

    // 1. 种族评分 (0-30分)
    const raceScore = this.getRaceScore(race);
    score += raceScore;
    console.log(`🏷️ [评级计算] 种族评分: ${race} = ${raceScore}分`);

    // 2. 年龄评分 (0-20分)
    const ageScore = this.getAgeScore(age);
    score += ageScore;
    console.log(`🎂 [评级计算] 年龄评分: ${age}岁 = ${ageScore}分`);

    // 3. 外貌评分 (0-25分)
    const appearanceScore = this.getAppearanceScore(appearance);
    score += appearanceScore;
    console.log(
      `👤 [评级计算] 外貌评分: ${appearanceScore}分 (身高:${appearance.height}cm, 体重:${appearance.weight}kg, 罩杯:${appearance.cupSize})`,
    );

    // 4. 出身背景评分 (0-15分)
    const backgroundScore = this.getBackgroundScore(background);
    score += backgroundScore;
    console.log(`👑 [评级计算] 出身评分: ${background} = ${backgroundScore}分`);

    // 5. 随机筛子评分 (0-15分) - 增加趣味性
    const randomScore = this.getRandomDiceScore();
    score += randomScore;
    console.log(`🎲 [评级计算] 随机评分: ${randomScore}分`);

    console.log(
      `📊 [评级计算] 总分: ${score}分 (种族:${raceScore} + 年龄:${ageScore} + 外貌:${appearanceScore} + 出身:${backgroundScore} + 随机:${randomScore})`,
    );

    // 根据总分计算评级
    const rating = this.scoreToRating(score);
    console.log(`⭐ [评级计算] 最终评级: ${rating}级`);
    return rating;
  }

  /**
   * 计算人物五维战斗属性
   * @param race 种族
   * @param age 年龄
   * @param rating 评级
   * @param locationType 据点类型（可选）
   * @returns 五维属性
   */
  static calculateAttributes(
    race: string,
    age: number,
    rating: CharacterRating,
    locationType?: string,
  ): CharacterAttributes {
    // 基础属性
    let attack = 10;
    let defense = 10;
    let intelligence = 10;
    let speed = 10;
    let health = 40;

    // 种族加成
    const raceBonus = this.getRaceAttributeBonus(race);
    attack += raceBonus.attack;
    defense += raceBonus.defense;
    intelligence += raceBonus.intelligence;
    speed += raceBonus.speed;
    health += raceBonus.health;

    // 年龄影响
    const ageBonus = this.getAgeAttributeBonus(age);
    attack += ageBonus.attack;
    defense += ageBonus.defense;
    intelligence += ageBonus.intelligence;
    speed += ageBonus.speed;
    health += ageBonus.health;

    // 评级加成（百分比）
    const ratingBonus = this.getRatingAttributeBonus(rating);
    attack = Math.floor(attack * (1 + ratingBonus.attack));
    defense = Math.floor(defense * (1 + ratingBonus.defense));
    intelligence = Math.floor(intelligence * (1 + ratingBonus.intelligence));
    speed = Math.floor(speed * (1 + ratingBonus.speed));
    health = Math.floor(health * (1 + ratingBonus.health));

    // 据点类型加成
    if (locationType) {
      const locationBonus = this.getLocationAttributeBonus(locationType);
      attack += locationBonus.attack;
      defense += locationBonus.defense;
      intelligence += locationBonus.intelligence;
      speed += locationBonus.speed;
      health += locationBonus.health;
    }

    return {
      attack: Math.max(1, attack),
      defense: Math.max(1, defense),
      intelligence: Math.max(1, intelligence),
      speed: Math.max(1, speed),
      health: Math.max(10, health),
    };
  }

  /**
   * 计算体力值
   * @param race 种族
   * @param age 年龄
   * @param rating 评级
   * @param appearance 外观信息
   * @returns 体力值
   */
  static calculateStamina(race: string, age: number, rating: CharacterRating, appearance: CharacterAppearance): number {
    let stamina = 50; // 基础体力

    // 种族加成
    const raceBonus = this.getRaceStaminaBonus(race);
    stamina += raceBonus;

    // 年龄影响
    const ageBonus = this.getAgeStaminaBonus(age);
    stamina += ageBonus;

    // 评级加成
    const ratingBonus = this.getRatingStaminaBonus(rating);
    stamina += ratingBonus;

    // 身高体重影响（BMI计算）
    if (appearance) {
      const bmi = appearance.weight / Math.pow(appearance.height / 100, 2);
      const bmiBonus = this.getBmiStaminaBonus(bmi);
      stamina += bmiBonus;
    }

    // 确保体力值在合理范围内，生成时就是最大值
    return Math.max(50, Math.min(200, stamina));
  }

  /**
   * 计算生育力值
   * @param race 种族
   * @param age 年龄
   * @param rating 评级
   * @param appearance 外观信息
   * @returns 生育力值
   */
  static calculateFertility(
    race: string,
    age: number,
    rating: CharacterRating,
    appearance: CharacterAppearance,
  ): number {
    let fertility = 30; // 基础生育力

    // 种族加成
    const raceBonus = this.getRaceFertilityBonus(race);
    fertility += raceBonus;

    // 年龄影响（最佳生育年龄）
    const ageBonus = this.getAgeFertilityBonus(age);
    fertility += ageBonus;

    // 评级加成
    const ratingBonus = this.getRatingFertilityBonus(rating);
    fertility += ratingBonus;

    // 罩杯影响
    if (appearance && appearance.cupSize) {
      const cupBonus = this.getCupSizeFertilityBonus(appearance.cupSize);
      fertility += cupBonus;
    }

    // 确保生育力值在合理范围内，生成时就是最大值
    return Math.max(50, Math.min(200, fertility));
  }

  // ==================== 评级相关计算方法 ====================

  /**
   * 获取种族评分
   * @param race 种族
   * @returns 种族评分
   */
  private static getRaceScore(race: string): number {
    const raceScores: Record<string, number> = {
      // 普通种族
      人类: 10,
      狐族: 18,

      // 精灵种族
      永恒精灵: 20,
      黑暗精灵: 18,
    };

    return raceScores[race] || 10;
  }

  /**
   * 获取年龄评分
   * @param age 年龄
   * @returns 年龄评分
   */
  private static getAgeScore(age: number): number {
    if (age < 16) return 5; // 未成年
    if (age < 20) return 15; // 青春年华
    if (age < 25) return 20; // 最佳年龄
    if (age < 30) return 18; // 成熟期
    if (age < 35) return 15; // 成熟期
    if (age < 40) return 12; // 中年期
    if (age < 50) return 8; // 中年期
    return 5; // 老年期
  }

  /**
   * 获取外貌评分
   * @param appearance 外貌信息
   * @returns 外貌评分
   */
  private static getAppearanceScore(appearance: CharacterAppearance): number {
    let score = 0;

    // 身高评分 (0-8分)
    score += this.getHeightScore(appearance.height);

    // 体重评分 (0-7分)
    score += this.getWeightScore(appearance.weight, appearance.height);

    // 罩杯评分 (0-10分)
    score += this.getCupSizeScore(appearance.cupSize);

    return Math.min(25, score); // 最高25分
  }

  /**
   * 获取身高评分
   * @param height 身高(cm)
   * @returns 身高评分
   */
  private static getHeightScore(height: number): number {
    if (height < 150) return 3; // 偏矮
    if (height < 160) return 5; // 较矮
    if (height < 165) return 7; // 标准
    if (height < 170) return 8; // 理想
    if (height < 175) return 7; // 较高
    if (height < 180) return 5; // 很高
    return 3; // 过高
  }

  /**
   * 获取体重评分（基于BMI）
   * @param weight 体重(kg)
   * @param height 身高(cm)
   * @returns 体重评分
   */
  private static getWeightScore(weight: number, height: number): number {
    const bmi = weight / Math.pow(height / 100, 2);

    if (bmi < 16) return 2; // 过瘦
    if (bmi < 18.5) return 4; // 偏瘦
    if (bmi < 20) return 6; // 理想偏瘦
    if (bmi < 22) return 7; // 理想
    if (bmi < 24) return 6; // 理想偏胖
    if (bmi < 26) return 4; // 偏胖
    if (bmi < 28) return 2; // 较胖
    return 1; // 肥胖
  }

  /**
   * 获取罩杯评分
   * @param cupSize 罩杯
   * @returns 罩杯评分
   */
  private static getCupSizeScore(cupSize?: string): number {
    if (!cupSize) return 5; // 默认评分

    const cupScores: Record<string, number> = {
      A: 6,
      B: 7,
      C: 8,
      D: 9,
      E: 8,
      F: 7,
      G: 6,
    };

    return cupScores[cupSize.toUpperCase()] || 5;
  }

  /**
   * 获取出身背景评分（简化版：平民/贵族/王族）
   * @param background 出身等级
   * @returns 出身评分
   */
  private static getBackgroundScore(background: BackgroundType): number {
    const backgroundScores: Record<BackgroundType, number> = {
      王族: 15, // 王族：15分
      贵族: 10, // 贵族：10分
      平民: 5, // 平民：5分
    };

    return backgroundScores[background];
  }

  /**
   * 获取随机筛子评分（增加趣味性）
   * @returns 随机评分 (0-15分)
   */
  private static getRandomDiceScore(): number {
    // 模拟3个6面筛子，最小3分，最大18分，转换为0-15分
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const dice3 = Math.floor(Math.random() * 6) + 1;

    const totalDice = dice1 + dice2 + dice3;
    // 将3-18的范围映射到0-15
    return Math.max(0, Math.min(15, totalDice - 3));
  }

  /**
   * 将评分转换为评级
   * @param score 总分
   * @returns 评级
   */
  private static scoreToRating(score: number): CharacterRating {
    if (score >= 90) return 'S'; // 90分以上为S级（提高门槛）
    if (score >= 75) return 'A'; // 75-89分为A级（提高门槛）
    if (score >= 60) return 'B'; // 60-74分为B级（提高门槛）
    if (score >= 45) return 'C'; // 45-59分为C级（提高门槛）
    return 'D'; // 45分以下为D级
  }

  // ==================== 战斗属性计算方法 ====================

  /**
   * 获取种族属性加成
   */
  private static getRaceAttributeBonus(race: string): CharacterAttributes {
    const raceMap: Record<string, CharacterAttributes> = {
      人类: { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 },
      狐族: { attack: 2, defense: 1, intelligence: 2, speed: 3, health: 8 },
      永恒精灵: { attack: 1, defense: 0, intelligence: 3, speed: 2, health: 5 },
      黑暗精灵: { attack: 2, defense: 1, intelligence: 2, speed: 2, health: 4 },
    };
    return raceMap[race] || { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 };
  }

  /**
   * 获取年龄属性加成
   */
  private static getAgeAttributeBonus(age: number): CharacterAttributes {
    if (age < 18) return { attack: -1, defense: -1, intelligence: 0, speed: 1, health: -3 };
    if (age < 25) return { attack: 1, defense: 0, intelligence: 0, speed: 1, health: 3 };
    if (age < 30) return { attack: 2, defense: 1, intelligence: 1, speed: 0, health: 2 };
    if (age < 40) return { attack: 0, defense: 1, intelligence: 2, speed: 0, health: 1 };
    if (age < 50) return { attack: 0, defense: 0, intelligence: 1, speed: -1, health: 0 };
    return { attack: -1, defense: 0, intelligence: 0, speed: -1, health: -2 };
  }

  /**
   * 获取评级属性加成（百分比）
   */
  private static getRatingAttributeBonus(rating: CharacterRating): CharacterAttributes {
    const ratingMap: Record<CharacterRating, CharacterAttributes> = {
      S: { attack: 0.5, defense: 0.5, intelligence: 0.5, speed: 0.5, health: 0.4 }, // 50%攻击防御智力速度，40%血量
      A: { attack: 0.35, defense: 0.35, intelligence: 0.35, speed: 0.35, health: 0.25 }, // 35%攻击防御智力速度，25%血量
      B: { attack: 0.2, defense: 0.2, intelligence: 0.2, speed: 0.2, health: 0.15 }, // 20%攻击防御智力速度，15%血量
      C: { attack: 0.1, defense: 0.1, intelligence: 0.1, speed: 0.1, health: 0.08 }, // 10%攻击防御智力速度，8%血量
      D: { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 }, // 无加成
    };
    return ratingMap[rating] || { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 };
  }

  /**
   * 获取据点类型属性加成
   */
  private static getLocationAttributeBonus(locationType: string): CharacterAttributes {
    const locationMap: Record<string, CharacterAttributes> = {
      // 村庄：偏向智力和速度，防御较低
      village: { attack: 0, defense: -1, intelligence: 2, speed: 2, health: 0 },
      // 城镇：平衡发展，各项属性相对平均
      town: { attack: 1, defense: 1, intelligence: 1, speed: 1, health: 2 },
      // 要塞：偏向攻击和防御，速度较低
      fortress: { attack: 2, defense: 2, intelligence: 0, speed: -1, health: 3 },
      // 废墟：偏向智力和速度，血量较低
      ruins: { attack: 0, defense: 0, intelligence: 2, speed: 2, health: -2 },
      // 地牢：偏向攻击和血量，智力较低
      dungeon: { attack: 2, defense: 0, intelligence: -1, speed: 0, health: 3 },
    };
    return locationMap[locationType] || { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 };
  }

  // ==================== 体力相关计算方法 ====================

  /**
   * 获取种族体力加成
   */
  private static getRaceStaminaBonus(race: string): number {
    const raceMap: Record<string, number> = {
      人类: 0,
      狐族: 20,
      永恒精灵: 10,
      黑暗精灵: 8,
    };
    return raceMap[race] || 0;
  }

  /**
   * 获取年龄体力加成
   */
  private static getAgeStaminaBonus(age: number): number {
    if (age < 18) return -10;
    if (age < 25) return 10;
    if (age < 30) return 5;
    if (age < 40) return 0;
    if (age < 50) return -5;
    return -15;
  }

  /**
   * 获取评级体力加成
   */
  private static getRatingStaminaBonus(rating: CharacterRating): number {
    const ratingMap: Record<CharacterRating, number> = {
      S: 20,
      A: 15,
      B: 10,
      C: 5,
      D: 0,
    };
    return ratingMap[rating] || 0;
  }

  /**
   * 获取BMI体力加成
   */
  private static getBmiStaminaBonus(bmi: number): number {
    if (bmi < 18.5) return -5; // 偏瘦
    if (bmi < 24) return 5; // 正常
    if (bmi < 28) return 0; // 偏胖
    return -10; // 肥胖
  }

  // ==================== 生育力相关计算方法 ====================

  /**
   * 获取种族生育力加成
   */
  private static getRaceFertilityBonus(race: string): number {
    const raceMap: Record<string, number> = {
      人类: 0,
      狐族: 25,
      永恒精灵: 15,
      黑暗精灵: 12,
    };
    return raceMap[race] || 0;
  }

  /**
   * 获取年龄生育力加成
   */
  private static getAgeFertilityBonus(age: number): number {
    if (age < 18) return -20;
    if (age < 25) return 15;
    if (age < 30) return 20;
    if (age < 35) return 10;
    if (age < 40) return 0;
    if (age < 45) return -10;
    return -25;
  }

  /**
   * 获取评级生育力加成
   */
  private static getRatingFertilityBonus(rating: CharacterRating): number {
    const ratingMap: Record<CharacterRating, number> = {
      S: 25,
      A: 20,
      B: 15,
      C: 10,
      D: 5,
    };
    return ratingMap[rating] || 0;
  }

  /**
   * 获取罩杯生育力加成
   */
  private static getCupSizeFertilityBonus(cupSize: string): number {
    const cupMap: Record<string, number> = {
      A: 5,
      B: 10,
      C: 15,
      D: 20,
      E: 25,
      F: 30,
      G: 35,
    };
    return cupMap[cupSize.toUpperCase()] || 0;
  }

  // ==================== 人物构建方法 ====================

  /**
   * 根据身份和种族确定单位类型
   * @param identity 身份/称号
   * @param race 种族
   * @returns 单位类型
   */
  private static determineUnitType(
    identity: string,
    race: string,
  ): 'physical' | 'magical' | 'hybrid' | 'defensive' | 'agile' {
    const identityLower = identity.toLowerCase();

    // 根据身份关键词判断单位类型
    if (
      identityLower.includes('法师') ||
      identityLower.includes('魔法') ||
      identityLower.includes('术士') ||
      identityLower.includes('萨满') ||
      identityLower.includes('牧师') ||
      identityLower.includes('mage') ||
      identityLower.includes('wizard') ||
      identityLower.includes('sorcerer')
    ) {
      return 'magical';
    }

    if (
      identityLower.includes('刺客') ||
      identityLower.includes('盗贼') ||
      identityLower.includes('游侠') ||
      identityLower.includes('弓手') ||
      identityLower.includes('assassin') ||
      identityLower.includes('rogue') ||
      identityLower.includes('archer') ||
      identityLower.includes('ranger')
    ) {
      return 'agile';
    }

    if (
      identityLower.includes('守卫') ||
      identityLower.includes('盾') ||
      identityLower.includes('坦克') ||
      identityLower.includes('guard') ||
      identityLower.includes('defender') ||
      identityLower.includes('tank')
    ) {
      return 'defensive';
    }

    if (
      identityLower.includes('圣骑士') ||
      identityLower.includes('战法师') ||
      identityLower.includes('魔剑士') ||
      identityLower.includes('paladin') ||
      identityLower.includes('spellsword')
    ) {
      return 'hybrid';
    }

    // 根据种族特性判断
    if (race === '永恒精灵' || race === '黑暗精灵') {
      return 'magical';
    }

    if (race === '狐族') {
      return 'agile';
    }

    // 默认为物理类型
    return 'physical';
  }

  /**
   * 计算英雄等级
   * @param locationType 据点类型
   * @param rating 人物评级
   * @returns 计算出的英雄等级
   */
  private static calculateHeroLevel(locationType?: string, rating?: string): number {
    let baseLevel = 3; // 基础等级

    // 根据据点类型调整等级
    switch (locationType) {
      case 'village':
        baseLevel = 2;
        break;
      case 'town':
        baseLevel = 3;
        break;
      case 'city':
        baseLevel = 5;
        break;
      case 'fortress':
        baseLevel = 4;
        break;
      case 'dungeon':
        baseLevel = 6;
        break;
      case 'ruins':
        baseLevel = 4;
        break;
      default:
        baseLevel = 3;
    }

    // 根据评级调整等级
    switch (rating) {
      case 'S':
        baseLevel += 3;
        break;
      case 'A':
        baseLevel += 2;
        break;
      case 'B':
        baseLevel += 1;
        break;
      case 'C':
        baseLevel += 0;
        break;
      case 'D':
        baseLevel -= 1;
        break;
      default:
        baseLevel += 0;
    }

    // 确保等级在合理范围内
    return Math.max(1, Math.min(10, baseLevel));
  }

  /**
   * 构建完整的人物对象
   * @param parsedData 解析后的人物数据
   * @param locationId 来源据点ID（可选）
   * @param locationType 据点类型（可选）
   * @returns 构建后的Character对象
   */
  static async buildCharacter(
    parsedData: ParsedCharacterData,
    locationId?: string,
    locationType?: string,
  ): Promise<Character | null> {
    try {
      console.log('🔧 [属性计算] 开始构建人物对象...');
      console.log('📊 [属性计算] 输入数据:', {
        姓名: parsedData.name,
        种族: parsedData.race,
        年龄: parsedData.age,
        出身: parsedData.background,
        据点类型: locationType || '未指定',
      });

      // 验证解析数据
      if (!parsedData || !parsedData.name) {
        console.warn('❌ [属性计算] 人物数据验证失败: 缺少必要字段');
        return null;
      }

      // 生成唯一ID
      const id = this.generateCharacterId(parsedData.name);
      console.log('🆔 [属性计算] 生成唯一ID:', id);

      // 计算评级
      console.log('⭐ [属性计算] 开始计算人物评级...');
      const rating = this.calculateRating(
        parsedData.race,
        parsedData.age,
        parsedData.appearance,
        parsedData.background,
      );
      console.log('🎯 [属性计算] 评级计算完成:', rating);

      // 计算战斗属性（完全由系统计算，确保平衡性）
      console.log('⚔️ [属性计算] 开始计算战斗属性...');
      const attributes = this.calculateAttributes(parsedData.race, parsedData.age, rating, locationType);
      console.log('🛡️ [属性计算] 战斗属性计算完成:', attributes);

      // 计算体力和生育力
      console.log('💪 [属性计算] 开始计算体力和生育力...');
      const stamina = this.calculateStamina(parsedData.race, parsedData.age, rating, parsedData.appearance);
      const fertility = this.calculateFertility(parsedData.race, parsedData.age, rating, parsedData.appearance);
      console.log('📊 [属性计算] 体力和生育力计算完成:', {
        体力: stamina,
        生育力: fertility,
      });

      // 提取敏感点名称
      console.log('🎯 [属性计算] 开始提取敏感点信息...');
      const sensitivePoints =
        parsedData.sensitivePointsDetail?.filter((point: any) => point.isSensitive)?.map((point: any) => point.part) ||
        [];
      console.log('💫 [属性计算] 敏感点提取完成:', {
        敏感点数量: sensitivePoints.length,
        敏感点列表: sensitivePoints,
      });

      // 构建Character对象
      console.log('🏗️ [属性计算] 开始构建Character对象...');

      // 根据据点类型和难度计算英雄等级
      const heroLevel = this.calculateHeroLevel(locationType, rating);
      console.log('⭐ [属性计算] 英雄等级计算完成:', heroLevel);

      const character: Character = {
        // 基础信息
        id,
        name: parsedData.name,
        title: parsedData.identity,
        rating,
        avatar: parsedData.avatar || '',
        favorite: false,

        // 状态信息
        status: parsedData.canCombat ? 'enemy' : 'uncaptured',
        locationId,
        capturedAt: undefined, // 新生成的人物还未被捕获
        canCombat: parsedData.canCombat,

        // 属性信息
        loyalty: 0,
        stamina,
        fertility,
        offspring: 0,
        maxStamina: stamina,
        maxFertility: fertility,

        // 战斗属性
        level: heroLevel,
        attributes,
        deployedAttributes: undefined,
        troopDeployment: undefined,

        // 训练信息
        lastTraining: undefined,

        // 生育记录
        breedingRecords: [],

        // 详细人物信息
        race: parsedData.race as any,
        age: parsedData.age,
        country: parsedData.country,
        background: parsedData.background,
        unitType: this.determineUnitType(parsedData.identity, parsedData.race),
        canLeadRaces: [parsedData.race as any], // AI生成的英雄可以带领同种族
        sexExperience: parsedData.hiddenTraits?.sexExperience || '未知',
        sensitivePoints,
        sensitivePointsDetail: parsedData.sensitivePointsDetail || [],
        lifeStory: parsedData.lifeStory || { childhood: [], adolescence: [], adulthood: [], currentState: [] },
        personality: parsedData.personality || [],
        fears: parsedData.hiddenTraits?.fears || '未知',
        secrets: parsedData.hiddenTraits?.secrets || '未知',
        appearance: parsedData.appearance,
      };

      console.log('🎉 [属性计算] 人物构建成功!');
      console.log('📋 [属性计算] 最终人物信息:', {
        姓名: character.name,
        身份: character.title,
        评级: character.rating,
        种族: character.race,
        年龄: character.age,
        国家: character.country,
        出身: character.background,
        攻击力: character.attributes.attack,
        防御力: character.attributes.defense,
        智力: character.attributes.intelligence,
        速度: character.attributes.speed,
        血量: character.attributes.health,
        体力: character.stamina,
        生育力: character.fertility,
        敏感点: character.sensitivePoints,
      });

      // 自动将人物加入世界书（未捕获和敌人状态的人物）
      if (character.status === 'uncaptured' || character.status === 'enemy') {
        console.log('📚 [属性计算] 开始将人物加入世界书...');
        try {
          // 动态导入世界书服务，避免循环依赖
          const { WorldbookService } = await import('../../世界书管理/世界书服务');
          await WorldbookService.createCharacterWorldbook(character);
          console.log('✅ [属性计算] 人物已成功加入世界书');
        } catch (error) {
          console.error('❌ [属性计算] 将人物加入世界书失败:', error);
          // 不影响人物创建，继续返回人物对象
        }
      } else {
        console.log('ℹ️ [属性计算] 人物状态为', character.status, '，跳过世界书加入');
      }

      console.log('✅ [属性计算] 返回完整Character对象');
      return character;
    } catch (error) {
      console.error('构建人物对象失败:', error);
      return null;
    }
  }

  /**
   * 生成人物唯一ID
   * @param name 人物姓名
   * @returns 唯一ID
   */
  private static generateCharacterId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `char_${name}_${timestamp}_${random}`;
  }
}
