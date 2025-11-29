<template>
  <div class="version-manager-content">
    <div class="current-version-section">
      <h3 class="section-title">当前版本</h3>
      <div class="version-info">
        <div class="version-item">
          <span class="version-label">版本号：</span>
          <span class="version-value">{{ FRONTEND_VERSION }}</span>
        </div>
        <div class="version-item">
          <span class="version-label">更新时间：</span>
          <span class="version-value">{{ FRONTEND_UPDATE_DATE }}</span>
        </div>
        <div class="version-item">
          <span class="version-label">版本描述：</span>
          <span class="version-value">{{ FRONTEND_DESCRIPTION }}</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="version-switch-section">
      <h3 class="section-title">切换版本</h3>
      <p class="section-desc">
        切换版本将修改正则中的URL，页面会重新加载。当前未保存的数据将丢失，建议在切换前保存重要数据。
        <br />
        <strong>注意：</strong>切换版本会修改酒馆正则，指向对应版本文件
      </p>

      <div class="version-input-container">
        <label class="version-input-label">选择要使用的版本：</label>
        <div class="version-input-wrapper">
          <div v-if="isLoadingVersions" class="version-loading">
            <span>正在加载版本列表...</span>
          </div>
          <div v-else-if="versionListError" class="version-error">
            <span>⚠️ 加载版本列表失败: {{ versionListError }}</span>
            <button class="retry-button" @click="loadVersionList">重试</button>
          </div>
          <div v-else-if="availableVersions.length === 0" class="version-loading">
            <span>暂无可用版本，请点击重试按钮加载</span>
            <button class="retry-button" style="margin-top: 8px" @click="loadVersionList">重试</button>
          </div>
          <select v-else v-model="selectedVersionNumber" class="version-select">
            <option value="" disabled>请选择版本</option>
            <option v-for="version in availableVersions" :key="version.version" :value="version.version">
              {{ version.version }} {{ version.type === 'beta' ? '[测试版]' : '[稳定版]' }} -
              {{ version.description }} ({{ version.date }})
            </option>
          </select>
        </div>
        <!-- 调试信息 -->
        <div
          v-if="!isLoadingVersions && !versionListError && availableVersions.length > 0"
          style="margin-top: 8px; font-size: 12px; color: #9ca3af"
        >
          已加载 {{ availableVersions.length }} 个版本，当前选择：{{ selectedVersionNumber || '未选择' }}
        </div>
      </div>
    </div>

    <div class="warning-section">
      <div class="warning-box">
        <span class="warning-icon">⚠️</span>
        <div class="warning-content">
          <p class="warning-title">注意事项</p>
          <ul class="warning-list">
            <li>不同版本的存档可能不兼容</li>
            <li>切换版本会重新加载页面，当前未保存的数据将丢失</li>
            <li>建议在切换前备份存档</li>
            <li>如果遇到问题，可以切换回之前的版本</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="version-actions">
      <button
        class="switch-button"
        :disabled="!canSwitch"
        :class="{ disabled: !canSwitch }"
        @click="handleSwitchVersion"
      >
        切换版本并重新加载
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { FRONTEND_DESCRIPTION, FRONTEND_UPDATE_DATE, FRONTEND_VERSION } from '../../version';
import { ConfirmService } from '../../核心层/服务/通用服务/确认框服务';

interface Props {
  autoLoad?: boolean;
  visible?: boolean; // 组件是否可见
}

const props = withDefaults(defineProps<Props>(), {
  autoLoad: true,
  visible: true,
});

// 版本信息接口
interface VersionInfo {
  version: string;
  description: string;
  date: string;
  type?: 'stable' | 'beta';
}

interface VersionList {
  versions: VersionInfo[];
}

const selectedVersionNumber = ref<string>('');
const availableVersions = ref<VersionInfo[]>([]);
const isLoadingVersions = ref(false);
const versionListError = ref<string>('');

// 版本列表文件的 URL
const VERSION_LIST_URL = 'https://kitakamis.online/versions.json';

// 加载版本列表
const loadVersionList = async () => {
  isLoadingVersions.value = true;
  versionListError.value = '';

  try {
    console.log('📥 开始加载版本列表:', VERSION_LIST_URL);
    const response = await fetch(VERSION_LIST_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: VersionList = await response.json();

    if (!data.versions || !Array.isArray(data.versions)) {
      throw new Error('版本列表格式错误：缺少 versions 数组');
    }

    // 按版本号降序排列（最新版本在前）
    availableVersions.value = data.versions.sort((a, b) => {
      const aParts = a.version.split('.').map(Number);
      const bParts = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart !== bPart) {
          return bPart - aPart; // 降序
        }
      }
      return 0;
    });

    console.log('✅ 版本列表加载成功:', availableVersions.value);
    console.log('📋 版本数量:', availableVersions.value.length);
    console.log(
      '📋 版本详情:',
      availableVersions.value.map(v => ({ version: v.version, type: v.type, description: v.description })),
    );

    // 如果没有选中版本，默认选择第一个（最新版本）
    if (availableVersions.value.length > 0) {
      // 始终选择第一个版本（最新版本）
      const firstVersion = availableVersions.value[0].version;
      // 直接设置，确保响应式更新
      selectedVersionNumber.value = firstVersion;
      console.log('✅ 已自动选择版本:', selectedVersionNumber.value);
      console.log('📊 availableVersions 长度:', availableVersions.value.length);
      console.log('📊 selectedVersionNumber:', selectedVersionNumber.value);
      console.log('📊 组件是否可见:', props.visible);

      // 如果组件可见，强制触发响应式更新（确保 DOM 更新）
      // 如果组件不可见，等待 visible watch 触发时再更新
      if (props.visible) {
        nextTick(() => {
          // 强制触发响应式更新（通过重新赋值数组和选择）
          const versions = availableVersions.value.slice();
          const selected = selectedVersionNumber.value;

          // 先清空，再赋值，强制 Vue 更新
          availableVersions.value = [];
          selectedVersionNumber.value = '';

          nextTick(() => {
            availableVersions.value = versions;
            selectedVersionNumber.value = selected;
            console.log('🔄 强制刷新完成（组件可见），版本数量:', availableVersions.value.length);
            console.log('🔄 强制刷新完成（组件可见），选择的版本:', selectedVersionNumber.value);
          });
        });
      } else {
        console.log('⏳ 组件不可见，等待 visible watch 触发更新');
      }
    } else {
      console.warn('⚠️ 版本列表为空，无法选择版本');
    }
  } catch (error) {
    console.error('❌ 加载版本列表失败:', error);
    versionListError.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoadingVersions.value = false;
  }
};

// 监听组件可见性变化，当组件变为可见时检查并加载数据
watch(
  () => props.visible,
  (isVisible, wasVisible) => {
    if (isVisible) {
      // 组件变为可见时（包括从隐藏变为可见，也包括一开始就是可见的），延迟检查确保 DOM 已更新
      nextTick(() => {
        setTimeout(() => {
          console.log('👁️ 组件可见，检查版本列表状态...');
          console.log('📊 是否从隐藏变为可见:', wasVisible === false);
          console.log('📊 当前版本数量:', availableVersions.value.length);
          console.log('📊 是否正在加载:', isLoadingVersions.value);
          console.log('📊 当前选择的版本:', selectedVersionNumber.value);

          if (availableVersions.value.length === 0 && !isLoadingVersions.value) {
            // 如果没有数据且不在加载中，则加载
            console.log('📥 开始加载版本列表（组件可见且无数据）...');
            loadVersionList();
          } else if (availableVersions.value.length > 0) {
            // 如果已有数据，只确保选择正确，不重新加载
            console.log('✅ 版本列表已有数据，只需确保选择正确');
            // 确保有选择的版本
            if (!selectedVersionNumber.value || selectedVersionNumber.value === '') {
              selectedVersionNumber.value = availableVersions.value[0].version;
              console.log('✅ 自动选择版本:', selectedVersionNumber.value);
            } else {
              console.log('✅ 版本已选择，无需更新');
            }
          }
        }, 250);
      });
    }
  },
  { immediate: true }, // 立即执行，处理组件一开始就是可见的情况
);

// 监听自动加载
if (props.autoLoad) {
  // 组件挂载时自动加载（如果可见）
  onMounted(() => {
    if (props.visible) {
      // 延迟加载，确保组件已完全渲染
      setTimeout(() => {
        if (availableVersions.value.length === 0) {
          loadVersionList();
        }
      }, 100);
    }
  });

  // 也监听长度变化，如果从非0变成0（例如清空），可以重新加载
  watch(
    () => availableVersions.value.length,
    (newVal, oldVal) => {
      // 只有在从非0变成0时才重新加载（表示可能被清空了）
      if (newVal === 0 && oldVal > 0 && props.visible) {
        loadVersionList();
      }
    },
  );
}

// 暴露加载方法和数据
defineExpose({
  loadVersionList,
  availableVersions,
});

const canSwitch = computed(() => {
  return selectedVersionNumber.value !== ''; // 必须选择了一个版本
});

const handleSwitchVersion = async () => {
  if (!canSwitch.value) {
    return;
  }

  // 确认切换
  const confirmed = await ConfirmService.showConfirm({
    message: '切换版本将修改酒馆正则中的URL，并重新加载页面。当前未保存的数据将丢失。是否继续？',
    title: '确认切换版本',
    confirmText: '确认切换',
    cancelText: '取消',
  });

  if (!confirmed) {
    return;
  }

  // 确定要使用的 URL
  const version = selectedVersionNumber.value;
  if (!version) {
    await ConfirmService.showWarning('请选择一个版本', '切换失败', '请从下拉菜单中选择一个版本。');
    return;
  }

  const targetUrl = `https://kitakamis.online/index-v${version}.html`;
  const versionInfo = availableVersions.value.find(v => v.version === version);
  const versionName = versionInfo ? `${versionInfo.version} - ${versionInfo.description}` : `版本 ${version}`;

  try {
    // 获取所有酒馆正则
    const regexes = getTavernRegexes({ scope: 'character' });
    console.log('📋 当前角色卡酒馆正则数量:', regexes.length);

    // 查找稳定的"自动更新CDN"正则（玩家必定有此正则才能看到界面）
    const stableRegex = regexes.find(regex => regex.script_name === '自动更新CDN');

    if (!stableRegex) {
      throw new Error('未找到"自动更新CDN"正则，无法切换版本。');
    }

    // 查找版本切换正则（新建的，指向指定版本）
    let versionRegex = regexes.find(regex => regex.script_name === '版本切换');

    // 切换到指定版本：创建或更新版本切换正则，禁用"自动更新CDN"正则
    console.log('📌 切换到指定版本:', selectedVersionNumber.value);

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
      console.log('✅ 已更新版本切换正则 URL');
      console.log('📋 使用的 find_regex:', originalFindRegex);
      console.log('📋 更新后的 replace_string:', newReplaceString);
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
      console.log('✅ 已创建版本切换正则');
      console.log('📋 使用的 find_regex:', originalFindRegex);
      console.log('📋 使用的 replace_string:', newReplaceString);
    }

    // 禁用"自动更新CDN"正则，启用版本切换正则
    stableRegex.enabled = false;
    versionRegex.enabled = true;
    console.log('✅ 已禁用"自动更新CDN"正则，启用版本切换正则');

    // 替换所有酒馆正则
    await replaceTavernRegexes(regexes, { scope: 'character' });
    console.log('✅ 酒馆正则已更新');

    // 提示用户需要重新加载
    await ConfirmService.showSuccess(`已切换到 ${versionName}，页面将重新加载以应用更改。`, '版本切换成功');

    // 延迟一下再重新加载，让用户看到提示
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ 切换版本失败:', error);
    await ConfirmService.showWarning(
      `切换版本失败：${error instanceof Error ? error.message : String(error)}`,
      '切换失败',
    );
  }
};
</script>

<style scoped lang="scss">
.version-manager-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.current-version-section {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffd7a1;
  margin: 0 0 16px 0;
}

.section-desc {
  font-size: 13px;
  color: #9ca3af;
  margin: 0 0 20px 0;
  line-height: 1.6;

  strong {
    color: #fbbf24;
  }
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-label {
  font-size: 13px;
  color: #9ca3af;
  min-width: 80px;
}

.version-value {
  font-size: 13px;
  color: #f0e6d2;
  font-weight: 500;
}

.divider {
  height: 1px;
  background: rgba(205, 133, 63, 0.3);
  margin: 0;
}

.version-switch-section {
  margin-bottom: 0;
}

.version-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.version-input-label {
  font-size: 13px;
  color: #ffe9d2;
  font-weight: 600;
  margin-bottom: 4px;
}

.version-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-select {
  padding: 10px 12px;
  background: rgba(40, 40, 40, 0.8);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  color: #f0e6d2;
  font-size: 13px;
  width: 100%;
  max-width: 500px;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: rgba(205, 133, 63, 0.6);
    box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: rgba(40, 40, 40, 0.95);
    color: #f0e6d2;
    padding: 8px;
  }
}

.version-loading {
  padding: 12px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #22c55e;
  font-size: 13px;
  text-align: center;
}

.version-error {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.retry-button {
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 4px;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
  }
}

.warning-section {
  margin-top: 0;
}

.warning-box {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
  margin: 0 0 8px 0;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  list-style: disc;

  li {
    font-size: 12px;
    color: #d1d5db;
    line-height: 1.6;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.version-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.switch-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: 2px solid rgba(16, 185, 129, 0.5);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(.disabled) {
    background: linear-gradient(135deg, #20c991, #169679);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  &:active:not(.disabled) {
    transform: translateY(0);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(135deg, #6b7280, #4b5563);
    border-color: rgba(107, 114, 128, 0.5);
  }
}
</style>
