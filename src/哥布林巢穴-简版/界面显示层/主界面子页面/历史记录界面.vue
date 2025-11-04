<template>
  <div v-if="props.show" class="history-modal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">历史日志</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="history-content">
        <div v-if="roundHistory.length === 0" class="no-history">
          <div class="no-history-icon">📜</div>
          <div class="no-history-text">暂无回合信息</div>
          <div class="no-history-hint">点击"结束回合"开始游戏</div>
        </div>

        <div v-else class="history-list">
          <div v-for="(log, index) in roundHistory" :key="index" class="history-item">
            <div class="history-header">
              <div class="history-time">{{ formatTime(log.timestamp) }}</div>
              <div class="history-title">{{ log.title }}</div>
            </div>
            <div class="history-changes">
              <div
                v-for="change in log.changes"
                :key="change.type"
                class="history-change"
                :class="change.amount > 0 ? 'positive' : 'negative'"
              >
                <span class="resource-icon">{{ ResourceFormatService.getResourceIcon(change.type) }}</span>
                <span class="resource-name">{{ ResourceFormatService.getResourceName(change.type) }}</span>
                <span class="change-amount" :class="change.amount > 0 ? 'positive' : 'negative'"
                  >{{ change.amount > 0 ? '+' : change.amount < 0 ? '-' : ''
                  }}{{ ResourceFormatService.formatNumber(Math.abs(change.amount)) }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { modularSaveManager } from '../../核心层/服务/存档系统/模块化存档服务';
import type { HistoryModuleData } from '../../核心层/服务/存档系统/模块化存档类型';
import { ResourceFormatService } from '../../核心层/服务/通用服务/资源格式化服务';

// Props
interface Props {
  show: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 历史记录数据
const roundHistory = ref<
  Array<{
    title: string;
    changes: Array<{
      type: string;
      amount: number;
    }>;
    timestamp: number;
  }>
>([]);

// 从存档系统加载历史记录
const loadHistoryFromSave = () => {
  const historyData = modularSaveManager.getModuleData<HistoryModuleData>({
    moduleName: 'history',
  });

  if (historyData) {
    roundHistory.value = historyData.roundHistory;
  }
};

// 保存历史记录到存档系统
const saveHistoryToSave = () => {
  const historyData: HistoryModuleData = {
    roundHistory: roundHistory.value,
    maxHistoryEntries: 100,
  };

  modularSaveManager.updateModuleData({
    moduleName: 'history',
    data: historyData,
  });
};

// 添加历史记录条目
const addHistoryEntry = (entry: {
  title: string;
  changes: Array<{
    type: string;
    amount: number;
  }>;
  timestamp: number;
}) => {
  roundHistory.value.unshift(entry);

  // 限制历史记录数量
  const maxEntries = 100;
  if (roundHistory.value.length > maxEntries) {
    roundHistory.value = roundHistory.value.slice(0, maxEntries);
  }

  // 保存到存档系统
  saveHistoryToSave();
};

// 监听显示状态变化，加载历史记录
watch(
  () => props.show,
  newShow => {
    if (newShow) {
      loadHistoryFromSave();
    }
  },
);

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistoryFromSave();
});

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 关闭模态框
const closeModal = () => {
  emit('close');
};

// 暴露方法给父组件
defineExpose({
  addHistoryEntry,
  loadHistoryFromSave,
  saveHistoryToSave,
});
</script>

<style lang="scss" scoped>
/* 历史记录弹窗样式 */
.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    position: relative;
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 2px solid rgba(205, 133, 63, 0.5);
    border-radius: 16px;
    padding: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);

    @media (max-width: 768px) {
      width: 95%;
      padding: 16px;
      max-height: 90vh;
      border-radius: 12px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(205, 133, 63, 0.3);

      .modal-title {
        color: #ffd7a1;
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .close-btn {
        background: none;
        border: none;
        color: #f0e6d2;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }
      }
    }

    .history-content {
      .no-history {
        text-align: center;
        padding: 40px 20px;
        color: #9ca3af;

        .no-history-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .no-history-text {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #f0e6d2;
        }

        .no-history-hint {
          font-size: 14px;
          opacity: 0.8;
        }
      }

      .history-list {
        .history-item {
          background: linear-gradient(180deg, rgba(44, 30, 24, 0.8), rgba(28, 20, 17, 0.9));
          border: 1px solid rgba(205, 133, 63, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            border-color: rgba(205, 133, 63, 0.4);
          }

          &:last-child {
            margin-bottom: 0;
          }

          .history-header {
            margin-bottom: 12px;

            .history-time {
              color: #9ca3af;
              font-size: 12px;
              margin-bottom: 4px;
            }

            .history-title {
              color: #ffd7a1;
              font-size: 16px;
              font-weight: 700;
            }
          }

          .history-changes {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .history-change {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 6px 10px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 6px;
              font-size: 12px;
              transition: all 0.2s ease;

              &:hover {
                background: rgba(0, 0, 0, 0.4);
                transform: scale(1.05);
              }

              &.positive {
                border-left: 3px solid #22c55e;
                background: rgba(34, 197, 94, 0.1);
              }

              &.negative {
                border-left: 3px solid #dc2626;
                background: rgba(220, 38, 38, 0.1);
              }

              .resource-icon {
                font-size: 12px;
              }

              .resource-name {
                color: #f0e6d2;
                font-weight: 500;
              }

              .change-amount {
                font-weight: 700;

                &.positive {
                  color: #22c55e;
                }

                &.negative {
                  color: #dc2626;
                }
              }
            }
          }
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-modal {
    .modal-content {
      .history-content {
        .history-list {
          .history-item {
            padding: 12px;

            .history-changes {
              gap: 6px;

              .history-change {
                padding: 4px 8px;
                font-size: 11px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
