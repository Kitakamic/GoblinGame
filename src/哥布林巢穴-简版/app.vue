<template>
  <div class="mini-goblin">
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>

    <!-- 底部导航栏 -->
    <nav class="bottom-nav">
      <router-link to="/探索" class="nav-item" active-class="active">
        <span class="icon">🗺️</span>
        <span class="label">探索</span>
      </router-link>
      <router-link to="/编制" class="nav-item" active-class="active">
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
import { onMounted, onUnmounted, ref } from 'vue';
import GlobalFAB from './共享资源层/组件/全局悬浮球.vue';
import TextStyleSettings from './共享资源层/组件/文字样式设置.vue';
import WelcomeModal from './共享资源层/组件/欢迎提示弹窗.vue';
import GameSettingsPanel from './共享资源层/组件/游戏设置面板.vue';
import GenerationErrorPanel from './共享资源层/组件/生成错误提示.vue';
import CustomConfirm from './共享资源层/组件/自定义确认框.vue';
import DebugPanel from './共享资源层/组件/调试界面.vue';
import { continentExploreService } from './功能模块层/探索/服务/大陆探索服务';
import { WorldbookService } from './核心层/服务/世界书管理/服务/世界书服务';
import { modularSaveManager } from './核心层/服务/存档系统/模块化存档服务';
import { checkAndShowWelcome, markWelcomeAsShown } from './核心层/服务/通用服务/欢迎提示服务';
import { ConfirmService, confirmState } from './核心层/服务/通用服务/确认框服务';

// 自动保存机制
let autoSaveTimer: number | null = null;
const isSaveSystemInitialized = ref(false);

const enableAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  // 每5分钟自动保存一次
  autoSaveTimer = setInterval(async () => {
    try {
      if (isSaveSystemInitialized.value) {
        await modularSaveManager.saveCurrentGameData(0, '自动存档');
        console.log('自动保存完成');
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }, 300000); // 5分钟 = 5 * 60 * 1000 = 300000毫秒
};

// 禁用自动保存
const disableAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
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

  // 启用自动保存
  enableAutoSave();

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

onUnmounted(() => {
  disableAutoSave();
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
