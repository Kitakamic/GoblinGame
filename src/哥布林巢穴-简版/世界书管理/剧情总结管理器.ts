import { databaseService } from '../存档管理/数据库服务';
import { WorldbookHelper } from './世界书助手';
import type { HistoryRecord, WorldbookEntry } from './世界书类型定义';
import { ChainOfThoughtManager, ChainOfThoughtMode } from './思维链管理器';
import { TrainingRecordManager } from './调教记录管理器';

/**
 * 计算文本的粗略token数量（英文约1:1，中文约1:2）
 * 注：为了更接近实际情况，最终结果除以2.5进行调整
 */
function estimateTokens(text: string): number {
  // 简单估算：英文单词每个约1token，中文每个字符约2tokens
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const nonChineseChars = text.length - chineseChars;
  const rawEstimate = chineseChars * 2 + nonChineseChars * 0.5;
  // 除以2.1调整，更接近实际token消耗
  return Math.ceil(rawEstimate / 2.1);
}

/**
 * 剧情总结管理器 - 负责总结和压缩世界书内容
 */
export class StorySummaryManager {
  /**
   * 获取所有世界书列表
   */
  static async getAllWorldbooks(): Promise<string[]> {
    try {
      // 获取世界书助手提供的所有世界书
      // 这里需要通过TavernHelper接口获取世界书列表
      const defaultWorldbooks = ['哥布林巢穴-人物档案', '哥布林巢穴-资源状态'];
      return defaultWorldbooks;
    } catch (error) {
      console.error('获取世界书列表失败:', error);
      return [];
    }
  }

  /**
   * 获取指定世界书的所有条目
   */
  static async getWorldbookEntries(worldbookName: string): Promise<WorldbookEntry[]> {
    try {
      await WorldbookHelper.ensureExists(worldbookName);
      const worldbook = await WorldbookHelper.get(worldbookName);
      return worldbook;
    } catch (error) {
      console.error(`获取世界书 ${worldbookName} 的条目失败:`, error);
      return [];
    }
  }

  /**
   * 计算条目的token数量
   */
  static calculateEntryTokens(entry: WorldbookEntry): number {
    const content = entry.content || '';
    return estimateTokens(content);
  }

  /**
   * 根据类型过滤世界书条目
   */
  static filterEntriesByType(entries: WorldbookEntry[], types: string[]): WorldbookEntry[] {
    return entries.filter(entry => types.includes(entry.extra?.entry_type || ''));
  }

  /**
   * 使用AI总结世界书条目内容
   * @param entry 要总结的条目
   * @param incremental 是否为增量总结（已有summary）
   */
  static async summarizeEntry(entry: WorldbookEntry, incremental: boolean = false): Promise<string> {
    try {
      let content = entry.content || '';
      const entryType = entry.extra?.entry_type || '未知类型';
      const entryName = entry.name || '未知条目';

      // 如果是增量总结，提取旧summary作为上下文，但标注只总结新数据
      let contextualSummary = '';
      if (incremental && /<summary_\d+>/.test(content)) {
        // 提取所有旧的summary作为上下文，用空行分隔（只支持新格式<summary_N>）
        const summaryMatches = content.matchAll(/<summary_(\d+)>([\s\S]*?)<\/summary_\1>/g);
        for (const match of summaryMatches) {
          contextualSummary += match[2].trim() + '\n\n';
        }

        // 提取新数据部分（移除所有summary_N标签）
        content = content.replace(/<summary_\d+>[\s\S]*?<\/summary_\d+>\n*/g, '').trim();
        console.log(`📝 增量总结: ${entryName} (提取新数据部分，已保留旧总结作为上下文)`);

        if (!content) {
          throw new Error('没有可总结的新数据');
        }
      }

      // 构建AI提示词
      let basePrompt = '';
      switch (entryType) {
        case 'conquest_records':
          basePrompt = this.buildConquestSummaryPrompt(content);
          break;
        case 'game_event_story':
          basePrompt = this.buildEventSummaryPrompt(content);
          break;
        case 'character_story_history':
          basePrompt = this.buildCharacterStorySummaryPrompt(content);
          break;
        default:
          basePrompt = this.buildGenericSummaryPrompt(content);
      }

      // 如果是增量总结，在提示词前添加上下文说明
      let prompt = basePrompt;
      if (incremental && contextualSummary) {
        prompt = `以下是对这位角色/这条目的历史总结，仅供你了解背景，不需要总结：

${contextualSummary}

---

现在请只总结以下新增的内容（不要重复总结历史，但要保持剧情连贯性）：

${basePrompt}`;
      }

      console.log(`🤖 发送AI请求: 总结${entryName}...`);

      // 直接调用AI生成总结，不创建消息
      const aiResponse = await window.TavernHelper.generate({
        user_input: prompt,
        should_stream: false, // 禁用流式传输
      });

      // 检查AI回复是否为空或无效
      if (!aiResponse || aiResponse.trim().length === 0) {
        console.warn(`⚠️ AI回复为空: ${entryName}`);
        throw new Error('AI回复为空');
      }

      // 应用酒馆正则处理
      const formattedResponse = formatAsTavernRegexedString(aiResponse, 'ai_output', 'display');

      console.log(`✅ AI总结完成: ${formattedResponse.substring(0, 100)}...`);

      // 直接返回AI生成的总结内容，保持原有格式
      return formattedResponse;
    } catch (error) {
      console.error('AI总结失败:', error);
      // 总结失败时抛出错误，让上层处理
      throw error;
    }
  }

  /**
   * 构建据点征服总结提示词
   */
  private static buildConquestSummaryPrompt(content: string): string {
    return `以下是哥布林巢穴的外扩张据点征服记录。请将这些零散的征服记录整合成连贯的征服历史总结。

## 原文内容：
${content}

## 输出要求：

### 1. **总结目标**
- 按时间顺序和地理区域，将零散的据点征服记录整合成总结性的描述
- **突出重要据点**（规模大、难度高的据点）
- **重点提及俘获的人物**（如俘获的公主、女骑士、冒险者等）
- 展现征服的趋势和规模扩张

### 2. **内容要求**
- **客观、中立的叙述风格**，类似历史记录
- 保留关键的**据点名称、位置、类型**
- 强调**俘获的重要人物及其背景**
- 体现征服的**地理分布和战略意义**
- 简洁但要包含核心信息

### 3. **输出格式**
以时间为主干的编年体，直接输出总结性的段落描述

### 4. **关键要求**
- **用连贯的段落形式**描述征服历史
- **突出俘获的重要人物及其据点信息**
- **按时间顺序梳理征服活动**
- **体现地理分布和征服规模**
- **仅输出总结内容，禁止输出任何分析过程或额外评论**

现在开始处理，直接输出总结性描述：`;
  }

  /**
   * 构建冒头事件总结提示词
   */
  private static buildEventSummaryPrompt(content: string): string {
    return `以下是哥布林巢穴遭遇的各种随机事件记录。请将这些零散的事件段落整合成连贯的叙事性总结。

## 原文内容：
${content}

## 输出要求：

### 1. **叙述风格**
采用**第三人称叙述者视角**，语言要：
- **中立客观**，类似新闻报道或历史记录
- **生动真实**，符合奇幻冒险色情游戏的风格

### 2. **总结目标**
- 将零散的事件整合成**连贯的叙事段落**
- 展现事件之间的**时间脉络和因果关联**
- 突出事件的**重要性和世界影响**
- 保留关键的细节

### 3. **内容要求**
- 从**全局视角**描述事件对世界的影响
- 体现事件对各**势力、种族、地区**的影响
- 展现事件引发的**连锁反应和后果**
- 语言要**庄重史诗**，符合重要历史事件的感觉

### 4. **输出格式**
章节体，直接输出叙事性的段落描述

### 5. **关键要求**
- 风格类似编年史
- **保持叙述的连贯性和流畅性**
- **体现事件的世界性影响和重要性**
- **展现多方势力的反应和互动**
- **字数控制在400-800字，根据事件多少调整**
- **仅输出叙事性描述，禁止输出任何分析过程或额外评论**
- 每次总结只总结为一章最新章节，不加入序号，只列标题

现在开始处理，直接输出叙事性描述：`;
  }

  /**
   * 构建人物剧情总结提示词（调教记录）
   */
  private static buildCharacterStorySummaryPrompt(content: string): string {
    return `以下是哥布林巢穴中一位角色的详细互动记录，包含调教、对话、战斗等所有历史信息。
请仔细分析并**结构化提取核心事件**，生成包含**至少10个事件**的详细剧情总结。

## 原文内容：
${content}

## 输出要求：

### 1. **事件解析**
- 按时间顺序，将原文精细分解成**10个及以上**独立事件单元
- 追求**最小事件粒度**，每个事件明确一个核心动作或变化
- 事件范围包括：调教过程、对话交流、战斗、关系变化、重要决策等

### 2. **上下文提取（基于原文证据）**
为每个事件提取以下信息（仅当原文有明确证据时）：
- **时间 (Time)：** 绝对时间点或相对时间点
- **地点 (Location)：** 明确的物理地点
- **核心人物 (Characters)：** 直接参与的关键人物
- **人物关系 (Relationships)：** 对理解该事件至关重要的关系

### 3. **事件描述要求**
- **客观、中立、完整、详细**地概括事件核心
- 保留关键对话内容的具体表述
- 清晰传达事件的实质，避免过度简化
- 必须体现**剧情细节和互动过程**

### 4. **输出格式**
每行格式：序号: [上下文标签] 事件详尽描述

**上下文标签格式：**
- 完整版：\`(时间: X | 地点: Y | 人物: A,B | 关系: C(D))\`
- 简化版：\`(X | Y | A,B)\`
- 若无信息则省略对应项

**示例：**
1: (地点: 调教室 | 人物: 艾莉丝) 艾莉丝最初反抗激烈，拒绝服从，体力消耗殆尽但仍坚持立场
2: (地点: 调教室 | 人物: 艾莉丝) 经过反复调教，艾莉丝开始出现屈服迹象，但内心仍抗拒
3: (地点: 调教室 | 人物: 艾莉丝 | 关系: 调教者与被调教者) 调教过程中提到她的过去，她曾是某个王国的公主，对哥布林有仇恨
...

### 5. **关键要求**
- **输出至少10个事件，尽量详尽**
- **保留核心剧情细节和关键对话**
- **体现角色关系、性格、立场的变化轨迹**
- **包含重要背景信息和世界观设定**
- **仅输出格式化的行，禁止输出任何分析过程或额外评论**

现在开始处理，直接输出格式化的结果：`;
  }

  /**
   * 构建通用总结提示词
   */
  private static buildGenericSummaryPrompt(content: string): string {
    return `请帮我总结以下内容，提取关键信息，生成简洁但保留重要细节的总结：

${content}

请用中文回复，保留重要的关键信息。`;
  }

  /**
   * 批量总结条目（使用AI）
   */
  static async batchSummarizeEntries(
    entries: WorldbookEntry[],
  ): Promise<Record<number, { summary: string; incremental: boolean }>> {
    const summaries: Record<number, { summary: string; incremental: boolean }> = {};

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryType = entry.extra?.entry_type || 'unknown';
      const entryName = entry.name || 'unnamed';

      // 判断是否为增量总结（检查是否有新格式的summary_N）
      const hasSummary = !!entry.content && /<summary_\d+>/.test(entry.content);

      console.log(
        `📄 [${i + 1}/${entries.length}] 处理条目: ${entryName}, 类型: ${entryType}, UID: ${entry.uid}, 增量: ${hasSummary}`,
      );

      try {
        const summary = await this.summarizeEntry(entry, hasSummary);
        summaries[entry.uid] = { summary, incremental: hasSummary };

        console.log(`✅ 生成摘要: ${summary.substring(0, 100)}...`);

        // 防止请求过快
        if (i < entries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ 总结失败: ${entryName}`, error);
        // 总结失败时不添加到summaries，这样就不会覆盖原内容
        console.warn(`⚠️ ${entryName} 总结失败，保持原内容不变`);
      }
    }

    return summaries;
  }

  /**
   * 生成总结内容（不更新世界书）
   * @param worldbookName 世界书名称
   * @param entryTypes 要总结的条目类型
   * @param characterIds 人物ID列表（仅对character_story_history生效）
   * @param toastRef 弹窗引用
   * @returns 总结结果：每个条目的总结内容和元数据
   */
  static async generateSummaries(
    worldbookName: string,
    entryTypes: string[],
    characterIds?: string[],
    toastRef?: any,
  ): Promise<Map<number, { summary: string; incremental: boolean; entryName: string; entryType: string }>> {
    const result = new Map<number, { summary: string; incremental: boolean; entryName: string; entryType: string }>();
    try {
      console.log('📚 开始压缩世界书:', { worldbookName, entryTypes, characterIds });

      const entries = await this.getWorldbookEntries(worldbookName);
      console.log(`📊 世界书包含 ${entries.length} 个条目`);

      // 打印所有条目的类型信息用于调试
      const entryTypeStats: Record<string, number> = {};
      entries.forEach(entry => {
        const type = entry.extra?.entry_type || 'unknown';
        entryTypeStats[type] = (entryTypeStats[type] || 0) + 1;
      });
      console.log('📋 条目类型统计:', entryTypeStats);

      // 过滤条目
      let filteredEntries = entryTypes.length > 0 ? this.filterEntriesByType(entries, entryTypes) : entries;

      // 分析哪些条目需要总结
      const beforeSummaryFilter = filteredEntries.length;
      const entriesWithNewData: WorldbookEntry[] = []; // 已有summary但有新数据的条目
      const entriesNeedingSummary: WorldbookEntry[] = []; // 完全没有summary的条目

      filteredEntries.forEach(entry => {
        // 检查是否有summary（只支持新格式<summary_N>）
        const hasSummary = entry.content && /<summary_\d+>/.test(entry.content);

        if (hasSummary) {
          // 检查是否有原始数据（所有summary之外的内容）
          const contentAfterSummaries = entry.content.replace(/<summary_\d+>[\s\S]*?<\/summary_\d+>\n*/g, '').trim();

          if (contentAfterSummaries.length > 0) {
            // 已有summary但有新数据，需要增量总结
            entriesWithNewData.push(entry);
          }
          // 如果只有summary没有新数据，跳过
        } else {
          // 完全没有summary，需要首次总结
          entriesNeedingSummary.push(entry);
        }
      });

      console.log(
        `📊 条目分析: ${entriesNeedingSummary.length} 个需要首次总结, ${entriesWithNewData.length} 个需要增量总结`,
      );

      // 合并需要总结的条目
      filteredEntries = [...entriesNeedingSummary, ...entriesWithNewData];

      if (beforeSummaryFilter > filteredEntries.length) {
        console.log(`⚠️ 跳过 ${beforeSummaryFilter - filteredEntries.length} 个已有完整总结的条目`);
      }

      console.log(`🔍 过滤后剩余 ${filteredEntries.length} 个条目`);

      // 如果指定了角色ID，进一步过滤（仅对character_story_history类型的条目）
      if (characterIds && characterIds.length > 0) {
        const beforeFilter = filteredEntries.length;
        filteredEntries = filteredEntries.filter(entry => {
          // 如果是人物剧情记录，需要匹配character_id
          if (entry.extra?.entry_type === 'character_story_history') {
            return characterIds.includes(entry.extra?.character_id || '');
          }
          // 其他类型的条目不进行人物过滤，直接保留
          return true;
        });
        console.log(
          `👤 按人物过滤后剩余 ${filteredEntries.length} 个条目 (${beforeFilter} -> ${filteredEntries.length})`,
        );
      }

      if (filteredEntries.length === 0) {
        console.warn('⚠️ 没有找到符合条件的条目');
        if (toastRef) {
          // 检查是否有已总结的条目被跳过
          const totalEntries = entryTypes.length > 0 ? this.filterEntriesByType(entries, entryTypes) : entries;
          const summarizedCount = totalEntries.filter(e => e.content && /<summary_\d+>/.test(e.content)).length;

          if (summarizedCount > 0) {
            toastRef.warning(`所有符合条件的条目都已被总结过了（共${summarizedCount}个）`);
          } else {
            toastRef.warning('没有找到符合条件的条目');
          }
        }
        return result;
      }

      console.log('📝 开始生成摘要...');

      // 生成总结前，先禁用相关条目避免重复信息（不包括思维链，思维链会切换到总结模式）
      console.log(`🔒 生成总结前，禁用 ${filteredEntries.length} 个相关条目以避免重复信息...`);
      const worldbook = await this.getWorldbookEntries(worldbookName);
      const entryUidsToDisable = new Set(filteredEntries.map(e => e.uid));
      let disabledCount = 0;

      // 保存思维链的原始模式，以便后续恢复
      let originalChainMode: ChainOfThoughtMode | null = null;
      const chainEntry = worldbook.find(
        entry => entry.extra?.entry_type === 'chain_of_thought' || entry.uid === 999999999,
      );
      if (chainEntry?.extra?.mode) {
        originalChainMode = chainEntry.extra.mode as ChainOfThoughtMode;
      }

      for (let i = 0; i < worldbook.length; i++) {
        const entry = worldbook[i];
        // 禁用需要总结的条目（不包括思维链）
        if (entryUidsToDisable.has(entry.uid)) {
          // 保存原始启用状态，以便取消时恢复
          if (!entry.extra) {
            entry.extra = {};
          }
          entry.extra._original_enabled = entry.enabled ?? true;
          entry.enabled = false;
          disabledCount++;
        }
      }

      if (disabledCount > 0) {
        await WorldbookHelper.replace(worldbookName, worldbook);
        console.log(`✅ 已禁用 ${disabledCount} 个条目`);
      }

      // 切换到总结模式的思维链
      await ChainOfThoughtManager.addChainToWorldbook(worldbookName, ChainOfThoughtMode.STORY_SUMMARY);
      console.log('🔄 已切换到剧情总结思维链模式');

      // 为每个条目生成总结（使用AI）
      // 注意：不在这里保存调教记录，而是在确认总结时再保存（确保使用正确的存档ID）
      console.log(`🤖 开始使用AI总结 ${filteredEntries.length} 个条目...`);
      const summaries = await this.batchSummarizeEntries(filteredEntries);

      // 将结果添加到返回的Map中
      for (const entry of filteredEntries) {
        if (summaries[entry.uid]) {
          const { summary, incremental } = summaries[entry.uid];
          result.set(entry.uid, {
            summary,
            incremental,
            entryName: entry.name || '未知条目',
            entryType: entry.extra?.entry_type || '未知类型',
          });
        }
      }

      console.log(`总结生成完成，共生成 ${result.size} 个条目的总结`);
      return result;
    } catch (error) {
      console.error('总结生成失败:', error);
      // 不在这里显示 toast，让调用方处理用户提示
      throw error;
    }
  }

  /**
   * 总结前，先保存所有需要总结的调教记录到数据库
   */
  private static async saveTrainingHistoryBeforeSummary(entries: WorldbookEntry[]): Promise<void> {
    try {
      const currentSaveId = databaseService.getCurrentSaveId();
      if (!currentSaveId) {
        console.log('ℹ️ 没有当前存档ID，跳过保存调教记录到数据库');
        return;
      }

      console.log(`💾 [确认总结] 保存调教记录到数据库，当前存档ID: ${currentSaveId}`);

      // 筛选出character_story_history类型的条目
      const characterHistoryEntries = entries.filter(entry => entry.extra?.entry_type === 'character_story_history');

      if (characterHistoryEntries.length === 0) {
        console.log('ℹ️ 没有需要保存的调教记录');
        return;
      }

      console.log(`💾 总结前保存 ${characterHistoryEntries.length} 个角色的调教记录到数据库...`);

      // 获取数据库中已有的所有数据（包括所有暂存数据）
      const existingDbData = await databaseService.loadTrainingHistoryData(currentSaveId);
      const allTrainingHistory: Record<string, HistoryRecord[]> = existingDbData || {};
      const existingPendingPairs: Record<string, { userInput: string; aiResponse: string } | null> = {};
      const existingPendingAttrs: Record<string, { loyalty: number; stamina: number; character: any } | null> = {};
      const existingOriginalChars: Record<string, any | null> = {};

      if (existingDbData?.pendingDialoguePairs) {
        Object.assign(existingPendingPairs, existingDbData.pendingDialoguePairs);
      }
      if (existingDbData?.pendingAttributeChanges) {
        Object.assign(existingPendingAttrs, existingDbData.pendingAttributeChanges);
      }
      if (existingDbData?.originalCharacters) {
        Object.assign(existingOriginalChars, existingDbData.originalCharacters);
      }

      // 为每个角色保存调教记录
      for (const entry of characterHistoryEntries) {
        const characterId = entry.extra?.character_id || '';
        const characterName = entry.extra?.character_name || entry.name || '未知人物';

        if (!characterId) {
          console.warn(`⚠️ 跳过没有character_id的条目: ${entry.name}`);
          continue;
        }

        // 从世界书中解析调教记录
        const records = TrainingRecordManager.parseTrainingHistory(entry.content || '');
        if (records.length > 0) {
          allTrainingHistory[characterName] = records;
          console.log(`✅ 已保存 ${characterName} 的 ${records.length} 条调教记录到数据库`);

          // 如果有暂存的对话对，也包含在内（但不清除，保持暂存状态）
          if (existingPendingPairs[characterName]) {
            console.log(`ℹ️ ${characterName} 有暂存的对话对，将一并保存`);
          }
        } else {
          console.log(`ℹ️ ${characterName} 没有调教记录或已被总结压缩`);
        }
      }

      // 保存回数据库（包括所有暂存数据）
      if (
        Object.keys(allTrainingHistory).length > 0 ||
        Object.keys(existingPendingPairs).length > 0 ||
        Object.keys(existingPendingAttrs).length > 0 ||
        Object.keys(existingOriginalChars).length > 0
      ) {
        await databaseService.saveTrainingHistoryData(
          currentSaveId,
          allTrainingHistory,
          existingPendingPairs,
          existingPendingAttrs,
          existingOriginalChars,
        );
        const pendingPairCount = Object.values(existingPendingPairs).filter(v => v !== null).length;
        const pendingAttrCount = Object.values(existingPendingAttrs).filter(v => v !== null).length;
        const originalCharCount = Object.values(existingOriginalChars).filter(v => v !== null).length;

        const extraInfo: string[] = [];
        if (pendingPairCount > 0) extraInfo.push(`${pendingPairCount} 个暂存对话对`);
        if (pendingAttrCount > 0) extraInfo.push(`${pendingAttrCount} 个暂存属性变化`);
        if (originalCharCount > 0) extraInfo.push(`${originalCharCount} 个原始人物属性`);

        if (extraInfo.length > 0) {
          console.log(`✅ 总结前已将所有调教记录保存到数据库，包含 ${extraInfo.join('、')}`);
        } else {
          console.log(`✅ 总结前已将所有调教记录保存到数据库`);
        }
      }
    } catch (error) {
      console.error('保存调教记录到数据库失败:', error);
      // 不抛出错误，避免影响总结流程
    }
  }

  /**
   * 应用总结到世界书
   * @param worldbookName 世界书名称
   * @param summaries 总结内容Map，key为entry UID，value为总结内容
   */
  static async applySummaries(
    worldbookName: string,
    summaries: Map<number, { summary: string; incremental: boolean; entryName?: string; entryType?: string }>,
  ): Promise<void> {
    try {
      // 确认总结时，先保存所有需要总结的调教记录到数据库（此时存档ID是正确的）
      const worldbook = await WorldbookHelper.get(worldbookName);
      const entriesToSummarize = worldbook.filter(entry => summaries.has(entry.uid));
      await this.saveTrainingHistoryBeforeSummary(entriesToSummarize);

      let updatedCount = 0;

      for (let i = 0; i < worldbook.length; i++) {
        const entry = worldbook[i];
        if (summaries.has(entry.uid)) {
          const { summary: summaryContentRaw, incremental } = summaries.get(entry.uid)!;

          // 清理AI返回内容中可能包含的summary标签，避免嵌套或连续的summary
          let summaryContent = summaryContentRaw;
          if (/<summary_\d+>/.test(summaryContent)) {
            // 移除所有summary_N标签，只保留标签内的内容
            // 需要递归处理，因为可能有嵌套的summary标签
            let previousContent = '';
            while (previousContent !== summaryContent) {
              previousContent = summaryContent;
              // 处理新格式 <summary_N>...</summary_N>（需要匹配数字）
              summaryContent = summaryContent.replace(/<summary_(\d+)>([\s\S]*?)<\/summary_\1>/g, '$2');
            }
            summaryContent = summaryContent.trim();
            console.log('🧹 清理了AI返回内容中的summary标签');
          }

          // 检查清理后的内容是否为空
          if (!summaryContent || summaryContent.trim().length === 0) {
            console.warn('⚠️ AI生成的总结内容为空，跳过保存');
            continue; // 跳过这个条目，不保存空内容
          }

          let newContent = '';

          if (incremental) {
            // 增量总结：寻找已有的summary序号，新增下一个序号（只支持新格式<summary_N>）
            const existingSummaries: Array<{ index: number; content: string; innerContent: string }> = [];

            // 查找新格式的 summary_N
            const summaryMatches = entry.content.matchAll(/<summary_(\d+)>([\s\S]*?)<\/summary_\1>/g);
            for (const match of summaryMatches) {
              const innerContent = match[2].trim(); // 标签内的实际内容
              // 只保留非空的summary标签，过滤掉空内容的summary
              if (innerContent.length > 0) {
                existingSummaries.push({
                  index: parseInt(match[1]),
                  content: match[0],
                  innerContent,
                });
              } else {
                console.warn(`⚠️ 发现空的summary_${match[1]}标签，已过滤`);
              }
            }

            // 找到最大的序号
            const maxIndex = existingSummaries.length > 0 ? Math.max(...existingSummaries.map(s => s.index)) : 0;
            const nextIndex = maxIndex + 1;

            // 组合所有非空的summary
            const allSummaries = existingSummaries.map(s => s.content).join('\n\n');
            const newSummary = `<summary_${nextIndex}>\n${summaryContent}\n</summary_${nextIndex}>`;

            if (allSummaries) {
              newContent = `${allSummaries}\n\n${newSummary}`;
            } else {
              newContent = newSummary;
            }

            console.log(`📝 增量总结: 添加到summary_${nextIndex}（保留${existingSummaries.length}个已有summary）`);
          } else {
            // 首次总结：使用summary_1
            newContent = `<summary_1>\n${summaryContent}\n</summary_1>`;
            console.log('📝 首次总结: 创建summary_1');
          }

          // 更新条目内容
          worldbook[i] = {
            ...entry,
            content: newContent,
            enabled: true,
            extra: {
              ...entry.extra,
              has_summary: true,
              summary_updated_at: new Date().toISOString(),
              summary_updated_at_readable: new Date().toLocaleString('zh-CN'),
              original_data_removed: true,
              original_data_removed_at: new Date().toISOString(),
            },
          };

          updatedCount++;
        }
      }

      await WorldbookHelper.replace(worldbookName, worldbook);
      console.log(`成功应用 ${updatedCount} 个条目的总结`);
    } catch (error) {
      console.error('应用总结失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`应用总结失败: ${errorMessage}`);
    }
  }

  /**
   * 恢复被禁用的世界书条目（用于取消总结时）
   * @param worldbookName 世界书名称
   * @param entryUids 要恢复的条目UID列表
   */
  static async restoreDisabledEntries(worldbookName: string, entryUids: number[]): Promise<void> {
    try {
      const worldbook = await WorldbookHelper.get(worldbookName);
      let restoredCount = 0;

      for (let i = 0; i < worldbook.length; i++) {
        const entry = worldbook[i];
        // 恢复指定的总结条目
        if (entryUids.includes(entry.uid)) {
          // 恢复原始启用状态
          const originalEnabled = entry.extra?._original_enabled ?? true;
          entry.enabled = originalEnabled;

          // 清除临时存储的原始状态
          if (entry.extra && '_original_enabled' in entry.extra) {
            delete entry.extra._original_enabled;
          }

          restoredCount++;
        }
        // 同时恢复思维链条目（检查是否有保存的原始状态）
        else if (
          (entry.extra?.entry_type === 'chain_of_thought' || entry.uid === 999999999) &&
          entry.extra &&
          '_original_enabled' in entry.extra
        ) {
          // 恢复原始启用状态
          const originalEnabled = entry.extra._original_enabled ?? true;
          entry.enabled = originalEnabled;

          // 清除临时存储的原始状态
          delete entry.extra._original_enabled;

          restoredCount++;
        }
      }

      if (restoredCount > 0) {
        await WorldbookHelper.replace(worldbookName, worldbook);
        // 检查是否恢复了思维链
        const chainRestored = worldbook.some(
          e =>
            (e.extra?.entry_type === 'chain_of_thought' || e.uid === 999999999) &&
            !('_original_enabled' in (e.extra || {})) &&
            e.enabled === true,
        );
        const messages = [`✅ 已恢复 ${restoredCount} 个条目的启用状态`];
        if (chainRestored) {
          messages.push('（包含思维链）');
        }
        console.log(messages.join(' '));
      }
    } catch (error) {
      console.error('恢复禁用条目失败:', error);
      throw error;
    }
  }

  /**
   * 获取世界书中的人物列表（用于剧情总结）
   * 返回所有有剧情记录的角色的ID和名称
   */
  static async getCharactersInWorldbook(worldbookName: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const entries = await this.getWorldbookEntries(worldbookName);

      // 从character_story_history类型的条目中提取人物信息
      const characterStoryEntries = entries.filter(entry => entry.extra?.entry_type === 'character_story_history');

      // 使用Map去重，因为同一人物可能有多条剧情记录
      const characterMap = new Map<string, { id: string; name: string }>();

      characterStoryEntries.forEach(entry => {
        const characterId = entry.extra?.character_id || '';
        const characterName = entry.extra?.character_name || entry.name || '未知人物';

        if (characterId && !characterMap.has(characterId)) {
          characterMap.set(characterId, { id: characterId, name: characterName });
        }
      });

      return Array.from(characterMap.values());
    } catch (error) {
      console.error('获取人物列表失败:', error);
      return [];
    }
  }
}
