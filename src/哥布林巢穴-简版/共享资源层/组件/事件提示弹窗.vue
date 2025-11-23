<template>
  <div v-if="show" class="event-notification-overlay">
    <div class="event-notification-dialog" @click.stop>
      <div class="dialog-header">
        <div class="header-icon">⚠️</div>
        <h3 class="dialog-title">事件发生</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="dialog-content">
        <!-- 秘书官信息 -->
        <div v-if="secretary" class="secretary-info">
          <div class="secretary-avatar">
            <img v-if="secretaryAvatar" :src="secretaryAvatar" :alt="secretary.name" />
            <div v-else class="default-avatar">
              <span class="avatar-icon">👤</span>
            </div>
          </div>
          <div class="secretary-details">
            <div class="secretary-name">{{ secretary.name }}</div>
            <div class="secretary-title">{{ secretary.title }}</div>
          </div>
        </div>

        <div class="event-info">
          <div class="event-name">{{ event?.name }}</div>
          <div class="event-description">{{ event?.description }}</div>
        </div>

        <div class="button-group">
          <button class="action-btn primary-btn" @click="handleListenReport">
            <span class="btn-icon">👂</span>
            <span class="btn-text">{{ secretary ? `听取${secretary.name}的汇报` : '听取汇报' }}</span>
          </button>
          <button class="action-btn secondary-btn" @click="handleWriteReport">
            <span class="btn-icon">📋</span>
            <span class="btn-text">{{ secretary ? `让${secretary.name}写一份报告给我` : '写一份报告给我' }}</span>
          </button>
          <button class="action-btn tertiary-btn" @click="handleIgnore">
            <span class="btn-icon">❌</span>
            <span class="btn-text">{{
              secretary ? `告诉${secretary.name}：你再说什么呀，断无此疏` : '你再说什么呀，断无此疏'
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { AvatarSwitchService } from '../../功能模块层/人物管理/服务/头像切换服务';
import type { Character } from '../../功能模块层/人物管理/类型/人物类型';
import { AudienceHallService } from '../../功能模块层/巢穴/服务/谒见厅服务';
import type { RandomEvent } from '../../功能模块层/随机事件/类型/事件类型';

interface Props {
  show: boolean;
  event: RandomEvent | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'listen-report', event: RandomEvent): void;
  (e: 'write-report', event: RandomEvent): void;
  (e: 'ignore', event: RandomEvent): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 谒见厅服务
const audienceHallService = AudienceHallService.getInstance();

// 秘书官信息
const secretary = ref<Character | null>(null);

// 秘书官头像
const secretaryAvatar = computed(() => {
  if (!secretary.value) return null;
  return AvatarSwitchService.getAvatarByCorruptionLevel(secretary.value) || null;
});

// 加载秘书官
const loadSecretary = () => {
  try {
    const availableCharacters = audienceHallService.loadAvailableCharacters();
    const loadedSecretary = audienceHallService.loadSavedSecretary(availableCharacters);
    secretary.value = loadedSecretary;
  } catch (error) {
    console.error('加载秘书官失败:', error);
    secretary.value = null;
  }
};

// 监听显示状态，每次显示时重新加载秘书官
onMounted(() => {
  loadSecretary();
});

// 监听显示状态变化
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      loadSecretary();
    }
  },
);

const handleClose = () => {
  emit('close');
};

const handleListenReport = () => {
  if (props.event) {
    emit('listen-report', props.event);
  }
  handleClose();
};

const handleWriteReport = () => {
  if (props.event) {
    emit('write-report', props.event);
  }
  handleClose();
};

const handleIgnore = () => {
  if (props.event) {
    emit('ignore', props.event);
  }
  handleClose();
};
</script>

<style scoped lang="scss">
.event-notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.event-notification-dialog {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 16px;
  width: 90%;
  max-width: 550px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  animation: slideIn 0.3s ease;
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

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.3);

  .header-icon {
    font-size: 32px;
  }

  .dialog-title {
    flex: 1;
    margin: 0;
    color: #ffd7a1;
    font-size: 20px;
    font-weight: 700;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(205, 133, 63, 0.4);
    border-radius: 8px;
    color: #ffd7a1;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
      border-color: rgba(205, 133, 63, 0.6);
    }
  }
}

.dialog-content {
  padding: 24px;
}

/* 秘书官信息 */
.secretary-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  margin-bottom: 20px;

  .secretary-avatar {
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
        font-size: 32px;
        opacity: 0.7;
        color: #ffd7a1;
      }
    }
  }

  .secretary-details {
    flex: 1;
    min-width: 0;

    .secretary-name {
      color: #ffd7a1;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .secretary-title {
      color: #9ca3af;
      font-size: 13px;
    }
  }
}

.event-info {
  margin-bottom: 24px;

  .event-name {
    color: #ffd7a1;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .event-description {
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.6;
  }
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  text-align: left;

  .btn-icon {
    font-size: 24px;
    line-height: 1;
    flex-shrink: 0;
  }

  .btn-text {
    color: #ffd7a1;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(205, 133, 63, 0.6);
    transform: translateY(-2px);
  }

  &.primary-btn {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.3));
    border-color: rgba(168, 85, 247, 0.5);

    &:hover {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(147, 51, 234, 0.4));
      border-color: rgba(168, 85, 247, 0.7);
    }
  }

  &.secondary-btn {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
    border-color: rgba(59, 130, 246, 0.5);

    &:hover {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.4));
      border-color: rgba(59, 130, 246, 0.7);
    }
  }

  &.tertiary-btn {
    background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.3));
    border-color: rgba(107, 114, 128, 0.5);

    &:hover {
      background: linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.4));
      border-color: rgba(107, 114, 128, 0.7);
    }
  }
}
</style>
