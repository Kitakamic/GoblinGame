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

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">侦察时输入额外提示词</span>
              <span class="label-desc">侦察据点发现人物时，允许提前输入额外提示词来影响人物生成</span>
            </label>
            <label class="switch-container">
              <input
                v-model="enableScoutPromptInput"
                type="checkbox"
                class="switch-input"
                @change="updateScoutPromptInputSetting"
              />
              <span class="switch-slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">完全自定义模式</span>
              <span class="label-desc"
                >开启后，人物生成时只使用格式要求和您的自定义提示词，避免据点信息干扰（适合生成其他世界观或动漫人物）<br /><span
                  class="label-hint"
                  >💡 开启此选项将自动开启"侦察时输入额外提示词"</span
                ></span
              >
            </label>
            <label class="switch-container">
              <input
                v-model="enableFullCustomMode"
                type="checkbox"
                class="switch-input"
                @change="updateFullCustomModeSetting"
              />
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider"></div>

        <!-- 思维链格式自定义 -->
        <div class="settings-section">
          <h4 class="section-title">思维链格式自定义</h4>
          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">自定义思维链格式</span>
              <span class="label-desc">可以自定义所有思维链模式的提示词格式，留空则使用默认格式</span>
            </label>
            <select v-model="selectedChainMode" class="format-select" @change="loadChainFormat">
              <option :value="ChainOfThoughtMode.LOCATION_GENERATION">据点生成思维链</option>
              <option :value="ChainOfThoughtMode.CHARACTER_GENERATION">人物生成思维链</option>
              <option :value="ChainOfThoughtMode.PRE_BATTLE_DIALOGUE">战前对话思维链</option>
              <option :value="ChainOfThoughtMode.BATTLE_SUMMARY">战斗总结思维链</option>
              <option :value="ChainOfThoughtMode.CHARACTER_TRAINING">人物调教思维链</option>
              <option :value="ChainOfThoughtMode.RANDOM_EVENT">随机事件思维链</option>
              <option :value="ChainOfThoughtMode.STORY_SUMMARY">剧情总结思维链</option>
            </select>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">{{ getCurrentChainModeName() }}</span>
              <span class="label-desc">支持多行文本，留空则使用默认格式</span>
            </label>
            <textarea
              v-model="currentChainFormat"
              class="chain-textarea"
              rows="12"
              placeholder="输入自定义思维链格式..."
            ></textarea>
          </div>

          <div class="setting-item" style="display: flex; gap: 8px">
            <button class="chain-action-button" @click="saveChainFormat">💾 保存当前格式</button>
            <button class="chain-action-button secondary" @click="loadDefaultChainFormat">👁️ 查看默认格式</button>
          </div>

          <!-- 分隔线 -->
          <div class="divider" style="margin: 16px 0"></div>

          <!-- 导入导出功能 -->
          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">导入/导出思维链格式</span>
              <span class="label-desc">可以将您的自定义思维链格式导出为文件分享，或从文件导入他人的格式</span>
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap">
              <button class="chain-action-button" @click="exportChainFormats">📤 导出为文件</button>
              <button class="chain-action-button secondary" @click="triggerChainFileImport">📥 从文件导入</button>
              <input
                ref="chainFileInput"
                type="file"
                accept=".json"
                style="display: none"
                @change="handleChainFileImport"
              />
            </div>
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
              <span class="label-desc">您的角色在游戏中的显示名称（仅显示，实际上剧情还是酒馆的user名）</span>
            </label>
            <input v-model="playerName" type="text" class="text-input" placeholder="输入角色名称" />
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">角色头衔</span>
              <span class="label-desc">您的角色称号或职位（仅显示，人设请在世界设定世界书中进行对应调整）</span>
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
              <img :src="playerAvatar" alt="玩家头像预览" @error="handleImageError" @load="handleImageLoad" />
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

          <!-- 暂时关闭清除缓存功能 -->
          <!-- <div class="setting-item">
            <label class="setting-label">
              <span class="label-text">更新与刷新</span>
              <span class="label-desc">如果遇到缓存问题，可以强制清除缓存并刷新页面以获取最新版本</span>
            </label>
            <button class="update-button" @click="forceRefresh">🔄 清除缓存并刷新</button>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ChainOfThoughtManager, ChainOfThoughtMode } from '../../核心层/服务/世界书管理/工具/思维链管理器';
import { modularSaveManager } from '../../核心层/服务/存档系统/模块化存档服务';
import { ConfirmService } from '../../核心层/服务/通用服务/确认框服务';

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

// 侦察时输入额外提示词
const enableScoutPromptInput = ref(false);

// 完全自定义模式
const enableFullCustomMode = ref(false);

// 思维链格式自定义
const selectedChainMode = ref<ChainOfThoughtMode>(ChainOfThoughtMode.LOCATION_GENERATION);
const currentChainFormat = ref('');

// 文件导入相关
const chainFileInput = ref<HTMLInputElement | null>(null);

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

    // 加载侦察时输入额外提示词设置，默认为 false
    if (typeof globalVars['enable_scout_prompt_input'] === 'boolean') {
      enableScoutPromptInput.value = globalVars['enable_scout_prompt_input'];
    } else {
      enableScoutPromptInput.value = false; // 默认关闭
    }

    // 加载完全自定义模式设置，默认为 false
    if (typeof globalVars['enable_full_custom_mode'] === 'boolean') {
      enableFullCustomMode.value = globalVars['enable_full_custom_mode'];
    } else {
      enableFullCustomMode.value = false; // 默认关闭
    }

    // 加载玩家角色信息
    loadPlayerInfo();

    // 加载思维链格式
    loadChainFormat();

    console.log('📋 已加载游戏设置:', {
      enableStream: enableStream.value,
      heroModifier: heroGenerationModifier.value,
      characterFormat: characterFormat.value,
      enableScoutPromptInput: enableScoutPromptInput.value,
      enableFullCustomMode: enableFullCustomMode.value,
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

// 保存侦察时输入额外提示词设置
const updateScoutPromptInputSetting = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['enable_scout_prompt_input'] = enableScoutPromptInput.value;

    // 如果关闭了"侦察时输入额外提示词"，且"完全自定义模式"是开启的，则自动关闭"完全自定义模式"
    if (!enableScoutPromptInput.value && enableFullCustomMode.value) {
      enableFullCustomMode.value = false;
      globalVars['enable_full_custom_mode'] = false;
      console.log('💡 已自动关闭"完全自定义模式"（需要先开启"侦察时输入额外提示词"）');
    }

    replaceVariables(globalVars, { type: 'global' });
    console.log('💾 侦察时输入额外提示词设置已保存:', enableScoutPromptInput.value);
  } catch (error) {
    console.error('保存侦察时输入额外提示词设置失败:', error);
  }
};

// 保存完全自定义模式设置
const updateFullCustomModeSetting = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['enable_full_custom_mode'] = enableFullCustomMode.value;

    // 如果开启"完全自定义模式"，则自动开启"侦察时输入额外提示词"
    if (enableFullCustomMode.value && !enableScoutPromptInput.value) {
      enableScoutPromptInput.value = true;
      globalVars['enable_scout_prompt_input'] = true;
      console.log('💡 已自动开启"侦察时输入额外提示词"（完全自定义模式需要此功能）');
    }

    replaceVariables(globalVars, { type: 'global' });
    console.log('💾 完全自定义模式设置已保存:', enableFullCustomMode.value);
  } catch (error) {
    console.error('保存完全自定义模式设置失败:', error);
  }
};

// 获取当前思维链模式名称
const getCurrentChainModeName = (): string => {
  const modeNames: Record<ChainOfThoughtMode, string> = {
    [ChainOfThoughtMode.LOCATION_GENERATION]: '据点生成思维链',
    [ChainOfThoughtMode.CHARACTER_GENERATION]: '人物生成思维链',
    [ChainOfThoughtMode.PRE_BATTLE_DIALOGUE]: '战前对话思维链',
    [ChainOfThoughtMode.BATTLE_SUMMARY]: '战斗总结思维链',
    [ChainOfThoughtMode.CHARACTER_TRAINING]: '人物调教思维链',
    [ChainOfThoughtMode.RANDOM_EVENT]: '随机事件思维链',
    [ChainOfThoughtMode.STORY_SUMMARY]: '剧情总结思维链',
  };
  return modeNames[selectedChainMode.value] || '未知模式';
};

// 加载思维链格式
const loadChainFormat = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    const customChainKey = `chain_of_thought_${selectedChainMode.value}`;
    // 检查是否有自定义格式（包括空字符串，表示用户明确清空了）
    if (customChainKey in globalVars && typeof globalVars[customChainKey] === 'string') {
      currentChainFormat.value = globalVars[customChainKey];
    } else {
      // 如果没有自定义格式，加载默认格式用于显示
      currentChainFormat.value = ChainOfThoughtManager.getDefaultChain(selectedChainMode.value);
    }
  } catch (error) {
    console.error('加载思维链格式失败:', error);
    currentChainFormat.value = ChainOfThoughtManager.getDefaultChain(selectedChainMode.value);
  }
};

// 保存思维链格式
const saveChainFormat = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    const customChainKey = `chain_of_thought_${selectedChainMode.value}`;

    if (currentChainFormat.value.trim()) {
      globalVars[customChainKey] = currentChainFormat.value.trim();
      console.log(`💾 已保存自定义思维链格式: ${getCurrentChainModeName()}`);
    } else {
      // 如果为空，删除自定义格式，使用默认格式
      delete globalVars[customChainKey];
      console.log(`💾 已清空自定义思维链格式，将使用默认格式: ${getCurrentChainModeName()}`);
    }

    replaceVariables(globalVars, { type: 'global' });
  } catch (error) {
    console.error('保存思维链格式失败:', error);
  }
};

// 查看默认思维链格式（临时显示，不保存）
const loadDefaultChainFormat = () => {
  currentChainFormat.value = ChainOfThoughtManager.getDefaultChain(selectedChainMode.value);
  console.log(
    `👁️ 已加载默认思维链格式用于查看: ${getCurrentChainModeName()}（只是临时显示，需要点击"保存当前格式"才会应用）`,
  );
};

// 导出思维链格式为文件（导出所有格式，包括默认格式）
const exportChainFormats = async () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    const chains: Record<string, string> = {};
    const allModes = Object.values(ChainOfThoughtMode);

    // 收集所有格式（包括默认格式）
    for (const mode of allModes) {
      const customChainKey = `chain_of_thought_${mode}`;
      // 如果有自定义格式，使用自定义格式；否则使用默认格式
      if (customChainKey in globalVars && typeof globalVars[customChainKey] === 'string') {
        chains[mode] = globalVars[customChainKey];
      } else {
        // 使用默认格式
        chains[mode] = ChainOfThoughtManager.getDefaultChain(mode);
      }
    }

    // 构建导出数据
    const exportData = {
      version: '1.0',
      description: '哥布林巢穴思维链格式（包含所有模式）',
      chains,
      exportedAt: new Date().toISOString(),
    };

    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = `思维链格式_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 释放URL对象
    URL.revokeObjectURL(url);

    const customCount = Object.values(ChainOfThoughtMode).filter(
      mode => `chain_of_thought_${mode}` in globalVars && typeof globalVars[`chain_of_thought_${mode}`] === 'string',
    ).length;

    await ConfirmService.showSuccess(
      `已导出所有 ${Object.keys(chains).length} 个思维链格式`,
      '导出成功',
      `包含 ${customCount} 个自定义格式和 ${Object.keys(chains).length - customCount} 个默认格式。文件已保存到您的下载文件夹。`,
    );

    console.log('✅ 思维链格式已导出:', exportData);
  } catch (error) {
    console.error('导出思维链格式失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ConfirmService.showDanger(`导出失败：${errorMessage}`, '导出失败', '请重试或检查文件权限。');
  }
};

// 触发文件选择
const triggerChainFileImport = () => {
  chainFileInput.value?.click();
};

// 处理文件导入
const handleChainFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    // 读取文件内容
    const text = await file.text();
    let importData: any;

    try {
      importData = JSON.parse(text);
    } catch (parseError) {
      await ConfirmService.showWarning('JSON格式错误', '导入失败', '文件不是有效的JSON格式，请检查文件是否正确。');
      target.value = '';
      return;
    }

    // 验证数据格式
    if (!importData.chains || typeof importData.chains !== 'object') {
      await ConfirmService.showWarning('数据格式错误', '导入失败', '文件中没有找到思维链格式数据。');
      target.value = '';
      return;
    }

    // 检查有哪些可用的思维链格式（包括默认格式）
    const availableChains = Object.keys(importData.chains).filter((mode: string) => {
      return Object.values(ChainOfThoughtMode).includes(mode as ChainOfThoughtMode);
    });

    if (availableChains.length === 0) {
      await ConfirmService.showWarning('没有有效格式', '导入失败', '文件中没有找到有效的思维链格式模式。');
      target.value = '';
      return;
    }

    // 获取模式名称映射
    const modeNames: Record<ChainOfThoughtMode, string> = {
      [ChainOfThoughtMode.LOCATION_GENERATION]: '据点生成思维链',
      [ChainOfThoughtMode.CHARACTER_GENERATION]: '人物生成思维链',
      [ChainOfThoughtMode.PRE_BATTLE_DIALOGUE]: '战前对话思维链',
      [ChainOfThoughtMode.BATTLE_SUMMARY]: '战斗总结思维链',
      [ChainOfThoughtMode.CHARACTER_TRAINING]: '人物调教思维链',
      [ChainOfThoughtMode.RANDOM_EVENT]: '随机事件思维链',
      [ChainOfThoughtMode.STORY_SUMMARY]: '剧情总结思维链',
    };

    // 检查是否有缺失的格式
    const allModes = Object.values(ChainOfThoughtMode);
    const missingModes = allModes.filter(mode => !availableChains.includes(mode));
    if (missingModes.length > 0) {
      const missingNames = missingModes.map(mode => modeNames[mode]).join('、');
      console.log(`⚠️ 文件中缺少以下格式，将使用默认格式：${missingNames}`);
    }

    // 让用户确认导入哪些格式
    const chainNames = availableChains
      .map((mode: string) => `• ${modeNames[mode as ChainOfThoughtMode] || mode}`)
      .join('\n');

    const confirmed = await ConfirmService.showConfirm({
      title: '确认导入',
      message: `文件包含 ${availableChains.length} 个思维链格式${missingModes.length > 0 ? `，缺少 ${missingModes.length} 个格式将使用默认值` : ''}`,
      details: `将要导入以下格式：\n${chainNames}${missingModes.length > 0 ? `\n\n缺少的格式（将使用默认值）：\n${missingModes.map(mode => `• ${modeNames[mode]}`).join('\n')}` : ''}\n\n⚠️ 注意：这将覆盖您现有的对应格式。\n\n是否继续导入？`,
      type: 'info',
    });

    if (!confirmed) {
      target.value = '';
      return;
    }

    // 导入数据（导入所有格式：文件中的格式 + 文件中缺少的格式使用默认格式）
    const globalVars = getVariables({ type: 'global' });
    let importedCount = 0;

    // 导入文件中包含的格式
    for (const mode of availableChains) {
      const chainContent = importData.chains[mode];
      if (typeof chainContent === 'string' && chainContent.trim()) {
        const customChainKey = `chain_of_thought_${mode}`;
        globalVars[customChainKey] = chainContent.trim();
        importedCount++;
      }
    }

    // 如果文件缺少某些格式，使用默认格式填充（导入所有格式）
    let defaultCount = 0;
    if (missingModes.length > 0) {
      for (const mode of missingModes) {
        // 使用默认格式（删除自定义格式，让系统使用默认格式）
        const customChainKey = `chain_of_thought_${mode}`;
        // 删除自定义格式，这样系统就会使用默认格式
        if (customChainKey in globalVars) {
          delete globalVars[customChainKey];
        }
        // 注意：我们不保存默认格式，因为默认格式不需要保存到全局变量中
        // 系统会自动使用默认格式
        defaultCount++;
      }
    }

    if (importedCount > 0) {
      replaceVariables(globalVars, { type: 'global' });
      // 重新加载当前显示的格式
      loadChainFormat();

      const successMessage =
        defaultCount > 0
          ? `已成功导入 ${importedCount} 个自定义格式，${defaultCount} 个格式使用默认值`
          : `已成功导入 ${importedCount} 个思维链格式`;

      await ConfirmService.showSuccess(
        successMessage,
        '导入成功',
        '格式已应用到您的设置中，您可以继续编辑或使用它们。',
      );

      console.log('✅ 思维链格式已导入:', {
        importedCount,
        defaultCount,
        chains: availableChains,
        missingModes: missingModes.length > 0 ? missingModes : [],
      });
    } else {
      await ConfirmService.showWarning('导入失败', '没有有效内容', '文件中没有找到有效的思维链格式内容。');
    }
  } catch (error) {
    console.error('导入思维链格式失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ConfirmService.showDanger(`导入失败：${errorMessage}`, '导入失败', '请检查文件是否正确或重试。');
  } finally {
    // 清空input，允许重复选择同一文件
    target.value = '';
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

// 压缩图片
const compressImage = (
  file: File,
  maxWidth: number = 512,
  maxHeight: number = 512,
  quality: number = 0.85,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        try {
          // 计算新尺寸，保持宽高比
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // 创建canvas并绘制压缩后的图片
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'));
            return;
          }

          // 使用高质量渲染
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为base64，使用JPEG格式以获得更好的压缩率
          const base64String = canvas.toDataURL('image/jpeg', quality);
          resolve(base64String);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
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

  // 检查文件大小（限制为10MB，压缩后会变小）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    await ConfirmService.showWarning(
      '图片文件过大，请选择小于10MB的图片',
      '文件过大',
      `当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );
    return;
  }

  try {
    console.log('🖼️ 开始压缩图片...');

    // 压缩图片（头像使用512x512，质量0.85）
    const compressedBase64 = await compressImage(file, 512, 512, 0.85);

    // 检查压缩后的大小（限制为200KB）
    const maxCompressedSize = 200 * 1024; // 200KB
    if (compressedBase64.length > maxCompressedSize) {
      // 如果还是太大，进一步降低质量
      console.log('⚠️ 图片压缩后仍然较大，进一步降低质量...');
      const furtherCompressed = await compressImage(file, 512, 512, 0.7);
      playerAvatar.value = furtherCompressed;
      console.log('✅ 本地图片已加载（二次压缩），大小:', (furtherCompressed.length / 1024).toFixed(2), 'KB');
    } else {
      playerAvatar.value = compressedBase64;
      console.log('✅ 本地图片已加载（压缩），大小:', (compressedBase64.length / 1024).toFixed(2), 'KB');
    }

    // 显示成功提示
    await ConfirmService.showSuccess('图片已成功加载并压缩', '上传成功');
  } catch (error) {
    console.error('处理图片失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ConfirmService.showDanger(`处理失败：${errorMessage}`, '上传失败', '请重试或选择其他图片');
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

// 处理图片加载成功
const handleImageLoad = (event: Event) => {
  const target = event.target as HTMLImageElement;
  // 确保图片正确显示
  target.style.display = 'block';
  console.log('✅ 头像预览加载成功');
};

// 打开文字样式设置
const openTextStyleSettings = () => {
  emit('open-text-style');
};

// 打开教程
const openTutorial = () => {
  emit('open-tutorial');
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

// 监听选择的思维链模式变化
watch(selectedChainMode, () => {
  loadChainFormat();
});

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
    line-height: 1.5;

    .label-hint {
      color: #fbbf24;
      font-size: 11px;
      font-style: italic;
      margin-top: 4px;
      display: inline-block;
    }
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

.chain-textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(40, 40, 40, 0.8);
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 8px;
  color: #f0e6d2;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: all 0.2s ease;
  min-height: 200px;

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

.chain-action-button {
  flex: 1;
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

  &.secondary {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    border-color: rgba(107, 114, 128, 0.5);

    &:hover {
      background: linear-gradient(135deg, #7c8289, #5b616b);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
    }
  }
}
</style>
