<template>
  <div class="mini-goblin">
    <!-- 首页内容 -->
    <template v-if="route.path === '/'">
      <div class="decorative-border">
        <div class="content-wrapper">
          <header class="header">
            <div class="header-center">
              <h1 class="main-title">哥布林巢穴</h1>
            </div>
          </header>

          <!-- 统计信息 -->
          <section class="stats-container">
            <!-- 时间和季节信息 -->
            <div class="stats-row">
              <div class="stats-card time-info">
                <div class="time-content">
                  <div class="date">{{ currentTime }}</div>
                  <div class="season">🍂 {{ currentSeason }}</div>
                </div>
              </div>
            </div>

            <!-- 回合数和威胁度并列一行 -->
            <div class="stats-row">
              <div class="stats-card">
                <div class="stat-item">
                  <span class="icon">🔄</span>
                  <div class="value">第{{ roundCount }}回合</div>
                </div>
              </div>
              <div class="stats-card">
                <div class="stat-item">
                  <span class="icon">⚠️</span>
                  <div class="value">威胁度 {{ threat }}</div>
                </div>
              </div>
            </div>

            <!-- 行动力显示 -->
            <div class="action-points-row">
              <div class="action-points-card">
                <div class="action-points-display">
                  <span
                    v-for="i in maxActionPoints"
                    :key="i"
                    class="action-point"
                    :class="{ filled: i <= currentActionPoints }"
                  >
                    {{ i <= currentActionPoints ? '❤️' : '🤍' }}
                  </span>
                  <!-- 其他emoji组合选择：
                    火焰系：🔥 / 🌫️
                    宝石系：💎 / ⬜ (当前)
                    能量系：⚡ / ⚪
                    魔法系：🔮 / ⭕
                    心系：❤️ / 🤍
                    太阳系：☀️ / ⚫
                    剑系：⚔️ / ⬛
                    盾系：🛡️ / ⬜
                  -->
                </div>
              </div>
            </div>

            <!-- 所有资源 - 八个并列 -->
            <div class="resources-grid eight-columns">
              <div class="resource-item">
                <div class="resource-icon">💰</div>
                <div class="resource-value">{{ gold }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">🍖</div>
                <div class="resource-value">{{ food }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">🔒</div>
                <div class="resource-value">{{ slaves }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">💋</div>
                <div class="resource-value">{{ trainingCharactersCount }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">👺</div>
                <div class="resource-value">{{ normalGoblins }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">⚔️</div>
                <div class="resource-value">{{ warriorGoblins }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">🔮</div>
                <div class="resource-value">{{ shamanGoblins }}</div>
              </div>
              <div class="resource-item">
                <div class="resource-icon">✨</div>
                <div class="resource-value">{{ paladinGoblins }}</div>
              </div>
            </div>
          </section>

          <!-- 操作按钮区域 -->
          <div class="action-buttons">
            <button class="action-btn save-load-btn" title="存档管理" @click="openSaveLoadModal">
              <span class="icon">💾</span>
              <span class="text">存档管理</span>
            </button>
            <button
              class="action-btn story-summary-btn"
              :class="{ 'needs-summary': needsSummary }"
              :title="needsSummary ? '⚠️ 建议总结剧情（部分条目超过5万tokens）' : '剧情总结'"
              @click="openStorySummaryModal"
            >
              <span class="icon">📚</span>
              <span class="text">剧情总结</span>
            </button>
            <button class="action-btn round-btn" title="结束回合" @click="() => endRound()">
              <span class="icon">⏭️</span>
              <span class="text">结束回合</span>
            </button>
          </div>

          <!-- 信息显示区域 -->
          <div class="info-display">
            <div class="info-header">
              <span class="info-title">回合信息</span>
              <button class="history-btn" title="查看历史日志" @click="openHistoryModal">
                <span class="icon">📜</span>
              </button>
            </div>
            <div class="info-content">
              <div v-if="latestRoundInfo" class="round-summary">
                <div class="round-title">{{ latestRoundInfo.title }}</div>
                <div class="resource-changes">
                  <div
                    v-for="change in latestRoundInfo.changes"
                    :key="change.type"
                    class="resource-change"
                    :class="change.amount > 0 ? 'positive' : 'negative'"
                  >
                    <span class="resource-icon">{{ getResourceIcon(change.type) }}</span>
                    <span class="resource-name">{{ getResourceName(change.type) }}</span>
                    <span class="change-amount" :class="change.amount > 0 ? 'positive' : 'negative'"
                      >{{ change.amount > 0 ? '+' : '' }}{{ change.amount }}</span
                    >
                  </div>
                </div>
              </div>
              <div v-else class="no-round-info">
                <div class="no-info-text">暂无回合信息</div>
                <div class="no-info-hint">点击"结束回合"开始游戏</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 其他界面内容 -->
    <template v-else>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </template>

    <!-- 底部导航栏 -->
    <nav class="bottom-nav">
      <router-link to="/探索" class="nav-item" active-class="active">
        <span class="icon">🗺️</span>
        <span class="label">探索</span>
      </router-link>
      <router-link to="/部队编制" class="nav-item" active-class="active">
        <span class="icon">⚔️</span>
        <span class="label">编制</span>
      </router-link>
      <router-link to="/" class="nav-item center-nav" active-class="active">
        <span class="icon">🏠</span>
        <span class="label">首页</span>
      </router-link>
      <router-link to="/巢穴" class="nav-item" active-class="active">
        <span class="icon">🏰</span>
        <span class="label">巢穴</span>
      </router-link>
      <router-link to="/调教" class="nav-item" active-class="active">
        <span class="icon">💋</span>
        <span class="label">调教</span>
      </router-link>
    </nav>

    <!-- 存档管理界面 -->
    <SaveLoadModal
      :show="showSaveLoadModal"
      :current-resources="{
        gold: modularSaveManager.resources.value.gold,
        food: modularSaveManager.resources.value.food,
        threat: modularSaveManager.resources.value.threat,
        slaves: modularSaveManager.resources.value.slaves,
        normalGoblins: modularSaveManager.resources.value.normalGoblins,
        warriorGoblins: modularSaveManager.resources.value.warriorGoblins,
        shamanGoblins: modularSaveManager.resources.value.shamanGoblins,
        paladinGoblins: modularSaveManager.resources.value.paladinGoblins,
        trainingSlaves: modularSaveManager.resources.value.trainingSlaves,
        rounds: modularSaveManager.resources.value.rounds,
        actionPoints: modularSaveManager.resources.value.actionPoints,
        maxActionPoints: modularSaveManager.resources.value.maxActionPoints,
        conqueredRegions: modularSaveManager.resources.value.conqueredRegions,
      }"
      :current-game-state="gameState"
      :latest-round-info="latestRoundInfo"
      @close="handleCloseSaveModal"
      @save="handleSave"
      @load="handleLoad"
      @error="handleSaveError"
      @init="handleInitGame"
    />

    <!-- 历史记录弹窗 -->
    <HistoryModal ref="historyModalRef" :show="showHistoryModal" @close="closeHistoryModal" />

    <!-- 剧情总结界面 -->
    <StorySummaryModal :show="showStorySummaryModal" @close="closeStorySummaryModal" />

    <!-- 自定义确认框 -->
    <CustomConfirm
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :details="confirmState.details"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      :show-cancel="confirmState.showCancel"
      :show-close="confirmState.showClose"
      :type="confirmState.type"
      @confirm="ConfirmService.handleConfirm"
      @cancel="ConfirmService.handleCancel"
      @close="ConfirmService.handleClose"
    />

    <!-- 随机事件管理器 -->
    <RandomEventManager
      ref="randomEventManagerRef"
      :current-round="roundCount"
      :game-state="gameStateForEvents"
      @event-triggered="handleRandomEventTriggered"
      @event-completed="handleRandomEventCompleted"
    />

    <!-- 游戏设置面板 -->
    <GameSettingsPanel
      :show="showSettings"
      @close="closeSettings"
      @open-text-style="openTextStyleSettings"
      @open-tutorial="handleSettingsTutorial"
    />

    <!-- 文字样式设置 -->
    <TextStyleSettings :show="showTextStyleSettings" @close="closeTextStyleSettings" />

    <!-- 教程确认框 -->
    <CustomConfirm
      :show="showTutorialConfirm"
      title="查看教程"
      message="即将跳转到教程文档"
      details="点击确认后将在新标签页打开教程文档。"
      confirm-text="确认"
      cancel-text="取消"
      type="info"
      :show-cancel="true"
      :show-close="true"
      @confirm="handleTutorialConfirm"
      @cancel="handleTutorialCancel"
      @close="handleTutorialCancel"
    />

    <!-- 全局悬浮球 -->
    <GlobalFAB @open-settings="openSettings" @open-debug="openDebug" />

    <!-- 欢迎提示弹窗 -->
    <WelcomeModal :show="showWelcomeModal" @confirm="handleWelcomeConfirm" @close="handleWelcomeClose" />

    <!-- 调试面板 -->
    <DebugPanel :show="showDebugPanel" @close="closeDebug" />

    <!-- 生成错误提示 -->
    <GenerationErrorPanel />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import RandomEventManager from '../随机事件/界面/随机事件管理器.vue';
import { WorldbookService } from './世界书管理/世界书服务';
import StorySummaryModal from './世界书管理/剧情总结界面.vue';
import HistoryModal from './历史记录/历史记录界面.vue';
import SaveLoadModal from './存档管理/存档界面.vue';
import { modularSaveManager } from './存档管理/模块化存档服务';
import { continentExploreService } from './探索/服务/大陆探索服务';
import { SummaryCheckService } from './服务/总结检查服务';
import { TimeParseService } from './服务/时间解析服务';
import { checkAndShowWelcome, markWelcomeAsShown } from './服务/欢迎提示服务';
import { PlayerLevelService } from './服务/玩家等级服务';
import { BreedingService } from './服务/生育服务';
import { ConfirmService, confirmState } from './服务/确认框服务';
import GlobalFAB from './组件/全局悬浮球.vue';
import TextStyleSettings from './组件/文字样式设置.vue';
import WelcomeModal from './组件/欢迎提示弹窗.vue';
import GameSettingsPanel from './组件/游戏设置面板.vue';
import GenerationErrorPanel from './组件/生成错误提示.vue';
import CustomConfirm from './组件/自定义确认框.vue';
import DebugPanel from './组件/调试界面.vue';

const route = useRoute();

// 直接使用 modularSaveManager 的响应式资源状态
const resources = computed(() => modularSaveManager.resources.value);

// 响应式资源状态现在由 useModularResources 提供

// 资源计算属性（保持向后兼容）
const gold = computed(() => resources.value.gold);
const food = computed(() => resources.value.food);
const threat = computed(() => resources.value.threat);
const slaves = computed(() => resources.value.slaves);

// 哥布林数量 - 使用统一的资源管理系统
const normalGoblins = computed(() => resources.value.normalGoblins);
const warriorGoblins = computed(() => resources.value.warriorGoblins);
const shamanGoblins = computed(() => resources.value.shamanGoblins);
const paladinGoblins = computed(() => resources.value.paladinGoblins);

// 调教人物总数量 - 使用响应式资源
const trainingCharactersCount = computed(() => resources.value.trainingSlaves);

// 行动力系统 - 使用真实的资源数据
const maxActionPoints = computed(() => resources.value.maxActionPoints);
const currentActionPoints = computed(() => resources.value.actionPoints);

// 自动保存机制
let autoSaveTimer: number | null = null;
const enableAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  // 每30秒自动保存一次
  autoSaveTimer = setInterval(async () => {
    try {
      if (isSaveSystemInitialized.value) {
        await modularSaveManager.saveCurrentGameData(0, '自动存档');
        console.log('自动保存完成');
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }, 30000);
};

// 禁用自动保存
const disableAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
};

// 时空信息 - 使用计算属性实现响应式更新
const roundCount = computed(() => modularSaveManager.resources.value.rounds);

// 响应式的日期和季节显示
const currentTime = computed(() => {
  const rounds = modularSaveManager.resources.value.rounds || 0;
  const timeInfo = TimeParseService.getTimeInfo(rounds, false);
  return timeInfo.formattedDate;
});

const currentSeason = computed(() => {
  const rounds = modularSaveManager.resources.value.rounds || 0;
  const timeInfo = TimeParseService.getTimeInfo(rounds, true);
  return timeInfo.season || '春季';
});

// 游戏状态（用于随机事件）
const gameStateForEvents = computed(() => ({
  resources: resources.value,
  threat: resources.value.threat,
  rounds: resources.value.rounds,
}));

// 随机事件管理器引用
const randomEventManagerRef = ref();

// 处理随机事件触发
const handleRandomEventTriggered = (event: any) => {
  console.log('随机事件触发:', event.name);
  // 可以在这里添加事件触发时的额外逻辑
};

// 处理随机事件完成
const handleRandomEventCompleted = (event: any, result: any) => {
  console.log('随机事件完成:', event.name, result);
  // 可以在这里添加事件完成后的额外逻辑
};

// 添加日期变化的视觉效果（保留用于回合结束时的动画）
const triggerDateUpdateAnimation = () => {
  const timeElement = document.querySelector('.time-content');
  if (timeElement) {
    timeElement.classList.add('date-updated');
    setTimeout(() => {
      timeElement.classList.remove('date-updated');
    }, 1000);
  }
};

// 设置面板状态
const showSettings = ref(false);
const showTextStyleSettings = ref(false);
const showDebugPanel = ref(false);

// 设置相关函数
function openSettings() {
  showSettings.value = true;
}

function closeSettings() {
  showSettings.value = false;
}

function openTextStyleSettings() {
  showTextStyleSettings.value = true;
  closeSettings(); // 关闭主设置面板
}

function closeTextStyleSettings() {
  showTextStyleSettings.value = false;
}

function handleSettingsTutorial() {
  closeSettings(); // 关闭设置面板
  openTutorial(); // 打开教程确认框
}

// 调试面板相关函数
function openDebug() {
  showDebugPanel.value = true;
}

function closeDebug() {
  showDebugPanel.value = false;
}

// 教程确认框状态
const showTutorialConfirm = ref(false);

// 打开教程（显示确认框）
function openTutorial() {
  showTutorialConfirm.value = true;
}

// 处理教程确认
function handleTutorialConfirm() {
  showTutorialConfirm.value = false;
  // 打开谷歌文档链接
  window.open(
    'https://docs.google.com/document/d/1UV8hG4hgYfg6nyRHquQ36pz4-Fb8QCB3cxakLXXbRss/edit?tab=t.0#heading=h.1scl3yr0eg9',
    '_blank',
  );
}

// 处理教程取消
function handleTutorialCancel() {
  showTutorialConfirm.value = false;
}

// 欢迎弹窗状态
const showWelcomeModal = ref(false);

// 处理欢迎弹窗确认
function handleWelcomeConfirm() {
  markWelcomeAsShown();
  showWelcomeModal.value = false;
}

// 处理欢迎弹窗关闭（实际上不允许关闭，必须点击"我知道了"）
function handleWelcomeClose() {
  // 不允许点击关闭
}

// 游戏状态管理
const gameState = ref<any>(null);

// 存档管理
const showSaveLoadModal = ref(false);
const isSaveSystemInitialized = ref(false);

// 剧情总结
const showStorySummaryModal = ref(false);
const needsSummary = ref(false); // 是否需要总结

// 信息显示相关
const latestRoundInfo = ref<any>(null);
const showHistoryModal = ref(false);

// 历史记录组件引用
const historyModalRef = ref<any>(null);

// 初始化存档系统
const initializeSaveSystem = async () => {
  try {
    if (isSaveSystemInitialized.value) return;

    // 初始化模块化存档管理器
    await modularSaveManager.init();

    // 等待大陆探索服务初始化完成
    console.log('🔍 [app.vue] 等待大陆探索服务初始化...');
    await new Promise(resolve => setTimeout(resolve, 200)); // 等待200ms确保大陆探索服务初始化完成

    // 初始化资源世界书条目
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
    console.log('🔍 [app.vue] 获取到的大陆数据:', continents);
    console.log('🔍 [app.vue] 大陆数量:', continents.length);

    await WorldbookService.initializeResourcesWorldbook(currentResources, continents);
    console.log('资源世界书条目初始化完成');

    isSaveSystemInitialized.value = true;
    console.log('存档系统初始化完成');
  } catch (error) {
    console.error('存档系统初始化失败:', error);
  }
};

// 保存游戏状态到模块化系统
const saveCurrentGameState = () => {
  try {
    // 获取当前游戏数据，如果没有则创建新游戏
    let currentGameData = modularSaveManager.getCurrentGameData();
    if (!currentGameData) {
      modularSaveManager.createNewGame();
      currentGameData = modularSaveManager.getCurrentGameData();
    }

    // 更新基础资源
    modularSaveManager.updateBaseResources({
      gold: modularSaveManager.resources.value.gold,
      food: modularSaveManager.resources.value.food,
      threat: modularSaveManager.resources.value.threat,
      slaves: modularSaveManager.resources.value.slaves,
      normalGoblins: modularSaveManager.resources.value.normalGoblins,
      warriorGoblins: modularSaveManager.resources.value.warriorGoblins,
      shamanGoblins: modularSaveManager.resources.value.shamanGoblins,
      paladinGoblins: modularSaveManager.resources.value.paladinGoblins,
      trainingSlaves: modularSaveManager.resources.value.trainingSlaves,
      rounds: modularSaveManager.resources.value.rounds,
      actionPoints: modularSaveManager.resources.value.actionPoints,
      maxActionPoints: modularSaveManager.resources.value.maxActionPoints,
      conqueredRegions: modularSaveManager.resources.value.conqueredRegions,
    });

    // 巢穴数据现在直接保存在基础资源中，不需要单独的模块
    // const buildingSlots = // loadBuildingSlots - 建筑数据现在由数据库系统处理();
    // 建筑槽位数据现在由数据库系统处理

    console.log('游戏状态已保存到模块化系统');
  } catch (error) {
    console.error('保存游戏状态失败:', error);
  }
};

// 恢复基础资源的公共函数
const restoreBaseResources = (baseResources: any) => {
  if (baseResources) {
    // 调试日志：记录恢复前的行动力
    const beforeActionPoints = modularSaveManager.resources.value.actionPoints;
    const beforeMaxActionPoints = modularSaveManager.resources.value.maxActionPoints;
    console.log(`[restoreBaseResources] 恢复前行动力: ${beforeActionPoints}/${beforeMaxActionPoints}`);
    console.log(
      `[restoreBaseResources] 存档中的行动力: ${baseResources.actionPoints}/${baseResources.maxActionPoints}`,
    );

    modularSaveManager.setResource('gold', baseResources.gold);
    modularSaveManager.setResource('food', baseResources.food);
    modularSaveManager.setResource('threat', baseResources.threat);
    modularSaveManager.setResource('slaves', baseResources.slaves);
    modularSaveManager.setResource('normalGoblins', baseResources.normalGoblins);
    modularSaveManager.setResource('warriorGoblins', baseResources.warriorGoblins);
    modularSaveManager.setResource('shamanGoblins', baseResources.shamanGoblins);
    modularSaveManager.setResource('paladinGoblins', baseResources.paladinGoblins);
    modularSaveManager.setResource('trainingSlaves', baseResources.trainingSlaves);
    modularSaveManager.setResource('rounds', baseResources.rounds);
    // 恢复行动力系统数据（使用??操作符，只有在undefined或null时才使用默认值）
    const targetActionPoints = baseResources.actionPoints ?? 3;
    const targetMaxActionPoints = baseResources.maxActionPoints ?? 3;
    console.log(`[restoreBaseResources] 准备设置行动力: ${targetActionPoints}/${targetMaxActionPoints}`);
    modularSaveManager.setResource('actionPoints', targetActionPoints);
    modularSaveManager.setResource('maxActionPoints', targetMaxActionPoints);
    modularSaveManager.setResource('conqueredRegions', baseResources.conqueredRegions ?? 0);

    // 调试日志：记录恢复后的行动力
    const afterActionPoints = modularSaveManager.resources.value.actionPoints;
    const afterMaxActionPoints = modularSaveManager.resources.value.maxActionPoints;
    console.log(`[restoreBaseResources] 恢复后行动力: ${afterActionPoints}/${afterMaxActionPoints}`);

    if (beforeActionPoints !== afterActionPoints) {
      console.warn(
        `[restoreBaseResources] ⚠️ 行动力在恢复过程中发生变化: ${beforeActionPoints} -> ${afterActionPoints}`,
      );
    }

    console.log('基础资源已恢复');
  }
};

// 同步繁殖间占用信息到巢穴模块
const syncBreedingRoomInfo = () => {
  try {
    const breedingRoomInfo: any[] = [];

    // 获取调教数据中的人物信息
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    if (trainingData && trainingData.characters) {
      // 遍历所有人物，找出占用繁殖间的人物
      trainingData.characters.forEach((char: any) => {
        if (char.locationId && char.locationId.startsWith('breeding-')) {
          breedingRoomInfo.push({
            roomId: char.locationId,
            characterId: char.id,
            characterName: char.name,
            status: char.status === 'breeding' ? 'breeding' : 'imprisoned',
            occupiedAt: new Date(),
          });
        }
      });
    }

    // 获取当前巢穴数据
    const currentNestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;

    // 更新巢穴数据
    modularSaveManager.updateModuleData({
      moduleName: 'nest',
      data: {
        ...currentNestData,
        breedingRoomInfo: breedingRoomInfo,
      },
    });

    console.log('繁殖间占用信息已同步到巢穴模块:', breedingRoomInfo);
  } catch (error) {
    console.error('同步繁殖间信息失败:', error);
  }
};

// 打开存档管理界面
const openSaveLoadModal = () => {
  showSaveLoadModal.value = true;
};

// 处理存档保存
const handleSave = async (slot: number) => {
  try {
    console.log(`保存到槽位 ${slot}`);

    // 【关键修复】先确保当前响应式状态已同步到 currentGameData，避免初始化时覆盖
    // 如果没有 currentGameData，先创建一个新的，但立即用当前状态填充
    let currentGameData = modularSaveManager.getCurrentGameData();
    if (!currentGameData) {
      // 创建新游戏数据，但立即用当前响应式状态填充，避免被初始值覆盖
      modularSaveManager.createNewGame();
      modularSaveManager.syncReactiveToResources();
      currentGameData = modularSaveManager.getCurrentGameData();
    } else {
      // 确保当前响应式状态已同步到游戏数据
      modularSaveManager.syncReactiveToResources();
    }

    // 保存当前游戏状态到模块化系统（包括所有模块数据）
    saveCurrentGameState();

    // 确保存档系统已初始化
    // 注意：initializeDefaultSlot 现在会检查是否有游戏进度，如果有就不会覆盖 currentGameData
    if (!isSaveSystemInitialized.value) {
      await initializeSaveSystem();
      // 初始化后，再次确保当前状态已同步（initializeDefaultSlot 可能已经保留了我们的状态）
      modularSaveManager.syncReactiveToResources();
      saveCurrentGameState();
    }

    // 保存到指定槽位
    const success = await modularSaveManager.saveCurrentGameData(slot, `存档 ${slot}`);
    if (success) {
      console.log(`游戏已保存到槽位 ${slot}`);
    } else {
      console.error(`保存到槽位 ${slot} 失败`);
    }
  } catch (error) {
    console.error('保存游戏失败:', error);
  }
};

// 处理存档读取
const handleLoad = async (slot: number, data: any) => {
  try {
    console.log(`从槽位 ${slot} 读取:`, data);

    // 确保存档系统已初始化
    if (!isSaveSystemInitialized.value) {
      await initializeSaveSystem();
    }

    // 从指定槽位加载游戏
    console.log(`[handleLoad] 开始加载槽位 ${slot}`);
    const gameData = await modularSaveManager.loadFromSlot({ slot });
    if (gameData) {
      // 调试日志：记录加载后的游戏数据
      console.log(
        `[handleLoad] 加载后游戏数据中的行动力: ${gameData.baseResources.actionPoints}/${gameData.baseResources.maxActionPoints}`,
      );
      console.log(
        `[handleLoad] 加载后响应式状态中的行动力: ${modularSaveManager.resources.value.actionPoints}/${modularSaveManager.resources.value.maxActionPoints}`,
      );

      // 恢复基础资源
      restoreBaseResources(gameData.baseResources);

      // 调试日志：恢复后的最终行动力
      console.log(
        `[handleLoad] 恢复后最终行动力: ${modularSaveManager.resources.value.actionPoints}/${modularSaveManager.resources.value.maxActionPoints}`,
      );

      // 巢穴数据现在由数据库系统处理，不需要单独恢复
      // 建筑槽位和历史记录数据现在由数据库系统管理

      // 恢复探索数据
      const explorationData = gameData.exploration;
      if (explorationData) {
        // 导入探索服务
        const { exploreService } = await import('./探索/服务/探索服务');
        await exploreService.restoreFromSaveData(explorationData);
        console.log('探索数据已恢复');
      }

      // 恢复历史记录中的最后一个回合信息
      // 重新从模块化存档管理器获取最新的历史记录数据
      const historyData = modularSaveManager.getModuleData({ moduleName: 'history' }) as any;
      if (historyData && historyData.roundHistory && historyData.roundHistory.length > 0) {
        // 获取最后一个回合信息（新记录在数组开头）
        const lastRoundInfo = historyData.roundHistory[0];
        latestRoundInfo.value = lastRoundInfo;
        console.log('最后一个回合信息已恢复:', lastRoundInfo);
      } else {
        // 如果没有历史记录，清空显示
        latestRoundInfo.value = null;
        console.log('没有历史记录，清空回合信息显示');
      }

      // 确保大陆探索服务已经初始化（通过 initializeFromSave）
      const { continentExploreService } = await import('./探索/服务/大陆探索服务');
      await continentExploreService.initializeFromSave();

      // 在所有数据加载完成后，重新计算征服进度
      // 延迟执行，确保所有服务都已初始化完成
      setTimeout(() => {
        console.log('🔄 [加载存档] 开始重新计算所有区域和大陆的征服进度...');
        continentExploreService.recalculateAllRegionProgress();
        console.log('✅ [加载存档] 征服进度重新计算完成');
      }, 300);

      console.log(`游戏已从槽位 ${slot} 加载`);
    }

    // 关闭存档界面
    showSaveLoadModal.value = false;
  } catch (error) {
    console.error('加载游戏失败:', error);
  }
};

// 处理存档错误
const handleSaveError = async (error: string) => {
  console.error('存档错误:', error);
  await ConfirmService.showDanger(error, '存档错误', '请检查存档文件是否损坏或权限是否足够');
};

// 关闭存档界面
const handleCloseSaveModal = () => {
  showSaveLoadModal.value = false;
};

// 处理开始新游戏
const handleInitGame = async () => {
  try {
    console.log('开始新游戏...');

    // 确保存档系统已初始化
    if (!isSaveSystemInitialized.value) {
      await initializeSaveSystem();
    }

    // 清理旧数据（但保留 IndexedDB 存档）
    modularSaveManager.resetResources();

    // 创建新游戏数据
    modularSaveManager.createNewGame();

    // 重置游戏状态
    gameState.value = null;
    latestRoundInfo.value = null;

    // 建筑数据现在由数据库系统处理

    // 初始化探索数据
    const { exploreService } = await import('./探索/服务/探索服务');
    exploreService.resetExploreData();
    console.log('探索数据已初始化');

    // 初始化建筑数据

    // 保存当前游戏状态到模块化系统（包含建筑数据）
    saveCurrentGameState();

    // 确保资源世界书条目在新游戏开始时也被创建
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

    // 等待大陆探索服务初始化完成
    await new Promise(resolve => setTimeout(resolve, 200));

    // 获取大陆数据
    const continents2 = continentExploreService.continents.value || [];
    console.log('🔍 [app.vue] 新游戏获取到的大陆数据:', continents2);

    await WorldbookService.initializeResourcesWorldbook(currentResources, continents2);
    console.log('新游戏资源世界书条目初始化完成');

    console.log('新游戏开始完成');
  } catch (error) {
    console.error('开始新游戏失败:', error);
  }
};

// 打开历史记录弹窗
const openHistoryModal = () => {
  showHistoryModal.value = true;
};

// 关闭历史记录弹窗
const closeHistoryModal = () => {
  showHistoryModal.value = false;
};

// 打开剧情总结界面
const openStorySummaryModal = () => {
  showStorySummaryModal.value = true;
};

// 关闭剧情总结界面
const closeStorySummaryModal = () => {
  showStorySummaryModal.value = false;
};

// 初始化建筑数据到全局建筑系统
const initializeBuildingData = () => {
  try {
    // 建筑数据现在由数据库系统处理
    console.log('建筑数据初始化已由数据库系统处理');
  } catch (error) {
    console.error('初始化建筑数据失败:', error);
  }
};

// 获取资源图标
const getResourceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    gold: '💰',
    food: '🍖',
    threat: '⚠️',
    slaves: '🔒',
    normalGoblins: '👺',
    warriorGoblins: '⚔️',
    shamanGoblins: '🔮',
    paladinGoblins: '✨',
    trainingSlaves: '💋',
    rounds: '🔄',
  };
  return icons[type] || '❓';
};

// 获取资源名称
const getResourceName = (type: string): string => {
  const names: Record<string, string> = {
    gold: '金钱',
    food: '食物',
    threat: '威胁',
    slaves: '俘虏',
    normalGoblins: '普通哥布林',
    warriorGoblins: '战士哥布林',
    shamanGoblins: '萨满哥布林',
    paladinGoblins: '圣骑士哥布林',
    trainingSlaves: '调教人物',
    rounds: '回合',
  };
  return names[type] || type;
};

// 处理人物回合逻辑
const processCharacterTurn = () => {
  try {
    // 获取调教数据
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    if (!trainingData || !trainingData.characters) return;

    const characters = trainingData.characters;
    let hasChanges = false;
    const breedingResults: any[] = []; // 收集生育结果用于历史记录

    // 处理每个角色的回合逻辑
    characters.forEach((character: any) => {
      if (character.status === 'imprisoned' || character.status === 'surrendered' || character.status === 'deployed') {
        // 待命状态和已堕落/已编制状态下每回合增加体力和生育值
        const rarityMultiplier = getRarityMultiplier(character.rating || 'D');
        const loyaltyBonus = Math.floor(character.loyalty / 20); // 每20点忠诚度+1点加成
        const staminaGain = 10 * rarityMultiplier + loyaltyBonus;
        const fertilityGain = 10 * rarityMultiplier + loyaltyBonus;

        // 使用角色的最大属性值来限制恢复
        const maxStamina = character.maxStamina || 200;
        const maxFertility = character.maxFertility || 200;
        character.stamina = Math.min(maxStamina, character.stamina + staminaGain);
        character.fertility = Math.min(maxFertility, character.fertility + fertilityGain);
        hasChanges = true;
      } else if (character.status === 'player') {
        // 玩家角色每回合恢复体力（不需要生育值）
        const rarityMultiplier = getRarityMultiplier(character.rating || 'D');
        const loyaltyBonus = Math.floor(character.loyalty / 30);
        const staminaGain = 10 * rarityMultiplier + loyaltyBonus;

        const maxStamina = character.maxStamina || 200;
        character.stamina = Math.min(maxStamina, character.stamina + staminaGain);
        hasChanges = true;
      } else if (character.status === 'training') {
        // 处理调教完成
        // 未堕落人物正常处理调教完成
        character.loyalty = Math.min(100, character.loyalty + Math.floor(Math.random() * 10) + 5);

        // 检查堕落值是否达到100%，提示玩家可以手动触发堕落
        if (character.loyalty >= 100) {
          console.log(`${character.name} 调教完成，堕落值已满，可以手动触发堕落！`);
          character.status = 'imprisoned'; // 保持关押状态，等待手动堕落
        } else {
          character.status = 'imprisoned';
          console.log(`${character.name} 调教完成，忠诚度提升`);
        }

        hasChanges = true;
      } else if (character.status === 'breeding') {
        // 处理交配完成 - 使用生育服务计算
        const currentRound = modularSaveManager.resources.value.rounds || 1;
        const breedingResult = BreedingService.calculateBreeding(character, currentRound);

        // 保存生育前的状态，用于生育完成后恢复
        const originalStatus = character.originalStatus || 'imprisoned';

        // 更新角色信息
        character.offspring += breedingResult.totalOffspring;

        // 更新角色等级（基于后代数量）
        character.level = Math.floor(character.offspring / 10);

        // 生育消耗生育值（完全基于生育数量和评级）
        const getRatingFertilityMultiplier = (rating: string) => {
          switch (rating) {
            case 'S':
              return 0.5; // S级角色生育消耗最少
            case 'A':
              return 0.7;
            case 'B':
              return 0.8; // 基准消耗
            case 'C':
              return 0.9;
            case 'D':
              return 1.0; // D级角色生育消耗最多
            default:
              return 1.0;
          }
        };

        const ratingMultiplier = getRatingFertilityMultiplier(character.rating || 'D');

        // 已堕落状态额外降低50%消耗
        const surrenderedMultiplier = originalStatus === 'surrendered' ? 0.5 : 1.0;

        const baseFertilityLoss = breedingResult.totalOffspring * 3 * ratingMultiplier;
        const fertilityLoss = Math.ceil(baseFertilityLoss * surrenderedMultiplier); // 应用已堕落加成
        character.fertility = Math.max(0, character.fertility - fertilityLoss);

        const statusText = originalStatus === 'surrendered' ? '已堕落(-50%)' : '';
        console.log(
          `${character.name} 生育${breedingResult.totalOffspring}个后代，评级${character.rating || 'D'}(×${ratingMultiplier})${statusText}，消耗生育值 ${fertilityLoss} 点，当前生育值: ${character.fertility}`,
        );

        // 生育过程中缓慢增加堕落值（比调教效果更温和）
        const corruptionGain = Math.floor(Math.random() * 3) + 1; // 1-3点堕落值增长
        character.loyalty = Math.min(100, character.loyalty + corruptionGain);
        console.log(`${character.name} 生育过程中堕落值增加 ${corruptionGain} 点，当前堕落值: ${character.loyalty}`);

        // 生育完成后恢复到生育前的状态
        character.status = originalStatus;
        console.log(`${character.name} 生育完成，恢复到${originalStatus === 'surrendered' ? '已堕落' : '关押'}状态`);

        character.locationId = undefined; // 释放交配间

        // 添加生育记录到角色
        if (!character.breedingRecords) {
          character.breedingRecords = [];
        }
        character.breedingRecords.push(...breedingResult.records);

        // 更新玩家角色等级（基于我方最高等级人物）
        PlayerLevelService.checkAndUpdatePlayerLevel();

        // 将生育的哥布林添加到资源中
        breedingResult.records.forEach(record => {
          switch (record.type) {
            case '普通哥布林':
              modularSaveManager.addResource(
                'normalGoblins',
                record.count,
                `${character.name} 生育了 ${record.count} 个普通哥布林`,
              );
              break;
            case '哥布林战士':
              modularSaveManager.addResource(
                'warriorGoblins',
                record.count,
                `${character.name} 生育了 ${record.count} 个哥布林战士`,
              );
              break;
            case '哥布林萨满':
              modularSaveManager.addResource(
                'shamanGoblins',
                record.count,
                `${character.name} 生育了 ${record.count} 个哥布林萨满`,
              );
              break;
            case '哥布林圣骑士':
              modularSaveManager.addResource(
                'paladinGoblins',
                record.count,
                `${character.name} 生育了 ${record.count} 个哥布林圣骑士`,
              );
              break;
          }
        });

        // 收集生育结果用于历史记录
        breedingResults.push({
          characterName: character.name,
          totalOffspring: breedingResult.totalOffspring,
          records: breedingResult.records,
          rating: character.rating || 'D',
        });

        hasChanges = true;
        console.log(`${character.name} 交配完成，生育了 ${breedingResult.totalOffspring} 个哥布林`);
        console.log('生育详情:', BreedingService.formatBreedingRecords(breedingResult.records));
      }
    });

    // 如果有变化，更新数据
    if (hasChanges) {
      modularSaveManager.updateModuleData({
        moduleName: 'training',
        data: trainingData,
      });
      console.log('人物回合逻辑处理完成');
    }

    // 返回生育结果供回合结束记录使用
    return breedingResults;
  } catch (error) {
    console.error('处理人物回合逻辑失败:', error);
    return [];
  }
};

// 获取稀有度系数
const getRarityMultiplier = (rating: string) => {
  const multipliers: Record<string, number> = {
    S: 3,
    A: 2.5,
    B: 2,
    C: 1.5,
    D: 1,
  };
  return multipliers[rating] || 1;
};

// 将哥布林类型映射到资源名称
const mapGoblinTypeToResource = (goblinType: string): string => {
  const mapping: Record<string, string> = {
    普通哥布林: 'normalGoblins',
    哥布林战士: 'warriorGoblins',
    哥布林萨满: 'shamanGoblins',
    哥布林圣骑士: 'paladinGoblins',
  };
  return mapping[goblinType] || goblinType;
};

// 结束回合
const endRound = async () => {
  try {
    console.log('开始处理回合结束...');

    // 处理人物回合逻辑，获取生育结果
    const breedingResults = processCharacterTurn();

    // 处理巢穴收入
    const nestResult = modularSaveManager.processNestIncome();
    console.log('巢穴收入处理结果:', nestResult);

    // 处理奴隶生育逻辑
    const currentSlaves = modularSaveManager.resources.value.slaves || 0;
    const currentRound = modularSaveManager.resources.value.rounds || 0;
    const slaveBreedingResult = BreedingService.processSlaveBreeding(currentSlaves, currentRound);

    console.log('奴隶生育结果:', slaveBreedingResult);

    // 更新奴隶数量（减去死亡数量）
    if (slaveBreedingResult.deadSlaves > 0) {
      modularSaveManager.consumeResource('slaves', slaveBreedingResult.deadSlaves, '奴隶死亡');
    }

    // 添加新生育的普通哥布林
    if (slaveBreedingResult.newGoblins > 0) {
      modularSaveManager.addResource('normalGoblins', slaveBreedingResult.newGoblins, '奴隶生育');
    }

    // 增加回合数
    modularSaveManager.addResource('rounds', 1, '回合结束');

    // 恢复行动力到上限
    const currentMaxActionPoints = modularSaveManager.resources.value.maxActionPoints;
    modularSaveManager.setResource('actionPoints', currentMaxActionPoints);
    console.log(`行动力已恢复到上限: ${currentMaxActionPoints}`);

    // 触发日期更新动画（日期会自动响应式更新）
    triggerDateUpdateAnimation();

    // 聚合资源变化
    const aggregatedChanges = aggregateResourceChanges(nestResult.changes);

    // 添加奴隶死亡到资源变化中（总是显示）
    if (slaveBreedingResult.deadSlaves > 0) {
      aggregatedChanges.push({
        type: 'slaves',
        amount: -slaveBreedingResult.deadSlaves,
        reason: '奴隶死亡',
      });
    }

    // 添加生育信息到资源变化中（汇总显示）
    if (breedingResults && breedingResults.length > 0) {
      // 按评级排序：S > A > B > C > D
      const ratingOrder: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
      breedingResults.sort((a, b) => (ratingOrder[b.rating] || 0) - (ratingOrder[a.rating] || 0));

      // 只取前两个人
      const topBreedingResults = breedingResults.slice(0, 2);

      // 汇总所有角色的生育数据
      const breedingSummary: Record<string, number> = {};
      topBreedingResults.forEach(result => {
        result.records.forEach((record: any) => {
          const resourceType = mapGoblinTypeToResource(record.type);
          breedingSummary[resourceType] = (breedingSummary[resourceType] || 0) + record.count;
        });
      });

      // 将奴隶生育的哥布林合并到人物生育中
      if (slaveBreedingResult.newGoblins > 0) {
        breedingSummary['normalGoblins'] = (breedingSummary['normalGoblins'] || 0) + slaveBreedingResult.newGoblins;
      }

      // 将汇总的生育数据添加到资源变化中
      Object.entries(breedingSummary).forEach(([type, amount]) => {
        aggregatedChanges.push({
          type: type,
          amount: amount,
        });
      });
    } else if (slaveBreedingResult.newGoblins > 0) {
      // 只有在没有人物生育时才显示奴隶生育
      aggregatedChanges.push({
        type: 'normalGoblins',
        amount: slaveBreedingResult.newGoblins,
        reason: '奴隶生育',
      });
    }

    // 创建回合标题，包含生育信息
    let roundTitle = `第${modularSaveManager.resources.value.rounds - 1}回合结束`;
    const titleParts: string[] = [];

    if (breedingResults && breedingResults.length > 0) {
      const topBreedingResults = breedingResults.slice(0, 2);
      const breedingNames = topBreedingResults.map(result => result.characterName).join('、');
      titleParts.push(`${breedingNames} 生育了哥布林`);
    } else if (slaveBreedingResult.newGoblins > 0) {
      // 只有在没有人物生育时才显示奴隶生育信息
      titleParts.push(`奴隶生育了 ${slaveBreedingResult.newGoblins} 个哥布林`);
    }

    if (titleParts.length > 0) {
      roundTitle += ` (${titleParts.join('；')})`;
    }

    // 创建回合信息
    const roundInfo = {
      title: roundTitle,
      changes: aggregatedChanges,
      timestamp: Date.now(),
    };

    // 更新最新回合信息
    latestRoundInfo.value = roundInfo;

    // 添加到历史记录（通过历史记录组件）
    if (historyModalRef.value) {
      historyModalRef.value.addHistoryEntry(roundInfo);
    }

    // 保存游戏状态
    saveCurrentGameState();

    // 同步繁殖间占用信息到巢穴模块
    console.log('开始同步繁殖间占用信息...');
    try {
      syncBreedingRoomInfo();
      console.log('繁殖间占用信息同步完成');
    } catch (error) {
      console.error('同步繁殖间占用信息失败:', error);
    }

    console.log('开始更新世界书状态...');

    // 更新资源世界书条目
    try {
      console.log('开始更新资源世界书...');
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
      const continents3 = continentExploreService.continents.value || [];

      await WorldbookService.updateResourcesWorldbook(currentResources, continents3);
      console.log('资源世界书更新完成');
    } catch (error) {
      console.error('更新资源世界书失败:', error);
    }

    // 更新人物世界书状态（因为人物可能生育了，需要同步更新）
    console.log('开始更新人物世界书状态...');
    try {
      const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
      if (trainingData && trainingData.characters) {
        const characters = trainingData.characters;
        let updatedCount = 0;

        // 批量更新所有人物信息到世界书
        for (const character of characters) {
          // 跳过player角色
          if (character.status === 'player') {
            continue;
          }

          try {
            await WorldbookService.updateCharacterEntry(character);
            updatedCount++;
          } catch (error) {
            console.error(`更新人物 ${character.name} 的世界书失败:`, error);
            // 继续处理其他人物，不中断整个流程
          }
        }

        console.log(`人物世界书更新完成，共更新 ${updatedCount} 个人物`);
      } else {
        console.log('没有人物数据需要更新到世界书');
      }
    } catch (error) {
      console.error('更新人物世界书状态失败:', error);
      // 不影响回合结束的其他流程
    }

    // 检查随机事件（回合开始事件）
    console.log('检查回合开始随机事件...');
    if (randomEventManagerRef.value) {
      randomEventManagerRef.value.checkRoundStartEvents();
    }

    // 检查是否需要总结
    console.log('检查是否需要总结...');
    try {
      const checkResult = await SummaryCheckService.checkIfSummaryNeeded();
      needsSummary.value = checkResult.needsSummary;

      if (checkResult.needsSummary) {
        const message = SummaryCheckService.getSummaryMessage(checkResult);
        console.log('⚠️ 检测到需要总结:', message);
        // 触发按钮高亮效果会在后续响应式更新中自动生效
      }
    } catch (error) {
      console.error('检查总结需要性失败:', error);
    }

    console.log('回合结束处理完成');
  } catch (error) {
    console.error('结束回合失败:', error);
    // 显示错误信息
    latestRoundInfo.value = {
      title: '回合结束失败',
      changes: [],
      timestamp: Date.now(),
    };
  }
};

// 聚合资源变化
const aggregateResourceChanges = (changes: any[]): any[] => {
  const aggregated: Record<string, number> = {};

  changes.forEach(change => {
    if (aggregated[change.type]) {
      aggregated[change.type] += change.amount;
    } else {
      aggregated[change.type] = change.amount;
    }
  });

  return Object.entries(aggregated).map(([type, amount]) => ({
    type,
    amount,
  }));
};

// 监听楼层增加事件
onMounted(async () => {
  // 初始化存档系统
  await initializeSaveSystem();

  // 界面第一次重载时，清空人物档案世界书并更新资源世界书
  try {
    console.log('界面重载：开始清理世界书...');

    // 清空所有人物档案和剧情记录世界书条目
    await WorldbookService.clearCharacterAndStoryEntries();
    console.log('已清空所有人物档案和剧情记录世界书条目');

    // 获取当前资源状态
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
    const continents4 = continentExploreService.continents.value || [];

    // 更新资源世界书到初始状态
    await WorldbookService.updateResourcesWorldbook(currentResources, continents4);
    console.log('资源世界书已更新到初始状态');
  } catch (error) {
    console.error('清理世界书失败:', error);
  }

  // 初始化建筑数据到全局建筑系统
  initializeBuildingData();

  // 启用自动保存
  enableAutoSave();

  // 清理定时器和事件监听器
  onUnmounted(() => {
    disableAutoSave();
  });

  // 检查是否有保存的游戏
  if (modularSaveManager.getCurrentGameData() !== null) {
    console.log('检测到保存的游戏数据');
  } else {
    console.log('开始新游戏');
  }

  // 检查并显示欢迎弹窗
  if (checkAndShowWelcome()) {
    showWelcomeModal.value = true;
  }
});

// 组件卸载时保存数据
onUnmounted(() => {
  saveCurrentGameState();
});
</script>

<style scoped lang="scss">
.mini-goblin {
  box-sizing: border-box;
  width: 100%;
  height: 800px;
  padding: 10px;
  background: #1a1313;
  color: #f0e6d2;
  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    'Apple Color Emoji',
    'Segoe UI Emoji';
  position: relative;
  isolation: isolate;
  max-width: 100%;
  margin: 0 auto;
}

/* 花纹边框 */
.decorative-border {
  max-width: 100%;
  margin: 0 auto;
  position: relative;
  padding: 20px;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(205, 133, 63, 0.1) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(205, 133, 63, 0.1) 20px);
  border: 2px solid rgba(205, 133, 63, 0.3);
  border-radius: 16px;
  box-shadow:
    0 0 30px rgba(205, 133, 63, 0.2),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
  height: calc(100% - 70px);
  margin-bottom: 70px;
}

/* 内容容器 */
.content-wrapper {
  background: rgba(26, 19, 19, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(205, 133, 63, 0.1);
  height: calc(100% - 1px);
  overflow-y: auto;
}

/* 标题样式 */
.header {
  position: relative;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;

  .header-center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .main-title {
    margin: 0;
    font-size: 28px;
    letter-spacing: 2px;
    color: #ffd7a1;
    text-shadow:
      0 2px 6px rgba(0, 0, 0, 0.6),
      0 0 12px rgba(255, 120, 40, 0.3);
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -8px;
      transform: translateX(-50%);
      width: 80%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 180, 120, 0.6), transparent);
    }
  }
}

/* 底部导航栏样式 */
.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border-top: 1px solid rgba(205, 133, 63, 0.3);
  display: flex;
  justify-content: space-around;
  padding: 6px 0;
  z-index: 100;
  backdrop-filter: blur(10px);

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #f0e6d2;
    text-decoration: none;
    padding: 2px 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    min-width: 50px;

    .icon {
      font-size: 18px;
      filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
    }

    .label {
      font-size: 10px;
      opacity: 0.7;
    }

    &.active {
      background: rgba(205, 133, 63, 0.2);
      color: #ffd7a1;

      .icon {
        filter: drop-shadow(0 2px 4px rgba(205, 133, 63, 0.4));
      }

      .label {
        opacity: 1;
        font-weight: 700;
      }
    }

    &:hover:not(.active) {
      background: rgba(205, 133, 63, 0.1);
      transform: translateY(-1px);
    }

    &.center-nav {
      background: linear-gradient(180deg, rgba(255, 120, 60, 0.2), rgba(205, 133, 63, 0.1));
      border: 1px solid rgba(255, 120, 60, 0.4);
      transform: scale(1.1);
      z-index: 10;
      position: relative;
      padding: 4px 12px;

      &:hover {
        background: linear-gradient(180deg, rgba(255, 120, 60, 0.3), rgba(205, 133, 63, 0.2));
        border-color: rgba(255, 120, 60, 0.6);
        transform: scale(1.15) translateY(-1px);
      }

      &.active {
        background: linear-gradient(180deg, rgba(255, 120, 60, 0.4), rgba(205, 133, 63, 0.3));
        border-color: rgba(255, 120, 60, 0.7);
        color: #ffd7a1;
        box-shadow: 0 0 20px rgba(255, 120, 60, 0.3);
      }

      .icon {
        font-size: 20px;
        filter: drop-shadow(0 2px 4px rgba(255, 120, 60, 0.4));
      }

      .label {
        font-weight: 700;
        opacity: 1;
      }
    }
  }
}

/* 统计卡片样式 */
.stats-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;

  .stats-row {
    display: flex;
    gap: 12px;
    justify-content: space-between;

    .stats-card {
      background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 12px;
      padding: 12px;
      box-shadow:
        inset 0 1px 0 rgba(255, 200, 150, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.3);
      flex: 1;

      &.time-info {
        .time-content {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;

          .date {
            color: #ffe9d2;
            font-size: 16px;
            font-weight: 700;
            transition: all 0.3s ease;
          }

          .season {
            color: #ffe9d2;
            font-size: 16px;
            font-weight: 700;
            opacity: 0.9;
            transition: all 0.3s ease;
          }

          &.date-updated {
            .date {
              color: #22c55e;
            }

            .season {
              color: #22c55e;
            }
          }
        }
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .icon {
          font-size: 20px;
          filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
        }

        .value {
          color: #ffe9d2;
          font-size: 16px;
          font-weight: 700;
        }
      }
    }
  }

  /* 资源网格样式 */
  .resources-grid {
    display: grid;
    gap: 12px;
    margin-top: 6px;

    /* 默认四个并列 */
    grid-template-columns: repeat(4, 1fr);

    /* 电脑端可以八个并列一行 */
    @media (min-width: 769px) {
      &.eight-columns {
        grid-template-columns: repeat(8, 1fr);
      }
    }

    .resource-item {
      background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 12px;
      padding: 12px;
      box-shadow:
        inset 0 1px 0 rgba(255, 200, 150, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          inset 0 1px 0 rgba(255, 200, 150, 0.12),
          0 6px 16px rgba(0, 0, 0, 0.4);
        border-color: rgba(205, 133, 63, 0.4);
      }

      .resource-icon {
        font-size: 28px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        margin-bottom: 8px;
      }

      .resource-value {
        color: #ffe9d2;
        font-size: 18px;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
    }
  }

  /* 行动力显示样式 */
  .action-points-row {
    margin-top: 6px;

    .action-points-card {
      background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 8px;
      padding: 6px 12px;
      box-shadow:
        inset 0 1px 0 rgba(255, 200, 150, 0.08),
        0 4px 12px rgba(0, 0, 0, 0.3);

      .action-points-display {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        padding: 2px 0;

        .action-point {
          font-size: 16px;
          transition: all 0.4s ease;
          cursor: default;
          position: relative;

          &.filled {
            filter: drop-shadow(0 0 6px rgba(255, 100, 120, 0.8));
            animation: heartPulse 1.8s ease-in-out infinite;
          }

          &:not(.filled) {
            opacity: 0.3;
            filter: drop-shadow(0 0 2px rgba(150, 150, 150, 0.2));
          }

          &:hover {
            transform: scale(1.15);
          }
        }
      }
    }
  }
}

/* 操作按钮区域 */
.action-buttons {
  margin: 20px 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: nowrap;

  .action-btn {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
    border: 1px solid rgba(205, 133, 63, 0.3);
    border-radius: 12px;
    padding: 12px 20px;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    color: #f0e6d2;

    &:hover {
      transform: translateY(-2px);
      box-shadow:
        inset 0 1px 0 rgba(255, 200, 150, 0.12),
        0 6px 16px rgba(0, 0, 0, 0.4);
      border-color: rgba(205, 133, 63, 0.5);
    }

    .icon {
      font-size: 16px;
      filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
    }

    .text {
      font-weight: 600;
      font-size: 14px;
    }

    &.save-load-btn {
      &:hover {
        background: linear-gradient(180deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.3));
        border-color: rgba(168, 85, 247, 0.5);
        color: #a855f7;
      }
    }

    &.round-btn {
      &:hover {
        background: linear-gradient(180deg, rgba(220, 38, 38, 0.2), rgba(185, 28, 28, 0.3));
        border-color: rgba(220, 38, 38, 0.5);
        color: #dc2626;
      }
    }

    &.story-summary-btn.needs-summary {
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.4));
      border: 2px solid rgba(245, 158, 11, 0.6);
      box-shadow:
        0 0 20px rgba(245, 158, 11, 0.4),
        inset 0 1px 0 rgba(255, 237, 213, 0.3);
      animation: summaryPulse 2s ease-in-out infinite;

      .icon,
      .text {
        color: #fbbf24;
        font-weight: 700;
      }

      &:hover {
        background: linear-gradient(180deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.5));
        border-color: rgba(245, 158, 11, 0.8);
        box-shadow:
          0 0 30px rgba(245, 158, 11, 0.6),
          inset 0 1px 0 rgba(255, 237, 213, 0.4);
        transform: translateY(-2px) scale(1.02);
      }
    }
  }
}

// 总结按钮脉冲动画
@keyframes summaryPulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(245, 158, 11, 0.4),
      inset 0 1px 0 rgba(255, 237, 213, 0.3);
  }
  50% {
    box-shadow:
      0 0 30px rgba(245, 158, 11, 0.7),
      inset 0 1px 0 rgba(255, 237, 213, 0.5);
  }
}

/* 主要按钮样式 */
.primary {
  background: linear-gradient(180deg, #8a3c2c, #65261c);
  border-color: rgba(255, 120, 60, 0.5);
  box-shadow:
    0 8px 16px rgba(110, 30, 15, 0.35),
    inset 0 1px 0 rgba(255, 200, 150, 0.12);

  &:hover {
    background: linear-gradient(180deg, #9a4532, #6e2a1f);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mini-goblin {
    padding: 10px;
  }

  .decorative-border {
    padding: 10px;
  }

  .content-wrapper {
    padding: 15px;
  }

  .header {
    gap: 8px;
  }

  .main-title {
    font-size: 24px;
  }

  .stats-container {
    .resources-grid {
      /* 移动端强制四个并列 */
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;

      .resource-item {
        padding: 8px;

        .resource-icon {
          font-size: 24px;
        }

        .resource-value {
          font-size: 16px;
        }
      }
    }
  }

  .action-buttons {
    gap: 8px;
    margin: 10px 0 !important; /* 减少上下间距从16px到12px */

    .action-btn {
      padding: 10px 16px;
      min-width: 0;

      .text {
        font-size: 12px;
      }

      .icon {
        font-size: 14px;
      }
    }
  }

  .info-display {
    margin-top: 10px !important; /* 减少上间距从20px到12px */
  }
}

/* 信息显示区域样式 */
.info-display {
  margin-top: 20px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  padding: 16px;
  position: relative;

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(205, 133, 63, 0.2);

    .info-title {
      color: #ffd7a1;
      font-size: 16px;
      font-weight: 700;
    }

    .history-btn {
      background: rgba(205, 133, 63, 0.2);
      border: 1px solid rgba(205, 133, 63, 0.3);
      border-radius: 6px;
      padding: 4px 8px;
      color: #f0e6d2;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 4px;

      &:hover {
        background: rgba(205, 133, 63, 0.3);
        transform: scale(1.05);
      }

      .icon {
        font-size: 14px;
      }
    }
  }

  .info-content {
    .round-summary {
      .round-title {
        color: #ffe9d2;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .resource-changes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .resource-change {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          font-size: 12px;

          &.positive {
            border-left: 3px solid #22c55e;
            background: rgba(34, 197, 94, 0.1);
          }

          &.negative {
            border-left: 3px solid #dc2626;
            background: rgba(220, 38, 38, 0.1);
          }

          .resource-icon {
            font-size: 12px;
          }

          .resource-name {
            color: #f0e6d2;
            font-weight: 500;
          }

          .change-amount {
            font-weight: 700;

            &.positive {
              color: #22c55e;
            }

            &.negative {
              color: #dc2626;
            }
          }
        }
      }
    }
  }

  .no-round-info {
    text-align: center;
    padding: 20px;
    color: #9ca3af;

    .no-info-text {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #f0e6d2;
    }

    .no-info-hint {
      font-size: 14px;
      opacity: 0.8;
    }
  }
}

/* 背景动画 */
@keyframes shimmer {
  0% {
    opacity: 0;
    transform: translate(-20%, -20%) scale(1);
  }
  50% {
    opacity: 0.3;
    transform: translate(12%, 2%) scale(1.06);
  }
  100% {
    opacity: 0;
    transform: translate(28%, 8%) scale(1);
  }
}

/* 心跳脉冲动画 */
@keyframes heartPulse {
  0% {
    filter: drop-shadow(0 0 6px rgba(255, 100, 120, 0.8));
    transform: scale(1);
  }
  25% {
    filter: drop-shadow(0 0 10px rgba(255, 150, 170, 1));
    transform: scale(1.08);
  }
  50% {
    filter: drop-shadow(0 0 6px rgba(255, 100, 120, 0.8));
    transform: scale(1);
  }
  75% {
    filter: drop-shadow(0 0 8px rgba(255, 120, 140, 0.9));
    transform: scale(1.04);
  }
  100% {
    filter: drop-shadow(0 0 6px rgba(255, 100, 120, 0.8));
    transform: scale(1);
  }
}

.mini-goblin::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(transparent 23px, rgba(255, 180, 120, 0.08) 24px) 0 0 / 24px 24px,
    linear-gradient(90deg, transparent 23px, rgba(255, 180, 120, 0.08) 24px) 0 0 / 24px 24px,
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.025) 0 2px, transparent 3px) 0 0 / 24px 24px,
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.02) 0 2px, transparent 3px) 12px 12px / 24px 24px,
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.02) 0 1px, transparent 1px 6px),
    radial-gradient(80% 60% at 50% 0%, #241515 0%, #120c0c 60%, #0e0b0b 100%);
  filter: contrast(1.05) saturate(0.9);
  z-index: -1;
  animation: shimmer 6s ease-in-out infinite;
}
</style>
