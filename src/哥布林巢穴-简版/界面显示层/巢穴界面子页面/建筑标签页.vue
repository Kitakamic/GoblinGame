<template>
  <div class="building-tabs">
    <button class="tab-button" :class="{ active: activeTab === 'breeding' }" @click="$emit('tab-change', 'breeding')">
      👶 繁殖间
    </button>
    <button class="tab-button" :class="{ active: activeTab === 'resource' }" @click="$emit('tab-change', 'resource')">
      🏗️ 资源建筑
    </button>
  </div>
</template>

<script setup lang="ts">
// ==================== Props ====================

interface Props {
  activeTab: 'breeding' | 'resource';
}

defineProps<Props>();

// ==================== Emits ====================

defineEmits<{
  'tab-change': [tab: 'breeding' | 'resource'];
}>();
</script>

<style lang="scss" scoped>
// ==================== 标签页样式 ====================

.building-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  .tab-button {
    background: linear-gradient(180deg, rgba(44, 30, 24, 0.8), rgba(28, 20, 17, 0.9));
    color: #f0e6d2;
    border: 1px solid rgba(205, 133, 63, 0.3);
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
    flex: 1;
    @media (min-width: 769px) {
      font-size: 16px;
    }

    &:hover {
      background: linear-gradient(180deg, rgba(44, 30, 24, 0.9), rgba(28, 20, 17, 0.95));
      border-color: rgba(205, 133, 63, 0.5);
      transform: translateY(-1px);
    }

    &.active {
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(28, 20, 17, 0.9));
      border-color: rgba(34, 197, 94, 0.5);
      color: #22c55e;
    }
  }
}
</style>
