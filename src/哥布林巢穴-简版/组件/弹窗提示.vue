<template>
  <teleport :to="teleportTarget">
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast-item', `toast-${toast.type}`]"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon" v-html="getIcon(toast.type)()"></div>
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click.stop="removeToast(toast.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="toast-progress" :style="{ animationDuration: `${toast.duration}ms` }"></div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
}

interface Toast extends Required<Omit<ToastOptions, 'persistent'>> {
  persistent: boolean;
}

const toasts = ref<Toast[]>([]);
const timers = new Map<string, number>();

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

// 图标组件
const getIcon = (type: 'success' | 'error' | 'warning' | 'info') => {
  const icons = {
    success: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>`,
    error: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    warning: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,
    info: () => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,
  };
  return icons[type];
};

const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const addToast = (options: ToastOptions) => {
  const id = options.id || generateId();
  const toast: Toast = {
    id,
    title: options.title || '',
    message: options.message,
    type: options.type || 'info',
    duration: options.duration || 4000,
    persistent: options.persistent || false,
  };

  toasts.value.push(toast);

  if (!toast.persistent) {
    const timer = window.setTimeout(() => {
      removeToast(id);
    }, toast.duration);
    timers.set(id, timer);
  }

  return id;
};

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }
};

const clearAllToasts = () => {
  toasts.value = [];
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
};

// 便捷方法
const success = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return addToast({ ...options, message, type: 'success' });
};

const error = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return addToast({ ...options, message, type: 'error' });
};

const warning = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return addToast({ ...options, message, type: 'warning' });
};

const info = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return addToast({ ...options, message, type: 'info' });
};

// 清理定时器和事件监听器
onUnmounted(() => {
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();

  // 移除全屏状态监听器
  if (typeof window !== 'undefined') {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }
});

// 暴露方法给父组件
defineExpose({
  addToast,
  removeToast,
  clearAllToasts,
  success,
  error,
  warning,
  info,
});
</script>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999; /* 提高 z-index 确保在全屏模式下也能显示 */
  pointer-events: none;

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
  }
}

.toast-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 480px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  cursor: pointer;
  overflow: hidden;

  @media (max-width: 768px) {
    min-width: auto;
    max-width: none;
    padding: 12px;
  }

  &.toast-success {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(21, 128, 61, 0.25));
    border-color: rgba(34, 197, 94, 0.3);
    color: #dcfce7;

    .toast-icon {
      color: #22c55e;
    }

    .toast-progress {
      background: linear-gradient(90deg, #22c55e, #16a34a);
    }
  }

  &.toast-error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25));
    border-color: rgba(239, 68, 68, 0.3);
    color: #fecaca;

    .toast-icon {
      color: #ef4444;
    }

    .toast-progress {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
  }

  &.toast-warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.25));
    border-color: rgba(245, 158, 11, 0.3);
    color: #fef3c7;

    .toast-icon {
      color: #f59e0b;
    }

    .toast-progress {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
  }

  &.toast-info {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.25));
    border-color: rgba(59, 130, 246, 0.3);
    color: #dbeafe;

    .toast-icon {
      color: #3b82f6;
    }

    .toast-progress {
      background: linear-gradient(90deg, #3b82f6, #2563eb);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;

  .toast-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .toast-message {
    font-size: 13px;
    line-height: 1.4;
    opacity: 0.9;
    word-wrap: break-word;
  }
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: currentColor;
  opacity: 0.6;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin-top: -2px;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation: toast-progress linear forwards;
}

// 动画
.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

// 响应式调整
@media (max-width: 480px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast-item {
    min-width: auto;
    padding: 12px;
    gap: 10px;

    .toast-content {
      .toast-title {
        font-size: 13px;
      }

      .toast-message {
        font-size: 12px;
      }
    }
  }
}
</style>
