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
    difficulty?: number,
  ): CharacterRating {
    let score = 0;

    // 1. 种族评分 (0-30分)
    const raceScore = this.getRaceScore(race);
    score += raceScore;
    console.log(`🏷️ [评级计算] 种族评分: ${race} = ${raceScore}分`);

    // 2. 年龄评分 (0-20分)
    const ageScore = this.getAgeScore(age, race);
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

    // 6. 难度修正 (0-10分) - 高难度据点更容易出高评级人物
    let difficultyScore = 0;
    if (difficulty && difficulty > 1) {
      difficultyScore = Math.min(10, (difficulty - 1) * 1.2); // 1星=0, 10星=10.8≈10分
      score += Math.floor(difficultyScore);
      console.log(`⚔️ [评级计算] 难度评分: ${difficulty}星 = ${Math.floor(difficultyScore)}分`);
    }

    console.log(
      `📊 [评级计算] 总分: ${score}分 (种族:${raceScore} + 年龄:${ageScore} + 外貌:${appearanceScore} + 出身:${backgroundScore} + 随机:${randomScore}${difficultyScore > 0 ? ` + 难度:${Math.floor(difficultyScore)}` : ''})`,
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
    // 基础属性（大幅提升基础值）
    let attack = 20;
    let defense = 20;
    let intelligence = 20;
    let speed = 20;
    let health = 100;

    // 种族加成
    const raceBonus = this.getRaceAttributeBonus(race);
    attack += raceBonus.attack;
    defense += raceBonus.defense;
    intelligence += raceBonus.intelligence;
    speed += raceBonus.speed;
    health += raceBonus.health;

    // 年龄影响（适配长寿种族）
    const ageBonus = this.getAgeAttributeBonus(age, race);
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

    // 年龄影响（适配长寿种族）
    const ageBonus = this.getAgeStaminaBonus(age, race);
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

    // 年龄影响（最佳生育年龄，适配长寿种族）
    const ageBonus = this.getAgeFertilityBonus(age, race);
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
   * @param race 种族（用于长寿种族适配）
   * @returns 年龄评分
   */
  private static getAgeScore(age: number, race?: string): number {
    // 长寿种族（精灵）的年龄评分标准
    if (race === '永恒精灵' || race === '黑暗精灵') {
      return this.getElfAgeScore(age);
    }

    // 普通种族的年龄评分标准
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
   * 获取精灵种族的年龄评分（长寿种族适配）
   * @param age 年龄
   * @returns 年龄评分
   */
  private static getElfAgeScore(age: number): number {
    if (age < 50) return 5; // 幼年期（相当于人类的未成年）
    if (age < 100) return 15; // 青年期（相当于人类的青春年华）
    if (age < 150) return 20; // 最佳年龄期（相当于人类的20-25岁）
    if (age < 200) return 18; // 成熟期（相当于人类的25-30岁）
    if (age < 300) return 15; // 成熟期（相当于人类的30-35岁）
    if (age < 400) return 12; // 中年期（相当于人类的35-40岁）
    if (age < 500) return 8; // 中年期（相当于人类的40-50岁）
    if (age < 600) return 5; // 老年期（相当于人类的50岁以上）
    return 3; // 超老年期（600岁以上）
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
    if (score >= 80) return 'S'; // 85分以上为S级（约3%概率）
    if (score >= 70) return 'A'; // 75-84分为A级（约12%概率）
    if (score >= 60) return 'B'; // 60-74分为B级（约25%概率）
    if (score >= 45) return 'C'; // 45-59分为C级（约35%概率）
    return 'D'; // 45分以下为D级（约25%概率）
  }

  // ==================== 战斗属性计算方法 ====================

  /**
   * 获取种族属性加成
   */
  private static getRaceAttributeBonus(race: string): CharacterAttributes {
    const raceMap: Record<string, CharacterAttributes> = {
      人类: { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 }, // 人类：平衡型
      狐族: { attack: 5, defense: 3, intelligence: 8, speed: 10, health: 20 }, // 狐族：高智力高速度
      永恒精灵: { attack: 3, defense: 2, intelligence: 12, speed: 8, health: 15 }, // 永恒精灵：高智力
      黑暗精灵: { attack: 8, defense: 5, intelligence: 8, speed: 6, health: 12 }, // 黑暗精灵：高攻击
    };
    return raceMap[race] || { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 };
  }

  /**
   * 获取年龄属性加成
   * @param age 年龄
   * @param race 种族（用于长寿种族适配）
   */
  private static getAgeAttributeBonus(age: number, race?: string): CharacterAttributes {
    // 长寿种族（精灵）的年龄属性加成
    if (race === '永恒精灵' || race === '黑暗精灵') {
      return this.getElfAgeAttributeBonus(age);
    }

    // 普通种族的年龄属性加成
    if (age < 18) return { attack: -3, defense: -3, intelligence: 0, speed: 2, health: -10 }; // 未成年：较弱
    if (age < 25) return { attack: 3, defense: 1, intelligence: 1, speed: 3, health: 8 }; // 青年：活力型
    if (age < 30) return { attack: 5, defense: 3, intelligence: 2, speed: 2, health: 10 }; // 壮年：巅峰期
    if (age < 40) return { attack: 2, defense: 4, intelligence: 5, speed: 1, health: 8 }; // 中年：经验型
    if (age < 50) return { attack: 1, defense: 2, intelligence: 3, speed: -1, health: 5 }; // 中老年：智慧型
    return { attack: -2, defense: 1, intelligence: 2, speed: -2, health: -5 }; // 老年：衰退期
  }

  /**
   * 获取精灵种族的年龄属性加成（长寿种族适配）
   * @param age 年龄
   */
  private static getElfAgeAttributeBonus(age: number): CharacterAttributes {
    if (age < 50) return { attack: -3, defense: -3, intelligence: 0, speed: 2, health: -10 }; // 幼年期：较弱
    if (age < 100) return { attack: 3, defense: 1, intelligence: 1, speed: 3, health: 8 }; // 青年期：活力型
    if (age < 150) return { attack: 5, defense: 3, intelligence: 2, speed: 2, health: 10 }; // 最佳年龄期：巅峰期
    if (age < 200) return { attack: 4, defense: 4, intelligence: 4, speed: 2, health: 10 }; // 成熟期：平衡型
    if (age < 300) return { attack: 3, defense: 5, intelligence: 6, speed: 1, health: 8 }; // 成熟期：经验型
    if (age < 400) return { attack: 2, defense: 4, intelligence: 8, speed: 1, health: 8 }; // 中年期：智慧型
    if (age < 500) return { attack: 1, defense: 3, intelligence: 6, speed: 0, health: 5 }; // 中年期：智慧型
    if (age < 600) return { attack: 0, defense: 2, intelligence: 4, speed: -1, health: 3 }; // 老年期：衰退期
    return { attack: -1, defense: 1, intelligence: 3, speed: -2, health: 0 }; // 超老年期：衰退期
  }

  /**
   * 获取评级属性加成（百分比）
   */
  private static getRatingAttributeBonus(rating: CharacterRating): CharacterAttributes {
    const ratingMap: Record<CharacterRating, CharacterAttributes> = {
      S: { attack: 1.0, defense: 1.0, intelligence: 1.0, speed: 1.0, health: 0.8 }, // 100%攻击防御智力速度，80%血量
      A: { attack: 0.6, defense: 0.6, intelligence: 0.6, speed: 0.6, health: 0.5 }, // 60%攻击防御智力速度，50%血量
      B: { attack: 0.3, defense: 0.3, intelligence: 0.3, speed: 0.3, health: 0.25 }, // 30%攻击防御智力速度，25%血量
      C: { attack: 0.1, defense: 0.1, intelligence: 0.1, speed: 0.1, health: 0.1 }, // 10%攻击防御智力速度，10%血量
      D: { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 }, // 无加成
    };
    return ratingMap[rating] || { attack: 0, defense: 0, intelligence: 0, speed: 0, health: 0 };
  }

  /**
   * 获取据点类型属性加成
   */
  private static getLocationAttributeBonus(locationType: string): CharacterAttributes {
    const locationMap: Record<string, CharacterAttributes> = {
      // 通用类型
      village: { attack: 2, defense: 1, intelligence: 3, speed: 3, health: 5 }, // 村庄：智力速度型
      town: { attack: 3, defense: 3, intelligence: 3, speed: 3, health: 8 }, // 城镇：平衡型
      city: { attack: 5, defense: 5, intelligence: 5, speed: 4, health: 12 }, // 城市：全面强化
      ruins: { attack: 2, defense: 2, intelligence: 4, speed: 4, health: 3 }, // 遗迹：智力速度型
      trade_caravan: { attack: 3, defense: 2, intelligence: 3, speed: 4, health: 6 }, // 贸易商队：速度型
      adventurer_party: { attack: 4, defense: 3, intelligence: 3, speed: 4, health: 8 }, // 冒险者：战斗型
      // 古拉尔大陆
      exile_outpost: { attack: 3, defense: 3, intelligence: 3, speed: 3, health: 8 }, // 流放者：平衡型
      bandit_camp: { attack: 4, defense: 2, intelligence: 2, speed: 4, health: 6 }, // 盗匪：攻速型
      elven_forest: { attack: 3, defense: 3, intelligence: 6, speed: 4, health: 6 }, // 精灵森林：魔法型
      fox_colony: { attack: 3, defense: 3, intelligence: 4, speed: 4, health: 6 }, // 狐族：灵巧型
      // 瓦尔基里大陆
      dark_spire: { attack: 8, defense: 6, intelligence: 8, speed: 6, health: 15 }, // 巢都尖塔：最强
      slave_camp: { attack: 1, defense: 0, intelligence: 1, speed: 2, health: 3 }, // 奴隶营：弱小
      dark_fortress: { attack: 6, defense: 5, intelligence: 3, speed: 3, health: 10 }, // 黑暗要塞：战斗型
      obsidian_mine: { attack: 3, defense: 3, intelligence: 2, speed: 2, health: 8 }, // 矿场：耐久型
      raid_dock: { attack: 5, defense: 3, intelligence: 3, speed: 4, health: 8 }, // 劫掠舰：战斗型
      // 香草群岛
      fox_water_town: { attack: 3, defense: 3, intelligence: 4, speed: 4, health: 6 }, // 狐族水乡：灵巧型
      shrine: { attack: 3, defense: 3, intelligence: 6, speed: 3, health: 8 }, // 神社：魔法型
      trading_port: { attack: 3, defense: 3, intelligence: 3, speed: 4, health: 8 }, // 贸易港：平衡型
      warship_dock: { attack: 5, defense: 5, intelligence: 3, speed: 3, health: 10 }, // 军舰泊地：战斗型
      spice_plantation: { attack: 2, defense: 2, intelligence: 3, speed: 3, health: 4 }, // 种植园：弱小
      // 赛菲亚大陆
      imperial_city: { attack: 6, defense: 5, intelligence: 5, speed: 4, health: 12 }, // 帝国城市：强大
      noble_estate: { attack: 5, defense: 5, intelligence: 5, speed: 4, health: 10 }, // 贵族庄园：全面型
      mining_district: { attack: 3, defense: 3, intelligence: 3, speed: 2, health: 8 }, // 矿业区：耐久型
      border_fortress: { attack: 6, defense: 6, intelligence: 2, speed: 2, health: 10 }, // 边境要塞：防御型
      cathedral: { attack: 3, defense: 4, intelligence: 6, speed: 3, health: 8 }, // 教堂：魔法防御型
      academy: { attack: 2, defense: 3, intelligence: 8, speed: 3, health: 6 }, // 学院：智力型
      // 世界树圣域
      tree_city: { attack: 5, defense: 5, intelligence: 6, speed: 5, health: 10 }, // 树城：全面强化
      elven_temple: { attack: 3, defense: 4, intelligence: 8, speed: 4, health: 8 }, // 精灵圣殿：魔法型
      guardian_outpost: { attack: 4, defense: 4, intelligence: 4, speed: 4, health: 8 }, // 守卫哨所：平衡型
      canopy_palace: { attack: 8, defense: 8, intelligence: 10, speed: 8, health: 15 }, // 树冠宫殿：最强
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
   * @param age 年龄
   * @param race 种族（用于长寿种族适配）
   */
  private static getAgeStaminaBonus(age: number, race?: string): number {
    // 长寿种族（精灵）的年龄体力加成
    if (race === '永恒精灵' || race === '黑暗精灵') {
      return this.getElfAgeStaminaBonus(age);
    }

    // 普通种族的年龄体力加成
    if (age < 18) return -10;
    if (age < 25) return 10;
    if (age < 30) return 5;
    if (age < 40) return 0;
    if (age < 50) return -5;
    return -15;
  }

  /**
   * 获取精灵种族的年龄体力加成（长寿种族适配）
   * @param age 年龄
   */
  private static getElfAgeStaminaBonus(age: number): number {
    if (age < 50) return -10; // 幼年期
    if (age < 100) return 10; // 青年期（相当于人类的18-25岁）
    if (age < 150) return 15; // 最佳年龄期（相当于人类的25-30岁）
    if (age < 200) return 10; // 成熟期（相当于人类的30-40岁）
    if (age < 300) return 5; // 成熟期（相当于人类的40-50岁）
    if (age < 400) return 0; // 中年期
    if (age < 500) return -5; // 中年期
    if (age < 600) return -10; // 老年期
    return -15; // 超老年期
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
   * @param age 年龄
   * @param race 种族（用于长寿种族适配）
   */
  private static getAgeFertilityBonus(age: number, race?: string): number {
    // 长寿种族（精灵）的年龄生育力加成
    if (race === '永恒精灵' || race === '黑暗精灵') {
      return this.getElfAgeFertilityBonus(age);
    }

    // 普通种族的年龄生育力加成
    if (age < 18) return -20;
    if (age < 25) return 15;
    if (age < 30) return 20;
    if (age < 35) return 10;
    if (age < 40) return 0;
    if (age < 45) return -10;
    return -25;
  }

  /**
   * 获取精灵种族的年龄生育力加成（长寿种族适配）
   * @param age 年龄
   */
  private static getElfAgeFertilityBonus(age: number): number {
    if (age < 50) return -20; // 幼年期
    if (age < 100) return 15; // 青年期（相当于人类的18-25岁）
    if (age < 150) return 25; // 最佳生育期（相当于人类的25-30岁）
    if (age < 200) return 20; // 成熟期（相当于人类的30-35岁）
    if (age < 300) return 15; // 成熟期（相当于人类的35-40岁）
    if (age < 400) return 10; // 中年期（相当于人类的40-45岁）
    if (age < 500) return 0; // 中年期
    if (age < 600) return -10; // 老年期
    return -20; // 超老年期
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
  private static determineUnitType(identity: string, race: string): 'physical' | 'magical' {
    const identityLower = identity.toLowerCase();

    // 根据身份关键词判断单位类型
    if (
      identityLower.includes('法师') ||
      identityLower.includes('魔法') ||
      identityLower.includes('术士') ||
      identityLower.includes('萨满') ||
      identityLower.includes('牧师') ||
      identityLower.includes('祭司') ||
      identityLower.includes('元素使') ||
      identityLower.includes('血法师')
    ) {
      return 'magical';
    }

    // 根据种族特性判断
    if (race === '永恒精灵' || race === '黑暗精灵') {
      return 'magical';
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
    const levelMap: Record<string, number> = {
      // 通用类型
      village: 2,
      town: 3,
      city: 5,
      ruins: 4,
      trade_caravan: 3,
      adventurer_party: 4,
      // 古拉尔大陆
      exile_outpost: 3,
      bandit_camp: 2,
      elven_forest: 4,
      fox_colony: 3,
      // 瓦尔基里大陆
      dark_spire: 7,
      slave_camp: 2,
      dark_fortress: 5,
      obsidian_mine: 3,
      raid_dock: 4,
      // 香草群岛
      fox_water_town: 3,
      shrine: 4,
      trading_port: 3,
      warship_dock: 5,
      spice_plantation: 2,
      // 赛菲亚大陆
      imperial_city: 6,
      noble_estate: 5,
      mining_district: 3,
      border_fortress: 5,
      cathedral: 5,
      academy: 4,
      // 世界树圣域
      tree_city: 5,
      elven_temple: 6,
      guardian_outpost: 4,
      canopy_palace: 7,
    };
    baseLevel = locationType ? levelMap[locationType] || 3 : 3;

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
    difficulty?: number,
    isFullCustom: boolean = false,
  ): Promise<Character | null> {
    try {
      console.log('🔧 [属性计算] 开始构建人物对象...');
      console.log('📊 [属性计算] 输入数据:', {
        姓名: parsedData.name,
        种族: parsedData.race,
        年龄: parsedData.age,
        出身: parsedData.background,
        据点类型: locationType || '未指定',
        完全自定义模式: isFullCustom,
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
      let rating: CharacterRating;
      if (isFullCustom) {
        // 完全自定义模式：评级默认为S
        rating = 'S';
        console.log('⭐ [属性计算] 完全自定义模式：评级固定为S');
      } else {
        console.log('⭐ [属性计算] 开始计算人物评级...');
        rating = this.calculateRating(
          parsedData.race,
          parsedData.age,
          parsedData.appearance,
          parsedData.background,
          difficulty,
        );
        console.log('🎯 [属性计算] 评级计算完成:', rating);
      }

      // 计算战斗属性
      let attributes: CharacterAttributes;
      if (isFullCustom) {
        // 完全自定义模式：从AI生成的数据中解析，失败则随机70-100
        console.log('⚔️ [属性计算] 完全自定义模式：从AI生成的数据中解析战斗属性...');
        const customAttr = parsedData.customAttributes;
        if (
          customAttr &&
          customAttr.attack !== undefined &&
          customAttr.defense !== undefined &&
          customAttr.intelligence !== undefined &&
          customAttr.speed !== undefined &&
          customAttr.health !== undefined
        ) {
          attributes = {
            attack: customAttr.attack,
            defense: customAttr.defense,
            intelligence: customAttr.intelligence,
            speed: customAttr.speed,
            health: customAttr.health,
          };
          console.log('✅ [属性计算] 完全自定义模式 - 使用AI生成的属性:', attributes);
        } else {
          // 解析失败，随机70-100
          const randomValue = () => Math.floor(Math.random() * 31) + 70; // 70-100
          attributes = {
            attack: randomValue(),
            defense: randomValue(),
            intelligence: randomValue(),
            speed: randomValue(),
            health: randomValue(),
          };
          console.log('⚠️ [属性计算] 完全自定义模式 - AI生成的属性解析失败，使用随机值70-100:', attributes);
        }
      } else {
        // 普通模式：完全由系统计算，确保平衡性
        console.log('⚔️ [属性计算] 开始计算战斗属性...');
        attributes = this.calculateAttributes(parsedData.race, parsedData.age, rating, locationType);
        console.log('🛡️ [属性计算] 战斗属性计算完成:', attributes);
      }

      // 计算体力和生育力
      let stamina: number;
      let fertility: number;
      if (isFullCustom) {
        // 完全自定义模式：从AI生成的数据中解析，失败则随机150-200
        console.log('💪 [属性计算] 完全自定义模式：从AI生成的数据中解析体力和生育力...');

        if (parsedData.customStamina !== undefined) {
          stamina = parsedData.customStamina;
          console.log('✅ [属性计算] 完全自定义模式 - 使用AI生成的体力:', stamina);
        } else {
          // 解析失败，随机150-200
          stamina = Math.floor(Math.random() * 51) + 150; // 150-200
          console.log('⚠️ [属性计算] 完全自定义模式 - AI生成的体力解析失败，使用随机值150-200:', stamina);
        }

        if (parsedData.customFertility !== undefined) {
          fertility = parsedData.customFertility;
          console.log('✅ [属性计算] 完全自定义模式 - 使用AI生成的生育力:', fertility);
        } else {
          // 解析失败，随机150-200
          fertility = Math.floor(Math.random() * 51) + 150; // 150-200
          console.log('⚠️ [属性计算] 完全自定义模式 - AI生成的生育力解析失败，使用随机值150-200:', fertility);
        }
      } else {
        // 普通模式：由系统计算
        console.log('💪 [属性计算] 开始计算体力和生育力...');
        stamina = this.calculateStamina(parsedData.race, parsedData.age, rating, parsedData.appearance);
        fertility = this.calculateFertility(parsedData.race, parsedData.age, rating, parsedData.appearance);
        console.log('📊 [属性计算] 体力和生育力计算完成:', {
          体力: stamina,
          生育力: fertility,
        });
      }

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
        // 初始头像值将在首次打开头像编辑界面时自动保存（不在这里设置）
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
        level: Math.floor(0 / 10), // 初始等级基于后代数量，新角色为0级
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
        unitType: parsedData.unitType || this.determineUnitType(parsedData.identity, parsedData.race),
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
          const { WorldbookService } = await import('../../../核心层/服务/世界书管理/服务/世界书服务');
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
