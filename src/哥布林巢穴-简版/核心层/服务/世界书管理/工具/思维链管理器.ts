/**
 * 思维链管理器
 * 负责为不同模式生成思维链提示词
 */

import type { WorldbookEntry } from '../类型/世界书类型定义';
import { WorldbookHelper } from './世界书助手';

/**
 * 思维链模式枚举
 */
export enum ChainOfThoughtMode {
  /** 据点生成模式 */
  LOCATION_GENERATION = 'location_generation',
  /** 人物生成模式 */
  CHARACTER_GENERATION = 'character_generation',
  /** 战前对话模式 */
  PRE_BATTLE_DIALOGUE = 'pre_battle_dialogue',
  /** 战斗总结模式 */
  BATTLE_SUMMARY = 'battle_summary',
  /** 人物调教模式 */
  CHARACTER_TRAINING = 'character_training',
  /** 随机事件模式 */
  RANDOM_EVENT = 'random_event',
  /** 剧情总结模式 */
  STORY_SUMMARY = 'story_summary',
}

/**
 * 思维链管理器
 */
export class ChainOfThoughtManager {
  /**
   * 据点生成模式思维链
   */
  static getLocationGenerationChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式是什么？
- 此模式是否需要不输出正文剧情，而是输出指定格式的JSON数据？
- 当前位于什么大陆的什么区域？特色为何？ 
- 当前巢穴的状态如何？
- 那么生成什么种族和类型的据点更合适或更有趣？
- 怎样的据点守军数量比较合理和真实？（参考标准：村庄50-200人，城镇500-1500人，要塞1000-3000人，城市2000-8000人），是否配得上特殊单位？
- 怎样的奖励比较合理和真实？（金币、食物、女性奴隶数量）
- 是否可查阅据点征服记录，避免重复据点？
- 最后确认：确认此模式的是否为json格式？
</think>
[/Chain of thought]
`;
  }

  /**
   * 人物生成模式思维链
   */
  static getCharacterGenerationChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式是什么？
- 是否需要不输出正文剧情？
- 这个人物来源于哪个据点？据点的种族、类型、难度如何？
- 是否有参考人物姓名？是否应直译？
- 这个人物是什么身份？这个身份有何特点？
- 人物的性格是否足够丰富？足够独特？
- 外貌和衣着描述是否符合人物绘图Tags？
- 最后确认：只输出格式化的人物数据
</think>
[/Chain of thought]
`;
  }

  /**
   * 战前对话模式思维链
   */
  static getPreBattleDialogueChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式是什么？战前对话模式
- 是否需要生成战前对话剧情？是否需要json格式选项内容？
- 当前大陆和区域是什么？
- 战斗即将开始的双方是谁？各自的目标和立场如何？
- 双方部队规模如何？敌方人物的士气如何？
- {{user}}的对话的重点是什么？
- 敌方人物的身份性格如何？其语气应为何种风格？
- 是否有对玩家未解锁的个人信息？是否应该注意避免剧透？
- 她是否会受到{{user}}的影响？害怕还是坚定？
- 敌方会不会由于对话内容士气反而增长或是毫无变化？
- 最后确认：是否输出选项和士气变化值？
- 格式确认：***剧情正文请使用content的xml标签包裹***
</think>
[/Chain of thought]
`;
  }

  /**
   * 战斗总结模式思维链
   */
  static getBattleSummaryChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式是什么？战斗总结模式
- 是否有对玩家未解锁的个人信息？是否应该注意避免剧透？
- 战斗双方都有什么部队？规模如何？
- 战斗进行了多少回合？整体烈度如何？
- 敌方关键人物在战斗中表现如何？
- 她是如何战败的？被俘时的状况如何？
- 人物的心理活动如何？
- 是否可以用第三人称电影化叙事风格来描绘？
- 最后确认：是否错误地将回合数/伤害等数值等写入剧情？
- 格式确认：***剧情正文请使用content的xml标签包裹***
</think>
[/Chain of thought]
`;
  }

  /**
   * 人物调教模式思维链
   */
  static getCharacterTrainingChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式调教模式
- 此模式是否需要输出正文剧情？是否需要json格式选项内容？
- 这个女人已然被俘，她现在是什么状态？性格和身份如何？
- 是否有对玩家未解锁的个人信息？是否应该注意避免剧透？
- 根据她的性格和身份，她应该有什么鲜明的态度表现？避免完全的抵抗/顺从/投降
- 调教的内容重点是什么？应该优先刻画什么？
- 人物在当前堕落值下的心理状态如何？是坚定还是已经开始动摇？
- 调教的成果如何？是继续保持抵抗还是已经出现变化迹象？
- 是否有足够的内心独白（用*包裹）来描绘人物心理变化？
- 是否可以保证50%的对话来勾勒角色语言底色，表达她对于被俘处境的态度？
- 是否涉及到直接地NSFW色情场景？如果涉及额外考虑1、2、3条
  1. 是否可以通过人物的对话来描绘其调教的场景和身体的状态，类似日本エロゲーム中的对话描写？
  2. 是否可以直白粗俗地描述各种性器官和性行为场景？
  3. 人物的呻吟和娇喘是否可以用连贯的对话来体现？
- 最后确认：是否需要末尾输出JSON格式的选项和属性变化值？
- 格式确认：***剧情正文请使用content的xml标签包裹***
</think>
[/Chain of thought]
`;
  }

  /**
   * 随机事件模式思维链
   */
  static getRandomEventChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式是什么？随机事件模式，需要生成事件描述
- 当前巢穴状态如何？
- 征服和俘获了那些据点和人物？
- 这个事件发生在什么地方？什么时间？
- 事件的起因是什么？为什么会发生？
- 事件涉及哪些人？他们的立场和动机如何？
- 事件对世界或巢穴有什么影响？
- 这个事件的后续可能会如何发展？
- 是否可以通过某些小故事/小人物来体现事件而非大人物？
- 最后确认：描述是否可以用第三人称叙事，生动有趣，体现事件的戏剧性？
- 格式确认：***剧情正文请使用content的xml标签包裹***
</think>
[/Chain of thought]
`;
  }

  /**
   * 剧情总结模式思维链
   */
  static getStorySummaryChain(): string {
    return `[Chain of thought]
在正式创作正文前，需要进行以下思考
思考内容需要使用<think> </think>包裹，正文紧跟在</think>后
<think>
- 当前模式为剧情总结模式
- 需要总结的是什么类型的内容？（据点征服记录/游戏事件记录/人物剧情记录）
- 是否已有之前的总结，可否参考？是否只需要总结新的内容？
- 总结的具体格式要求为何？
- 总结是否可以时间作为主干，事件作为分支，进行梳理？
- 总结是否涉及重要人物的俘虏信息？是否需要特别强调？
- 如何总结可以准确概括原始内容的核心且避免冗杂？
- 标签确认：是否需要'summaryhistory'标签包裹内容？
</think>
[/Chain of thought]
`;
  }

  /**
   * 获取指定模式的思维链（优先使用自定义格式）
   */
  static getChain(mode: ChainOfThoughtMode): string {
    // 先尝试从全局变量读取自定义格式
    try {
      const globalVars = getVariables({ type: 'global' });
      const customChainKey = `chain_of_thought_${mode}`;
      if (typeof globalVars[customChainKey] === 'string' && globalVars[customChainKey].trim()) {
        console.log(`使用自定义思维链格式: ${mode}`);
        return globalVars[customChainKey];
      }
    } catch (error) {
      console.warn('读取自定义思维链格式失败，使用默认格式:', error);
    }

    // 如果没有自定义格式，使用默认格式
    switch (mode) {
      case ChainOfThoughtMode.LOCATION_GENERATION:
        return this.getLocationGenerationChain();
      case ChainOfThoughtMode.CHARACTER_GENERATION:
        return this.getCharacterGenerationChain();
      case ChainOfThoughtMode.PRE_BATTLE_DIALOGUE:
        return this.getPreBattleDialogueChain();
      case ChainOfThoughtMode.BATTLE_SUMMARY:
        return this.getBattleSummaryChain();
      case ChainOfThoughtMode.CHARACTER_TRAINING:
        return this.getCharacterTrainingChain();
      case ChainOfThoughtMode.RANDOM_EVENT:
        return this.getRandomEventChain();
      case ChainOfThoughtMode.STORY_SUMMARY:
        return this.getStorySummaryChain();
      default:
        return '';
    }
  }

  /**
   * 获取指定模式的默认思维链（用于显示和恢复）
   */
  static getDefaultChain(mode: ChainOfThoughtMode): string {
    switch (mode) {
      case ChainOfThoughtMode.LOCATION_GENERATION:
        return this.getLocationGenerationChain();
      case ChainOfThoughtMode.CHARACTER_GENERATION:
        return this.getCharacterGenerationChain();
      case ChainOfThoughtMode.PRE_BATTLE_DIALOGUE:
        return this.getPreBattleDialogueChain();
      case ChainOfThoughtMode.BATTLE_SUMMARY:
        return this.getBattleSummaryChain();
      case ChainOfThoughtMode.CHARACTER_TRAINING:
        return this.getCharacterTrainingChain();
      case ChainOfThoughtMode.RANDOM_EVENT:
        return this.getRandomEventChain();
      case ChainOfThoughtMode.STORY_SUMMARY:
        return this.getStorySummaryChain();
      default:
        return '';
    }
  }

  /**
   * 获取模式对应的名称
   */
  private static getModeName(mode: ChainOfThoughtMode): string {
    const modeNames: Record<ChainOfThoughtMode, string> = {
      [ChainOfThoughtMode.LOCATION_GENERATION]: '据点生成思维链',
      [ChainOfThoughtMode.CHARACTER_GENERATION]: '人物生成思维链',
      [ChainOfThoughtMode.PRE_BATTLE_DIALOGUE]: '战前对话思维链',
      [ChainOfThoughtMode.BATTLE_SUMMARY]: '战斗总结思维链',
      [ChainOfThoughtMode.CHARACTER_TRAINING]: '人物调教思维链',
      [ChainOfThoughtMode.RANDOM_EVENT]: '随机事件思维链',
      [ChainOfThoughtMode.STORY_SUMMARY]: '剧情总结思维链',
    };
    return modeNames[mode] || '未知模式思维链';
  }

  /**
   * 所有思维链共用的固定UID
   */
  private static readonly CHAIN_UID = 999999999; // 使用一个固定的大数字作为UID

  /**
   * 将思维链添加到/更新到世界书（所有模式共用同一个条目）
   * @param worldbookName 世界书名称
   * @param mode 思维链模式
   * @returns Promise<void>
   */
  static async addChainToWorldbook(worldbookName: string, mode: ChainOfThoughtMode): Promise<void> {
    const chainContent = this.getChain(mode);
    const modeName = this.getModeName(mode);

    await WorldbookHelper.ensureExists(worldbookName);

    // 检查条目是否已存在
    const worldbook = await WorldbookHelper.get(worldbookName);
    const entryIndex = worldbook.findIndex(entry => entry.uid === this.CHAIN_UID);

    const entry: WorldbookEntry = {
      name: `思维链提示词（当前模式: ${modeName}）`,
      content: chainContent,
      uid: this.CHAIN_UID,
      enabled: true,
      strategy: {
        type: 'constant',
        keys: [],
        keys_secondary: {
          logic: 'and_any',
          keys: [],
        },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'at_depth',
        role: 'system',
        depth: 0,
        order: 300,
      },
      probability: 100,
      recursion: {
        prevent_incoming: true,
        prevent_outgoing: true,
        delay_until: null,
      },
      effect: {
        sticky: null,
        cooldown: null,
        delay: null,
      },
      extra: {
        entry_type: 'chain_of_thought',
        mode: mode,
        current_mode: modeName,
      },
    };

    if (entryIndex !== -1) {
      // 更新现有条目
      worldbook[entryIndex] = entry;
      console.log(`更新思维链条目内容: ${modeName}`);
    } else {
      // 添加新条目
      worldbook.push(entry);
      console.log(`创建思维链条目: ${modeName}`);
    }

    await WorldbookHelper.replace(worldbookName, worldbook);
  }

  /**
   * 初始化思维链条目到世界书（使用第一个模式）
   * @param worldbookName 世界书名称
   * @returns Promise<void>
   */
  static async initializeChainToWorldbook(worldbookName: string): Promise<void> {
    // 使用据点生成模式作为初始模式
    await this.addChainToWorldbook(worldbookName, ChainOfThoughtMode.LOCATION_GENERATION);
    console.log(`思维链条目已初始化到世界书: ${worldbookName}`);
  }

  /**
   * 从世界书中移除思维链条目
   * @param worldbookName 世界书名称
   * @returns Promise<void>
   */
  static async removeChainFromWorldbook(worldbookName: string): Promise<void> {
    const worldbook = await WorldbookHelper.get(worldbookName);
    const entryIndex = worldbook.findIndex(entry => entry.uid === this.CHAIN_UID);

    if (entryIndex !== -1) {
      worldbook.splice(entryIndex, 1);
      await WorldbookHelper.replace(worldbookName, worldbook);
      console.log('已从世界书移除思维链条目');
    }
  }

  /**
   * 检查思维链条目是否存在
   * @param worldbookName 世界书名称
   * @returns Promise<boolean>
   */
  static async chainExistsInWorldbook(worldbookName: string): Promise<boolean> {
    const worldbook = await WorldbookHelper.get(worldbookName);
    return worldbook.some(entry => entry.uid === this.CHAIN_UID);
  }
}
