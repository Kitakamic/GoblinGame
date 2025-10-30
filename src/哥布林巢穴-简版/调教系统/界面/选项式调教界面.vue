<template>
  <div class="manual-training-container">
    <div class="book-panel">
      <!-- 头部信息 -->
      <div class="training-header">
        <div class="character-info">
          <div class="character-portrait" title="点击查看人物详细信息" @click="showCharacterDetail = true">
            <img
              v-if="character.avatar"
              :src="character.avatar"
              :alt="character.name"
              class="portrait-image"
              @error="handleImageError"
            />
            <div v-else class="portrait-placeholder">
              <span class="portrait-icon">👤</span>
            </div>
          </div>
        </div>
        <div class="character-details">
          <div class="character-name-section">
            <h3 class="character-name">{{ character.name }}</h3>
            <div class="character-title">{{ character.title }}</div>
          </div>
          <div class="character-stats">
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">堕落值</span>
                <span class="stat-value">{{ displayCharacter.loyalty }}%</span>
              </div>
              <div class="stat-bar">
                <div class="stat-fill loyalty-fill" :style="{ width: `${displayCharacter.loyalty}%` }"></div>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">体力</span>
                <span class="stat-value">{{ displayCharacter.stamina }}/{{ displayCharacter.maxStamina || 200 }}</span>
              </div>
              <div class="stat-bar">
                <div
                  class="stat-fill stamina-fill"
                  :style="{ width: `${(displayCharacter.stamina / (displayCharacter.maxStamina || 200)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
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
        <button class="header-btn style-btn" title="文字样式设置" @click="showStyleSettings = true">
          <span class="btn-icon">🎨</span>
        </button>
        <button v-if="showRetryButton" class="header-btn retry-btn" title="重新生成AI回复" @click="retryAIGeneration()">
          <span class="btn-icon">🔄</span>
        </button>
        <button class="header-btn close-btn" title="关闭调教界面" @click="closeTraining">
          <span class="btn-icon">✕</span>
        </button>
      </div>
      <!-- 消息列表区域 -->
      <div class="book-shell">
        <div class="book-nav">
          <button class="nav-btn" :disabled="currentPageIndex <= 0" @click="prevPage">上一页</button>
          <div class="nav-info">{{ currentPageIndex + 1 }} / {{ pages.length || 1 }}</div>
          <button class="nav-btn" :disabled="currentPageIndex >= pages.length - 1" @click="nextPage">下一页</button>
        </div>

        <div ref="dialogueContent" class="book-viewport">
          <div class="page">
            <div class="page-inner">
              <!-- 当前页内容 -->
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                v-if="pages[currentPageIndex]"
                class="page-content typo-book"
                v-html="pages[currentPageIndex].html"
              ></div>

              <!-- 初始空白状态的提示 -->
              <div v-if="pages.length === 0" class="initial-state">
                <div class="initial-welcome">
                  <p class="welcome-text">📖 调教开始</p>
                  <p class="welcome-hint">选择你对 {{ character.name }} 的第一个行动...</p>
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
                    v-if="options.length > 0 || pages.length > 0"
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
    <div v-if="showCustomInputPanel" class="custom-input-overlay" @click="closeCustomInputPanel">
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
    <div v-if="editingMessageIndex >= 0" class="edit-dialog-overlay" @click="cancelEdit">
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

    <!-- 关闭调教确认框 -->
    <CustomConfirm
      :show="showCloseConfirm"
      title="结束调教"
      message="确定要结束本次调教吗？"
      details="结束调教后，角色将进入调教中状态，本回合无法再次开启调教对话。（即使不进行对话直接结束，也会些许增长堕落值）"
      confirm-text="确定结束"
      cancel-text="继续调教"
      type="warning"
      @confirm="confirmCloseTraining"
      @cancel="cancelCloseTraining"
    />

    <!-- 删除消息确认框 -->
    <CustomConfirm
      :show="showDeleteConfirm"
      title="删除消息"
      message="确定要删除这条消息吗？"
      details="删除后无法恢复，请谨慎操作。"
      confirm-text="确定删除"
      cancel-text="取消"
      type="danger"
      @confirm="confirmDeleteMessage"
      @cancel="cancelDeleteMessage"
    />

    <!-- 自定义弹窗提示 -->
    <ToastContainer ref="toastRef" />

    <!-- 人物卡界面 -->
    <CharacterDetailModal
      :show="showCharacterDetail"
      :character="character"
      @close="showCharacterDetail = false"
      @edit-avatar="handleEditAvatar"
    />

    <!-- 文字样式设置 -->
    <TextStyleSettings :show="showStyleSettings" @close="showStyleSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { generateWithChainOfThought } from '../../世界书管理/AI生成助手';
import { WorldbookService } from '../../世界书管理/世界书服务';
import { ChainOfThoughtMode } from '../../世界书管理/思维链管理器';
import { AvatarSwitchService } from '../../人物管理/服务/头像切换服务';
import CharacterDetailModal from '../../人物管理/界面/人物卡界面.vue';
import type { Character } from '../../人物管理/类型/人物类型';
import { modularSaveManager } from '../../存档管理/模块化存档服务';
import { TimeParseService } from '../../服务/时间解析服务';
import { MessageService } from '../../消息模块/消息服务';
import { useMessageChat } from '../../消息模块/消息聊天';
import ToastContainer from '../../组件/弹窗提示.vue';
import TextStyleSettings from '../../组件/文字样式设置.vue';
import CustomConfirm from '../../组件/自定义确认框.vue';
import { AttributeChangeParseService } from '../服务/属性变化解析服务';
import { OptionParseService } from '../服务/选项解析服务';
import type { TrainingOption } from '../类型定义/调教类型';

interface Props {
  character: Character;
}

interface Emits {
  (e: 'update-character', character: Character, shouldTriggerAutoTraining?: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 聊天功能
const {
  messages,
  containerRef: dialogueContent,
  clearMessages,
  // exportMessages,
} = useMessageChat({ autoLoadHistory: false });

// 获取游戏时间并格式化
const getGameTimeString = (): string => {
  const rounds = modularSaveManager.resources.value.rounds || 0;
  const timeInfo = TimeParseService.getTimeInfo(rounds, false);
  return timeInfo.formattedDate;
};

// 自定义消息创建函数，使用游戏时间
const createGameTimeMessage = (role: 'system' | 'assistant' | 'user', content: string, sender: string): any => {
  return {
    message_id: undefined,
    role,
    sender,
    time: getGameTimeString(),
    content,
  };
};

// 自定义添加用户消息函数
const addUserMessageWithGameTime = (content: string) => {
  const userMessage = createGameTimeMessage('user', content, '{{user}}');
  messages.value = [...messages.value, userMessage];
  MessageService.scrollToBottom(dialogueContent.value);
};

// 清理AI回复内容，删除多余空行并整理格式
const cleanAIContent = (content: string): string => {
  return content
    .split('\n')
    .map(line => line.trim()) // 去除每行首尾空白
    .filter(line => line.length > 0) // 删除空行
    .join('\n\n'); // 用双换行连接，形成段落分隔
};

// 自定义添加AI消息函数
const addAIMessageWithGameTime = (content: string, sender: string = '系统') => {
  // 清理AI回复内容
  const cleanedContent = cleanAIContent(content);
  const aiMessage = createGameTimeMessage('assistant', cleanedContent, sender);
  messages.value = [...messages.value, aiMessage];
  MessageService.scrollToBottom(dialogueContent.value);
};

const isSending = ref(false);

// 暂存最后一次用户输入，用于与AI回复一起保存
const lastUserInput = ref<string>('');

// 弹窗提示引用
const toastRef = ref<InstanceType<typeof ToastContainer>>();

// 确认框状态
const showCloseConfirm = ref(false);
const showDeleteConfirm = ref(false);

// 人物卡显示状态
const showCharacterDetail = ref(false);
const showStyleSettings = ref(false);

// 处理编辑头像事件
const handleEditAvatar = (_character: Character) => {
  showCharacterDetail.value = false;
  toastRef.value?.info('头像编辑请从调教界面打开人物卡进行编辑', {
    title: '提示',
    duration: 2000,
  });
};

// 计算实时的属性值（包括暂存的变化）
const displayCharacter = computed(() => {
  if (pendingAttributeChanges.value) {
    return {
      ...props.character,
      loyalty: pendingAttributeChanges.value.loyalty,
      stamina: pendingAttributeChanges.value.stamina,
    };
  }
  return props.character;
});

// 重试状态
const showRetryButton = ref(false);
const retryMessage = ref('');

// 当前流式传输的页面索引（用于重试时删除）
const currentStreamingPageIndex = ref(-1);

// 最后一次生成创建的页面索引（用于重试时删除）
const lastGeneratedPageIndex = ref(-1);

// 暂存当前对话对，不立即保存到世界书
const currentDialoguePair = ref<{
  userInput: string;
  aiResponse: string;
} | null>(null);

// 暂存属性变化，不立即应用到人物
const pendingAttributeChanges = ref<{
  loyalty: number;
  stamina: number;
  character: Character;
} | null>(null);

// 保存原始人物属性，用于重新生成时恢复到原始状态
const originalCharacter = ref<Character | null>(null);

// 选项结构
const options = ref<TrainingOption[]>([]);

// 初始选项
const initialOptions = ref<TrainingOption[]>([
  { text: '观察她的情况', label: '保守' },
  { text: '直接开始调教', label: '激进' },
  { text: '和她聊一聊', label: '平稳' },
]);

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

// 将一条AI消息渲染为书页
const pushAIPage = (raw: string) => {
  // 先清理AI内容，再进行格式化
  const cleanedContent = cleanAIContent(raw);
  const html = safeFormatMessage(filterXmlTags(cleanedContent));
  pages.value.push({ html });
  currentPageIndex.value = pages.value.length - 1;
};

// 将用户选择附加到当前页末尾
const appendChoiceToCurrentPage = (text: string) => {
  if (pages.value.length === 0) return;
  const last = pages.value[pages.value.length - 1];
  last.html += `<div class="choice-line"><span class="choice-prefix">→</span> ${safeFormatMessage(text)}</div>`;

  // 用户选择已通过消息聊天模块自动保存到世界书
};

// 自定义选项（无痕输入）
const customOptionText = ref('');
const customPlaceholder = '输入你的选择…';
const showCustomInputPanel = ref(false);

// 打开自定义输入面板
const openCustomInputPanel = () => {
  if (isSending.value) return;
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
  console.log('🎯 submitCustomOption 被调用');
  const text = customOptionText.value.trim();
  console.log('📝 输入文本:', text, 'isSending:', isSending.value);
  if (!text || isSending.value) return;

  // 检查体力限制
  if (AttributeChangeParseService.isStaminaTooLow(displayCharacter.value.stamina)) {
    console.log('⚠️ 体力过低，无法继续调教');
    toastRef.value?.warning(`${props.character.name} 体力过低，无法继续调教！`);
    closeCustomInputPanel();
    return;
  }

  // 关闭输入面板
  closeCustomInputPanel();

  // 作为选择附加并继续
  addUserMessageWithGameTime(text);

  // 先保存之前暂存的对话对
  await savePendingDialogue();

  // 暂存用户输入，等待AI回复后一起保存
  lastUserInput.value = text;
  console.log('📝 暂存用户自定义输入:', text);

  appendChoiceToCurrentPage(text);

  // 清空当前选项
  options.value = [];
  saveCurrentOptions();

  await generateAndHandleAIReply();
};

// 导出给模板使用
defineExpose({});

// 监听文本变化，自动调整高度（初始输入框）
watch(customOptionText, () => {
  nextTick(() => {
    const textarea = document.querySelector('.inline-custom-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 200;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  });
});

onMounted(async () => {
  console.log('🚀 ========== 调教界面已加载 ==========');
  console.log('👤 角色信息:', {
    name: props.character.name,
    status: props.character.status,
    id: props.character.id,
  });

  // 初始化原始人物属性
  originalCharacter.value = { ...props.character };
  console.log('💾 已保存原始人物属性:', originalCharacter.value);

  console.log('📦 开始加载历史调教消息...');
  await loadCharacterTrainingMessages();

  console.log('📊 加载完成后的状态:', {
    页面数量: pages.value.length,
    消息数量: messages.value.length,
  });

  // 只有在有历史消息时才尝试解析选项
  if (pages.value.length > 0) {
    console.log('🔍 尝试从最后一条AI消息解析选项...');
    parseOptionsFromLastAIMessage();
  } else {
    console.log('ℹ️ 没有历史页面，跳过选项解析');
  }

  // 调试信息
  console.log('📊 最终状态:', {
    页面数量: pages.value.length,
    选项数量: options.value.length,
    初始选项数量: initialOptions.value.length,
  });

  console.log('🚀 ========== 调教界面初始化完成 ==========');
});

onUnmounted(async () => {});

// 构建AI提示词

// 构建用户提示词
const buildUserPrompt = (): string => {
  const latestUserMessage = messages.value.filter(msg => msg.role === 'user').pop();
  if (latestUserMessage) {
    return `## 调教模式输出规则:

1. ***正文末尾必须按照示例输出 JSON 格式的选项和忠诚度（堕落进度）以及体力值变化，并用 [OPTIONS_JSON] 标签包裹***
2. 此时女性人物已然被俘，但根据其性格和身份，每个人有着鲜明的态度表现和心理活动，*避免完全的抵抗/顺从/投降心理*
3. 文字风格: 黑暗/色情/奇幻，每次输出必须包含大段女性人物的对话和独白，以此构建人物剧情动态变化的基础，并严格遵守内容优先级构建内容
  正文内容优先级:
    1. **角色对话（比重极大）**: 通过大段的长对话来勾勒角色的语言底色，表现其对于被俘虏处境的态度和语言风格
    2. **内心独白（比重较大）**: 在场景/动作/神态，甚至是对话之中，插入足量的内心独白（不使用引号，而是*包裹）来描绘人物心中的信念与精神变化
    3. 动作描写与肢体语言（比重中等）
    4. 场景互动（比重中等）
    5. 环境细节（比重较小）
4. 最终指导: 回复字数在500-800字之间，调教模式下人物的状态是循序渐进的，不要在一次回复中出现人物的完全变化（如完全不再抵抗/堕落/投降等），而是为下一次预留足够的变化空间，直到坠入深渊


示例：
[OPTIONS_JSON]
{
  "options":[
    {"strategy":"保守","text":"温柔地安抚她，轻声细语地安慰"},
    {"strategy":"激进","text":"加大调教力度，让她彻底屈服"},
    {"strategy":"平稳","text":"保持当前节奏，观察她的反应"}
  ],
  "attribute_changes": {
    "loyalty": 忠诚度（堕落进度）变化值（-5到10之间的整数）,
    "stamina": 体力变化值（-15到5之间的整数，通常为负数）
  }
}
[/OPTIONS_JSON]

<character_info>
当前调教角色: ${props.character.name}
  - 状态: ${props.character.status}
  - 堕落值: ${props.character.loyalty}%
  - 体力: ${props.character.stamina}/${props.character.maxStamina || 200}
  - 生育值: ${props.character.fertility}/${props.character.maxFertility || 200}
  - 已生育数量: ${props.character.offspring}
当前服装状态:
${
  props.character.appearance?.clothing
    ? `
head: "${props.character.appearance.clothing.head || '无'}"
top: "${props.character.appearance.clothing.top || '无'}"
bottom: "${props.character.appearance.clothing.bottom || '无'}"
socks: "${props.character.appearance.clothing.socks || '无'}"
shoes: "${props.character.appearance.clothing.shoes || '无'}"
underwear: "${props.character.appearance.clothing.underwear || '无'}"
accessories: "${props.character.appearance.clothing.accessories || '无'}"
toys: "${props.character.appearance.clothing.toys || '无'}"
`
    : '无服装信息'
}
</character_info>

<user_message>
${latestUserMessage.content}
</user_message>
`;
  }
  return '';
};

// 加载历史消息
const loadCharacterTrainingMessages = async () => {
  console.log('📖 ========== 开始加载历史调教消息 ==========');
  console.log('👤 角色信息:', {
    id: props.character.id,
    name: props.character.name,
    status: props.character.status,
  });

  try {
    // 使用世界书服务获取调教记录
    console.log('🔍 正在从世界书获取调教记录...');
    console.log('📝 使用角色名称查找:', props.character.name);
    const trainingHistory = await WorldbookService.getExistingTrainingHistory(props.character.name);
    console.log(`📊 获取到 ${trainingHistory.length} 条调教记录`);

    if (trainingHistory.length > 0) {
      console.log('📝 原始记录列表:');
      trainingHistory.forEach((record, index) => {
        console.log(`  [${index}]`, {
          gameTime: record.gameTime,
          sender: record.sender,
          contentPreview: record.content.substring(0, 50) + (record.content.length > 50 ? '...' : ''),
          timestamp: record.timestamp,
        });
      });

      clearMessages();
      console.log('🔄 消息已清空，准备重新加载');

      const sortedHistory = trainingHistory.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      console.log('📊 排序后的记录顺序:');
      sortedHistory.forEach((record, index) => {
        console.log(`  [${index}] ${record.gameTime} - ${record.sender}`);
      });

      sortedHistory.forEach((record, index) => {
        const isUser = record.sender === 'user' || record.sender === '{{user}}';
        console.log(`➕ 添加第 ${index + 1} 条消息:`, {
          isUser,
          sender: record.sender,
          gameTime: record.gameTime,
        });

        if (isUser) {
          addUserMessageWithGameTime(record.content);
        } else {
          addAIMessageWithGameTime(record.content, props.character.name);
          // 回放为书页
          pushAIPage(record.content);
          console.log(`  📄 已添加为书页，当前页面数: ${pages.value.length}`);
        }
      });

      console.log('✅ 历史消息加载完成');
      console.log('📊 最终状态:', {
        消息数量: messages.value.length,
        页面数量: pages.value.length,
        当前页索引: currentPageIndex.value,
      });
    } else {
      console.log('ℹ️ 没有找到历史调教记录');
    }
  } catch (error) {
    console.error('❌ 加载历史消息失败:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  console.log('📖 ========== 历史消息加载流程结束 ==========');
};

// 选择一个选项并发送
const chooseOption = async (opt: TrainingOption) => {
  console.log('🎯 chooseOption 被调用', opt);
  console.log('🔍 当前状态:', { isSending: isSending.value, characterName: props.character.name });
  if (isSending.value) {
    console.log('⏸️ 正在发送中，跳过选择');
    return;
  }

  // 检查体力限制
  if (AttributeChangeParseService.isStaminaTooLow(displayCharacter.value.stamina)) {
    console.log('⚠️ 体力过低，无法继续调教');
    toastRef.value?.warning(`${props.character.name} 体力过低，无法继续调教！`);
    return;
  }

  const choiceText = opt.text; // 不包含标签，只使用文本

  addUserMessageWithGameTime(choiceText);

  // 先保存之前暂存的对话对和属性变化
  await savePendingDialogue();
  await applyPendingAttributeChanges();

  // 暂存用户选择，等待AI回复后一起保存
  lastUserInput.value = choiceText;
  console.log('📝 暂存用户选择:', choiceText);

  // 将选择附加到当前页末尾
  appendChoiceToCurrentPage(choiceText);

  // 清空当前选项
  options.value = [];
  saveCurrentOptions();

  await generateAndHandleAIReply();
};

// 选择初始选项
const chooseInitialOption = async (opt: TrainingOption) => {
  console.log('🎯 chooseInitialOption 被调用', opt);
  if (isSending.value) {
    console.log('⏸️ 正在发送中，跳过初始选择');
    return;
  }
  const choiceText = opt.text;

  addUserMessageWithGameTime(choiceText);

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
};

// 调用AI并处理回复（含解析选项）
const generateAndHandleAIReply = async () => {
  let aiResponse = '';
  let isAISuccess = false;
  let response = ''; // 声明 response 变量

  try {
    isSending.value = true;

    // 在生成新的AI回复之前，保存当前的人物状态作为基准
    // 这样重试时可以恢复到正确的状态
    // 使用 displayCharacter 作为基准，因为它反映了当前实际应该使用的状态
    // （如果有 pendingAttributeChanges，它会包含最新的属性；否则使用 props.character）
    // 但注意：由于在 chooseOption 中已经调用了 applyPendingAttributeChanges，
    // 所以此时 displayCharacter 应该已经反映了应用后的最新状态
    const currentCharacterState = displayCharacter.value;
    originalCharacter.value = { ...currentCharacterState };
    console.log(
      '💾 保存当前人物状态作为重试基准（堕落值:',
      currentCharacterState.loyalty,
      '）:',
      originalCharacter.value,
    );

    // 流式传输相关变量
    currentStreamingPageIndex.value = -1;
    lastGeneratedPageIndex.value = -1; // 重置最后生成的页面索引

    // 监听流式传输事件
    const handleStreamToken = (fullText: string) => {
      // 应用酒馆正则处理
      const formatted = formatAsTavernRegexedString(fullText, 'ai_output', 'display');

      // 如果有临时页面，更新它；否则创建新页面
      if (currentStreamingPageIndex.value >= 0) {
        pages.value[currentStreamingPageIndex.value].html = safeFormatMessage(formatted);
      } else {
        currentStreamingPageIndex.value = pages.value.length;
        pages.value.push({ html: safeFormatMessage(formatted) });
        currentPageIndex.value = currentStreamingPageIndex.value;
      }

      // 滚动到底部
      MessageService.scrollToBottom(dialogueContent.value);

      // console.log('📝 流式传输更新:', formatted.substring(0, 50) + '...');
    };

    // 注册流式传输事件监听
    eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

    try {
      // 读取全局流式传输设置
      const globalVars = getVariables({ type: 'global' });
      const enableStreamOutput =
        typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : true; // 默认开启

      // 使用带思维链的AI生成（人物调教模式）
      response = await generateWithChainOfThought(ChainOfThoughtMode.CHARACTER_TRAINING, {
        user_input: buildUserPrompt(),
        should_stream: enableStreamOutput,
      });

      // 移除事件监听
      eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

      // 注意：保留 currentStreamingPageIndex，在生成完成后检查是否需更新页面
    } catch (error) {
      // 移除事件监听
      eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

      // 生成失败时重置流式页面索引
      if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
        pages.value.splice(currentStreamingPageIndex.value, 1);
      }
      currentStreamingPageIndex.value = -1;

      throw error;
    }

    // 检查AI回复是否为空或无效
    if (!response || response.trim().length === 0) {
      console.warn('⚠️ AI回复为空，跳过处理');
      toastRef.value?.warning('AI回复为空，请重试', { title: '生成失败' });

      // 生成失败时删除流式创建的页面并重置索引
      if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
        pages.value.splice(currentStreamingPageIndex.value, 1);
      }
      currentStreamingPageIndex.value = -1;

      // AI回复为空时，显示重试按钮而不是清空用户输入
      if (lastUserInput.value) {
        console.log('🔄 AI回复为空，显示重试按钮，保留用户输入:', lastUserInput.value);
        showRetryButton.value = true;
        retryMessage.value = 'AI回复为空，点击重试按钮重新生成';
      }
      return;
    }

    aiResponse = response;
    isAISuccess = true;

    // 成功生成时显示重试按钮，允许重新生成
    showRetryButton.value = true;
    retryMessage.value = '点击重试按钮重新生成AI回复';

    // 先解析选项（从原始文本中）
    const parsed = OptionParseService.parseNextStepOptions(aiResponse);
    options.value = parsed.options;
    console.log('🎯 设置选项到 options.value:', options.value);
    console.log('📊 选项数量:', options.value.length);

    // 解析并应用属性变化
    console.log('🔍 开始解析AI回复中的属性变化...');
    console.log('📝 AI回复内容:', aiResponse);

    // 先应用酒馆正则处理，再解析属性变化
    const tavernProcessedResponse = formatAsTavernRegexedString(aiResponse, 'ai_output', 'display');
    console.log('🎨 应用酒馆正则后的内容:', tavernProcessedResponse);

    const attributeChanges = AttributeChangeParseService.parseAttributeChanges(tavernProcessedResponse);
    console.log('📊 解析到的属性变化:', attributeChanges);

    if (attributeChanges && AttributeChangeParseService.validateAttributeChanges(attributeChanges)) {
      console.log('✅ 属性变化验证通过，开始应用变化...');

      // 检查是否已堕落，已堕落人物不应用属性变化
      if (props.character.status === 'surrendered') {
        console.log('🚫 已堕落人物不应用属性变化，保持原有属性');
        // 已堕落人物不应用任何属性变化，直接使用原有人物数据
        pendingAttributeChanges.value = {
          loyalty: props.character.loyalty,
          stamina: props.character.stamina,
          character: props.character,
        };
      } else {
        // 未堕落人物正常应用属性变化
        const newAttributes = AttributeChangeParseService.applyAttributeChanges(
          attributeChanges,
          props.character.loyalty,
          props.character.stamina,
          props.character.maxStamina || 200,
        );
        console.log('🎯 应用后的新属性:', newAttributes);

        // 创建更新后的人物对象
        const updatedCharacter = {
          ...props.character,
          loyalty: newAttributes.loyalty,
          stamina: newAttributes.stamina,
          // 生育值保持不变，不参与调教计算
        };

        // 处理头像切换（基于堕落值变化）
        const previousLoyalty = props.character.loyalty;
        const avatarResult = AvatarSwitchService.handleCorruptionChange(updatedCharacter, previousLoyalty);

        if (avatarResult.switched) {
          console.log(
            `🖼️ 头像已切换: ${props.character.name} 堕落值从 ${previousLoyalty}% 变为 ${newAttributes.loyalty}%`,
          );
          console.log(`📊 堕落等级: ${AvatarSwitchService.getCorruptionLevelDescription(newAttributes.loyalty)}`);

          // 显示头像切换提示
          toastRef.value?.info(`${props.character.name} 的堕落值达到 ${newAttributes.loyalty}%，头像已切换！`, {
            title: '头像切换',
            duration: 3000,
          });
        }

        // 使用头像切换后的人物对象
        const finalCharacter = avatarResult.character;

        // 检查体力是否过低
        if (AttributeChangeParseService.isStaminaTooLow(finalCharacter.stamina)) {
          finalCharacter.status = 'training';
          toastRef.value?.warning(`${finalCharacter.name} 体力过低，无法继续调教！`);
        }

        // 暂存属性变化，等待下一轮对话开始前应用
        pendingAttributeChanges.value = {
          loyalty: newAttributes.loyalty,
          stamina: newAttributes.stamina,
          character: finalCharacter,
        };

        // 通知父组件更新人物数据（但不触发自动调教）
        emit('update-character', finalCharacter, false);
        console.log('📤 已通知父组件更新人物数据（不触发自动调教）');
      }
    } else {
      console.warn('⚠️ 属性变化解析失败或验证不通过');
      console.log('📊 解析结果:', attributeChanges);
      if (attributeChanges) {
        console.log('❌ 验证失败，属性变化数据:', attributeChanges);
      } else {
        console.log('❌ 未找到属性变化数据');
      }
    }

    // 保存选项到存档
    saveCurrentOptions();

    // 剔除JSON数据，只保留角色回复内容（使用已经酒馆正则处理过的文本）
    const cleanedResponse = removeJsonFromResponse(tavernProcessedResponse);
    console.log('🧹 清理后的回复内容:', cleanedResponse);

    // 不再重复应用酒馆正则，因为已经处理过了
    const formattedResponse = cleanedResponse;
    console.log('🎨 最终显示内容:', formattedResponse);

    addAIMessageWithGameTime(formattedResponse, props.character.name);

    // 如果流式传输已经创建了页面，就更新它；否则创建新页面
    if (currentStreamingPageIndex.value >= 0 && currentStreamingPageIndex.value < pages.value.length) {
      // 更新流式传输创建的页面
      pages.value[currentStreamingPageIndex.value].html = safeFormatMessage(formattedResponse);
      currentPageIndex.value = currentStreamingPageIndex.value;
      lastGeneratedPageIndex.value = currentStreamingPageIndex.value; // 记录创建的页面索引
      console.log('✅ 更新流式传输创建的页面:', currentStreamingPageIndex.value);
    } else {
      // 追加新书页并自动切换到下一页
      console.log('📄 创建新页面（非流式传输）');
      pushAIPage(formattedResponse);
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
    }
  } catch (error) {
    console.error('AI生成失败:', error);
    toastRef.value?.error('AI生成失败', { title: 'AI生成失败' });

    // AI生成失败时，显示重试按钮而不是清空用户输入
    if (lastUserInput.value) {
      console.log('🔄 AI生成失败，显示重试按钮，保留用户输入:', lastUserInput.value);
      showRetryButton.value = true;
      retryMessage.value = 'AI生成失败，点击重试按钮重新生成';
    }
  } finally {
    isSending.value = false;
  }
};

// 保存暂存的对话对到世界书
const savePendingDialogue = async () => {
  if (currentDialoguePair.value) {
    console.log('💾 保存暂存的对话对到世界书:', currentDialoguePair.value);
    await saveTrainingPairToWorldbook(currentDialoguePair.value.userInput, currentDialoguePair.value.aiResponse);
    currentDialoguePair.value = null;
  }
};

// 应用暂存的属性变化
const applyPendingAttributeChanges = async () => {
  if (pendingAttributeChanges.value) {
    console.log('🔄 应用暂存的属性变化:', pendingAttributeChanges.value);

    const { character: finalCharacter } = pendingAttributeChanges.value;

    // 更新世界书信息
    console.log('📚 更新世界书信息...');
    await WorldbookService.updateCharacterEntry(finalCharacter);

    // 保存人物数据到存档
    const currentTrainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    const updatedCharacters = (currentTrainingData?.characters || []).map((char: any) =>
      char.id === props.character.id ? finalCharacter : char,
    );

    modularSaveManager.updateModuleData({
      moduleName: 'training',
      data: {
        ...currentTrainingData,
        characters: updatedCharacters,
      },
    });

    console.log('✅ 属性变化已应用到存档和世界书:', {
      loyalty: finalCharacter.loyalty,
      stamina: finalCharacter.stamina,
    });

    // 更新 originalCharacter 为最新状态，确保重试时使用正确的基准
    originalCharacter.value = { ...finalCharacter };
    console.log('💾 已更新 originalCharacter 为最新状态（堕落值:', finalCharacter.loyalty, '）');

    // 清除暂存的属性变化
    pendingAttributeChanges.value = null;
  }
};

// 重试AI生成
const retryAIGeneration = async () => {
  console.log('🔄 用户点击重试按钮，重新生成AI回复');

  // 清除暂存的AI回复和属性变化
  currentDialoguePair.value = null;

  // 如果有暂存的属性变化，先清除它（但不应用到存档），因为我们只是重试最后一次生成
  // 优先使用 originalCharacter（保存了生成前的正确状态），如果没有则使用当前显示状态
  const characterToRestore = originalCharacter.value || displayCharacter.value;

  console.log('🔄 恢复到上一次生成前的状态:', {
    loyalty: characterToRestore.loyalty,
    stamina: characterToRestore.stamina,
    usingOriginal: !!originalCharacter.value,
  });

  // 如果暂存的属性变化还未应用，清除它
  pendingAttributeChanges.value = null;

  // 清空上次生成的选项
  options.value = [];
  saveCurrentOptions(); // 清除保存的选项

  // 通知父组件恢复到上一次生成前的状态（不触发自动调教）
  emit('update-character', characterToRestore, false);
  // 等待一帧，确保父组件已更新 props.character
  await nextTick();

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

  // 重新生成（会使用 originalCharacter 作为基准）
  await generateAndHandleAIReply();
};

// 将用户输入和AI回复作为一对保存到世界书
const saveTrainingPairToWorldbook = async (userInput: string, aiResponse: string) => {
  try {
    const rounds = modularSaveManager.resources.value.rounds || 0;
    const gameTime = TimeParseService.getTimeInfo(rounds).formattedDate;
    const baseTimestamp = Date.now();

    // 创建用户消息和AI消息
    const userMessage = {
      gameTime: gameTime,
      sender: 'user',
      content: userInput,
      timestamp: baseTimestamp,
    };

    const aiMessage = {
      gameTime: gameTime,
      sender: props.character.name,
      content: aiResponse,
      timestamp: baseTimestamp + 1, // AI消息时间戳稍后，确保顺序
    };

    console.log('📦 批量保存调教对话对:', { userMessage, aiMessage });

    // 批量添加两条记录，只写入一次世界书
    await WorldbookService.addMultipleTrainingRecords(
      props.character.name,
      props.character.name,
      [userMessage, aiMessage],
      props.character.status,
    );

    console.log('✅ 已保存调教对话对到世界书');
  } catch (error) {
    console.error('❌ 保存调教对话对到世界书失败:', error);
  }
};

// 保存当前选项
const saveCurrentOptions = () => {
  try {
    const optionsData = {
      options: options.value,
      timestamp: Date.now(),
    };
    const characterVars = getVariables({ type: 'character' });
    characterVars[`training_options_${props.character.id}`] = JSON.stringify(optionsData);
    replaceVariables(characterVars, { type: 'character' });
  } catch (error) {
    console.error('保存选项失败:', error);
  }
};

// 加载保存的选项
const loadSavedOptions = () => {
  try {
    const characterVars = getVariables({ type: 'character' });
    const savedOptionsJson = characterVars[`training_options_${props.character.id}`];
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

// 从最后一条AI消息尝试解析选项（用于第一次进入界面时的恢复）
const parseOptionsFromLastAIMessage = () => {
  // 只有在有历史消息时才尝试加载保存的选项
  if (pages.value.length === 0) {
    return;
  }

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

// 界面操作

const closeTraining = async () => {
  // 显示确认框
  showCloseConfirm.value = true;
};

// 确认关闭调教
const confirmCloseTraining = async () => {
  showCloseConfirm.value = false;

  // 先保存暂存的对话对和属性变化
  await savePendingDialogue();
  await applyPendingAttributeChanges();

  // 消息已通过世界书服务自动保存

  // 创建更新后的人物对象
  // 检查是否已堕落，已堕落人物不进入调教状态
  const updatedCharacter = {
    ...props.character,
    status: props.character.status === 'surrendered' ? props.character.status : ('training' as const),
    lastTraining: props.character.status === 'surrendered' ? props.character.lastTraining : new Date(),
  };

  // 处理头像切换（确保头像与当前堕落值匹配）
  const avatarResult = AvatarSwitchService.handleCorruptionChange(updatedCharacter, updatedCharacter.loyalty);
  const finalCharacter = avatarResult.character;

  if (props.character.status === 'surrendered') {
    console.log('🎯 调教界面关闭，已堕落人物保持堕落状态');
  } else {
    console.log('🎯 调教界面关闭，设置人物状态为调教中');
  }

  // 确保人物数据被更新到存档系统
  try {
    console.log('🔄 关闭调教界面，更新人物数据...');
    console.log('📊 当前人物数据:', {
      id: finalCharacter.id,
      name: finalCharacter.name,
      loyalty: finalCharacter.loyalty,
      stamina: finalCharacter.stamina,
      maxStamina: finalCharacter.maxStamina,
      status: finalCharacter.status,
    });

    // 更新世界书信息
    await WorldbookService.updateCharacterEntry(finalCharacter);

    // 保存人物数据到存档
    const currentTrainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    const updatedCharacters = (currentTrainingData?.characters || []).map((char: any) =>
      char.id === finalCharacter.id ? finalCharacter : char,
    );

    modularSaveManager.updateModuleData({
      moduleName: 'training',
      data: {
        ...currentTrainingData,
        characters: updatedCharacters,
      },
    });

    // 强制保存到酒馆存档
    modularSaveManager.saveCurrentGameData(0);

    console.log('✅ 人物数据已更新到存档系统');
    console.log('📊 最终人物数据:', {
      loyalty: finalCharacter.loyalty,
      stamina: finalCharacter.stamina,
      status: finalCharacter.status,
    });
  } catch (error) {
    console.error('❌ 更新人物数据失败:', error);
  }

  // 通知父组件更新人物数据（关闭时触发自动调教）
  emit('update-character', finalCharacter, true);

  // 延迟关闭，确保父组件有时间处理更新
  setTimeout(() => {
    emit('close');
  }, 100);
};

// 取消关闭调教
const cancelCloseTraining = () => {
  showCloseConfirm.value = false;
};

// 消息编辑/删除功能
const editingMessageIndex = ref(-1);
const editingContent = ref('');

const saveEdit = () => {
  if (editingMessageIndex.value >= 0 && editingMessageIndex.value < pages.value.length) {
    // 将纯文本转换回 HTML 格式
    const htmlContent = convertTextToHtml(editingContent.value);

    // 直接更新页面内容
    pages.value[editingMessageIndex.value].html = htmlContent;

    // 消息已通过世界书服务自动保存
    editingMessageIndex.value = -1;
    editingContent.value = '';
  }
};

const cancelEdit = () => {
  editingMessageIndex.value = -1;
  editingContent.value = '';
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

    // 消息已通过世界书服务自动保存
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
  // 先应用酒馆正则格式化，再应用消息服务的格式化
  const tavernFormatted = formatAsTavernRegexedString(content, 'ai_output', 'display');
  return MessageService.formatMessage(tavernFormatted, {
    enableMarkdown: true,
    enableCodeHighlight: true,
    enableQuote: true,
  });
};
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};
</script>

<style lang="scss">
@use '../../样式/对话样式变量.scss' as *;

/* 复用手动调教界面的整体样式，并补充选项样式 */
.manual-training-container {
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

.book-panel {
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

.manual-training-container .training-header {
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

.manual-training-container .character-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.manual-training-container .character-portrait {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(205, 133, 63, 0.7);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 0 2px rgba(255, 200, 150, 0.1),
    inset 0 2px 4px rgba(255, 200, 150, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.5),
      0 0 0 3px rgba(255, 215, 0, 0.3),
      inset 0 2px 6px rgba(255, 200, 150, 0.25);
  }

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background: linear-gradient(45deg, rgba(255, 215, 0, 0.3), rgba(205, 133, 63, 0.3), rgba(255, 120, 60, 0.3));
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: scale(1.08) translateY(-2px);
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.5),
      0 0 0 3px rgba(255, 215, 0, 0.2),
      inset 0 2px 4px rgba(255, 200, 150, 0.25);

    &::before {
      opacity: 1;
    }
  }

  .portrait-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    transition: transform 0.3s ease;
  }

  .portrait-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #8a3c2c, #65261c);
    display: flex;
    align-items: center;
    justify-content: center;

    .portrait-icon {
      font-size: 36px;
      color: #ffd7a1;
    }
  }
}

.manual-training-container .character-details {
  flex: 1;
  margin-left: 8px;

  .character-name-section {
    margin-bottom: 16px;

    .character-name {
      color: #ffd7a1;
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 4px 0;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      letter-spacing: 0.5px;
    }

    .character-title {
      color: rgba(240, 230, 210, 0.8);
      font-size: 14px;
      font-style: italic;
      opacity: 0.9;
      margin: 0;
    }
  }

  .character-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .stat-label {
          color: #f0e6d2;
          font-size: 14px;
          font-weight: 600;
          opacity: 0.9;
        }

        .stat-value {
          color: #ffd7a1;
          font-weight: 700;
          font-size: 14px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
      }

      .stat-bar {
        width: 100%;
        height: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(205, 133, 63, 0.2);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);

        .stat-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;

          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: shimmer 2s infinite;
          }
        }

        .loyalty-fill {
          background: linear-gradient(90deg, #ff6b6b, #ff8e53, #ffa726);
          box-shadow: 0 0 8px rgba(255, 107, 107, 0.4);
        }

        .stamina-fill {
          background: linear-gradient(90deg, #4ecdc4, #44a08d, #2c5530);
          box-shadow: 0 0 8px rgba(78, 205, 196, 0.4);
        }
      }
    }
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.manual-training-container .header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}
.manual-training-container .header-btn {
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

/* 书籍外壳与分页 */
.book-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 8px 12px;
  min-height: 0; /* 允许子元素滚动 */
}
.book-nav {
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
}
.nav-info {
  color: #ffd7a1;
  font-weight: 700;
}
.book-viewport {
  flex: 1;
  min-height: 0; /* 允许自身滚动 */
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
  /* 交由外层 book-viewport 滚动，避免嵌套滚动 */
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

  /* 宽屏优化 */
  @media (min-width: 1400px) {
    max-width: 1200px;
    padding: 20px 30px;
  }

  @media (min-width: 1600px) {
    max-width: 1400px;
    padding: 24px 40px;
  }

  @media (min-width: 1920px) {
    max-width: 1600px;
    padding: 28px 50px;
  }

  @media (min-width: 2560px) {
    max-width: 1800px;
    padding: 32px 60px;
  }

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

.manual-training-container .dialogue-message {
  margin-bottom: 20px;
}
.manual-training-container .message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.manual-training-container .message-sender {
  color: #ffd7a1;
  font-weight: 700;
  font-size: 16px;
}
.manual-training-container .message-time {
  color: #f0e6d2;
  opacity: 0.8;
  font-size: 13px;
}
.manual-training-container .message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.manual-training-container .dialogue-message:hover .message-actions {
  opacity: 1;
}
.manual-training-container .message-body {
  color: #fff;
  line-height: 1.7;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(34, 19, 13, 0.8), rgba(44, 29, 18, 0.6));
  border-radius: 12px;
  border-left: 5px solid rgba(205, 133, 63, 0.6);
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

  /* 宽屏优化 */
  @media (min-width: 1400px) {
    max-width: 1200px;
    padding: 24px 30px;
  }

  @media (min-width: 1600px) {
    max-width: 1400px;
    padding: 28px 40px;
  }

  @media (min-width: 1920px) {
    max-width: 1600px;
    padding: 32px 50px;
  }

  @media (min-width: 2560px) {
    max-width: 1800px;
    padding: 36px 60px;
  }
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 12px;
}

.initial-options .option-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  align-items: center;
  line-height: 2;
}

.initial-options .inline-option {
  font-size: 18px;
  padding: 8px 12px;
  background: rgba(40, 26, 20, 0.5);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover:not(.disabled) {
    background: rgba(40, 26, 20, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* 内联选项样式（融入文字） */
.inline-options {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed rgba(205, 133, 63, 0.25);
  font-family: 'Georgia', 'Times New Roman', serif;
}

.option-choices {
  margin-bottom: 16px;
  line-height: 2;
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

.manual-training-container .training-input {
  padding: 20px;
  background: linear-gradient(135deg, rgba(26, 19, 19, 0.95), rgba(34, 24, 20, 0.9));
  border-top: 2px solid rgba(205, 133, 63, 0.3);
}
.manual-training-container .input-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.manual-training-container .input-controls textarea {
  flex: 1;
  background: rgba(40, 26, 20, 0.7);
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 8px;
  padding: 12px;
  color: #ffe9d2;
  resize: none;
}
.manual-training-container .input-controls .send-btn {
  background: linear-gradient(180deg, #8a3c2c, #65261c);
  color: #ffe9d2;
  border: 1px solid rgba(255, 120, 60, 0.5);
  border-radius: 8px;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 700;
}

/* 消息编辑样式 */
.messages-container {
  padding: 16px;
}

.dialogue-message {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(205, 133, 63, 0.2);
}

.dialogue-message.message-user {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.6), rgba(26, 19, 19, 0.8));
  border-left: 4px solid rgba(255, 120, 60, 0.6);
}

.dialogue-message.message-assistant {
  background: linear-gradient(135deg, rgba(26, 19, 19, 0.6), rgba(40, 26, 20, 0.8));
  border-left: 4px solid rgba(205, 133, 63, 0.6);
}

.dialogue-message.message-system {
  background: linear-gradient(135deg, rgba(20, 20, 20, 0.6), rgba(30, 30, 30, 0.8));
  border-left: 4px solid rgba(150, 150, 150, 0.6);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
}

.message-sender {
  color: #ffd7a1;
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  color: #f0e6d2;
  font-size: 12px;
  opacity: 0.7;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dialogue-message:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(40, 26, 20, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.4);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(40, 26, 20, 1);
  border-color: rgba(205, 133, 63, 0.6);
}

.edit-btn:hover {
  background: rgba(60, 100, 200, 0.3);
}

.delete-btn:hover {
  background: rgba(200, 60, 60, 0.3);
}

.message-body {
  padding: 12px;
  color: #f7efd9;
  line-height: 1.6;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-textarea {
  width: 100%;
  background: rgba(40, 26, 20, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.4);
  border-radius: 6px;
  padding: 8px;
  color: #f7efd9;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
}

.edit-textarea:focus {
  outline: none;
  border-color: rgba(205, 133, 63, 0.8);
  box-shadow: 0 0 0 2px rgba(205, 133, 63, 0.2);
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.save-btn {
  background: rgba(60, 100, 200, 0.8);
  border-color: rgba(60, 100, 200, 1);
  color: #fff;
}

.save-btn:hover {
  background: rgba(60, 100, 200, 1);
}

.cancel-btn {
  background: rgba(200, 60, 60, 0.8);
  border-color: rgba(200, 60, 60, 1);
  color: #fff;
}

.cancel-btn:hover {
  background: rgba(200, 60, 60, 1);
}

/* 页面内容包装器 */
.page-content-wrapper {
  position: relative;
}

/* 消息服务格式化样式 */
.double-quote {
  color: #ffd7a1;
  font-weight: 600;
}

.single-quote {
  color: #b8d7ff;
  font-weight: 500;
}

.strong-text {
  color: #ffbd7a;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: rgba(255, 189, 122, 0.4);
  text-underline-offset: 2px;
}

.italic-text {
  color: #d4e8ff;
  font-style: italic;
  text-decoration: underline dotted;
  text-decoration-color: rgba(212, 232, 255, 0.4);
  text-underline-offset: 2px;
}

.code-block {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
}

.code-content {
  color: #f0e6d2;
  font-size: 14px;
  line-height: 1.4;
}

.inline-code {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.2);
  border-radius: 3px;
  padding: 2px 4px;
  color: #ffd7a1;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.quote {
  border-left: 4px solid rgba(205, 133, 63, 0.6);
  background: rgba(205, 133, 63, 0.1);
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 0 6px 6px 0;
  color: #f0e6d2;
  font-style: italic;
}

/* 消息操作栏 */
.message-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.2);
  border-radius: 6px;
  margin-bottom: 12px;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-sender {
  color: #ffd7a1;
  font-weight: 600;
  font-size: 14px;
}

.message-time {
  color: #f0e6d2;
  font-size: 12px;
  opacity: 0.7;
}

.message-controls {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: rgba(40, 26, 20, 0.8);
  border: 1px solid rgba(205, 133, 63, 0.4);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(40, 26, 20, 1);
  border-color: rgba(205, 133, 63, 0.6);
}

.edit-btn:hover {
  background: rgba(60, 100, 200, 0.3);
}

.delete-btn:hover {
  background: rgba(200, 60, 60, 0.3);
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
}

.edit-dialog-header h3 {
  color: #ffd7a1;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
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

/* 响应式简化 */
@media (max-width: 768px) {
  .manual-training-container .training-header {
    padding: 8px 10px;
  }

  .manual-training-container .character-portrait {
    width: 80px;
    height: 80px;
    border-width: 3px;
  }

  .manual-training-container .character-details {
    margin-left: 6px;

    .character-name-section .character-name {
      font-size: 20px;
    }

    .character-name-section .character-title {
      font-size: 12px;
    }

    .character-stats {
      gap: 8px;

      .stat-item {
        gap: 4px;

        .stat-header {
          .stat-label {
            font-size: 12px;
          }

          .stat-value {
            font-size: 12px;
          }
        }

        .stat-bar {
          height: 6px;
        }
      }
    }
  }

  .manual-training-container .header-btn {
    width: 32px;
    height: 32px;

    .btn-icon {
      font-size: 14px;
    }
  }

  .book-shell {
    margin: 4px 8px;
  }

  .book-nav {
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

  .message-actions {
    opacity: 1; /* 移动端始终显示操作按钮 */
  }

  .message-controls {
    opacity: 1; /* 移动端始终显示操作按钮 */
  }

  /* 移动端增加触摸反馈 */
  .inline-option {
    -webkit-tap-highlight-color: rgba(205, 133, 63, 0.2);
  }

  .inline-send-btn,
  .nav-btn,
  .header-btn {
    -webkit-tap-highlight-color: rgba(205, 133, 63, 0.3);
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
