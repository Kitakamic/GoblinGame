<template>
  <div class="custom-api-settings">
    <h4 class="section-title">自定义API设置</h4>

    <div class="setting-item">
      <label class="setting-label">
        <span class="label-text">启用自定义API配置</span>
        <span class="label-desc"
          >副API，用于降低部分简易工作的主API调用或额外的后处理工作。正常情况仍使用酒馆配置的API。</span
        >
      </label>
      <label class="switch-container">
        <input v-model="enableCustomApi" type="checkbox" class="switch-input" @change="updateEnableCustomApi" />
        <span class="switch-slider"></span>
      </label>
    </div>

    <div v-if="enableCustomApi" class="api-config-section">
      <div class="divider" style="margin: 20px 0"></div>

      <!-- API配置管理 -->
      <div class="setting-item">
        <label class="setting-label">
          <span class="label-text">API配置</span>
          <span class="label-desc">管理多个API配置，可以在不同配置之间切换</span>
        </label>
        <div class="config-manager-container">
          <select v-model="currentConfigId" class="format-select" @change="switchConfig">
            <option value="">请选择或创建配置</option>
            <option v-for="config in apiConfigs" :key="config.id" :value="config.id">
              {{ config.name }}
            </option>
          </select>
          <div class="config-actions">
            <button class="config-action-btn" @click="createNewConfig">➕ 新建</button>
            <button v-if="currentConfigId" class="config-action-btn delete-btn" @click="deleteCurrentConfig">
              🗑️ 删除
            </button>
          </div>
        </div>
      </div>

      <!-- 配置名称 -->
      <div v-if="currentConfigId" class="setting-item">
        <label class="setting-label">
          <span class="label-text">配置名称</span>
          <span class="label-desc">为当前配置设置一个便于识别的名称</span>
        </label>
        <input
          v-model="currentConfigName"
          type="text"
          class="text-input"
          placeholder="输入配置名称"
          @input="updateConfigName"
        />
      </div>

      <div v-if="currentConfigId" class="divider" style="margin: 20px 0"></div>

      <!-- API地址 -->
      <div class="setting-item">
        <label class="setting-label">
          <span class="label-text">API地址 *</span>
          <span class="label-desc">自定义API的完整URL地址，例如：https://api.openai.com/v1/chat/completions</span>
        </label>
        <input
          v-model="apiConfig.apiurl"
          type="text"
          class="text-input"
          placeholder="https://api.openai.com/v1/chat/completions"
          @input="updateApiConfig"
        />
      </div>

      <!-- API密钥 -->
      <div class="setting-item">
        <label class="setting-label">
          <span class="label-text">API密钥</span>
          <span class="label-desc">API的密钥，如果需要认证的话（留空则不发送密钥）</span>
        </label>
        <div class="password-input-container">
          <input
            v-model="apiConfig.key"
            :type="showApiKey ? 'text' : 'password'"
            class="text-input"
            placeholder="输入API密钥（可选）"
            @input="updateApiConfig"
          />
          <button class="toggle-password-btn" @click="showApiKey = !showApiKey">
            {{ showApiKey ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <!-- 模型名称 -->
      <div class="setting-item">
        <label class="setting-label">
          <span class="label-text">模型名称 *</span>
          <span class="label-desc">选择该API支持的模型，或手动输入自定义模型名称</span>
        </label>
        <div class="model-select-container">
          <select v-model="apiConfig.model" class="format-select" :disabled="isLoadingModels" @change="updateApiConfig">
            <option value="">{{ isLoadingModels ? '正在加载模型列表...' : '请选择模型或手动输入' }}</option>
            <option v-for="model in availableModels" :key="model" :value="model">{{ model }}</option>
          </select>
          <button
            class="refresh-models-btn"
            title="从API获取支持的模型列表"
            :disabled="isLoadingModels || !canLoadModels"
            @click="loadModelsFromApi"
          >
            {{ isLoadingModels ? '⏳' : '🔄' }}
          </button>
        </div>
        <div v-if="availableModels.length > 0" class="model-count-hint">
          已加载 {{ availableModels.length }} 个可用模型
        </div>
        <input
          v-model="apiConfig.model"
          type="text"
          class="text-input model-input-fallback"
          placeholder="或手动输入模型名称"
          @input="updateApiConfig"
        />
      </div>

      <!-- API源 -->
      <div class="setting-item">
        <label class="setting-label">
          <span class="label-text">API源</span>
          <span class="label-desc">API的源类型，默认为 'openai'，用于确定API的调用格式</span>
        </label>
        <select v-model="apiConfig.source" class="format-select" @change="updateApiConfig">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="google">Google</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div class="divider" style="margin: 20px 0"></div>

      <!-- 测试按钮 -->
      <div class="setting-item">
        <div class="button-group">
          <button class="test-button" :disabled="isTesting || !canTest" @click="testApiConnection">
            {{ isTesting ? '⏳ 测试中...' : '🧪 测试API连接' }}
          </button>
          <button class="reset-button secondary" @click="resetToDefaults">🔄 清空当前配置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { toast } from '../../../核心层/服务/通用服务/弹窗提示服务';
import { ConfirmService } from '../../../核心层/服务/通用服务/确认框服务';

// 自定义API配置类型
type CustomApiConfig = {
  apiurl: string;
  key?: string;
  model: string;
  source?: string;
};

// API配置项（包含名称和配置）
type ApiConfigItem = {
  id: string;
  name: string;
  config: CustomApiConfig;
};

// 是否启用自定义API
const enableCustomApi = ref(false);

// 所有API配置列表
const apiConfigs = ref<ApiConfigItem[]>([]);

// 当前选中的配置ID
const currentConfigId = ref<string>('');

// 当前配置名称
const currentConfigName = ref('');

// 当前API配置
const apiConfig = ref<CustomApiConfig>({
  apiurl: '',
  key: '',
  model: '',
  source: 'openai',
});

// 是否显示API密钥
const showApiKey = ref(false);

// 测试状态
const isTesting = ref(false);

// 可用模型列表
const availableModels = ref<string[]>([]);

// 是否正在加载模型列表
const isLoadingModels = ref(false);

// 是否可以加载模型（需要API地址）
const canLoadModels = computed(() => {
  return enableCustomApi.value && apiConfig.value.apiurl.trim() !== '';
});

// 是否可以测试（需要至少API地址和模型名称）
const canTest = computed(() => {
  return enableCustomApi.value && apiConfig.value.apiurl.trim() !== '' && apiConfig.value.model.trim() !== '';
});

// 加载设置
const loadSettings = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    const configsKey = 'custom_api_configs';
    const currentConfigIdKey = 'custom_api_current_config_id';
    const enableCustomApiKey = 'enable_custom_api';

    // 加载是否启用自定义API
    if (typeof globalVars[enableCustomApiKey] === 'boolean') {
      enableCustomApi.value = globalVars[enableCustomApiKey];
    } else {
      enableCustomApi.value = false;
    }

    // 加载所有API配置
    if (globalVars[configsKey] && Array.isArray(globalVars[configsKey])) {
      apiConfigs.value = globalVars[configsKey] as ApiConfigItem[];
    } else {
      apiConfigs.value = [];
    }

    // 加载当前选中的配置ID
    if (typeof globalVars[currentConfigIdKey] === 'string') {
      const savedConfigId = globalVars[currentConfigIdKey] as string;
      // 检查配置是否存在
      if (apiConfigs.value.find(c => c.id === savedConfigId)) {
        currentConfigId.value = savedConfigId;
        switchConfig(); // 切换到该配置
      } else if (apiConfigs.value.length > 0) {
        // 如果保存的配置不存在，使用第一个配置
        currentConfigId.value = apiConfigs.value[0].id;
        switchConfig();
      }
    } else if (apiConfigs.value.length > 0) {
      // 如果没有保存的配置ID，使用第一个配置
      currentConfigId.value = apiConfigs.value[0].id;
      switchConfig();
    }

    console.log('📋 已加载自定义API设置:', {
      enableCustomApi: enableCustomApi.value,
      configsCount: apiConfigs.value.length,
      currentConfigId: currentConfigId.value,
    });
  } catch (error) {
    console.error('加载自定义API设置失败:', error);
  }
};

// 更新启用状态
const updateEnableCustomApi = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['enable_custom_api'] = enableCustomApi.value;
    replaceVariables(globalVars, { type: 'global' });

    if (enableCustomApi.value) {
      // 如果启用但没有配置，创建一个默认配置
      if (apiConfigs.value.length === 0) {
        createNewConfig();
      } else if (!currentConfigId.value && apiConfigs.value.length > 0) {
        // 如果有配置但没有选中，选中第一个
        currentConfigId.value = apiConfigs.value[0].id;
        switchConfig();
      }
      toast.success('已启用自定义API配置', { title: '设置已保存' });
    } else {
      toast.success('已禁用自定义API配置', { title: '设置已保存' });
    }

    console.log('💾 自定义API启用状态已保存:', enableCustomApi.value);
  } catch (error) {
    console.error('保存自定义API启用状态失败:', error);
    toast.error('保存设置失败', { title: '错误' });
  }
};

// 切换配置
const switchConfig = () => {
  // 在切换前，先保存当前配置（如果有的话）
  if (currentConfigId.value) {
    updateApiConfig();
  }

  if (!currentConfigId.value) {
    // 如果没有选中配置，清空当前配置
    apiConfig.value = {
      apiurl: '',
      key: '',
      model: '',
      source: 'openai',
    };
    currentConfigName.value = '';
    availableModels.value = [];
    saveCurrentConfigId();
    return;
  }

  const config = apiConfigs.value.find(c => c.id === currentConfigId.value);
  if (config) {
    apiConfig.value = { ...config.config };
    currentConfigName.value = config.name;
    availableModels.value = []; // 清空模型列表，需要重新加载
    saveCurrentConfigId();
    console.log('🔄 已切换到配置:', config.name);
  }
};

// 更新配置名称
const updateConfigName = () => {
  if (!currentConfigId.value) return;

  const config = apiConfigs.value.find(c => c.id === currentConfigId.value);
  if (config) {
    config.name = currentConfigName.value.trim() || '未命名配置';
    saveAllConfigs();
    toast.success('配置名称已更新', { title: '保存成功' });
  }
};

// 创建新配置
const createNewConfig = () => {
  const newId = `config_${Date.now()}`;
  const newConfig: ApiConfigItem = {
    id: newId,
    name: `配置 ${apiConfigs.value.length + 1}`,
    config: {
      apiurl: '',
      key: '',
      model: '',
      source: 'openai',
    },
  };

  apiConfigs.value.push(newConfig);
  currentConfigId.value = newId;
  currentConfigName.value = newConfig.name;
  apiConfig.value = { ...newConfig.config };
  availableModels.value = [];

  saveAllConfigs();
  saveCurrentConfigId();
  toast.success('已创建新配置', { title: '创建成功' });
  console.log('✅ 已创建新配置:', newConfig.name);
};

// 删除当前配置
const deleteCurrentConfig = async () => {
  if (!currentConfigId.value) return;

  const config = apiConfigs.value.find(c => c.id === currentConfigId.value);
  if (!config) return;

  const confirmed = await ConfirmService.showConfirm({
    message: `确定要删除配置"${config.name}"吗？\n\n此操作不可恢复。`,
    title: '删除配置',
    type: 'danger',
    confirmText: '删除',
    cancelText: '取消',
  });

  if (!confirmed) return;

  // 从列表中删除
  const index = apiConfigs.value.findIndex(c => c.id === currentConfigId.value);
  if (index !== -1) {
    apiConfigs.value.splice(index, 1);
  }

  // 如果还有其他配置，切换到第一个；否则清空
  if (apiConfigs.value.length > 0) {
    currentConfigId.value = apiConfigs.value[0].id;
    switchConfig();
  } else {
    currentConfigId.value = '';
    currentConfigName.value = '';
    apiConfig.value = {
      apiurl: '',
      key: '',
      model: '',
      source: 'openai',
    };
    availableModels.value = [];
  }

  saveAllConfigs();
  saveCurrentConfigId();
  toast.success('已删除配置', { title: '删除成功' });
  console.log('🗑️ 已删除配置:', config.name);
};

// 更新API配置
const updateApiConfig = () => {
  if (!enableCustomApi.value || !currentConfigId.value) {
    return; // 如果未启用或没有选中配置，不保存
  }

  try {
    const config = apiConfigs.value.find(c => c.id === currentConfigId.value);
    if (config) {
      // 更新当前配置
      config.config = {
        apiurl: apiConfig.value.apiurl.trim(),
        model: apiConfig.value.model.trim(),
        source: apiConfig.value.source || 'openai',
      };

      // 可选字段
      if (apiConfig.value.key && apiConfig.value.key.trim() !== '') {
        config.config.key = apiConfig.value.key.trim();
      } else {
        delete config.config.key;
      }

      saveAllConfigs();
      console.log('💾 自定义API配置已保存:', config.name);
    }
  } catch (error) {
    console.error('保存自定义API配置失败:', error);
  }
};

// 保存所有配置
const saveAllConfigs = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['custom_api_configs'] = apiConfigs.value;
    replaceVariables(globalVars, { type: 'global' });
  } catch (error) {
    console.error('保存所有配置失败:', error);
  }
};

// 保存当前配置ID
const saveCurrentConfigId = () => {
  try {
    const globalVars = getVariables({ type: 'global' });
    globalVars['custom_api_current_config_id'] = currentConfigId.value;
    replaceVariables(globalVars, { type: 'global' });
  } catch (error) {
    console.error('保存当前配置ID失败:', error);
  }
};

// 测试API连接
const testApiConnection = async () => {
  if (!canTest.value || isTesting.value) {
    return;
  }

  try {
    isTesting.value = true;

    // 构建测试配置
    const testConfig: CustomApiConfig = {
      apiurl: apiConfig.value.apiurl.trim(),
      model: apiConfig.value.model.trim(),
      source: apiConfig.value.source || 'openai',
    };

    if (apiConfig.value.key && apiConfig.value.key.trim() !== '') {
      testConfig.key = apiConfig.value.key.trim();
    }

    // 使用自定义API进行测试生成
    const testResponse = await window.TavernHelper.generate({
      user_input: '你好，这是一个API连接测试。请回复"测试成功"。',
      custom_api: testConfig,
    });

    if (testResponse && testResponse.trim().length > 0) {
      await ConfirmService.showSuccess(
        'API连接测试成功！',
        '测试成功',
        `API返回了响应：\n\n${testResponse.substring(0, 200)}${testResponse.length > 200 ? '...' : ''}`,
      );
      console.log('✅ API连接测试成功:', testResponse);
    } else {
      await ConfirmService.showWarning('API返回了空响应', '测试警告', 'API连接成功，但返回的内容为空。');
    }
  } catch (error) {
    console.error('API连接测试失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ConfirmService.showDanger(
      `API连接测试失败：${errorMessage}`,
      '测试失败',
      '请检查API地址、密钥和模型名称是否正确，以及网络连接是否正常。',
    );
  } finally {
    isTesting.value = false;
  }
};

// 从API获取模型列表
const loadModelsFromApi = async () => {
  if (!canLoadModels.value || isLoadingModels.value) {
    return;
  }

  try {
    isLoadingModels.value = true;
    availableModels.value = [];

    // 尝试通过酒馆的预设管理器获取模型列表
    try {
      // 方法1: 尝试通过 getPresetManager 获取
      if (typeof SillyTavern?.getPresetManager === 'function') {
        const presetManager = SillyTavern.getPresetManager();
        if (presetManager && typeof presetManager.getModels === 'function') {
          const models = await presetManager.getModels();
          if (Array.isArray(models) && models.length > 0) {
            availableModels.value = models;
            toast.success(`已加载 ${models.length} 个可用模型`, { title: '加载成功' });
            console.log('✅ 通过预设管理器获取模型列表:', models);
            return;
          }
        }
      }

      // 方法2: 尝试通过 ChatCompletionService 获取
      if (SillyTavern?.ChatCompletionService) {
        const service = SillyTavern.ChatCompletionService;
        if (service && typeof service.getModels === 'function') {
          const models = await service.getModels();
          if (Array.isArray(models) && models.length > 0) {
            availableModels.value = models;
            toast.success(`已加载 ${models.length} 个可用模型`, { title: '加载成功' });
            console.log('✅ 通过ChatCompletionService获取模型列表:', models);
            return;
          }
        }
      }

      // 方法3: 直接调用API获取模型列表（OpenAI格式）
      if (apiConfig.value.apiurl.trim()) {
        const apiUrl = apiConfig.value.apiurl.trim();
        const modelsUrl = apiUrl.replace('/chat/completions', '/models').replace('/v1/chat/completions', '/v1/models');

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (apiConfig.value.key && apiConfig.value.key.trim()) {
          headers['Authorization'] = `Bearer ${apiConfig.value.key.trim()}`;
        }

        const response = await fetch(modelsUrl, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            const models = data.data.map((item: any) => item.id || item.model || item).filter(Boolean);
            if (models.length > 0) {
              availableModels.value = models;
              toast.success(`已加载 ${models.length} 个可用模型`, { title: '加载成功' });
              console.log('✅ 通过API获取模型列表:', models);
              return;
            }
          }
        }
      }

      // 如果所有方法都失败
      await ConfirmService.showWarning(
        '无法获取模型列表',
        '加载失败',
        '请确保API地址和密钥正确，或手动输入模型名称。某些API可能不支持模型列表接口。',
      );
    } catch (error) {
      console.error('获取模型列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await ConfirmService.showWarning(
        `获取模型列表失败：${errorMessage}`,
        '加载失败',
        '请检查API地址和密钥是否正确，或手动输入模型名称。',
      );
    }
  } finally {
    isLoadingModels.value = false;
  }
};

// 恢复默认值（清空当前配置）
const resetToDefaults = async () => {
  if (!currentConfigId.value) return;

  const confirmed = await ConfirmService.showConfirm({
    message: '确定要清空当前配置的所有内容吗？',
    title: '确认重置',
    type: 'warning',
    confirmText: '重置',
    cancelText: '取消',
  });

  if (!confirmed) {
    return;
  }

  try {
    apiConfig.value = {
      apiurl: '',
      key: '',
      model: '',
      source: 'openai',
    };
    availableModels.value = [];

    updateApiConfig();
    toast.success('已清空当前配置', { title: '操作成功' });
    console.log('🔄 已清空当前配置');
  } catch (error) {
    console.error('恢复默认值失败:', error);
    toast.error('恢复默认值失败', { title: '错误' });
  }
};

// 监听启用状态变化，自动保存配置
watch(enableCustomApi, () => {
  if (enableCustomApi.value) {
    updateApiConfig();
  }
});

// 组件挂载时加载设置
onMounted(() => {
  loadSettings();
});

// 获取当前启用的自定义API配置（供外部调用）
const getCurrentCustomApiConfig = (): CustomApiConfig | null => {
  if (!enableCustomApi.value || !currentConfigId.value) {
    return null;
  }

  const config = apiConfigs.value.find(c => c.id === currentConfigId.value);
  if (config && config.config.apiurl.trim() && config.config.model.trim()) {
    return { ...config.config };
  }

  return null;
};

// 暴露方法供父组件调用
defineExpose({
  loadSettings,
  getCurrentCustomApiConfig,
});
</script>

<style scoped lang="scss">
.custom-api-settings {
  .section-title {
    color: #ffd7a1;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .subsection-title {
    color: #ffd7a1;
    font-size: 14px;
    font-weight: 600;
    margin: 16px 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(205, 133, 63, 0.3);
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

  .password-input-container {
    display: flex;
    gap: 8px;
    align-items: stretch;

    .text-input {
      flex: 1;
    }

    .toggle-password-btn {
      padding: 10px 14px;
      background: rgba(40, 40, 40, 0.8);
      border: 2px solid rgba(205, 133, 63, 0.4);
      border-radius: 8px;
      color: #f0e6d2;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 48px;

      &:hover {
        border-color: rgba(205, 133, 63, 0.6);
        background: rgba(40, 40, 40, 0.95);
      }
    }
  }

  .model-select-container {
    display: flex;
    gap: 8px;
    align-items: stretch;
    margin-bottom: 8px;

    .format-select {
      flex: 1;
    }

    .refresh-models-btn {
      padding: 10px 14px;
      background: rgba(40, 40, 40, 0.8);
      border: 2px solid rgba(205, 133, 63, 0.4);
      border-radius: 8px;
      color: #f0e6d2;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        border-color: rgba(205, 133, 63, 0.6);
        background: rgba(40, 40, 40, 0.95);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .model-count-hint {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 4px;
    margin-bottom: 8px;
    padding-left: 4px;
  }

  .model-input-fallback {
    margin-top: 8px;
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

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    option {
      background: rgba(40, 40, 40, 0.95);
      color: #ffd7a1;
    }
  }

  .config-manager-container {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .format-select {
      width: 100%;
    }

    .config-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .config-action-btn {
      flex: 1;
      min-width: 100px;
      padding: 8px 12px;
      background: rgba(40, 40, 40, 0.8);
      border: 2px solid rgba(205, 133, 63, 0.4);
      border-radius: 8px;
      color: #f0e6d2;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(205, 133, 63, 0.6);
        background: rgba(40, 40, 40, 0.95);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }

      &.delete-btn {
        color: #ef4444;
        border-color: #ef4444;

        &:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
        }
      }
    }
  }

  .slider-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
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

  .slider-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }

  .slider-reset-btn {
    padding: 6px 12px;
    background: rgba(107, 114, 128, 0.3);
    border: 1px solid rgba(107, 114, 128, 0.5);
    border-radius: 6px;
    color: #9ca3af;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(107, 114, 128, 0.5);
      border-color: rgba(107, 114, 128, 0.7);
      color: #d1d5db;
    }
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;

    @media (min-width: 481px) {
      flex-direction: row;
    }
  }

  .test-button,
  .reset-button {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid;
  }

  .test-button {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: rgba(16, 185, 129, 0.5);
    color: #ffffff;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #20c991, #169679);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: linear-gradient(135deg, #6b7280, #4b5563);
      border-color: rgba(107, 114, 128, 0.5);
    }
  }

  .reset-button {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    border-color: rgba(107, 114, 128, 0.5);
    color: #ffffff;

    &:hover {
      background: linear-gradient(135deg, #7578f6, #5f56e5);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
    }

    &.secondary {
      background: linear-gradient(135deg, #6b7280, #4b5563);
      border-color: rgba(107, 114, 128, 0.5);

      &:hover {
        background: linear-gradient(135deg, #7578f6, #5f56e5);
        border-color: rgba(107, 114, 128, 0.7);
      }
    }
  }

  .divider {
    height: 1px;
    background: rgba(205, 133, 63, 0.3);
  }

  .api-config-section {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
