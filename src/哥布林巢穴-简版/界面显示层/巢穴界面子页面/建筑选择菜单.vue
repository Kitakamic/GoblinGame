<template>
  <div v-if="show" class="building-menu">
    <div class="menu-header">
      <h4>选择建筑</h4>
      <button class="close-menu" title="关闭菜单" @click="$emit('close')">×</button>
    </div>
    <div class="building-options">
      <div
        v-for="building in availableBuildings"
        :key="building.id"
        class="building-option"
        :class="{ disabled: !canBuild(building) }"
        @click="handleSelectBuilding(building)"
      >
        <div class="option-icon">{{ building.icon }}</div>
        <div class="option-texts">
          <div class="option-name">{{ building.name }}</div>
          <div class="option-desc">{{ building.description }}</div>
        </div>
        <div class="option-cost">{{ building.cost.gold }}💰 {{ building.cost.food }}🍖</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ==================== Props ====================

interface BuildingCost {
  gold: number;
  food: number;
}

interface BuildingEffect {
  type: string;
  icon: string;
  description: string;
}

interface BuildingIncome {
  gold?: number;
  food?: number;
}

interface Building {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: BuildingCost;
  category: 'breeding' | 'resource';
  income?: BuildingIncome;
  effects: BuildingEffect[];
}

interface Props {
  show: boolean;
  availableBuildings: Building[];
  canBuild: (building: Building) => boolean;
}

const props = defineProps<Props>();

// ==================== Emits ====================

const emit = defineEmits<{
  close: [];
  'select-building': [building: Building];
}>();

// ==================== 方法 ====================

const handleSelectBuilding = (building: Building) => {
  if (props.canBuild(building)) {
    emit('select-building', building);
  }
};
</script>

<style lang="scss" scoped>
// ==================== 建筑菜单样式 ====================

.building-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.5);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  max-width: 500px;
  width: 90%;

  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h4 {
      color: #ffd7a1;
      margin: 0;
      font-size: 18px;
    }

    .close-menu {
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

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .building-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .building-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: linear-gradient(180deg, rgba(44, 30, 24, 0.8), rgba(28, 20, 17, 0.9));
    border: 1px solid rgba(205, 133, 63, 0.3);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(.disabled) {
      background: linear-gradient(180deg, rgba(44, 30, 24, 0.9), rgba(28, 20, 17, 0.95));
      border-color: rgba(205, 133, 63, 0.5);
      transform: translateY(-2px);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .option-icon {
      font-size: 24px;
    }

    .option-texts {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;

      .option-name {
        color: #ffd7a1;
        font-weight: 600;
        font-size: 16px;
        line-height: 1.1;
        @media (min-width: 769px) {
          font-size: 18px;
        }
      }

      .option-desc {
        color: #9ca3af;
        font-size: 12px;
        line-height: 1.2;
        @media (min-width: 769px) {
          font-size: 14px;
        }
      }
    }

    .option-cost {
      color: #87ceeb;
      font-size: 13px;
      @media (min-width: 769px) {
        font-size: 15px;
      }
    }
  }
}
</style>
