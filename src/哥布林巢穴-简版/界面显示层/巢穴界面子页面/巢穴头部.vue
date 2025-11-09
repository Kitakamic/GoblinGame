<template>
  <div class="nest-header">
    <h3 class="nest-title">🏰 哥布林巢穴</h3>
    <div class="income-summary">
      <div v-if="totalIncome.gold > 0" class="income-item">
        <span class="income-icon">💰</span>
        <span class="income-amount">+{{ totalIncome.gold }}</span>
      </div>
      <div v-if="totalIncome.food > 0" class="income-item">
        <span class="income-icon">🍖</span>
        <span class="income-amount">+{{ totalIncome.food }}</span>
      </div>
      <div class="income-label">每回合</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ==================== Props ====================

interface Props {
  totalIncome: {
    gold: number;
    food: number;
  };
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
// ==================== 头部样式 ====================

.nest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .nest-title {
    margin: 0;
    color: #ffd7a1;
    text-shadow:
      0 2px 6px rgba(0, 0, 0, 0.6),
      0 0 10px rgba(255, 120, 40, 0.2);
    font-size: 20px;
  }
}

.income-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(180deg, rgba(34, 197, 94, 0.15), rgba(28, 20, 17, 0.9));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 6px 12px;

  .income-item {
    display: flex;
    align-items: center;
    gap: 4px;

    .income-icon {
      font-size: 14px;
    }

    .income-amount {
      color: #22c55e;
      font-size: 12px;
      font-weight: 600;
      @media (min-width: 769px) {
        font-size: 16px;
      }
    }
  }

  .income-label {
    color: #9ca3af;
    font-size: 10px;
    font-weight: 500;
    margin-left: 4px;
    @media (min-width: 769px) {
      font-size: 12px;
    }
  }
}
</style>
