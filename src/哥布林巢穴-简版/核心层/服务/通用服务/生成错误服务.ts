import { ref } from 'vue';

export interface GenerationErrorOptions {
  title?: string;
  message: string;
  summary?: string;
  details?: string;
  rawText?: string; // 原始AI输出，用于调试编辑
  onRetry?: (editedText: string) => Promise<void>; // 重新解析回调
}

interface GenerationErrorState {
  show: boolean;
  title: string;
  message: string;
  summary?: string;
  details?: string;
  rawText?: string; // 原始AI输出，用于调试编辑
  onRetry?: (editedText: string) => Promise<void>; // 重新解析回调
  resolve?: () => void;
}

// 全局错误状态
const errorState = ref<GenerationErrorState>({
  show: false,
  title: '生成错误',
  message: '',
});

/**
 * 生成错误服务
 * 提供统一的生成错误显示管理
 */
export class GenerationErrorService {
  /**
   * 显示生成错误
   */
  static showError(options: GenerationErrorOptions): Promise<void> {
    return new Promise(resolve => {
      errorState.value = {
        show: true,
        title: options.title || '生成错误',
        message: options.message,
        summary: options.summary,
        details: options.details,
        rawText: options.rawText,
        onRetry: options.onRetry,
        resolve: () => {
          errorState.value.show = false;
          resolve();
        },
      };
    });
  }

  /**
   * 处理关闭
   */
  static handleClose(): void {
    if (errorState.value.resolve) {
      errorState.value.resolve();
    }
  }

  /**
   * 获取错误状态
   */
  static getState() {
    return errorState;
  }
}

// 导出状态供组件使用
export { errorState };

// 便捷的全局方法
export const showGenerationError = (options: GenerationErrorOptions): Promise<void> => {
  return GenerationErrorService.showError(options);
};
