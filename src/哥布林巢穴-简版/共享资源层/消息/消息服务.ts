import type { Message, MessageExportOptions, MessageFormatOptions, MessageSendOptions } from './消息类型';

/**
 * 消息服务类 - 处理消息的发送、接收、格式化等功能
 */
export class MessageService {
  /**
   * 格式化消息内容
   * @param content 原始消息内容
   * @param options 格式化选项
   * @returns 格式化后的HTML内容
   */
  static formatMessage(content: string, options: MessageFormatOptions = {}): string {
    const { enableMarkdown = true, enableCodeHighlight = true, enableQuote = true } = options;

    // 首先对输入内容进行 HTML 转义，防止 XSS 攻击
    let formatted = content;

    if (enableMarkdown) {
      // 处理换行符
      formatted = formatted.replace(/\n/g, '<br>');

      // 处理引用格式
      if (enableQuote) {
        formatted = formatted.replace(/^> (.+)$/gm, '<blockquote class="quote">$1</blockquote>');
      }

      // 处理英文双引号
      formatted = formatted.replace(/"([^"]*)"/g, '<span class="double-quote">"$1"</span>');
      // 处理中文双引号（“”）
      formatted = formatted.replace(/“([^”]+)”/g, '<span class="double-quote">"$1"</span>');
      // 处理中文双引号（「」）
      formatted = formatted.replace(/「([^」]+)」/g, '<span class="double-quote">「$1」</span>');
      // 处理中文双引号（『』）
      formatted = formatted.replace(/『([^』]+)』/g, '<span class="double-quote">『$1』</span>');
      // 处理英文单引号
      formatted = formatted.replace(/'([^']+)'/g, '<span class="single-quote">\'$1\'</span>');
      // 处理中文单引号（‘’）
      formatted = formatted.replace(/‘([^’]+)’/g, '<span class="single-quote">\'$1\'</span>');

      // 处理粗体
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="strong-text">$1</strong>');

      // 处理斜体
      formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic-text">$1</em>');

      // 处理代码块
      if (enableCodeHighlight) {
        formatted = formatted.replace(/```([\s\S]*?)```/g, (_, code) => {
          // 检测代码语言
          const language =
            code
              .trim()
              .split('\n')[0]
              .match(/^\s*```(\w+)\s*$/)?.[1] || '';
          const codeContent = code
            .trim()
            .replace(/^\s*```(\w+)\s*\n?/, '')
            .replace(/\n*```\s*$/, '');
          return `<pre class="code-block"><code class="code-content" data-language="${language}">${codeContent}</code></pre>`;
        });

        // 处理行内代码
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
      }
    }

    return formatted;
  }

  /**
   * 获取当前时间字符串
   * @returns 格式化的时间字符串
   */
  static getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * 创建消息对象
   * @param role 消息角色
   * @param content 消息内容
   * @param sender 发送者名称
   * @param messageId 消息ID
   * @returns 消息对象
   */
  static createMessage(
    role: 'system' | 'assistant' | 'user',
    content: string,
    sender: string,
    messageId?: number,
  ): Message {
    return {
      message_id: messageId,
      role,
      sender,
      time: this.getCurrentTime(),
      content,
    };
  }

  /**
   * 发送消息并获取AI回复
   * @param options 发送选项
   * @returns Promise<Message> AI回复消息
   */
  static async sendMessage(options: MessageSendOptions): Promise<Message> {
    const { userInput, onSuccess, onError, enableStream, onStreamUpdate } = options;

    try {
      // 创建玩家消息
      await window.TavernHelper.createChatMessages([
        {
          role: 'user',
          message: userInput,
        },
      ]);

      let response = '';

      // 读取全局流式传输设置
      const globalVars = getVariables({ type: 'global' });
      const globalEnableStream =
        typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : false; // 默认关闭

      // 如果启用流式传输（需要同时满足调用者要求和全局设置）
      if (enableStream && onStreamUpdate && globalEnableStream) {
        console.log('🌊 启用流式传输');

        // 监听流式传输事件
        const handleStreamToken = (text: string) => {
          console.log('📝 流式传输更新:', text);
          // 先应用酒馆正则处理
          const regexResponse = formatAsTavernRegexedString(text, 'ai_output', 'display');
          onStreamUpdate(regexResponse);
        };

        // 监听完整文本
        eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

        try {
          // 启用流式传输的生成
          const finalResponse = await window.TavernHelper.generate({
            user_input: userInput,
            should_stream: true,
          });

          response = finalResponse;

          // 移除事件监听
          eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);
        } catch (error) {
          // 移除事件监听
          eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);
          throw error;
        }
      } else {
        // 普通对话不需要思维链约束，直接调用AI
        response = await window.TavernHelper.generate({
          user_input: userInput,
        });
      }

      // 格式化AI回复
      console.log('🧹 原始AI回复:', response);
      const regexResponse = formatAsTavernRegexedString(response, 'ai_output', 'display');
      console.log('🎨 应用酒馆正则后的回复:', regexResponse);
      console.log('🔄 内容是否发生变化:', response !== regexResponse);

      // 创建AI回复消息
      await window.TavernHelper.createChatMessages([
        {
          role: 'assistant',
          message: regexResponse,
        },
      ]);

      const aiMessage = this.createMessage('assistant', regexResponse, '系统');

      if (onSuccess) {
        onSuccess(regexResponse);
      }

      return aiMessage;
    } catch (error) {
      const errorMessage = this.createMessage('system', '抱歉，生成回复时出现错误，请稍后再试。', '系统');

      if (onError) {
        onError(error as Error);
      }

      return errorMessage;
    }
  }

  /**
   * 加载历史消息
   * @param messageRange 消息范围，默认为 '0-{{lastMessageId}}'
   * @returns Promise<Message[]> 历史消息列表
   */
  static async loadHistoryMessages(messageRange: string = '0-{{lastMessageId}}'): Promise<Message[]> {
    try {
      const chatMessages = await window.TavernHelper.getChatMessages(messageRange);
      return chatMessages.map(msg => ({
        message_id: msg.message_id,
        role: msg.role,
        sender: msg.role === 'user' ? '玩家' : '系统',
        time: '10:00', // 可以从消息中提取时间
        content: msg.message,
      }));
    } catch (error) {
      console.error('加载历史消息失败:', error);
      return [];
    }
  }

  /**
   * 导出消息
   * @param messages 消息列表
   * @param options 导出选项
   */
  static exportMessages(messages: Message[], options: MessageExportOptions = { format: 'txt' }): void {
    const { format = 'txt', filename = 'messages' } = options;

    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      content = messages.map(msg => `[${msg.time}] ${msg.sender}: ${msg.content}`).join('\n');
      mimeType = 'text/plain';
      fileExtension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 滚动到容器底部（智能滚动）
   * @param container 容器元素
   * @param options 滚动选项
   */
  static scrollToBottom(
    container: HTMLElement | null,
    options: { force?: boolean; enableStreamFollow?: boolean } = {},
  ): void {
    if (!container) return;

    const { force = false, enableStreamFollow = false } = options;

    // 获取容器的滚动状态对象（存储在元素上）
    let scrollState = (container as any).__scrollState;
    if (!scrollState) {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const currentScrollTop = container.scrollTop;
      const isNearBottom = scrollHeight - currentScrollTop - clientHeight < 50;

      scrollState = {
        userScrolled: false,
        lastScrollTop: currentScrollTop,
        isNearBottom: isNearBottom,
      };
      (container as any).__scrollState = scrollState;

      // 监听滚动事件，检测用户是否手动滚动
      container.addEventListener('scroll', () => {
        const currentScrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // 判断是否接近底部（距离底部 50px 内认为是接近底部）
        const isNearBottom = scrollHeight - currentScrollTop - clientHeight < 50;

        // 如果用户向上滚动，标记为用户手动滚动
        if (currentScrollTop < scrollState.lastScrollTop && !isNearBottom) {
          scrollState.userScrolled = true;
        }

        // 如果用户滚动到底部，重置用户滚动标记
        if (isNearBottom) {
          scrollState.userScrolled = false;
        }

        scrollState.lastScrollTop = currentScrollTop;
        scrollState.isNearBottom = isNearBottom;
      });
    }

    // 如果是强制滚动，直接滚动
    if (force) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        scrollState.userScrolled = false; // 重置用户滚动标记
      }, 100);
      return;
    }

    // 如果是流式输出且开启了跟随，且用户未手动滚动，则自动滚动
    if (enableStreamFollow && !scrollState.userScrolled) {
      setTimeout(() => {
        // 再次检查用户是否在滚动过程中手动滚动了
        if (!scrollState.userScrolled) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
      return;
    }

    // 其他情况（非流式或用户已手动滚动），不自动滚动
  }
}
