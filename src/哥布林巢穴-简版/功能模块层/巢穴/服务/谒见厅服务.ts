/**
 * 谒见厅服务
 * 负责管理谒见厅的业务逻辑，包括秘书官管理、政策管理和对话生成
 */

import { generateWithChainOfThought } from '../../../核心层/服务/世界书管理/工具/AI生成助手';
import { ChainOfThoughtMode } from '../../../核心层/服务/世界书管理/工具/思维链管理器';
import { modularSaveManager } from '../../../核心层/服务/存档系统/模块化存档服务';
import { TimeParseService } from '../../../核心层/服务/通用服务/时间解析服务';
import type { Character } from '../../人物管理/类型/人物类型';
import { RandomEventService } from '../../随机事件/服务/随机事件服务';
import type { RandomEvent } from '../../随机事件/类型/事件类型';

// ==================== 类型定义 ====================

/**
 * 对话配置接口
 */
export interface DialogueConfig {
  title: string;
  subtitle: string;
  welcomeText: string;
  welcomeHint: string;
  initialOptions: Array<{
    text: string;
    label: string;
  }>;
  showCustomInput: boolean;
  onAIGenerate?: (userInput: string) => Promise<string>;
}

/**
 * 谒见厅状态接口
 */
export interface AudienceHallState {
  /** 可用人物列表 */
  availableCharacters: Character[];
  /** 选中的秘书官 */
  selectedSecretary: Character | null;
  /** 待处理事件 */
  pendingEvent: RandomEvent | null;
}

/**
 * 谒见厅服务类
 */
export class AudienceHallService {
  private static instance: AudienceHallService;
  private eventService: RandomEventService;

  private constructor() {
    this.eventService = RandomEventService.getInstance();
  }

  public static getInstance(): AudienceHallService {
    if (!AudienceHallService.instance) {
      AudienceHallService.instance = new AudienceHallService();
    }
    return AudienceHallService.instance;
  }

  /**
   * 加载可用人物列表（可作为秘书官的候选人）
   */
  public loadAvailableCharacters(): Character[] {
    try {
      const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
      if (trainingData && trainingData.characters) {
        // 筛选出可用的角色（已投降或已编制状态，排除玩家角色）
        const characters = trainingData.characters.filter(
          (char: Character) =>
            char.status !== 'uncaptured' &&
            char.status !== 'enemy' &&
            char.id !== 'player-1' &&
            char.status !== 'player',
        );
        console.log('可用秘书官候选人:', characters);
        return characters;
      }
      return [];
    } catch (error) {
      console.error('加载人物数据失败:', error);
      return [];
    }
  }

  /**
   * 加载已保存的秘书官
   */
  public loadSavedSecretary(availableCharacters: Character[]): Character | null {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      if (nestData && nestData.secretaryId) {
        const secretary = availableCharacters.find(char => char.id === nestData.secretaryId);
        if (secretary) {
          console.log('已加载保存的秘书官:', secretary.name);
          return secretary;
        }
      }
      return null;
    } catch (error) {
      console.error('加载秘书官失败:', error);
      return null;
    }
  }

  /**
   * 保存秘书官
   */
  public saveSecretary(secretary: Character | null): void {
    try {
      const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
      modularSaveManager.updateModuleData({
        moduleName: 'nest',
        data: {
          ...nestData,
          secretaryId: secretary?.id || null,
        },
      });
      console.log('秘书官已保存:', secretary?.name || '无');
    } catch (error) {
      console.error('保存秘书官失败:', error);
    }
  }

  /**
   * 生成秘书官回复
   */
  public async generateSecretaryReply(
    secretary: Character,
    userInput: string,
    pendingEvent: RandomEvent | null,
  ): Promise<string> {
    try {
      // 获取当前游戏时间
      const rounds = modularSaveManager.resources.value.rounds || 0;
      const timeInfo = TimeParseService.getTimeInfo(rounds, false);
      const gameTime = timeInfo.formattedDate;

      // 构建提示词
      const prompt = `你是 ${secretary.name}，${secretary.title}，作为哥布林巢穴的秘书官。

当前游戏时间：${gameTime}

${pendingEvent ? `当前有事件需要汇报：${pendingEvent.name} - ${pendingEvent.description}` : ''}

请以秘书官的身份回复玩家：${userInput}

要求：
1. 符合 ${secretary.name} 的性格和身份
2. 可以提及当前的事件
3. 回复要专业、有条理
4. 使用自然的中文对话`;

      const reply = await generateWithChainOfThought(ChainOfThoughtMode.CHARACTER_TRAINING, {
        user_input: prompt,
        temperature: 0.8,
      });

      return reply;
    } catch (error) {
      console.error('生成秘书官回复失败:', error);
      return '抱歉，我暂时无法回复。';
    }
  }

  /**
   * 检查随机事件
   */
  public checkRandomEvents(): RandomEvent | null {
    try {
      const rounds = modularSaveManager.resources.value.rounds || 0;
      const result = this.eventService.checkRoundStartEvents(rounds, {});
      if (result.triggered && result.event) {
        console.log('检测到随机事件:', result.event.name);
        return result.event;
      }
      return null;
    } catch (error) {
      console.error('检查随机事件失败:', error);
      return null;
    }
  }

  /**
   * 构建对话配置
   */
  public buildDialogueConfig(
    secretary: Character | null,
    onAIGenerate: (userInput: string) => Promise<string>,
  ): DialogueConfig {
    if (!secretary) {
      return {
        title: '谒见厅',
        subtitle: '请先选择秘书官',
        welcomeText: '请先选择一位秘书官',
        welcomeHint: '在左侧选择秘书官后即可开始对话',
        initialOptions: [],
        showCustomInput: false,
      };
    }

    return {
      title: '谒见厅',
      subtitle: `与 ${secretary.name} 对话`,
      welcomeText: `${secretary.name} 正在等待您的指示`,
      welcomeHint: '您可以与秘书官讨论政务、政策，或听取事件汇报',
      initialOptions: [
        { text: '汇报当前情况', label: '汇报' },
        { text: '讨论发展方针', label: '发展' },
        { text: '讨论对外政策', label: '外交' },
        { text: '讨论调教方针', label: '调教' },
      ],
      showCustomInput: true,
      onAIGenerate,
    };
  }
}
