<template>
  <div class="explore-container">
    <div class="explore-header">
      <h1 class="explore-title">🗺️ 探索模式</h1>
      <div class="header-right">
        <div class="explore-stats">
          <div class="stat-item">
            <span class="icon">💰</span>
            <span class="value">{{ ResourceFormatService.formatNumber(modularSaveManager.resources.value.gold) }}</span>
          </div>
          <div class="stat-item">
            <span class="icon">🍖</span>
            <span class="value">{{ ResourceFormatService.formatNumber(modularSaveManager.resources.value.food) }}</span>
          </div>
        </div>
        <button class="scout-team-button" :disabled="isGenerating" @click="showScoutTeamModal = true">
          <span class="icon">🔍</span>
          <span>{{ isGenerating ? '侦察中...' : '派出侦察队' }}</span>
        </button>
        <button class="custom-continent-button" @click="handleCustomContinentClick">
          <span class="icon">🌍</span>
          <span>自定义大陆</span>
        </button>
      </div>
    </div>

    <!-- 探索选项卡组件 -->
    <ExploreTabs
      :continents="allContinents"
      :regions="unlockedRegions"
      :selected-continent="selectedContinent"
      :selected-region="selectedRegion"
      :current-continent-conquered-stars="currentContinentConqueredStars"
      @continent-select="selectContinent"
      @region-select="selectRegion"
    />

    <!-- 据点列表组件 -->
    <LocationList
      :locations="filteredLocations"
      :selected-status-filter="selectedStatusFilter"
      :status-filters="statusFilters"
      :scouting-locations="scoutingLocations"
      :current-region-capital="currentRegion?.capital"
      @filter-change="selectedStatusFilter = $event"
      @scout="scoutLocation"
      @attack="startBattle"
    />

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
    <ScoutTeamModal
      :show="showScoutTeamModal"
      :current-continent="selectedContinent"
      :current-region="selectedRegion"
      :region-description="currentRegion?.description"
      :available-location-types="availableLocationTypes"
      @close="showScoutTeamModal = false"
      @scout-success="showScoutTeamModal = false"
    />

    <!-- 统一的侦察状态弹窗 -->
    <ScoutingStatusModal
      :show="showScoutingModal"
      :state="scoutingModalState"
      :loading-message="scoutingLoadingMessage"
      :failure-data="scoutingFailureData || undefined"
      :current-scouting-location="currentScoutingLocation || undefined"
      :scouting-locations="scoutingLocations"
      :scouting-animation="scoutingAnimation"
      @close="handleScoutingModalClose"
      @cancel="handleScoutingModalCancel"
      @retry="handleScoutingModalRetry"
      @abandon="handleScoutingModalAbandon"
    />

    <!-- 自定义大陆管理弹窗 -->
    <CustomContinentModal :show="showCustomContinentModal" @close="showCustomContinentModal = false" />

    <!-- 侦察提示词输入弹窗 -->
    <ScoutPromptInputModal
      :show="showScoutPromptModal"
      :location="currentScoutingLocation"
      @confirm="handleScoutPromptConfirm"
      @cancel="handleScoutPromptCancel"
    />
  </div>
</template>

<script setup lang="ts">
// Vue 核心
import { computed, onMounted, onUnmounted, ref } from 'vue';

// 功能模块层组件
import AdvancedBattleInterface from '../功能模块层/战斗/视图/高级战斗界面.vue';

// 功能模块层服务
import { continentExploreService } from '../功能模块层/探索/服务/大陆探索服务';
import { exploreService } from '../功能模块层/探索/服务/探索服务';
import { ExploreUIUtils } from '../功能模块层/探索/服务/探索界面工具服务';
import type { Location } from '../功能模块层/探索/类型/探索类型';

// 核心层服务
import { WorldbookService } from '../核心层/服务/世界书管理/服务/世界书服务';
import { modularSaveManager } from '../核心层/服务/存档系统/模块化存档服务';
import { toastService } from '../核心层/服务/通用服务/弹窗提示服务';
import { TimeParseService } from '../核心层/服务/通用服务/时间解析服务';
import { ConfirmService } from '../核心层/服务/通用服务/确认框服务';
import { actionPointsService } from '../核心层/服务/通用服务/行动力服务';
import { ResourceFormatService } from '../核心层/服务/通用服务/资源格式化服务';

// 子组件
import ScoutPromptInputModal from './探索界面子页面/侦察提示词输入弹窗.vue';
import ScoutingStatusModal from './探索界面子页面/侦察状态弹窗.vue';
import LocationList from './探索界面子页面/据点列表组件.vue';
import ExploreTabs from './探索界面子页面/探索选项卡组件.vue';
import ScoutTeamModal from './探索界面子页面/派出侦察队弹窗.vue';
import CustomContinentModal from './探索界面子页面/自定义大陆管理弹窗.vue';

// ==================== 响应式数据 ====================

// 战斗相关
const showBattleModal = ref(false);
const selectedBattleTarget = ref<Location | null>(null);
const battleData = ref<any>(null);

// 大陆和区域选择（默认值会在组件挂载时从探索状态恢复）
const selectedContinent = ref<string>('古拉尔大陆');
const selectedRegion = ref<string>('巢穴附近');

// 侦察队弹窗
const showScoutTeamModal = ref(false);
const isGenerating = ref(false);

// 自定义大陆管理弹窗
const showCustomContinentModal = ref(false);

// 侦察状态管理
const scoutingLocations = ref<Set<string>>(new Set());
const scoutingAnimation = ref<Set<string>>(new Set());

// 侦察状态弹窗
const showScoutingModal = ref(false);
const scoutingModalState = ref<'loading' | 'failure'>('loading');
const scoutingLoadingMessage = ref('正在侦察中...');
const scoutingFailureData = ref<{ location: Location; originalCost: { gold: number; food: number } } | null>(null);
const currentScoutingLocation = ref<Location | null>(null);
const scoutLocationAbortController = ref<AbortController | null>(null);

// 侦察提示词输入弹窗
const showScoutPromptModal = ref(false);
const pendingScoutLocation = ref<Location | null>(null);
const extraPromptForScout = ref<string>('');

// 据点筛选
const selectedStatusFilter = ref('all');
const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'scouted', label: '已侦察' },
  { value: 'conquered', label: '已征服' },
  { value: 'hide-conquered', label: '可操作' },
];

// ==================== 计算属性 ====================

const allContinents = computed(() => continentExploreService.continents.value);

const currentContinentRegions = computed(() => {
  const continent = continentExploreService.continents.value.find(c => c.name === selectedContinent.value);
  return continent?.regions || [];
});

const unlockedRegions = computed(() => currentContinentRegions.value);

const currentRegion = computed(() => {
  return currentContinentRegions.value.find(r => r.name === selectedRegion.value);
});

const currentContinentConqueredStars = computed(() => {
  if (!selectedContinent.value) return 0;
  const locations = exploreService.getAllLocations();
  const conqueredLocations = locations.filter(
    loc => loc.continent === selectedContinent.value && loc.status === 'conquered',
  );
  return conqueredLocations.reduce((total, loc) => total + (loc.difficulty || 0), 0);
});

const availableLocationTypes = computed(() => {
  return ExploreUIUtils.getAvailableLocationTypes(selectedContinent.value);
});

const allTargetLocations = computed(() => exploreService.getAllLocations());

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

// ==================== 方法 ====================

// 大陆和区域选择
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

const selectRegion = (regionName: string) => {
  selectedRegion.value = regionName;
  saveSelectionState();
  console.log(`切换到区域: ${regionName}`);
};

const saveSelectionState = () => {
  continentExploreService.exploreState.value.selectedContinent = selectedContinent.value;
  continentExploreService.exploreState.value.selectedRegion = selectedRegion.value;
};

// 侦察相关
const loadScoutingState = async () => {
  try {
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

    // 检查是否启用侦察时输入额外提示词
    const globalVars = getVariables({ type: 'global' });
    const enablePromptInput =
      typeof globalVars['enable_scout_prompt_input'] === 'boolean' ? globalVars['enable_scout_prompt_input'] : false;

    // 如果需要生成英雄且启用了提示词输入，先显示输入框
    if (needsAIHero && enablePromptInput) {
      pendingScoutLocation.value = location;
      currentScoutingLocation.value = location;
      showScoutPromptModal.value = true;
      extraPromptForScout.value = '';
      // 等待用户输入提示词，不继续执行
      return;
    }

    // 如果没有启用提示词输入或不需要生成英雄，直接执行侦察
    await executeScout(location, '');
  } catch (error) {
    // 发生错误，清理状态
    scoutingLocations.value.delete(location.id);
    scoutingAnimation.value.delete(location.id);
    actionPointsService.refundActionPoints('scoutLocation');
    await ConfirmService.showDanger(`侦察失败：${error}`, '侦察失败', '请检查资源是否充足');
  }
};

// 执行侦察（实际执行侦察逻辑）
const executeScout = async (location: Location, extraPrompt: string = '', isFullCustom: boolean = false) => {
  try {
    // 如果需要生成英雄，显示加载弹窗
    const needsAIHero = (location as any).needsAIHero || location.description.includes('[AI_HERO_GENERATE]');
    if (needsAIHero) {
      scoutingLoadingMessage.value = `发现英雄！正在生成 "${location.name}" 的英雄信息...`;
      scoutingModalState.value = 'loading';
      showScoutingModal.value = true;
      currentScoutingLocation.value = location;
      scoutLocationAbortController.value = new AbortController();
    }

    const result = await exploreService.scoutLocation(location.id, extraPrompt, isFullCustom);

    // 检查是否需要用户决策（AI生成失败）
    if (result.needsUserDecision && result.aiFailureData) {
      scoutingLocations.value.delete(location.id);
      scoutingAnimation.value.delete(location.id);
      actionPointsService.refundActionPoints('scoutLocation');
      scoutingModalState.value = 'failure';
      scoutingFailureData.value = {
        location: result.aiFailureData.location,
        originalCost: result.aiFailureData.originalCost,
      };
      currentScoutingLocation.value = null;
      scoutLocationAbortController.value = null;
      return;
    }

    // 隐藏加载弹窗
    showScoutingModal.value = false;
    currentScoutingLocation.value = null;
    scoutLocationAbortController.value = null;

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
      actionPointsService.refundActionPoints('scoutLocation');
      await ConfirmService.showDanger(
        `据点 "${location.name}" 侦察失败`,
        '侦察失败',
        result.error || '侦察队未能获取有效信息',
      );
    }
  } catch (error) {
    showScoutingModal.value = false;
    currentScoutingLocation.value = null;
    scoutLocationAbortController.value = null;
    scoutingLocations.value.delete(location.id);
    scoutingAnimation.value.delete(location.id);
    actionPointsService.refundActionPoints('scoutLocation');
    await ConfirmService.showDanger(`侦察失败：${error}`, '侦察失败', '请检查资源是否充足');
  }
};

// 处理侦察提示词确认
const handleScoutPromptConfirm = async (prompt: string, isFullCustom: boolean) => {
  if (!pendingScoutLocation.value) return;

  extraPromptForScout.value = prompt;
  showScoutPromptModal.value = false;
  const location = pendingScoutLocation.value;
  pendingScoutLocation.value = null;

  // 执行侦察
  await executeScout(location, prompt, isFullCustom);
};

// 处理侦察提示词取消
const handleScoutPromptCancel = async () => {
  if (!pendingScoutLocation.value) return;

  const location = pendingScoutLocation.value;
  pendingScoutLocation.value = null;
  showScoutPromptModal.value = false;
  currentScoutingLocation.value = null;

  // 移除侦察状态
  scoutingLocations.value.delete(location.id);
  scoutingAnimation.value.delete(location.id);

  // 返还行动力
  actionPointsService.refundActionPoints('scoutLocation');
  extraPromptForScout.value = '';
};

// 侦察弹窗处理
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

const handleScoutingModalClose = async () => {
  showScoutingModal.value = false;
};

// 自定义大陆按钮点击处理
const handleCustomContinentClick = () => {
  // toastService.info('自定义大陆功能开发中，敬请期待...', { title: '开发中', duration: 3000 });
  showCustomContinentModal.value = true; // 暂时禁用
};

const handleScoutingModalCancel = async (location: Location, cost: { gold: number; food: number }) => {
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
};

const startBattle = async (location: Location) => {
  // 检查行动力
  if (!actionPointsService.hasEnoughActionPoints('attackLocation')) {
    await ConfirmService.showWarning(
      actionPointsService.getInsufficientActionPointsMessage('attackLocation'),
      '行动力不足',
      '请等待下回合恢复行动力或征服更多区域增加上限',
    );
    return;
  }

  // 检查是否有部队编制数据
  const { FormationService } = await import('../功能模块层/战斗/服务/部队编制服务');
  if (!FormationService.hasFormationData()) {
    await ConfirmService.showWarning(
      '请先进行部队编制！',
      '无法开始战斗',
      '没有编制部队无法参与战斗，请前往部队编制界面进行编制。',
    );
    return;
  }

  // 消耗行动力
  if (!actionPointsService.consumeActionPoints('attackLocation')) {
    await ConfirmService.showDanger('行动力消耗失败', '操作失败');
    return;
  }

  selectedBattleTarget.value = location;
  const enemyUnits = exploreService.getLocationEnemyUnits(location.id, 1);

  battleData.value = {
    target: location,
    enemyForces: {
      guards: ExploreUIUtils.getTotalEnemyTroops(location),
      name: location.name,
      type: location.type,
      difficulty: location.difficulty,
      units: enemyUnits,
    },
  };

  showBattleModal.value = true;
};

const closeBattleModal = () => {
  showBattleModal.value = false;
  selectedBattleTarget.value = null;
  battleData.value = null;
};

const handleBattleComplete = async (result: any) => {
  if (result.victory) {
    const locationId = selectedBattleTarget.value?.id;
    if (locationId) {
      await exploreService.updateLocationStatus(locationId, 'conquered');
      continentExploreService.recalculateAllRegionProgress();

      // 添加据点征服记录到世界书
      try {
        const location = selectedBattleTarget.value;
        if (location) {
          const currentRounds = modularSaveManager.resources.value.rounds || 0;
          const gameTime = TimeParseService.getTimeInfo(currentRounds).formattedDate;
          const currentContinentData = continentExploreService.continents.value.find(
            c => c.name === location.continent,
          );
          const currentRegionData = currentContinentData?.regions.find(r => r.name === location.region);
          await WorldbookService.addConquestRecord(location, result, gameTime, currentRegionData?.description);
        }
      } catch (error) {
        console.error('添加据点征服记录失败:', error);
      }
    }
  }

  // 更新资源世界书
  try {
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
    await WorldbookService.updateResourcesWorldbook(currentResources, continentExploreService.continents.value);
  } catch (error) {
    console.error('战斗完成后更新资源世界书失败:', error);
  }
};

// 事件处理
const handleLocationStatusUpdate = async (event: CustomEvent) => {
  const { locationId, status } = event.detail;
  try {
    await exploreService.updateLocationStatus(locationId, status);
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

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadScoutingState();
  setTimeout(() => restoreSelectionState(), 10);
  await checkAndAddMissingCharacters();
  window.addEventListener('location-status-updated', handleLocationStatusUpdate as unknown as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('location-status-updated', handleLocationStatusUpdate as unknown as EventListener);
});

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

  .scout-team-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: linear-gradient(180deg, #3b82f6, #2563eb);
    border: 1px solid rgba(59, 130, 246, 0.6);
    color: #ffffff;
    font-weight: 600;
    font-size: 12px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;
    cursor: pointer;

    @media (max-width: 768px) {
      padding: 4px 8px;
      font-size: 10px;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(180deg, #2563eb, #1d4ed8);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .icon {
      font-size: 14px;

      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
  }

  .custom-continent-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: linear-gradient(180deg, #8b5cf6, #7c3aed);
    border: 1px solid rgba(139, 92, 246, 0.6);
    color: #ffffff;
    font-weight: 600;
    font-size: 12px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
    transition: all 0.2s ease;
    cursor: pointer;

    @media (max-width: 768px) {
      padding: 4px 8px;
      font-size: 10px;
    }

    &:hover {
      background: linear-gradient(180deg, #7c3aed, #6d28d9);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(139, 92, 246, 0.4);
    }

    .icon {
      font-size: 14px;

      @media (max-width: 768px) {
        font-size: 12px;
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

@media (min-width: 769px) and (max-width: 1920px) {
  .battle-modal {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
  }
}

@media (min-width: 1921px) and (max-width: 2560px) {
  .battle-modal {
    width: calc(100vw - 60px);
    height: calc(100vh - 60px);
    max-width: calc(100vw - 60px);
    max-height: calc(100vh - 60px);
  }
}

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

@media (max-width: 768px) {
  .battle-modal .modal-header {
    padding: 12px 16px;
    min-height: 50px;
  }

  .battle-modal .modal-header h3 {
    font-size: 16px;
  }
}

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
  min-height: 0;
}

@media (max-width: 768px) {
  .battle-modal .modal-content {
    height: calc(100vh - 50px - 10px);
  }
}

@media (min-width: 1921px) {
  .battle-modal .modal-content {
    height: calc(100vh - 70px - 60px);
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
</style>
