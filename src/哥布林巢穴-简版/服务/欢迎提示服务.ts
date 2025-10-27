/**
 * 欢迎提示服务
 * 在第一次打开新聊天时显示欢迎信息
 */

const WELCOME_SHOWN_KEY = 'welcome_shown';

/**
 * 检查并显示欢迎弹窗（如果需要）
 * @returns 是否需要显示欢迎弹窗
 */
export function checkAndShowWelcome(): boolean {
  try {
    // 检查聊天变量，判断是否已经显示过欢迎信息
    const chatVars = getVariables({ type: 'chat' });

    // 如果已经显示过，则不显示
    if (chatVars[WELCOME_SHOWN_KEY] === true) {
      console.log('📋 欢迎信息已显示过');
      return false;
    }

    // 需要显示欢迎信息
    console.log('🆕 首次使用，需要显示欢迎信息');
    return true;
  } catch (error) {
    console.error('检查欢迎信息失败:', error);
    return false;
  }
}

/**
 * 标记欢迎信息已显示
 */
export function markWelcomeAsShown(): void {
  try {
    const chatVars = getVariables({ type: 'chat' });
    chatVars[WELCOME_SHOWN_KEY] = true;
    replaceVariables(chatVars, { type: 'chat' });
    console.log('✅ 欢迎信息已标记为已显示');
  } catch (error) {
    console.error('标记欢迎信息失败:', error);
  }
}

/**
 * 重置欢迎信息（用于测试或特殊需求）
 */
export function resetWelcome(): void {
  try {
    const chatVars = getVariables({ type: 'chat' });
    delete chatVars[WELCOME_SHOWN_KEY];
    replaceVariables(chatVars, { type: 'chat' });
    console.log('🔄 欢迎信息已重置');
  } catch (error) {
    console.error('重置欢迎信息失败:', error);
  }
}

/**
 * 检查是否已经显示过欢迎信息
 */
export function hasWelcomeBeenShown(): boolean {
  try {
    const chatVars = getVariables({ type: 'chat' });
    return chatVars[WELCOME_SHOWN_KEY] === true;
  } catch (error) {
    console.error('检查欢迎信息状态失败:', error);
    return false;
  }
}
