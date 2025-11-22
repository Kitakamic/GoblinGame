/**
 * 版本更新检测服务
 * 用于检测当前版本和远程最新版本，并在有新版本时提示用户更新
 */

import { FRONTEND_VERSION, FRONTEND_VERSION_TYPE } from '../../../version';
import { ConfirmService } from '../通用服务/确认框服务';

// 版本列表文件的 URL
const VERSION_LIST_URL = 'https://kitakamis.online/versions.json';

// 版本信息接口
interface VersionInfo {
  version: string;
  description: string;
  date: string;
  type?: 'stable' | 'beta'; // 版本类型：稳定版或测试版
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
 * @param stableOnly 是否只检查稳定版，默认为 true
 * @returns 最新版本信息，如果获取失败返回 null
 */
async function getLatestVersion(stableOnly: boolean = true): Promise<VersionInfo | null> {
  try {
    console.log('🔍 [版本检测] 开始检查远程版本列表:', VERSION_LIST_URL);
    console.log('📋 [版本检测] 检查模式:', stableOnly ? '仅稳定版' : '所有版本');

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

    // 如果只检查稳定版，过滤出稳定版版本
    let versionsToCheck = data.versions;
    if (stableOnly) {
      versionsToCheck = data.versions.filter(v => {
        // 如果没有 type 字段，默认为稳定版（向后兼容）
        return !v.type || v.type === 'stable';
      });

      if (versionsToCheck.length === 0) {
        console.log('⚠️ [版本检测] 没有找到稳定版版本');
        return null;
      }
    }

    // 版本列表已经按版本号降序排列（最新版本在前）
    const latestVersion = versionsToCheck[0];
    console.log('✅ [版本检测] 获取到最新版本:', latestVersion);

    return latestVersion;
  } catch (error) {
    console.error('❌ [版本检测] 获取远程版本失败:', error);
    return null;
  }
}

/**
 * 检测是否有新版本可用
 * @param stableOnly 是否只检查稳定版，默认为 true（只检查稳定版）
 * @returns 如果有新版本，返回新版本信息；否则返回 null
 */
export async function checkForUpdates(stableOnly: boolean = true): Promise<VersionInfo | null> {
  try {
    const currentVersion = FRONTEND_VERSION;
    const currentVersionType = FRONTEND_VERSION_TYPE;
    console.log('📋 [版本检测] 当前版本:', currentVersion, `(${currentVersionType})`);

    // 获取最新版本（默认只检查稳定版）
    const latestVersion = await getLatestVersion(stableOnly);

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
 * 直接切换到指定版本
 * @param version 要切换到的版本号
 */
async function switchToVersion(version: string): Promise<void> {
  // 使用全局函数（这些函数在酒馆环境中全局可用）
  const getTavernRegexes = (globalThis as any).getTavernRegexes;
  const replaceTavernRegexes = (globalThis as any).replaceTavernRegexes;

  if (!getTavernRegexes || !replaceTavernRegexes) {
    throw new Error('无法访问酒馆正则函数，请确保在酒馆环境中运行。');
  }

  try {
    const targetUrl = `https://kitakamis.online/index-v${version}.html`;

    // 获取所有酒馆正则
    const regexes = getTavernRegexes({ scope: 'character' });
    console.log('📋 [版本更新] 当前角色卡酒馆正则数量:', regexes.length);

    // 查找稳定的"自动更新CDN"正则（玩家必定有此正则才能看到界面）
    const stableRegex = regexes.find((regex: any) => regex.script_name === '自动更新CDN');

    if (!stableRegex) {
      throw new Error('未找到"自动更新CDN"正则，无法切换版本。');
    }

    // 查找版本切换正则（新建的，指向指定版本）
    let versionRegex = regexes.find((regex: any) => regex.script_name === '版本切换');

    // 读取原有正则的 find_regex 和 replace_string，只替换 URL
    const originalFindRegex = stableRegex.find_regex;
    const originalReplaceString = stableRegex.replace_string;

    // 在 replace_string 中替换 URL
    // 匹配 https://kitakamis.online/index(-v[版本号])?.html
    const newReplaceString = originalReplaceString.replace(
      /https:\/\/kitakamis\.online\/index(-v[\d.]+)?\.html/g,
      targetUrl,
    );

    if (versionRegex) {
      // 更新现有版本切换正则，使用原有的 find_regex 和替换后的 replace_string
      versionRegex.find_regex = originalFindRegex;
      versionRegex.replace_string = newReplaceString;
      versionRegex.enabled = true;
      console.log('✅ [版本更新] 已更新版本切换正则 URL');
    } else {
      // 创建新的版本切换正则，复制原有正则的所有配置，只替换 URL
      versionRegex = {
        id: `version_switch_${Date.now()}`,
        script_name: '版本切换',
        enabled: true,
        run_on_edit: stableRegex.run_on_edit,
        scope: stableRegex.scope,
        find_regex: originalFindRegex,
        replace_string: newReplaceString,
        source: { ...stableRegex.source },
        destination: { ...stableRegex.destination },
        min_depth: stableRegex.min_depth,
        max_depth: stableRegex.max_depth,
      };
      regexes.push(versionRegex);
      console.log('✅ [版本更新] 已创建版本切换正则');
    }

    // 禁用"自动更新CDN"正则，启用版本切换正则
    stableRegex.enabled = false;
    versionRegex.enabled = true;
    console.log('✅ [版本更新] 已禁用"自动更新CDN"正则，启用版本切换正则');

    // 替换所有酒馆正则
    await replaceTavernRegexes(regexes, { scope: 'character' });
    console.log('✅ [版本更新] 酒馆正则已更新');

    // 提示用户需要重新加载
    await ConfirmService.showSuccess(`已切换到版本 ${version}，页面将重新加载以应用更改。`, '版本切换成功');

    // 延迟一下再重新加载，让用户看到提示
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ [版本更新] 切换版本失败:', error);
    await ConfirmService.showWarning(
      `切换版本失败：${error instanceof Error ? error.message : String(error)}`,
      '切换失败',
    );
    throw error;
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
    `是否直接更新到最新版本？\n（也可以前往版本管理页面选择其他版本）`;

  const result = await ConfirmService.showConfirm({
    title: '🆕 发现新版本',
    message: message,
    confirmText: '直接更新',
    cancelText: '前往版本管理',
    details: `当前版本：${FRONTEND_VERSION}\n最新版本：${newVersion.version}`,
  });

  // 处理不同的用户操作
  if (result === true) {
    // 用户点击了"直接更新"按钮
    console.log('✅ [版本检测] 用户选择直接更新到最新版本');
    try {
      await switchToVersion(newVersion.version);
    } catch (error) {
      // 如果直接更新失败，提示用户前往版本管理
      console.error('❌ [版本检测] 直接更新失败，提示用户前往版本管理');
      const goToManager = await ConfirmService.showConfirm({
        title: '更新失败',
        message: '直接更新失败，是否前往版本管理页面手动切换版本？',
        confirmText: '前往版本管理',
        cancelText: '取消',
      });

      if (goToManager) {
        window.dispatchEvent(
          new CustomEvent('open-version-manager', {
            detail: { version: newVersion.version },
          }),
        );
      }
    }
  } else if (result === false) {
    // 用户点击了"前往版本管理"按钮
    console.log('✅ [版本检测] 用户选择前往版本管理');
    window.dispatchEvent(
      new CustomEvent('open-version-manager', {
        detail: { version: newVersion.version },
      }),
    );
  } else if (result === 'close') {
    // 用户点击了关闭按钮或失焦（点击外部），直接关闭，不打开版本管理
    console.log('ℹ️ [版本检测] 用户关闭了更新提示弹窗');
    // 不做任何操作，直接关闭
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

    // 读取用户设置：是否检查测试版更新（默认只检查稳定版）
    // 使用全局函数（这些函数在酒馆环境中全局可用）
    const getVariables = (globalThis as any).getVariables;
    let checkBetaVersion = false;
    if (getVariables) {
      const globalVars = getVariables({ type: 'global' });
      checkBetaVersion =
        typeof globalVars['check_beta_version'] === 'boolean' ? globalVars['check_beta_version'] : false;
    }

    console.log('📋 [版本检测] 检查测试版更新:', checkBetaVersion ? '开启' : '关闭（仅稳定版）');

    // 根据用户设置决定是否检查测试版（默认只检查稳定版）
    const newVersion = await checkForUpdates(!checkBetaVersion);

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
