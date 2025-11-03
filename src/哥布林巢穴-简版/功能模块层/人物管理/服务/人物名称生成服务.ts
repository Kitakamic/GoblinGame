/**
 * 人物名称生成服务
 * 基于种族生成随机姓名，用作AI的参考
 */

export interface NameGenerationOptions {
  race: string;
}

export interface GeneratedName {
  fullName: string;
}

/**
 * 人物名称生成服务
 */
export class CharacterNameGenerationService {
  private static instance: CharacterNameGenerationService;

  // 已使用的名称记录（用于避免重复）
  private usedNames: Set<string> = new Set();

  // 日式名字词根池（用于狐族）
  private readonly JAPANESE_NAME_ROOTS = {
    // 日式花卉植物
    flowers: [
      'Sakura',
      'Tsuki',
      'Yuki',
      'Hana',
      'Momo',
      'Sumire',
      'Ayame',
      'Ume',
      'Kiku',
      'Tsubaki',
      'Fuji',
      'Tachibana',
      'Botan',
      'Ran',
      'Kiri',
    ],
    // 日式自然意象
    nature: [
      'Aka',
      'Ao',
      'Kuro',
      'Shiro',
      'Midori',
      'Kumo',
      'Kaze',
      'Mizu',
      'Kawa',
      'Yama',
      'Mine',
      'Oka',
      'Numa',
      'Ike',
      'Mori',
      'Take',
      'Iwa',
      'Ishi',
      'Suna',
      'Tsuchi',
    ],
    // 日式季节时间
    seasons: [
      'Haru',
      'Natsu',
      'Aki',
      'Fuyu',
      'Asa',
      'Yuu',
      'Tsuki',
      'Hiru',
      'Yoru',
      'Kaze',
      'Fubuki',
      'Ame',
      'Sora',
      'Tsuki',
      'Hoshi',
    ],
    // 日式美德寓意
    virtue: [
      'Akira',
      'Akari',
      'Sakura',
      'Yuki',
      'Hikari',
      'Megumi',
      'Haruka',
      'Yuzuki',
      'Hotaru',
      'Asuka',
      'Aoi',
      'Natsumi',
      'Miyuki',
      'Yumi',
      'Kaori',
    ],
    // 日式颜色
    colors: [
      'Akane',
      'Murasaki',
      'Sakura',
      'Yuki',
      'Sumire',
      'Ayame',
      'Botan',
      'Kuri',
      'Enji',
      'Shouyou',
      'Fuji',
      'Hanada',
      'Koki',
      'Sango',
      'Tsutsuji',
    ],
  };

  // 词根池
  private readonly NAME_ROOTS = {
    // 古典神话
    classical: [
      'Dian',
      'Athena',
      'Minerv',
      'Lun',
      'Aur',
      'Apoll',
      'Artem',
      'Herm',
      'Poseid',
      'Hest',
      'Venus',
      'Juno',
      'Ceres',
      'Vesta',
      'Diana',
    ],
    // 圣经人物
    biblical: [
      'Maria',
      'Elisab',
      'Rebec',
      'Sar',
      'Ann',
      'Ruth',
      'Esth',
      'Judith',
      'Miriam',
      'Rachel',
      'Hannah',
      'Leah',
      'Deborah',
      'Naomi',
      'Abigail',
    ],
    // 花卉植物
    floral: [
      'Ros',
      'Lil',
      'Viola',
      'Jasm',
      'Peon',
      'Iris',
      'Lily',
      'Rose',
      'Daisy',
      'Violet',
      'Lotus',
      'Orchid',
      'Tulip',
      'Magnolia',
      'Cherry',
    ],
    // 宝石矿物
    gemstone: [
      'Sapph',
      'Rubin',
      'Emer',
      'Pearl',
      'Topaz',
      'Crystal',
      'Diamond',
      'Amber',
      'Jade',
      'Opal',
      'Ruby',
      'Emerald',
      'Sapphire',
      'Garnet',
      'Aqua',
    ],
    // 天体星辰
    celestial: [
      'Stell',
      'Auror',
      'Selene',
      'Vega',
      'Sol',
      'Luna',
      'Stella',
      'Aurora',
      'Nova',
      'Comet',
      'Sirius',
      'Polaris',
      'Andromeda',
      'Cassiopeia',
      'Lyra',
    ],
    // 美德寓意
    virtue: [
      'Soph',
      'Victor',
      'Flor',
      'Const',
      'Adel',
      'Grace',
      'Hope',
      'Faith',
      'Charity',
      'Prudence',
      'Patience',
      'Temperance',
      'Fortitude',
      'Justice',
      'Mercy',
    ],
    // 自然意象
    nature: [
      'Snow',
      'Moon',
      'Star',
      'Flame',
      'Shadow',
      'Wind',
      'Rain',
      'Forest',
      'River',
      'Mountain',
      'Ocean',
      'Thunder',
      'Lightning',
      'Mist',
      'Dawn',
    ],
    // 音乐艺术
    artistic: [
      'Melody',
      'Harmony',
      'Rhythm',
      'Cadence',
      'Sonata',
      'Aria',
      'Lyric',
      'Poetry',
      'Canvas',
      'Brush',
      'Palette',
      'Sculpt',
      'Dance',
      'Song',
      'Verse',
    ],
    // 季节时间
    temporal: [
      'Spring',
      'Summer',
      'Autumn',
      'Winter',
      'Morning',
      'Evening',
      'Twilight',
      'Midnight',
      'Dawn',
      'Dusk',
      'Season',
      'Eternal',
      'Moment',
      'Hour',
      'Day',
    ],
  };

  // 女性后缀（专门为女性角色优化）
  private readonly FEMALE_SUFFIXES = {
    // 通用女性后缀
    common: [
      'a',
      'ia',
      'ina',
      'elle',
      'ara',
      'wyn',
      'ine',
      'is',
      'ana',
      'ena',
      'ella',
      'ina',
      'ara',
      'ora',
      'ina',
      'ella',
      'ara',
      'ora',
      'ina',
      'ella',
    ],
    // 精灵女性后缀
    elf: [
      'iel',
      'wyn',
      'anor',
      'thir',
      'lith',
      'wen',
      'dil',
      'mir',
      'gal',
      'wen',
      'iela',
      'thira',
      'litha',
      'wenna',
      'dilla',
      'mira',
      'gala',
      'wena',
      'iela',
      'thira',
    ],
    // 黑暗精灵女性后缀
    darkElf: [
      'dra',
      'zhar',
      'mour',
      'vash',
      'drel',
      'zara',
      'veth',
      'drow',
      'zara',
      'veth',
      'drela',
      'zara',
      'dra',
      'zhara',
      'moura',
      'vasha',
      'drella',
      'zara',
      'vetha',
      'drowa',
    ],
    // 狐人女性后缀（日式）
    fox: [
      'mi',
      'ka',
      'ko',
      'na',
      'ri',
      'ru',
      'na',
      'sa',
      'mi',
      'ko',
      'ka',
      'ri',
      'na',
      'ru',
      'ya',
      'sa',
      'mi',
      'na',
      'ko',
      'ri',
    ],
  };

  // 姓氏前缀
  private readonly SURNAME_PREFIXES = [
    'De',
    'Van',
    'Von',
    'La',
    "O'",
    'Mac',
    'Mc',
    'Fitz',
    'Del',
    'Da',
    'Di',
    'Du',
    'Le',
    'El',
    'Al',
    'Ben',
    'Ibn',
    'Abu',
    'Al-',
    'El-',
  ];

  // 姓氏核心元素
  private readonly SURNAME_CORES = {
    // 地名
    places: [
      'Flor',
      'Vienn',
      'Amster',
      'Lyon',
      'Rosa',
      'Paris',
      'London',
      'Rome',
      'Athen',
      'Cairo',
      'Venice',
      'Florence',
      'Milan',
      'Naples',
      'Barcelona',
      'Madrid',
      'Lisbon',
      'Prague',
      'Warsaw',
      'Moscow',
    ],
    // 自然
    nature: [
      'Mont',
      'Stern',
      'Wild',
      'Eisen',
      'Val',
      'Forest',
      'River',
      'Mountain',
      'Valley',
      'Hill',
      'Ocean',
      'Thunder',
      'Lightning',
      'Storm',
      'Wind',
      'Rain',
      'Snow',
      'Ice',
      'Fire',
      'Earth',
    ],
    // 动物
    animals: [
      'Leo',
      'Lup',
      'Aigle',
      'Swan',
      'Drak',
      'Wolf',
      'Eagle',
      'Lion',
      'Bear',
      'Fox',
      'Tiger',
      'Panther',
      'Falcon',
      'Hawk',
      'Raven',
      'Dove',
      'Phoenix',
      'Griffin',
      'Dragon',
      'Serpent',
    ],
    // 职业
    professions: [
      'Smith',
      'Cook',
      'Miller',
      'Baker',
      'Weaver',
      'Hunter',
      'Guard',
      'Knight',
      'Mage',
      'Priest',
      'Scholar',
      'Artist',
      'Musician',
      'Poet',
      'Sage',
      'Healer',
      'Warrior',
      'Ranger',
      'Rogue',
      'Bard',
    ],
    // 颜色
    colors: [
      'Gold',
      'Silver',
      'Bronze',
      'Copper',
      'Iron',
      'Steel',
      'Crystal',
      'Pearl',
      'Ruby',
      'Emerald',
      'Sapphire',
      'Amber',
      'Jade',
      'Onyx',
      'Ivory',
      'Ebony',
      'Crimson',
      'Azure',
      'Violet',
      'Rose',
    ],
    // 季节
    seasons: [
      'Spring',
      'Summer',
      'Autumn',
      'Winter',
      'Dawn',
      'Dusk',
      'Twilight',
      'Midnight',
      'Morning',
      'Evening',
      'Day',
      'Night',
      'Eternal',
      'Moment',
      'Hour',
      'Season',
      'Year',
      'Month',
      'Week',
      'Time',
    ],
  };

  // 姓氏后缀
  private readonly SURNAME_SUFFIXES = [
    'berg',
    'stein',
    'heim',
    'rose',
    'val',
    'ford',
    'hart',
    'wood',
    'field',
    'brook',
    'ton',
    'ville',
    'burg',
    'port',
    'gate',
    'bridge',
    'castle',
    'manor',
    'hall',
    'court',
    'dale',
    'mere',
    'wick',
    'ham',
    'ford',
    'worth',
    'bury',
    'ford',
    'wick',
    'ham',
    'son',
    'sen',
    'sen',
    'dottir',
    'sson',
    'sen',
    'sen',
    'sen',
    'sen',
    'sen',
  ];

  private constructor() {}

  public static getInstance(): CharacterNameGenerationService {
    if (!CharacterNameGenerationService.instance) {
      CharacterNameGenerationService.instance = new CharacterNameGenerationService();
    }
    return CharacterNameGenerationService.instance;
  }

  /**
   * 生成人物名称
   * @param options 生成选项
   * @returns 生成的人物名称
   */
  public generateName(options: NameGenerationOptions): GeneratedName {
    console.log(`🎭 [名称生成] 开始生成女性人物名称:`, options);

    // 1. 生成名字
    const firstName = this.generateFirstName(options);
    console.log(`✅ [名称生成] 生成名字: ${firstName}`);

    // 2. 生成姓氏
    const lastName = this.generateLastName(options);
    console.log(`✅ [名称生成] 生成姓氏: ${lastName}`);

    // 3. 组合完整名称
    const fullName = `${firstName} ${lastName}`;
    console.log(`✅ [名称生成] 完整名称: ${fullName}`);

    // 4. 检查唯一性
    if (this.usedNames.has(fullName.toLowerCase())) {
      console.warn(`⚠️ [名称生成] 名称重复，重新生成: ${fullName}`);
      return this.generateName(options); // 递归重新生成
    }

    // 5. 记录已使用的名称
    this.usedNames.add(fullName.toLowerCase());

    const result: GeneratedName = {
      fullName,
    };

    console.log(`🎉 [名称生成] 生成完成:`, result);
    return result;
  }

  /**
   * 生成名字
   */
  private generateFirstName(options: NameGenerationOptions): string {
    // 根据种族选择词根池
    const rootPool = this.selectRootPool(options.race);

    // 增加随机性：1-3个词根，概率分布更均匀
    const rootCountRoll = Math.random();
    let rootCount: number;
    if (rootCountRoll < 0.4) {
      rootCount = 1; // 40% 概率
    } else if (rootCountRoll < 0.8) {
      rootCount = 2; // 40% 概率
    } else {
      rootCount = 3; // 20% 概率
    }

    const selectedRoots: string[] = [];

    for (let i = 0; i < rootCount; i++) {
      const randomRoot = rootPool[Math.floor(Math.random() * rootPool.length)];
      if (!selectedRoots.includes(randomRoot)) {
        selectedRoots.push(randomRoot);
      }
    }

    // 根据种族选择女性后缀
    const suffixPool = this.selectFemaleSuffixPool(options.race);
    const selectedSuffix = suffixPool[Math.floor(Math.random() * suffixPool.length)];

    // 组合名字
    const baseName = selectedRoots.join('');
    const firstName = baseName + selectedSuffix;

    // 增加随机性：偶尔添加额外的修饰
    if (Math.random() < 0.15) {
      // 15% 概率添加修饰
      const modifiers = ['', 'a', 'e', 'i', 'o', 'u'];
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      const finalName = firstName + modifier;
      return finalName.length > 15 ? finalName.substring(0, 15) : finalName;
    }

    // 确保长度不超过15字符
    return firstName.length > 15 ? firstName.substring(0, 15) : firstName;
  }

  /**
   * 生成姓氏
   */
  private generateLastName(options: NameGenerationOptions): string {
    const raceLower = options.race.toLowerCase();

    // 狐族特殊处理：生成日式风格姓氏
    if (raceLower.includes('狐族') || raceLower.includes('fox')) {
      return this.generateJapaneseLastName();
    }

    // 对于人类，10%概率生成贵族风格姓氏，90%概率生成普通风格姓氏
    const isNobleStyle = raceLower.includes('人类') && Math.random() < 0.1;

    if (isNobleStyle) {
      // 贵族风格：使用前缀 + 核心 + 后缀
      const prefix = this.SURNAME_PREFIXES[Math.floor(Math.random() * this.SURNAME_PREFIXES.length)];
      const coreType = Object.keys(this.SURNAME_CORES)[
        Math.floor(Math.random() * Object.keys(this.SURNAME_CORES).length)
      ];
      const corePool = this.SURNAME_CORES[coreType as keyof typeof this.SURNAME_CORES];
      const core = corePool[Math.floor(Math.random() * corePool.length)];
      const suffix = this.SURNAME_SUFFIXES[Math.floor(Math.random() * this.SURNAME_SUFFIXES.length)];

      return `${prefix} ${core}${suffix}`;
    } else {
      // 普通风格：增加更多随机性
      const usePrefix = Math.random() < 0.4; // 提高到40%概率使用前缀
      const prefix = usePrefix ? this.SURNAME_PREFIXES[Math.floor(Math.random() * this.SURNAME_PREFIXES.length)] : '';

      // 选择姓氏核心元素
      const coreType = Object.keys(this.SURNAME_CORES)[
        Math.floor(Math.random() * Object.keys(this.SURNAME_CORES).length)
      ];
      const corePool = this.SURNAME_CORES[coreType as keyof typeof this.SURNAME_CORES];
      const core = corePool[Math.floor(Math.random() * corePool.length)];

      // 选择后缀
      const suffix = this.SURNAME_SUFFIXES[Math.floor(Math.random() * this.SURNAME_SUFFIXES.length)];

      // 增加随机性：偶尔使用双核心
      if (Math.random() < 0.2) {
        // 20% 概率使用双核心
        const secondCoreType = Object.keys(this.SURNAME_CORES)[
          Math.floor(Math.random() * Object.keys(this.SURNAME_CORES).length)
        ];
        const secondCorePool = this.SURNAME_CORES[secondCoreType as keyof typeof this.SURNAME_CORES];
        const secondCore = secondCorePool[Math.floor(Math.random() * secondCorePool.length)];

        const lastName = prefix ? `${prefix} ${core}${secondCore}${suffix}` : `${core}${secondCore}${suffix}`;
        return lastName.length > 25 ? lastName.substring(0, 25) : lastName;
      }

      // 组合姓氏
      const lastName = prefix ? `${prefix} ${core}${suffix}` : `${core}${suffix}`;

      // 确保长度合理
      return lastName.length > 20 ? lastName.substring(0, 20) : lastName;
    }
  }

  /**
   * 生成日式姓氏
   */
  private generateJapaneseLastName(): string {
    // 日式姓氏常见前缀和后缀
    const familyPrefixes = [
      'Tanaka',
      'Suzuki',
      'Takahashi',
      'Watanabe',
      'Ito',
      'Kobayashi',
      'Yamamoto',
      'Nakamura',
      'Inoue',
      'Kato',
      'Kimura',
      'Yoshida',
      'Yamada',
      'Shimizu',
      'Hayashi',
      'Saito',
      'Yamaguchi',
      'Matsumoto',
      'Inoue',
      'Kimura',
    ];
    const familySuffixes = [
      'mura',
      'hara',
      'kawa',
      'shima',
      'naka',
      'dani',
      'yama',
      'tani',
      'saka',
      'machi',
      'gaoka',
      'hiro',
      'ki',
      'shi',
      'ta',
      'ro',
      'ko',
      'no',
      'ya',
      'to',
    ];
    const placeElements = ['saka', 'shima', 'hama', 'kawa', 'yama', 'mori', 'no', 'machi', 'da', 'gi'];
    const directionElements = ['kita', 'minami', 'nishi', 'higashi'];
    const colorElements = ['aka', 'ao', 'kuro', 'shiro'];
    const natureElements = ['taka', 'hiro', 'naga', 'oka', 'hara', 'naka'];

    // 组合方式1：直接姓氏前缀（40%）
    if (Math.random() < 0.4) {
      return familyPrefixes[Math.floor(Math.random() * familyPrefixes.length)];
    }

    // 组合方式2：地名 + 后缀（30%）
    if (Math.random() < 0.5) {
      const element = placeElements[Math.floor(Math.random() * placeElements.length)];
      const suffix = familySuffixes[Math.floor(Math.random() * familySuffixes.length)];
      return `${element}${suffix}`;
    }

    // 组合方式3：方向/颜色/自然 + 后缀（30%）
    const allElements = [...directionElements, ...colorElements, ...natureElements];
    const element = allElements[Math.floor(Math.random() * allElements.length)];
    const suffix = familySuffixes[Math.floor(Math.random() * familySuffixes.length)];
    return `${element}${suffix}`;
  }

  /**
   * 根据种族选择词根池
   */
  private selectRootPool(race: string): string[] {
    const raceLower = race.toLowerCase();

    if (raceLower.includes('永恒精灵') || raceLower.includes('elf')) {
      // 永恒精灵：天体星辰 + 自然意象 + 花卉植物 + 音乐艺术
      return [
        ...this.NAME_ROOTS.celestial,
        ...this.NAME_ROOTS.nature,
        ...this.NAME_ROOTS.floral,
        ...this.NAME_ROOTS.artistic,
      ];
    } else if (raceLower.includes('黑暗精灵') || raceLower.includes('dark')) {
      // 黑暗精灵：自然意象（暗影相关）+ 宝石矿物 + 古典神话 + 季节时间
      return [
        ...this.NAME_ROOTS.nature.filter(
          name => name.includes('Shadow') || name.includes('Dark') || name.includes('Night') || name.includes('Storm'),
        ),
        ...this.NAME_ROOTS.gemstone,
        ...this.NAME_ROOTS.classical,
        ...this.NAME_ROOTS.temporal.filter(
          name => name.includes('Night') || name.includes('Midnight') || name.includes('Twilight'),
        ),
      ];
    } else if (raceLower.includes('狐族') || raceLower.includes('fox')) {
      // 狐族：使用日式词根
      return [
        ...this.JAPANESE_NAME_ROOTS.flowers,
        ...this.JAPANESE_NAME_ROOTS.nature,
        ...this.JAPANESE_NAME_ROOTS.seasons,
        ...this.JAPANESE_NAME_ROOTS.virtue,
        ...this.JAPANESE_NAME_ROOTS.colors,
      ];
    } else {
      // 人类：古典神话 + 圣经人物 + 美德寓意 + 花卉植物 + 音乐艺术
      return [
        ...this.NAME_ROOTS.classical,
        ...this.NAME_ROOTS.biblical,
        ...this.NAME_ROOTS.virtue,
        ...this.NAME_ROOTS.floral,
        ...this.NAME_ROOTS.artistic,
      ];
    }
  }

  /**
   * 根据种族选择女性后缀池
   */
  private selectFemaleSuffixPool(race: string): string[] {
    const raceLower = race.toLowerCase();

    if (raceLower.includes('永恒精灵') || raceLower.includes('elf')) {
      return this.FEMALE_SUFFIXES.elf;
    } else if (raceLower.includes('黑暗精灵') || raceLower.includes('dark')) {
      return this.FEMALE_SUFFIXES.darkElf;
    } else if (raceLower.includes('狐族') || raceLower.includes('fox')) {
      return this.FEMALE_SUFFIXES.fox;
    } else {
      // 人类或其他种族
      return this.FEMALE_SUFFIXES.common;
    }
  }

  /**
   * 批量生成名称
   * @param count 生成数量
   * @param options 生成选项
   * @returns 生成的人物名称数组
   */
  public generateNames(count: number, options: NameGenerationOptions): GeneratedName[] {
    const names: GeneratedName[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const name = this.generateName(options);
        names.push(name);
      } catch (error) {
        console.error(`❌ [批量名称生成] 第${i + 1}个名称生成失败:`, error);
      }
    }

    console.log(`🎉 [批量名称生成] 完成，共生成 ${names.length} 个名称`);
    return names;
  }

  /**
   * 检查名称是否已使用
   * @param name 要检查的名称
   * @returns 是否已使用
   */
  public isNameUsed(name: string): boolean {
    return this.usedNames.has(name.toLowerCase());
  }

  /**
   * 获取已使用名称统计
   */
  public getUsedNamesStats(): { usedCount: number; uniqueNames: string[] } {
    return {
      usedCount: this.usedNames.size,
      uniqueNames: Array.from(this.usedNames),
    };
  }

  /**
   * 重置已使用名称记录
   */
  public resetUsedNames(): void {
    console.log(`🔄 [名称生成] 重置已使用名称记录`);
    console.log(`📊 [名称生成] 重置前已使用数量: ${this.usedNames.size}`);
    this.usedNames.clear();
    console.log(`✅ [名称生成] 重置完成，已使用数量: ${this.usedNames.size}`);
  }

  /**
   * 验证名称格式
   * @param name 要验证的名称
   * @returns 验证结果
   */
  public validateName(name: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('名称为空');
    }

    if (name.length > 50) {
      errors.push('名称过长（超过50字符）');
    }

    if (!/^[a-zA-Z\u4e00-\u9fa5\s\-'.]+$/.test(name)) {
      errors.push('名称包含非法字符');
    }

    if (this.isNameUsed(name)) {
      errors.push('名称已存在');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// 创建全局实例
export const characterNameGenerationService = CharacterNameGenerationService.getInstance();
