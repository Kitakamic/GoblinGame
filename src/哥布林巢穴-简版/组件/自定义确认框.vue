<template>
  <div v-if="show" class="custom-confirm-overlay" @click="handleOverlayClick">
    <div class="custom-confirm-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button v-if="showClose" class="close-button" @click="handleCancel">×</button>
      </div>

      <div class="modal-content">
        <div class="message">{{ message }}</div>
        <div v-if="details" class="details">{{ details }}</div>
      </div>

      <div class="modal-actions">
        <button v-if="showCancel" class="cancel-button" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button class="confirm-button" :class="confirmButtonClass" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  show: boolean;
  title?: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showClose?: boolean;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  showClose: true,
  type: 'info',
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};

const handleOverlayClick = () => {
  if (props.showClose) {
    emit('close');
  }
};

const confirmButtonClass = computed(() => {
  return {
    info: 'info-button',
    warning: 'warning-button',
    danger: 'danger-button',
    success: 'success-button',
  }[props.type];
});
</script>

<style scoped lang="scss">
.custom-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12000; // 在弹窗提示（99999）之后，但在总结确认弹窗（10500）之前

  .custom-confirm-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 2px solid rgba(205, 133, 63, 0.4);
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
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
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(205, 133, 63, 0.2);

      h3 {
        margin: 0;
        color: #ffd7a1;
        font-size: 20px;
        font-weight: 700;
      }

      .close-button {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      }
    }

    .modal-content {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px;
      }

      .message {
        color: #f0e6d2;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .details {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.4;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid rgba(205, 133, 63, 0.5);
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding: 16px 24px;
      border-top: 1px solid rgba(205, 133, 63, 0.2);

      @media (max-width: 768px) {
        padding: 12px 16px;
        gap: 8px;
      }

      .cancel-button,
      .confirm-button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        border: none;

        @media (max-width: 768px) {
          padding: 8px 16px;
          font-size: 12px;
        }
      }

      .cancel-button {
        background: rgba(107, 114, 128, 0.2);
        border: 1px solid rgba(107, 114, 128, 0.3);
        color: #9ca3af;

        &:hover {
          background: rgba(107, 114, 128, 0.3);
        }
      }

      .confirm-button {
        &.info-button {
          background: linear-gradient(180deg, #3b82f6, #2563eb);
          border: 1px solid rgba(59, 130, 246, 0.6);
          color: #ffffff;

          &:hover {
            background: linear-gradient(180deg, #2563eb, #1d4ed8);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
        }

        &.warning-button {
          background: linear-gradient(180deg, #f59e0b, #d97706);
          border: 1px solid rgba(245, 158, 11, 0.6);
          color: #ffffff;

          &:hover {
            background: linear-gradient(180deg, #d97706, #b45309);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }
        }

        &.danger-button {
          background: linear-gradient(180deg, #dc2626, #b91c1c);
          border: 1px solid rgba(220, 38, 38, 0.6);
          color: #ffffff;

          &:hover {
            background: linear-gradient(180deg, #b91c1c, #991b1b);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
        }

        &.success-button {
          background: linear-gradient(180deg, #059669, #047857);
          border: 1px solid rgba(5, 150, 105, 0.6);
          color: #ffffff;

          &:hover {
            background: linear-gradient(180deg, #047857, #065f46);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
          }
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
