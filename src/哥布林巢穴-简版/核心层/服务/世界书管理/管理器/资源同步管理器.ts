import type { Continent } from '../../../../功能模块层/探索/类型/大陆探索类型';
import { TimeParseService } from '../../通用服务/时间解析服务';
import { WorldbookHelper } from '../工具/世界书助手';
import type { WorldbookEntry } from '../类型/世界书类型定义';

/**
 * 资源世界书管理器 - 负责管理资源相关的世界书条目
 */
export class ResourcesWorldbookManager {
  /**
   * 初始化资源世界书条目（游戏开始时创建）
   */
  static async initialize(worldbookName: string, resources: any, continents: Continent[] = []): Promise<void> {
    try {
      await WorldbookHelper.ensureExists(worldbookName);

      await WorldbookHelper.updateOrCreateEntry(
        worldbookName,
        entry => entry.extra?.entry_type === 'resources',
        entry => ({
          ...entry,
          content: this.buildContent(resources, continents),
          extra: {
            ...entry.extra,
            updated_at: new Date().toISOString(),
          },
        }),
        () => this.createEntry(this.buildContent(resources, continents)),
      );

      console.log('资源世界书条目初始化完成');
    } catch (error) {
      console.error('初始化资源世界书条目失败:', error);
      throw error;
    }
  }

  /**
   * 更新资源世界书条目
   */
  static async update(worldbookName: string, resources: any, continents: Continent[] = []): Promise<void> {
    try {
      await WorldbookHelper.ensureExists(worldbookName);

      await WorldbookHelper.updateOrCreateEntry(
        worldbookName,
        entry => entry.extra?.entry_type === 'resources',
        entry => ({
          ...entry,
          content: this.buildContent(resources, continents),
          extra: {
            ...entry.extra,
            updated_at: new Date().toISOString(),
          },
        }),
        () => this.createEntry(this.buildContent(resources, continents)),
      );

      console.log('资源世界书条目更新完成');
    } catch (error) {
      console.error('更新资源世界书条目失败:', error);
      throw error;
    }
  }

  /**
   * 创建资源世界书条目
   */
  private static createEntry(content: string): WorldbookEntry {
    return {
      uid: Date.now(),
      name: '哥布林巢穴资源状态',
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
        depth: 4,
        order: 115,
      },
      content: content,
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
        entry_type: 'resources',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * 构建资源内容
   */
  private static buildContent(resources: any, continents: Continent[] = []): string {
    // 根据回合数获取格式化的日期
    const rounds = resources.rounds || 0;
    const formattedDate = TimeParseService.getTimeInfo(rounds).formattedDate;

    // 构建大陆和区域征服信息
    let continentInfo = '';

    if (continents && continents.length > 0) {
      continentInfo = '\n\n# 大陆征服进度\n';

      for (const continent of continents) {
        // 只显示已解锁的大陆
        if (continent.isUnlocked) {
          const conquestStatus = continent.isConquered ? '✅ 已征服' : '🔄 征服中';
          continentInfo += `\n## ${continent.name} ${conquestStatus}\n`;
          continentInfo += `- 大陆征服进度: ${continent.conquestProgress.toFixed(1)}%\n`;

          // 显示该大陆下的区域信息
          if (continent.regions && continent.regions.length > 0) {
            const unlockedRegions = continent.regions.filter(r => r.isUnlocked);
            if (unlockedRegions.length > 0) {
              continentInfo += `- 区域进度:\n`;
              for (const region of unlockedRegions) {
                const regionStatus = region.isConquered ? '✅' : '🔄';
                continentInfo += `  - ${regionStatus} ${region.name}: ${region.conquestProgress.toFixed(1)}%\n`;
              }
            }
          }
        }
      }
    }

    return `<NestStatus>
# 哥布林巢穴资源状态

# 基础资源
- 金币: ${(resources.gold || 0).toLocaleString()}
- 食物: ${(resources.food || 0).toLocaleString()}
- 普通奴隶: ${resources.slaves || 0}
- 高级女奴: ${resources.trainingSlaves || 0}
- 普通哥布林: ${resources.normalGoblins || 0}
- 哥布林战士: ${resources.warriorGoblins || 0}
- 哥布林萨满: ${resources.shamanGoblins || 0}
- 哥布林圣骑士: ${resources.paladinGoblins || 0}

# 时间信息
- 当前时间: ${formattedDate}
- 回合数: ${rounds}
- 威胁度: ${resources.threat || 0}${continentInfo}

# 说明
- 这是哥布林巢穴的当前状态
- 参考这些数据来考虑剧情发展情况
</NestStatus>`;
  }
}
