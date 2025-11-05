<template>
  <div v-if="show" class="scout-prompt-modal-overlay">
    <div class="scout-prompt-modal" @click.stop>
      <div class="modal-header">
        <h3>✍️ 输入额外提示词</h3>
        <button class="modal-close-button" title="关闭" @click="handleCancel">✕</button>
      </div>
      <div class="modal-content">
        <!-- 完全自定义模式 -->
        <template v-if="isFullCustomMode">
          <div class="prompt-info">
            <p class="mode-title">🎨 完全自定义模式</p>
            <p class="hint">当前为完全自定义模式，只使用格式要求和您的自定义提示词生成人物，不会受到据点信息干扰。</p>
            <p class="hint">适合生成其他世界观或动漫人物，例如：</p>
            <ul class="hint-list">
              <li>指定动漫作品中的角色</li>
              <li>其他游戏世界观的角色</li>
              <li>完全原创的角色设定</li>
              <li>特定世界观的角色</li>
            </ul>
          </div>
          <div class="input-container">
            <label class="input-label">完全自定义提示词（必填）</label>
            <textarea
              v-model="fullCustomPrompt"
              class="prompt-textarea full-custom-textarea"
              rows="10"
              placeholder="请输入完整的人物生成提示词，包括所有需要的设定信息..."
              @keydown.ctrl.enter="handleConfirm"
              @keydown.meta.enter="handleConfirm"
            ></textarea>
            <p class="input-hint">
              💡 提示：您可以描述角色的背景、性格、外观、能力等所有信息，AI将根据您的描述生成人物。
            </p>
          </div>
        </template>

        <!-- 普通模式 -->
        <template v-else>
          <div class="prompt-info">
            <p>据点 "{{ location?.name }}" 发现人物！</p>
            <p class="hint">您可以输入额外提示词来影响人物生成，例如：</p>
            <ul class="hint-list">
              <li>角色的性格特点</li>
              <li>角色的背景设定</li>
              <li>角色的特殊能力</li>
              <li>角色的外观描述</li>
            </ul>
          </div>
          <div class="input-container">
            <textarea
              v-model="promptText"
              class="prompt-textarea"
              rows="6"
              placeholder="输入额外提示词（可选，留空则使用默认生成）..."
              @keydown.ctrl.enter="handleConfirm"
              @keydown.meta.enter="handleConfirm"
            ></textarea>
          </div>
        </template>
      </div>
      <div class="modal-actions">
        <button class="cancel-button" @click="handleCancel">取消</button>
        <button
          class="confirm-button"
          :disabled="isConfirming || (isFullCustomMode && !fullCustomPrompt.trim())"
          @click="handleConfirm"
        >
          {{ isConfirming ? '确认中...' : '确认' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Location } from '../../功能模块层/探索/类型/探索类型';

interface Props {
  show: boolean;
  location: Location | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  confirm: [prompt: string, isFullCustom: boolean];
  cancel: [];
}>();

const promptText = ref('');
const fullCustomPrompt = ref('');
const isConfirming = ref(false);

// 检查是否启用完全自定义模式
const isFullCustomMode = computed(() => {
  try {
    const globalVars = getVariables({ type: 'global' });
    return typeof globalVars['enable_full_custom_mode'] === 'boolean' ? globalVars['enable_full_custom_mode'] : false;
  } catch {
    return false;
  }
});

// 重置输入
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      promptText.value = '';
      fullCustomPrompt.value = '';
      isConfirming.value = false;
    }
  },
);

const handleConfirm = () => {
  if (isConfirming.value) return;

  // 完全自定义模式需要输入内容
  if (isFullCustomMode.value && !fullCustomPrompt.value.trim()) {
    return;
  }

  isConfirming.value = true;
  if (isFullCustomMode.value) {
    emit('confirm', fullCustomPrompt.value.trim(), true);
  } else {
    emit('confirm', promptText.value.trim(), false);
  }
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="scss">
.scout-prompt-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.scout-prompt-modal {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
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

.modal-header {
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

  .modal-close-button {
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

.modal-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.prompt-info {
  margin-bottom: 20px;

  p {
    color: #f0e6d2;
    font-size: 14px;
    margin: 0 0 12px 0;

    &:first-child {
      color: #ffd7a1;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .hint {
    color: #9ca3af;
    font-size: 13px;
    margin-top: 12px;
  }

  .hint-list {
    color: #9ca3af;
    font-size: 13px;
    margin: 8px 0 0 20px;
    padding: 0;

    li {
      margin: 4px 0;
    }
  }
}

.input-container {
  margin-top: 16px;
}

.prompt-textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(40, 40, 40, 0.8);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  color: #f0e6d2;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: all 0.2s ease;
  min-height: 120px;

  &::placeholder {
    color: #6b7280;
  }

  &:hover {
    border-color: rgba(205, 133, 63, 0.6);
    background: rgba(40, 40, 40, 0.95);
  }

  &:focus {
    border-color: rgba(255, 120, 60, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 120, 60, 0.1);
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 2px solid rgba(205, 133, 63, 0.4);
  justify-content: flex-end;
}

.cancel-button,
.confirm-button {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
}

.cancel-button {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.5);
  color: #f0e6d2;

  &:hover {
    background: rgba(107, 114, 128, 0.5);
    border-color: rgba(107, 114, 128, 0.7);
  }
}

.confirm-button {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: rgba(16, 185, 129, 0.5);
  color: #ffffff;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #20c991, #169679);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(135deg, #6b7280, #4b5563);
    border-color: rgba(107, 114, 128, 0.5);
  }
}

.mode-title {
  color: #ffd7a1;
  font-weight: 700;
  font-size: 16px;
  margin: 0 0 12px 0;
}

.input-label {
  display: block;
  color: #f0e6d2;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.full-custom-textarea {
  min-height: 200px;
}

.input-hint {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}
</style>
