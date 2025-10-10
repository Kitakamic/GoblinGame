<template>
  <div v-if="showModal" class="save-load-modal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">存档管理</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="save-slots">
        <div
          v-for="slot in saveSlots"
          :key="slot.slot"
          class="save-slot"
          :class="{
            'has-save': slot.timestamp > 0,
            empty: slot.timestamp === 0,
            'auto-save': slot.slot === 0 && slot.timestamp > 0,
          }"
        >
          <div class="slot-header">
            <span class="slot-number">
              {{ slot.slot === 0 ? '自动存档' : `槽位 ${slot.slot}` }}
            </span>
            <span class="slot-time">{{ formatTime(slot.timestamp) }}</span>
          </div>

          <div v-if="slot.timestamp > 0" class="slot-info">
            <div class="resource-info">
              <div class="resource-item">
                <span class="resource-icon">🔄</span>
                <span class="resource-value">{{ slot.data?.baseResources?.rounds || 0 }}</span>
              </div>
              <div class="resource-item">
                <span class="resource-icon">💰</span>
                <span class="resource-value">{{ slot.data?.baseResources?.gold || 0 }}</span>
              </div>
              <div class="resource-item">
                <span class="resource-icon">🍖</span>
                <span class="resource-value">{{ slot.data?.baseResources?.food || 0 }}</span>
              </div>
              <div class="resource-item">
                <span class="resource-icon">💋</span>
                <span class="resource-value">{{ slot.data?.baseResources?.trainingSlaves || 0 }}</span>
              </div>
            </div>
            <div class="slot-actions">
              <button class="action-btn load-action" @click="loadFromSlot(slot.slot)">
                <span class="icon">📂</span>
                <span class="text">读取</span>
              </button>
              <button v-if="slot.slot !== 0" class="action-btn save-action" @click="saveToSlot(slot.slot)">
                <span class="icon">💾</span>
                <span class="text">保存</span>
              </button>
            </div>
          </div>

          <div v-else class="empty-slot">
            <div class="empty-icon">📁</div>
            <div class="empty-text">空槽位</div>
            <button class="action-btn save-action" @click="saveToSlot(slot.slot)">
              <span class="icon">💾</span>
              <span class="text">保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { modularSaveManager } from './模块化存档服务';
import type { BaseResources, ModularSaveSlot } from './模块化存档类型';

// Props
interface Props {
  show?: boolean;
  currentResources?: BaseResources;
  currentGameState?: any;
  latestRoundInfo?: any;
  roundHistory?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  currentResources: () => ({
    gold: 0,
    food: 0,
    threat: 0,
    slaves: 0,
    normalGoblins: 0,
    warriorGoblins: 0,
    shamanGoblins: 0,
    paladinGoblins: 0,
    trainingSlaves: 0,
    rounds: 0,
    // 行动力系统字段
    actionPoints: 3,
    maxActionPoints: 3,
    conqueredRegions: 0,
  }),
  currentGameState: null,
  latestRoundInfo: null,
  roundHistory: () => [],
});

// Emits
const emit = defineEmits<{
  close: [];
  save: [slot: number];
  load: [slot: number, data: any];
  error: [error: string];
}>();

// 响应式数据
const showModal = ref(props.show);
const saveSlots = ref<ModularSaveSlot[]>([]);
const isInitialized = ref(false);

// 监听props变化
watch(
  () => props.show,
  newValue => {
    showModal.value = newValue;
    if (newValue) {
      loadSaveSlots();
    }
  },
);

// 加载存档槽位
const loadSaveSlots = async () => {
  try {
    if (!isInitialized.value) {
      await modularSaveManager.init();
      isInitialized.value = true;
    }

    // 获取所有槽位（包括空的）
    const allSlots = await modularSaveManager.getAllSlots();
    console.log('获取到的存档槽位:', allSlots);

    saveSlots.value = allSlots;
  } catch (error) {
    console.error('加载存档槽位失败:', error);
    emit('error', '加载存档槽位失败');
  }
};

// 自动存档现在通过槽位0显示，不需要单独处理

// 保存到指定槽位
const saveToSlot = async (slot: number) => {
  try {
    // 获取当前游戏数据
    const currentGameData = modularSaveManager.getCurrentGameData();
    if (!currentGameData) {
      // 如果没有当前游戏数据，创建新游戏
      modularSaveManager.createNewGame();
    }

    // 更新基础资源
    if (props.currentResources) {
      modularSaveManager.updateBaseResources(props.currentResources);
    }

    // 巢穴数据现在由数据库系统处理，不需要单独的模块更新
    // 建筑槽位和历史记录数据现在由数据库系统管理

    // 保存到槽位
    const success = await modularSaveManager.saveCurrentGameData(slot, `存档 ${slot}`);

    if (success) {
      await loadSaveSlots();
      emit('save', slot);
    } else {
      emit('error', `保存到槽位 ${slot} 失败`);
    }
  } catch (error) {
    emit('error', `保存失败: ${error}`);
  }
};

// 从指定槽位读取
const loadFromSlot = async (slot: number) => {
  try {
    const data = await modularSaveManager.loadFromSlot({ slot });
    if (data) {
      emit('load', slot, data);
      closeModal();
    } else {
      emit('error', `槽位 ${slot} 没有存档`);
    }
  } catch (error) {
    emit('error', `读取失败: ${error}`);
  }
};

// 格式化时间
const formatTime = (timestamp: number) => {
  return modularSaveManager.formatTime(timestamp);
};

// 生命周期钩子
onMounted(async () => {
  // 初始化存档界面
  try {
    // 检查是否需要数据迁移
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

// 关闭模态框
const closeModal = () => {
  showModal.value = false;
  emit('close');
};
</script>

<style lang="scss" scoped>
/* 存档管理界面样式 */
.save-load-modal {
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
    max-width: 800px;
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

    .save-slots {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .save-slot {
        background: linear-gradient(180deg, rgba(44, 30, 24, 0.8), rgba(28, 20, 17, 0.9));
        border: 2px solid rgba(205, 133, 63, 0.3);
        border-radius: 12px;
        padding: 16px;
        transition: all 0.3s ease;

        &.has-save {
          border-color: rgba(34, 197, 94, 0.5);
          background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), rgba(28, 20, 17, 0.9));
        }

        &.auto-save {
          border-color: rgba(168, 85, 247, 0.5);
          background: linear-gradient(180deg, rgba(168, 85, 247, 0.1), rgba(28, 20, 17, 0.9));
        }

        &.empty {
          border-color: rgba(107, 114, 128, 0.3);
          background: linear-gradient(180deg, rgba(107, 114, 128, 0.05), rgba(28, 20, 17, 0.9));
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .slot-number {
            color: #ffd7a1;
            font-weight: 700;
            font-size: 16px;
          }

          .slot-time {
            color: #9ca3af;
            font-size: 12px;
          }
        }

        .slot-info {
          .resource-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;

            .resource-item {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 6px 8px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 6px;

              .resource-icon {
                font-size: 14px;
              }

              .resource-value {
                color: #f0e6d2;
                font-size: 12px;
                font-weight: 600;
              }
            }
          }

          .slot-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;

            @media (max-width: 768px) {
              gap: 6px;
            }
          }
        }

        .empty-slot {
          text-align: center;
          padding: 20px 0;

          .empty-icon {
            font-size: 32px;
            margin-bottom: 8px;
            opacity: 0.6;
          }

          .empty-text {
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 16px;
          }
        }
      }
    }
  }
}

/* 动作按钮样式 */
.action-btn {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.4);
  border-radius: 6px;
  padding: 6px 10px;
  color: #ffd7a1;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 70px;
    gap: 6px;
  }

  &:hover {
    background: linear-gradient(180deg, rgba(50, 36, 30, 0.9), rgba(35, 27, 24, 0.95));
    border-color: rgba(205, 133, 63, 0.6);
    transform: translateY(-1px);
  }

  .icon {
    font-size: 12px;
  }

  .text {
    font-size: 10px;
    font-weight: 700;
  }

  &.load-action {
    border-color: rgba(59, 130, 246, 0.4);
    background: linear-gradient(180deg, rgba(59, 130, 246, 0.1), rgba(25, 17, 14, 0.9));
    color: #60a5fa;

    &:hover {
      border-color: rgba(59, 130, 246, 0.6);
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.2), rgba(35, 27, 24, 0.95));
    }
  }

  &.save-action {
    border-color: rgba(34, 197, 94, 0.4);
    background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), rgba(25, 17, 14, 0.9));
    color: #4ade80;

    &:hover {
      border-color: rgba(34, 197, 94, 0.6);
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(35, 27, 24, 0.95));
    }
  }
}
</style>
