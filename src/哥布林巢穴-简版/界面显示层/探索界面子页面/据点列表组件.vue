<template>
  <div class="explore-content">
    <!-- 筛选器 -->
    <div class="explore-filters">
      <div class="filter-group">
        <div class="filter-buttons">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            class="filter-button"
            :class="{ active: selectedStatusFilter === filter.value }"
            @click="handleFilterChange(filter.value)"
          >
            <span>{{ filter.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 滚动容器 -->
    <div class="explore-scroll-container">
      <div class="explore-grid">
        <div v-for="location in locations" :key="location.id" class="explore-card">
          <div class="card-header">
            <div class="explore-icon">{{ location.icon }}</div>
            <div class="explore-info">
              <h4 class="explore-name">{{ location.name }}</h4>
              <p class="explore-description">{{ location.description }}</p>
              <div class="explore-stats">
                <span class="difficulty" :class="`star-${location.difficulty}`">
                  {{ getDifficultyText(location.difficulty) }}
                </span>
                <span class="distance">{{ location.distance }}km</span>
                <span v-if="isLocationCapital(location)" class="capital-badge">🏛️首都</span>
                <span class="status-badge" :class="getStatusClass(location)">
                  {{ getStatusText(location) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 侦察结果 -->
          <div v-if="location.status === 'scouted' && !scoutingLocations.has(location.id)" class="scout-results">
            <div class="scout-details">
              <div class="detail-item">
                <span class="label">防御：</span>
                <span class="value">{{ getTotalEnemyTroops(location) }}名守军</span>
              </div>
              <div class="detail-item">
                <span class="label">奖励：</span>
                <span class="value">
                  <span v-if="location.rewards.gold">💰{{ location.rewards.gold }}</span>
                  <span v-if="location.rewards.food">🍖{{ location.rewards.food }}</span>
                  <span v-if="location.rewards.slaves">🔒{{ location.rewards.slaves }}</span>
                </span>
              </div>
              <!-- 英雄奖励 -->
              <div v-if="location.rewards.heroes && location.rewards.heroes.length > 0" class="detail-item">
                <span class="label">英雄：</span>
                <span class="value">
                  <span v-for="hero in location.rewards.heroes" :key="hero.id" class="hero-reward">
                    👤{{ hero.name }} ({{ hero.title }})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="explore-actions">
            <button
              v-if="location.status === 'unknown' && !scoutingLocations.has(location.id)"
              class="scout-button"
              @click="handleScout(location)"
            >
              <span class="icon">🔍</span>
              <span>侦察 ({{ getScoutCost(location.difficulty, location.distance) }})</span>
            </button>

            <button v-if="scoutingLocations.has(location.id)" class="scouting-button" disabled>
              <span class="icon scouting-icon">🔍</span>
              <span>侦察中...</span>
            </button>

            <button
              v-if="location.status === 'scouted' && !scoutingLocations.has(location.id)"
              class="attack-button"
              @click="handleAttack(location)"
            >
              <span class="icon">⚔️</span>
              <span>战斗</span>
            </button>
            <button v-if="location.status === 'conquered'" class="conquered-button" disabled>
              <span class="icon">✅</span>
              <span>已征服</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExploreUIUtils } from '../../功能模块层/探索/服务/探索界面工具服务';
import type { Location } from '../../功能模块层/探索/类型/探索类型';

// Props
const props = defineProps<{
  locations: Location[];
  selectedStatusFilter: string;
  statusFilters: Array<{ value: string; label: string }>;
  scoutingLocations: Set<string>;
  currentRegionCapital?: string;
}>();

// Emits
const emit = defineEmits<{
  filterChange: [value: string];
  scout: [location: Location];
  attack: [location: Location];
}>();

// 工具函数（使用 ExploreUIUtils 服务）
const getDifficultyText = ExploreUIUtils.getDifficultyText;
const getScoutCost = ExploreUIUtils.formatScoutCost;
const getTotalEnemyTroops = ExploreUIUtils.getTotalEnemyTroops;
const isLocationCapital = (location: Location) =>
  ExploreUIUtils.isLocationCapital(location, props.currentRegionCapital);
const getStatusText = (location: Location) =>
  ExploreUIUtils.getStatusText(location, props.scoutingLocations.has(location.id));
const getStatusClass = (location: Location) =>
  ExploreUIUtils.getStatusClass(location, props.scoutingLocations.has(location.id));

// 处理筛选变化
const handleFilterChange = (value: string) => {
  emit('filterChange', value);
};

// 处理侦察
const handleScout = (location: Location) => {
  emit('scout', location);
};

// 处理攻击
const handleAttack = (location: Location) => {
  emit('attack', location);
};
</script>

<style scoped lang="scss">
.explore-content {
  .explore-filters {
    margin-bottom: 8px;
    padding: 0 20px;

    @media (max-width: 768px) {
      padding: 0 8px;
      margin-bottom: 6px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        gap: 4px;
        justify-content: center;
      }

      .filter-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        flex: 1;
        justify-content: space-between;

        @media (max-width: 768px) {
          width: 100%;
          justify-content: center;
          flex: none;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(205, 133, 63, 0.3);
          border-radius: 4px;
          color: #f0e6d2;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          justify-content: center;

          @media (max-width: 768px) {
            padding: 6px 8px;
            font-size: 9px;
          }

          &:hover {
            background: rgba(205, 133, 63, 0.2);
            border-color: rgba(205, 133, 63, 0.5);
            transform: translateY(-1px);
          }

          &.active {
            background: linear-gradient(180deg, #cd853f, #b8860b);
            border-color: rgba(205, 133, 63, 0.8);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(205, 133, 63, 0.3);

            &:hover {
              background: linear-gradient(180deg, #b8860b, #9a7209);
              transform: translateY(-1px);
            }
          }
        }
      }
    }
  }

  .explore-scroll-container {
    height: calc(100vh - 365px);
    overflow-y: auto;
    padding: 12px;
    margin-top: 12px;
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.6), rgba(25, 17, 14, 0.8));
    border: 2px solid rgba(205, 133, 63, 0.4);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    @media (max-width: 768px) {
      height: calc(100vh - 310px);
      padding: 8px;
      margin-top: 8px;
    }

    &::-webkit-scrollbar {
      width: 6px;

      @media (max-width: 768px) {
        width: 4px;
      }
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(205, 133, 63, 0.5);
      border-radius: 3px;

      &:hover {
        background: rgba(205, 133, 63, 0.7);
      }
    }
  }

  .explore-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .explore-card {
      background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
      border: 1px solid rgba(205, 133, 63, 0.3);
      border-radius: 8px;
      padding: 12px;
      transition: all 0.2s ease;

      @media (max-width: 768px) {
        padding: 8px;
        border-radius: 6px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);

        @media (max-width: 768px) {
          transform: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;

        @media (max-width: 768px) {
          gap: 6px;
          margin-bottom: 6px;
        }

        .explore-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          flex-shrink: 0;

          @media (max-width: 768px) {
            font-size: 20px;
          }
        }

        .explore-info {
          flex: 1;

          .explore-name {
            margin: 0 0 2px 0;
            color: #ffe9d2;
            font-size: 14px;

            @media (max-width: 768px) {
              font-size: 12px;
            }
          }

          .explore-description {
            margin: 0 0 4px 0;
            color: #f0e6d2;
            opacity: 0.8;
            font-size: 10px;
            line-height: 1.3;

            @media (max-width: 768px) {
              font-size: 9px;
              line-height: 1.2;
            }
          }

          .explore-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;

            @media (max-width: 768px) {
              gap: 3px;
            }

            .difficulty {
              padding: 1px 4px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 600;
              display: inline-flex;
              align-items: center;
              gap: 1px;
              font-family: monospace;
              letter-spacing: -0.5px;

              @media (max-width: 768px) {
                padding: 1px 3px;
                font-size: 8px;
                gap: 0.5px;
              }

              &.star-1,
              &.star-2 {
                background: rgba(34, 197, 94, 0.2);
                color: #22c55e;
              }

              &.star-3,
              &.star-4 {
                background: rgba(251, 191, 36, 0.2);
                color: #fbbf24;
              }

              &.star-5,
              &.star-6 {
                background: rgba(245, 158, 11, 0.2);
                color: #f59e0b;
              }

              &.star-7,
              &.star-8 {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
              }

              &.star-9,
              &.star-10 {
                background: rgba(147, 51, 234, 0.2);
                color: #9333ea;
              }
            }

            .distance {
              font-size: 9px;
              color: #9ca3af;
              padding: 1px 4px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 3px;

              @media (max-width: 768px) {
                font-size: 8px;
                padding: 1px 3px;
              }
            }

            .capital-badge {
              padding: 1px 4px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 600;
              background: rgba(255, 215, 0, 0.2);
              color: #ffd700;
              border: 1px solid rgba(255, 215, 0, 0.4);

              @media (max-width: 768px) {
                padding: 1px 3px;
                font-size: 8px;
              }
            }

            .status-badge {
              padding: 1px 4px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 600;

              @media (max-width: 768px) {
                padding: 1px 3px;
                font-size: 8px;
              }

              &.unknown {
                background: rgba(107, 114, 128, 0.2);
                color: #6b7280;
              }

              &.scouting {
                background: rgba(245, 158, 11, 0.2);
                color: #f59e0b;
                animation: scoutingPulse 1.5s ease-in-out infinite;
              }

              &.scouted {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
              }

              &.conquered {
                background: rgba(34, 197, 94, 0.2);
                color: #22c55e;
              }
            }
          }
        }
      }

      .scout-results {
        margin: 12px 0;
        padding: 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        border-left: 3px solid rgba(59, 130, 246, 0.5);

        @media (max-width: 768px) {
          margin: 8px 0;
          padding: 8px;
          border-radius: 6px;
        }

        .scout-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;

          @media (max-width: 768px) {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .hero-reward {
            display: inline-block;
            margin: 2px 4px 2px 0;
            padding: 2px 6px;
            background: rgba(255, 215, 0, 0.2);
            border: 1px solid rgba(255, 215, 0, 0.4);
            border-radius: 4px;
            color: #ffd700;
            font-size: 12px;
            font-weight: 500;
          }

          .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;

            @media (max-width: 768px) {
              padding: 1px 0;
            }

            .label {
              color: #f0e6d2;
              opacity: 0.8;
              font-size: 11px;

              @media (max-width: 768px) {
                font-size: 10px;
              }
            }

            .value {
              color: #ffe9d2;
              font-weight: 600;
              font-size: 11px;

              @media (max-width: 768px) {
                font-size: 10px;
              }
            }
          }
        }
      }

      .explore-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;

        @media (max-width: 768px) {
          flex-direction: column;
          gap: 4px;
        }

        button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 10px;
          font-weight: 600;

          @media (max-width: 768px) {
            padding: 8px 12px;
            font-size: 12px;
            width: 100%;
            justify-content: center;
          }

          .icon {
            font-size: 12px;

            @media (max-width: 768px) {
              font-size: 10px;
            }
          }

          &.scout-button {
            background: linear-gradient(180deg, #3b82f6, #2563eb);
            border: 1px solid rgba(59, 130, 246, 0.6);
            color: #ffffff;

            &:hover:not(:disabled) {
              background: linear-gradient(180deg, #2563eb, #1d4ed8);
              transform: translateY(-1px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }

          &.scouting-button {
            background: linear-gradient(180deg, #f59e0b, #d97706);
            border: 1px solid rgba(245, 158, 11, 0.6);
            color: #ffffff;
            cursor: not-allowed;
            position: relative;
            overflow: hidden;

            .scouting-icon {
              animation: scoutingPulse 1.5s ease-in-out infinite;
            }
          }

          &.attack-button {
            background: linear-gradient(180deg, #dc2626, #b91c1c);
            border: 1px solid rgba(220, 38, 38, 0.6);
            color: #ffffff;

            &:hover {
              background: linear-gradient(180deg, #b91c1c, #991b1b);
              transform: translateY(-1px);
            }
          }

          &.conquered-button {
            background: linear-gradient(180deg, #22c55e, #16a34a);
            border: 1px solid rgba(34, 197, 94, 0.6);
            color: #ffffff;
            cursor: not-allowed;
            opacity: 0.8;
          }
        }
      }
    }
  }
}

@keyframes scoutingPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
</style>
