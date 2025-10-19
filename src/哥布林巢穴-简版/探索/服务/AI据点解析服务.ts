import type { Location } from '../类型/探索类型';
import { pictureResourceMappingService } from './图片资源映射服务';

/**
 * 据点信息解析器
 * 用于解析AI输出的据点信息文本，转换为Location对象
 */
export class LocationParser {
  /**
   * 中文类型到英文类型的映射
   */
  private static readonly TYPE_MAPPING: Record<string, Location['type']> = {
    城镇: 'town',
    村庄: 'village',
    城市: 'city',
    要塞: 'fortress',
    废墟: 'ruins',
    地牢: 'dungeon',
  };

  /**
   * 中文难度到星级难度的映射
   */
  private static readonly DIFFICULTY_MAPPING: Record<string, number> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
  };

  /**
   * 统一据点解析方法（支持单个和多个据点）
   * @param text AI输出的据点信息文本
   * @returns 解析后的Location对象或数组
   */
  static parseLocations(text: string): Location | Location[] | null {
    console.log('🔍 [据点解析器] 开始解析据点信息');
    console.log('📝 [据点解析器] 原始文本长度:', text.length);
    console.log('📝 [据点解析器] 原始文本开头:', text.substring(0, 100) + '...');

    try {
      let cleanText = text.trim();
      console.log('🧹 [据点解析器] 清理后文本长度:', cleanText.length);

      // 应用酒馆正则，去除多余信息
      console.log('🔧 [据点解析器] 应用酒馆正则清理文本...');
      const regexedText = formatAsTavernRegexedString(cleanText, 'ai_output', 'display');
      console.log('🔧 [据点解析器] 酒馆正则处理前长度:', cleanText.length);
      console.log('🔧 [据点解析器] 酒馆正则处理前开头:', cleanText.substring(0, 100) + '...');
      console.log('🔧 [据点解析器] 酒馆正则处理后长度:', regexedText.length);
      console.log('🔧 [据点解析器] 酒馆正则处理后开头:', regexedText.substring(0, 100) + '...');
      console.log('🔧 [据点解析器] 酒馆正则处理是否有效:', cleanText !== regexedText);

      if (cleanText !== regexedText) {
        cleanText = regexedText;
        console.log('✅ [据点解析器] 酒馆正则处理完成，使用清理后的文本');
        console.log('✅ [据点解析器] 清理后文本长度:', cleanText.length);
        console.log('✅ [据点解析器] 清理后文本开头:', cleanText.substring(0, 100) + '...');
      } else {
        console.log('ℹ️ [据点解析器] 酒馆正则未改变文本，继续使用原始文本');
      }

      // 处理Markdown代码块格式
      console.log('🔧 [据点解析器] 开始提取JSON数据...');
      cleanText = this.extractJsonFromText(cleanText);
      console.log('🔧 [据点解析器] 提取JSON后长度:', cleanText.length);
      console.log('🔧 [据点解析器] 提取的JSON开头:', cleanText.substring(0, 100) + '...');

      // 检查是否为JSON格式
      console.log('✅ [据点解析器] 检查JSON格式...');
      console.log('✅ [据点解析器] 文本开头字符:', cleanText.charAt(0));
      console.log('✅ [据点解析器] 是否以{开头:', cleanText.startsWith('{'));
      console.log('✅ [据点解析器] 是否以[开头:', cleanText.startsWith('['));

      if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
        console.error('❌ [据点解析器] 无法找到有效的JSON数据');
        console.error('❌ [据点解析器] 清理后的文本:', cleanText.substring(0, 200) + '...');
        return null;
      }

      console.log('✅ [据点解析器] JSON格式验证通过，开始解析JSON...');

      // 判断是单个对象还是数组
      if (cleanText.startsWith('[')) {
        // 数组格式，解析多个据点
        return this.parseMultipleJsonLocations(cleanText);
      } else {
        // 对象格式，解析单个据点
        return this.parseJsonLocation(cleanText);
      }
    } catch (error) {
      console.error('❌ [据点解析器] 解析据点信息失败:', error);
      console.error('❌ [据点解析器] 错误堆栈:', (error as Error).stack);
      return null;
    }
  }

  /**
   * 解析JSON格式的据点信息
   * @param jsonText JSON格式的据点信息
   * @returns 解析后的Location对象
   */
  private static parseJsonLocation(jsonText: string): Location | null {
    console.log('🔍 [JSON解析器] 开始解析JSON数据');
    console.log('📝 [JSON解析器] JSON文本长度:', jsonText.length);
    console.log('📝 [JSON解析器] JSON文本开头:', jsonText.substring(0, 100) + '...');

    try {
      // 解析JSON
      console.log('🔧 [JSON解析器] 开始JSON.parse()...');
      const data = JSON.parse(jsonText);
      console.log('✅ [JSON解析器] JSON解析成功');
      console.log('📊 [JSON解析器] 数据类型:', typeof data, Array.isArray(data) ? '(数组)' : '(对象)');

      // 如果是数组，取第一个元素
      const locationData = Array.isArray(data) ? data[0] : data;
      console.log('📊 [JSON解析器] 据点数据:', locationData);

      if (!locationData) {
        console.error('❌ [JSON解析器] JSON数据为空');
        throw new Error('JSON数据为空');
      }

      // 转换中文类型为英文，难度为星级数字
      console.log('🔄 [JSON解析器] 开始类型转换...');
      console.log('🔄 [JSON解析器] 原始类型:', locationData.type);
      console.log('🔄 [JSON解析器] 原始难度:', locationData.difficulty);

      const englishType = this.TYPE_MAPPING[locationData.type] || locationData.type;
      const starDifficulty =
        this.DIFFICULTY_MAPPING[locationData.difficulty] ||
        (typeof locationData.difficulty === 'number' ? locationData.difficulty : 1);

      console.log('🔄 [JSON解析器] 转换后类型:', englishType);
      console.log('🔄 [JSON解析器] 转换后难度:', starDifficulty);

      // 验证必要字段
      console.log('✅ [JSON解析器] 验证必要字段...');
      console.log('✅ [JSON解析器] name:', locationData.name);
      console.log('✅ [JSON解析器] type:', locationData.type);
      console.log('✅ [JSON解析器] description:', locationData.description ? '存在' : '缺失');
      console.log('✅ [JSON解析器] difficulty:', locationData.difficulty);

      if (!locationData.name || !locationData.type || !locationData.description || !locationData.difficulty) {
        console.error('❌ [JSON解析器] 缺少必要字段');
        console.error('❌ [JSON解析器] name存在:', !!locationData.name);
        console.error('❌ [JSON解析器] type存在:', !!locationData.type);
        console.error('❌ [JSON解析器] description存在:', !!locationData.description);
        console.error('❌ [JSON解析器] difficulty存在:', !!locationData.difficulty);
        throw new Error('缺少必要字段');
      }

      console.log('✅ [JSON解析器] 所有必要字段验证通过');

      // 生成唯一ID
      console.log('🆔 [JSON解析器] 生成唯一ID...');
      const id = this.generateLocationId(locationData.name);
      console.log('🆔 [JSON解析器] 生成的ID:', id);

      // 构建Location对象
      console.log('🏗️ [JSON解析器] 构建Location对象...');
      const location: Location = {
        id,
        name: locationData.name,
        type: englishType as Location['type'],
        icon: locationData.icon || this.getDefaultIcon(englishType as Location['type']),
        description: locationData.description,
        difficulty: starDifficulty,
        distance: locationData.distance || 0,
        rewards: {
          ...(locationData.rewards?.gold > 0 && { gold: locationData.rewards.gold }),
          ...(locationData.rewards?.food > 0 && { food: locationData.rewards.food }),
          ...(locationData.rewards?.slaves > 0 && { slaves: locationData.rewards.slaves }),
        },
        status: 'unknown',
      };

      console.log('🏗️ [JSON解析器] 基础Location对象构建完成:', location);

      // 如果有基础守军数据，添加到据点中
      if (locationData.baseGuards) {
        console.log('⚔️ [JSON解析器] 添加基础守军:', locationData.baseGuards);
        (location as any).baseGuards = locationData.baseGuards;
      }

      // 如果有特殊单位数据，添加到据点中
      if (locationData.specialUnit) {
        console.log('👤 [JSON解析器] 添加特殊单位:', locationData.specialUnit);
        (location as any).specialUnit = locationData.specialUnit;
      }

      // 如果有大陆和区域信息，添加到据点中
      if (locationData.continent) {
        console.log('🌍 [JSON解析器] 添加大陆信息:', locationData.continent);
        (location as any).continent = locationData.continent;
      }
      if (locationData.region) {
        console.log('🗺️ [JSON解析器] 添加区域信息:', locationData.region);
        (location as any).region = locationData.region;
      }
      if (locationData.race) {
        console.log('🧬 [JSON解析器] 添加种族信息:', locationData.race);
        (location as any).race = locationData.race;
      }

      // 如果有图片资源信息，添加到据点中
      if (locationData.pictureResource) {
        console.log('🖼️ [JSON解析器] 添加图片资源信息:', locationData.pictureResource);
        (location as any).pictureResource = locationData.pictureResource;
      }

      // 根据据点的种族和类型匹配图片资源
      if (locationData.race && locationData.type) {
        const englishType = this.TYPE_MAPPING[locationData.type] || locationData.type;
        const pictureResource = pictureResourceMappingService.getRandomMatchingPictureResource(
          englishType,
          locationData.race,
        );

        if (pictureResource) {
          console.log(
            `🖼️ [JSON解析器] 据点 ${locationData.name} 匹配到图片资源: ID=${pictureResource.id}, 职业=${pictureResource.class}`,
          );
          (location as any).pictureResource = {
            id: pictureResource.id,
            race: pictureResource.race,
            class: pictureResource.class,
            prompt: pictureResource.prompt,
            imageUrl: pictureResource.imageUrl,
            generatedName: pictureResource.generatedName,
          };
        } else {
          console.warn(
            `🖼️ [JSON解析器] 据点 ${locationData.name} 未能匹配到合适的图片资源 (类型: ${englishType}, 种族: ${locationData.race})`,
          );
        }
      }

      console.log('🎉 [JSON解析器] 解析完成，最终Location对象:', location);
      console.log('🔍 [JSON解析器] 最终Location的baseGuards:', location.baseGuards);
      console.log('🔍 [JSON解析器] 最终Location的specialUnit:', location.specialUnit);
      return location;
    } catch (error) {
      console.error('❌ [JSON解析器] 解析JSON据点信息失败:', error);
      console.error('❌ [JSON解析器] 错误类型:', (error as Error).constructor.name);
      console.error('❌ [JSON解析器] 错误消息:', (error as Error).message);
      console.error('❌ [JSON解析器] 错误堆栈:', (error as Error).stack);
      return null;
    }
  }

  /**
   * 生成据点唯一ID
   * @param name 据点名称
   * @returns 唯一ID
   */
  private static generateLocationId(name: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 5);
    return `${name.replace(/\s+/g, '_').toLowerCase()}_${timestamp}_${randomSuffix}`;
  }

  /**
   * 根据据点类型获取默认图标
   * @param type 据点类型
   * @returns 默认图标
   */
  private static getDefaultIcon(type: Location['type']): string {
    const iconMap: Record<Location['type'], string> = {
      town: '🏙️',
      village: '🏘️',
      city: '🏛️',
      fortress: '🏰',
      ruins: '🏚️',
      dungeon: '🕳️',
    };
    return iconMap[type] || '📍';
  }

  /**
   * 验证据点数据完整性
   * @param location 据点对象
   * @returns 验证结果
   */
  static validateLocation(location: Location): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!location.id) errors.push('缺少ID');
    if (!location.name) errors.push('缺少名称');
    if (!location.type) errors.push('缺少类型');
    if (!location.description) errors.push('缺少描述');
    if (!location.difficulty) errors.push('缺少难度');
    if (isNaN(location.distance)) errors.push('距离必须是数字');
    if (location.distance < 0) errors.push('距离不能为负数');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 解析JSON格式的多个据点（内部方法）
   * @param jsonText JSON格式的据点数组
   * @returns 解析后的Location对象数组
   */
  private static parseMultipleJsonLocations(jsonText: string): Location[] {
    try {
      const cleanText = jsonText.trim();
      console.log('🔍 [批量解析器] 开始解析多个据点');
      console.log('📝 [批量解析器] 输入文本长度:', cleanText.length);
      console.log('📝 [批量解析器] 输入文本开头:', cleanText.substring(0, 50) + '...');

      // 检查是否为JSON数组格式
      console.log('🔍 [批量解析器] 检查JSON数组格式...');
      console.log('🔍 [批量解析器] 清理后文本长度:', cleanText.length);
      console.log('🔍 [批量解析器] 清理后文本开头:', cleanText.substring(0, 50) + '...');
      console.log('🔍 [批量解析器] 是否以[开头:', cleanText.startsWith('['));

      if (!cleanText.startsWith('[')) {
        console.error('❌ [批量解析器] 无法找到有效的JSON数组数据');
        console.error('❌ [批量解析器] 原始文本:', jsonText.substring(0, 200) + '...');
        console.error('❌ [批量解析器] 清理后文本:', cleanText.substring(0, 200) + '...');
        return [];
      }

      const locationsData = JSON.parse(cleanText);
      console.log('🔍 [批量解析器] JSON解析成功，数据类型:', Array.isArray(locationsData) ? '数组' : '对象');
      console.log('🔍 [批量解析器] 据点数量:', locationsData.length);

      if (!Array.isArray(locationsData)) {
        console.error('❌ [批量解析器] JSON数据不是数组格式');
        return [];
      }

      const locations: Location[] = [];
      console.log('🔍 [批量解析器] 开始解析', locationsData.length, '个据点...');

      for (let i = 0; i < locationsData.length; i++) {
        const locationData = locationsData[i];
        console.log(`🔍 [批量解析器] 解析第${i + 1}个据点:`, locationData.name);
        try {
          // 转换中文类型为英文，难度为星级数字
          const englishType = this.TYPE_MAPPING[locationData.type] || locationData.type;
          const starDifficulty =
            this.DIFFICULTY_MAPPING[locationData.difficulty] ||
            (typeof locationData.difficulty === 'number' ? locationData.difficulty : 1);

          // 验证必要字段
          if (!locationData.name || !locationData.type || !locationData.description || !locationData.difficulty) {
            console.warn('据点缺少必要字段:', locationData);
            continue;
          }

          // 生成唯一ID
          const id = this.generateLocationId(locationData.name);

          // 构建Location对象
          const location: Location = {
            id,
            name: locationData.name,
            type: englishType as Location['type'],
            icon: locationData.icon || this.getDefaultIcon(englishType as Location['type']),
            description: locationData.description,
            difficulty: starDifficulty,
            distance: locationData.distance || 0,
            rewards: {
              ...(locationData.rewards?.gold > 0 && { gold: locationData.rewards.gold }),
              ...(locationData.rewards?.food > 0 && { food: locationData.rewards.food }),
              ...(locationData.rewards?.slaves > 0 && { slaves: locationData.rewards.slaves }),
            },
            status: 'unknown',
          };

          // 如果有敌方单位数据，添加到据点中
          if (locationData.enemyUnits && Array.isArray(locationData.enemyUnits)) {
            (location as any).enemyUnits = locationData.enemyUnits;
          }

          // 如果有基础守军数据，添加到据点中
          if (locationData.baseGuards) {
            console.log('⚔️ [批量解析器] 添加基础守军:', locationData.baseGuards);
            (location as any).baseGuards = locationData.baseGuards;
          }

          // 如果有特殊单位数据，添加到据点中
          if (locationData.specialUnit) {
            console.log('👤 [批量解析器] 添加特殊单位:', locationData.specialUnit);
            (location as any).specialUnit = locationData.specialUnit;
          }

          // 如果有大陆和区域信息，添加到据点中
          if (locationData.continent) {
            console.log('🌍 [批量解析器] 添加大陆信息:', locationData.continent);
            (location as any).continent = locationData.continent;
          }
          if (locationData.region) {
            console.log('🗺️ [批量解析器] 添加区域信息:', locationData.region);
            (location as any).region = locationData.region;
          }
          if (locationData.race) {
            console.log('🧬 [批量解析器] 添加种族信息:', locationData.race);
            (location as any).race = locationData.race;
          }

          // 如果有图片资源信息，添加到据点中
          if (locationData.pictureResource) {
            console.log('🖼️ [批量解析器] 添加图片资源信息:', locationData.pictureResource);
            (location as any).pictureResource = locationData.pictureResource;
          }

          // 根据据点的种族和类型匹配图片资源
          if (locationData.race && locationData.type) {
            const pictureResource = pictureResourceMappingService.getRandomMatchingPictureResource(
              englishType,
              locationData.race,
            );

            if (pictureResource) {
              console.log(
                `🖼️ [批量解析器] 据点 ${locationData.name} 匹配到图片资源: ID=${pictureResource.id}, 职业=${pictureResource.class}`,
              );
              (location as any).pictureResource = {
                id: pictureResource.id,
                race: pictureResource.race,
                class: pictureResource.class,
                prompt: pictureResource.prompt,
                imageUrl: pictureResource.imageUrl,
                generatedName: pictureResource.generatedName,
              };
            } else {
              console.warn(
                `🖼️ [批量解析器] 据点 ${locationData.name} 未能匹配到合适的图片资源 (类型: ${englishType}, 种族: ${locationData.race})`,
              );
            }
          }

          locations.push(location);
          console.log(`✅ [批量解析器] 第${i + 1}个据点解析成功:`, location.name);
        } catch (error) {
          console.error(`❌ [批量解析器] 第${i + 1}个据点解析失败:`, error, locationData);
        }
      }

      console.log('🎉 [批量解析器] 批量解析完成，成功解析', locations.length, '个据点');

      return locations;
    } catch (error) {
      console.error('解析JSON多个据点失败:', error);
      return [];
    }
  }

  /**
   * 从文本中提取JSON数据
   * @param text 原始文本
   * @returns 提取的JSON文本
   */
  private static extractJsonFromText(text: string): string {
    console.log('🔍 [JSON提取器] 开始提取JSON数据');
    console.log('📝 [JSON提取器] 输入文本长度:', text.length);
    console.log('📝 [JSON提取器] 输入文本开头:', text.substring(0, 100) + '...');
    console.log('📝 [JSON提取器] 输入文本结尾:', '...' + text.substring(Math.max(0, text.length - 100)));

    // 1. 处理Markdown代码块格式 (```json)
    console.log('🔧 [JSON提取器] 检查是否包含```json标记...');
    if (text.includes('```json')) {
      console.log('✅ [JSON提取器] 找到```json标记');
      const jsonStart = text.indexOf('```json') + 7; // '```json'.length = 7
      const jsonEnd = text.indexOf('```', jsonStart);
      console.log('🔧 [JSON提取器] JSON开始位置:', jsonStart);
      console.log('🔧 [JSON提取器] JSON结束位置:', jsonEnd);

      if (jsonEnd !== -1) {
        const extracted = text.substring(jsonStart, jsonEnd).trim();
        console.log('✅ [JSON提取器] 成功提取JSON，长度:', extracted.length);
        console.log('✅ [JSON提取器] 提取的JSON开头:', extracted.substring(0, 100) + '...');
        return extracted;
      } else {
        console.log('❌ [JSON提取器] 未找到结束的```标记');
      }
    } else {
      console.log('❌ [JSON提取器] 未找到```json标记');
    }

    // 2. 处理普通代码块格式 (```)
    console.log('🔧 [JSON提取器] 检查是否包含普通```标记...');
    if (text.includes('```')) {
      console.log('✅ [JSON提取器] 找到普通```标记');
      const codeBlockStart = text.indexOf('```');
      const jsonStart = text.indexOf('{', codeBlockStart);
      const jsonEnd = text.indexOf('```', jsonStart);
      console.log('🔧 [JSON提取器] 代码块开始位置:', codeBlockStart);
      console.log('🔧 [JSON提取器] JSON开始位置:', jsonStart);
      console.log('🔧 [JSON提取器] JSON结束位置:', jsonEnd);

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const extracted = text.substring(jsonStart, jsonEnd).trim();
        console.log('✅ [JSON提取器] 从普通代码块提取JSON，长度:', extracted.length);
        console.log('✅ [JSON提取器] 提取的JSON开头:', extracted.substring(0, 100) + '...');
        return extracted;
      } else {
        console.log('❌ [JSON提取器] 普通代码块中未找到有效的JSON');
      }
    } else {
      console.log('❌ [JSON提取器] 未找到普通```标记');
    }

    // 3. 查找JSON对象或数组 (无包裹格式) - 改进的正则表达式
    console.log('🔧 [JSON提取器] 使用改进的正则表达式查找JSON对象...');

    // 尝试匹配完整的JSON对象，考虑嵌套的大括号
    let braceCount = 0;
    let jsonStart = -1;
    let jsonEnd = -1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '{') {
        if (braceCount === 0) {
          jsonStart = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && jsonStart !== -1) {
          jsonEnd = i;
          break;
        }
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const extracted = text.substring(jsonStart, jsonEnd + 1).trim();
      console.log('✅ [JSON提取器] 通过大括号计数匹配到JSON对象，长度:', extracted.length);
      console.log('✅ [JSON提取器] 匹配的JSON开头:', extracted.substring(0, 100) + '...');
      return extracted;
    } else {
      console.log('❌ [JSON提取器] 大括号计数未匹配到JSON对象');
    }

    // 4. 尝试匹配JSON数组
    console.log('🔧 [JSON提取器] 使用大括号计数查找JSON数组...');
    let bracketCount = 0;
    let arrayStart = -1;
    let arrayEnd = -1;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '[') {
        if (bracketCount === 0) {
          arrayStart = i;
        }
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0 && arrayStart !== -1) {
          arrayEnd = i;
          break;
        }
      }
    }

    if (arrayStart !== -1 && arrayEnd !== -1) {
      const extracted = text.substring(arrayStart, arrayEnd + 1).trim();
      console.log('✅ [JSON提取器] 通过方括号计数匹配到JSON数组，长度:', extracted.length);
      console.log('✅ [JSON提取器] 匹配的JSON开头:', extracted.substring(0, 100) + '...');
      return extracted;
    } else {
      console.log('❌ [JSON提取器] 方括号计数未匹配到JSON数组');
    }

    // 5. 最后的正则表达式尝试
    console.log('🔧 [JSON提取器] 使用正则表达式查找JSON对象...');
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      const extracted = jsonObjectMatch[0].trim();
      console.log('✅ [JSON提取器] 通过正则匹配到JSON对象，长度:', extracted.length);
      console.log('✅ [JSON提取器] 匹配的JSON开头:', extracted.substring(0, 100) + '...');
      return extracted;
    } else {
      console.log('❌ [JSON提取器] 正则未匹配到JSON对象');
    }

    console.log('🔧 [JSON提取器] 使用正则表达式查找JSON数组...');
    const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      const extracted = jsonArrayMatch[0].trim();
      console.log('✅ [JSON提取器] 通过正则匹配到JSON数组，长度:', extracted.length);
      console.log('✅ [JSON提取器] 匹配的JSON开头:', extracted.substring(0, 100) + '...');
      return extracted;
    } else {
      console.log('❌ [JSON提取器] 正则未匹配到JSON数组');
    }

    console.log('⚠️ [JSON提取器] 所有方法都失败，返回原始文本');
    const fallback = text.trim();
    console.log('⚠️ [JSON提取器] 返回文本长度:', fallback.length);
    console.log('⚠️ [JSON提取器] 返回文本开头:', fallback.substring(0, 100) + '...');
    console.log('⚠️ [JSON提取器] 返回文本结尾:', '...' + fallback.substring(Math.max(0, fallback.length - 100)));
    return fallback;
  }

  /**
   * 获取星级难度的显示文本
   * @param difficulty 星级难度
   * @returns 显示文本
   */
  static getStarDifficultyText(difficulty: number): string {
    // 只显示实心星星表示难度
    return '★'.repeat(difficulty);
  }

  /**
   * 格式化据点信息为显示文本
   * @param location 据点对象
   * @returns 格式化的显示文本
   */
  static formatLocationForDisplay(location: Location): string {
    const rewards = Object.entries(location.rewards)
      .filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value && value > 0;
      })
      .map(([key, value]) => {
        const icons = { gold: '💰', food: '🍖', slaves: '🔒' };
        if (Array.isArray(value)) {
          return `${icons[key as keyof typeof icons] || '📦'}${value.join(', ')}`;
        }
        return `${icons[key as keyof typeof icons] || '📦'}${value}`;
      })
      .join(' ');

    return `${location.icon} ${location.name} (${this.getStarDifficultyText(location.difficulty)}, ${location.distance}km) - ${rewards}`;
  }
}
