import { StorySummaryManager } from '../世界书管理/服务/剧情总结管理器';

const TOKEN_THRESHOLD = 50000; // 5万tokens阈值
const WORLDBOOK_NAME = '哥布林巢穴-人物档案';

export interface SummaryCheckResult {
  needsSummary: boolean;
  totalTokens: number;
  entryDetails: Array<{
    type: string;
    typeName: string;
    tokens: number;
    exceedsThreshold: boolean;
  }>;
}

/**
 * 总结检查服务
 * 检查世界书条目的tokens数量，判断是否需要总结
 */
export class SummaryCheckService {
  /**
   * 检查是否需要总结
   * @returns 检查结果，包括是否需要总结和详细信息
   */
  static async checkIfSummaryNeeded(): Promise<SummaryCheckResult> {
    try {
      const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);

      // 获取三种类型的条目
      const conquestEntries = entries.filter(e => e.extra?.entry_type === 'conquest_records');
      const eventEntries = entries.filter(e => e.extra?.entry_type === 'game_event_story');
      const characterEntries = entries.filter(e => e.extra?.entry_type === 'character_story_history');

      // 计算据点征服和冒头事件的tokens（整体计算）
      const conquestTokens = conquestEntries.reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0);
      const eventTokens = eventEntries.reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0);

      // 人物剧情：按单个人物分别计算，取最大值
      const characterTokensByPerson = new Map<string, number>();
      characterEntries.forEach(entry => {
        const characterId = entry.extra?.character_id || '';
        const tokens = StorySummaryManager.calculateEntryTokens(entry);
        if (characterId) {
          const currentTokens = characterTokensByPerson.get(characterId) || 0;
          characterTokensByPerson.set(characterId, currentTokens + tokens);
        }
      });

      // 找到单个人物tokens的最大值
      const maxCharacterTokens = characterTokensByPerson.size > 0 ? Math.max(...characterTokensByPerson.values()) : 0;

      // 所有人物tokens的总和（用于显示）
      const characterTokensTotal = Array.from(characterTokensByPerson.values()).reduce(
        (sum, tokens) => sum + tokens,
        0,
      );

      const totalTokens = conquestTokens + eventTokens + characterTokensTotal;

      const entryDetails = [
        {
          type: 'conquest_records',
          typeName: '据点征服记录',
          tokens: conquestTokens,
          exceedsThreshold: conquestTokens > TOKEN_THRESHOLD,
        },
        {
          type: 'game_event_story',
          typeName: '冒头事件记录',
          tokens: eventTokens,
          exceedsThreshold: eventTokens > TOKEN_THRESHOLD,
        },
        {
          type: 'character_story_history',
          typeName: '人物剧情记录',
          tokens: maxCharacterTokens, // 使用单个人物的最大值
          exceedsThreshold: maxCharacterTokens > TOKEN_THRESHOLD,
        },
      ];

      // 判断是否需要总结（任一类型超过阈值）
      const needsSummary =
        conquestTokens > TOKEN_THRESHOLD || eventTokens > TOKEN_THRESHOLD || maxCharacterTokens > TOKEN_THRESHOLD;

      console.log('📊 总结检查结果:', {
        needsSummary,
        totalTokens,
        maxCharacterTokens,
        entryDetails,
      });

      return {
        needsSummary,
        totalTokens,
        entryDetails,
      };
    } catch (error) {
      console.error('检查总结需要性失败:', error);
      return {
        needsSummary: false,
        totalTokens: 0,
        entryDetails: [],
      };
    }
  }

  /**
   * 获取建议总结的消息
   * @param result 检查结果
   * @returns 提示消息
   */
  static getSummaryMessage(result: SummaryCheckResult): string {
    if (!result.needsSummary) {
      return '';
    }

    const overThreshold = result.entryDetails.filter(d => d.exceedsThreshold);

    if (overThreshold.length === 1) {
      const detail = overThreshold[0];
      return `⚠️ ${detail.typeName}的tokens数量已超过${TOKEN_THRESHOLD}（当前${detail.tokens}），建议进行总结。`;
    } else if (overThreshold.length > 1) {
      const types = overThreshold.map(d => d.typeName).join('、');
      return `⚠️ ${types}的tokens数量已超过${TOKEN_THRESHOLD}，建议进行总结。`;
    } else {
      return `⚠️ 所有条目总tokens数量已超过${TOKEN_THRESHOLD}（当前${result.totalTokens}），建议进行总结。`;
    }
  }
}
