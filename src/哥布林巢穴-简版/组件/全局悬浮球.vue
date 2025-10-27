<template>
  <div
    ref="fabRef"
    class="global-fab"
    :class="{
      collapsed: isCollapsed,
      dragging: isDragging,
      'on-left': position.left !== 'auto' && position.left < 0,
      'on-right': position.right !== 'auto' && position.right < 0,
      'on-top': position.top !== 'auto' && position.top < 0,
      'on-bottom': position.bottom !== 'auto' && position.bottom < 0,
    }"
    :style="{
      left: position.left === 'auto' ? 'auto' : `${position.left}px`,
      right: position.right === 'auto' ? 'auto' : `${position.right}px`,
      top: position.top === 'auto' ? 'auto' : `${position.top}px`,
      bottom: position.bottom === 'auto' ? 'auto' : `${position.bottom}px`,
      transform: position.top === 'auto' && position.bottom === 'auto' ? 'translateY(-50%)' : 'none',
    }"
  >
    <!-- 悬浮球按钮 -->
    <button
      ref="buttonRef"
      class="fab-button"
      title="游戏菜单"
      @mousedown.stop="startDrag"
      @touchstart.stop="startDrag"
      @click.stop="handleClick"
    >
      <span class="icon">{{ isCollapsed ? '☰' : '✕' }}</span>
    </button>

    <!-- 菜单按钮 -->
    <div v-show="!isCollapsed" class="fab-menu">
      <button class="fab-menu-item" title="游戏设置" @click="openSettings">
        <span class="icon">⚙️</span>
        <span class="label">设置</span>
      </button>
      <button class="fab-menu-item" title="全屏" @click="toggleFullscreen">
        <span class="icon">⛶</span>
        <span class="label">全屏</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

const isCollapsed = ref(true);
const fabRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);

// 通过自定义事件向上传递
const emit = defineEmits(['open-settings']);

// 位置状态
const position = reactive<{
  left: number | 'auto';
  right: number | 'auto';
  top: number | 'auto';
  bottom: number | 'auto';
}>({
  left: 'auto',
  right: -28, // 初始在右侧边缘只显示一半
  top: 'auto',
  bottom: 'auto',
});

// 拖动相关状态
const isDragging = ref(false);
const hasMoved = ref(false);
const dragStartPos = ref({ x: 0, y: 0 });
const elementStartPos = ref({ left: 0, top: 0 });

// 从本地存储加载位置
function loadPosition() {
  try {
    const saved = localStorage.getItem('global-fab-position');
    if (saved) {
      const pos = JSON.parse(saved);
      Object.assign(position, pos);
    }
  } catch (e) {
    console.error('加载悬浮球位置失败', e);
  }
}

// 保存位置到本地存储
function savePosition() {
  try {
    localStorage.setItem('global-fab-position', JSON.stringify(position));
  } catch (e) {
    console.error('保存悬浮球位置失败', e);
  }
}

// 开始拖动
function startDrag(e: MouseEvent | TouchEvent) {
  hasMoved.value = false; // 重置移动标记

  // 获取鼠标/触摸开始位置
  if (e instanceof MouseEvent) {
    dragStartPos.value = { x: e.clientX, y: e.clientY };
  } else if (e.touches && e.touches.length > 0) {
    dragStartPos.value = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  // 添加全局事件监听
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
}

// 拖动中
function handleDrag(e: MouseEvent | TouchEvent) {
  let clientX: number, clientY: number;
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    return;
  }

  // 计算移动距离
  const deltaX = clientX - dragStartPos.value.x;
  const deltaY = clientY - dragStartPos.value.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // 只有移动距离超过阈值(5px)才开始拖动
  if (distance > 5) {
    e.preventDefault();
    hasMoved.value = true;

    // 如果还没开始拖动，现在开始
    if (!isDragging.value) {
      isDragging.value = true;

      // 获取当前元素位置
      if (fabRef.value) {
        const rect = fabRef.value.getBoundingClientRect();
        elementStartPos.value = {
          left: rect.left,
          top: rect.top,
        };
      }

      // 重置位置属性，使用 left 和 top
      position.left = elementStartPos.value.left;
      position.top = elementStartPos.value.top;
      position.right = 'auto';
      position.bottom = 'auto';
    }

    // 计算新位置
    let newLeft = elementStartPos.value.left + deltaX;
    let newTop = elementStartPos.value.top + deltaY;

    // 限制在视口内
    const maxLeft = window.innerWidth - (fabRef.value?.offsetWidth || 56);
    const maxTop = window.innerHeight - (fabRef.value?.offsetHeight || 56);

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    position.left = newLeft;
    position.top = newTop;
  }
}

// 停止拖动并吸附到边缘
function stopDrag() {
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);

  // 如果正在拖动，执行吸附和保存
  if (isDragging.value) {
    isDragging.value = false;

    // 吸附到边缘
    snapToEdge();

    // 保存位置
    savePosition();
  }

  // 重置移动标记
  hasMoved.value = false;
}

// 吸附到最近的边缘
function snapToEdge() {
  if (!fabRef.value) return;

  const rect = fabRef.value.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 判断距离哪个边缘更近
  const distToLeft = rect.left;
  const distToRight = screenWidth - rect.right;
  const distToTop = rect.top;
  const distToBottom = screenHeight - rect.bottom;

  const minHorizontalDist = Math.min(distToLeft, distToRight);
  const minVerticalDist = Math.min(distToTop, distToBottom);

  // 保存当前位置（拖动过程中已经是 left/top）
  const currentLeft = position.left;
  const currentTop = position.top;

  // 先重置为当前拖动位置
  position.left = currentLeft;
  position.top = currentTop;
  position.right = 'auto';
  position.bottom = 'auto';

  // 按钮一半宽度的距离（用于边缘半显示）
  const buttonHalfWidth = 28; // 56px / 2
  const mobileButtonHalfWidth = 24; // 48px / 2
  const isMobile = window.innerWidth <= 768;
  const halfWidth = isMobile ? mobileButtonHalfWidth : buttonHalfWidth;

  // 关闭四个角的吸附，只吸附到单一方向的边缘
  // 如果水平和垂直都接近边缘，只选择距离更近的那个方向吸附
  if (minHorizontalDist < 100 && minVerticalDist < 100) {
    // 两个方向都接近边缘，选择距离更近的那个
    if (minHorizontalDist < minVerticalDist) {
      // 水平方向更近，只吸附到水平方向
      if (distToLeft < distToRight) {
        position.left = -halfWidth;
        position.right = 'auto';
      } else {
        position.right = -halfWidth;
        position.left = 'auto';
      }
    } else if (distToTop < distToBottom) {
      // 垂直方向更近，吸附到顶部
      position.top = -halfWidth;
      position.bottom = 'auto';
    } else {
      // 垂直方向更近，吸附到底部
      position.bottom = -halfWidth;
      position.top = 'auto';
    }
  } else if (minHorizontalDist < 100) {
    // 只在水平方向接近边缘，吸附
    if (distToLeft < distToRight) {
      position.left = -halfWidth;
      position.right = 'auto';
    } else {
      position.right = -halfWidth;
      position.left = 'auto';
    }
  } else if (minVerticalDist < 100) {
    // 只在垂直方向接近边缘，吸附
    if (distToTop < distToBottom) {
      position.top = -halfWidth;
      position.bottom = 'auto';
    } else {
      position.bottom = -halfWidth;
      position.top = 'auto';
    }
  }

  // 检测是否实际发生了吸附（position值变成了负值）
  const isSnappedToEdge =
    (position.left !== 'auto' && position.left < 0) ||
    (position.right !== 'auto' && position.right < 0) ||
    (position.top !== 'auto' && position.top < 0) ||
    (position.bottom !== 'auto' && position.bottom < 0);

  // 只有在实际吸附到边缘时才关闭菜单
  if (isSnappedToEdge) {
    isCollapsed.value = true;
  }
}

function toggleMenu() {
  isCollapsed.value = !isCollapsed.value;
}

function handleClick() {
  // 如果没有发生过拖动，才切换菜单
  if (!hasMoved.value && !isDragging.value) {
    toggleMenu();
  }
  // 重置移动标记
  hasMoved.value = false;
}

function openSettings() {
  emit('open-settings');
  // 延迟关闭菜单，让用户看到反馈
  setTimeout(() => {
    isCollapsed.value = true;
  }, 300);
}

function toggleFullscreen() {
  const element = document.querySelector('.mini-goblin');
  if (!document.fullscreenElement) {
    element?.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err}`);
    });
  } else {
    document.exitFullscreen();
  }
  // 延迟关闭菜单
  setTimeout(() => {
    isCollapsed.value = true;
  }, 300);
}

// 组件加载时恢复位置
onMounted(() => {
  loadPosition();
});
</script>

<style scoped lang="scss">
.global-fab {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  user-select: none;
  -webkit-user-select: none;

  // 当不在拖动时，使用过渡效果
  &:not(.dragging) {
    transition:
      left 0.3s ease,
      right 0.3s ease,
      top 0.3s ease,
      bottom 0.3s ease;
  }

  // 拖动时禁用过渡
  &.dragging {
    transition: none;
  }

  // 悬停时，从边缘移出（完全显示）
  &:hover:not(.dragging) {
    // 右侧（包括右下角、右上角、纯右）
    &.on-right {
      right: 20px !important;

      @media (max-width: 768px) {
        right: 12px !important;
      }
    }

    // 左侧（包括左下角、左上角、纯左）
    &.on-left {
      left: 0px !important;
    }

    // 顶部（包括右上角、左上角、纯顶）
    &.on-top {
      top: 20px !important;

      @media (max-width: 768px) {
        top: 12px !important;
      }
    }

    // 底部（包括右下角、左下角、纯底）
    &.on-bottom {
      bottom: 20px !important;

      @media (max-width: 768px) {
        bottom: 12px !important;
      }
    }

    // 取消边缘半显示时的过渡（保持平滑）
    transition:
      left 0.3s ease,
      right 0.3s ease,
      top 0.3s ease,
      bottom 0.3s ease !important;
  }

  &.collapsed {
    .fab-menu {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  }
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(67, 56, 202, 0.98));
  border: 2px solid rgba(139, 92, 246, 0.6);
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(196, 181, 253, 0.2);
  transition: all 0.3s ease;
  position: relative;

  .icon {
    font-size: 24px;
    color: #c4b5fd;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    transition: all 0.3s ease;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.4));
    border-color: rgba(167, 139, 250, 0.9);
    transform: scale(1.1);
    box-shadow:
      0 6px 16px rgba(139, 92, 246, 0.5),
      0 0 30px rgba(124, 58, 237, 0.4),
      inset 0 1px 0 rgba(196, 181, 253, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
}

.fab-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 1;
  visibility: visible;
  transition: all 0.3s ease;
}

.fab-menu-item {
  width: 120px;
  height: 50px;
  background: linear-gradient(135deg, rgba(55, 48, 163, 0.95), rgba(30, 27, 75, 0.98));
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  gap: 10px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(196, 181, 253, 0.1);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }

  .icon {
    font-size: 20px;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
    flex-shrink: 0;
  }

  .label {
    color: #c4b5fd;
    font-size: 14px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  &:hover {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.3));
    border-color: rgba(167, 139, 250, 0.8);
    transform: translateX(-8px);
    box-shadow:
      0 6px 16px rgba(139, 92, 246, 0.5),
      inset 0 1px 0 rgba(196, 181, 253, 0.2);

    &::before {
      transform: translateX(100%);
    }

    .icon {
      transform: scale(1.2);
    }
  }

  &:active {
    transform: translateX(-6px) scale(0.98);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .global-fab {
    right: -24px; // 移动端在右侧边缘只显示一半
  }

  .fab-button {
    width: 48px;
    height: 48px;

    .icon {
      font-size: 20px;
    }
  }

  .fab-menu-item {
    width: 100px;
    height: 44px;
    padding: 0 12px;
    gap: 8px;

    .icon {
      font-size: 18px;
    }

    .label {
      font-size: 12px;
    }
  }
}
</style>
