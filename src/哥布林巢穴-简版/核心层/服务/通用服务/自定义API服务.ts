/**
 * 自定义API服务
 * 提供获取和使用自定义API配置的功能
 */

// 自定义API配置类型
export type CustomApiConfig = {
  apiurl: string;
  key?: string;
  model: string;
  source?: string;
};

// API配置项（包含名称和配置）
export type ApiConfigItem = {
  id: string;
  name: string;
  config: CustomApiConfig;
};

/**
 * 获取当前启用的自定义API配置
 * @returns 如果启用了自定义API且有有效配置，返回配置对象；否则返回null
 */
export function getCurrentCustomApiConfig(): CustomApiConfig | null {
  try {
    const globalVars = getVariables({ type: 'global' });
    const enableCustomApiKey = 'enable_custom_api';
    const configsKey = 'custom_api_configs';
    const currentConfigIdKey = 'custom_api_current_config_id';

    // 检查是否启用自定义API
    if (typeof globalVars[enableCustomApiKey] !== 'boolean' || !globalVars[enableCustomApiKey]) {
      return null;
    }

    // 获取所有配置
    if (!globalVars[configsKey] || !Array.isArray(globalVars[configsKey])) {
      return null;
    }

    const configs = globalVars[configsKey] as ApiConfigItem[];

    // 获取当前配置ID
    const currentConfigId = globalVars[currentConfigIdKey] as string | undefined;
    if (!currentConfigId) {
      return null;
    }

    // 查找当前配置
    const config = configs.find(c => c.id === currentConfigId);
    if (!config) {
      return null;
    }

    // 验证配置是否有效（至少需要API地址和模型名称）
    if (!config.config.apiurl.trim() || !config.config.model.trim()) {
      return null;
    }

    return { ...config.config };
  } catch (error) {
    console.error('获取自定义API配置失败:', error);
    return null;
  }
}

/**
 * 在生成选项中应用自定义API配置
 * @param options 生成选项
 * @returns 应用了自定义API配置的生成选项
 */
export function applyCustomApiToGenerateOptions<T extends { custom_api?: CustomApiConfig }>(options: T): T {
  const customApi = getCurrentCustomApiConfig();
  if (customApi) {
    return {
      ...options,
      custom_api: customApi,
    };
  }
  return options;
}
