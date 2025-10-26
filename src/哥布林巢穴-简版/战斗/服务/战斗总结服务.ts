/**
 * 战斗总结服务
 * 用于生成战斗总结的AI服务
 */

import { generateWithChainOfThought } from '../../世界书管理/AI生成助手';
import { ChainOfThoughtMode } from '../../世界书管理/思维链管理器';
import { TimeParseService } from '../../服务/时间解析服务';

export interface BattleSummaryData {
  victory: boolean;
  totalTurns: number;
  finalState: {
    allies: any[];
    enemies: any[];
    currentTurn: number;
    isFinished: boolean;
    winner: string;
  };
  turns: any[];
  statistics: {
    totalDamageDealt: number;
    totalDamageReceived: number;
    criticalHits: number;
    misses: number;
  };
  initialTroopState?: Record<string, any>;
}

export interface BattleSummaryResult {
  summary: string;
  keyMoments: string[];
  casualties: {
    allies: any[];
    enemies: any[];
  };
  statistics: {
    totalDamage: number;
    criticalHits: number;
    battleDuration: number;
  };
}

export class BattleSummaryService {
  /**
   * 生成战斗总结
   * @param battleData 战斗数据
   * @returns 战斗总结结果
   */
  static async generateBattleSummary(battleData: BattleSummaryData): Promise<BattleSummaryResult> {
    try {
      // 构建战斗总结提示词
      const prompt = this.buildBattleSummaryPrompt(battleData);

      // 使用带思维链的AI生成（自动切换到战斗总结思维链）
      const response = await generateWithChainOfThought(ChainOfThoughtMode.BATTLE_SUMMARY, {
        user_input: prompt,
      });

      // 应用酒馆正则处理AI回复
      console.log('🧹 原始AI回复:', response);
      const regexResponse = formatAsTavernRegexedString(response, 'ai_output', 'display');
      console.log('🎨 应用酒馆正则后的回复:', regexResponse);
      console.log('🔄 内容是否发生变化:', response !== regexResponse);

      // 解析AI回复
      const summary = this.parseBattleSummary(regexResponse);

      // 提取关键信息
      const keyMoments = this.extractKeyMoments(battleData);
      const casualties = this.calculateCasualties(battleData);
      const statistics = this.calculateStatistics(battleData);

      // 保存战斗总结到世界书（如果有敌方人物）
      await this.saveBattleSummaryToWorldbook(battleData, summary);

      return {
        summary,
        keyMoments,
        casualties,
        statistics,
      };
    } catch (error) {
      console.error('生成战斗总结失败:', error);
      throw new Error('生成战斗总结失败');
    }
  }

  /**
   * 构建战斗总结提示词
   */
  static buildBattleSummaryPrompt(battleData: BattleSummaryData): string {
    // 添加调试信息
    console.log('=== 战斗总结服务调试信息 ===');
    console.log('战斗数据:', battleData);
    console.log('我方单位数量:', battleData.finalState?.allies?.length || 0);
    console.log('敌方单位数量:', battleData.finalState?.enemies?.length || 0);
    console.log('initialTroopState:', battleData.initialTroopState);

    if (battleData.finalState?.allies) {
      console.log('我方单位详情:');
      battleData.finalState.allies.forEach((unit: any, index: number) => {
        console.log(`  单位${index + 1}:`, {
          name: unit.name,
          id: unit.id,
          troops: unit.troops,
          initialTroops: unit.initialTroops,
          originalTroops: unit.originalTroops,
        });
      });
    }

    let prompt = `
<battlesummary>
## 请根据以下战斗数据，生成一个详细的人物战斗被俘过程描述：

## 战斗基本信息：
  - 战斗结果：${battleData.victory ? '胜利' : '失败'}
  - 总回合数：${battleData.totalTurns}
  - 胜利方：${battleData.finalState?.winner === 'allies' ? '我方' : '敌方'}

## 战斗详细过程：`;

    // 添加战斗历史
    if (battleData.turns && battleData.turns.length > 0) {
      battleData.turns.forEach((turn: any, index: number) => {
        prompt += `\n\n第${index + 1}回合：`;
        if (turn.actions && turn.actions.length > 0) {
          turn.actions.forEach((action: any) => {
            if (action.description) {
              prompt += `\n${action.description}`;
            }
          });
        }
      });
    }

    // 添加最终状态 - 显示下辖部队损失情况
    if (battleData.finalState) {
      prompt += '\n## 最终状态：';

      // 统计我方下辖部队损失
      if (battleData.finalState.allies) {
        let allyTroopLosses = 0;
        let allyTroopTotal = 0;
        let allyLossDetails = '';

        console.log('=== 计算我方部队损失 ===');
        console.log('我方单位数量:', battleData.finalState.allies.length);

        battleData.finalState.allies.forEach((unit: any, index: number) => {
          console.log(`\n处理单位 ${index + 1}: ${unit.name}`);
          console.log('单位数据:', {
            id: unit.id,
            troops: unit.troops,
            initialTroops: unit.initialTroops,
            originalTroops: unit.originalTroops,
          });

          if (unit.troops) {
            // 直接使用战斗数据中的初始部队信息
            const initialTroops = battleData.initialTroopState?.[unit.id] || {};

            console.log('获取到的初始部队数据:', initialTroops);

            // 计算我方哥布林部队损失
            const normalLoss = Math.max(0, (initialTroops.normalGoblins || 0) - (unit.troops.normalGoblins || 0));
            const warriorLoss = Math.max(0, (initialTroops.warriorGoblins || 0) - (unit.troops.warriorGoblins || 0));
            const shamanLoss = Math.max(0, (initialTroops.shamanGoblins || 0) - (unit.troops.shamanGoblins || 0));
            const paladinLoss = Math.max(0, (initialTroops.paladinGoblins || 0) - (unit.troops.paladinGoblins || 0));

            const totalLoss = normalLoss + warriorLoss + shamanLoss + paladinLoss;
            const totalTroops =
              (initialTroops.normalGoblins || 0) +
              (initialTroops.warriorGoblins || 0) +
              (initialTroops.shamanGoblins || 0) +
              (initialTroops.paladinGoblins || 0);

            allyTroopLosses += totalLoss;
            allyTroopTotal += totalTroops;

            // 添加具体损失详情（显示所有单位种类，包括0损失的）
            allyLossDetails += `\n- ${unit.name}:`;
            allyLossDetails += ` 普通哥布林-${normalLoss}`;
            allyLossDetails += ` 哥布林战士-${warriorLoss}`;
            allyLossDetails += ` 哥布林萨满-${shamanLoss}`;
            allyLossDetails += ` 哥布林圣骑士-${paladinLoss}`;
          }
        });

        prompt += `\n我方部队：损失 ${allyTroopLosses}/${allyTroopTotal} 人`;
        if (allyLossDetails) {
          prompt += allyLossDetails;
        }
      }

      // 统计敌方下辖部队损失
      if (battleData.finalState.enemies) {
        let enemyTroopLosses = 0;
        let enemyTroopTotal = 0;
        let enemyLossDetails = '';

        console.log('=== 计算敌方部队损失 ===');
        console.log('敌方单位数量:', battleData.finalState.enemies.length);

        battleData.finalState.enemies.forEach((unit: any, index: number) => {
          console.log(`\n处理敌方单位 ${index + 1}: ${unit.name}`);
          console.log('敌方单位数据:', {
            id: unit.id,
            troops: unit.troops,
            initialTroops: unit.initialTroops,
          });
          if (unit.troops) {
            // 胜利时所有敌方单位都死亡，直接使用部队数量作为损失
            const troopCount = unit.troops.count || 0;
            const loss = troopCount; // 胜利时敌方全部损失

            console.log(`敌方单位 ${unit.name} 损失计算:`, {
              部队数量: troopCount,
              损失数量: loss,
            });

            enemyTroopLosses += loss;
            enemyTroopTotal += troopCount;

            // 添加具体损失详情
            const troopType = unit.troops.type || unit.name || '未知部队';
            enemyLossDetails += `\n- ${unit.name}: ${troopType}-${loss}`;
          }
        });

        prompt += `\n敌方部队：损失 ${enemyTroopLosses}/${enemyTroopTotal} 人`;
        if (enemyLossDetails) {
          prompt += enemyLossDetails;
        }
      }
    }

    prompt += `\n\n## 战后总结模式规则：
    
1. 巢穴攻陷据点，详细描绘敌方女性人物的战败被俘战斗过程与心理活动
2. 以战斗过程为主线，逐步展现人物的挣扎与战败，以及最终的被俘。
3. 文字风格为电影化叙事，语言生动，富有戏剧性，长度在800-1000字之间
4. **注意：剧情应到被俘为止，不要出现被俘后的剧情**
5. **注意：回合/伤害等信息只是参考，不要出现，而是化用为战斗情景**
</battlesummary>
`;

    return prompt;
  }

  /**
   * 解析AI生成的战斗总结
   */
  static parseBattleSummary(response: string): string {
    console.log('🔧 parseBattleSummary 被调用:', {
      responseLength: response?.length || 0,
      responsePreview: response?.substring(0, 100) || '无内容',
    });

    // 移除可能的JSON标记
    let summary = response.replace(/\[OPTIONS_JSON\][\s\S]*?\[\/OPTIONS_JSON\]/gi, '').trim();

    // 移除可能的XML标签
    summary = summary.replace(/<[^>]+>/g, '');

    console.log('🔧 解析后的战斗总结:', {
      summaryLength: summary?.length || 0,
      summaryPreview: summary?.substring(0, 100) || '无内容',
    });

    // 确保总结不为空
    if (!summary || summary.length < 50) {
      console.log('🔧 战斗总结内容不足，使用默认内容');
      summary = '战斗总结生成失败，请重试。';
    }

    console.log('🔧 最终战斗总结:', {
      finalLength: summary.length,
      finalPreview: summary.substring(0, 100),
    });

    return summary;
  }

  /**
   * 提取关键战斗时刻
   */
  private static extractKeyMoments(battleData: BattleSummaryData): string[] {
    const keyMoments: string[] = [];

    if (!battleData.turns || battleData.turns.length === 0) {
      return keyMoments;
    }

    // 分析每个回合，找出关键时刻
    battleData.turns.forEach((turn: any, index: number) => {
      if (turn.actions && turn.actions.length > 0) {
        turn.actions.forEach((action: any) => {
          // 检查是否是关键时刻（暴击、致命一击、重要单位死亡等）
          if (
            action.critical ||
            action.damage > 50 ||
            action.description?.includes('死亡') ||
            action.description?.includes('阵亡')
          ) {
            keyMoments.push(`第${index + 1}回合: ${action.description}`);
          }
        });
      }
    });

    return keyMoments.slice(0, 5); // 最多返回5个关键时刻
  }

  /**
   * 计算伤亡情况 - 计算下辖部队损失
   */
  private static calculateCasualties(battleData: BattleSummaryData): {
    allies: any[];
    enemies: any[];
  } {
    const casualties = {
      allies: [] as any[],
      enemies: [] as any[],
    };

    if (battleData.finalState) {
      // 统计我方下辖部队损失
      if (battleData.finalState.allies) {
        battleData.finalState.allies.forEach((unit: any) => {
          if (unit.troops) {
            // 直接使用战斗数据中的初始部队信息
            const initialTroops = battleData.initialTroopState?.[unit.id] || {};

            const normalLoss = Math.max(0, (initialTroops.normalGoblins || 0) - (unit.troops.normalGoblins || 0));
            const warriorLoss = Math.max(0, (initialTroops.warriorGoblins || 0) - (unit.troops.warriorGoblins || 0));
            const shamanLoss = Math.max(0, (initialTroops.shamanGoblins || 0) - (unit.troops.shamanGoblins || 0));
            const paladinLoss = Math.max(0, (initialTroops.paladinGoblins || 0) - (unit.troops.paladinGoblins || 0));

            if (normalLoss > 0 || warriorLoss > 0 || shamanLoss > 0 || paladinLoss > 0) {
              casualties.allies.push({
                unitName: unit.name,
                losses: {
                  normalGoblins: normalLoss,
                  warriorGoblins: warriorLoss,
                  shamanGoblins: shamanLoss,
                  paladinGoblins: paladinLoss,
                  total: normalLoss + warriorLoss + shamanLoss + paladinLoss,
                },
              });
            }
          }
        });
      }

      // 统计敌方下辖部队损失
      if (battleData.finalState.enemies) {
        battleData.finalState.enemies.forEach((unit: any) => {
          if (unit.troops) {
            const initialCount = unit.initialTroops?.count || unit.troops.count || 0;
            const currentCount = unit.troops.count || 0;
            const loss = Math.max(0, initialCount - currentCount);

            if (loss > 0) {
              casualties.enemies.push({
                unitName: unit.name,
                losses: {
                  count: loss,
                  total: loss,
                },
              });
            }
          }
        });
      }
    }

    return casualties;
  }

  /**
   * 计算战斗统计
   */
  private static calculateStatistics(battleData: BattleSummaryData): {
    totalDamage: number;
    criticalHits: number;
    battleDuration: number;
  } {
    let totalDamage = 0;
    let criticalHits = 0;

    // 统计伤害和暴击
    if (battleData.turns) {
      battleData.turns.forEach((turn: any) => {
        if (turn.actions) {
          turn.actions.forEach((action: any) => {
            if (action.damage) {
              totalDamage += action.damage;
            }
            if (action.critical) {
              criticalHits++;
            }
          });
        }
      });
    }

    return {
      totalDamage,
      criticalHits,
      battleDuration: battleData.totalTurns,
    };
  }

  /**
   * 格式化战斗总结为HTML
   */
  static formatBattleSummary(summary: string): string {
    // 将换行符转换为HTML段落
    const paragraphs = summary.split('\n').filter(p => p.trim());

    return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  }

  /**
   * 保存战斗总结到存档
   */
  static saveBattleSummary(summary: string, saveKey: string): void {
    try {
      const characterVars = getVariables({ type: 'character' });
      characterVars[`battle_summary_${saveKey}`] = summary;
      replaceVariables(characterVars, { type: 'character' });
    } catch (error) {
      console.error('保存战斗总结失败:', error);
    }
  }

  /**
   * 加载战斗总结
   */
  static loadBattleSummary(saveKey: string): string | null {
    try {
      const characterVars = getVariables({ type: 'character' });
      return characterVars[`battle_summary_${saveKey}`] || null;
    } catch (error) {
      console.error('加载战斗总结失败:', error);
      return null;
    }
  }

  /**
   * 保存战斗总结到世界书
   * @param battleData 战斗数据
   * @param summary 战斗总结内容
   */
  static async saveBattleSummaryToWorldbook(battleData: BattleSummaryData, summary: string): Promise<void> {
    try {
      console.log('🔧 开始保存战斗总结到世界书:', {
        summary: summary ? '有内容' : '无内容',
        summaryLength: summary?.length || 0,
      });

      // 获取当前游戏时间
      const currentGameTime = this.getCurrentGameTime();

      // 从据点的英雄人物中获取需要保存战斗总结的角色（enemy状态且可战斗）
      const locationHeroes = battleData.initialTroopState?.rewards?.heroes || [];

      console.log('🔧 据点英雄人物信息:', {
        总数: locationHeroes.length,
        详情: locationHeroes.map((hero: any) => ({
          name: hero.name,
          id: hero.id,
          status: hero.status,
          canCombat: hero.canCombat,
        })),
      });

      // 筛选出enemy状态且可战斗的人物
      const enemyHeroes = locationHeroes.filter((hero: any) => hero.status === 'enemy' && hero.canCombat === true);

      console.log(`🔧 筛选出 ${enemyHeroes.length} 个敌方人物需要保存战斗总结`);

      if (enemyHeroes.length > 0) {
        const { WorldbookService } = await import('../../世界书管理/世界书服务');

        // 为每个敌方人物保存战斗总结
        for (const hero of enemyHeroes) {
          const battleSummaryRecord = {
            gameTime: currentGameTime,
            content: summary,
            timestamp: Date.now(),
          };

          await WorldbookService.addMultipleBattleSummaryRecords(
            hero.name,
            hero.name,
            [battleSummaryRecord],
            hero.status || 'enemy',
          );

          console.log(`✅ 已保存敌方人物 ${hero.name} 的战斗总结记录到世界书`);
        }
      } else {
        console.log('🔧 据点中没有敌方人物，跳过战斗总结保存');
      }
    } catch (error) {
      console.error('保存战斗总结到世界书失败:', error);
      // 不抛出错误，避免影响战斗总结生成
    }
  }

  /**
   * 获取当前游戏时间（格式化日期字符串）
   */
  private static getCurrentGameTime(): string {
    try {
      // 通过全局变量获取当前游戏回合数
      if (typeof window !== 'undefined' && (window as any).modularSaveManager) {
        const rounds = (window as any).modularSaveManager.resources.value.rounds || 0;
        return TimeParseService.getTimeInfo(rounds).formattedDate;
      }
      return TimeParseService.getTimeInfo(0).formattedDate;
    } catch (error) {
      console.warn('获取当前游戏时间失败:', error);
      return TimeParseService.getTimeInfo(0).formattedDate;
    }
  }
}
