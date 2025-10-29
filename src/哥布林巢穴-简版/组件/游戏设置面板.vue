<template>
  <div v-if="show" class="settings-overlay">
    <div class="settings-panel" @click.stop>
      <div class="panel-header">
        <h3>⚙️ 游戏设置</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="panel-content">
        <!-- 流式传输设置 -->
        <div class="settings-section">
          <h4 class="section-title">AI 输出设置</h4>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">启用流式传输</span>
              <span class="label-desc">AI回复实时显示，体验更流畅（如果总是截断，请关闭）</span>
            </label>
            <label class="switch-container">
              <input v-model="enableStream" type="checkbox" class="switch-input" @change="updateStreamingSetting" />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 游戏机制设置 -->
        <div class="settings-section">
          <h4 class="section-title">游戏机制设置</h4>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">据点人物生成概率修正</span>
              <span class="label-desc">额外增加的据点生成人物概率（0-100%）</span>
            </label>
            <div class="slider-container">
              <input
                v-model="heroGenerationModifier"
                type="range"
                min="0"
                max="100"
                class="slider-input"
                @input="updateHeroModifier"
              />
              <span class="slider-value">{{ heroGenerationModifier }}%</span>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">人物生成格式</span>
              <span class="label-desc">如果频繁截断，可以尝试换一种格式</span>
            </label>
            <select v-model="characterFormat" class="format-select" @change="updateCharacterFormat">
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 玩家角色设置 -->
        <div class="settings-section">
          <h4 class="section-title">玩家角色设置</h4>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">角色名称</span>
              <span class="label-desc">您的角色在游戏中的显示名称</span>
            </label>
            <input v-model="playerName" type="text" class="text-input" placeholder="输入角色名称" />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">角色头衔</span>
              <span class="label-desc">您的角色称号或职位</span>
            </label>
            <input v-model="playerTitle" type="text" class="text-input" placeholder="输入角色头衔" />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">肖像图</span>
              <span class="label-desc">可以输入图片URL或上传本地图片</span>
            </label>
            <div class="avatar-input-container">
              <input
                v-model="playerAvatar"
                type="text"
                class="text-input"
                placeholder="输入图片URL或点击右侧按钮上传本地图片"
              />
              <button class="upload-button" @click="triggerFileUpload">📁 选择本地图片</button>
              <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileUpload" />
            </div>
          </div>

          <div v-if="playerAvatar" class="setting-item">
            <div class="avatar-preview">
              <img :src="playerAvatar" alt="玩家头像预览" @error="handleImageError" />
            </div>
          </div>

          <div class="setting-item">
            <button class="save-button" :disabled="isSaving" @click="savePlayerInfo">
              {{ isSaving ? '⏳ 保存中...' : '💾 保存角色信息' }}
            </button>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 文字样式设置按钮 -->
        <div class="settings-section">
          <h4 class="section-title">界面设置</h4>

          <div class="setting-item">
            <button class="style-button" @click="openTextStyleSettings">🎨 对话文字颜色和字体设置</button>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 帮助和教程 -->
        <div class="settings-section">
          <h4 class="section-title">帮助</h4>

          <div class="setting-item">
            <button class="tutorial-button" @click="openTutorial">📖 查看教程（强烈建议先看教程）</button>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">更新与刷新</span>
              <span class="label-desc">如果遇到缓存问题，可以强制清除缓存并刷新页面以获取最新版本</span>
            </label>
            <button class="update-button" @click="forceRefresh">🔄 清除缓存并刷新</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { modularSaveManager } from '../存档管理/模块化存档服务';
import { ConfirmService } from '../服务/确认框服务';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-text-style'): void;
  (e: 'open-tutorial'): void;
}>();

// 流式传输设置
const enableStream = ref(true);

// 据点人物生成概率修正（0-100）
const heroGenerationModifier = ref(0);

// 人物生成格式
const characterFormat = ref('json');

// 玩家角色信息
const playerName = ref('哥布林之王');
const playerTitle = ref('哥布林巢穴之主');
const playerAvatar = ref('https://files.catbox.moe/x4g8t7.jpg');

// 文件上传相关
const fileInput = ref<HTMLInputElement | null>(null);

// 保存状态，防止重复点击
const isSaving = ref(false);

// 加载保存的设置
const loadSettings = () => {
  try {
    const globalVars = getVariables({ type: 'global' });

    // 加载流式传输设置，默认为 true
    if (typeof globalVars['enable_stream_output'] === 'boolean') {
      enableStream.value = globalVars['enable_stream_output'];
    } else {
      enableStream.value = true; // 默认开启
    }

    // 加载据点人物生成概率修正
    if (typeof globalVars['hero_generation_modifier'] === 'number') {
      heroGenerationModifier.value = Math.round(globalVars['hero_generation_modifier'] * 100); // 转换为百分比显示
    } else {
      heroGenerationModifier.value = 0; // 默认为 0
    }

    // 加载人物生成格式
    if (typeof globalVars['character_generation_format'] === 'string') {
      characterFormat.value = globalVars['character_generation_format'];
    } else {
      characterFormat.value = 'json'; // 默认为 JSON
    }

    // 加载玩家角色信息
    loadPlayerInfo();

    console.log('📋 已加载游戏设置:', {
      enableStream: enableStream.value,
      heroModifier: heroGenerationModifier.value,
      characterFormat: characterFormat.value,
    });
  } catch (error) {
    console.error('加载游戏设置失败:', error);
  }
};

// 加载玩家角色信息
const loadPlayerInfo = () => {
  try {
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    if (trainingData && trainingData.characters) {
      const playerCharacter = trainingData.characters.find((char: any) => char.id === 'player-1');
      if (playerCharacter) {
        playerName.value = playerCharacter.name || '哥布林之王';
        playerTitle.value = playerCharacter.title || '哥布林巢穴之主';
        playerAvatar.value = playerCharacter.avatar || 'https://files.catbox.moe/x4g8t7.jpg';

        console.log('📋 已加载玩家角色信息:', {
          name: playerName.value,
          title: playerTitle.value,
          avatar: playerAvatar.value,
        });
      }
    }
  } catch (error) {
    console.error('加载玩家角色信息失败:', error);
  }
};

// 保存流式传输设置
const updateStreamingSetting = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['enable_stream_output'] = enableStream.value;
    replaceVariables(globalVars, { type: 'global' });
    console.log('💾 流式传输设置已保存:', enableStream.value);
  } catch (error) {
    console.error('保存流式传输设置失败:', error);
  }
};

// 保存据点人物生成概率修正
const updateHeroModifier = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['hero_generation_modifier'] = heroGenerationModifier.value / 100; // 转换为 0-1 范围保存
    replaceVariables(globalVars, { type: 'global' });
    console.log('💾 据点人物生成概率修正已保存:', `${heroGenerationModifier.value}%`);
  } catch (error) {
    console.error('保存据点人物生成概率修正失败:', error);
  }
};

// 保存人物生成格式
const updateCharacterFormat = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['character_generation_format'] = characterFormat.value;
    replaceVariables(globalVars, { type: 'global' });
    console.log('💾 人物生成格式已保存:', characterFormat.value);
  } catch (error) {
    console.error('保存人物生成格式失败:', error);
  }
};

// 保存玩家角色信息
const savePlayerInfo = async () => {
  // 防止重复点击
  if (isSaving.value) {
    console.log('⏸️ 正在保存中，跳过重复请求');
    return;
  }

  try {
    isSaving.value = true;

    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;

    // 检查存档数据是否存在
    if (!trainingData || !trainingData.characters || !Array.isArray(trainingData.characters)) {
      await ConfirmService.showWarning('存档数据异常', '保存失败', '存档中没有找到人物数据，请先开始游戏');
      return;
    }

    const playerIndex = trainingData.characters.findIndex((char: any) => char.id === 'player-1');

    // 检查是否找到玩家角色
    if (playerIndex === -1) {
      await ConfirmService.showWarning('未找到玩家角色', '保存失败', '存档中没有找到玩家角色，无法更新');
      return;
    }

    // 更新玩家角色信息（保持ID和status不变）
    trainingData.characters[playerIndex].name = playerName.value.trim() || '哥布林之王';
    trainingData.characters[playerIndex].title = playerTitle.value.trim() || '哥布林巢穴之主';
    trainingData.characters[playerIndex].avatar = playerAvatar.value.trim() || 'https://files.catbox.moe/x4g8t7.jpg';

    // 确保玩家角色的关键属性不被修改
    trainingData.characters[playerIndex].id = 'player-1';
    trainingData.characters[playerIndex].status = 'player';

    // 保存到模块化存档
    modularSaveManager.updateModuleData({
      moduleName: 'training',
      data: trainingData,
    });

    console.log('💾 玩家角色信息已保存:', {
      name: trainingData.characters[playerIndex].name,
      title: trainingData.characters[playerIndex].title,
      avatar: trainingData.characters[playerIndex].avatar,
    });

    // 显示成功提示
    await ConfirmService.showSuccess('角色信息已保存', '保存成功', '您的角色名称、头衔和肖像已更新');
  } catch (error) {
    console.error('保存玩家角色信息失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ConfirmService.showDanger(`保存失败：${errorMessage}`, '保存失败', '请重试或检查存档是否正常');
  } finally {
    isSaving.value = false;
  }
};

// 触发文件选择
const triggerFileUpload = () => {
  fileInput.value?.click();
};

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    await ConfirmService.showWarning('请选择图片文件', '文件类型错误', '支持的格式：JPG, PNG, GIF, WEBP等');
    return;
  }

  // 检查文件大小（限制为5MB）
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    await ConfirmService.showWarning(
      '图片文件过大，请选择小于5MB的图片',
      '文件过大',
      `当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
    return;
  }

  try {
    // 将图片转换为Base64
    const reader = new FileReader();

    reader.onload = e => {
      const base64String = e.target?.result as string;
      playerAvatar.value = base64String;
      console.log('✅ 本地图片已加载，大小:', (base64String.length / 1024).toFixed(2), 'KB');
    };

    reader.onerror = () => {
      ConfirmService.showDanger('图片读取失败', '上传失败', '请重试或选择其他图片');
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error('处理图片失败:', error);
    await ConfirmService.showDanger(`处理失败：${error}`, '上传失败');
  } finally {
    // 清空input，允许重复选择同一文件
    if (target) {
      target.value = '';
    }
  }
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = 'https://via.placeholder.com/150?text=Invalid+Image';
  console.warn('图片加载失败，请检查URL是否正确');
};

// 打开文字样式设置
const openTextStyleSettings = () => {
  emit('open-text-style');
};

// 打开教程
const openTutorial = () => {
  emit('open-tutorial');
};

// 强制刷新页面（清除缓存）
const forceRefresh = async () => {
  const confirmed = await ConfirmService.showConfirm({
    title: '确认刷新',
    message: '清除缓存并刷新',
    details: '此操作将清除页面缓存并重新加载最新版本。未保存的数据可能会丢失，请确认是否继续？',
    type: 'warning',
  });

  if (!confirmed) {
    return;
  }

  try {
    // 获取当前 iframe 的 URL
    const currentUrl = window.location.href;

    // 如果当前 URL 中已经有查询参数，先解析
    const url = new URL(currentUrl);

    // 添加时间戳参数来绕过缓存
    url.searchParams.set('_t', Date.now().toString());

    // 重新加载页面（使用 replace 避免产生历史记录）
    window.location.replace(url.toString());
  } catch (error) {
    console.error('强制刷新失败:', error);
    // 如果解析 URL 失败，直接使用 location.reload(true) 的方式
    // 注意：现代浏览器可能不支持 reload 的强制刷新参数，所以添加时间戳更可靠
    window.location.href = window.location.href.split('?')[0] + '?_t=' + Date.now();
  }
};

// 关闭面板
const close = () => {
  emit('close');
};

// 监听显示状态
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      loadSettings();
    }
  },
);

// 初始化
onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.settings-panel {
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

.settings-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  color: #ffd7a1;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.setting-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  .label-text {
    color: #f0e6d2;
    font-weight: 600;
    font-size: 14px;
  }

  .label-desc {
    color: #9ca3af;
    font-size: 12px;
  }
}

.switch-container {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  cursor: pointer;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + .switch-slider {
    background-color: #3b82f6;

    &::before {
      transform: translateX(24px);
    }
  }
}

.switch-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4b5563;
  transition: 0.3s;
  border-radius: 28px;

  &::before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-input {
  flex: 1;
  height: 6px;
  background: #4b5563;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    background: #4b8ef6;
    transform: scale(1.1);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  &::-moz-range-thumb:hover {
    background: #4b8ef6;
    transform: scale(1.1);
  }
}

.slider-value {
  min-width: 50px;
  color: #ffd7a1;
  font-weight: 700;
  font-size: 16px;
  text-align: right;
}

.format-select {
  width: 100%;
  padding: 10px 14px;
  background: rgba(40, 40, 40, 0.8);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  color: #ffd7a1;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(205, 133, 63, 0.6);
    background: rgba(40, 40, 40, 0.95);
  }

  &:focus {
    border-color: rgba(255, 120, 60, 0.6);
  }

  option {
    background: rgba(40, 40, 40, 0.95);
    color: #ffd7a1;
  }
}

.style-button,
.tutorial-button {
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

.tutorial-button {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: rgba(96, 165, 250, 0.5);

  &:hover {
    background: linear-gradient(135deg, #4b8ef6, #3575eb);
  }
}

.update-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: 2px solid rgba(245, 158, 11, 0.5);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #fbbf24, #f59e06);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.text-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(40, 40, 40, 0.8);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  color: #f0e6d2;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: #6b7280;
  }

  &:hover {
    border-color: rgba(205, 133, 63, 0.6);
    background: rgba(40, 40, 40, 0.95);
  }

  &:focus {
    border-color: rgba(255, 120, 60, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 120, 60, 0.1);
  }
}

.avatar-input-container {
  display: flex;
  gap: 8px;
  align-items: stretch;

  .text-input {
    flex: 1;
  }

  .upload-button {
    padding: 10px 16px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: 2px solid rgba(99, 102, 241, 0.5);
    border-radius: 8px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: linear-gradient(135deg, #7578f6, #5f56e5);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;

    .upload-button {
      width: 100%;
    }
  }
}

.avatar-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: rgba(40, 40, 40, 0.5);
  border: 2px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;

  img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    object-fit: cover;
    border: 2px solid rgba(205, 133, 63, 0.4);
  }
}

.save-button {
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: 2px solid rgba(16, 185, 129, 0.5);
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #20c991, #169679);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(135deg, #6b7280, #4b5563);
    border-color: rgba(107, 114, 128, 0.5);
  }
}
</style>
