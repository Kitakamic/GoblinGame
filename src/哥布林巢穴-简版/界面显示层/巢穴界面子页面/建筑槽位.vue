<template>
  <div class="building-slot" :class="slotClasses" @click="$emit('slot-click', index)">
    <!-- 已建设建筑 -->
    <div v-if="slotData.building" class="building">
      <div class="building-icon">{{ slotData.building.icon }}</div>
      <div class="building-name">{{ slotData.building.name }}</div>

      <!-- 显示交配间占用情况 -->
      <div v-if="slotData.building.id === 'breeding' && slotType === 'breeding'" class="breeding-status">
        <div v-if="occupant" class="occupied-status">
          <span class="occupant-name">{{ occupant.name }}</span>
          <span class="occupant-status">{{ occupant.status === 'breeding' ? '交配中' : '待命' }}</span>
        </div>
        <div v-else class="available-status">
          <span class="available-text">空闲</span>
        </div>
      </div>

      <!-- 建筑收入显示 -->
      <div v-if="slotData.building.income && slotType === 'resource'" class="building-income">
        <div v-if="slotData.building.income.gold" class="income-display">
          <span class="income-icon">💰</span>
          <span class="income-text">+{{ slotData.building.income.gold }}</span>
        </div>
        <div v-if="slotData.building.income.food" class="income-display">
          <span class="income-icon">🍖</span>
          <span class="income-text">+{{ slotData.building.income.food }}</span>
        </div>
      </div>

      <!-- 献祭祭坛特殊交互 -->
      <div
        v-if="slotData.building.id === 'sacrifice_altar' && slotType === 'resource'"
        class="sacrifice-button-container"
      >
        <button class="sacrifice-button" @click.stop="$emit('sacrifice-click', index)">献祭</button>
      </div>

      <button class="remove-button" title="拆除建筑" @click.stop="$emit('remove-building', index)">×</button>
    </div>

    <!-- 空槽位 -->
    <div v-else-if="slotData.unlocked" class="empty-slot">
      <div class="empty-icon">🏗️</div>
      <div class="empty-text">空槽位</div>
    </div>

    <!-- 可开通槽位 -->
    <div v-else-if="isNextUnlock" class="next-unlock-slot">
      <div class="expand-icon">+</div>
      <div class="expand-text">开通槽位</div>
      <div class="expand-cost">{{ slotCost.gold }}💰 {{ slotCost.food }}🍖</div>
    </div>

    <!-- 锁定槽位 -->
    <div v-else class="locked-slot">
      <div class="locked-icon">🔒</div>
      <div class="locked-text">锁定</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ==================== Props ====================

interface BuildingIncome {
  gold?: number;
  food?: number;
}

interface Building {
  id: string;
  name: string;
  icon: string;
  income?: BuildingIncome;
}

interface BuildingSlot {
  building: Building | null;
  unlocked: boolean;
}

interface SlotCost {
  gold: number;
  food: number;
}

interface Occupant {
  id: string;
  name: string;
  status: 'breeding' | 'imprisoned';
}

interface Props {
  slotData: BuildingSlot;
  index: number;
  slotType: 'breeding' | 'resource';
  slotClasses: {
    occupied: boolean;
    empty: boolean;
    locked: boolean;
    nextUnlock: boolean;
  };
  isNextUnlock: boolean;
  slotCost: SlotCost;
  occupant?: Occupant | null;
}

defineProps<Props>();

// ==================== Emits ====================

defineEmits<{
  'slot-click': [index: number];
  'remove-building': [index: number];
  'sacrifice-click': [index: number];
}>();
</script>

<style lang="scss" scoped>
// ==================== 建筑槽位样式 ====================

.building-slot {
  aspect-ratio: 1;
  background: linear-gradient(180deg, rgba(44, 30, 24, 0.72), rgba(28, 20, 17, 0.92));
  border: 2px solid rgba(205, 133, 63, 0.25);
  border-radius: 8px;
  padding: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 10px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  min-width: 0;
  min-height: 0;

  // 移动端优化
  @media (max-width: 768px) {
    padding: 8px;
    border-radius: 8px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 8px 18px rgba(0, 0, 0, 0.5);
  }

  // 槽位状态样式
  &.occupied {
    border-color: rgba(34, 197, 94, 0.5);
    background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), rgba(28, 20, 17, 0.92));
  }

  &.empty {
    border-color: rgba(107, 114, 128, 0.5);
    background: linear-gradient(180deg, rgba(107, 114, 128, 0.1), rgba(28, 20, 17, 0.92));
  }

  &.locked {
    border-color: rgba(107, 114, 128, 0.3);
    background: linear-gradient(180deg, rgba(107, 114, 128, 0.05), rgba(28, 20, 17, 0.92));
    opacity: 0.6;
  }

  &.nextUnlock {
    border-color: rgba(34, 197, 94, 0.5);
    background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), rgba(28, 20, 17, 0.92));
  }
}

// ==================== 建筑内容样式 ====================

.building {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;

  .building-icon {
    font-size: 40px;
    margin-bottom: 8px;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 4px;
    }
  }

  .building-name {
    color: #ffd7a1;
    font-weight: 700;
    font-size: 16px;
    text-align: center;
    line-height: 1.2;
    margin-bottom: 4px;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 12px;
    }
    @media (min-width: 769px) {
      font-size: 18px;
    }
  }

  .building-income {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-bottom: 4px;

    .income-display {
      display: flex;
      align-items: center;
      gap: 2px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 4px;
      padding: 2px 4px;

      .income-icon {
        font-size: 10px;
      }

      .income-text {
        color: #22c55e;
        font-size: 10px;
        font-weight: 600;
        @media (min-width: 769px) {
          font-size: 16px;
        }
      }
    }
  }

  .remove-button {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: linear-gradient(180deg, #dc2626, #b91c1c);
    color: #ffffff;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(180deg, #ef4444, #dc2626);
      transform: scale(1.1);
    }
  }

  .breeding-status {
    position: absolute;
    bottom: 4px;
    left: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 10px;

    .occupied-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;

      .occupant-name {
        color: #ffd7a1;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        @media (min-width: 769px) {
          font-size: 16px;
        }
      }

      .occupant-status {
        color: #ff6b6b;
        font-size: 8px;
        @media (min-width: 769px) {
          font-size: 16px;
        }
      }
    }

    .available-status {
      display: flex;
      justify-content: center;
      align-items: center;

      .available-text {
        color: #90ee90;
        font-weight: 600;
        font-size: 8px;
        @media (min-width: 769px) {
          font-size: 16px;
        }
      }
    }
  }
}

// ==================== 槽位状态样式 ====================

.empty-slot {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .empty-icon {
    font-size: 40px;
    margin-bottom: 8px;
    opacity: 0.6;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 4px;
    }
  }

  .empty-text {
    color: #9ca3af;
    font-size: 14px;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 10px;
    }
  }
}

.next-unlock-slot {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .expand-icon {
    font-size: 40px;
    margin-bottom: 8px;
    color: #22c55e;
    font-weight: bold;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 4px;
    }
  }

  .expand-text {
    color: #22c55e;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 10px;
    }
    @media (min-width: 769px) {
      font-size: 16px;
    }
  }

  .expand-cost {
    color: #fbbf24;
    font-size: 12px;
    font-weight: 600;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 8px;
    }
  }
}

.locked-slot {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .locked-icon {
    font-size: 40px;
    margin-bottom: 8px;
    color: #6b7280;
    opacity: 0.6;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 24px;
      margin-bottom: 4px;
    }
  }

  .locked-text {
    color: #6b7280;
    font-size: 14px;
    opacity: 0.6;

    // 移动端优化
    @media (max-width: 768px) {
      font-size: 10px;
    }
    @media (min-width: 769px) {
      font-size: 16px;
    }
  }
}

// ==================== 献祭祭坛相关样式 ====================

.sacrifice-button-container {
  margin-top: 4px;
}

.sacrifice-button {
  background: linear-gradient(180deg, #dc2626, #b91c1c);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: linear-gradient(180deg, #ef4444, #dc2626);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
