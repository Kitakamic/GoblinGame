<template>
  <div v-if="show" class="settings-overlay" @click.self="close">
    <div class="settings-panel" @click.stop>
      <div class="panel-header">
        <h3>👑 谒见厅</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="panel-content">
        <!-- 秘书官选择区域 -->
        <div class="settings-section">
          <h4 class="section-title">秘书官</h4>
          <div v-if="selectedSecretary" class="secretary-display">
            <div class="secretary-info-card">
              <div class="secretary-avatar">
                <img
                  v-if="getCurrentAvatar(selectedSecretary)"
                  :src="getCurrentAvatar(selectedSecretary)"
                  :alt="selectedSecretary.name"
                />
                <div v-else class="default-avatar">
                  <span class="avatar-icon">👤</span>
                </div>
              </div>
              <div class="secretary-details">
                <div class="secretary-name">{{ selectedSecretary.name }}</div>
                <div class="secretary-title">{{ selectedSecretary.title }}</div>
                <div class="secretary-stats">
                  <div class="stat-item">
                    <span class="stat-label">忠诚度:</span>
                    <span class="stat-value">{{ selectedSecretary.loyalty }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">等级:</span>
                    <span class="stat-value">{{
                      selectedSecretary.level ?? Math.floor((selectedSecretary.offspring ?? 0) / 10) ?? 1
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
            <button class="action-button" @click="showSecretarySelector = true">更换秘书官</button>
          </div>
          <div v-else class="no-secretary">
            <p class="no-secretary-text">尚未选择秘书官</p>
            <button class="action-button" @click="showSecretarySelector = true">选择秘书官</button>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 事件汇报区域 -->
        <div class="settings-section">
          <h4 class="section-title">事件汇报</h4>
          <div v-if="pendingEvent" class="event-display">
            <div class="event-header">
              <span class="event-icon">⚠️</span>
              <span class="event-name">{{ pendingEvent.name }}</span>
            </div>
            <div class="event-description">{{ pendingEvent.description }}</div>
            <button class="action-button event-button" @click="showEventReport">查看事件详情</button>
          </div>
          <div v-else class="no-event">
            <p>当前没有待处理事件</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 秘书官选择弹窗 -->
    <div v-if="showSecretarySelector" class="settings-overlay" @click.self="showSecretarySelector = false">
      <div class="settings-panel" @click.stop>
        <div class="panel-header">
          <h3>选择秘书官</h3>
          <button class="close-btn" @click="showSecretarySelector = false">×</button>
        </div>
        <div class="panel-content">
          <div v-if="availableCharacters.length === 0" class="no-characters">
            <p>当前没有可用的人物</p>
          </div>
          <div v-else class="character-list">
            <div
              v-for="character in availableCharacters"
              :key="character.id"
              class="character-item"
              :class="{ selected: selectedSecretary?.id === character.id }"
              @click="selectSecretary(character)"
            >
              <div class="character-avatar">
                <img v-if="getCurrentAvatar(character)" :src="getCurrentAvatar(character)" :alt="character.name" />
                <div v-else class="default-avatar">
                  <span class="avatar-icon">👤</span>
                </div>
              </div>
              <div class="character-info">
                <div class="character-name">{{ character.name }}</div>
                <div class="character-title">{{ character.title }}</div>
                <div class="character-stats">
                  <span>忠诚度: {{ character.loyalty }}%</span>
                  <span>等级: {{ character.level ?? Math.floor((character.offspring ?? 0) / 10) ?? 1 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件汇报弹窗 -->
    <EventDialogueInterface
      v-if="showEventDialog && pendingEvent"
      :event="pendingEvent"
      :show="showEventDialog"
      @close="closeEventDialog"
      @event-completed="handleEventCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { AvatarSwitchService } from '../../../功能模块层/人物管理/服务/头像切换服务';
import type { Character } from '../../../功能模块层/人物管理/类型/人物类型';
import { AudienceHallService } from '../../../功能模块层/巢穴/服务/谒见厅服务';
import type { RandomEvent } from '../../../功能模块层/随机事件/类型/事件类型';
import EventDialogueInterface from '../../../功能模块层/随机事件/视图/事件对话界面.vue';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 谒见厅服务
const audienceHallService = AudienceHallService.getInstance();

// 可用人物列表
const availableCharacters = ref<Character[]>([]);

// 选中的秘书官
const selectedSecretary = ref<Character | null>(null);

// 秘书官选择器显示状态
const showSecretarySelector = ref(false);

// 待处理事件
const pendingEvent = ref<RandomEvent | null>(null);
const showEventDialog = ref(false);

// ==================== 方法 ====================

// 获取当前头像
const getCurrentAvatar = (character: Character): string | undefined => {
  const avatar = AvatarSwitchService.getAvatarByCorruptionLevel(character);
  return avatar || undefined;
};

// 加载可用人物
const loadAvailableCharacters = () => {
  availableCharacters.value = audienceHallService.loadAvailableCharacters();
};

// 加载已保存的秘书官
const loadSavedSecretary = () => {
  const secretary = audienceHallService.loadSavedSecretary(availableCharacters.value);
  if (secretary) {
    selectedSecretary.value = secretary;
  }
};

// 选择秘书官
const selectSecretary = (character: Character) => {
  selectedSecretary.value = character;
  showSecretarySelector.value = false;
  audienceHallService.saveSecretary(character);
  console.log('已选择秘书官:', character.name);
};

// 检查随机事件
const checkRandomEvents = () => {
  const event = audienceHallService.checkRandomEvents();
  if (event) {
    pendingEvent.value = event;
  }
};

// 显示事件汇报
const showEventReport = () => {
  if (pendingEvent.value) {
    showEventDialog.value = true;
  }
};

// 关闭事件对话框
const closeEventDialog = () => {
  showEventDialog.value = false;
};

// 处理事件完成
const handleEventCompleted = (_event: RandomEvent, _result: any) => {
  pendingEvent.value = null;
  closeEventDialog();
  console.log('事件已处理完成');
};

// 关闭界面
const close = () => {
  emit('close');
};

// ==================== 生命周期 ====================

onMounted(() => {
  loadAvailableCharacters();
  loadSavedSecretary();
  checkRandomEvents();
});

// 监听显示状态，每次打开时检查事件
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      checkRandomEvents();
    }
  },
);
</script>

<style lang="scss" scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.settings-panel {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 16px;
  width: 90%;
  max-width: 1200px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  animation: slideIn 0.3s ease;

  @media (max-width: 768px) {
    width: 95%;
    max-height: 90vh;
  }

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    margin: 8px 0;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(205, 133, 63, 0.6), rgba(205, 133, 63, 0.4));
    border-radius: 10px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(180deg, rgba(205, 133, 63, 0.8), rgba(205, 133, 63, 0.6));
      border-color: rgba(205, 133, 63, 0.3);
    }

    &:active {
      background: linear-gradient(180deg, rgba(205, 133, 63, 0.9), rgba(205, 133, 63, 0.7));
    }
  }

  /* Firefox滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 133, 63, 0.6) rgba(0, 0, 0, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(205, 133, 63, 0.4);

  h3 {
    margin: 0;
    color: #ffd7a1;
    font-size: 20px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 28px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    line-height: 1;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}

.panel-content {
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.divider {
  height: 1px;
  background: rgba(205, 133, 63, 0.3);
  margin: 24px 0;
}

.settings-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  color: #ffd7a1;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

/* 秘书官显示 */
.secretary-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.secretary-info-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
}

.secretary-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(205, 133, 63, 0.4);
  background: rgba(205, 133, 63, 0.1);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(205, 133, 63, 0.1);

    .avatar-icon {
      font-size: 32px;
      opacity: 0.7;
      color: #ffd7a1;
    }
  }
}

.secretary-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .secretary-name {
    font-size: 18px;
    font-weight: 700;
    color: #ffd7a1;
  }

  .secretary-title {
    font-size: 14px;
    color: #9ca3af;
  }

  .secretary-stats {
    display: flex;
    gap: 16px;
    margin-top: 4px;

    .stat-item {
      display: flex;
      gap: 6px;
      font-size: 13px;

      .stat-label {
        color: #9ca3af;
      }

      .stat-value {
        color: #f0e6d2;
        font-weight: 600;
      }
    }
  }
}

.no-secretary {
  text-align: center;
  padding: 30px 20px;

  .no-secretary-text {
    color: #9ca3af;
    margin-bottom: 16px;
    font-size: 14px;
  }
}

/* 事件显示 */
.event-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .event-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .event-name {
    font-size: 16px;
    font-weight: 700;
    color: #ffd7a1;
  }
}

.event-description {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.6;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 8px;
}

.no-event {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 14px;
}

/* 操作按钮 */
.action-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 8px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  color: #f0e6d2;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 6px 16px rgba(0, 0, 0, 0.4);
    border-color: rgba(205, 133, 63, 0.5);
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.9), rgba(25, 17, 14, 1));
  }

  &.event-button {
    &:hover {
      background: linear-gradient(180deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.3));
      border-color: rgba(251, 191, 36, 0.5);
      color: #fbbf24;
    }
  }
}

/* 人物列表 */
.character-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.character-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
    border-color: rgba(205, 133, 63, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &.selected {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.3));
    border-color: rgba(168, 85, 247, 0.5);
  }

  .character-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(205, 133, 63, 0.4);
    flex-shrink: 0;
    background: rgba(205, 133, 63, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .default-avatar {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(205, 133, 63, 0.1);

      .avatar-icon {
        font-size: 24px;
        opacity: 0.7;
        color: #ffd7a1;
      }
    }
  }

  .character-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .character-name {
      font-size: 16px;
      font-weight: 700;
      color: #ffd7a1;
    }

    .character-title {
      font-size: 13px;
      color: #9ca3af;
    }

    .character-stats {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }
  }
}

.no-characters {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 14px;
}
</style>
