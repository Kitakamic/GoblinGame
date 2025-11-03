/**
 * AI生成助手
 * 提供带思维链自动切换的AI生成功能
 */

import { ChainOfThoughtMode, WorldbookService } from '../服务/世界书服务';

export interface GenerateOptions {
  user_input: string;
  [key: string]: any;
}

/**
 * 带思维链的AI生成
 * 在调用AI生成前，自动切换到对应的思维链模式
 * @param mode 思维链模式
 * @param options 生成选项
 * @returns Promise<string> AI回复
 */
export async function generateWithChainOfThought(mode: ChainOfThoughtMode, options: GenerateOptions): Promise<string> {
  try {
    // 切换到对应的思维链模式
    await WorldbookService.setChainOfThoughtMode(mode);
    console.log(`已切换到思维链模式: ${mode}`);

    // 调用AI生成
    const response = await window.TavernHelper.generate(options);

    if (!response) {
      throw new Error('AI未返回有效响应');
    }

    return response;
  } catch (error) {
    console.error('带思维链的AI生成失败:', error);
    throw error;
  }
}
