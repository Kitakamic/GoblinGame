<template>
  <div v-if="show" class="style-settings-overlay" @click="handleOverlayClick">
    <div class="style-settings-panel" @click.stop>
      <div class="panel-header">
        <h3>🎨 文字样式设置</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="panel-content">
        <!-- 正文颜色 -->
        <div class="style-item">
          <label class="style-label">
            <span class="label-text">正文颜色</span>
            <span class="label-preview" :style="{ color: textColor }">预览文字</span>
          </label>
          <input v-model="textColor" type="color" class="color-input" @change="updateStyle" />
        </div>

        <!-- 斜体颜色 -->
        <div class="style-item">
          <label class="style-label">
            <span class="label-text">斜体颜色</span>
            <span class="label-preview" :style="{ color: italicColor, fontStyle: 'italic' }">
              <em>预览斜体</em>
            </span>
          </label>
          <input v-model="italicColor" type="color" class="color-input" @change="updateStyle" />
        </div>

        <!-- 粗体颜色 -->
        <div class="style-item">
          <label class="style-label">
            <span class="label-text">粗体颜色</span>
            <span class="label-preview" :style="{ color: strongColor, fontWeight: 'bold' }"> 预览粗体 </span>
          </label>
          <input v-model="strongColor" type="color" class="color-input" @change="updateStyle" />
        </div>

        <!-- 双引号颜色 -->
        <div class="style-item">
          <label class="style-label">
            <span class="label-text">双引号颜色</span>
            <span class="label-preview" :style="{ color: doubleQuoteColor }">"预览"</span>
          </label>
          <input v-model="doubleQuoteColor" type="color" class="color-input" @change="updateStyle" />
        </div>

        <!-- 单引号颜色 -->
        <div class="style-item">
          <label class="style-label">
            <span class="label-text">单引号颜色</span>
            <span class="label-preview" :style="{ color: singleQuoteColor }">'预览'</span>
          </label>
          <input v-model="singleQuoteColor" type="color" class="color-input" @change="updateStyle" />
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 正文字体 -->
        <div class="style-item">
          <label class="style-label">
            <span class="label-text">正文字体（移动端不支持自定义字体）</span>
            <span class="label-preview" :style="{ fontFamily: normalizedFontFamily }">预览文字</span>
          </label>
          <select v-model="textFont" class="font-select font-preview-select" @change="updateStyle">
            <!-- 中文字体 -->
            <option
              value="'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', sans-serif"
              :style="{ fontFamily: 'Microsoft YaHei, 微软雅黑, PingFang SC, Hiragino Sans GB, sans-serif' }"
            >
              微软雅黑
            </option>
            <option
              value="'SimSun', '宋体', 'STSong', 'Songti SC', serif"
              :style="{ fontFamily: 'SimSun, 宋体, STSong, Songti SC, serif' }"
            >
              宋体
            </option>
            <option
              value="'SimHei', '黑体', 'STHeiti', 'Heiti SC', sans-serif"
              :style="{ fontFamily: 'SimHei, 黑体, STHeiti, Heiti SC, sans-serif' }"
            >
              黑体
            </option>
            <option
              value="'KaiTi', '楷体', 'Kaiti SC', 'STKaiti', serif"
              :style="{ fontFamily: 'KaiTi, 楷体, Kaiti SC, STKaiti, serif' }"
            >
              楷体
            </option>
            <option value="'SimLi', '隶书', 'STLiti', serif" :style="{ fontFamily: 'SimLi, 隶书, STLiti, serif' }">
              隶书
            </option>
            <option
              value="'FangSong', '仿宋', 'FangSong SC', serif"
              :style="{ fontFamily: 'FangSong, 仿宋, FangSong SC, serif' }"
            >
              仿宋
            </option>
            <!-- 西文字体 -->
            <option
              value="Georgia, 'Times New Roman', serif"
              :style="{ fontFamily: 'Georgia, Times New Roman, serif' }"
            >
              Georgia (衬线)
            </option>
            <option value="Arial, 'Helvetica', sans-serif" :style="{ fontFamily: 'Arial, Helvetica, sans-serif' }">
              Arial (无衬线)
            </option>
            <option value="Verdana, sans-serif" :style="{ fontFamily: 'Verdana, sans-serif' }">Verdana (无衬线)</option>
            <option
              value="'Palatino Linotype', 'Book Antiqua', serif"
              :style="{ fontFamily: 'Palatino Linotype, Book Antiqua, serif' }"
            >
              Palatino (衬线)
            </option>
            <option value="'Courier New', monospace" :style="{ fontFamily: 'Courier New, monospace' }">
              Courier New (等宽)
            </option>
          </select>
        </div>

        <!-- 重置按钮 -->
        <div class="style-item">
          <button class="reset-btn" @click="resetStyles">🔄 重置为默认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'close'): void }>();

// 默认值
const defaultTextColor = '#f7efd9';
const defaultItalicColor = '#ff69b4';
const defaultStrongColor = '#f7efd9';
const defaultDoubleQuoteColor = '#ffd7a1';
const defaultSingleQuoteColor = '#ffbd7a';
const defaultTextFont = "'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', sans-serif";

// 响应式数据
const textColor = ref(defaultTextColor);
const italicColor = ref(defaultItalicColor);
const strongColor = ref(defaultStrongColor);
const doubleQuoteColor = ref(defaultDoubleQuoteColor);
const singleQuoteColor = ref(defaultSingleQuoteColor);
const textFont = ref(defaultTextFont);

// 计算属性：规范化字体名称供预览使用（移除引号）
const normalizedFontFamily = computed(() => {
  // 移除字体名称中的所有引号，以便在 Vue style 绑定中正确显示
  return textFont.value.replace(/['"]/g, '');
});

// 加载保存的设置
const loadSavedStyles = () => {
  try {
    const characterVars = getVariables({ type: 'character' });

    if (characterVars['dialogue_text_color']) {
      textColor.value = characterVars['dialogue_text_color'];
    }
    if (characterVars['dialogue_italic_color']) {
      italicColor.value = characterVars['dialogue_italic_color'];
    }
    if (characterVars['dialogue_strong_color']) {
      strongColor.value = characterVars['dialogue_strong_color'];
    }
    if (characterVars['dialogue_double_quote_color']) {
      doubleQuoteColor.value = characterVars['dialogue_double_quote_color'];
    }
    if (characterVars['dialogue_single_quote_color']) {
      singleQuoteColor.value = characterVars['dialogue_single_quote_color'];
    }
    if (characterVars['dialogue_text_font']) {
      // 字体迁移：将旧的字体值升级为包含移动端支持的新字体值
      const savedFont = characterVars['dialogue_text_font'];
      const fontMigrationMap: Record<string, string> = {
        "'Microsoft YaHei', '微软雅黑', sans-serif":
          "'Microsoft YaHei', '微软雅黑', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
        "'SimSun', '宋体', serif": "'SimSun', '宋体', 'STSong', 'Songti SC', serif",
        "'SimHei', '黑体', sans-serif": "'SimHei', '黑体', 'STHeiti', 'Heiti SC', sans-serif",
        "'KaiTi', '楷体', serif": "'KaiTi', '楷体', 'Kaiti SC', 'STKaiti', serif",
        "'SimLi', '隶书', serif": "'SimLi', '隶书', 'STLiti', serif",
        "'FangSong', '仿宋', serif": "'FangSong', '仿宋', 'FangSong SC', serif",
      };

      // 如果是旧字体值，自动升级
      if (fontMigrationMap[savedFont]) {
        textFont.value = fontMigrationMap[savedFont];
        console.log('🔄 字体已升级为移动端兼容版本:', savedFont, '->', textFont.value);
        // 自动保存升级后的字体
        saveStyles();
      } else {
        textFont.value = savedFont;
      }
    }

    // 应用已加载的设置
    applyStyles();
  } catch (error) {
    console.error('加载样式设置失败:', error);
  }
};

// 应用样式到 CSS 变量
const applyStyles = () => {
  const root = document.documentElement;
  root.style.setProperty('--dialogue-text-color', textColor.value);
  root.style.setProperty('--dialogue-italic-color', italicColor.value);
  root.style.setProperty('--dialogue-strong-color', strongColor.value);
  root.style.setProperty('--dialogue-double-quote-color', doubleQuoteColor.value);
  root.style.setProperty('--dialogue-single-quote-color', singleQuoteColor.value);
  root.style.setProperty('--dialogue-text-font', textFont.value);
};

// 保存设置到变量
const saveStyles = () => {
  try {
    const characterVars = getVariables({ type: 'character' });
    characterVars['dialogue_text_color'] = textColor.value;
    characterVars['dialogue_italic_color'] = italicColor.value;
    characterVars['dialogue_strong_color'] = strongColor.value;
    characterVars['dialogue_double_quote_color'] = doubleQuoteColor.value;
    characterVars['dialogue_single_quote_color'] = singleQuoteColor.value;
    characterVars['dialogue_text_font'] = textFont.value;
    replaceVariables(characterVars, { type: 'character' });
    console.log('样式设置已保存');
  } catch (error) {
    console.error('保存样式设置失败:', error);
  }
};

// 更新样式
const updateStyle = () => {
  applyStyles();
  saveStyles();
};

// 重置为默认值
const resetStyles = () => {
  textColor.value = defaultTextColor;
  italicColor.value = defaultItalicColor;
  strongColor.value = defaultStrongColor;
  doubleQuoteColor.value = defaultDoubleQuoteColor;
  singleQuoteColor.value = defaultSingleQuoteColor;
  textFont.value = defaultTextFont;
  applyStyles();
  saveStyles();
};

// 关闭面板
const close = () => {
  emit('close');
};

// 点击遮罩关闭
const handleOverlayClick = () => {
  close();
};

// 监听显示状态
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      loadSavedStyles();
    }
  },
);

// 初始化
onMounted(() => {
  loadSavedStyles();
  applyStyles();
});
</script>

<style scoped lang="scss">
.style-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;

  .style-settings-panel {
    background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
    border: 2px solid rgba(205, 133, 63, 0.6);
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
    animation: slideIn 0.3s ease;

    @media (max-width: 768px) {
      width: 95%;
      max-height: 90vh;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(205, 133, 63, 0.4);

  h3 {
    margin: 0;
    color: #ffd7a1;
    font-size: 20px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 28px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    line-height: 1;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  }
}

.panel-content {
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.divider {
  height: 1px;
  background: rgba(205, 133, 63, 0.3);
  margin: 24px 0;
}

.style-item {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.style-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .label-text {
    color: #f0e6d2;
    font-weight: 600;
    font-size: 14px;
  }

  .label-preview {
    font-size: 14px;
    opacity: 0.8;
  }
}

.color-input {
  width: 100%;
  height: 40px;
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(205, 133, 63, 0.6);
    transform: translateY(-1px);
  }
}

.font-select {
  width: 100%;
  padding: 10px;
  background: rgba(40, 26, 20, 0.8);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  color: #f0e6d2;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(205, 133, 63, 0.6);
  }

  &:focus {
    outline: none;
    border-color: rgba(205, 133, 63, 0.8);
    box-shadow: 0 0 0 2px rgba(205, 133, 63, 0.2);
  }

  option {
    background: rgba(40, 26, 20, 0.98);
    color: #f0e6d2;
    padding: 8px;
    font-size: 16px;
  }

  // 为字体选择器的选项增加字体大小，便于预览
  &.font-preview-select option {
    font-size: 18px;
    padding: 10px;
  }
}

.reset-btn {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #8a3c2c, #65261c);
  border: 2px solid rgba(255, 120, 60, 0.5);
  border-radius: 8px;
  color: #ffd7a1;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #9a4c3c, #75362c);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}
</style>
