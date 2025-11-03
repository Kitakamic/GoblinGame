import { App, createApp } from 'vue';
import 弹窗提示 from '../../../共享资源层/组件/弹窗提示.vue';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
}

class ToastService {
  private app: App | null = null;
  private instance: any = null;
  private container: HTMLElement | null = null;
  private fullscreenListener: (() => void) | null = null;

  /**
   * 初始化 Toast 服务
   */
  init() {
    if (this.instance) return;

    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'toast-service-container';

    // 根据当前是否在全屏模式来决定添加到哪个元素
    const targetElement = document.fullscreenElement || document.body;
    targetElement.appendChild(this.container);

    // 创建 Vue 应用实例
    this.app = createApp(弹窗提示);
    this.instance = this.app.mount(this.container);

    // 监听全屏状态变化，动态调整容器位置
    this.setupFullscreenListener();
  }

  /**
   * 销毁 Toast 服务
   */
  destroy() {
    if (this.app) {
      this.app.unmount();
      this.app = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.instance = null;

    // 移除全屏监听器
    this.removeFullscreenListener();
  }

  /**
   * 显示成功提示
   */
  success(message: string, options?: Omit<ToastOptions, 'message' | 'type'>) {
    this.ensureInitialized();
    return this.instance?.success(message, options);
  }

  /**
   * 显示错误提示
   */
  error(message: string, options?: Omit<ToastOptions, 'message' | 'type'>) {
    this.ensureInitialized();
    return this.instance?.error(message, options);
  }

  /**
   * 显示警告提示
   */
  warning(message: string, options?: Omit<ToastOptions, 'message' | 'type'>) {
    this.ensureInitialized();
    return this.instance?.warning(message, options);
  }

  /**
   * 显示信息提示
   */
  info(message: string, options?: Omit<ToastOptions, 'message' | 'type'>) {
    this.ensureInitialized();
    return this.instance?.info(message, options);
  }

  /**
   * 添加自定义提示
   */
  add(options: ToastOptions) {
    this.ensureInitialized();
    return this.instance?.addToast(options);
  }

  /**
   * 移除指定提示
   */
  remove(id: string) {
    if (this.instance) {
      this.instance.removeToast(id);
    }
  }

  /**
   * 清除所有提示
   */
  clear() {
    if (this.instance) {
      this.instance.clearAllToasts();
    }
  }

  /**
   * 设置全屏监听器
   */
  private setupFullscreenListener() {
    this.fullscreenListener = () => {
      if (this.container) {
        // 移除当前容器
        this.container.remove();

        // 重新添加到正确的目标元素
        const targetElement = document.fullscreenElement || document.body;
        targetElement.appendChild(this.container);
      }
    };

    document.addEventListener('fullscreenchange', this.fullscreenListener);
  }

  /**
   * 移除全屏监听器
   */
  private removeFullscreenListener() {
    if (this.fullscreenListener) {
      document.removeEventListener('fullscreenchange', this.fullscreenListener);
      this.fullscreenListener = null;
    }
  }

  /**
   * 确保服务已初始化
   */
  private ensureInitialized() {
    if (!this.instance) {
      this.init();
    }
  }
}

// 创建全局实例
export const toastService = new ToastService();

// 便捷的全局方法
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
    toastService.success(message, options),

  error: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => toastService.error(message, options),

  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) =>
    toastService.warning(message, options),

  info: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => toastService.info(message, options),

  add: (options: ToastOptions) => toastService.add(options),

  remove: (id: string) => toastService.remove(id),

  clear: () => toastService.clear(),
};

// 在页面卸载时清理
$(window).on('pagehide', () => {
  toastService.destroy();
});
