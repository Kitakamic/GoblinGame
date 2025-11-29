<template>
  <div class="global-buildings-section">
    <div class="global-buildings-scroll-container">
      <div class="global-buildings-list">
        <div
          v-for="building in availableBuildings"
          :key="building.id"
          class="global-building-card"
          :class="{
            unlocked: isUnlocked(building),
            locked: !isUnlocked(building),
            canBuild: isUnlocked(building) && canBuild(building),
            built: getBuiltCount(building) > 0,
            maxReached: building.maxCount && getBuiltCount(building) >= building.maxCount,
          }"
        >
          <!-- 卡片背景装饰 -->
          <div class="card-background"></div>
          <div class="card-glow"></div>

          <!-- 锁定遮罩 -->
          <div v-if="!isUnlocked(building)" class="lock-overlay">
            <div class="lock-icon">🔒</div>
            <div class="lock-text">未解锁</div>
            <div v-if="building.unlockCondition?.requiredBuildings?.length" class="unlock-hint">
              需要建造: {{ building.unlockCondition.requiredBuildings.join('、') }}
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 图标和标题区域 -->
            <div class="header-section">
              <div class="icon-wrapper">
                <div class="icon-bg"></div>
                <div class="building-icon">{{ building.icon }}</div>
                <div v-if="getBuiltCount(building) > 0" class="built-indicator">
                  <span class="indicator-dot"></span>
                </div>
              </div>
              <div class="title-wrapper">
                <h3 class="building-name">{{ building.name }}</h3>
                <p class="building-description">{{ building.description }}</p>
              </div>
            </div>

            <!-- 功能效果区域（简化显示） -->
            <div v-if="building.effects.length > 0 && getBuiltCount(building) > 0" class="features-section">
              <div class="features-list">
                <div v-for="(effect, effectIndex) in building.effects" :key="effectIndex" class="feature-tag">
                  <span class="feature-icon">{{ effect.icon }}</span>
                  <span class="feature-text">{{ effect.description }}</span>
                </div>
              </div>
            </div>

            <!-- 资源信息（仅在未建造时显示，且简化） -->
            <div v-if="getBuiltCount(building) === 0" class="build-info-section">
              <div class="cost-hint">
                <span class="hint-label">建造成本:</span>
                <span class="cost-value">
                  <span class="resource-item gold">💰 {{ building.cost.gold }}</span>
                  <span class="resource-item food">🍖 {{ building.cost.food }}</span>
                </span>
              </div>
              <div v-if="building.income" class="income-hint">
                <span class="hint-label">建成后收入:</span>
                <span class="income-value">
                  <span v-if="building.income.gold" class="resource-item gold"
                    >💰 +{{ building.income.gold }}/回合</span
                  >
                  <span v-if="building.income.food" class="resource-item food"
                    >🍖 +{{ building.income.food }}/回合</span
                  >
                </span>
              </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="actions-section">
              <!-- 已建造：显示进入/互动按钮 -->
              <button
                v-if="getBuiltCount(building) > 0"
                class="action-btn interact-btn"
                @click.stop="handleInteractClick(building)"
              >
                <span class="btn-icon">🚪</span>
                <span class="btn-text">进入</span>
              </button>

              <!-- 未建造：显示建造按钮 -->
              <template v-else>
                <button
                  v-if="isUnlocked(building) && canBuild(building)"
                  class="action-btn build-btn"
                  @click.stop="handleBuildClick(building)"
                >
                  <span class="btn-icon">🏗️</span>
                  <span class="btn-text">立即建造</span>
                </button>
                <button
                  v-else-if="isUnlocked(building) && !canBuild(building)"
                  class="action-btn build-btn disabled"
                  disabled
                >
                  <span class="btn-icon">⚠️</span>
                  <span class="btn-text">资源不足</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Building } from '../../功能模块层/巢穴/类型/建筑类型';

// ==================== Props ====================

interface Props {
  availableBuildings: Building[];
  builtBuildings: Record<string, number>; // 已建造建筑数量 { buildingId: count }
  isUnlocked: (building: Building) => boolean;
  canBuild: (building: Building) => boolean;
}

const props = defineProps<Props>();

// ==================== Emits ====================

const emit = defineEmits<{
  build: [building: Building];
  remove: [building: Building];
  interact: [building: Building]; // 新增：互动事件
}>();

// ==================== 方法 ====================

const getBuiltCount = (building: Building): number => {
  return props.builtBuildings[building.id] || 0;
};

const handleBuildClick = (building: Building) => {
  emit('build', building);
};

const handleInteractClick = (building: Building) => {
  // 未来会打开该建筑的互动弹窗
  emit('interact', building);
};
</script>

<style lang="scss" scoped>
// ==================== 全局建筑区域样式 ====================

.global-buildings-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ==================== 滚动容器样式 ====================

.global-buildings-scroll-container {
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
    background: linear-gradient(180deg, rgba(139, 92, 246, 0.6), rgba(99, 102, 241, 0.8));
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(180deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 1));
    }
  }

  // Firefox 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.6) rgba(44, 30, 24, 0.3);
}

// ==================== 建筑列表样式 ====================

.global-buildings-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 24px;
  padding: 24px;
  width: 100%;
  min-height: fit-content;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }
}

// ==================== 建筑卡片样式 ====================

.global-building-card {
  position: relative;
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 28px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  min-height: 280px;
  display: flex;
  flex-direction: column;

  // 背景装饰层
  .card-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  // 光晕效果
  .card-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  // 已解锁状态
  &.unlocked {
    border-color: rgba(139, 92, 246, 0.5);

    &:hover {
      border-color: rgba(139, 92, 246, 0.8);
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 16px 40px rgba(139, 92, 246, 0.5);

      .card-background {
        opacity: 1;
      }

      .card-glow {
        opacity: 1;
      }
    }

    &.canBuild {
      cursor: default;
    }

    &.built {
      border-color: rgba(34, 197, 94, 0.6);
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(30, 20, 15, 0.98));

      &:hover {
        border-color: rgba(34, 197, 94, 0.9);
        box-shadow: 0 16px 40px rgba(34, 197, 94, 0.4);
      }
    }
  }

  // 锁定状态
  &.locked {
    border-color: rgba(107, 114, 128, 0.3);
    opacity: 0.7;
    filter: grayscale(0.4);

    &:hover {
      border-color: rgba(107, 114, 128, 0.5);
      transform: translateY(-2px);
    }
  }

  // 达到最大数量
  &.maxReached {
    border-color: rgba(239, 68, 68, 0.5);
  }

  // 锁定遮罩
  .lock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(6px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 10;
    border-radius: 18px;

    .lock-icon {
      font-size: 56px;
      opacity: 0.9;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
    }

    .lock-text {
      font-size: 18px;
      font-weight: 700;
      color: #d1d5db;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .unlock-hint {
      font-size: 13px;
      color: #9ca3af;
      text-align: center;
      padding: 0 20px;
      line-height: 1.5;
    }
  }
}

// ==================== 卡片内容 ====================

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

// ==================== 头部区域 ====================

.header-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.icon-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.25), rgba(99, 102, 241, 0.15));
    border-radius: 50%;
    border: 3px solid rgba(139, 92, 246, 0.5);
    animation: pulse 2s ease-in-out infinite;
  }

  .building-icon {
    position: relative;
    font-size: 56px;
    line-height: 1;
    z-index: 1;
    filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.4));
  }

  .built-indicator {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, rgba(34, 197, 94, 1), rgba(22, 163, 74, 1));
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.5);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;

    .indicator-dot {
      width: 10px;
      height: 10px;
      background: #ffffff;
      border-radius: 50%;
      animation: blink 2s ease-in-out infinite;
    }
  }
}

.title-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.building-name {
  font-size: 26px;
  font-weight: 700;
  color: #c4b5fd;
  margin: 0;
  text-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.building-description {
  font-size: 15px;
  color: #d1d5db;
  line-height: 1.6;
  margin: 0;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

// ==================== 功能区域 ====================

.features-section {
  margin-top: 4px;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #c4b5fd;
  transition: all 0.2s ease;

  .feature-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .feature-text {
    font-weight: 500;
  }

  &:hover {
    background: rgba(139, 92, 246, 0.25);
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-1px);
  }
}

// ==================== 建造信息区域 ====================

.build-info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  margin-top: 4px;
}

.cost-hint,
.income-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;

  .hint-label {
    color: #9ca3af;
    font-weight: 600;
    flex-shrink: 0;
  }

  .cost-value,
  .income-value {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .resource-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;

    &.gold {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(251, 191, 36, 0.3);
    }

    &.food {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
  }
}

// ==================== 操作按钮区域 ====================

.actions-section {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition:
      width 0.6s,
      height 0.6s;
  }

  &:active::before {
    width: 400px;
    height: 400px;
  }

  .btn-icon {
    font-size: 20px;
    z-index: 1;
    position: relative;
  }

  .btn-text {
    z-index: 1;
    position: relative;
  }

  &.interact-btn {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(99, 102, 241, 1));
    color: #ffffff;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);

    &:hover {
      background: linear-gradient(135deg, rgba(139, 92, 246, 1), rgba(99, 102, 241, 1));
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 10px 30px rgba(139, 92, 246, 0.6);
    }

    &:active {
      transform: translateY(-1px) scale(1);
    }
  }

  &.build-btn {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 1));
    color: #ffffff;
    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);

    &:hover:not(.disabled) {
      background: linear-gradient(135deg, rgba(34, 197, 94, 1), rgba(22, 163, 74, 1));
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 10px 30px rgba(34, 197, 94, 0.6);
    }

    &:active:not(.disabled) {
      transform: translateY(-1px) scale(1);
    }

    &.disabled {
      background: rgba(107, 114, 128, 0.3);
      color: #9ca3af;
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.6;
    }
  }
}

// ==================== 移动端优化 ====================

@media (max-width: 768px) {
  .global-buildings-list {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }

  .global-building-card {
    padding: 24px;
    min-height: 260px;
  }

  .header-section {
    gap: 16px;
  }

  .icon-wrapper {
    width: 80px;
    height: 80px;

    .building-icon {
      font-size: 48px;
    }
  }

  .building-name {
    font-size: 22px;
  }

  .building-description {
    font-size: 14px;
  }

  .action-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}
</style>
