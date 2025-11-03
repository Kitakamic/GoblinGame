import { onMounted, ref } from 'vue';
import { MessageService } from './消息服务';
import type { Message, MessageExportOptions, MessageFormatOptions, MessageSendOptions } from './消息类型';

/**
 * 消息聊天 Composable
 * 提供消息交互的响应式状态和方法
 */
export function useMessageChat(options: { autoLoadHistory?: boolean } = {}) {
  const { autoLoadHistory = true } = options;
  // 响应式数据
  const messages = ref<Message[]>([]);
  const currentMessage = ref('');
  const isLoading = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  /**
   * 加载历史消息
   */
  const loadHistoryMessages = async (messageRange?: string) => {
    try {
      const historyMessages = await MessageService.loadHistoryMessages(messageRange);
      messages.value = historyMessages;
    } catch (error) {
      console.error('加载历史消息失败:', error);
    }
  };

  /**
   * 发送消息
   */
  const sendMessage = async (options?: Partial<MessageSendOptions>) => {
    if (!currentMessage.value.trim()) return;

    const messageContent = currentMessage.value;
    currentMessage.value = '';

    // 添加玩家消息到本地
    const playerMessage = MessageService.createMessage('user', messageContent, '玩家');
    messages.value = [...messages.value, playerMessage];

    // 不自动滚动，让玩家自己控制

    isLoading.value = true;

    try {
      // 发送消息并获取AI回复
      const aiMessage = await MessageService.sendMessage({
        userInput: messageContent,
        ...options,
      });

      // 添加AI回复到本地
      messages.value = [...messages.value, aiMessage];

      // 不自动滚动，让玩家自己控制
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 清空消息
   */
  const clearMessages = () => {
    messages.value = [];
  };

  /**
   * 格式化消息内容
   */
  const formatMessage = (content: string, options?: MessageFormatOptions) => {
    return MessageService.formatMessage(content, options);
  };

  /**
   * 导出消息
   */
  const exportMessages = (options?: MessageExportOptions) => {
    MessageService.exportMessages(messages.value, options);
  };

  /**
   * 添加系统消息
   */
  const addSystemMessage = (content: string) => {
    const systemMessage = MessageService.createMessage('system', content, '系统');
    messages.value = [...messages.value, systemMessage];
    // 不自动滚动，让玩家自己控制
  };

  /**
   * 添加用户消息（不发送到AI）
   */
  const addUserMessage = (content: string) => {
    const userMessage = MessageService.createMessage('user', content, '{{user}}');
    messages.value = [...messages.value, userMessage];
    // 不自动滚动，让玩家自己控制
  };

  /**
   * 添加AI消息
   */
  const addAIMessage = (content: string, sender: string = '系统') => {
    const aiMessage = MessageService.createMessage('assistant', content, sender);
    messages.value = [...messages.value, aiMessage];
    // 不自动滚动，让玩家自己控制
  };

  // 组件挂载时根据选项决定是否加载历史消息
  onMounted(() => {
    if (autoLoadHistory) {
      loadHistoryMessages();
    }
  });

  return {
    // 响应式数据
    messages,
    currentMessage,
    isLoading,
    containerRef,

    // 方法
    sendMessage,
    clearMessages,
    formatMessage,
    exportMessages,
    loadHistoryMessages,
    addSystemMessage,
    addUserMessage,
    addAIMessage,
  };
}
