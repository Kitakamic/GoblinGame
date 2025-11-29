<template>
  <div class="building-section">
    <div class="building-scroll-container">
      <div class="building-grid">
        <BuildingSlot
          v-for="(slot, index) in slots"
          :key="`${slotType}-${index}`"
          :slot-data="slot"
          :index="index"
          :slot-type="slotType"
          :slot-classes="getSlotClasses(slot, index)"
          :is-next-unlock="isNextUnlockSlot(index)"
          :slot-cost="getSlotCost(index)"
          :occupant="getOccupant(index)"
          @slot-click="handleSlotClick"
          @remove-building="handleRemoveBuilding"
          @sacrifice-click="handleSacrificeClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BuildingSlot from './建筑槽位.vue';

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
  slots: BuildingSlot[];
  slotType: 'breeding' | 'resource' | 'global';
  getSlotCost: (index: number) => SlotCost;
  isNextUnlockSlot: (index: number) => boolean;
  getOccupant?: (index: number) => Occupant | null;
}

const props = defineProps<Props>();

// ==================== Emits ====================

const emit = defineEmits<{
  'slot-click': [index: number];
  'remove-building': [index: number];
  'sacrifice-click': [index: number];
}>();

// ==================== 计算属性 ====================

const getSlotClasses = (slot: BuildingSlot, index: number) => {
  return {
    occupied: !!slot.building,
    empty: !slot.building && slot.unlocked,
    locked: !slot.unlocked,
    nextUnlock: props.isNextUnlockSlot(index),
  };
};

// ==================== 方法 ====================

const handleSlotClick = (index: number) => {
  emit('slot-click', index);
};

const handleRemoveBuilding = (index: number) => {
  emit('remove-building', index);
};

const handleSacrificeClick = (index: number) => {
  emit('sacrifice-click', index);
};

const getOccupant = (index: number): Occupant | null => {
  if (props.getOccupant) {
    return props.getOccupant(index);
  }
  return null;
};
</script>

<style lang="scss" scoped>
// ==================== 内容区域样式 ====================

.building-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ==================== 滚动容器样式 ====================

.building-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(44, 30, 24, 0.3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(205, 133, 63, 0.6), rgba(139, 69, 19, 0.8));
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(180deg, rgba(205, 133, 63, 0.8), rgba(139, 69, 19, 1));
    }
  }

  // Firefox 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 133, 63, 0.6) rgba(44, 30, 24, 0.3);
}

// ==================== 网格布局样式 ====================

.building-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 8px;
  width: 100%;
  min-height: fit-content;

  // 移动端优化
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 4px;
  }
}
</style>
