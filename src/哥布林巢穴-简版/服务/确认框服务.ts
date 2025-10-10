import { ref } from 'vue';

interface ConfirmOptions {
  title?: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showClose?: boolean;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  details?: string;
  confirmText: string;
  cancelText: string;
  showCancel: boolean;
  showClose: boolean;
  type: 'info' | 'warning' | 'danger' | 'success';
  resolve?: (value: boolean) => void;
}

// 全局确认框状态
const confirmState = ref<ConfirmState>({
  show: false,
  title: '提示',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
  showClose: true,
  type: 'info',
});

/**
 * 确认框服务
 * 提供统一的确认框管理
 */
export class ConfirmService {
  /**
   * 显示信息提示（无确认按钮）
   */
  static showInfo(message: string, title: string = '提示', details?: string): Promise<void> {
    return new Promise(resolve => {
      confirmState.value = {
        show: true,
        title,
        message,
        details,
        confirmText: '确定',
        cancelText: '',
        showCancel: false,
        showClose: true,
        type: 'info',
        resolve: () => {
          confirmState.value.show = false;
          resolve();
        },
      };
    });
  }

  /**
   * 显示成功提示（无确认按钮）
   */
  static showSuccess(message: string, title: string = '成功', details?: string): Promise<void> {
    return new Promise(resolve => {
      confirmState.value = {
        show: true,
        title,
        message,
        details,
        confirmText: '确定',
        cancelText: '',
        showCancel: false,
        showClose: true,
        type: 'success',
        resolve: () => {
          confirmState.value.show = false;
          resolve();
        },
      };
    });
  }

  /**
   * 显示警告确认框
   */
  static showWarning(message: string, title: string = '警告', details?: string): Promise<boolean> {
    return new Promise(resolve => {
      confirmState.value = {
        show: true,
        title,
        message,
        details,
        confirmText: '确定',
        cancelText: '取消',
        showCancel: true,
        showClose: true,
        type: 'warning',
        resolve: (confirmed: boolean) => {
          confirmState.value.show = false;
          resolve(confirmed);
        },
      };
    });
  }

  /**
   * 显示危险操作确认框
   */
  static showDanger(message: string, title: string = '危险操作', details?: string): Promise<boolean> {
    return new Promise(resolve => {
      confirmState.value = {
        show: true,
        title,
        message,
        details,
        confirmText: '确认执行',
        cancelText: '取消',
        showCancel: true,
        showClose: true,
        type: 'danger',
        resolve: (confirmed: boolean) => {
          confirmState.value.show = false;
          resolve(confirmed);
        },
      };
    });
  }

  /**
   * 显示通用确认框
   */
  static showConfirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      confirmState.value = {
        show: true,
        title: options.title || '确认',
        message: options.message,
        details: options.details,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        showCancel: options.showCancel !== false,
        showClose: options.showClose !== false,
        type: options.type || 'info',
        resolve: (confirmed: boolean) => {
          confirmState.value.show = false;
          resolve(confirmed);
        },
      };
    });
  }

  /**
   * 处理确认
   */
  static handleConfirm(): void {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(true);
    }
  }

  /**
   * 处理取消
   */
  static handleCancel(): void {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(false);
    }
  }

  /**
   * 处理关闭
   */
  static handleClose(): void {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(false);
    }
  }

  /**
   * 获取确认框状态
   */
  static getState() {
    return confirmState;
  }
}

// 导出状态供组件使用
export { confirmState };
