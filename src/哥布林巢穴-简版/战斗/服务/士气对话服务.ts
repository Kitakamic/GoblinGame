// 士气对话服务 - 处理战前对话的生成和管理
import { MoraleParseService } from './士气解析服务';

export interface MoraleDialogueConfig {
  title: string;
  subtitle: string;
  welcomeText: string;
  welcomeHint: string;
  customPlaceholder: string;
  characterName?: string; // AI角色名称
  showCustomInput?: boolean; // 是否显示自定义输入功能
  initialOptions: Array<{
    text: string;
    label: string;
    value: string;
  }>;
  saveKey: string;
  onOptionSelect?: (option: any) => boolean;
  onCustomInput?: (text: string) => boolean;
  onAIGenerate?: (userInput: string) => Promise<string>;
  onAIReply?: (aiResponse: string, characterName: string) => Promise<void>; // AI回复后的回调
  onUserMessage?: (userMessage: string) => Promise<void>; // 用户消息的回调
  onDialogueClose?: () => void;
}

export interface MoraleDialogueContext {
  enemyCharacters: Array<{ name: string }>;
  currentMorale: number;
  enemyInfo: string;
  gameTime: string; // 格式化的游戏时间（如"帝国历1074年1月1日"）
  lastUserInput?: string; // 暂存最后一次用户输入，用于与AI回复一起保存
  // 新增字段
  locationInfo?: {
    continent: string;
    region: string;
    difficulty: string;
    name: string;
    description: string;
  };
  allyForces?: Array<{
    name: string;
    troops?: {
      normalGoblins?: number;
      warriorGoblins?: number;
      shamanGoblins?: number;
      paladinGoblins?: number;
    };
  }>;
  enemyForces?: Array<{
    name: string;
    type?: string;
    troops?: {
      type: string;
      count: number;
    };
  }>;
}

export class MoraleDialogueService {
  /**
   * 创建士气对话配置
   */
  static createDialogueConfig(
    context: MoraleDialogueContext,
    callbacks: {
      onMoraleChange: (oldMorale: number, newMorale: number, reason: string) => void;
      onDialogueClose: () => void;
      getCurrentMorale?: () => number; // 可选的获取当前士气的回调
    },
  ): MoraleDialogueConfig {
    const { currentMorale, enemyInfo } = context;

    return {
      title: '战前对话',
      subtitle: `通过言语降低敌方士气 - 当前士气：${currentMorale.toFixed(1)}% (${MoraleParseService.getMoraleStatusDescription(currentMorale)})`,
      welcomeText: `你决定在战斗前与敌方进行对话，试图通过言语来削弱他们的士气...\n\n${enemyInfo}\n\n通过你的话语，敌方的士气会根据你的言辞效果而动态变化。`,
      welcomeHint: '选择你的策略来影响敌方士气，AI会根据你的话语内容动态调整士气',
      customPlaceholder: '输入你的话语...',
      characterName: context.enemyCharacters[0]?.name || '敌方角色', // 设置敌方角色名称
      showCustomInput: true, // 启用自定义输入功能
      initialOptions: [
        { text: '威胁恐吓', label: '威胁', value: 'threat' },
        { text: '心理战术', label: '心理', value: 'psychology' },
        { text: '嘲讽挑衅', label: '嘲讽', value: 'taunt' },
        { text: '直接开战', label: '开战', value: 'fight' },
      ],
      saveKey: 'battle_dialogue',
      onOptionSelect: (option: any) => {
        // 直接开战选项
        if (option.value === 'fight') {
          return false; // 直接开战，不继续对话
        }

        // 其他选项继续对话，士气变化将通过AI输出解析
        return true;
      },
      onCustomInput: (_text: string) => {
        // 自定义输入继续对话，士气变化将通过AI输出解析
        return true;
      },
      onAIGenerate: async (userInput: string) => {
        // 获取当前士气值，如果有getCurrentMorale回调则使用它，否则使用context中的值
        const currentMoraleValue = callbacks.getCurrentMorale ? callbacks.getCurrentMorale() : context.currentMorale;
        return await this.generateAIResponse(userInput, context, callbacks.onMoraleChange, currentMoraleValue);
      },
      onAIReply: async (aiResponse: string, characterName: string) => {
        // AI回复时，将用户输入和AI回复一起保存到世界书
        // 这样可以避免两次写入导致的覆盖问题
        const userMessage = context.lastUserInput;
        if (userMessage) {
          await this.saveDialoguePairToWorldbook(userMessage, aiResponse, characterName, context);
        }
      },
      onUserMessage: async (userMessage: string) => {
        // 暂存用户输入，等待AI回复后一起保存
        context.lastUserInput = userMessage;
      },
      onDialogueClose: callbacks.onDialogueClose,
    };
  }

  /**
   * 生成AI回复并处理士气变化
   */
  static async generateAIResponse(
    userInput: string,
    context: MoraleDialogueContext,
    onMoraleChange: (oldMorale: number, newMorale: number, reason: string) => void,
    currentMorale?: number, // 可选的当前士气值，如果不提供则使用context中的值
  ): Promise<string> {
    // 使用传入的当前士气值，如果没有则使用context中的值
    const actualCurrentMorale = currentMorale !== undefined ? currentMorale : context.currentMorale;

    // 构建AI提示词
    const prompt = this.buildAIPrompt(userInput, context, actualCurrentMorale);

    // 调用酒馆助手生成回复
    const response = await window.TavernHelper.generate({
      user_input: prompt,
    });

    // 解析AI输出并处理士气变化
    this.processMoraleChange(response, actualCurrentMorale, onMoraleChange);

    return response;
  }

  /**
   * 将用户输入和AI回复作为一对保存到世界书
   * 这样可以避免两次写入导致的覆盖问题
   */
  static async saveDialoguePairToWorldbook(
    userInput: string,
    aiResponse: string,
    characterName: string,
    context: MoraleDialogueContext,
  ): Promise<void> {
    try {
      const { WorldbookService } = await import('../../世界书管理/世界书服务');

      // 使用固定的游戏时间，避免时间不一致
      const gameTime = context.gameTime;
      const baseTimestamp = Date.now();

      // 为每个敌方角色保存对话对
      for (const character of context.enemyCharacters) {
        // 创建用户消息和AI消息
        const userMessage = {
          gameTime: gameTime,
          sender: 'user',
          content: userInput,
          timestamp: baseTimestamp, // 用户消息时间戳
        };

        const aiMessage = {
          gameTime: gameTime,
          sender: characterName,
          content: aiResponse,
          timestamp: baseTimestamp + 1, // AI消息时间戳稍后，确保顺序
        };

        console.log(`为${character.name}保存对话对:`, { userMessage, aiMessage });

        // 批量添加两条记录，只写入一次世界书
        await WorldbookService.addMultipleDialogueRecords(
          character.name,
          character.name,
          [userMessage, aiMessage],
          'enemy',
        );

        console.log(`✅ 已保存${character.name}的对话对到世界书`);
      }
    } catch (error) {
      console.error('保存对话对到世界书失败:', error);
    }
  }

  /**
   * 构建AI提示词
   */
  private static buildAIPrompt(userInput: string, context: MoraleDialogueContext, currentMorale?: number): string {
    const { enemyCharacters, enemyInfo, locationInfo, allyForces, enemyForces } = context;

    // 使用传入的当前士气值，如果没有则使用context中的值
    const actualCurrentMorale = currentMorale !== undefined ? currentMorale : context.currentMorale;

    let prompt = `正在与${enemyInfo}进行战前对话。当前敌方部队整体士气：${actualCurrentMorale.toFixed(1)}%\n\n`;

    // 构建YAML格式的战斗信息
    let yamlContent = '';

    // 添加据点基础信息
    if (locationInfo) {
      yamlContent += `据点信息:\n`;
      yamlContent += `  大陆: "${locationInfo.continent}"\n`;
      yamlContent += `  区域: "${locationInfo.region}"\n`;
      yamlContent += `  难度: "${locationInfo.difficulty}"\n`;
      yamlContent += `  名称: "${locationInfo.name}"\n`;
      yamlContent += `  介绍: "${locationInfo.description}"\n`;
    }

    // 添加我方部队信息
    if (allyForces && allyForces.length > 0) {
      yamlContent += `我方部队:\n`;
      allyForces.forEach(ally => {
        yamlContent += `  - "${ally.name}":\n`;
        if (ally.troops) {
          const troops = ally.troops;
          if (troops.normalGoblins && troops.normalGoblins > 0) {
            yamlContent += `      普通哥布林: ${troops.normalGoblins}\n`;
          }
          if (troops.warriorGoblins && troops.warriorGoblins > 0) {
            yamlContent += `      哥布林战士: ${troops.warriorGoblins}\n`;
          }
          if (troops.shamanGoblins && troops.shamanGoblins > 0) {
            yamlContent += `      哥布林萨满: ${troops.shamanGoblins}\n`;
          }
          if (troops.paladinGoblins && troops.paladinGoblins > 0) {
            yamlContent += `      哥布林圣骑士: ${troops.paladinGoblins}\n`;
          }
        }
      });
    }

    // 添加敌方部队信息
    if (enemyForces && enemyForces.length > 0) {
      yamlContent += `敌方部队:\n`;
      enemyForces.forEach(enemy => {
        yamlContent += `  - "${enemy.name}":\n`;
        if (enemy.troops) {
          yamlContent += `      ${enemy.troops.type}: ${enemy.troops.count}\n`;
        }
      });
    }

    // 添加敌方人物信息
    if (enemyCharacters && enemyCharacters.length > 0) {
      yamlContent += `敌方人物:\n`;
      enemyCharacters.forEach(char => {
        yamlContent += `  - "${char.name}"\n`;
      });
    }

    // 如果有YAML内容，用代码块包裹
    if (yamlContent) {
      prompt += `\`\`\`yaml\n${yamlContent}\`\`\`\n\n`;
    }

    prompt += `请在你的回复末尾包含以下格式的数据：
[OPTIONS_JSON]
{
  "options": [
    {"strategy": "保守", "text": "继续威胁"},
    {"strategy": "激进", "text": "直接攻击"},
    {"strategy": "平稳", "text": "观察情况"}
  ],
  "morale_changes": {
    "morale": -5
  }
}
[/OPTIONS_JSON]

1. 注意：morale_changes.morale 应该是士气变化值（负数表示士气下降，正数表示士气上升），范围建议在-10到+10之间。
2. 回复时请考虑敌方角色身份性格等信息
3. 根据据点难度和双方实力对比来调整对话内容和士气影响

{{user}}：${userInput}
`;

    return prompt;
  }

  /**
   * 处理士气变化
   */
  private static processMoraleChange(
    aiResponse: string,
    currentMorale: number,
    onMoraleChange: (oldMorale: number, newMorale: number, reason: string) => void,
  ): void {
    // 解析AI输出并调整士气
    const moraleResult = MoraleParseService.parseMoraleChange(aiResponse);

    if (moraleResult.moraleChange !== 0) {
      const oldMorale = currentMorale;

      // 应用随机筛子效果
      const diceResult = this.rollMoraleDice(moraleResult.moraleChange);
      const finalChange = diceResult.finalChange;
      const newMorale = Math.max(0, Math.min(100, currentMorale + finalChange));

      // 构建增强的原因描述
      const enhancedReason = `${moraleResult.reason}${diceResult.diceDescription}`;

      // 调用回调函数处理士气变化
      onMoraleChange(oldMorale, newMorale, enhancedReason);

      console.log(
        `士气变化：${oldMorale.toFixed(1)}% → ${newMorale.toFixed(1)}% (${finalChange > 0 ? '+' : ''}${finalChange.toFixed(1)}%)`,
      );
      console.log(`变化原因：${enhancedReason}`);
      console.log(`置信度：${(moraleResult.confidence * 100).toFixed(1)}%`);
      console.log(`🎲 随机筛子：${diceResult.diceDescription}`);
    }
  }

  /**
   * 随机筛子效果 - 增强士气变化
   */
  private static rollMoraleDice(baseChange: number): {
    finalChange: number;
    diceDescription: string;
  } {
    // 投掷1-6的筛子
    const diceRoll = Math.floor(Math.random() * 6) + 1;

    let multiplier = 1;
    let diceDescription = '';

    switch (diceRoll) {
      case 1:
        // 大失败：效果减半
        multiplier = 0.5;
        diceDescription = ' (🎲1-大失败：效果减半)';
        break;
      case 2:
        // 失败：效果减少25%
        multiplier = 0.75;
        diceDescription = ' (🎲2-失败：效果减少25%)';
        break;
      case 3:
        // 普通：正常效果
        multiplier = 1.0;
        diceDescription = ' (🎲3-普通：正常效果)';
        break;
      case 4:
        // 成功：效果增加25%
        multiplier = 1.25;
        diceDescription = ' (🎲4-成功：效果增加25%)';
        break;
      case 5:
        // 大成功：效果增加50%
        multiplier = 1.5;
        diceDescription = ' (🎲5-大成功：效果增加50%)';
        break;
      case 6:
        // 完美：效果翻倍
        multiplier = 2.0;
        diceDescription = ' (🎲6-完美：效果翻倍)';
        break;
    }

    const finalChange = Math.round(baseChange * multiplier * 10) / 10; // 保留一位小数

    return {
      finalChange,
      diceDescription,
    };
  }

  /**
   * 更新对话配置的副标题
   */
  static updateDialogueSubtitle(config: MoraleDialogueConfig, newMorale: number): void {
    if (config) {
      config.subtitle = `通过言语降低敌方士气 - 当前士气：${newMorale.toFixed(1)}% (${MoraleParseService.getMoraleStatusDescription(newMorale)})`;
    }
  }
}
