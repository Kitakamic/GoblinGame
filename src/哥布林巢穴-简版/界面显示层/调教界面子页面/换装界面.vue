<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content outfit-modal" @click.stop>
      <div class="modal-header">
        <div class="header-left"></div>
        <h4 class="outfit-title">👗 换装界面</h4>
        <div class="header-right">
          <button class="close-btn" @click="close">×</button>
        </div>
      </div>

      <div v-if="character" class="modal-body">
        <div class="outfit-content">
          <!-- 左侧：人物头像 -->
          <div class="character-preview-column">
            <div class="character-avatar" :class="`rating-${(character.rating || 'D').toLowerCase()}`">
              <div class="avatar-container">
                <img v-if="getCurrentAvatar(character)" :src="getCurrentAvatar(character)" :alt="character.name" />
                <div v-else class="default-avatar">
                  <span class="avatar-icon">👤</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 中间：服装设置区域 -->
          <div class="outfit-selection">
            <!-- 服装分类 -->
            <div class="outfit-categories">
              <div
                v-for="category in outfitCategories"
                :key="category.key"
                class="outfit-category"
                :class="{ active: selectedCategory === category.key }"
                @click="selectedCategory = category.key"
              >
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
              </div>
            </div>

            <!-- 当前选择的服装部位 -->
            <div class="current-outfit-section">
              <h4>
                <span class="section-icon">{{ getCurrentCategoryIcon() }}</span>
                {{ getCurrentCategoryName() }}
              </h4>

              <div class="outfit-input-group">
                <input
                  v-model="currentOutfitValue"
                  type="text"
                  :placeholder="`输入${getCurrentCategoryName()}...`"
                  class="outfit-input"
                  @input="updateOutfit"
                />
                <button class="clear-btn" title="清空" @click="clearOutfit">🗑️</button>
              </div>

              <!-- 预设选项 -->
              <div class="preset-options">
                <h5>预设选项：</h5>
                <div class="preset-grid">
                  <div
                    v-for="preset in getCurrentPresets()"
                    :key="preset"
                    class="preset-item"
                    :class="{ selected: currentOutfitValue === preset }"
                    @click="selectPreset(preset)"
                  >
                    {{ preset }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="outfit-actions">
              <button class="action-btn secondary" @click="resetAllOutfits">
                <span class="btn-icon">🔄</span>
                重置全部
              </button>
              <button class="action-btn primary" @click="saveOutfits">
                <span class="btn-icon">💾</span>
                保存服装
              </button>
            </div>
          </div>

          <!-- 右侧：服装总览 -->
          <div class="outfit-overview">
            <h4>
              <span class="section-icon">👗</span>
              当前服装总览
            </h4>
            <div class="overview-grid">
              <div
                v-for="category in outfitCategories"
                :key="category.key"
                class="overview-item"
                :class="{ empty: !getOutfitValue(category.key) }"
              >
                <div class="overview-icon">{{ category.icon }}</div>
                <div class="overview-content">
                  <div class="overview-label">{{ category.name }}</div>
                  <div class="overview-value">{{ getOutfitValue(category.key) || '无' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { WorldbookService } from '../../核心层/服务/世界书管理/服务/世界书服务';
import { AvatarSwitchService } from '../../功能模块层/人物管理/服务/头像切换服务';
import type { Character } from '../../功能模块层/人物管理/类型/人物类型';

// 定义组件属性
interface Props {
  show: boolean;
  character: Character | null;
}

// 定义组件事件
interface Emits {
  (e: 'close'): void;
  (e: 'save-outfit', character: Character): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 服装部位定义
const outfitCategories = [
  { key: 'head', name: '头部', icon: '👑' },
  { key: 'top', name: '上装', icon: '👕' },
  { key: 'bottom', name: '下装', icon: '👖' },
  { key: 'socks', name: '袜子', icon: '🧦' },
  { key: 'shoes', name: '鞋子', icon: '👠' },
  { key: 'underwear', name: '内衣', icon: '🩱' },
  { key: 'accessories', name: '装饰', icon: '💎' },
  { key: 'toys', name: '玩具', icon: '🎀' },
];

// 获取当前应该显示的头像
const getCurrentAvatar = (character: Character | null): string | undefined => {
  if (!character) return undefined;
  return AvatarSwitchService.getAvatarByCorruptionLevel(character);
};

// 预设服装选项
const outfitPresets = {
  head: ['无', '兔耳头饰', '猫耳头饰', '蕾丝眼罩', '项圈', '口球'],
  top: ['无', '透明衬衫', '蕾丝胸罩', '比基尼上衣', '情趣内衣', '真空装'],
  bottom: ['无', '蕾丝内裤', '丁字裤', '比基尼下装', '开裆裤', '真空装'],
  socks: ['无', '蕾丝长袜', '吊带袜', '渔网袜', '过膝袜', '连裤袜'],
  shoes: ['无', '高跟鞋', '长靴', '凉鞋', '芭蕾舞鞋', '情趣鞋'],
  underwear: ['无', '蕾丝内衣套装', '情趣连体衣', '丁字裤套装', '真空装', '束缚装'],
  accessories: ['无', '蕾丝项圈', '手铐', '脚镣', '乳夹', '尾巴'],
  toys: ['无', '震动棒', '跳蛋', '口球', '肛塞', '束缚绳'],
};

// 响应式数据
const selectedCategory = ref('head');
const currentOutfitValue = ref('');

// 计算属性
const character = computed(() => props.character);

// 监听选中部位变化
watch(selectedCategory, newCategory => {
  currentOutfitValue.value = getOutfitValue(newCategory) || '';
});

// 获取当前部位的图标
const getCurrentCategoryIcon = () => {
  const category = outfitCategories.find(cat => cat.key === selectedCategory.value);
  return category?.icon || '👗';
};

// 获取当前部位的名称
const getCurrentCategoryName = () => {
  const category = outfitCategories.find(cat => cat.key === selectedCategory.value);
  return category?.name || '服装';
};

// 获取当前部位的预设选项
const getCurrentPresets = () => {
  return outfitPresets[selectedCategory.value as keyof typeof outfitPresets] || [];
};

// 获取指定部位的服装值
const getOutfitValue = (categoryKey: string) => {
  if (!character.value?.appearance?.clothing) return '';
  return character.value.appearance.clothing[categoryKey as keyof typeof character.value.appearance.clothing] || '';
};

// 更新服装
const updateOutfit = () => {
  if (!character.value) return;

  // 确保appearance和clothing对象存在
  if (!character.value.appearance) {
    character.value.appearance = {
      height: 160,
      weight: 50,
      measurements: 'B80-W60-H85',
      clothing: {},
    };
  }
  if (!character.value.appearance.clothing) {
    character.value.appearance.clothing = {};
  }

  // 更新指定部位的服装
  (character.value.appearance.clothing as any)[selectedCategory.value] = currentOutfitValue.value;
};

// 选择预设
const selectPreset = (preset: string) => {
  currentOutfitValue.value = preset;
  updateOutfit();
};

// 清空当前部位
const clearOutfit = () => {
  currentOutfitValue.value = '';
  updateOutfit();
};

// 重置所有服装
const resetAllOutfits = () => {
  if (!character.value) return;

  if (!character.value.appearance) {
    character.value.appearance = {
      height: 160,
      weight: 50,
      measurements: 'B80-W60-H85',
      clothing: {},
    };
  }
  if (!character.value.appearance.clothing) {
    character.value.appearance.clothing = {};
  }

  // 如果有原始服装，则恢复原始服装；否则清空所有服装部位
  if (character.value.appearance.originalClothing) {
    // 恢复原始服装
    outfitCategories.forEach(category => {
      const originalValue = (character.value!.appearance!.originalClothing as any)[category.key];
      (character.value!.appearance!.clothing as any)[category.key] = originalValue || '';
    });
  } else {
    // 清空所有服装部位
    outfitCategories.forEach(category => {
      (character.value!.appearance!.clothing as any)[category.key] = '';
    });
  }

  // 更新当前显示
  currentOutfitValue.value = '';
};

// 保存服装
const saveOutfits = async () => {
  if (!character.value) return;

  try {
    // 确保服装信息存在
    if (!character.value.appearance) {
      character.value.appearance = {
        height: 160,
        weight: 50,
        measurements: 'B80-W60-H85',
        clothing: {},
      };
    }
    if (!character.value.appearance.clothing) {
      character.value.appearance.clothing = {};
    }

    // 将空值转换为"无"
    outfitCategories.forEach(category => {
      const currentValue = (character.value!.appearance!.clothing as any)[category.key];
      if (!currentValue || currentValue.trim() === '') {
        (character.value!.appearance!.clothing as any)[category.key] = '无';
      }
    });

    // 触发保存事件
    emit('save-outfit', character.value);

    // 更新人物世界书
    await WorldbookService.updateCharacterEntry(character.value);

    // 关闭界面
    close();
  } catch (error) {
    console.error('保存服装失败:', error);
    // 即使世界书更新失败，也要关闭界面
    close();
  }
};

// 关闭界面
const close = () => {
  // 关闭时重置服装到原始状态
  // resetAllOutfits();
  emit('close');
};
</script>

<style scoped lang="scss">
// 弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.outfit-modal {
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(205, 133, 63, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(205, 133, 63, 0.7);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
  flex-shrink: 0;

  .header-left {
    flex: 1;
  }

  .outfit-title {
    margin: 0;
    color: #ffd7a1;
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    flex: 2;
    text-shadow:
      0 0 10px rgba(255, 215, 161, 0.5),
      0 0 20px rgba(255, 215, 161, 0.3);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
  }

  .close-btn {
    background: none;
    border: none;
    color: #f0e6d2;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #ffd7a1;
    }
  }
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.outfit-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  grid-template-rows: 1fr auto;
  gap: 20px;
  height: 100%;
  min-height: 600px;

  .character-preview {
    display: none; // 隐藏独立的预览区域，将头像集成到选择区域
  }

  .outfit-selection {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .outfit-overview {
    grid-column: 2;
    grid-row: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .outfit-actions {
    grid-column: 1 / 3;
    grid-row: 2;
  }
}

// 人物预览
.character-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 0;

  .character-avatar {
    width: 160px;
    height: 240px;
    border-radius: 12px;
    border: 3px solid rgba(205, 133, 63, 0.3);
    background: rgba(40, 26, 20, 0.2);
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

    // 评级边框颜色
    &.rating-s {
      border: 3px solid rgba(220, 20, 60, 0.9);
      box-shadow: 0 0 25px rgba(220, 20, 60, 0.6);
    }
    &.rating-a {
      border: 3px solid rgba(255, 215, 0, 0.8);
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
    }
    &.rating-b {
      border: 3px solid rgba(192, 192, 192, 0.8);
      box-shadow: 0 0 15px rgba(192, 192, 192, 0.4);
    }
    &.rating-c {
      border: 3px solid rgba(32, 32, 32, 0.8);
      box-shadow: 0 0 10px rgba(64, 64, 64, 0.3);
    }
    &.rating-d {
      border: 2px solid rgba(205, 133, 63, 0.3);
    }

    .avatar-container {
      width: 100%;
      height: 100%;
      position: relative;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .default-avatar {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(40, 26, 20, 0.6);
        color: #cd853f;

        .avatar-icon {
          font-size: 48px;
        }
      }

      .character-name {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.8);
        color: #ffd7a1;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        padding: 4px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
      }
    }
  }
}

// 服装选择区域（包含人物头像）
.outfit-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;

  // 内嵌人物头像
  &::before {
    content: '';
    display: block;
  }

  // 人物头像区域
  .character-preview {
    display: flex !important;
    justify-content: center;
    margin-bottom: 8px;
    flex-shrink: 0;

    .character-avatar {
      width: 140px;
      height: 210px;
    }
  }
}

.outfit-categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex-shrink: 0;

  .outfit-category {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 6px;
    background: rgba(40, 26, 20, 0.4);
    border: 1px solid rgba(205, 133, 63, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(40, 26, 20, 0.6);
      border-color: rgba(205, 133, 63, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    &.active {
      background: rgba(205, 133, 63, 0.2);
      border-color: rgba(205, 133, 63, 0.6);
      box-shadow: 0 0 12px rgba(205, 133, 63, 0.4);
    }

    .category-icon {
      font-size: 20px;
    }

    .category-name {
      color: #f0e6d2;
      font-size: 11px;
      font-weight: 600;
      text-align: center;
    }
  }
}

.current-outfit-section {
  background: rgba(40, 26, 20, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.2);
  border-radius: 8px;
  padding: 12px;
  flex-shrink: 0;

  h4 {
    color: #ffd7a1;
    font-size: 14px;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 6px;

    .section-icon {
      font-size: 14px;
    }
  }

  .outfit-input-group {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;

    .outfit-input {
      flex: 1;
      background: rgba(40, 26, 20, 0.7);
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 6px;
      padding: 8px 10px;
      color: #ffe9d2;
      font-size: 13px;

      &:focus {
        outline: none;
        border-color: rgba(255, 120, 60, 0.5);
        box-shadow: 0 0 8px rgba(255, 120, 60, 0.2);
      }

      &::placeholder {
        color: rgba(240, 230, 210, 0.5);
      }
    }

    .clear-btn {
      background: rgba(220, 38, 38, 0.2);
      border: 1px solid rgba(220, 38, 38, 0.3);
      border-radius: 6px;
      padding: 8px 10px;
      color: #dc2626;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(220, 38, 38, 0.3);
        border-color: rgba(220, 38, 38, 0.5);
      }
    }
  }

  .preset-options {
    h5 {
      color: #cd853f;
      font-size: 11px;
      margin: 0 0 6px 0;
      font-weight: 600;
    }

    .preset-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      max-height: 140px;
      overflow-y: auto;
      padding-right: 4px;

      // 自定义滚动条
      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(205, 133, 63, 0.4);
        border-radius: 2px;
      }

      .preset-item {
        background: rgba(139, 69, 19, 0.1);
        border: 1px solid rgba(139, 69, 19, 0.3);
        border-radius: 5px;
        padding: 6px 8px;
        color: #f0e6d2;
        font-size: 11px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(139, 69, 19, 0.2);
          border-color: rgba(139, 69, 19, 0.4);
          transform: translateY(-1px);
        }

        &.selected {
          background: rgba(205, 133, 63, 0.2);
          border-color: rgba(205, 133, 63, 0.5);
          color: #ffd7a1;
          box-shadow: 0 0 8px rgba(205, 133, 63, 0.3);
        }
      }
    }
  }
}

// 服装总览
.outfit-overview {
  background: rgba(40, 26, 20, 0.3);
  border: 1px solid rgba(205, 133, 63, 0.2);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  h4 {
    color: #ffd7a1;
    font-size: 16px;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;

    .section-icon {
      font-size: 14px;
    }
  }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    align-content: start;

    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(205, 133, 63, 0.5);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: rgba(205, 133, 63, 0.7);
    }

    .overview-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: rgba(139, 69, 19, 0.1);
      border: 1px solid rgba(139, 69, 19, 0.3);
      border-radius: 6px;
      transition: all 0.2s ease;
      height: fit-content;

      &:hover {
        background: rgba(139, 69, 19, 0.15);
        border-color: rgba(139, 69, 19, 0.4);
      }

      &.empty {
        opacity: 0.6;
        border-style: dashed;
      }

      .overview-icon {
        font-size: 16px;
        flex-shrink: 0;
      }

      .overview-content {
        flex: 1;
        min-width: 0;

        .overview-label {
          color: #cd853f;
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .overview-value {
          color: #f0e6d2;
          font-size: 11px;
          word-break: break-word;
        }
      }
    }
  }
}

// 操作按钮
.outfit-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid rgba(205, 133, 63, 0.2);

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;

    .btn-icon {
      font-size: 16px;
    }

    &.primary {
      background: linear-gradient(135deg, #8a3c2c, #65261c);
      color: #ffe9d2;
      border: 1px solid rgba(255, 120, 60, 0.5);
      box-shadow: 0 4px 8px rgba(110, 30, 15, 0.3);

      &:hover {
        background: linear-gradient(135deg, #9a4c3c, #7a3c2c);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(110, 30, 15, 0.4);
      }
    }

    &.secondary {
      background: linear-gradient(135deg, #3a2a22, #2a201c);
      color: #ffe9d2;
      border: 1px solid rgba(205, 133, 63, 0.35);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

      &:hover {
        background: linear-gradient(135deg, #4a3a32, #3a302c);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
      }
    }
  }
}

// 1080P 优化 (1920x1080) - 左中右三栏布局
@media (min-width: 1200px) and (max-width: 1919px) {
  .outfit-modal {
    max-width: 1700px;
    width: 92%;
    padding: 0;
    background: linear-gradient(135deg, rgba(20, 15, 12, 0.98), rgba(35, 25, 20, 0.96));
    border: 2px solid rgba(205, 133, 63, 0.4);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  }

  .modal-header {
    padding: 28px 40px;
    background: linear-gradient(90deg, rgba(40, 26, 20, 0.6), rgba(25, 17, 14, 0.8));
    border-bottom: 2px solid rgba(205, 133, 63, 0.3);

    .outfit-title {
      font-size: 32px;
      text-shadow:
        0 0 20px rgba(255, 215, 161, 0.6),
        0 4px 8px rgba(0, 0, 0, 0.8);
    }

    .close-btn {
      width: 36px;
      height: 36px;
      font-size: 28px;
      border-radius: 8px;
      background: rgba(220, 38, 38, 0.15);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(220, 38, 38, 0.3);
        transform: scale(1.1);
      }
    }
  }

  .modal-body {
    padding: 32px;
  }

  .outfit-content {
    grid-template-columns: 240px 1fr 420px;
    grid-template-rows: 1fr;
    gap: 24px;
    height: 580px;

    // 左侧：人物头像（参考人物卡界面）
    .character-preview-column {
      grid-column: 1;
      grid-row: 1;
      display: flex;
      align-items: stretch;
      justify-content: center;

      .character-avatar {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        position: relative;
        display: flex;
        flex-direction: column;
        background: rgba(40, 26, 20, 0.2);

        // 评级边框颜色（参考人物卡界面）
        &.rating-s {
          border: 3px solid rgba(220, 20, 60, 0.9);
          box-shadow:
            0 0 25px rgba(220, 20, 60, 0.6),
            0 0 50px rgba(220, 20, 60, 0.3);
        }
        &.rating-a {
          border: 3px solid rgba(255, 215, 0, 0.8);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
        }
        &.rating-b {
          border: 3px solid rgba(192, 192, 192, 0.8);
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.4);
        }
        &.rating-c {
          border: 3px solid rgba(32, 32, 32, 0.8);
          box-shadow: 0 0 10px rgba(64, 64, 64, 0.3);
        }
        &.rating-d {
          border: 2px solid rgba(205, 133, 63, 0.3);
        }

        .avatar-container {
          width: 100%;
          height: 100%;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            flex: 1;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;
            flex: 1;

            .avatar-icon {
              font-size: 48px;
            }
          }
        }
      }
    }

    // 中间：服装设置区域（包含按钮）
    .outfit-selection {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.4), rgba(25, 17, 14, 0.6));
      border-radius: 16px;
      border: 2px solid rgba(205, 133, 63, 0.25);
      box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
      padding: 20px;
      overflow: hidden;
    }

    // 右侧：服装总览（缩小高度）
    .outfit-overview {
      grid-column: 3;
      grid-row: 1;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.4), rgba(25, 17, 14, 0.6));
      border-radius: 16px;
      border: 2px solid rgba(205, 133, 63, 0.25);
      box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      overflow: hidden;

      h4 {
        margin: 0;
        font-size: 18px;
        flex-shrink: 0;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(4, 1fr);
        gap: 12px;
        flex: 1;
        overflow-y: auto;
        align-content: start;
      }
    }
  }

  // 中栏分类按钮 - 紧凑布局
  .outfit-categories {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex-shrink: 0;

    .outfit-category {
      padding: 14px 10px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.5), rgba(25, 17, 14, 0.7));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

      &:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
      }

      &.active {
        background: linear-gradient(135deg, rgba(205, 133, 63, 0.3), rgba(139, 69, 19, 0.4));
        box-shadow: 0 0 20px rgba(205, 133, 63, 0.5);
      }

      .category-icon {
        font-size: 28px;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
      }

      .category-name {
        font-size: 13px;
      }
    }
  }

  // 中间输入区域 - 浮动卡片
  .current-outfit-section {
    padding: 16px;
    border-radius: 12px;
    background: rgba(40, 26, 20, 0.3);
    border: 1px solid rgba(205, 133, 63, 0.15);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;

    h4 {
      font-size: 15px;
      margin: 0 0 12px 0;
      flex-shrink: 0;
    }

    .outfit-input-group {
      margin-bottom: 12px;
      flex-shrink: 0;

      .outfit-input {
        padding: 10px 14px;
        font-size: 14px;
        border-radius: 8px;
        background: rgba(20, 15, 12, 0.8);
        border: 1px solid rgba(205, 133, 63, 0.3);

        &:focus {
          border-color: rgba(255, 120, 60, 0.6);
          box-shadow: 0 0 12px rgba(255, 120, 60, 0.3);
        }
      }

      .clear-btn {
        padding: 10px 14px;
        font-size: 14px;
        border-radius: 8px;
      }
    }

    .preset-options {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;

      h5 {
        font-size: 13px;
        margin: 0 0 8px 0;
        flex-shrink: 0;
      }

      .preset-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        overflow-y: auto;
        align-content: start;

        .preset-item {
          padding: 8px 10px;
          font-size: 12px;
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(139, 69, 19, 0.15), rgba(101, 50, 15, 0.25));
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          }

          &.selected {
            background: linear-gradient(135deg, rgba(205, 133, 63, 0.3), rgba(139, 69, 19, 0.4));
            box-shadow: 0 0 12px rgba(205, 133, 63, 0.4);
          }
        }
      }
    }
  }

  // 右侧总览 - 紧凑卡片网格（2列4行）
  .outfit-overview {
    h4 {
      .section-icon {
        font-size: 20px;
      }
    }

    .overview-grid {
      .overview-item {
        padding: 12px;
        border-radius: 10px;
        background: rgba(40, 26, 20, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(205, 133, 63, 0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(50, 32, 24, 0.4);
          border-color: rgba(205, 133, 63, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        &.empty {
          opacity: 0.5;
          background: rgba(40, 26, 20, 0.15);
        }

        .overview-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
          flex-shrink: 0;
        }

        .overview-content {
          flex: 1;
          min-width: 0;
        }

        .overview-label {
          font-size: 11px;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(205, 133, 63, 0.8);
          font-weight: 600;
        }

        .overview-value {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 235, 205, 0.95);
          word-break: break-word;
          line-height: 1.3;
        }
      }
    }
  }

  // 中栏按钮 - 融入整体
  .outfit-actions {
    display: flex;
    gap: 12px;
    justify-content: stretch;
    flex-shrink: 0;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(205, 133, 63, 0.15);

    .action-btn {
      flex: 1;
      padding: 12px 16px;
      font-size: 14px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      transition: all 0.25s ease;
      border: none;
      min-width: 100px;
      white-space: nowrap;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
      }

      &.primary {
        background: linear-gradient(135deg, #a8542c, #7a3c1c);
        color: #ffe9d2;

        &:hover {
          background: linear-gradient(135deg, #b8643c, #8a4c2c);
        }
      }

      &.secondary {
        background: linear-gradient(135deg, #4a3a32, #3a2a22);
        color: #ffe9d2;

        &:hover {
          background: linear-gradient(135deg, #5a4a42, #4a3a32);
        }
      }

      .btn-icon {
        font-size: 16px;
        margin-right: 4px;
      }
    }
  }
}

// 2K 优化 (2560x1440) - 豪华三栏布局
@media (min-width: 1920px) and (max-width: 2559px) {
  .outfit-modal {
    max-width: 2200px;
    width: 90%;
    padding: 0;
    background: linear-gradient(135deg, rgba(15, 10, 8, 0.98), rgba(30, 20, 15, 0.96));
    border: 3px solid rgba(205, 133, 63, 0.5);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
  }

  .modal-header {
    padding: 36px 48px;
    background: linear-gradient(90deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
    border-bottom: 3px solid rgba(205, 133, 63, 0.35);

    .outfit-title {
      font-size: 38px;
      text-shadow:
        0 0 25px rgba(255, 215, 161, 0.7),
        0 4px 10px rgba(0, 0, 0, 0.9);
    }

    .close-btn {
      width: 40px;
      height: 40px;
      font-size: 32px;
      border-radius: 10px;
      background: rgba(220, 38, 38, 0.2);

      &:hover {
        background: rgba(220, 38, 38, 0.4);
        transform: scale(1.12);
      }
    }
  }

  .modal-body {
    padding: 40px 48px;
  }

  .outfit-content {
    grid-template-columns: 300px 1fr 520px;
    grid-template-rows: 1fr;
    gap: 32px;
    height: 720px;

    // 左侧：人物头像（参考人物卡界面）
    .character-preview-column {
      grid-column: 1;
      grid-row: 1;
      display: flex;
      align-items: stretch;
      justify-content: center;

      .character-avatar {
        width: 100%;
        height: 100%;
        border-radius: 10px;
        position: relative;
        display: flex;
        flex-direction: column;
        background: rgba(40, 26, 20, 0.2);

        &.rating-s {
          border: 4px solid rgba(220, 20, 60, 0.9);
          box-shadow:
            0 0 30px rgba(220, 20, 60, 0.7),
            0 0 60px rgba(220, 20, 60, 0.4);
        }
        &.rating-a {
          border: 4px solid rgba(255, 215, 0, 0.8);
          box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
        }
        &.rating-b {
          border: 4px solid rgba(192, 192, 192, 0.8);
          box-shadow: 0 0 20px rgba(192, 192, 192, 0.5);
        }
        &.rating-c {
          border: 4px solid rgba(32, 32, 32, 0.8);
          box-shadow: 0 0 15px rgba(64, 64, 64, 0.4);
        }
        &.rating-d {
          border: 3px solid rgba(205, 133, 63, 0.3);
        }

        .avatar-container {
          width: 100%;
          height: 100%;
          border-radius: 7px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            flex: 1;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;
            flex: 1;

            .avatar-icon {
              font-size: 64px;
            }
          }
        }
      }
    }

    // 中间：服装设置区域（包含按钮）
    .outfit-selection {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.4), rgba(25, 17, 14, 0.6));
      border-radius: 18px;
      border: 3px solid rgba(205, 133, 63, 0.3);
      box-shadow: inset 0 3px 12px rgba(0, 0, 0, 0.4);
      padding: 24px;
      overflow: hidden;
    }

    // 右侧：服装总览
    .outfit-overview {
      grid-column: 3;
      grid-row: 1;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.4), rgba(25, 17, 14, 0.6));
      border-radius: 18px;
      border: 3px solid rgba(205, 133, 63, 0.3);
      box-shadow: inset 0 3px 12px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      overflow: hidden;

      h4 {
        margin: 0;
        font-size: 22px;
        flex-shrink: 0;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(4, 1fr);
        gap: 14px;
        flex: 1;
        overflow-y: auto;
        align-content: start;
      }
    }
  }

  // 继承1080P的卡片样式，只调整尺寸
  .outfit-categories {
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;

    .outfit-category {
      padding: 18px 14px;
      border-radius: 14px;

      .category-icon {
        font-size: 36px;
      }

      .category-name {
        font-size: 15px;
      }
    }
  }

  // 继承1080P的样式，只调整尺寸
  .current-outfit-section {
    h4 {
      font-size: 20px;
    }

    .outfit-input-group {
      .outfit-input,
      .clear-btn {
        padding: 14px 18px;
        font-size: 17px;
      }
    }

    .preset-options {
      h5 {
        font-size: 15px;
      }

      .preset-grid {
        gap: 10px;
        max-height: 180px;

        .preset-item {
          padding: 12px 14px;
          font-size: 15px;
        }
      }
    }
  }

  .outfit-overview {
    padding: 28px;

    h4 {
      font-size: 24px;

      .section-icon {
        font-size: 28px;
      }
    }

    .overview-grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, auto);
      gap: 18px;

      .overview-item {
        padding: 22px;

        .overview-icon {
          font-size: 32px;
        }

        .overview-label {
          font-size: 15px;
        }

        .overview-value {
          font-size: 22px;
        }
      }
    }
  }

  .outfit-actions {
    .action-btn {
      padding: 16px 24px;
      font-size: 18px;
      min-width: 120px;
      white-space: nowrap;

      .btn-icon {
        font-size: 20px;
        margin-right: 6px;
      }
    }
  }
}

// 4K 优化 (3840x2160) - 极致三栏体验
@media (min-width: 2560px) {
  .outfit-modal {
    max-width: 3000px;
    width: 88%;
    padding: 0;
    background: linear-gradient(135deg, rgba(10, 8, 6, 0.99), rgba(25, 18, 13, 0.97));
    border: 4px solid rgba(205, 133, 63, 0.6);
    box-shadow: 0 30px 100px rgba(0, 0, 0, 0.9);
  }

  .modal-header {
    padding: 48px 64px;
    background: linear-gradient(90deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.95));
    border-bottom: 4px solid rgba(205, 133, 63, 0.4);

    .outfit-title {
      font-size: 48px;
      text-shadow:
        0 0 30px rgba(255, 215, 161, 0.8),
        0 6px 12px rgba(0, 0, 0, 1);
    }

    .close-btn {
      width: 48px;
      height: 48px;
      font-size: 40px;
      border-radius: 12px;
      background: rgba(220, 38, 38, 0.25);

      &:hover {
        background: rgba(220, 38, 38, 0.5);
        transform: scale(1.15);
      }
    }
  }

  .modal-body {
    padding: 52px 64px;
  }

  .outfit-content {
    grid-template-columns: 400px 1fr 680px;
    grid-template-rows: 1fr;
    gap: 48px;
    height: 900px;

    // 左侧：人物头像（参考人物卡界面）
    .character-preview-column {
      grid-column: 1;
      grid-row: 1;
      display: flex;
      align-items: stretch;
      justify-content: center;

      .character-avatar {
        width: 100%;
        height: 100%;
        border-radius: 12px;
        position: relative;
        display: flex;
        flex-direction: column;
        background: rgba(40, 26, 20, 0.2);

        &.rating-s {
          border: 5px solid rgba(220, 20, 60, 0.9);
          box-shadow:
            0 0 40px rgba(220, 20, 60, 0.8),
            0 0 80px rgba(220, 20, 60, 0.5);
        }
        &.rating-a {
          border: 5px solid rgba(255, 215, 0, 0.8);
          box-shadow: 0 0 35px rgba(255, 215, 0, 0.6);
        }
        &.rating-b {
          border: 5px solid rgba(192, 192, 192, 0.8);
          box-shadow: 0 0 30px rgba(192, 192, 192, 0.6);
        }
        &.rating-c {
          border: 5px solid rgba(32, 32, 32, 0.8);
          box-shadow: 0 0 20px rgba(64, 64, 64, 0.5);
        }
        &.rating-d {
          border: 4px solid rgba(205, 133, 63, 0.3);
        }

        .avatar-container {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            flex: 1;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;
            flex: 1;

            .avatar-icon {
              font-size: 80px;
            }
          }
        }
      }
    }

    // 中间：服装设置区域（包含按钮）
    .outfit-selection {
      grid-column: 2;
      grid-row: 1;
      display: flex;
      flex-direction: column;
      gap: 28px;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.6), rgba(25, 17, 14, 0.8));
      border-radius: 22px;
      border: 4px solid rgba(205, 133, 63, 0.35);
      box-shadow: inset 0 4px 16px rgba(0, 0, 0, 0.5);
      padding: 32px;
      overflow: hidden;
    }

    // 右侧：服装总览
    .outfit-overview {
      grid-column: 3;
      grid-row: 1;
      background: linear-gradient(135deg, rgba(40, 26, 20, 0.6), rgba(25, 17, 14, 0.8));
      border-radius: 22px;
      border: 4px solid rgba(205, 133, 63, 0.35);
      box-shadow: inset 0 4px 16px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px;
      overflow: hidden;

      h4 {
        margin: 0;
        font-size: 26px;
        flex-shrink: 0;
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(4, 1fr);
        gap: 18px;
        flex: 1;
        overflow-y: auto;
        align-content: start;
      }
    }
  }

  // 继承1080P的卡片样式，调整为4K尺寸
  .outfit-categories {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;

    .outfit-category {
      padding: 24px 18px;
      border-radius: 18px;

      .category-icon {
        font-size: 48px;
      }

      .category-name {
        font-size: 19px;
      }
    }
  }

  .current-outfit-section {
    h4 {
      font-size: 26px;
    }

    .outfit-input-group {
      .outfit-input,
      .clear-btn {
        padding: 18px 24px;
        font-size: 21px;
      }
    }

    .preset-options {
      h5 {
        font-size: 19px;
      }

      .preset-grid {
        gap: 14px;
        max-height: 240px;

        .preset-item {
          padding: 16px 18px;
          font-size: 19px;
        }
      }
    }
  }

  .outfit-overview {
    padding: 36px;

    h4 {
      font-size: 28px;

      .section-icon {
        font-size: 32px;
      }
    }

    .overview-grid {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(4, auto);
      gap: 24px;

      .overview-item {
        padding: 26px;

        .overview-icon {
          font-size: 40px;
        }

        .overview-label {
          font-size: 18px;
        }

        .overview-value {
          font-size: 26px;
        }
      }
    }
  }

  .outfit-actions {
    .action-btn {
      padding: 20px 32px;
      font-size: 22px;
      min-width: 140px;
      white-space: nowrap;

      .btn-icon {
        font-size: 24px;
        margin-right: 8px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 1199px) {
  .outfit-content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .character-preview-column {
      display: flex;
      justify-content: center;
      margin-bottom: 10px;

      .character-avatar {
        width: 160px;
        height: 160px;
        border-radius: 50%;
        overflow: hidden;

        .avatar-container {
          width: 100%;
          height: 100%;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 30%;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;

            .avatar-icon {
              font-size: 48px;
            }
          }
        }
      }
    }

    .outfit-selection {
      order: 1;
    }

    .outfit-overview {
      order: 2;
    }

    .outfit-actions {
      order: 3;
    }
  }
}

@media (max-width: 768px) {
  .outfit-modal {
    width: 98%;
    max-height: 90vh;
  }

  .outfit-content {
    .character-preview-column {
      .character-avatar {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        overflow: hidden;

        .avatar-container {
          width: 100%;
          height: 100%;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 30%;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;

            .avatar-icon {
              font-size: 40px;
            }
          }
        }
      }
    }
  }

  .outfit-categories {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;

    .outfit-category {
      padding: 8px 4px;

      .category-icon {
        font-size: 16px;
      }

      .category-name {
        font-size: 10px;
      }
    }
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .outfit-actions {
    flex-direction: column;

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }
}

@media (max-width: 480px) {
  .outfit-content {
    .character-preview-column {
      .character-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        overflow: hidden;

        .avatar-container {
          width: 100%;
          height: 100%;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 30%;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;

            .avatar-icon {
              font-size: 32px;
            }
          }
        }
      }
    }
  }

  .outfit-categories {
    grid-template-columns: repeat(2, 1fr);
  }

  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
