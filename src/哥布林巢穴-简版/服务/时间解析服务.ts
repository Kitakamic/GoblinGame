/**
 * 时间解析服务
 * 用于处理游戏时间格式转换
 */

export class TimeParseService {
  // 游戏开始时间：帝国历1074年1月1日
  private static readonly START_YEAR = 1074;
  private static readonly START_MONTH = 1;
  private static readonly START_DAY = 1;

  // 季节月份定义（基于帝国历月份）
  private static readonly SEASON_MONTHS = {
    SPRING: [1, 2, 3], // 春季：1-3月
    SUMMER: [4, 5, 6], // 夏季：4-6月
    AUTUMN: [7, 8, 9], // 秋季：7-9月
    WINTER: [10, 11, 12], // 冬季：10-12月
  };

  /**
   * 获取游戏时间信息
   * @param rounds 回合数
   * @param includeSeason 是否包含季节信息
   * @returns 时间信息对象
   */
  static getTimeInfo(
    rounds: number,
    includeSeason: boolean = false,
  ): {
    formattedDate: string;
    season?: string;
    seasonEmoji?: string;
  } {
    // 根据回合数计算游戏时间（天数）
    const totalDays = (rounds || 0) * 7;

    const dateInfo = this.calculateDate(totalDays);
    const formattedDate = `帝国历${dateInfo.year}年${dateInfo.month}月${dateInfo.day}日`;

    const result: any = { formattedDate };

    if (includeSeason) {
      const season = this.getSeason(totalDays);
      result.season = season;
      result.seasonEmoji = this.getSeasonEmoji(season);
    }

    return result;
  }

  /**
   * 计算游戏时间对应的日期信息
   * @param gameTime 游戏时间（天数）
   * @returns 日期信息对象
   */
  private static calculateDate(gameTime: number): { year: number; month: number; day: number } {
    const totalDays = Math.floor(gameTime || 0);

    let year = this.START_YEAR;
    let month = this.START_MONTH;
    let day = this.START_DAY;

    // 添加天数
    day += totalDays;

    // 处理月份和年份的进位
    while (day > 30) {
      // 简化：每月30天
      day -= 30;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return { year, month, day };
  }

  /**
   * 获取当前季节
   * @param gameTime 游戏时间（天数）
   * @returns 季节名称
   */
  static getSeason(gameTime: number): string {
    const dateInfo = this.calculateDate(gameTime);
    const month = dateInfo.month;

    if (this.SEASON_MONTHS.SPRING.includes(month)) {
      return '春季';
    } else if (this.SEASON_MONTHS.SUMMER.includes(month)) {
      return '夏季';
    } else if (this.SEASON_MONTHS.AUTUMN.includes(month)) {
      return '秋季';
    } else {
      return '冬季';
    }
  }

  /**
   * 获取季节表情符号
   * @param season 季节名称
   * @returns 季节表情符号
   */
  static getSeasonEmoji(season: string): string {
    const seasonEmojis: Record<string, string> = {
      春季: '🌸',
      夏季: '☀️',
      秋季: '🍂',
      冬季: '❄️',
    };
    return seasonEmojis[season] || '🌤️';
  }
}
