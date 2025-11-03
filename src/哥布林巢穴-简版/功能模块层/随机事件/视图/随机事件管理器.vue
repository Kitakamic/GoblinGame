<template>
  <div>
    <!-- 随机事件对话框 -->
    <EventDialogueInterface
      v-if="currentEvent"
      :event="currentEvent"
      :show="showEventDialog"
      @close="closeEventDialog"
      @event-completed="handleEventCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RandomEventService } from '../服务/随机事件服务';
import { RandomEvent } from '../类型/事件类型';
import EventDialogueInterface from './事件对话界面.vue';

interface Props {
  currentRound: number;
  gameState?: any;
}

interface Emits {
  (e: 'event-triggered', event: RandomEvent): void;
  (e: 'event-completed', event: RandomEvent, result: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 事件服务
const eventService = RandomEventService.getInstance();

// 当前事件
const currentEvent = ref<RandomEvent | null>(null);
const showEventDialog = ref(false);

/**
 * 检查回合开始事件
 */
const checkRoundStartEvents = () => {
  try {
    const result = eventService.checkRoundStartEvents(props.currentRound, props.gameState);

    if (result.triggered && result.event) {
      console.log('触发随机事件:', result.event.name);
      triggerEvent(result.event);
    } else {
      console.log('未触发随机事件:', result.reason);
    }
  } catch (error) {
    console.error('检查随机事件失败:', error);
  }
};

/**
 * 触发事件
 */
const triggerEvent = (event: RandomEvent) => {
  currentEvent.value = event;
  showEventDialog.value = true;
  emit('event-triggered', event);
};

/**
 * 关闭事件对话框
 */
const closeEventDialog = () => {
  showEventDialog.value = false;
  currentEvent.value = null;
};

/**
 * 处理事件完成
 */
const handleEventCompleted = (event: RandomEvent, result: any) => {
  console.log('事件完成:', event.name, result);
  emit('event-completed', event, result);
  closeEventDialog();
};

// 暴露方法给父组件调用
defineExpose({
  checkRoundStartEvents,
  triggerEvent,
});

// 组件挂载时初始化
onMounted(() => {
  console.log('随机事件管理器已初始化');
});
</script>

<style lang="scss">
/* 随机事件管理器样式 */
</style>
