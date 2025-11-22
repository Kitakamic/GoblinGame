<template>
  <div v-if="show" class="version-manager-overlay" @click="handleOverlayClick">
    <div class="version-manager-modal" @click.stop>
      <div class="modal-header">
        <h2>🔖 版本管理</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="modal-content">
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
              <select v-else v-model="selectedVersionNumber" class="version-select">
                <option value="" disabled>请选择版本</option>
                <option v-for="version in availableVersions" :key="version.version" :value="version.version">
                  {{ version.version }} - {{ version.description }} ({{ version.date }})
                </option>
              </select>
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
      </div>

      <div class="modal-actions">
        <button class="cancel-button" @click="handleClose">取消</button>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FRONTEND_DESCRIPTION, FRONTEND_UPDATE_DATE, FRONTEND_VERSION } from '../../version';
import { ConfirmService } from '../../核心层/服务/通用服务/确认框服务';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// 版本信息接口
interface VersionInfo {
  version: string;
  description: string;
  date: string;
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

    // 如果没有选中版本，默认选择第一个（最新版本）
    if (!selectedVersionNumber.value && availableVersions.value.length > 0) {
      selectedVersionNumber.value = availableVersions.value[0].version;
    }
  } catch (error) {
    console.error('❌ 加载版本列表失败:', error);
    versionListError.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoadingVersions.value = false;
  }
};

// 监听弹窗显示，加载版本列表
watch(
  () => props.show,
  newVal => {
    if (newVal && availableVersions.value.length === 0) {
      loadVersionList();
    }
  },
);

const canSwitch = computed(() => {
  return selectedVersionNumber.value !== ''; // 必须选择了一个版本
});

const handleClose = () => {
  emit('close');
};

const handleOverlayClick = () => {
  // 不允许点击外部关闭
};

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
.version-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.version-manager-modal {
  background: #2a2a2a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #3a3a3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: #2a2a2a;
  z-index: 1;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }

  .close-btn {
    background: none;
    border: none;
    color: #999;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: #3a3a3a;
      color: #fff;
    }
  }
}

.modal-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.current-version-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 16px 0;
}

.section-desc {
  font-size: 14px;
  color: #bbb;
  margin: 0 0 20px 0;
  line-height: 1.6;
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
  font-size: 14px;
  color: #999;
  min-width: 80px;
}

.version-value {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.divider {
  height: 1px;
  background: #3a3a3a;
  margin: 24px 0;
}

.version-switch-section {
  margin-bottom: 24px;
}

.version-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.version-input-label {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
  margin-bottom: 4px;
}

.version-select-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-radio-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(85, 170, 153, 0.3);
  }
}

.version-radio {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-top: 2px;
  flex-shrink: 0;
}

.version-option-text {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
  display: block;
}

.version-option-desc {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 4px;
}

.version-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 26px;
  margin-top: 8px;
}

.version-input {
  padding: 10px 12px;
  background: #1a1a1a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  width: 200px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #5a9;
    box-shadow: 0 0 0 2px rgba(85, 170, 153, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #666;
  }
}

.version-select {
  padding: 10px 12px;
  background: #1a1a1a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  width: 100%;
  max-width: 500px;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #5a9;
    box-shadow: 0 0 0 2px rgba(85, 170, 153, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #1a1a1a;
    color: #fff;
    padding: 8px;
  }
}

.version-loading {
  padding: 12px;
  background: rgba(85, 170, 153, 0.1);
  border: 1px solid rgba(85, 170, 153, 0.3);
  border-radius: 6px;
  color: #5a9;
  font-size: 14px;
  text-align: center;
}

.version-error {
  padding: 12px;
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 6px;
  color: #ff6b6b;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.retry-button {
  padding: 6px 12px;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.4);
  border-radius: 4px;
  color: #ff6b6b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;

  &:hover {
    background: rgba(255, 100, 100, 0.3);
    border-color: rgba(255, 100, 100, 0.5);
  }
}

.version-input-hint {
  font-size: 12px;
  color: #666;
}

.version-tips {
  margin-top: 16px;
  padding: 12px;
  background: rgba(85, 170, 153, 0.1);
  border: 1px solid rgba(85, 170, 153, 0.3);
  border-radius: 6px;
}

.tip-item {
  font-size: 13px;
  color: #bbb;
  line-height: 1.6;
  margin: 0 0 8px 0;

  &:last-child {
    margin-bottom: 0;
  }

  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    color: #5a9;
  }
}

.warning-section {
  margin-top: 24px;
}

.warning-box {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
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
  color: #ffc107;
  margin: 0 0 8px 0;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  list-style: disc;

  li {
    font-size: 13px;
    color: #ddd;
    line-height: 1.6;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.modal-actions {
  padding: 20px 24px;
  border-top: 1px solid #3a3a3a;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: sticky;
  bottom: 0;
  background: #2a2a2a;
}

.cancel-button,
.switch-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-button {
  background: #3a3a3a;
  color: #fff;

  &:hover {
    background: #4a4a4a;
  }
}

.switch-button {
  background: #5a9;
  color: #fff;

  &:hover:not(.disabled) {
    background: #6bb;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
