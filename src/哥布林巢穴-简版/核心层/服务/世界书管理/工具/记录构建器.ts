import type { HistoryRecord } from '../类型/世界书类型定义';

/**
 * 记录构建器 - 负责构建各种历史记录内容
 */
export class RecordBuilder {
  /**
   * 按时间戳排序记录
   */
  static sortByTimestamp(records: HistoryRecord[]): HistoryRecord[] {
    return [...records].sort((a, b) => {
      const timestampA = a.timestamp || 0;
      const timestampB = b.timestamp || 0;
      return timestampA - timestampB;
    });
  }

  /**
   * 格式化记录的时间信息
   */
  static formatRecordTime(record: HistoryRecord): { date: string; sender?: string } {
    // gameTime 已经是格式化的日期字符串，直接使用
    const date = record.gameTime || '未知时间';
    const sender = record.sender === 'user' ? '{{user}}' : record.sender;

    return { date, sender };
  }

  /**
   * 构建战前对话记录部分（带XML标签）
   */
  static buildDialogueSection(dialogueHistory: HistoryRecord[]): string {
    let content = `<dialogue_history>\n`;

    if (dialogueHistory.length > 0) {
      const sortedHistory = this.sortByTimestamp(dialogueHistory);
      sortedHistory.forEach(record => {
        const { date, sender } = this.formatRecordTime(record);
        content += `[${date}] ${sender}: ${record.content}\n`;
      });
    } else {
      content += `暂无战前对话记录。\n`;
    }

    content += `</dialogue_history>\n\n`;
    return content;
  }

  /**
   * 构建战斗总结记录部分（带XML标签）
   */
  static buildBattleSummarySection(battleSummaryHistory: HistoryRecord[]): string {
    if (!battleSummaryHistory || !Array.isArray(battleSummaryHistory) || battleSummaryHistory.length === 0) {
      return '';
    }

    // 过滤掉无效记录
    const validRecords = battleSummaryHistory.filter(record => {
      return record && record.content && record.content !== 'undefined' && record.content.trim() !== '';
    });

    if (validRecords.length === 0) {
      return '';
    }

    let content = `<battlesummary>\n`;
    const sortedHistory = this.sortByTimestamp(validRecords);

    sortedHistory.forEach(record => {
      const { date } = this.formatRecordTime(record);
      content += `[${date}] ${record.content}\n`;
    });

    content += `</battlesummary>\n\n`;
    return content;
  }

  /**
   * 构建调教记录部分（带XML标签）
   */
  static buildTrainingSection(trainingHistory: HistoryRecord[]): string {
    let content = `<training_history>\n`;

    if (trainingHistory.length > 0) {
      const sortedHistory = this.sortByTimestamp(trainingHistory);
      sortedHistory.forEach(record => {
        const { date, sender } = this.formatRecordTime(record);
        content += `[${date}] ${sender}: ${record.content}\n`;
      });
    } else {
      content += `暂无调教记录。\n`;
    }

    content += `</training_history>\n`;
    return content;
  }

  /**
   * 构建游戏事件故事内容（带XML标签）
   */
  static buildEventStoryContent(eventRecords: HistoryRecord[]): string {
    let content = `<event_records>\n`;

    if (eventRecords.length > 0) {
      const sortedRecords = this.sortByTimestamp(eventRecords);
      sortedRecords.forEach(record => {
        const { date } = this.formatRecordTime(record);
        content += `[${date}] ${record.content}\n`;
      });
    } else {
      content += `暂无事件记录。\n`;
    }

    content += `</event_records>\n`;

    return content;
  }
}
