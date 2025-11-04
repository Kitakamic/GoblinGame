<template>
  <div v-if="show" class="scouting-modal-overlay">
    <div class="scouting-modal" @click.stop>
      <!-- 加载中状态 -->
      <template v-if="state === 'loading'">
        <div class="modal-header">
          <h3>🔍 侦察中</h3>
          <button class="modal-close-button" title="关闭" @click="handleClose">✕</button>
        </div>
        <div class="modal-content">
          <div class="loading-icon">
            <div class="spinner"></div>
          </div>
          <div class="loading-message">{{ loadingMessage }}</div>
          <div class="loading-hint">请稍候，正在生成英雄信息...</div>
        </div>
      </template>

      <!-- 生成失败状态 -->
      <template v-else-if="state === 'failure' && failureData">
        <div class="modal-header">
          <h3>⚠️ AI英雄生成失败</h3>
        </div>
        <div class="modal-content">
          <div class="message">据点 "{{ failureData.location.name }}" 的AI英雄生成失败。</div>
          <div class="details">
            您可以选择：<br />
            1. 放弃英雄，直接进攻该据点（无英雄奖励）<br />
            2. 重新侦察，尝试再次生成英雄（退还 {{ failureData.originalCost.gold }} 金币和
            {{ failureData.originalCost.food }}
            食物）
          </div>
        </div>
        <div class="modal-actions">
          <button class="retry-button" @click="handleRetry">🔄 重新侦察</button>
          <button class="abandon-button" @click="handleAbandon">⚔️ 放弃英雄，直接进攻</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { exploreService } from '../../功能模块层/探索/服务/探索服务';
import type { Location } from '../../功能模块层/探索/类型/探索类型';
import { ConfirmService } from '../../核心层/服务/通用服务/确认框服务';

// Props
const props = defineProps<{
  show: boolean;
  state: 'loading' | 'failure';
  loadingMessage?: string;
  failureData?: {
    location: Location;
    originalCost: { gold: number; food: number };
  };
  currentScoutingLocation?: Location | null;
  scoutingLocations?: Set<string>;
  scoutingAnimation?: Set<string>;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  cancel: [location: Location, cost: { gold: number; food: number }];
  retry: [location: Location, originalCost: { gold: number; food: number }];
  abandon: [location: Location, originalCost: { gold: number; food: number }];
}>();

// 关闭弹窗（仅在加载状态时可用）
const handleClose = async () => {
  // 只在加载状态时允许关闭
  if (props.state !== 'loading') {
    return;
  }

  // 弹出确认框
  const confirmed = await ConfirmService.showWarning(
    '是否放弃此次生成？',
    '确认关闭',
    '如果放弃，侦察将取消，并尝试停止AI生成和返还资源。',
  );

  if (!confirmed) {
    return; // 用户取消，不关闭弹窗
  }

  // 用户确认放弃，执行取消操作
  try {
    // 尝试停止所有正在进行的AI生成
    try {
      await stopAllGeneration();
      console.log('已尝试停止正在进行的AI生成操作');
    } catch (error) {
      console.error('停止AI生成失败:', error);
      // 即使停止失败，也继续执行其他取消操作
    }

    // 取消侦察并清理状态
    if (props.currentScoutingLocation) {
      const location = props.currentScoutingLocation;

      // 计算侦察成本（用于返还资源）
      const cost = exploreService.calculateScoutCost(location.difficulty, location.distance);

      // 发出取消事件
      emit('cancel', location, cost);
    } else {
      // 如果没有当前侦察据点，直接关闭弹窗
      emit('close');
    }
  } catch (error) {
    console.error('取消侦察失败:', error);
    await ConfirmService.showDanger(`错误信息: ${error}`, '操作失败');
  }
};

// 处理重新侦察
const handleRetry = async () => {
  if (!props.failureData) return;

  const { location, originalCost } = props.failureData;

  try {
    const success = await exploreService.handleRetryScout(location.id, originalCost);
    if (success) {
      emit('retry', location, originalCost);
      emit('close');
    } else {
      await ConfirmService.showDanger('退还失败，请重试或联系管理员', '操作失败');
    }
  } catch (error) {
    console.error('处理重新侦察失败:', error);
    await ConfirmService.showDanger(`错误信息: ${error}`, '操作失败');
  }
};

// 处理放弃英雄并进攻
const handleAbandon = async () => {
  if (!props.failureData) return;

  const { location, originalCost } = props.failureData;

  try {
    const success = await exploreService.handleAbandonHeroAndAttack(location.id, originalCost);
    if (success) {
      emit('abandon', location, originalCost);
      emit('close');
    } else {
      await ConfirmService.showDanger('设置失败，请重试或联系管理员', '操作失败');
    }
  } catch (error) {
    console.error('处理放弃英雄失败:', error);
    await ConfirmService.showDanger(`错误信息: ${error}`, '操作失败');
  }
};
</script>

<style scoped lang="scss">
.scouting-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;

  .scouting-modal {
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

      .modal-close-button {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        line-height: 1;
        flex-shrink: 0;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .modal-content {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px;
      }

      // 加载状态样式
      .loading-icon {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(205, 133, 63, 0.2);
          border-top-color: #cd853f;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }

      .loading-message {
        font-size: 18px;
        font-weight: 600;
        color: #ffd7a1;
        text-align: center;
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .loading-hint {
        font-size: 14px;
        color: #9ca3af;
        text-align: center;
        font-style: italic;
      }

      // 失败状态样式
      .message {
        color: #f0e6d2;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .details {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.6;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid rgba(245, 158, 11, 0.5);
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
        flex-direction: column;
      }

      button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        border: none;

        @media (max-width: 768px) {
          padding: 10px 16px;
          font-size: 13px;
          width: 100%;
        }
      }

      .retry-button {
        background: linear-gradient(180deg, #3b82f6, #2563eb);
        border: 1px solid rgba(59, 130, 246, 0.6);
        color: #ffffff;

        &:hover {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      }

      .abandon-button {
        background: linear-gradient(180deg, #f59e0b, #d97706);
        border: 1px solid rgba(245, 158, 11, 0.6);
        color: #ffffff;

        &:hover {
          background: linear-gradient(180deg, #d97706, #b45309);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
