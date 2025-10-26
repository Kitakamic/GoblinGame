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

      // 如果启用流式传输
      if (enableStream && onStreamUpdate) {
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
   * 滚动到容器底部
   * @param container 容器元素
   */
  static scrollToBottom(container: HTMLElement | null): void {
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }
}
