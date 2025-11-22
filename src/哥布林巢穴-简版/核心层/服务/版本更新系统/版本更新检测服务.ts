/**
 * 版本更新检测服务
 * 用于检测当前版本和远程最新版本，并在有新版本时提示用户更新
 */

import { FRONTEND_VERSION } from '../../../version';
import { ConfirmService } from '../通用服务/确认框服务';

// 版本列表文件的 URL
const VERSION_LIST_URL = 'https://kitakamis.online/versions.json';

// 版本信息接口
interface VersionInfo {
  version: string;
  description: string;
  date: string;
}

interface VersionList {
  versions: VersionInfo[];
}

/**
 * 比较两个版本号的大小
 * @param version1 版本号1 (例如: "1.5.4.2")
 * @param version2 版本号2 (例如: "1.5.4.3")
 * @returns 1 表示 version1 > version2, -1 表示 version1 < version2, 0 表示相等
 */
function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split('.').map(Number);
  const parts2 = version2.split('.').map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) {
      return 1;
    }
    if (part1 < part2) {
      return -1;
    }
  }

  return 0;
}

/**
 * 获取远程最新版本信息
 * @returns 最新版本信息，如果获取失败返回 null
 */
async function getLatestVersion(): Promise<VersionInfo | null> {
  try {
    console.log('🔍 [版本检测] 开始检查远程版本列表:', VERSION_LIST_URL);

    const response = await fetch(VERSION_LIST_URL, {
      cache: 'no-cache', // 禁用缓存，确保获取最新版本
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: VersionList = await response.json();

    if (!data.versions || !Array.isArray(data.versions) || data.versions.length === 0) {
      throw new Error('版本列表格式错误：versions 数组为空');
    }

    // 版本列表已经按版本号降序排列（最新版本在前）
    const latestVersion = data.versions[0];
    console.log('✅ [版本检测] 获取到最新版本:', latestVersion);

    return latestVersion;
  } catch (error) {
    console.error('❌ [版本检测] 获取远程版本失败:', error);
    return null;
  }
}

/**
 * 检测是否有新版本可用
 * @returns 如果有新版本，返回新版本信息；否则返回 null
 */
export async function checkForUpdates(): Promise<VersionInfo | null> {
  try {
    const currentVersion = FRONTEND_VERSION;
    console.log('📋 [版本检测] 当前版本:', currentVersion);

    // 获取最新版本
    const latestVersion = await getLatestVersion();

    if (!latestVersion) {
      console.log('⚠️ [版本检测] 无法获取最新版本信息');
      return null;
    }

    // 比较版本号
    const comparison = compareVersions(currentVersion, latestVersion.version);

    if (comparison < 0) {
      // 当前版本小于最新版本，有新版本可用
      console.log('🆕 [版本检测] 发现新版本:', latestVersion.version);
      return latestVersion;
    } else if (comparison === 0) {
      console.log('✅ [版本检测] 当前版本已是最新版本');
      return null;
    } else {
      // 当前版本大于远程版本（可能是开发版本）
      console.log('⚠️ [版本检测] 当前版本高于远程版本（可能是开发版本）');
      return null;
    }
  } catch (error) {
    console.error('❌ [版本检测] 检测过程出错:', error);
    return null;
  }
}

/**
 * 显示更新提示弹窗
 * @param newVersion 新版本信息
 */
export async function showUpdateNotification(newVersion: VersionInfo): Promise<void> {
  const message =
    `发现新版本 ${newVersion.version}！\n\n` +
    `更新时间：${newVersion.date}\n` +
    `更新说明：${newVersion.description}\n\n` +
    `是否前往版本管理页面切换版本？`;

  const confirmed = await ConfirmService.showConfirm({
    title: '🆕 发现新版本',
    message: message,
    confirmText: '前往版本管理',
    cancelText: '稍后提醒',
    details: `当前版本：${FRONTEND_VERSION}\n最新版本：${newVersion.version}`,
  });

  if (confirmed) {
    // 触发打开设置面板和版本管理的事件
    console.log('✅ [版本检测] 用户选择前往版本管理');
    window.dispatchEvent(
      new CustomEvent('open-version-manager', {
        detail: { version: newVersion.version },
      }),
    );
  } else {
    console.log('ℹ️ [版本检测] 用户选择稍后提醒');
  }
}

/**
 * 自动检测并提示更新
 * 在应用加载时调用此函数
 */
export async function autoCheckForUpdates(): Promise<void> {
  try {
    console.log('🔍 [版本检测] 开始自动检测更新...');

    // 延迟一小段时间，确保应用已经加载完成
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newVersion = await checkForUpdates();

    if (newVersion) {
      // 延迟显示提示，避免干扰其他弹窗（如欢迎提示）
      setTimeout(async () => {
        await showUpdateNotification(newVersion);
      }, 2000);
    }
  } catch (error) {
    console.error('❌ [版本检测] 自动检测更新失败:', error);
  }
}
