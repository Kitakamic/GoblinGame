<template>
  <div class="explore-container">
    <div class="explore-header">
      <h1 class="explore-title">🗺️ 探索模式</h1>
      <div class="header-right">
        <div class="explore-stats">
          <div class="stat-item">
            <span class="icon">💰</span>
            <span class="value">{{ formatNumber(modularSaveManager.resources.value.gold) }}</span>
          </div>
          <div class="stat-item">
            <span class="icon">🍖</span>
            <span class="value">{{ formatNumber(modularSaveManager.resources.value.food) }}</span>
          </div>
        </div>
        <button
          class="scout-team-button"
          :disabled="isGenerating"
          style="
            background: linear-gradient(180deg, #3b82f6, #2563eb) !important;
            border: 1px solid rgba(59, 130, 246, 0.6) !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            font-size: 12px !important;
            border-radius: 4px !important;
            padding: 4px 8px !important;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
            transition: all 0.2s ease !important;
          "
          @click="showScoutTeamModal = true"
          @mouseover="($event.target as HTMLElement).style.background = 'linear-gradient(180deg, #2563eb, #1d4ed8)'"
          @mouseout="($event.target as HTMLElement).style.background = 'linear-gradient(180deg, #3b82f6, #2563eb)'"
        >
          <span class="icon" style="font-size: 14px !important">🔍</span>
          <span>{{ isGenerating ? '侦察中...' : '派出侦察队' }}</span>
        </button>
      </div>
    </div>

    <!-- 大陆选项卡 -->
    <div class="continent-tabs">
      <div class="tabs-container">
        <button
          v-for="continent in allContinents"
          :key="continent.name"
          class="continent-tab"
          :class="{
            active: selectedContinent === continent.name,
            conquered: continent.isConquered,
            locked: !continent.isUnlocked,
          }"
          :disabled="!continent.isUnlocked"
          @click="selectContinent(continent.name)"
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
    <div v-if="unlockedRegions.length > 0 && currentContinent?.isUnlocked" class="region-tabs">
      <div class="tabs-container">
        <button
          v-for="region in unlockedRegions"
          :key="region.name"
          class="region-tab"
          :class="{
            active: selectedRegion === region.name,
            conquered: region.isConquered,
            locked: !region.isUnlocked,
          }"
          :disabled="!region.isUnlocked"
          @click="selectRegion(region.name)"
        >
          <div class="tab-icon">{{ region.icon }}</div>
          <div class="tab-content">
            <div class="tab-name">{{ region.name }}</div>
            <div class="tab-progress">
              <div class="progress-bar" :class="{ 'unlock-progress': !region.isUnlocked && region.unlockStars > 0 }">
                <div
                  class="progress-fill"
                  :class="{ 'unlock-fill': !region.isUnlocked && region.unlockStars > 0 }"
                  :style="{
                    width: `${
                      !region.isUnlocked && region.unlockStars > 0
                        ? Math.min(100, (currentContinentConqueredStars / region.unlockStars) * 100)
                        : region.conquestProgress
                    }%`,
                  }"
                ></div>
              </div>
              <span
                class="progress-text"
                :class="{ 'unlock-text-small': !region.isUnlocked && region.unlockStars > 0 }"
              >
                {{
                  !region.isUnlocked && region.unlockStars > 0
                    ? `${currentContinentConqueredStars}/${region.unlockStars}⭐`
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

    <!-- 探索界面 -->
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
              @click="selectedStatusFilter = filter.value"
            >
              <span>{{ filter.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 滚动容器 -->
      <div class="explore-scroll-container">
        <div class="explore-grid">
          <div v-for="location in filteredLocations" :key="location.id" class="explore-card">
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
                @click="scoutLocation(location)"
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
                @click="startBattle(location)"
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

    <!-- 战斗弹窗 -->
    <div v-if="showBattleModal" class="battle-modal-overlay">
      <div class="battle-modal">
        <div class="modal-header">
          <h3>⚔️ 战斗 - {{ selectedBattleTarget?.name }}</h3>
        </div>
        <div class="modal-content">
          <AdvancedBattleInterface
            :battle-data="battleData"
            :is-modal="true"
            @battle-complete="handleBattleComplete"
            @close-battle="closeBattleModal"
          />
        </div>
      </div>
    </div>

    <!-- 派出侦察队弹窗 -->
    <div v-if="showScoutTeamModal" class="scout-team-modal-overlay" @click="closeScoutTeamModal">
      <div class="scout-team-modal" @click.stop>
        <div class="modal-header">
          <h3>🔍 派出侦察队</h3>
          <button class="close-button" @click="closeScoutTeamModal">×</button>
        </div>

        <div class="modal-content">
          <div class="scout-options">
            <div class="option-group">
              <label>据点数量：</label>
              <select v-model="scoutCount" class="scout-count-select">
                <option value="1">1个据点</option>
                <option value="2">2个据点</option>
                <option value="3">3个据点</option>
              </select>
            </div>

            <div class="option-group">
              <label>侦察方向：</label>
              <select v-model="selectedLocationType">
                <option v-for="locType in availableLocationTypes" :key="locType.value" :value="locType.value">
                  {{ locType.label }}
                </option>
              </select>
            </div>

            <div class="option-group">
              <label>侦察指令：</label>
              <div class="scout-location-info">
                <div class="location-display">
                  <span class="location-label">当前探索位置：</span>
                  <span class="location-value"
                    >{{ currentContinent?.name || '未知大陆' }} - {{ currentRegion?.name || '未知区域' }}</span
                  >
                </div>
                <div class="location-description">
                  <span class="description-text">{{ currentRegion?.description || '暂无描述' }}</span>
                </div>
              </div>
              <textarea v-model="customPrompt" placeholder="可选：给侦察队下达特殊指令..." rows="3"></textarea>
            </div>
          </div>

          <div v-if="scoutResult" class="scout-result">
            <h4>侦察结果：</h4>
            <div v-if="scoutResult.success" class="success-message">
              <p>✅ 侦察队成功发现 {{ scoutResult.totalAdded || 1 }} 个目标！</p>
              <div v-if="scoutResult.locations && scoutResult.locations.length > 0" class="discovered-locations">
                <h5>发现的目标：</h5>
                <ul>
                  <li v-for="location in scoutResult.locations" :key="location.id" class="location-item">
                    {{ location.icon }} {{ location.name }} ({{ getDifficultyText(location.difficulty) }},
                    {{ location.distance }}km)
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="error-message">
              <p>❌ 侦察失败：{{ scoutResult.error }}</p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-button" @click="closeScoutTeamModal">取消</button>
          <button class="scout-button" :disabled="isGenerating" @click="sendScoutTeam">
            {{ isGenerating ? '侦察中...' : '派出侦察队' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 统一的侦察状态弹窗 -->
    <div v-if="showScoutingModal" class="scouting-modal-overlay">
      <div class="scouting-modal" @click.stop>
        <!-- 加载中状态 -->
        <template v-if="scoutingModalState === 'loading'">
          <div class="modal-header">
            <h3>🔍 侦察中</h3>
            <button class="modal-close-button" title="关闭" @click="handleScoutingModalClose">✕</button>
          </div>
          <div class="modal-content">
            <div class="loading-icon">
              <div class="spinner"></div>
            </div>
            <div class="loading-message">{{ scoutingLoadingMessage }}</div>
            <div class="loading-hint">请稍候，正在生成英雄信息...</div>
          </div>
        </template>

        <!-- 生成失败状态 -->
        <template v-else-if="scoutingModalState === 'failure' && scoutingFailureData">
          <div class="modal-header">
            <h3>⚠️ AI英雄生成失败</h3>
          </div>
          <div class="modal-content">
            <div class="message">据点 "{{ scoutingFailureData.location.name }}" 的AI英雄生成失败。</div>
            <div class="details">
              您可以选择：<br />
              1. 放弃英雄，直接进攻该据点（无英雄奖励）<br />
              2. 重新侦察，尝试再次生成英雄（退还 {{ scoutingFailureData.originalCost.gold }} 金币和
              {{ scoutingFailureData.originalCost.food }}
              食物）
            </div>
          </div>
          <div class="modal-actions">
            <button class="retry-button" @click="handleScoutingModalRetry">🔄 重新侦察</button>
            <button class="abandon-button" @click="handleScoutingModalAbandon">⚔️ 放弃英雄，直接进攻</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AdvancedBattleInterface from '../功能模块层/战斗/视图/高级战斗界面.vue';
import { AILocationGenerationService } from '../功能模块层/探索/服务/AI据点生成服务';
import { continentExploreService } from '../功能模块层/探索/服务/大陆探索服务';
import { exploreService } from '../功能模块层/探索/服务/探索服务';
import type { Location } from '../功能模块层/探索/类型/探索类型';
import { WorldbookService } from '../核心层/服务/世界书管理/服务/世界书服务';
import { modularSaveManager } from '../核心层/服务/存档系统/模块化存档服务';
import { toastService } from '../核心层/服务/通用服务/弹窗提示服务';
import { TimeParseService } from '../核心层/服务/通用服务/时间解析服务';
import { ConfirmService } from '../核心层/服务/通用服务/确认框服务';
import { actionPointsService } from '../核心层/服务/通用服务/行动力服务';

// 响应式数据
const showBattleModal = ref(false);
const selectedBattleTarget = ref<Location | null>(null);
const battleData = ref<any>(null);

// 大陆相关
// 默认值会在组件挂载时从探索状态恢复，如果没有保存的状态则使用这些默认值
const selectedContinent = ref<string>('古拉尔大陆'); // 默认选择古拉尔大陆
const selectedRegion = ref<string>('巢穴附近'); // 默认选择古拉尔中心区域

// 侦察队相关
const showScoutTeamModal = ref(false);
const isGenerating = ref(false);
const scoutCount = ref(1);
const selectedLocationType = ref('');
const customPrompt = ref('');
const scoutResult = ref<any>(null);

// 侦察状态管理
const scoutingLocations = ref<Set<string>>(new Set());
const scoutingAnimation = ref<Set<string>>(new Set());

// 统一的侦察状态弹窗
const showScoutingModal = ref(false);
const scoutingModalState = ref<'loading' | 'failure'>('loading');
const scoutingLoadingMessage = ref('正在侦察中...');
const scoutingFailureData = ref<{ location: Location; originalCost: { gold: number; food: number } } | null>(null);
const currentScoutingLocation = ref<Location | null>(null); // 当前正在侦察的据点
const scoutLocationAbortController = ref<AbortController | null>(null); // 用于取消侦察的控制器

// 据点状态筛选
const selectedStatusFilter = ref('all');
const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'scouted', label: '已侦察' },
  { value: 'conquered', label: '已征服' },
  { value: 'hide-conquered', label: '可操作' },
];

// 加载侦察状态
const loadScoutingState = async () => {
  try {
    // 从数据库加载侦察状态
    const explorationData = modularSaveManager.getModuleData({ moduleName: 'exploration' });

    if (explorationData) {
      if ((explorationData as any).scoutingLocations) {
        scoutingLocations.value = new Set((explorationData as any).scoutingLocations);
      }
      if ((explorationData as any).scoutingAnimation) {
        scoutingAnimation.value = new Set((explorationData as any).scoutingAnimation);
      }
    }
  } catch (error) {
    console.error('加载侦察状态失败:', error);
  }
};

// 侦察状态现在由探索服务统一管理，不需要单独保存

// 数字格式化方法
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

// 大陆相关计算属性
const allContinents = computed(() => {
  // 显示所有大陆，包括未解锁的（类似区域的处理方式）
  return continentExploreService.continents.value;
});

const currentContinent = computed(() => {
  return continentExploreService.continents.value.find(c => c.name === selectedContinent.value);
});

// 区域相关计算属性
const currentContinentRegions = computed(() => {
  const continent = continentExploreService.continents.value.find(c => c.name === selectedContinent.value);
  return continent?.regions || [];
});

const unlockedRegions = computed(() => {
  // 显示所有区域，包括未解锁的（用于开发调试）
  return currentContinentRegions.value;
});

const currentRegion = computed(() => {
  return currentContinentRegions.value.find(r => r.name === selectedRegion.value);
});

// 计算当前大陆已征服的总星级
const currentContinentConqueredStars = computed(() => {
  if (!selectedContinent.value) return 0;

  const locations = exploreService.getAllLocations();
  const conqueredLocations = locations.filter(
    loc => loc.continent === selectedContinent.value && loc.status === 'conquered',
  );

  return conqueredLocations.reduce((total, loc) => total + (loc.difficulty || 0), 0);
});

// 根据当前大陆生成可用的据点类型选项
const availableLocationTypes = computed(() => {
  // 通用据点类型（所有大陆都可使用）
  const commonTypes = [
    { value: '', label: '随机探索' },
    { value: 'village', label: '村庄' },
    { value: 'town', label: '城镇' },
    { value: 'city', label: '城市' },
    { value: 'ruins', label: '遗迹' },
    { value: 'trade_caravan', label: '贸易商队' },
    { value: 'adventurer_party', label: '冒险者小队' },
  ];

  // 根据当前大陆添加专属据点类型
  const continentSpecificTypes: Record<string, { value: string; label: string }[]> = {
    古拉尔大陆: [
      { value: 'exile_outpost', label: '流放者据点' },
      { value: 'bandit_camp', label: '盗匪营地' },
      { value: 'elven_forest', label: '精灵森林' },
      { value: 'fox_colony', label: '狐族殖民地' },
    ],
    瓦尔基里大陆: [
      { value: 'dark_spire', label: '巢都尖塔' },
      { value: 'slave_camp', label: '奴隶营地' },
      { value: 'dark_fortress', label: '黑暗要塞' },
      { value: 'obsidian_mine', label: '黑曜石矿场' },
      { value: 'raid_dock', label: '劫掠舰码头' },
    ],
    香草群岛: [
      { value: 'fox_water_town', label: '狐族水乡' },
      { value: 'shrine', label: '神社' },
      { value: 'trading_port', label: '贸易港口' },
      { value: 'warship_dock', label: '军舰泊地' },
      { value: 'spice_plantation', label: '香料种植园' },
    ],
    赛菲亚大陆: [
      { value: 'imperial_city', label: '帝国城市' },
      { value: 'noble_estate', label: '贵族庄园' },
      { value: 'mining_district', label: '矿业区域' },
      { value: 'border_fortress', label: '边境要塞' },
      { value: 'cathedral', label: '教堂' },
      { value: 'academy', label: '学院' },
    ],
    世界树圣域: [
      { value: 'tree_city', label: '树城' },
      { value: 'elven_temple', label: '精灵圣殿' },
      { value: 'guardian_outpost', label: '守卫哨所' },
      { value: 'canopy_palace', label: '树冠宫殿' },
    ],
  };

  const specificTypes = continentSpecificTypes[selectedContinent.value] || [];
  return [...commonTypes, ...specificTypes];
});

// 所有目标据点（合并侦察和进攻）
const allTargetLocations = computed(() => {
  return exploreService.getAllLocations();
});

// 根据大陆、区域和筛选条件过滤据点
const filteredLocations = computed(() => {
  let locations = allTargetLocations.value;

  // 首先按大陆筛选
  if (selectedContinent.value) {
    locations = locations.filter(location => location.continent === selectedContinent.value);
  }

  // 然后按区域筛选
  if (selectedRegion.value) {
    const currentRegionData = currentRegion.value;
    if (currentRegionData) {
      locations = locations.filter(location => location.region === currentRegionData.name);
    }
  }

  // 然后按状态筛选
  switch (selectedStatusFilter.value) {
    case 'scouted':
      return locations.filter(location => location.status === 'scouted');
    case 'conquered':
      return locations.filter(location => location.status === 'conquered');
    case 'hide-conquered':
      return locations.filter(location => location.status !== 'conquered');
    case 'all':
    default:
      return locations;
  }
});

// 方法

// 选择大陆
const selectContinent = (continentName: string) => {
  selectedContinent.value = continentName;
  // 切换大陆时，选择该大陆的第一个解锁区域
  // 注意：切换大陆时不再尝试恢复之前选择的区域，因为区域是绑定到特定大陆的
  const regions = currentContinentRegions.value;
  const firstUnlockedRegion = regions.find(r => r.isUnlocked);

  if (firstUnlockedRegion) {
    selectedRegion.value = firstUnlockedRegion.name;
  } else {
    // 如果该大陆没有解锁的区域，清空区域选择
    selectedRegion.value = '';
  }

  // 保存选择状态
  saveSelectionState();
  console.log(`切换到大陆: ${continentName}, 区域: ${selectedRegion.value}`);
};

// 选择区域
const selectRegion = (regionName: string) => {
  selectedRegion.value = regionName;
  // 保存选择状态
  saveSelectionState();
  console.log(`切换到区域: ${regionName}`);
};

// 保存选择状态到探索状态
const saveSelectionState = () => {
  continentExploreService.exploreState.value.selectedContinent = selectedContinent.value;
  continentExploreService.exploreState.value.selectedRegion = selectedRegion.value;
  // 自动保存（通过 watcher）
};

const getStatusText = (location: Location) => {
  // 如果正在侦察中，显示侦察中状态
  if (scoutingLocations.value.has(location.id)) {
    return '侦察中';
  }

  const statusMap = {
    unknown: '未知',
    scouted: '已侦察',
    attacked: '已攻击',
    conquered: '已征服',
  };
  return statusMap[location.status as keyof typeof statusMap] || '未知';
};

const getStatusClass = (location: Location) => {
  // 如果正在侦察中，使用侦察中的样式
  if (scoutingLocations.value.has(location.id)) {
    return 'scouting';
  }

  return location.status;
};

const getDifficultyText = (difficulty: number) => {
  // 只显示实心星星表示难度
  return '★'.repeat(difficulty);
};

// 计算侦察成本显示 - 直接使用探索服务的方法
const getScoutCost = (difficulty: number, distance?: number): string => {
  const cost = exploreService.calculateScoutCost(difficulty, distance);
  return `💰${cost.gold} 🍖${cost.food}`;
};

// 获取据点的实际敌方部队总数
const getTotalEnemyTroops = (location: Location): number => {
  // 如果据点已有敌方单位数据，计算实际总数
  if (location.enemyUnits && location.enemyUnits.length > 0) {
    return location.enemyUnits.reduce((total, unit) => total + unit.troopCount, 0);
  }

  // 如果没有敌方单位数据，返回基础守军数量
  return location.baseGuards || 0;
};

// 检查据点是否为区域首都
const isLocationCapital = (location: Location): boolean => {
  const region = currentRegion.value;
  if (!region) return false;
  return region.capital === location.name;
};

const scoutLocation = async (location: Location) => {
  try {
    // 检查行动力
    if (!actionPointsService.hasEnoughActionPoints('scoutLocation')) {
      await ConfirmService.showWarning(
        actionPointsService.getInsufficientActionPointsMessage('scoutLocation'),
        '行动力不足',
        '请等待下回合恢复行动力或征服更多区域增加上限',
      );
      return;
    }

    // 消耗行动力
    if (!actionPointsService.consumeActionPoints('scoutLocation')) {
      await ConfirmService.showDanger('行动力消耗失败', '操作失败');
      return;
    }

    // 开始侦察，添加到侦察中状态
    scoutingLocations.value.add(location.id);
    scoutingAnimation.value.add(location.id);

    // 检查据点是否需要AI生成英雄
    const needsAIHero = (location as any).needsAIHero || location.description.includes('[AI_HERO_GENERATE]');

    // 如果需要生成英雄，显示加载弹窗
    if (needsAIHero) {
      scoutingLoadingMessage.value = `发现英雄！正在生成 "${location.name}" 的英雄信息...`;
      scoutingModalState.value = 'loading';
      showScoutingModal.value = true;
      currentScoutingLocation.value = location; // 记录当前正在侦察的据点
      scoutLocationAbortController.value = new AbortController(); // 创建取消控制器
    }

    const result = await exploreService.scoutLocation(location.id);

    // 检查是否需要用户决策（AI生成失败）
    // 无论是因为解析错误还是其他错误，都会返回 needsUserDecision
    // 解析错误时，用户会先看到 GenerationErrorService 的错误弹窗（可以编辑和重新解析）
    // 关闭错误弹窗后，会统一显示 scoutingModal 的失败状态，让用户选择放弃或重新侦察
    if (result.needsUserDecision && result.aiFailureData) {
      // 移除侦察状态
      scoutingLocations.value.delete(location.id);
      scoutingAnimation.value.delete(location.id);

      // 返还行动力（AI生成失败）
      actionPointsService.refundActionPoints('scoutLocation');

      // 切换弹窗状态为失败模式
      // 注意：如果用户刚才在 GenerationErrorService 的错误弹窗中已经关闭了弹窗，
      // 现在会显示 scoutingModal 的失败状态，让用户选择放弃英雄或重新侦察
      scoutingModalState.value = 'failure';
      scoutingFailureData.value = {
        location: result.aiFailureData.location,
        originalCost: result.aiFailureData.originalCost,
      };
      currentScoutingLocation.value = null; // 清除当前侦察据点（因为已经失败）
      scoutLocationAbortController.value = null; // 清除取消控制器
      // 弹窗继续显示，不关闭
      return;
    }

    // 隐藏加载弹窗
    showScoutingModal.value = false;
    currentScoutingLocation.value = null; // 清除当前侦察据点
    scoutLocationAbortController.value = null; // 清除取消控制器

    // 等待一小段时间确保UI更新，然后移除侦察状态
    await new Promise(resolve => setTimeout(resolve, 500));
    scoutingLocations.value.delete(location.id);
    scoutingAnimation.value.delete(location.id);

    // 侦察成功，显示结果
    if (!result.error) {
      toastService.success(`据点 "${location.name}" 侦察成功！据点信息已更新`, {
        title: '侦察完成',
        duration: 3000,
      });
    } else {
      // 侦察失败，返还行动力
      actionPointsService.refundActionPoints('scoutLocation');
      await ConfirmService.showDanger(
        `据点 "${location.name}" 侦察失败`,
        '侦察失败',
        result.error || '侦察队未能获取有效信息',
      );
    }
  } catch (error) {
    // 隐藏加载弹窗
    showScoutingModal.value = false;
    currentScoutingLocation.value = null; // 清除当前侦察据点
    scoutLocationAbortController.value = null; // 清除取消控制器

    // 侦察失败，移除侦察状态并显示错误信息
    scoutingLocations.value.delete(location.id);
    scoutingAnimation.value.delete(location.id);

    // 返还行动力（发生错误）
    actionPointsService.refundActionPoints('scoutLocation');

    await ConfirmService.showDanger(`侦察失败：${error}`, '侦察失败', '请检查资源是否充足');
  }
};

// 处理侦察弹窗 - 放弃英雄并进攻
const handleScoutingModalAbandon = async () => {
  if (!scoutingFailureData.value) return;

  const { location, originalCost } = scoutingFailureData.value;

  try {
    const success = await exploreService.handleAbandonHeroAndAttack(location.id, originalCost);
    if (success) {
      showScoutingModal.value = false;
      scoutingFailureData.value = null;
      currentScoutingLocation.value = null;

      await ConfirmService.showSuccess(
        `据点 "${location.name}" 已设置为可直接进攻状态`,
        '设置成功',
        '该据点将不包含英雄奖励，但可以立即进攻',
      );
    } else {
      await ConfirmService.showDanger('设置失败，请重试或联系管理员', '操作失败');
    }
  } catch (error) {
    console.error('处理放弃英雄失败:', error);
    await ConfirmService.showDanger(`错误信息: ${error}`, '操作失败');
  }
};

// 处理侦察弹窗 - 重新侦察
const handleScoutingModalRetry = async () => {
  if (!scoutingFailureData.value) return;

  const { location, originalCost } = scoutingFailureData.value;

  try {
    const success = await exploreService.handleRetryScout(location.id, originalCost);
    if (success) {
      showScoutingModal.value = false;
      scoutingFailureData.value = null;
      currentScoutingLocation.value = null;

      await ConfirmService.showInfo(
        `已退还侦察成本：${originalCost.gold} 金币和 ${originalCost.food} 食物`,
        '重新侦察',
        `据点 "${location.name}" 已重置为未侦察状态，您可以重新尝试侦察`,
      );
    } else {
      await ConfirmService.showDanger('退还失败，请重试或联系管理员', '操作失败');
    }
  } catch (error) {
    console.error('处理重新侦察失败:', error);
    await ConfirmService.showDanger(`错误信息: ${error}`, '操作失败');
  }
};

// 处理侦察弹窗 - 关闭（仅在加载状态时可用）
const handleScoutingModalClose = async () => {
  // 只在加载状态时允许关闭
  if (scoutingModalState.value !== 'loading') {
    return;
  }

  // 弹出确认框
  const confirmed = await ConfirmService.showWarning(
    '是否放弃此次生成？',
    '确认关闭',
    '如果放弃，侦察将取消，并尝试停止AI生成和返还资源。',
  );

  if (!confirmed) {
    return; // 用户取消，不关闭弹窗
  }

  // 用户确认放弃，执行取消操作
  try {
    // 尝试停止所有正在进行的AI生成
    try {
      await stopAllGeneration();
      console.log('已尝试停止正在进行的AI生成操作');
    } catch (error) {
      console.error('停止AI生成失败:', error);
      // 即使停止失败，也继续执行其他取消操作
    }

    // 取消侦察并清理状态
    if (currentScoutingLocation.value) {
      const location = currentScoutingLocation.value;

      // 计算侦察成本（用于返还资源）
      const cost = exploreService.calculateScoutCost(location.difficulty, location.distance);

      // 移除侦察状态
      scoutingLocations.value.delete(location.id);
      scoutingAnimation.value.delete(location.id);

      // 关闭弹窗
      showScoutingModal.value = false;
      currentScoutingLocation.value = null;
      scoutLocationAbortController.value = null;

      // 返还行动力
      actionPointsService.refundActionPoints('scoutLocation');

      // 尝试返还资源（金币和食物）
      try {
        modularSaveManager.addResource('gold', cost.gold, `侦察取消退还金币`);
        modularSaveManager.addResource('food', cost.food, `侦察取消退还食物`);
        console.log(`已退还侦察成本: ${cost.gold} 金币, ${cost.food} 食物`);

        await ConfirmService.showInfo(
          `侦察已取消`,
          '操作完成',
          `据点 "${location.name}" 的侦察已取消。\n已返还行动力、金币和食物。`,
        );
      } catch (resourceError) {
        console.error('返还资源失败:', resourceError);
        // 如果返还资源失败，至少返还行动力成功
        await ConfirmService.showWarning(
          `侦察已取消`,
          '操作完成',
          `据点 "${location.name}" 的侦察已取消，行动力已返还。\n但资源返还可能失败，请检查资源状态。`,
        );
      }
    } else {
      // 如果没有当前侦察据点，直接关闭弹窗
      showScoutingModal.value = false;
      currentScoutingLocation.value = null;
      scoutLocationAbortController.value = null;
    }
  } catch (error) {
    console.error('取消侦察失败:', error);
    await ConfirmService.showDanger(`错误信息: ${error}`, '操作失败');
  }
};

const startBattle = async (location: Location) => {
  console.log('=== 探索界面开始战斗检查 ===');
  console.log('当前行动力:', modularSaveManager.resources.value.actionPoints);
  console.log('最大行动力:', modularSaveManager.resources.value.maxActionPoints);

  // 检查行动力
  if (!actionPointsService.hasEnoughActionPoints('attackLocation')) {
    console.log('行动力不足，阻止战斗');
    await ConfirmService.showWarning(
      actionPointsService.getInsufficientActionPointsMessage('attackLocation'),
      '行动力不足',
      '请等待下回合恢复行动力或征服更多区域增加上限',
    );
    return;
  }

  console.log('行动力检查通过，继续检查部队编制');

  // 检查是否有部队编制数据
  const { FormationService } = await import('../功能模块层/战斗/服务/部队编制服务');
  const hasFormation = FormationService.hasFormationData();
  console.log('探索界面部队编制检查结果:', hasFormation);

  if (!hasFormation) {
    console.log('没有部队编制数据，显示警告');
    await ConfirmService.showWarning(
      '请先进行部队编制！',
      '无法开始战斗',
      '没有编制部队无法参与战斗，请前往部队编制界面进行编制。',
    );
    return;
  }

  // 消耗行动力（在打开战斗弹窗之前消耗）
  if (!actionPointsService.consumeActionPoints('attackLocation')) {
    console.log('行动力消耗失败');
    await ConfirmService.showDanger('行动力消耗失败', '操作失败');
    return;
  }

  console.log('行动力已消耗，准备战斗数据');

  selectedBattleTarget.value = location;

  // 获取据点的敌方单位
  const enemyUnits = exploreService.getLocationEnemyUnits(location.id, 1);
  console.log('据点敌方单位:', enemyUnits);

  // 准备战斗数据
  battleData.value = {
    target: location,
    enemyForces: {
      guards: getTotalEnemyTroops(location), // 使用实际部队总数
      name: location.name,
      type: location.type,
      difficulty: location.difficulty,
      units: enemyUnits, // 添加敌方单位数据
    },
  };

  showBattleModal.value = true;

  // 不再锁定界面，允许自由切换
  console.log('所有检查通过，开始战斗');
};

const closeBattleModal = () => {
  showBattleModal.value = false;
  selectedBattleTarget.value = null;
  battleData.value = null;
};

const handleBattleComplete = async (result: any) => {
  console.log('战斗完成:', result);
  // 处理战斗结果
  if (result.victory) {
    // 通过探索服务更新据点状态（这会触发威胁度增加）
    const locationId = selectedBattleTarget.value?.id;
    if (locationId) {
      await exploreService.updateLocationStatus(locationId, 'conquered');
      console.log('据点状态已更新为已征服，威胁度已增加');

      // 重新计算所有区域和大陆的征服进度
      continentExploreService.recalculateAllRegionProgress();
      console.log('征服进度已重新计算');

      // 添加据点征服记录到世界书
      try {
        const location = selectedBattleTarget.value;
        if (location) {
          // 获取当前游戏时间（格式化日期）
          const currentRounds = modularSaveManager.resources.value.rounds || 0;
          const gameTime = TimeParseService.getTimeInfo(currentRounds).formattedDate;

          // 获取区域描述
          const currentContinentData = continentExploreService.continents.value.find(
            c => c.name === location.continent,
          );
          const currentRegionData = currentContinentData?.regions.find(r => r.name === location.region);
          const regionDescription = currentRegionData?.description;

          await WorldbookService.addConquestRecord(location, result, gameTime, regionDescription);
          console.log('据点征服记录已添加到世界书');
        }
      } catch (error) {
        console.error('添加据点征服记录失败:', error);
        // 不影响主要流程，只记录错误
      }
    }
  }

  // 更新资源世界书（无论胜利还是失败，都要更新哥布林损失和大陆征服进度）
  try {
    console.log('🔍 [探索界面] 战斗完成后更新资源世界书...');
    const currentResources = {
      gold: modularSaveManager.resources.value.gold || 0,
      food: modularSaveManager.resources.value.food || 0,
      slaves: modularSaveManager.resources.value.slaves || 0,
      normalGoblins: modularSaveManager.resources.value.normalGoblins || 0,
      warriorGoblins: modularSaveManager.resources.value.warriorGoblins || 0,
      shamanGoblins: modularSaveManager.resources.value.shamanGoblins || 0,
      paladinGoblins: modularSaveManager.resources.value.paladinGoblins || 0,
      trainingSlaves: modularSaveManager.resources.value.trainingSlaves || 0,
      rounds: modularSaveManager.resources.value.rounds || 0,
      threat: modularSaveManager.resources.value.threat || 0,
      actionPoints: modularSaveManager.resources.value.actionPoints || 3,
      maxActionPoints: modularSaveManager.resources.value.maxActionPoints || 3,
      conqueredRegions: modularSaveManager.resources.value.conqueredRegions || 0,
    };

    // 获取大陆数据
    const continents = continentExploreService.continents.value || [];
    console.log('🔍 [探索界面] 战斗完成后获取到的大陆数据:', continents);

    await WorldbookService.updateResourcesWorldbook(currentResources, continents);
    console.log('🔍 [探索界面] 战斗完成后资源世界书更新完成');
  } catch (error) {
    console.error('战斗完成后更新资源世界书失败:', error);
  }

  // 不自动关闭界面，让用户通过撤退按钮或开始收获按钮来关闭
  console.log('战斗完成，等待用户操作');
};

// 侦察队相关方法
const closeScoutTeamModal = async () => {
  // 如果用户关闭弹窗时侦察操作还在进行中，停止生成并重置状态
  if (isGenerating.value) {
    try {
      // 停止所有正在进行的生成操作（放弃这次酒馆的回复）
      await stopAllGeneration();
      console.log('已停止正在进行的侦察队生成操作');
    } catch (error) {
      console.error('停止生成操作失败:', error);
    }

    // 重置生成状态
    isGenerating.value = false;
    // 返还行动力（因为操作被用户中断）
    actionPointsService.refundActionPoints('sendScoutTeam');
    console.warn('用户关闭侦察队弹窗时操作仍在进行中，已停止生成、重置状态并返还行动力');
  }

  showScoutTeamModal.value = false;
  scoutResult.value = null;
  customPrompt.value = '';
};

const sendScoutTeam = async () => {
  if (isGenerating.value) return;

  // 检查行动力
  if (!actionPointsService.hasEnoughActionPoints('sendScoutTeam')) {
    await ConfirmService.showWarning(
      actionPointsService.getInsufficientActionPointsMessage('sendScoutTeam'),
      '行动力不足',
      '请等待下回合恢复行动力或征服更多区域增加上限',
    );
    return;
  }

  // 消耗行动力
  if (!actionPointsService.consumeActionPoints('sendScoutTeam')) {
    await ConfirmService.showDanger('行动力消耗失败', '操作失败');
    return;
  }

  isGenerating.value = true;
  scoutResult.value = null;

  try {
    // 根据条件侦察
    const conditions: any = {};
    if (selectedLocationType.value) {
      conditions.type = selectedLocationType.value;
    }

    // 构建自定义指令（如果有的话）
    let customInstruction = '';
    if (customPrompt.value.trim()) {
      customInstruction = `\n\n***最高级指令：${customPrompt.value.trim()}***`;
    }

    const count = parseInt(scoutCount.value.toString());

    // 使用统一的据点生成方法，支持条件筛选
    const result = await AILocationGenerationService.generateLocations(
      count,
      customInstruction,
      selectedContinent.value,
      selectedRegion.value,
      Object.keys(conditions).length > 0 ? conditions : undefined,
    );

    scoutResult.value = result;

    if (result.success) {
      // 刷新据点列表
      // exploreService 会自动更新，这里不需要额外操作

      // 延迟关闭界面，让用户看到结果
      setTimeout(() => {
        closeScoutTeamModal();
      }, 1000);
    } else {
      // 侦察失败，返还行动力
      actionPointsService.refundActionPoints('sendScoutTeam');
    }
  } catch (error) {
    console.error('侦察队派出失败:', error);

    // 返还行动力（发生错误）
    actionPointsService.refundActionPoints('sendScoutTeam');

    scoutResult.value = {
      success: false,
      error: error instanceof Error ? error.message : '侦察失败',
    };
  } finally {
    isGenerating.value = false;
  }
};

// 处理据点状态更新事件
const handleLocationStatusUpdate = async (event: CustomEvent) => {
  console.log('收到据点状态更新事件:', event.detail);
  const { locationId, status } = event.detail;

  // 通过探索服务更新据点状态
  try {
    const success = await exploreService.updateLocationStatus(locationId, status);
    if (success) {
      console.log(`据点状态更新成功: ${locationId} -> ${status}`);
    } else {
      console.warn(`据点状态更新失败: ${locationId} -> ${status}`);
    }
  } catch (error) {
    console.error('更新据点状态失败:', error);
  }
};

// 检查并添加未加入世界书的人物
const checkAndAddMissingCharacters = async () => {
  try {
    console.log('🔍 [探索界面] 开始检查未加入世界书的人物...');

    // 获取所有据点
    const allLocations = exploreService.getAllLocations();
    console.log('🔍 [探索界面] 检查据点数量:', allLocations.length);

    let addedCount = 0;

    for (const location of allLocations) {
      // 检查据点的英雄人物
      if (location.rewards?.heroes && location.rewards.heroes.length > 0) {
        console.log(`🔍 [探索界面] 检查据点 ${location.name} 的英雄人物:`, location.rewards.heroes.length, '个');

        for (const hero of location.rewards.heroes) {
          // 只处理未捕获和敌人状态的人物
          if (hero.status === 'uncaptured' || hero.status === 'enemy') {
            console.log(`🔍 [探索界面] 检查英雄 ${hero.name} (状态: ${hero.status})`);

            try {
              // 检查是否已存在于世界书中
              const existingEntry = await WorldbookService.getCharacterEntry(hero.id);

              if (!existingEntry) {
                console.log(`📚 [探索界面] 英雄 ${hero.name} 未加入世界书，正在添加...`);
                await WorldbookService.createCharacterWorldbook(hero);
                addedCount++;
                console.log(`✅ [探索界面] 英雄 ${hero.name} 已加入世界书`);
              } else {
                console.log(`ℹ️ [探索界面] 英雄 ${hero.name} 已存在于世界书中`);
              }
            } catch (error) {
              console.error(`❌ [探索界面] 添加英雄 ${hero.name} 到世界书失败:`, error);
            }
          } else {
            console.log(`ℹ️ [探索界面] 跳过英雄 ${hero.name} (状态: ${hero.status})`);
          }
        }
      }
    }

    if (addedCount > 0) {
      console.log(`🎉 [探索界面] 检查完成，共添加了 ${addedCount} 个人物到世界书`);
    } else {
      console.log(`✅ [探索界面] 检查完成，所有人物都已加入世界书`);
    }
  } catch (error) {
    console.error('❌ [探索界面] 检查人物世界书状态失败:', error);
  }
};

onMounted(async () => {
  // 加载侦察状态
  await loadScoutingState();

  // 等待大陆数据加载完成后再恢复选择状态
  // 延迟执行，确保大陆数据已经初始化
  setTimeout(() => {
    restoreSelectionState();
  }, 100);

  // 检查并添加未加入世界书的人物
  await checkAndAddMissingCharacters();

  // 监听据点状态更新事件
  window.addEventListener('location-status-updated', handleLocationStatusUpdate as unknown as EventListener);

  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('location-status-updated', handleLocationStatusUpdate as unknown as EventListener);
  });
});

// 恢复选择状态
const restoreSelectionState = () => {
  const savedContinent = continentExploreService.exploreState.value.selectedContinent;
  const savedRegion = continentExploreService.exploreState.value.selectedRegion;

  // 恢复大陆选择
  if (savedContinent) {
    const continent = allContinents.value.find(c => c.name === savedContinent && c.isUnlocked);
    if (continent) {
      selectedContinent.value = savedContinent;
      console.log(`🔄 [探索界面] 恢复之前选择的大陆: ${savedContinent}`);
    } else {
      console.log(`⚠️ [探索界面] 保存的大陆 ${savedContinent} 不存在或未解锁，使用默认值`);
    }
  }

  // 恢复区域选择（需要确保大陆已选择且区域属于该大陆）
  if (savedRegion && selectedContinent.value) {
    const regions = currentContinentRegions.value;
    const region = regions.find(r => r.name === savedRegion && r.isUnlocked);
    if (region) {
      selectedRegion.value = savedRegion;
      console.log(`🔄 [探索界面] 恢复之前选择的区域: ${savedRegion}`);
    } else {
      // 如果保存的区域不存在，选择该大陆的第一个解锁区域
      const firstUnlockedRegion = regions.find(r => r.isUnlocked);
      if (firstUnlockedRegion) {
        selectedRegion.value = firstUnlockedRegion.name;
        console.log(
          `⚠️ [探索界面] 保存的区域 ${savedRegion} 不存在或未解锁，使用第一个解锁区域: ${firstUnlockedRegion.name}`,
        );
      }
    }
  } else if (selectedContinent.value) {
    // 如果没有保存的区域，选择当前大陆的第一个解锁区域
    const regions = currentContinentRegions.value;
    const firstUnlockedRegion = regions.find(r => r.isUnlocked);
    if (firstUnlockedRegion) {
      selectedRegion.value = firstUnlockedRegion.name;
    }
  }
};
</script>

<style scoped lang="scss">
.explore-container {
  height: 710px;
  padding: 20px;
  background: #1a1313;
  color: #f0e6d2;

  @media (max-width: 768px) {
    height: 100vh;
    padding: 8px;
  }
}

.explore-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 6px;

  @media (max-width: 768px) {
    flex-direction: row;
    gap: 8px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }

  .explore-title {
    margin: 0;
    font-size: 18px;
    color: #ffd7a1;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 768px) {
      flex-direction: row;
      gap: 6px;
      flex: 1;
      justify-content: flex-end;
    }
  }

  .explore-stats {
    display: flex;
    gap: 8px;

    @media (max-width: 768px) {
      gap: 4px;
      flex-wrap: nowrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 4px 8px;
      background: rgba(205, 133, 63, 0.1);
      border: 1px solid rgba(205, 133, 63, 0.2);
      border-radius: 4px;

      @media (max-width: 768px) {
        padding: 2px 4px;
        gap: 1px;
        min-width: 0;
        flex-shrink: 1;
      }

      .icon {
        font-size: 14px;

        @media (max-width: 768px) {
          font-size: 10px;
        }
      }

      .value {
        font-weight: 700;
        color: #ffe9d2;
        font-size: 12px;

        @media (max-width: 768px) {
          font-size: 9px;
        }
      }

      .label {
        font-size: 12px;
        opacity: 0.8;

        @media (max-width: 768px) {
          font-size: 10px;
        }
      }
    }
  }
}

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

// 筛选器样式
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

.explore-content {
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

              // 星级难度样式
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

            // 据点卡片状态样式
            &.status-conquered {
              border-left: 3px solid #22c55e;
              background: rgba(34, 197, 94, 0.05);

              .location-header {
                .location-name {
                  color: #22c55e;
                }
              }

              .location-info {
                .status-badge {
                  background: rgba(34, 197, 94, 0.2);
                  color: #22c55e;
                }
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

.battle-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.battle-modal {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 16px;
  width: calc(100vw - 20px);
  height: calc(100vh - 20px);
  max-width: calc(100vw - 20px);
  max-height: calc(100vh - 20px);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  animation: modalSlideIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 手机端 - 完全覆盖 */
@media (max-width: 768px) {
  .battle-modal {
    width: calc(100vw - 10px);
    height: calc(100vh - 10px);
    border-radius: 8px;
    max-width: calc(100vw - 10px);
    max-height: calc(100vh - 10px);
  }

  .battle-modal .modal-content {
    height: calc(100% - 60px);
  }
}

/* 1080P - 留出更多边界 */
@media (min-width: 769px) and (max-width: 1920px) {
  .battle-modal {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
  }
}

/* 2K - 留出适中边界 */
@media (min-width: 1921px) and (max-width: 2560px) {
  .battle-modal {
    width: calc(100vw - 60px);
    height: calc(100vh - 60px);
    max-width: calc(100vw - 60px);
    max-height: calc(100vh - 60px);
  }
}

/* 4K - 留出较大边界 */
@media (min-width: 2561px) {
  .battle-modal {
    width: calc(100vw - 80px);
    height: calc(100vh - 80px);
    max-width: calc(100vw - 80px);
    max-height: calc(100vh - 80px);
  }
}

.battle-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  min-height: 60px;
}

.battle-modal .modal-header h3 {
  margin: 0;
  color: #ffd7a1;
  font-size: 20px;
  font-weight: 700;
}

/* 手机端头部优化 */
@media (max-width: 768px) {
  .battle-modal .modal-header {
    padding: 12px 16px;
    min-height: 50px;
  }

  .battle-modal .modal-header h3 {
    font-size: 16px;
  }
}

/* 高分辨率头部优化 */
@media (min-width: 1921px) {
  .battle-modal .modal-header {
    padding: 24px 32px;
    min-height: 70px;
  }

  .battle-modal .modal-header h3 {
    font-size: 24px;
  }
}

.battle-modal .close-button {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.battle-modal .close-button:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.battle-modal .modal-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保flex子元素可以收缩 */
}

/* 手机端内容区域优化 */
@media (max-width: 768px) {
  .battle-modal .modal-content {
    height: calc(100vh - 50px - 10px); /* 减去头部高度和边界 */
  }
}

/* 高分辨率内容区域优化 */
@media (min-width: 1921px) {
  .battle-modal .modal-content {
    height: calc(100vh - 70px - 60px); /* 减去头部高度和边界 */
  }
}

.attack-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .attack-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 1px solid rgba(205, 133, 63, 0.3);
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(205, 133, 63, 0.2);

      h3 {
        margin: 0;
        color: #ffd7a1;
      }

      .close-button {
        background: none;
        border: none;
        color: #f0e6d2;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(205, 133, 63, 0.2);
        }
      }
    }

    .modal-content {
      .target-info,
      .goblin-selection,
      .attack-preview {
        margin-bottom: 20px;
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;

        h4 {
          margin: 0 0 12px 0;
          color: #ffd7a1;
        }

        .info-item,
        .preview-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;

          .label {
            color: #f0e6d2;
            opacity: 0.8;
          }

          .value {
            color: #ffe9d2;
            font-weight: 600;

            &.success {
              color: #22c55e;
            }

            &.loss {
              color: #ef4444;
            }
          }
        }
      }

      .goblin-sliders {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .slider-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .goblin-type {
              color: #f0e6d2;
              font-size: 14px;
              font-weight: 600;
            }

            .goblin-count {
              color: #ffd7a1;
              font-size: 12px;
              font-weight: 600;
              background: rgba(205, 133, 63, 0.2);
              padding: 2px 6px;
              border-radius: 3px;
            }
          }

          .slider-container {
            position: relative;
            padding: 4px 0;

            .goblin-slider {
              width: 100%;
              height: 6px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 3px;
              outline: none;
              cursor: pointer;
              appearance: none;
              -webkit-appearance: none;

              &::-webkit-slider-thumb {
                appearance: none;
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: linear-gradient(180deg, #cd853f, #b8860b);
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;

                &:hover {
                  transform: scale(1.1);
                  box-shadow: 0 4px 12px rgba(205, 133, 63, 0.4);
                }
              }

              &::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: linear-gradient(180deg, #cd853f, #b8860b);
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;

                &:hover {
                  transform: scale(1.1);
                  box-shadow: 0 4px 12px rgba(205, 133, 63, 0.4);
                }
              }

              &::-webkit-slider-track {
                background: linear-gradient(
                  90deg,
                  rgba(205, 133, 63, 0.3) 0%,
                  rgba(205, 133, 63, 0.6) 50%,
                  rgba(205, 133, 63, 0.3) 100%
                );
                border-radius: 4px;
                height: 8px;
              }

              &::-moz-range-track {
                background: linear-gradient(
                  90deg,
                  rgba(205, 133, 63, 0.3) 0%,
                  rgba(205, 133, 63, 0.6) 50%,
                  rgba(205, 133, 63, 0.3) 100%
                );
                border-radius: 4px;
                height: 8px;
                border: none;
              }
            }
          }
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(205, 133, 63, 0.2);

      .cancel-button,
      .confirm-button {
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
      }

      .cancel-button {
        background: rgba(107, 114, 128, 0.2);
        border: 1px solid rgba(107, 114, 128, 0.3);
        color: #9ca3af;

        &:hover {
          background: rgba(107, 114, 128, 0.3);
        }
      }

      .confirm-button {
        background: linear-gradient(180deg, #dc2626, #b91c1c);
        border: 1px solid rgba(220, 38, 38, 0.6);
        color: #ffffff;

        &:hover:not(:disabled) {
          background: linear-gradient(180deg, #b91c1c, #991b1b);
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

.scout-cooldown {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;

  .cooldown-text {
    color: #ef4444;
    font-size: 12px;
    font-weight: 600;
  }
}

// AI生成相关样式
.explore-actions {
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
    flex-direction: column;
  }

  .filter-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
      margin-bottom: 8px;
    }

    .filter-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(205, 133, 63, 0.3);
      border-radius: 6px;
      color: #f0e6d2;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      @media (max-width: 768px) {
        padding: 8px 12px;
        font-size: 11px;
        flex: 1;
        justify-content: center;
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

      .icon {
        font-size: 14px;

        @media (max-width: 768px) {
          font-size: 12px;
        }
      }
    }
  }

  .header-right .scout-team-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: linear-gradient(135deg, rgba(5, 150, 105, 0.2), rgba(5, 150, 105, 0.1)) !important;
    border: 2px solid rgba(5, 150, 105, 0.6) !important;
    border-radius: 6px !important;
    color: #10b981 !important;
    font-weight: 700 !important;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(5, 150, 105, 0.1) !important;

    @media (max-width: 768px) {
      padding: 4px 8px;
      gap: 3px;
      font-size: 9px;
      flex-shrink: 0;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.4), rgba(5, 150, 105, 0.2)) !important;
      border-color: rgba(5, 150, 105, 0.8) !important;
      color: #059669 !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3) !important;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .icon {
      font-size: 14px;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));

      @media (max-width: 768px) {
        font-size: 10px;
      }
    }
  }
}

.scout-team-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;

  .scout-team-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 2px solid rgba(205, 133, 63, 0.4);
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    animation: modalSlideIn 0.3s ease-out;

    @media (max-width: 768px) {
      width: 95%;
      max-height: 90vh;
      height: 710px;
      border-radius: 12px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(205, 133, 63, 0.2);

      h3 {
        margin: 0;
        color: #ffd7a1;
        font-size: 20px;
        font-weight: 700;
      }

      .close-button,
      .modal-close-button {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 24px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        line-height: 1;
        flex-shrink: 0;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .modal-content {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px;
      }

      .scout-options {
        .option-group {
          margin-bottom: 20px;

          @media (max-width: 768px) {
            margin-bottom: 16px;
          }

          label {
            display: block;
            color: #f0e6d2;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .radio-group {
            display: flex;
            gap: 16px;

            .radio-item {
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;

              input[type='radio'] {
                accent-color: #059669;
              }

              span {
                color: #f0e6d2;
                font-size: 14px;
              }
            }
          }

          select,
          textarea {
            width: 100%;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(5, 150, 105, 0.3);
            border-radius: 6px;
            color: #f0e6d2;
            font-size: 14px;

            &:focus {
              outline: none;
              border-color: rgba(5, 150, 105, 0.6);
            }
          }

          textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
          }

          .scout-count-select {
            width: 100%;
            padding: 8px 12px;
            background: rgba(40, 26, 20, 0.8);
            border: 1px solid rgba(205, 133, 63, 0.3);
            border-radius: 6px;
            color: #f0e6d2;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;

            &:focus {
              outline: none;
              border-color: rgba(205, 133, 63, 0.6);
              box-shadow: 0 0 0 2px rgba(205, 133, 63, 0.2);
            }

            option {
              background: rgba(40, 26, 20, 0.95);
              color: #f0e6d2;
            }
          }

          .scout-location-info {
            margin-bottom: 12px;
            padding: 12px;
            background: rgba(5, 150, 105, 0.1);
            border: 1px solid rgba(5, 150, 105, 0.3);
            border-radius: 6px;

            .location-display {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;

              .location-label {
                color: #f0e6d2;
                font-size: 12px;
                font-weight: 600;
                opacity: 0.8;
              }

              .location-value {
                color: #059669;
                font-size: 12px;
                font-weight: 700;
              }
            }

            .location-description {
              .description-text {
                color: #f0e6d2;
                font-size: 11px;
                opacity: 0.9;
                line-height: 1.4;
              }
            }
          }
        }

        .scout-team-info {
          margin-top: 20px;
          padding: 16px;
          background: rgba(5, 150, 105, 0.1);
          border: 1px solid rgba(5, 150, 105, 0.3);
          border-radius: 8px;

          h4 {
            margin: 0 0 12px 0;
            color: #059669;
            font-size: 16px;
            font-weight: 600;
          }

          .team-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;

            .stat-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 12px;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 6px;

              .label {
                color: #f0e6d2;
                font-size: 12px;
                opacity: 0.8;
                flex: 1;
              }

              .value {
                color: #059669;
                font-weight: 600;
                font-size: 12px;
                text-align: right;
                flex: 1;
              }
            }
          }
        }
      }

      .scout-result {
        margin-top: 20px;
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;

        h4 {
          margin: 0 0 12px 0;
          color: #f0e6d2;
          font-size: 16px;
        }

        .success-message {
          color: #22c55e;

          .generated-locations {
            margin-top: 12px;

            h5 {
              margin: 0 0 8px 0;
              color: #f0e6d2;
              font-size: 14px;
            }

            ul {
              margin: 0;
              padding-left: 20px;

              .location-item {
                color: #f0e6d2;
                font-size: 14px;
                margin-bottom: 4px;
              }
            }
          }
        }

        .error-message {
          color: #ef4444;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding: 16px 24px;
      border-top: 1px solid rgba(205, 133, 63, 0.2);

      @media (max-width: 768px) {
        padding: 12px 16px;
        gap: 8px;
      }

      .cancel-button,
      .scout-button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        border: none;

        @media (max-width: 768px) {
          padding: 8px 16px;
          font-size: 12px;
        }
      }

      .cancel-button {
        background: rgba(107, 114, 128, 0.2);
        border: 1px solid rgba(107, 114, 128, 0.3);
        color: #9ca3af;

        &:hover {
          background: rgba(107, 114, 128, 0.3);
        }
      }

      .scout-button {
        background: linear-gradient(180deg, #059669, #047857);
        border: 1px solid rgba(5, 150, 105, 0.6);
        color: #ffffff;

        &:hover:not(:disabled) {
          background: linear-gradient(180deg, #047857, #065f46);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      }

      .scouting-button {
        background: linear-gradient(180deg, #f59e0b, #d97706);
        border: 1px solid rgba(245, 158, 11, 0.6);
        color: #ffffff;
        cursor: not-allowed;
        position: relative;
        overflow: hidden;

        .scouting-icon {
          animation: scoutingPulse 1.5s ease-in-out infinite;
        }

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: scoutingShimmer 2s infinite;
        }
      }
    }
  }
}

// 侦察动画关键帧
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

@keyframes scoutingShimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 统一的侦察状态弹窗样式（与自定义确认框保持一致）
.scouting-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;

  .scouting-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 2px solid rgba(205, 133, 63, 0.4);
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    animation: modalSlideIn 0.3s ease-out;

    @media (max-width: 768px) {
      width: 95%;
      max-height: 90vh;
      border-radius: 12px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(205, 133, 63, 0.2);

      h3 {
        margin: 0;
        color: #ffd7a1;
        font-size: 20px;
        font-weight: 700;
      }
    }

    .modal-content {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px;
      }

      // 加载状态样式
      .loading-icon {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(205, 133, 63, 0.2);
          border-top-color: #cd853f;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }

      .loading-message {
        font-size: 18px;
        font-weight: 600;
        color: #ffd7a1;
        text-align: center;
        margin-bottom: 12px;
        line-height: 1.5;
      }

      .loading-hint {
        font-size: 14px;
        color: #9ca3af;
        text-align: center;
        font-style: italic;
      }

      // 失败状态样式
      .message {
        color: #f0e6d2;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .details {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.6;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid rgba(245, 158, 11, 0.5);
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding: 16px 24px;
      border-top: 1px solid rgba(205, 133, 63, 0.2);

      @media (max-width: 768px) {
        padding: 12px 16px;
        gap: 8px;
        flex-direction: column;
      }

      button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        border: none;

        @media (max-width: 768px) {
          padding: 10px 16px;
          font-size: 13px;
          width: 100%;
        }
      }

      .retry-button {
        background: linear-gradient(180deg, #3b82f6, #2563eb);
        border: 1px solid rgba(59, 130, 246, 0.6);
        color: #ffffff;

        &:hover {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      }

      .abandon-button {
        background: linear-gradient(180deg, #f59e0b, #d97706);
        border: 1px solid rgba(245, 158, 11, 0.6);
        color: #ffffff;

        &:hover {
          background: linear-gradient(180deg, #d97706, #b45309);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
