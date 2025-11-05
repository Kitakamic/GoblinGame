<template>
  <div class="generic-dialogue-container">
    <div class="dialogue-panel">
      <!-- 头部信息 -->
      <div class="dialogue-header">
        <div class="dialogue-info">
          <div class="dialogue-title">
            <h3>{{ dialogueConfig.title }}</h3>
            <div class="dialogue-subtitle">{{ dialogueConfig.subtitle }}</div>
          </div>
        </div>
        <div class="header-buttons">
          <button class="header-btn edit-btn" title="编辑当前页消息" @click="editCurrentPageMessage()">
            <span class="btn-icon">✏️</span>
          </button>
          <!-- 删除按钮已隐藏 -->
          <!-- <button class="header-btn delete-btn" title="删除当前页消息" @click="deleteCurrentPageMessage()">
          <span class="btn-icon">🗑️</span>
        </button> -->
          <button
            v-if="showRetryButton"
            class="header-btn retry-btn"
            title="重新生成AI回复"
            @click="retryAIGeneration()"
          >
            <span class="btn-icon">🔄</span>
          </button>
          <button class="header-btn close-btn" title="关闭对话界面" @click="closeDialogue">
            <span class="btn-icon">✕</span>
          </button>
        </div>
      </div>

      <!-- 消息列表区域 -->
      <div class="dialogue-shell">
        <div class="dialogue-nav">
          <button class="nav-btn" :disabled="currentPageIndex <= 0" @click="prevPage">上一页</button>
          <div class="nav-info">{{ currentPageIndex + 1 }} / {{ pages.length || 1 }}</div>
          <button class="nav-btn" :disabled="currentPageIndex >= pages.length - 1" @click="nextPage">下一页</button>
        </div>

        <div ref="dialogueContent" class="dialogue-viewport">
          <div class="page">
            <div class="page-inner">
              <!-- 当前页内容 -->
              <div
                v-if="pages[currentPageIndex]"
                class="page-content typo-book"
                v-html="pages[currentPageIndex].html"
              ></div>

              <!-- 初始空白状态的提示 -->
              <div v-if="pages.length === 0" class="initial-state">
                <div class="initial-welcome">
                  <p class="welcome-text">{{ dialogueConfig.welcomeText }}</p>
                  <p class="welcome-hint">{{ dialogueConfig.welcomeHint }}</p>
                </div>
                <div class="initial-options">
                  <div class="option-choices">
                    <!-- 初始选项 -->
                    <span
                      v-for="(opt, i) in initialOptions"
                      :key="`initial-opt-${i}`"
                      class="inline-option"
                      :class="{ disabled: isSending }"
                      @click="!isSending && chooseInitialOption(opt)"
                    >
                      <span class="option-bracket">[</span><span class="option-content">{{ opt.text }}</span
                      ><span class="option-bracket">]</span>
                    </span>

                    <!-- 自定义选项 -->
                    <span
                      v-if="dialogueConfig.showCustomInput === true"
                      class="inline-option custom-option"
                      :class="{ disabled: isSending }"
                      @click="openCustomInputPanel"
                    >
                      <span class="option-bracket">[</span><span class="option-content">自定义</span
                      ><span class="option-bracket">]</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 本页末尾的选项（融入文字，仅在最新一页显示） -->
              <div
                v-if="currentPageIndex === pages.length - 1 && (options.length > 0 || pages.length > 0)"
                class="inline-options"
              >
                <div class="option-choices">
                  <!-- 前三个选项 -->
                  <span
                    v-for="(opt, i) in options"
                    :key="`opt-${i}`"
                    class="inline-option"
                    :class="{ disabled: isSending }"
                    @click="!isSending && chooseOption(opt)"
                  >
                    <span class="option-bracket">[</span><span class="option-content">{{ opt.text }}</span
                    ><span class="option-bracket">]</span>
                  </span>

                  <!-- 第四个选项：自定义输入 -->
                  <span
                    v-if="(options.length > 0 || pages.length > 0) && dialogueConfig.showCustomInput === true"
                    class="inline-option custom-option"
                    :class="{ disabled: isSending }"
                    @click="openCustomInputPanel"
                  >
                    <span class="option-bracket">[</span><span class="option-content">自定义</span
                    ><span class="option-bracket">]</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义输入面板 -->
    <div v-if="showCustomInputPanel && dialogueConfig.showCustomInput === true" class="custom-input-overlay">
      <div class="custom-input-panel" @click.stop>
        <div class="custom-input-header">
          <h3>自定义输入</h3>
          <button class="close-panel-btn" @click="closeCustomInputPanel">✕</button>
        </div>
        <div class="custom-input-body">
          <textarea
            v-model="customOptionText"
            class="custom-input-textarea"
            :placeholder="customPlaceholder"
            :disabled="isSending"
            rows="5"
            @keydown.enter.exact="submitCustomOption"
          ></textarea>
        </div>
        <div class="custom-input-footer">
          <button class="submit-btn" :disabled="!customOptionText.trim() || isSending" @click="submitCustomOption">
            {{ isSending ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editingMessageIndex >= 0" class="edit-dialog-overlay">
      <div class="edit-dialog" @click.stop>
        <div class="edit-dialog-header">
          <h3>编辑消息</h3>
          <button class="close-dialog-btn" @click="cancelEdit">✕</button>
        </div>
        <div class="edit-dialog-body">
          <textarea v-model="editingContent" class="edit-textarea" rows="8" placeholder="编辑消息内容..."></textarea>
        </div>
        <div class="edit-dialog-footer">
          <button class="save-btn" @click="saveEdit">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 删除确认框 -->
  <CustomConfirm
    :show="showDeleteConfirm"
    :title="deleteConfirmState.title"
    :message="deleteConfirmState.message"
    :details="deleteConfirmState.details"
    :confirm-text="deleteConfirmState.confirmText"
    :cancel-text="deleteConfirmState.cancelText"
    :show-cancel="deleteConfirmState.showCancel"
    :show-close="deleteConfirmState.showClose"
    :type="deleteConfirmState.type"
    @confirm="confirmDeleteMessage"
    @cancel="cancelDeleteMessage"
    @close="cancelDeleteMessage"
  />
</template>

<script setup lang="ts">
import { nextTick, onMounted } from 'vue';
import { MessageService } from '../../共享资源层/消息/消息服务';
import { useMessageChat } from '../../共享资源层/消息/消息聊天';
import { OptionParseService } from '../../功能模块层/调教/服务/选项解析服务';
import CustomConfirm from '../组件/自定义确认框.vue';

// 对话配置接口
interface DialogueConfig {
  title: string;
  subtitle?: string;
  welcomeText: string;
  welcomeHint: string;
  customPlaceholder?: string;
  initialOptions?: DialogueOption[];
  onOptionSelect?: (option: DialogueOption) => void;
  onCustomInput?: (text: string) => void;
  onAIGenerate?: (userInput: string) => Promise<string>;
  onDialogueClose?: () => void;
  onAIReply?: (aiResponse: string, characterName: string) => Promise<void>; // AI回复后的回调
  onUserMessage?: (userMessage: string) => Promise<void>; // 用户消息的回调
  saveKey?: string; // 用于数据持久化的键
  showMorale?: boolean; // 是否显示士气
  morale?: number; // 士气值
  characterName?: string; // AI角色名称
  showCustomInput?: boolean; // 是否显示自定义输入区域
  onRetry?: () => Promise<void> | void; // 重试前的回调，用于恢复状态（如士气值）
}

// 对话选项接口
interface DialogueOption {
  text: string;
  label?: string;
  value?: any;
}

interface Props {
  dialogueConfig: DialogueConfig;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 聊天功能
const {
  messages,
  containerRef: dialogueContent,
  addUserMessage,
  addAIMessage,
} = useMessageChat({ autoLoadHistory: false });

const isSending = ref(false);

// 重试状态
const showRetryButton = ref(false);

// 当前流式传输的页面索引（用于重试时删除）
const currentStreamingPageIndex = ref(-1);

// 最后一次生成创建的页面索引（用于重试时删除）
const lastGeneratedPageIndex = ref(-1);

// 暂存当前对话对，不立即保存到世界书
const currentDialoguePair = ref<{
  userInput: string;
  aiResponse: string;
} | null>(null);

// 暂存最后一次用户输入，用于与AI回复一起保存
const lastUserInput = ref<string>('');

// 选项结构
const options = ref<DialogueOption[]>([]);

// 初始选项
const initialOptions = ref<DialogueOption[]>(
  props.dialogueConfig.initialOptions || [
    { text: '继续对话', label: '继续' },
    { text: '询问详情', label: '询问' },
    { text: '结束对话', label: '结束' },
  ],
);

// 书籍分页数据
interface PageItem {
  html: string;
}
const pages = ref<PageItem[]>([]);
const currentPageIndex = ref(0);

const prevPage = () => {
  if (currentPageIndex.value > 0) currentPageIndex.value -= 1;
};
const nextPage = () => {
  if (currentPageIndex.value < pages.value.length - 1) currentPageIndex.value += 1;
};

// 将一条AI消息渲染为书页（不自动滚动到底部）
const pushAIPageWithoutScroll = (raw: string) => {
  // 先提取content标签
  const contentMatch = raw.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
  const contentExtracted = contentMatch && contentMatch[1] ? contentMatch[1].trim() : raw;
  const html = safeFormatMessage(filterXmlTags(contentExtracted));
  pages.value.push({ html });
};

// 将用户选择附加到当前页末尾
const appendChoiceToCurrentPage = (text: string) => {
  if (pages.value.length === 0) return;
  const last = pages.value[pages.value.length - 1];
  last.html += `<div class="choice-line"><span class="choice-prefix">→</span> ${safeFormatMessage(text)}</div>`;
};

// 自定义选项
const customOptionText = ref('');
const customPlaceholder = props.dialogueConfig.customPlaceholder || '输入你的选择…';
const showCustomInputPanel = ref(false);

// 打开自定义输入面板
const openCustomInputPanel = () => {
  if (isSending.value || props.dialogueConfig.showCustomInput === false) return;
  showCustomInputPanel.value = true;
  nextTick(() => {
    const input = document.querySelector('.custom-input-panel textarea') as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  });
};

// 关闭自定义输入面板
const closeCustomInputPanel = () => {
  showCustomInputPanel.value = false;
  customOptionText.value = '';
};

const submitCustomOption = async () => {
  const text = customOptionText.value.trim();
  if (!text || isSending.value) return;

  // 关闭输入面板
  closeCustomInputPanel();

  // 处理自定义输入
  if (props.dialogueConfig.onCustomInput) {
    props.dialogueConfig.onCustomInput(text);
  }

  // 作为选择附加并继续
  addUserMessage(text);
  appendChoiceToCurrentPage(text);

  // 先保存之前暂存的对话对
  await savePendingDialogue();

  // 暂存用户输入，等待AI回复后一起保存
  lastUserInput.value = text;
  console.log('📝 暂存用户自定义输入:', text);

  // 清空当前选项
  options.value = [];
  saveCurrentOptions();

  await generateAndHandleAIReply();
};

onMounted(async () => {
  // 历史消息加载已移至世界书系统，不再需要从 modularSaveManager 加载
  // 只有在有历史消息时才尝试解析选项
  if (pages.value.length > 0) {
    parseOptionsFromLastAIMessage();
  }
});

// 构建用户提示词
const buildUserPrompt = (): string => {
  const latestUserMessage = messages.value.filter(msg => msg.role === 'user').pop();
  if (latestUserMessage) {
    return latestUserMessage.content;
  }
  return '';
};

// 选择一个选项并发送
const chooseOption = async (opt: DialogueOption) => {
  if (isSending.value) return;

  // 处理选项选择
  let shouldContinue = true;
  if (props.dialogueConfig.onOptionSelect) {
    const result = props.dialogueConfig.onOptionSelect(opt);
    // 如果 onOptionSelect 返回 false，则停止继续处理
    if (typeof result === 'boolean' && result === false) {
      shouldContinue = false;
    }
  }

  // 只有在应该继续时才添加用户消息和继续处理
  if (shouldContinue) {
    const choiceText = opt.text;
    addUserMessage(choiceText);
    appendChoiceToCurrentPage(choiceText);

    // 先保存之前暂存的对话对
    await savePendingDialogue();

    // 暂存用户选择，等待AI回复后一起保存
    lastUserInput.value = choiceText;
    console.log('📝 暂存用户选择:', choiceText);

    // 清空当前选项
    options.value = [];
    saveCurrentOptions();

    await generateAndHandleAIReply();
  } else {
    // 如果选择忽略，直接关闭对话
    console.log('选项选择被阻止，直接关闭对话');
    // 清空当前选项
    options.value = [];
    saveCurrentOptions();

    // 直接触发对话关闭
    setTimeout(() => {
      closeDialogue();
    }, 100);
  }
};

// 选择初始选项
const chooseInitialOption = async (opt: DialogueOption) => {
  if (isSending.value) return;
  const choiceText = opt.text;

  // 处理选项选择
  let shouldContinue = true;
  if (props.dialogueConfig.onOptionSelect) {
    const result = props.dialogueConfig.onOptionSelect(opt);
    // 如果 onOptionSelect 返回 false，则停止继续处理
    if (typeof result === 'boolean' && result === false) {
      shouldContinue = false;
    }
  }

  // 只有在应该继续时才添加用户消息和继续处理
  if (shouldContinue) {
    addUserMessage(choiceText);

    // 先保存之前暂存的对话对
    await savePendingDialogue();

    // 暂存用户初始选择，等待AI回复后一起保存
    lastUserInput.value = choiceText;
    console.log('📝 暂存用户初始选择:', choiceText);

    // 创建第一页并添加选择
    const formattedChoice = `<div class="choice-line"><span class="choice-prefix">→</span> ${safeFormatMessage(choiceText)}</div>`;
    pages.value.push({ html: formattedChoice });
    currentPageIndex.value = 0;

    await generateAndHandleAIReply();
  } else {
    // 如果选择忽略，直接关闭对话
    console.log('初始选项选择被阻止，直接关闭对话');
    // 直接触发对话关闭
    setTimeout(() => {
      closeDialogue();
    }, 100);
  }
};

// 调用AI并处理回复
const generateAndHandleAIReply = async () => {
  let aiResponse = '';
  let isAISuccess = false;

  try {
    isSending.value = true;

    // 流式传输相关变量
    currentStreamingPageIndex.value = -1;
    lastGeneratedPageIndex.value = -1; // 重置最后生成的页面索引

    // 监听流式传输事件
    const handleStreamToken = (fullText: string) => {
      // 应用酒馆正则处理
      const formatted = formatAsTavernRegexedString(fullText, 'ai_output', 'display');

      // 提取content标签包裹的内容
      const contentMatch = formatted.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
      const contentExtracted = contentMatch && contentMatch[1] ? contentMatch[1].trim() : formatted;

      // 如果有临时页面，更新它；否则创建新页面
      if (currentStreamingPageIndex.value >= 0) {
        pages.value[currentStreamingPageIndex.value].html = safeFormatMessage(contentExtracted);
      } else {
        currentStreamingPageIndex.value = pages.value.length;
        pages.value.push({ html: safeFormatMessage(contentExtracted) });
        currentPageIndex.value = currentStreamingPageIndex.value;
      }

      // 流式传输时智能滚动（只在用户未手动滚动时跟随）
      const globalVars = getVariables({ type: 'global' });
      const enableStreamOutput =
        typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : true;
      MessageService.scrollToBottom(dialogueContent.value, {
        enableStreamFollow: enableStreamOutput,
      });

      // console.log('📝 流式传输更新:', formatted.substring(0, 50) + '...');
    };

    // 注册流式传输事件监听
    eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

    try {
      if (props.dialogueConfig.onAIGenerate) {
        // 使用自定义AI生成函数（流式传输会在后台执行，通过事件监听实时更新UI）
        aiResponse = await props.dialogueConfig.onAIGenerate(buildUserPrompt());
      } else {
        // 读取全局流式传输设置
        const globalVars = getVariables({ type: 'global' });
        const enableStreamOutput =
          typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : true; // 默认开启

        // 使用默认AI生成
        const response = await window.TavernHelper.generate({
          user_input: buildUserPrompt(),
          should_stream: enableStreamOutput, // 根据设置启用流式传输
        });
        aiResponse = response;
      }

      // 移除事件监听
      eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

      // 注意：保留 currentStreamingPageIndex，在生成完成后检查是否需更新页面
    } catch (error) {
      // 移除事件监听
      eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

      // 生成失败时删除流式创建的页面并重置索引
      if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
        pages.value.splice(currentStreamingPageIndex.value, 1);
      }
      currentStreamingPageIndex.value = -1;

      throw error;
    }

    // 检查AI回复是否为空或无效
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.warn('⚠️ AI回复为空，跳过处理');
      const { toast } = await import('../../核心层/服务/通用服务/弹窗提示服务');
      toast.warning('AI回复为空，请重试');

      // 生成失败时删除流式创建的页面并重置索引
      if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
        pages.value.splice(currentStreamingPageIndex.value, 1);
      }
      currentStreamingPageIndex.value = -1;

      // AI回复为空时，显示重试按钮而不是清空用户输入
      if (lastUserInput.value) {
        console.log('🔄 AI回复为空，显示重试按钮，保留用户输入:', lastUserInput.value);
        showRetryButton.value = true;
      }
      return;
    }

    isAISuccess = true;

    // 成功生成时显示重试按钮，允许重新生成
    showRetryButton.value = true;

    // 先应用酒馆正则处理（在解析选项之前）
    const tavernProcessedResponse = formatAsTavernRegexedString(aiResponse, 'ai_output', 'display');
    console.log('🎨 应用酒馆正则后的内容:', tavernProcessedResponse);

    // 解析选项（从原始文本中，因为酒馆正则可能会影响JSON解析）
    const parsed = OptionParseService.parseNextStepOptions(aiResponse);
    options.value = parsed.options;

    // 保存选项到存档
    saveCurrentOptions();

    // 剔除JSON数据，只保留角色回复内容（使用已经酒馆正则处理过的文本）
    const cleanedResponse = removeJsonFromResponse(tavernProcessedResponse);
    console.log('🧹 清理后的回复内容:', cleanedResponse);

    // 提取content标签包裹的内容（在最后处理）
    const contentMatch = cleanedResponse.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
    const contentExtracted = contentMatch && contentMatch[1] ? contentMatch[1].trim() : cleanedResponse;
    console.log('📦 [通用对话] 提取content标签后的内容:', contentExtracted.substring(0, 100) + '...');

    // 不再重复应用酒馆正则，因为已经处理过了
    const formattedResponse = contentExtracted;
    console.log('🎨 最终显示内容:', formattedResponse);

    addAIMessage(formattedResponse, 'AI');

    // 如果流式传输已经创建了页面，就更新它；否则创建新页面
    if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
      // 更新流式传输创建的页面
      pages.value[currentStreamingPageIndex.value].html = safeFormatMessage(formattedResponse);
      currentPageIndex.value = currentStreamingPageIndex.value;
      lastGeneratedPageIndex.value = currentStreamingPageIndex.value; // 记录创建的页面索引
      console.log('✅ 更新流式传输创建的页面:', currentStreamingPageIndex.value);
    } else {
      // 追加新书页
      console.log('📄 创建新页面（非流式传输）');
      pushAIPageWithoutScroll(formattedResponse);
      // 自动切换到最新页
      currentPageIndex.value = pages.value.length - 1;
      lastGeneratedPageIndex.value = currentPageIndex.value; // 记录创建的页面索引
    }

    // 重置流式页面索引（在更新/创建完成后）
    currentStreamingPageIndex.value = -1;

    // AI回复成功后，暂存用户输入和AI回复，等待用户下一步操作时再保存到世界书
    if (isAISuccess && lastUserInput.value) {
      currentDialoguePair.value = {
        userInput: lastUserInput.value,
        aiResponse: formattedResponse,
      };
      console.log('📝 暂存对话对，等待用户下一步操作时保存:', currentDialoguePair.value);

      // 调用AI回复回调（用于处理副作用，如士气变化），但不保存到世界书
      // 保存到世界书的操作延迟到用户下一步操作时进行
      if (props.dialogueConfig.onAIReply) {
        try {
          await props.dialogueConfig.onAIReply(formattedResponse, props.dialogueConfig.characterName || 'AI');
        } catch (error) {
          console.error('AI回复回调执行失败:', error);
        }
      }
    }
  } catch (error) {
    console.error('AI生成失败:', error);
    const { toast } = await import('../../核心层/服务/通用服务/弹窗提示服务');
    toast.error('AI生成失败');

    // AI生成失败时，显示重试按钮而不是清空用户输入
    if (lastUserInput.value) {
      console.log('🔄 AI生成失败，显示重试按钮，保留用户输入:', lastUserInput.value);
      showRetryButton.value = true;
    }
  } finally {
    isSending.value = false;
  }
};

// 保存当前选项
const saveCurrentOptions = () => {
  if (!props.dialogueConfig.saveKey) return;

  try {
    const optionsData = {
      options: options.value,
      timestamp: Date.now(),
    };
    const characterVars = getVariables({ type: 'character' });
    characterVars[`dialogue_options_${props.dialogueConfig.saveKey}`] = JSON.stringify(optionsData);
    replaceVariables(characterVars, { type: 'character' });
  } catch (error) {
    console.error('保存选项失败:', error);
  }
};

// 加载保存的选项
const loadSavedOptions = () => {
  if (!props.dialogueConfig.saveKey) return false;

  try {
    const characterVars = getVariables({ type: 'character' });
    const savedOptionsJson = characterVars[`dialogue_options_${props.dialogueConfig.saveKey}`];
    if (savedOptionsJson) {
      const optionsData = JSON.parse(savedOptionsJson);
      options.value = optionsData.options || [];
      return true;
    }
  } catch (error) {
    console.error('加载选项失败:', error);
  }
  return false;
};

// 从最后一条AI消息尝试解析选项
const parseOptionsFromLastAIMessage = () => {
  if (pages.value.length === 0) return;

  // 首先尝试加载保存的选项
  if (loadSavedOptions()) {
    return;
  }

  // 如果没有保存的选项，尝试从最后一条消息解析
  const lastAI = [...messages.value].reverse().find(m => m.role === 'assistant');
  if (!lastAI) return;
  const rawText = lastAI.content;
  const result = OptionParseService.parseNextStepOptions(rawText);
  options.value = result.options;

  // 保存解析出的选项
  if (options.value.length > 0) {
    saveCurrentOptions();
  }
};

// 保存暂存的对话对到世界书
const savePendingDialogue = async () => {
  if (currentDialoguePair.value) {
    console.log('💾 保存暂存的对话对到世界书:', currentDialoguePair.value);

    // 如果配置了onUserMessage和onAIReply回调，则使用它们
    if (props.dialogueConfig.onUserMessage) {
      try {
        await props.dialogueConfig.onUserMessage(currentDialoguePair.value.userInput);
      } catch (error) {
        console.error('保存用户消息失败:', error);
      }
    }

    if (props.dialogueConfig.onAIReply) {
      try {
        await props.dialogueConfig.onAIReply(
          currentDialoguePair.value.aiResponse,
          props.dialogueConfig.characterName || 'AI',
        );
      } catch (error) {
        console.error('保存AI回复失败:', error);
      }
    }

    currentDialoguePair.value = null;
    console.log('✅ 对话对已保存');
  }
};

// 重试AI生成
const retryAIGeneration = async () => {
  console.log('🔄 用户点击重试按钮，重新生成AI回复');

  // 清除暂存的AI回复
  currentDialoguePair.value = null;

  // 清空上次生成的选项
  options.value = [];
  saveCurrentOptions(); // 清除保存的选项

  // 删除最后一次生成创建的页面（如果存在）
  if (lastGeneratedPageIndex.value >= 0 && lastGeneratedPageIndex.value < pages.value.length) {
    console.log('🗑️ 删除最后生成的页面:', lastGeneratedPageIndex.value);
    pages.value.splice(lastGeneratedPageIndex.value, 1);

    // 调整当前页面索引
    if (currentPageIndex.value >= pages.value.length) {
      currentPageIndex.value = Math.max(0, pages.value.length - 1);
    }

    // 调整流式页面索引（如果有的话）
    if (currentStreamingPageIndex.value >= lastGeneratedPageIndex.value) {
      currentStreamingPageIndex.value = -1;
    }
  }

  // 删除流式传输创建的页面（如果流式失败但已创建页面）
  if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
    console.log('🗑️ 删除流式传输创建的页面:', currentStreamingPageIndex.value);
    pages.value.splice(currentStreamingPageIndex.value, 1);

    // 调整当前页面索引
    if (currentPageIndex.value >= pages.value.length) {
      currentPageIndex.value = Math.max(0, pages.value.length - 1);
    }
  }

  // 重置所有页面索引
  currentStreamingPageIndex.value = -1;
  lastGeneratedPageIndex.value = -1;

  // 删除最后一条AI消息
  const lastAIIndex = messages.value.findLastIndex(msg => msg.role === 'assistant');
  if (lastAIIndex >= 0) {
    messages.value.splice(lastAIIndex, 1);
  }

  // 调用重试前的回调，用于恢复状态（如士气值）
  if (props.dialogueConfig.onRetry) {
    console.log('🔄 调用重试前的回调，恢复状态');
    try {
      await props.dialogueConfig.onRetry();
    } catch (error) {
      console.error('重试回调执行失败:', error);
    }
  }

  // 重新生成
  await generateAndHandleAIReply();
};

const closeDialogue = async () => {
  // 先保存暂存的对话对
  await savePendingDialogue();

  if (props.dialogueConfig.onDialogueClose) {
    props.dialogueConfig.onDialogueClose();
  }
  emit('close');
};

// 消息编辑/删除功能
const editingMessageIndex = ref(-1);
const editingContent = ref('');

// 删除确认框状态
const showDeleteConfirm = ref(false);
const deleteConfirmState = ref({
  title: '删除消息',
  message: '确定要删除这条消息吗？',
  details: '删除后将无法恢复',
  confirmText: '删除',
  cancelText: '取消',
  showCancel: true,
  showClose: true,
  type: 'danger' as const,
});

const saveEdit = () => {
  if (editingMessageIndex.value >= 0 && editingMessageIndex.value < pages.value.length) {
    // 将纯文本转换回 HTML 格式
    const htmlContent = convertTextToHtml(editingContent.value);

    // 更新页面内容
    pages.value[editingMessageIndex.value].html = htmlContent;

    // 消息已通过回调实时保存，不需要批量保存
    editingMessageIndex.value = -1;
    editingContent.value = '';
  }
};

const cancelEdit = () => {
  editingMessageIndex.value = -1;
  editingContent.value = '';
};

// 编辑当前页消息
const editCurrentPageMessage = () => {
  if (currentPageIndex.value >= 0 && currentPageIndex.value < pages.value.length) {
    // 获取当前页面的内容
    const currentPage = pages.value[currentPageIndex.value];
    editingMessageIndex.value = currentPageIndex.value;

    // 从 HTML 中提取纯文本，显示给用户编辑
    editingContent.value = extractTextFromHtml(currentPage.html);
  }
};

// 删除当前页消息
// const deleteCurrentPageMessage = () => {
//   if (currentPageIndex.value >= 0 && currentPageIndex.value < pages.value.length) {
//     showDeleteConfirm.value = true;
//   }
// };

// 确认删除消息
const confirmDeleteMessage = () => {
  if (currentPageIndex.value >= 0 && currentPageIndex.value < pages.value.length) {
    // 直接删除当前页面
    pages.value.splice(currentPageIndex.value, 1);

    // 调整当前页面索引
    if (currentPageIndex.value >= pages.value.length) {
      currentPageIndex.value = Math.max(0, pages.value.length - 1);
    }

    // 消息已通过回调实时保存，不需要批量保存
  }
  showDeleteConfirm.value = false;
};

// 取消删除消息
const cancelDeleteMessage = () => {
  showDeleteConfirm.value = false;
};

// 工具函数
const filterXmlTags = (content: string) => {
  return content
    .replace(/<content[^>]*>(.*?)<\/content>/gi, '$1')
    .replace(/<message[^>]*>(.*?)<\/message>/gi, '$1')
    .replace(/<[^>]+>/g, '');
};

const removeJsonFromResponse = (response: string): string => {
  let cleaned = response;

  // 1. 移除 [OPTIONS_JSON] 标签格式
  cleaned = cleaned.replace(/\[OPTIONS_JSON\][\s\S]*?\[\/OPTIONS_JSON\]/gi, '');

  // 2. 移除 ```json 代码块格式（包括嵌套在标签中的）
  cleaned = cleaned.replace(/```json\s*[\s\S]*?```/gi, '');

  // 3. 移除独立的 JSON 对象（包含 options 或 morale_changes 字段的）
  // 匹配模式：可能的 "json" 文本 + JSON 对象
  cleaned = cleaned.replace(/\bjson\s*\n?\s*\{[\s\S]*?"(?:options|morale_changes)"[\s\S]*?\}/gi, '');

  // 4. 移除独立的 JSON 对象（即使没有 "json" 前缀，但包含 options 或 morale_changes）
  // 先找到所有匹配的 JSON 对象，然后一次性移除
  const jsonPattern = /\{[\s\S]*?"(?:options|morale_changes)"[\s\S]*?\}/g;
  const matches: string[] = [];
  let match;

  // 先收集所有匹配的 JSON 字符串
  while ((match = jsonPattern.exec(cleaned)) !== null) {
    try {
      const jsonStr = match[0];
      const parsed = JSON.parse(jsonStr);
      if (parsed.options || parsed.morale_changes) {
        matches.push(jsonStr);
      }
    } catch {
      // 如果解析失败，说明不是有效的 JSON，跳过
    }
  }

  // 移除所有匹配的 JSON 字符串
  for (const jsonStr of matches) {
    cleaned = cleaned.replace(jsonStr, '');
  }

  return cleaned.trim();
};

const safeFormatMessage = (content: string) => {
  return MessageService.formatMessage(content, { enableMarkdown: true, enableCodeHighlight: true, enableQuote: true });
};

// 从 HTML 中提取纯文本（用于编辑时显示）
const extractTextFromHtml = (html: string): string => {
  // 先将 <br> 标签转换为临时标记，避免被 textContent 移除
  const processedHtml = html
    .replace(/<br\s*\/?>/gi, '__BR__') // 将 <br> 转换为临时标记
    .replace(/<\/p>/gi, '__BR__') // 将 </p> 也转换为换行
    .replace(/<\/div>/gi, '__BR__'); // 将 </div> 也转换为换行

  // 创建一个临时 div 来解析 HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = processedHtml;

  // 获取纯文本
  let text = tempDiv.textContent || tempDiv.innerText || '';

  // 将临时标记转换为换行符
  text = text.replace(/__BR__/g, '\n');

  // 移除多余的连续换行（保留空行，但限制最大连续换行数）
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};

// 将纯文本转换为 HTML（保存时使用）
const convertTextToHtml = (text: string): string => {
  // 转义特殊字符
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 将换行符转换为 <br>
  html = html.replace(/\n/g, '<br>');

  // 使用 MessageService 格式化（支持引号、粗体等）
  return MessageService.formatMessage(html, { enableMarkdown: false, enableCodeHighlight: false, enableQuote: true });
};
</script>

<style lang="scss">
@use '../样式/对话样式变量.scss' as *;

/* 通用对话界面样式 - 基于调教界面设计但移除调教特有功能 */
.generic-dialogue-container {
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

.dialogue-panel {
  width: min(1200px, 95vw);
  height: min(92vh, 1000px);
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

.dialogue-header {
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

.dialogue-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.dialogue-title {
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

  .dialogue-subtitle {
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

  &:hover {
    background: linear-gradient(135deg, #9a4c3c, #75362c);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }

  &.retry-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-color: rgba(245, 158, 11, 0.7);
    animation: pulse 2s infinite;

    .btn-icon {
      color: #fef3c7;
    }

    &:hover {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-color: rgba(251, 191, 36, 0.8);
      transform: scale(1.1);
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.dialogue-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 8px 12px;
  min-height: 0;
}

.dialogue-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 12px;
}

.nav-btn {
  background: rgba(40, 26, 20, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.4);
  color: #ffe9d2;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(40, 26, 20, 1);
    border-color: rgba(205, 133, 63, 0.6);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nav-info {
  color: #ffd7a1;
  font-weight: 700;
}

.dialogue-viewport {
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

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(205, 133, 63, 0.6), rgba(139, 90, 43, 0.5));
    border-radius: 5px;
    border: 2px solid rgba(0, 0, 0, 0.2);

    &:hover {
      background: linear-gradient(135deg, rgba(205, 133, 63, 0.8), rgba(139, 90, 43, 0.7));
    }

    &:active {
      background: linear-gradient(135deg, rgba(255, 180, 100, 0.9), rgba(205, 133, 63, 0.8));
    }
  }

  /* Firefox 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 133, 63, 0.6) rgba(0, 0, 0, 0.3);
}

.page {
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

.page-inner {
  max-width: 820px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 16px 20px;

  @media (max-width: 768px) {
    padding: 12px;
    max-width: 100%;
  }
}

.page-content.typo-book {
  @include typo-book;
}

.choice-line {
  margin-top: 8px;
  font-weight: 600;

  .choice-prefix {
    margin-right: 6px;
  }
}

/* 初始空白状态样式 */
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

.initial-options {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(40, 26, 20, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 12px;
}

.option-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  align-items: center;
  line-height: 2;
  margin-bottom: 16px;
}

.inline-option {
  display: inline-block;
  margin: 0 6px 8px 0;
  padding: 2px 0;
  color: #ffd7a1;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover:not(.disabled) {
    color: #ffedcc;
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.option-bracket {
  color: rgba(205, 133, 63, 0.6);
  font-weight: 600;
}

.option-content {
  padding: 0 4px;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: rgba(205, 133, 63, 0.4);
  text-underline-offset: 3px;

  .inline-option:hover:not(.disabled) & {
    text-decoration-color: rgba(205, 133, 63, 0.8);
  }
}

/* 自定义选项样式 */
.inline-option.custom-option {
  color: #b8d7ff;

  .option-bracket {
    color: rgba(184, 215, 255, 0.6);
  }

  .option-content {
    text-decoration-color: rgba(184, 215, 255, 0.4);
  }

  &:hover:not(.disabled) {
    color: #d4e8ff;

    .option-content {
      text-decoration-color: rgba(184, 215, 255, 0.8);
    }
  }
}

/* 内联选项样式（融入文字） */
.inline-options {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed rgba(205, 133, 63, 0.25);
  font-family: 'Georgia', 'Times New Roman', serif;
}

/* 自定义输入面板 */
.custom-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
  overflow: hidden;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.custom-input-panel {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 12px;
  width: min(500px, 90vw);
  max-height: 480px !important;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease;
  overflow: hidden;
  position: relative;
  top: -8vh;
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

.custom-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.3);

  h3 {
    color: #ffd7a1;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
}

.close-panel-btn {
  background: rgba(200, 60, 60, 0.8);
  border: 1px solid rgba(200, 60, 60, 1);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(200, 60, 60, 1);
  }
}

.custom-input-body {
  padding: 20px 20px 0 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.custom-input-textarea {
  width: 100%;
  background: rgba(40, 26, 20, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.4);
  border-radius: 6px;
  padding: 12px;
  color: #f7efd9;
  resize: none;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 16px;
  line-height: 1.5;
  height: 200px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(247, 239, 217, 0.35);
    font-style: italic;
  }

  &:focus {
    border-color: rgba(205, 133, 63, 0.8);
    box-shadow: 0 0 0 2px rgba(205, 133, 63, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(205, 133, 63, 0.4);
    border-radius: 4px;

    &:hover {
      background: rgba(205, 133, 63, 0.6);
    }
  }
}

.custom-input-footer {
  display: flex;
  justify-content: center;
  padding: 10px 20px 20px 20px;
  width: 100%;
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 12px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #cd853f, #b8860b);
  color: #f7efd9;
  box-shadow: 0 2px 8px rgba(205, 133, 63, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #daa520, #cd853f);
    box-shadow: 0 4px 12px rgba(205, 133, 63, 0.4);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

/* 编辑对话框 */
.edit-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.edit-dialog {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 12px;
  width: min(600px, 90vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
}

.edit-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.3);

  h3 {
    color: #ffd7a1;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }
}

.close-dialog-btn {
  background: rgba(200, 60, 60, 0.8);
  border: 1px solid rgba(200, 60, 60, 1);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
}

.close-dialog-btn:hover {
  background: rgba(200, 60, 60, 1);
}

.edit-dialog-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.edit-dialog-body .edit-textarea {
  width: 100%;
  background: rgba(40, 26, 20, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.4);
  border-radius: 6px;
  padding: 12px;
  color: #f7efd9;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  min-height: 200px;
}

.edit-dialog-body .edit-textarea:focus {
  outline: none;
  border-color: rgba(205, 133, 63, 0.8);
  box-shadow: 0 0 0 2px rgba(205, 133, 63, 0.2);
}

.edit-dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid rgba(205, 133, 63, 0.3);
}

.edit-dialog-footer .save-btn,
.edit-dialog-footer .cancel-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.edit-dialog-footer .save-btn {
  background: rgba(60, 100, 200, 0.8);
  border-color: rgba(60, 100, 200, 1);
  color: #fff;
}

.edit-dialog-footer .save-btn:hover {
  background: rgba(60, 100, 200, 1);
}

.edit-dialog-footer .cancel-btn {
  background: rgba(200, 60, 60, 0.8);
  border-color: rgba(200, 60, 60, 1);
  color: #fff;
}

.edit-dialog-footer .cancel-btn:hover {
  background: rgba(200, 60, 60, 1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialogue-header {
    padding: 8px 10px;
  }

  .dialogue-title h3 {
    font-size: 20px;
  }

  .dialogue-title .dialogue-subtitle {
    font-size: 12px;
  }

  .header-btn {
    width: 32px;
    height: 32px;

    .btn-icon {
      font-size: 14px;
    }
  }

  .dialogue-shell {
    margin: 4px 8px;
  }

  .dialogue-nav {
    margin-bottom: 4px;
  }

  .nav-btn {
    padding: 4px 8px;
    font-size: 12px;
  }

  .nav-info {
    font-size: 13px;
  }

  .inline-option {
    font-size: 15px;
    margin: 0 4px 6px 0;
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

  .initial-options {
    padding: 16px;
  }

  .initial-options .option-choices {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .initial-options .inline-option {
    font-size: 16px;
    padding: 12px 16px;
    text-align: center;
  }

  /* 移动端自定义输入面板优化 */
  .custom-input-overlay {
    background: rgba(0, 0, 0, 0.9);
    align-items: flex-start;
    padding-top: 3vh;
  }

  .custom-input-panel {
    width: 95vw;
    height: 70vh;
    max-height: 70vh;
    top: -2vh;
    position: relative;
  }

  .custom-input-textarea {
    font-size: 16px;
    height: 300px;
    resize: none;

    /* 移动端隐藏滚动条 */
    &::-webkit-scrollbar {
      display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
</style>
