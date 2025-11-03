<template>
  <teleport :to="teleportTarget">
    <div v-if="show" class="confirm-modal-overlay">
      <div class="confirm-modal-content">
        <div class="confirm-modal-header">
          <h3 class="confirm-modal-title">{{ title }}</h3>
          <button class="close-btn" @click="handleCancel">✕</button>
        </div>

        <div class="confirm-modal-body">
          <div class="info-section" :class="{ 'warning-section': props.infoType === 'warning' }">
            <p class="info-text">{{ infoText }}</p>
          </div>

          <div class="editor-section">
            <label class="editor-label">📝 编辑总结内容</label>
            <textarea
              ref="textareaRef"
              v-model="editedContent"
              class="content-editor"
              placeholder="请编辑AI生成的总结内容..."
              rows="20"
            />
            <div class="editor-footer">
              <span class="char-count">{{ editedContent.length }} 字符</span>
            </div>
          </div>
        </div>

        <div class="confirm-modal-footer">
          <button class="btn-primary" @click="handleConfirm">
            <span class="icon">✓</span>
            <span class="text">确认并更新</span>
          </button>
          <button class="btn-secondary" @click="handleCancel">
            <span class="icon">✗</span>
            <span class="text">取消</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
  title?: string;
  infoText?: string;
  content: string;
  infoType?: 'default' | 'warning'; // 添加类型控制
}>();

const emit = defineEmits<{
  (e: 'confirm', content: string): void;
  (e: 'cancel'): void;
}>();

const textareaRef = ref<HTMLTextAreaElement>();
const editedContent = ref(props.content);

// 动态计算 teleport 目标
const teleportTarget = computed(() => {
  // 检查是否在全屏模式下
  if (document.fullscreenElement) {
    // 在全屏模式下，传送到全屏元素
    return document.fullscreenElement;
  }
  // 非全屏模式下，传送到 body
  return 'body';
});

// 监听全屏状态变化
const handleFullscreenChange = () => {
  // 全屏状态变化时，重新计算 teleport 目标
  // Vue 的 computed 会自动响应
};

// 添加全屏状态监听器
if (typeof window !== 'undefined') {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
}

// 清理时移除监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }
});

// 当show变为true时，重置编辑内容
watch(
  () => props.show,
  async newValue => {
    if (newValue) {
      editedContent.value = props.content;
      await nextTick();
      textareaRef.value?.focus();
    }
  },
);

const handleConfirm = () => {
  emit('confirm', editedContent.value);
};

const handleCancel = () => {
  emit('cancel');
};

// 暴露方法供外部调用
defineExpose({
  setContent: (content: string) => {
    editedContent.value = content;
  },
  getContent: () => editedContent.value,
});
</script>

<style scoped lang="scss">
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10500; // 在自定义确认框（11000）之后，但在生成错误提示（10200）之前
  padding: 20px;
}

.confirm-modal-content {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 200, 150, 0.08);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.confirm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
  background: rgba(40, 26, 20, 0.8);
}

.confirm-modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #ffd7a1;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(255, 120, 40, 0.3);
}

.close-btn {
  background: rgba(40, 26, 20, 0.9);
  border: 2px solid rgba(255, 180, 120, 0.6);
  border-radius: 6px;
  font-size: 20px;
  color: #ffd7a1;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 5px 10px;
  width: 36px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 200, 150, 0.2);

  &:hover {
    background: rgba(255, 180, 120, 0.15);
    border-color: rgba(255, 180, 120, 0.9);
    transform: scale(1.1) rotate(90deg);
    box-shadow:
      0 4px 12px rgba(255, 180, 120, 0.3),
      inset 0 1px 2px rgba(255, 200, 150, 0.3);
  }
}

.confirm-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.info-section {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-left: 4px solid rgba(255, 180, 120, 0.6);
  padding: 15px;
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;

  &.warning-section {
    background: linear-gradient(180deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.2));
    border: 2px solid rgba(251, 191, 36, 0.5);
    border-left: 6px solid rgba(251, 191, 36, 0.9);
    box-shadow:
      inset 0 1px 0 rgba(251, 191, 36, 0.2),
      0 4px 12px rgba(245, 158, 11, 0.3);
    animation: pulse-warning 2s ease-in-out infinite;

    .info-text {
      color: #fef3c7;
      font-weight: 600;
      font-size: 15px;
    }
  }
}

@keyframes pulse-warning {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(251, 191, 36, 0.2),
      0 4px 12px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow:
      inset 0 1px 0 rgba(251, 191, 36, 0.3),
      0 6px 16px rgba(245, 158, 11, 0.5);
  }
}

.info-text {
  margin: 0;
  color: #ffe9d2;
  line-height: 1.6;
  font-size: 14px;
}

.editor-section {
  margin-top: 20px;
}

.editor-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #ffd7a1;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
}

.content-editor {
  width: 100%;
  min-height: 400px;
  padding: 16px;
  background: rgba(25, 17, 14, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 8px;
  color: #ffe9d2;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 200, 150, 0.08);

  &:focus {
    outline: none;
    border-color: rgba(255, 180, 120, 0.6);
    box-shadow:
      inset 0 2px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 0 12px rgba(255, 180, 120, 0.2);
  }

  &::placeholder {
    color: rgba(255, 233, 210, 0.4);
  }
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.char-count {
  font-size: 12px;
  color: rgba(255, 233, 210, 0.6);
}

.confirm-modal-footer {
  display: flex;
  gap: 15px;
  padding: 20px 30px;
  border-top: 1px solid rgba(205, 133, 63, 0.2);
  background: rgba(40, 26, 20, 0.8);
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  color: #ffd7a1;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);

  .icon {
    font-size: 18px;
  }

  &:hover {
    background: linear-gradient(180deg, #8a3c2c, #65261c);
    border-color: rgba(255, 120, 60, 0.5);
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 6px 16px rgba(110, 30, 15, 0.4);
    color: #ffd7a1;
  }
}

.btn-secondary {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  color: rgba(255, 233, 210, 0.8);
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);

  .icon {
    font-size: 18px;
  }

  &:hover {
    background: rgba(40, 26, 20, 0.9);
    border-color: rgba(205, 133, 63, 0.5);
    transform: translateY(-2px);
    color: #ffe9d2;
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 6px 16px rgba(0, 0, 0, 0.4);
  }
}

// 滚动条样式
.confirm-modal-body::-webkit-scrollbar {
  width: 8px;
}

.confirm-modal-body::-webkit-scrollbar-track {
  background: rgba(25, 17, 14, 0.5);
  border-radius: 4px;
}

.confirm-modal-body::-webkit-scrollbar-thumb {
  background: rgba(205, 133, 63, 0.3);
  border-radius: 4px;

  &:hover {
    background: rgba(205, 133, 63, 0.5);
  }
}

.content-editor::-webkit-scrollbar {
  width: 8px;
}

.content-editor::-webkit-scrollbar-track {
  background: rgba(25, 17, 14, 0.5);
  border-radius: 4px;
}

.content-editor::-webkit-scrollbar-thumb {
  background: rgba(205, 133, 63, 0.3);
  border-radius: 4px;

  &:hover {
    background: rgba(205, 133, 63, 0.5);
  }
}
</style>
