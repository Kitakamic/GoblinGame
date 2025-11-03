<template>
  <div v-if="errorState.show" class="error-overlay">
    <div class="error-modal" @click.stop>
      <div class="modal-header">
        <div class="header-content">
          <div class="error-icon">⚠️</div>
          <h3>{{ errorState.title }}</h3>
        </div>
      </div>

      <div class="modal-content">
        <div class="error-message">{{ errorState.message }}</div>
        <div v-if="errorState.summary" class="error-summary">{{ errorState.summary }}</div>
        <div v-if="errorState.details" class="error-details">{{ errorState.details }}</div>

        <!-- AI原始输出编辑区 -->
        <div v-if="errorState.rawText" class="raw-text-editor">
          <div class="editor-header">
            <h4>AI原始输出（可编辑调试）</h4>
            <button class="reset-button" title="重置为原始内容" @click="editedText = errorState.rawText || ''">
              🔄 重置
            </button>
          </div>
          <textarea v-model="editedText" class="editor-textarea" placeholder="AI输出的原始文本..."></textarea>
        </div>
      </div>

      <div class="modal-actions">
        <button
          v-if="errorState.onRetry && errorState.rawText"
          class="retry-button"
          :disabled="isRetrying"
          @click="handleRetry"
        >
          {{ isRetrying ? '⏳ 重新解析中...' : '🔄 重新解析' }}
        </button>
        <button class="abandon-button" @click="handleClose">放弃本次生成</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { toast } from '../../核心层/服务/通用服务/弹窗提示服务';
import { errorState, GenerationErrorService } from '../../核心层/服务/通用服务/生成错误服务';

const editedText = ref('');
const isRetrying = ref(false);

// 监听错误状态，当显示新错误时重置编辑文本
watch(
  () => errorState.value.show,
  newShow => {
    if (newShow && errorState.value.rawText) {
      editedText.value = errorState.value.rawText;
    }
  },
  { immediate: true },
);

const handleClose = () => {
  GenerationErrorService.handleClose();
  editedText.value = '';
};

const handleRetry = async () => {
  if (!errorState.value.onRetry) {
    toast.warning('未提供重新解析回调函数', { title: '错误' });
    return;
  }

  if (!editedText.value.trim()) {
    toast.warning('请输入要解析的内容', { title: '输入错误' });
    return;
  }

  isRetrying.value = true;

  // 保存当前错误弹窗的内容，用于检测是否有新的错误弹窗被打开
  const previousRawText = errorState.value.rawText;
  const previousTitle = errorState.value.title;

  try {
    await errorState.value.onRetry(editedText.value);
    // 如果成功，关闭弹窗
    handleClose();
    toast.success('重新解析成功', { title: '解析成功' });
  } catch (error) {
    // 检查错误弹窗的内容是否发生了变化
    // 如果 rawText 或 title 发生了变化，说明新的错误弹窗已经显示了
    const errorDialogContentChanged =
      errorState.value.rawText !== previousRawText || errorState.value.title !== previousTitle;

    if (errorDialogContentChanged && errorState.value.show) {
      // 错误弹窗内容已更新，说明新的错误信息已经通过错误弹窗显示了
      // 不显示提示，避免重复提示
      // 同时更新编辑文本为新的原始文本
      if (errorState.value.rawText) {
        editedText.value = errorState.value.rawText;
      }
    } else {
      // 其他类型的错误（如构建失败等），显示提示
      toast.error('重新解析失败，请检查错误信息', { title: '解析失败' });
    }
    // 不关闭弹窗，让用户继续编辑
  } finally {
    isRetrying.value = false;
  }
};
</script>

<style scoped lang="scss">
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10200; // 在总结确认弹窗之后，但在游戏设置面板（10000）之前

  .error-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 2px solid rgba(220, 38, 38, 0.6);
    border-radius: 16px;
    width: 90%;
    max-width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    animation: modalSlideIn 0.3s ease-out;

    @media (max-width: 768px) {
      width: 95%;
      max-height: 90vh;
      border-radius: 12px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(220, 38, 38, 0.3);

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .error-icon {
          font-size: 24px;
          line-height: 1;
        }

        h3 {
          margin: 0;
          color: #ffd7a1;
          font-size: 20px;
          font-weight: 700;
        }
      }
    }

    .modal-content {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px;
      }

      .error-message {
        color: #f0e6d2;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .error-summary {
        color: #ffd7a1;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(220, 38, 38, 0.1);
        border-radius: 8px;
        border-left: 3px solid rgba(220, 38, 38, 0.6);
      }

      .error-details {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.4;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid rgba(220, 38, 38, 0.5);
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }

      .raw-text-editor {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(220, 38, 38, 0.2);

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h4 {
            margin: 0;
            color: #ffd7a1;
            font-size: 16px;
            font-weight: 600;
          }

          .reset-button {
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 12px;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #93c5fd;

            &:hover {
              background: rgba(59, 130, 246, 0.3);
              border-color: rgba(59, 130, 246, 0.6);
            }

            &:active {
              transform: scale(0.95);
            }
          }
        }

        .editor-textarea {
          width: 100%;
          min-height: 200px;
          max-height: 400px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(220, 38, 38, 0.4);
          color: #f0e6d2;
          font-size: 13px;
          line-height: 1.5;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease;

          &:focus {
            border-color: rgba(220, 38, 38, 0.7);
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
          }

          &::placeholder {
            color: #6b7280;
          }
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding: 16px 24px;
      border-top: 1px solid rgba(220, 38, 38, 0.2);

      @media (max-width: 768px) {
        padding: 12px 16px;
        gap: 8px;
      }

      .retry-button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        background: linear-gradient(180deg, #3b82f6, #2563eb);
        border: 1px solid rgba(59, 130, 246, 0.6);
        color: #ffffff;

        @media (max-width: 768px) {
          padding: 8px 16px;
          font-size: 12px;
        }

        &:hover:not(:disabled) {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .abandon-button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        background: linear-gradient(180deg, #dc2626, #b91c1c);
        border: 1px solid rgba(220, 38, 38, 0.6);
        color: #ffffff;

        @media (max-width: 768px) {
          padding: 8px 16px;
          font-size: 12px;
        }

        &:hover {
          background: linear-gradient(180deg, #b91c1c, #991b1b);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
      }
    }
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
