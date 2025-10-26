<template>
  <div v-if="show" class="settings-overlay" @click="handleOverlayClick">
    <div class="settings-panel" @click.stop>
      <div class="panel-header">
        <h3>⚙️ 游戏设置</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="panel-content">
        <!-- 流式传输设置 -->
        <div class="settings-section">
          <h4 class="section-title">AI 输出设置</h4>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">启用流式传输</span>
              <span class="label-desc">AI回复实时显示，体验更流畅（如果总是截断，请关闭）</span>
            </label>
            <label class="switch-container">
              <input v-model="enableStream" type="checkbox" class="switch-input" @change="updateStreamingSetting" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 文字样式设置按钮 -->
        <div class="settings-section">
          <h4 class="section-title">界面设置</h4>

          <div class="setting-item">
            <button class="style-button" @click="openTextStyleSettings">🎨 对话文字颜色和字体设置</button>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 帮助和教程 -->
        <div class="settings-section">
          <h4 class="section-title">帮助</h4>

          <div class="setting-item">
            <button class="tutorial-button" @click="openTutorial">📖 查看教程（强烈建议先看教程）</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-text-style'): void;
  (e: 'open-tutorial'): void;
}>();

// 流式传输设置
const enableStream = ref(true);

// 加载保存的设置
const loadSettings = () => {
  try {
    const globalVars = getVariables({ type: 'global' });

    // 加载流式传输设置，默认为 true
    if (typeof globalVars['enable_stream_output'] === 'boolean') {
      enableStream.value = globalVars['enable_stream_output'];
    } else {
      enableStream.value = true; // 默认开启
    }

    console.log('📋 已加载游戏设置:', { enableStream: enableStream.value });
  } catch (error) {
    console.error('加载游戏设置失败:', error);
  }
};

// 保存流式传输设置
const updateStreamingSetting = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['enable_stream_output'] = enableStream.value;
    replaceVariables(globalVars, { type: 'global' });
    console.log('💾 流式传输设置已保存:', enableStream.value);
  } catch (error) {
    console.error('保存流式传输设置失败:', error);
  }
};

// 打开文字样式设置
const openTextStyleSettings = () => {
  emit('open-text-style');
};

// 打开教程
const openTutorial = () => {
  emit('open-tutorial');
};

// 关闭面板
const close = () => {
  emit('close');
};

// 点击遮罩关闭
const handleOverlayClick = () => {
  close();
};

// 监听显示状态
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      loadSettings();
    }
  },
);

// 初始化
onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.settings-panel {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  animation: slideIn 0.3s ease;

  @media (max-width: 768px) {
    width: 95%;
    max-height: 90vh;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(205, 133, 63, 0.4);

  h3 {
    margin: 0;
    color: #ffd7a1;
    font-size: 20px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 28px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    line-height: 1;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}

.panel-content {
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.divider {
  height: 1px;
  background: rgba(205, 133, 63, 0.3);
  margin: 24px 0;
}

.settings-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  color: #ffd7a1;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.setting-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  .label-text {
    color: #f0e6d2;
    font-weight: 600;
    font-size: 14px;
  }

  .label-desc {
    color: #9ca3af;
    font-size: 12px;
  }
}

.switch-container {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  cursor: pointer;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + .switch-slider {
    background-color: #3b82f6;

    &::before {
      transform: translateX(24px);
    }
  }
}

.switch-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4b5563;
  transition: 0.3s;
  border-radius: 28px;

  &::before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}

.style-button,
.tutorial-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #8a3c2c, #65261c);
  border: 2px solid rgba(255, 120, 60, 0.5);
  border-radius: 8px;
  color: #ffd7a1;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #9a4c3c, #75362c);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}

.tutorial-button {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: rgba(96, 165, 250, 0.5);

  &:hover {
    background: linear-gradient(135deg, #4b8ef6, #3575eb);
  }
}
</style>
