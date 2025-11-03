<template>
  <div class="battle-summary-container">
    <div class="summary-panel">
      <!-- 头部信息 -->
      <div class="summary-header">
        <div class="summary-info">
          <div class="summary-title">
            <h3>{{ summaryConfig.title }}</h3>
            <div class="summary-subtitle">{{ summaryConfig.subtitle }}</div>
          </div>
        </div>
        <div class="header-buttons">
          <button
            class="header-btn regenerate-btn"
            title="重新生成总结"
            :disabled="isGenerating"
            @click="regenerateSummary"
          >
            <span class="btn-icon">🔄</span>
          </button>
          <button class="header-btn close-btn" title="关闭总结界面" @click="closeSummary">
            <span class="btn-icon">✕</span>
          </button>
        </div>
      </div>

      <!-- 总结内容区域 -->
      <div class="summary-shell">
        <div class="summary-viewport">
          <div class="summary-content">
            <!-- 生成中的状态 -->
            <div v-if="isGenerating" class="generating-state">
              <div class="generating-animation">
                <div class="spinner"></div>
                <p class="generating-text">正在生成战斗总结...</p>
              </div>
            </div>

            <!-- 总结内容 -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-else-if="summaryContent" class="summary-text typo-book" v-html="formattedSummary"></div>

            <!-- 初始空白状态 -->
            <div v-else class="initial-state">
              <div class="initial-welcome">
                <p class="welcome-text">{{ summaryConfig.welcomeText }}</p>
                <p class="welcome-hint">{{ summaryConfig.welcomeHint }}</p>
              </div>
              <div class="initial-actions">
                <button class="generate-btn" :disabled="isGenerating" @click="generateSummary">
                  {{ isGenerating ? '生成中...' : '🎯 生成战斗总结' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { MessageService } from '../../../共享资源层/消息/消息服务';
import { generateWithChainOfThought } from '../../../核心层/服务/世界书管理/工具/AI生成助手';
import { ChainOfThoughtMode } from '../../../核心层/服务/世界书管理/工具/思维链管理器';
import { toast } from '../../../核心层/服务/通用服务/弹窗提示服务';
import { BattleSummaryService } from '../服务/战斗总结服务';

// 战斗总结配置接口
interface BattleSummaryConfig {
  title: string;
  subtitle?: string;
  welcomeText: string;
  welcomeHint: string;
  battleData: any; // 战斗数据
  initialSummary?: string; // 初始总结内容（用于恢复已生成的总结）
  onSummaryGenerated?: (summary: string) => void;
  onSummarySaved?: (summary: string) => void;
  onClose?: () => void;
  saveKey?: string; // 用于数据持久化的键
}

interface Props {
  summaryConfig: BattleSummaryConfig;
}

interface Emits {
  (e: 'close'): void;
  (e: 'summary-generated', summary: string): void;
  (e: 'summary-saved', summary: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态管理
const isGenerating = ref(false);
const summaryContent = ref('');

// 暂存当前总结，不立即保存到世界书
const pendingSummary = ref<string | null>(null);

// 格式化总结内容
const formattedSummary = computed(() => {
  if (!summaryContent.value) return '';
  return MessageService.formatMessage(summaryContent.value, {
    enableMarkdown: true,
    enableCodeHighlight: true,
    enableQuote: true,
  });
});

// 生成战斗总结（不保存到世界书的版本）
const generateSummaryWithoutSaving = async (): Promise<string> => {
  // 构建战斗总结提示词
  const prompt = BattleSummaryService.buildBattleSummaryPrompt(props.summaryConfig.battleData);

  // 监听流式传输事件
  const handleStreamToken = (fullText: string) => {
    // 应用酒馆正则处理
    const formatted = formatAsTavernRegexedString(fullText, 'ai_output', 'display');

    // 实时更新显示内容
    summaryContent.value = formatted;

    console.log('📝 流式传输更新:', formatted.substring(0, 50) + '...');
  };

  // 注册流式传输事件监听
  eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

  try {
    // 读取全局流式传输设置
    const globalVars = getVariables({ type: 'global' });
    const enableStreamOutput =
      typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : true; // 默认开启

    // 使用带思维链的AI生成（战斗总结模式）
    const response = await generateWithChainOfThought(ChainOfThoughtMode.BATTLE_SUMMARY, {
      user_input: prompt,
      should_stream: enableStreamOutput, // 根据设置启用流式传输
    });

    // 移除事件监听
    eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

    // 应用酒馆正则处理AI回复
    console.log('🧹 原始AI回复:', response);
    const regexResponse = formatAsTavernRegexedString(response, 'ai_output', 'display');
    console.log('🎨 应用酒馆正则后的回复:', regexResponse);

    // 解析AI回复
    const summary = BattleSummaryService.parseBattleSummary(regexResponse);
    return summary;
  } catch (error) {
    // 移除事件监听
    eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);
    throw error;
  }
};

// 生成战斗总结
const generateSummary = async () => {
  if (isGenerating.value) return;

  try {
    isGenerating.value = true;

    // 先保存之前暂存的总结
    await savePendingSummary();

    // 生成新总结（不立即保存到世界书）
    const summary = await generateSummaryWithoutSaving();

    summaryContent.value = summary;

    // 暂存新生成的总结，等待关闭时保存
    pendingSummary.value = summary;
    console.log('📝 暂存战斗总结，等待关闭时保存');

    // 调用生成回调
    if (props.summaryConfig.onSummaryGenerated) {
      props.summaryConfig.onSummaryGenerated(summary);
    }

    emit('summary-generated', summary);
  } catch (error) {
    console.error('生成战斗总结失败:', error);
    toast.error('生成战斗总结失败', { title: 'AI生成失败' });
  } finally {
    isGenerating.value = false;
  }
};

// 保存暂存的总结到世界书
const savePendingSummary = async () => {
  if (pendingSummary.value) {
    console.log('💾 保存暂存的战斗总结到世界书');

    try {
      await BattleSummaryService.saveBattleSummaryToWorldbook(props.summaryConfig.battleData, pendingSummary.value);

      // 调用保存回调
      if (props.summaryConfig.onSummarySaved) {
        props.summaryConfig.onSummarySaved(pendingSummary.value);
      }

      emit('summary-saved', pendingSummary.value);

      pendingSummary.value = null;
      console.log('✅ 战斗总结已保存');
    } catch (error) {
      console.error('❌ 保存战斗总结失败:', error);
    }
  }
};

// 重新生成总结
const regenerateSummary = async () => {
  console.log('🔄 用户点击重新生成按钮，清除暂存并重新生成');

  // 清除暂存的总结
  pendingSummary.value = null;

  // 清空当前内容（这会自动清理流式传输创建的内容）
  summaryContent.value = '';

  // 重新生成（不会立即保存，等待关闭时保存）
  // 注意：流式传输会实时更新 summaryContent.value，所以不需要额外处理
  await generateSummary();
};

// 关闭总结界面
const closeSummary = async () => {
  // 先保存暂存的总结
  await savePendingSummary();

  if (props.summaryConfig.onClose) {
    props.summaryConfig.onClose();
  }
  emit('close');
};

// 加载保存的总结
const loadSavedSummary = () => {
  if (!props.summaryConfig.saveKey) return;

  try {
    const savedSummary = BattleSummaryService.loadBattleSummary(props.summaryConfig.saveKey);
    if (savedSummary) {
      summaryContent.value = savedSummary;
    }
  } catch (error) {
    console.error('加载保存的总结失败:', error);
  }
};

onMounted(() => {
  // 优先使用传入的初始总结
  if (props.summaryConfig.initialSummary) {
    summaryContent.value = props.summaryConfig.initialSummary;
  } else {
    // 否则尝试加载保存的总结
    loadSavedSummary();
  }
});
</script>

<style lang="scss">
@use '../../../共享资源层/样式/对话样式变量.scss' as *;

/* 战斗总结界面样式 - 基于通用对话界面设计 */
.battle-summary-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.06), transparent 40%),
    radial-gradient(circle at 80% 90%, rgba(255, 255, 255, 0.05), transparent 40%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 10, 5, 0.86));
  z-index: 1000;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 8px;
    align-items: stretch;
  }
}

.summary-panel {
  width: min(1000px, 95vw);
  height: min(90vh, 800px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 2px solid rgba(205, 133, 63, 0.35);
  box-shadow:
    0 12px 36px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 200, 150, 0.12);
  background:
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="%23cd8533" fill-opacity="0.08" d="M0 19h2v1H0zm18 0h2v1h-2zM0 0h1v2H0zm19 0h1v2h-1z"/></svg>')
      repeat,
    linear-gradient(180deg, rgba(40, 26, 20, 0.96), rgba(26, 19, 19, 0.95));
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    border-width: 1px;
  }
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border-bottom: 3px solid rgba(205, 133, 63, 0.4);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 200, 150, 0.1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.6), transparent);
  }
}

.summary-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.summary-title {
  flex: 1;
  margin-left: 8px;

  h3 {
    color: #ffd7a1;
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 4px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    letter-spacing: 0.5px;
  }

  .summary-subtitle {
    color: rgba(240, 230, 210, 0.8);
    font-size: 14px;
    font-style: italic;
    opacity: 0.9;
    margin: 0;
  }
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.header-btn {
  background: linear-gradient(135deg, #8a3c2c, #65261c);
  border: 2px solid rgba(255, 120, 60, 0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

  .btn-icon {
    color: #ffd7a1;
    font-size: 16px;
    font-weight: bold;
  }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #9a4c3c, #75362c);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.summary-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 8px 12px;
  min-height: 0;
}

.summary-viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 12px;
  border: 2px solid rgba(205, 133, 63, 0.3);
  background: #1b120f;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 200, 150, 0.1);
}

.summary-content {
  height: auto;
  overflow: visible;
  padding: 24px;
  background:
    radial-gradient(ellipse at top, rgba(255, 255, 255, 0.03), transparent 60%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.15) 0 1px, transparent 1px) repeat-x;
  background-size:
    100% 100%,
    24px 100%;

  @media (max-width: 768px) {
    padding: 12px;
  }
}

.summary-text.typo-book {
  @include typo-book;
}

/* 生成中状态 */
.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.generating-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(205, 133, 63, 0.3);
  border-top: 4px solid #cd853f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.generating-text {
  color: #ffd7a1;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

/* 初始空白状态 */
.initial-state {
  margin-top: 40px;
  text-align: center;
  font-family: 'Georgia', 'Times New Roman', serif;
}

.initial-welcome {
  margin-bottom: 30px;
  padding: 24px;
  background: radial-gradient(ellipse at center, rgba(205, 133, 63, 0.08), transparent 70%);
  border-radius: 12px;
}

.welcome-text {
  color: #ffd7a1;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 12px 0;
  letter-spacing: 1px;
}

.welcome-hint {
  color: rgba(247, 239, 217, 0.7);
  font-size: 16px;
  font-style: italic;
  margin: 0;
  line-height: 1.6;
}

.initial-actions {
  max-width: 400px;
  margin: 0 auto;
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #cd853f, #b8860b);
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 12px;
  color: #f7efd9;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(205, 133, 63, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #daa520, #cd853f);
    box-shadow: 0 6px 16px rgba(205, 133, 63, 0.4);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .summary-header {
    padding: 8px 10px;
  }

  .summary-title h3 {
    font-size: 20px;
  }

  .summary-title .summary-subtitle {
    font-size: 12px;
  }

  .header-btn {
    width: 32px;
    height: 32px;

    .btn-icon {
      font-size: 14px;
    }
  }

  .summary-shell {
    margin: 4px 8px;
  }

  .initial-state {
    margin-top: 20px;
  }

  .initial-welcome {
    padding: 16px;
    margin-bottom: 20px;
  }

  .welcome-text {
    font-size: 18px;
  }

  .welcome-hint {
    font-size: 14px;
  }

  .generate-btn {
    font-size: 16px;
    padding: 14px 20px;
  }
}
</style>
