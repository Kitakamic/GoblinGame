<template>
  <div v-if="showEventDialog" class="event-dialog-overlay" @click="closeEventDialog">
    <div class="event-dialog" @click.stop>
      <!-- 使用通用对话界面组件 -->
      <GenericDialogueInterface :dialogue-config="dialogueConfig" @close="handleCloseEvent" @end-dialogue="endEvent" />
    </div>

    <!-- 世界书保存确认弹窗 -->
    <CustomConfirmDialog
      v-if="showSaveConfirm"
      :show="showSaveConfirm"
      title="保存事件故事"
      :message="saveConfirmMessage"
      confirm-text="保存到世界书"
      cancel-text="不保存"
      @confirm="saveToWorldbook"
      @cancel="closeWithoutSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import CustomConfirmDialog from '../../../共享资源层/组件/自定义确认框.vue';
import GenericDialogueInterface from '../../../共享资源层/通用对话界面/通用对话界面.vue';
import { WorldbookService } from '../../../核心层/服务/世界书管理/服务/世界书服务';
import { modularSaveManager } from '../../../核心层/服务/存档系统/模块化存档服务';
import { TimeParseService } from '../../../核心层/服务/通用服务/时间解析服务';
import { RandomEventService } from '../服务/随机事件服务';
import { RandomEvent } from '../类型/事件类型';

interface Props {
  event?: RandomEvent;
  show?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'event-completed', event: RandomEvent, result: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  event: undefined,
  show: false,
});

const emit = defineEmits<Emits>();

// 显示状态
const showEventDialog = ref(false);
const showSaveConfirm = ref(false);

// 事件服务
const eventService = RandomEventService.getInstance();

// AI回复内容存储
const aiReplyContent = ref('');

// 保存确认消息
const saveConfirmMessage = computed(() => {
  if (!props.event) return '';

  return `是否将"${props.event.name}"的故事内容保存到世界书中？\n\n✅ 已获取到AI回复内容\n\n这将帮助AI更好地构建游戏世界的发展历程。`;
});

// 对话配置
const dialogueConfig = computed(() => {
  if (!props.event) {
    return {
      title: '随机事件',
      subtitle: '未知事件',
      welcomeText: '🎭 事件开始',
      welcomeHint: '一个随机事件发生了...',
      initialOptions: [{ text: '继续', label: '继续', value: 'continue' }],
      saveKey: 'random_event',
    };
  }

  return {
    ...props.event.dialogueConfig,
    saveKey: `event_${props.event.id}`,
    // 添加AI回复回调，用于获取AI回复内容
    onAIReply: async (content: string, _characterName: string) => {
      console.log('AI回复内容:', content);
      aiReplyContent.value = content;
    },
  };
});

// 监听显示状态变化
const updateShowState = () => {
  showEventDialog.value = props.show && !!props.event;
};

// 处理关闭事件（只在有AI回复时显示保存确认弹窗）
const handleCloseEvent = () => {
  if (props.event && props.event.dialogueConfig.onDialogueClose) {
    // 调用事件的关闭回调
    props.event.dialogueConfig.onDialogueClose();
  }

  // 只有在有AI回复内容时才显示保存确认弹窗
  if (aiReplyContent.value && aiReplyContent.value.trim()) {
    showSaveConfirm.value = true;
  } else {
    // 没有AI回复内容，直接关闭
    closeEventDialog();
  }
};

// 关闭事件对话框
const closeEventDialog = () => {
  showEventDialog.value = false;
  showSaveConfirm.value = false;
  emit('close');
};

// 保存到世界书
const saveToWorldbook = async () => {
  if (!props.event) {
    closeEventDialog();
    return;
  }

  try {
    // 构建事件内容（这里可以根据实际对话内容调整）
    const eventContent = buildEventContent();

    // 获取当前游戏时间
    const currentGameTime = getCurrentGameTime();

    // 直接使用世界书服务保存
    await WorldbookService.createEventStoryRecord(props.event.id, props.event.name, eventContent, currentGameTime);

    console.log(`事件故事已保存到世界书: ${props.event.name}`);
  } catch (error) {
    console.error('保存事件故事到世界书失败:', error);
  } finally {
    closeEventDialog();
  }
};

// 获取当前游戏时间
const getCurrentGameTime = (): string => {
  // 获取当前回合数（这里需要从游戏状态中获取）
  // 暂时使用一个默认值，实际使用时应该从游戏状态中获取
  const rounds = modularSaveManager.resources.value.rounds;

  // 使用时间解析服务获取格式化的游戏时间
  const timeInfo = TimeParseService.getTimeInfo(rounds, true);

  // 返回包含季节信息的格式化时间
  return `${timeInfo.formattedDate}`;
};

// 不保存直接关闭
const closeWithoutSave = () => {
  closeEventDialog();
};

// 结束事件
const endEvent = () => {
  if (props.event) {
    // 处理事件结果
    const result = eventService.processEventResult(props.event, 'completed');
    emit('event-completed', props.event, result);
  }
  handleCloseEvent(); // 使用新的关闭处理逻辑
};

/**
 * 删除HTML代码块
 * 用于保存到世界书时清理AI回复中可能包含的HTML代码块
 */
const removeHtmlCodeBlocks = (content: string): string => {
  let cleaned = content;

  // 1. 删除 markdown 格式的 HTML 代码块：```html ... ```
  cleaned = cleaned.replace(/```html\s*[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```HTML\s*[\s\S]*?```/gi, '');

  // 2. 删除 markdown 格式的代码块（可能是HTML）：``` ... ```（如果内容看起来像HTML）
  // 匹配包含 <html> 或 <!DOCTYPE html> 的代码块
  cleaned = cleaned.replace(/```[\s\S]*?<html[\s\S]*?```/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?<!DOCTYPE\s+html[\s\S]*?```/gi, '');

  // 3. 删除独立的 <!DOCTYPE html> ... </html> 代码块（不在代码块中的）
  cleaned = cleaned.replace(/<!DOCTYPE\s+html[\s\S]*?<\/html>/gi, '');

  // 4. 清理多余的空白字符和换行
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n') // 多个换行合并为两个
    .trim();

  return cleaned;
};

// 构建事件内容
const buildEventContent = (): string => {
  if (!props.event) return '';

  // 只使用AI回复内容，不使用基础信息
  if (aiReplyContent.value && aiReplyContent.value.trim()) {
    console.log('使用AI回复内容作为事件内容:', aiReplyContent.value.substring(0, 100) + '...');

    // 删除HTML代码块（防止AI回复中包含HTML代码被保存到世界书）
    const cleanedContent = removeHtmlCodeBlocks(aiReplyContent.value);

    if (cleanedContent !== aiReplyContent.value) {
      console.log('🧹 已删除AI回复中的HTML代码块');
    }

    return cleanedContent;
  }

  // 如果没有AI回复内容，返回空字符串（不保存）
  return '';
};

// 组件挂载时初始化
onMounted(() => {
  updateShowState();
});

// 监听props变化
watch(() => props.show, updateShowState);
watch(() => props.event, updateShowState);
</script>

<style lang="scss">
.event-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
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

.event-dialog {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .event-dialog {
    max-width: 100vw;
    max-height: 100vh;
    padding: 8px;
  }
}
</style>
