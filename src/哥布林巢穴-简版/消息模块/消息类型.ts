// 消息类型定义
export interface Message {
  message_id?: number;
  role: 'system' | 'assistant' | 'user';
  sender: string;
  time: string;
  content: string;
}

// 消息发送选项
export interface MessageSendOptions {
  userInput: string;
  onSuccess?: (response: string) => void;
  onError?: (error: Error) => void;
}

// 消息格式化选项
export interface MessageFormatOptions {
  enableMarkdown?: boolean;
  enableCodeHighlight?: boolean;
  enableQuote?: boolean;
}

// 消息导出选项
export interface MessageExportOptions {
  format: 'txt' | 'json';
  filename?: string;
}
