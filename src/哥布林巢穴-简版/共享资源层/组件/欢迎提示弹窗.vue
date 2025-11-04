<template>
  <div v-if="show" class="welcome-modal-overlay" @click="handleOverlayClick">
    <div class="welcome-modal" @click.stop>
      <div class="modal-header">
        <h2>🎮 欢迎游玩哥布林巢穴</h2>
      </div>

      <div class="modal-content">
        <div class="welcome-message">
          <p>
            感谢您游玩本前端界面卡！本前端界面是免费开源项目，严禁任何形式的商业化或盗用行为。如发现侵权行为，请通过Discord联系原作者：北上。
            <br />
            版本号：{{ FRONTEND_VERSION }}
            <br />
            更新时间：{{ FRONTEND_UPDATE_DATE }}
          </p>
        </div>

        <div class="links-section">
          <div class="link-item">
            <span class="link-icon">📖</span>
            <span class="link-label">教程文档:</span>
            <a
              href="https://docs.google.com/document/d/1UV8hG4hgYfg6nyRHquQ36pz4-Fb8QCB3cxakLXXbRss/edit?tab=t.0#heading=h.1scl3yr0eg9"
              target="_blank"
              class="link-button"
            >
              查看教程
            </a>
          </div>

          <div class="link-item">
            <span class="link-icon">💬</span>
            <span class="link-label">Discord帖子:</span>
            <a
              href="https://discordapp.com/channels/1134557553011998840/1433109877873442876"
              target="_blank"
              class="link-button"
            >
              查看帖子
            </a>
          </div>
        </div>

        <div class="notice-section">
          <p class="notice-title">⚠️ 重要提示</p>
          <p class="notice-text">
            强烈推荐全屏进行游玩，尤其是手机端~手机端个人推荐Via浏览器，因为某些浏览器手机全屏也会弹出菜单，说的就是你Edge浏览器！
            <br />
            游玩前请务必确保以下几项正确配置：
            <br />
            1. 酒馆助手设置请 关闭渲染器-启用BlobURL渲染
            <br />
            2.
            预设的正则，请保证打开仅格式显示和仅格式提示词（如果两个全空改为全开即可），尤其是你发现你的AI回复中出现标签
            <br />
          </p>
        </div>
      </div>

      <div class="modal-actions">
        <button class="confirm-button" @click="handleConfirm">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FRONTEND_UPDATE_DATE, FRONTEND_VERSION } from '../../version';

interface Props {
  show: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  confirm: [];
  close: [];
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleOverlayClick = () => {
  // 不允许点击外部关闭
};
</script>

<style scoped lang="scss">
.welcome-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(5px);

  .welcome-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.98), rgba(25, 17, 14, 0.99));
    border: 3px solid rgba(205, 133, 63, 0.6);
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.8),
      0 0 40px rgba(205, 133, 63, 0.3);
    animation: welcomeModalSlideIn 0.4s ease-out;

    @media (max-width: 768px) {
      width: 95%;
      border-radius: 16px;
    }

    .modal-header {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px 28px;
      border-bottom: 2px solid rgba(205, 133, 63, 0.3);
      background: linear-gradient(180deg, rgba(205, 133, 63, 0.15), transparent);

      h2 {
        margin: 0;
        color: #ffd7a1;
        font-size: 24px;
        font-weight: 700;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      }
    }

    .modal-content {
      padding: 28px;

      @media (max-width: 768px) {
        padding: 20px;
      }

      .welcome-message {
        margin-bottom: 24px;
        padding: 16px;
        background: rgba(5, 150, 105, 0.15);
        border: 2px solid rgba(5, 150, 105, 0.3);
        border-radius: 12px;
        border-left: 4px solid rgba(5, 150, 105, 0.6);

        p {
          margin: 0;
          color: #f0e6d2;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.6;
          text-align: center;
        }
      }

      .links-section {
        margin-bottom: 24px;

        .link-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          margin-bottom: 12px;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(0, 0, 0, 0.4);
            transform: translateX(4px);
          }

          .link-icon {
            font-size: 24px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          }

          .link-label {
            flex-shrink: 0;
            color: #f0e6d2;
            font-size: 15px;
            font-weight: 600;
            min-width: 100px;
          }

          .link-button {
            flex: 1;
            padding: 10px 16px;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            text-align: center;
            border: 2px solid rgba(59, 130, 246, 0.5);

            &:hover {
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              transform: translateY(-2px);
              box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
              border-color: rgba(59, 130, 246, 0.8);
            }
          }
        }
      }

      .notice-section {
        padding: 18px;
        background: rgba(245, 158, 11, 0.15);
        border: 2px solid rgba(245, 158, 11, 0.4);
        border-radius: 12px;
        border-left: 5px solid rgba(245, 158, 11, 0.8);

        .notice-title {
          margin: 0 0 10px 0;
          color: #fbbf24;
          font-size: 16px;
          font-weight: 700;
        }

        .notice-text {
          margin: 0;
          color: #f0e6d2;
          font-size: 14px;
          line-height: 1.6;
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      padding: 20px 28px;
      border-top: 2px solid rgba(205, 133, 63, 0.3);
      background: linear-gradient(0deg, rgba(205, 133, 63, 0.1), transparent);

      .confirm-button {
        padding: 14px 36px;
        background: linear-gradient(180deg, #059669, #047857);
        border: 2px solid rgba(5, 150, 105, 0.6);
        border-radius: 12px;
        color: #ffffff;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);

        &:hover {
          background: linear-gradient(180deg, #047857, #065f46);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }
  }
}

@keyframes welcomeModalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
