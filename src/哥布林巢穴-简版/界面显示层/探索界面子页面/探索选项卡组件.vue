<template>
  <div>
    <!-- 大陆选项卡 -->
    <div class="continent-tabs">
      <div class="tabs-container">
        <button
          v-for="continent in continents"
          :key="continent.name"
          class="continent-tab"
          :class="{
            active: selectedContinent === continent.name,
            conquered: continent.isConquered,
            locked: !continent.isUnlocked,
          }"
          :disabled="!continent.isUnlocked"
          @click="handleContinentSelect(continent.name)"
        >
          <div class="tab-icon">{{ continent.icon }}</div>
          <div class="tab-content">
            <div class="tab-name">{{ continent.name }}</div>
            <div class="tab-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${continent.conquestProgress}%` }"></div>
              </div>
              <span class="progress-text">{{ Math.round(continent.conquestProgress) }}%</span>
            </div>
          </div>
          <div v-if="continent.isConquered" class="conquered-badge">✅</div>
          <div v-else-if="!continent.isUnlocked" class="locked-badge">🔒</div>
        </button>
      </div>
    </div>

    <!-- 区域选项卡 -->
    <div v-if="regions.length > 0 && currentContinent?.isUnlocked" class="region-tabs">
      <div class="tabs-container">
        <button
          v-for="region in regions"
          :key="region.name"
          class="region-tab"
          :class="{
            active: selectedRegion === region.name,
            conquered: region.isConquered,
            locked: !region.isUnlocked,
          }"
          :disabled="!region.isUnlocked"
          @click="handleRegionSelect(region.name)"
        >
          <div class="tab-icon">{{ region.icon }}</div>
          <div class="tab-content">
            <div class="tab-name">{{ region.name }}</div>
            <div class="tab-progress">
              <div
                class="progress-bar"
                :class="{ 'unlock-progress': !region.isUnlocked && (region.unlockStars ?? 0) > 0 }"
              >
                <div
                  class="progress-fill"
                  :class="{ 'unlock-fill': !region.isUnlocked && (region.unlockStars ?? 0) > 0 }"
                  :style="{
                    width: `${
                      !region.isUnlocked && (region.unlockStars ?? 0) > 0
                        ? Math.min(100, (currentContinentConqueredStars / (region.unlockStars ?? 1)) * 100)
                        : region.conquestProgress
                    }%`,
                  }"
                ></div>
              </div>
              <span
                class="progress-text"
                :class="{ 'unlock-text-small': !region.isUnlocked && (region.unlockStars ?? 0) > 0 }"
              >
                {{
                  !region.isUnlocked && (region.unlockStars ?? 0) > 0
                    ? `${currentContinentConqueredStars}/${region.unlockStars ?? 0}⭐`
                    : `${Math.round(region.conquestProgress)}%`
                }}
              </span>
            </div>
            <!-- 首都征服状态 -->
            <div v-if="region.capital && region.isUnlocked" class="capital-status">
              <span class="capital-icon">🏛️</span>
              <span class="capital-name">{{ region.capital }}</span>
              <span class="capital-conquest" :class="{ conquered: region.isCapitalConquered }">
                {{ region.isCapitalConquered ? '已征服' : '未征服' }}
              </span>
            </div>
          </div>
          <div v-if="region.isConquered" class="conquered-badge">✅</div>
          <div v-else-if="!region.isUnlocked" class="locked-badge">🔒</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
const props = defineProps<{
  continents: Array<{
    name: string;
    icon: string;
    isConquered: boolean;
    isUnlocked: boolean;
    conquestProgress: number;
  }>;
  regions: Array<{
    name: string;
    icon: string;
    isConquered: boolean;
    isUnlocked: boolean;
    conquestProgress: number;
    unlockStars?: number;
    capital?: string;
    isCapitalConquered?: boolean;
  }>;
  selectedContinent: string;
  selectedRegion: string;
  currentContinentConqueredStars: number;
}>();

// Emits
const emit = defineEmits<{
  continentSelect: [name: string];
  regionSelect: [name: string];
}>();

// 当前大陆
const currentContinent = computed(() => {
  return props.continents.find(c => c.name === props.selectedContinent);
});

// 处理大陆选择
const handleContinentSelect = (name: string) => {
  emit('continentSelect', name);
};

// 处理区域选择
const handleRegionSelect = (name: string) => {
  emit('regionSelect', name);
};
</script>

<style scoped lang="scss">
// 大陆选项卡样式
.continent-tabs {
  margin-bottom: 12px;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0 8px;
    margin-bottom: 8px;
  }

  .tabs-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;

    @media (max-width: 768px) {
      gap: 6px;
      padding: 2px 0;
    }

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(205, 133, 63, 0.5);
      border-radius: 2px;

      &:hover {
        background: rgba(205, 133, 63, 0.7);
      }
    }
  }

  .continent-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
    border: 1px solid rgba(205, 133, 63, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 160px;
    position: relative;
    overflow: hidden;

    @media (max-width: 768px) {
      min-width: 120px;
      padding: 6px 8px;
      gap: 6px;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      border-color: rgba(205, 133, 63, 0.6);
    }

    &.active {
      background: linear-gradient(180deg, #cd853f, #b8860b);
      border-color: rgba(205, 133, 63, 0.8);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(205, 133, 63, 0.4);

      .tab-name {
        color: #ffffff;
        font-weight: 700;
      }

      .progress-fill {
        background: rgba(255, 255, 255, 0.8);
      }
    }

    &.conquered {
      border-color: rgba(34, 197, 94, 0.6);
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.2));

      .tab-name {
        color: #22c55e;
      }
    }

    &.locked {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(0, 0, 0, 0.3);

      .tab-name {
        color: #6b7280;
      }
    }

    .tab-icon {
      font-size: 20px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      flex-shrink: 0;

      @media (max-width: 768px) {
        font-size: 16px;
      }
    }

    .tab-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .tab-name {
        font-size: 12px;
        font-weight: 600;
        color: #f0e6d2;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 768px) {
          font-size: 10px;
        }
      }

      .tab-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;

        .progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 2px;
          overflow: hidden;

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc2626, #b91c1c);
            border-radius: 2px;
            transition: width 0.3s ease;
          }
        }

        .progress-text {
          font-size: 10px;
          color: #f0e6d2;
          font-weight: 600;
          min-width: 30px;
          text-align: right;

          @media (max-width: 768px) {
            font-size: 9px;
            min-width: 25px;
          }
        }
      }
    }

    .conquered-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 12px;
      background: rgba(34, 197, 94, 0.2);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 768px) {
        font-size: 10px;
        width: 16px;
        height: 16px;
      }
    }

    .locked-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 12px;
      background: rgba(107, 114, 128, 0.2);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      border: 1px solid rgba(107, 114, 128, 0.3);

      @media (max-width: 768px) {
        font-size: 10px;
        width: 16px;
        height: 16px;
      }
    }
  }
}

// 区域选项卡样式
.region-tabs {
  margin-bottom: 12px;
  padding: 0 20px;

  @media (max-width: 768px) {
    padding: 0 8px;
    margin-bottom: 8px;
  }

  .tabs-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;

    @media (max-width: 768px) {
      gap: 6px;
      padding: 2px 0;
    }

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(5, 150, 105, 0.5);
      border-radius: 2px;

      &:hover {
        background: rgba(5, 150, 105, 0.7);
      }
    }
  }

  .region-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
    border: 1px solid rgba(5, 150, 105, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 160px;
    position: relative;
    overflow: hidden;

    @media (max-width: 768px) {
      min-width: 150px;
      padding: 6px 8px;
      gap: 6px;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      border-color: rgba(5, 150, 105, 0.6);
    }

    &.active {
      background: linear-gradient(180deg, #059669, #047857);
      border-color: rgba(5, 150, 105, 0.8);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);

      .tab-name {
        color: #ffffff;
        font-weight: 700;
      }

      .progress-fill {
        background: rgba(255, 255, 255, 0.8);
      }
    }

    &.conquered {
      border-color: rgba(34, 197, 94, 0.6);
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.2));

      .tab-name {
        color: #22c55e;
      }
    }

    &.locked {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(0, 0, 0, 0.3);
      border-color: rgba(107, 114, 128, 0.3);

      .tab-name {
        color: #6b7280;
      }

      .tab-icon {
        filter: grayscale(100%);
      }
    }

    .tab-icon {
      font-size: 18px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      flex-shrink: 0;

      @media (max-width: 768px) {
        font-size: 14px;
      }
    }

    .tab-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .tab-name {
        font-size: 11px;
        font-weight: 600;
        color: #f0e6d2;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 768px) {
          font-size: 9px;
        }
      }

      .tab-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;

        .progress-bar {
          flex: 1;
          height: 3px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 2px;
          overflow: hidden;

          &.unlock-progress {
            background: rgba(139, 69, 19, 0.3);
            border: 1px solid rgba(255, 215, 0, 0.3);
            height: 4px;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc2626, #b91c1c);
            border-radius: 2px;
            transition: width 0.3s ease;

            &.unlock-fill {
              background: linear-gradient(90deg, #ff8c00, #ffd700);
              box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
            }
          }
        }

        .progress-text {
          font-size: 9px;
          color: #f0e6d2;
          font-weight: 600;
          min-width: 25px;
          text-align: right;

          &.unlock-text-small {
            color: #ffd700;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            font-weight: 700;
          }

          @media (max-width: 768px) {
            font-size: 8px;
            min-width: 20px;
          }
        }
      }

      .capital-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        margin-top: 2px;
        padding: 2px 4px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        font-size: 9px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;

        @media (max-width: 768px) {
          gap: 2px;
          padding: 1px 3px;
          font-size: 7px;
          max-width: 100%;
        }

        .capital-icon {
          font-size: 9px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));

          @media (max-width: 768px) {
            font-size: 8px;
          }
        }

        .capital-name {
          color: #f0e6d2;
          font-weight: 500;
          opacity: 0.9;
          flex-shrink: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .capital-conquest {
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 2px;
          font-size: 8px;
          flex-shrink: 0;

          @media (max-width: 768px) {
            padding: 1px 2px;
            font-size: 6px;
          }

          &.conquered {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
          }

          &:not(.conquered) {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
          }
        }
      }
    }

    .conquered-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 10px;
      background: rgba(34, 197, 94, 0.2);
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 768px) {
        font-size: 8px;
        width: 12px;
        height: 12px;
      }
    }
  }
}
</style>
