<template>
  <div v-if="errorState.show" class="error-overlay">
    <div class="error-modal" @click.stop>
      <div class="modal-header">
        <div class="header-content">
          <div class="error-icon">⚠️</div>
          <h3>{{ errorState.title }}</h3>
        </div>
      </div>

      <div class="modal-content">
        <div class="error-message">{{ errorState.message }}</div>
        <div v-if="errorState.summary" class="error-summary">{{ errorState.summary }}</div>
        <div v-if="errorState.details" class="error-details">{{ errorState.details }}</div>

        <!-- AI原始输出编辑区 -->
        <div v-if="errorState.rawText" class="raw-text-editor">
          <div class="editor-header">
            <h4>AI原始输出（可编辑调试）</h4>
            <div class="editor-actions">
              <button class="reset-button" title="重置为原始内容" @click="editedText = errorState.rawText || ''">
                🔄 重置
              </button>
              <button class="ai-fix-button" title="使用AI修复格式错误" :disabled="isAIFixing" @click="handleAIFix">
                {{ isAIFixing ? '⏳ AI修复中...' : '🤖 AI修复' }}
              </button>
            </div>
          </div>
          <textarea v-model="editedText" class="editor-textarea" placeholder="AI输出的原始文本..."></textarea>
        </div>
      </div>

      <div class="modal-actions">
        <button
          v-if="errorState.onRetry && errorState.rawText"
          class="retry-button"
          :disabled="isRetrying"
          @click="handleRetry"
        >
          {{ isRetrying ? '⏳ 重新解析中...' : '🔄 重新解析' }}
        </button>
        <button class="abandon-button" @click="handleClose">放弃本次生成</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { HeroDeterminationService } from '../../功能模块层/人物管理/服务/人物生成服务';
import { toast } from '../../核心层/服务/通用服务/弹窗提示服务';
import { errorState, GenerationErrorService } from '../../核心层/服务/通用服务/生成错误服务';

const editedText = ref('');
const isRetrying = ref(false);
const isAIFixing = ref(false);

// 监听错误状态，当显示新错误时重置编辑文本
watch(
  () => errorState.value.show,
  newShow => {
    if (newShow && errorState.value.rawText) {
      editedText.value = errorState.value.rawText;
    }
  },
  { immediate: true },
);

const handleClose = () => {
  GenerationErrorService.handleClose();
  editedText.value = '';
};

const handleRetry = async () => {
  if (!errorState.value.onRetry) {
    toast.warning('未提供重新解析回调函数', { title: '错误' });
    console.error('❌ [生成错误] onRetry 回调函数不存在');
    return;
  }

  if (!editedText.value.trim()) {
    toast.warning('请输入要解析的内容', { title: '输入错误' });
    console.error('❌ [生成错误] 编辑文本为空');
    return;
  }

  isRetrying.value = true;

  // 保存当前错误弹窗的内容，用于检测是否有新的错误弹窗被打开
  const previousRawText = errorState.value.rawText;
  const previousTitle = errorState.value.title;
  const previousShow = errorState.value.show;
  const previousMessage = errorState.value.message;
  const previousSummary = errorState.value.summary;

  console.log('🔄 [生成错误] 开始重新解析...');
  console.log('📝 [生成错误] 编辑后的文本长度:', editedText.value.length);
  console.log('📝 [生成错误] 原始文本长度:', previousRawText?.length || 0);
  console.log('📝 [生成错误] 文本是否修改:', editedText.value !== previousRawText);

  try {
    // 调用重新解析回调函数
    await errorState.value.onRetry(editedText.value);

    console.log('✅ [生成错误] 重新解析回调执行完成');

    // 等待一小段时间，确保错误弹窗状态已更新（如果有新的错误弹窗被打开）
    await new Promise(resolve => setTimeout(resolve, 200));

    // 检查错误弹窗是否仍然显示（如果显示，说明可能有新的错误）
    const stillShowing = errorState.value.show;
    const errorDialogContentChanged =
      errorState.value.rawText !== previousRawText ||
      errorState.value.title !== previousTitle ||
      errorState.value.message !== previousMessage ||
      errorState.value.summary !== previousSummary;

    console.log('🔍 [生成错误] 重新解析后状态检查:', {
      stillShowing,
      errorDialogContentChanged,
      previousShow,
      currentRawText: errorState.value.rawText?.substring(0, 50) + '...',
      previousRawText: previousRawText?.substring(0, 50) + '...',
      currentTitle: errorState.value.title,
      previousTitle: previousTitle,
      currentMessage: errorState.value.message?.substring(0, 50) + '...',
      previousMessage: previousMessage?.substring(0, 50) + '...',
    });

    if (stillShowing) {
      // 错误弹窗仍然显示，说明解析失败或出现了新错误
      if (errorDialogContentChanged) {
        // 错误弹窗内容已更新，说明新的错误信息已经通过错误弹窗显示了
        console.log('⚠️ [生成错误] 重新解析后出现新错误，更新编辑文本');
        if (errorState.value.rawText) {
          editedText.value = errorState.value.rawText;
        }
        // 不显示成功提示，因为出现了新错误
        // 注意：isRetrying 会在 finally 块中被重置
      } else {
        // 错误弹窗仍然显示但内容未变化
        // 这可能是因为：
        // 1. 解析失败，但错误信息相同（用户没有修改文本，所以错误一样）
        // 2. 解析成功，但错误弹窗没有关闭（不应该发生）
        // 为了安全起见，我们不应该关闭弹窗，应该提示用户解析失败
        console.warn('⚠️ [生成错误] 重新解析后错误弹窗仍然显示且内容未变化，可能是解析失败');
        console.warn('⚠️ [生成错误] 如果用户没有修改文本，解析失败时错误信息可能相同');
        // 不关闭弹窗，让用户知道解析失败
        // 不显示成功提示
      }
    } else {
      // 错误弹窗已关闭，说明重新解析成功
      console.log('✅ [生成错误] 重新解析成功，错误弹窗已关闭');
      // 确保清理状态
      if (errorState.value.show) {
        handleClose();
      }
      toast.success('重新解析成功', { title: '解析成功' });
    }
  } catch (error) {
    console.error('❌ [生成错误] 重新解析失败:', error);
    console.error('❌ [生成错误] 错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 等待一小段时间，确保错误弹窗状态已更新（如果有新的错误弹窗被打开）
    await new Promise(resolve => setTimeout(resolve, 100));

    // 检查错误弹窗的内容是否发生了变化
    const errorDialogContentChanged =
      errorState.value.rawText !== previousRawText || errorState.value.title !== previousTitle;

    console.log('🔍 [生成错误] 重新解析失败后状态检查:', {
      errorDialogContentChanged,
      stillShowing: errorState.value.show,
      currentRawText: errorState.value.rawText?.substring(0, 50) + '...',
      previousRawText: previousRawText?.substring(0, 50) + '...',
    });

    if (errorDialogContentChanged && errorState.value.show) {
      // 错误弹窗内容已更新，说明新的错误信息已经通过错误弹窗显示了
      // 不显示提示，避免重复提示
      // 同时更新编辑文本为新的原始文本
      console.log('⚠️ [生成错误] 重新解析失败，出现新错误，更新编辑文本');
      if (errorState.value.rawText) {
        editedText.value = errorState.value.rawText;
      }
    } else {
      // 其他类型的错误（如构建失败等），显示提示
      console.error('❌ [生成错误] 重新解析失败，显示错误提示');
      toast.error('重新解析失败，请检查错误信息', { title: '解析失败' });
    }
    // 不关闭弹窗，让用户继续编辑
  } finally {
    // 确保总是重置加载状态，无论成功还是失败
    isRetrying.value = false;
    console.log('🔄 [生成错误] 重新解析流程结束，isRetrying 已重置为 false');
  }
};

/**
 * 使用AI修复格式错误
 */
const handleAIFix = async () => {
  if (!editedText.value.trim()) {
    toast.warning('请输入要修复的内容', { title: '输入错误' });
    return;
  }

  if (isAIFixing.value) {
    return;
  }

  isAIFixing.value = true;

  try {
    console.log('🤖 [AI修复] 开始AI修复...');
    console.log('📝 [AI修复] 当前文本长度:', editedText.value.length);

    // 判断错误类型和格式
    const isCharacterError = errorState.value.title.includes('人物');
    const isLocationError = errorState.value.title.includes('据点');
    const isYamlFormat = editedText.value.trim().startsWith('基础信息:') || editedText.value.includes('基础信息:');
    const isJsonFormat = editedText.value.includes('"基础信息"') || editedText.value.includes('"name"');

    console.log('🔍 [AI修复] 错误类型判断:', {
      isCharacterError,
      isLocationError,
      isYamlFormat,
      isJsonFormat,
    });

    // 构建AI修复提示词
    let fixPrompt = '';

    if (isCharacterError) {
      // 人物生成错误修复
      const format = isYamlFormat ? 'yaml' : 'json';
      const formatTemplate = HeroDeterminationService.getCharacterFormatTemplate(format);

      fixPrompt = `# 任务：修复人物信息格式错误

当前AI输出存在格式错误，请根据以下格式要求修复错误：

${formatTemplate}

# 当前错误的AI输出：
\`\`\`${format}
${editedText.value}
\`\`\`

# 参考错误信息：
${errorState.value.message}
${errorState.value.details ? `\n详细错误：\n${errorState.value.details}` : ''}

# 修复要求：
1. 严格按照上述格式要求修复所有格式错误
2. 保持原有的人物信息内容不变，只修复格式问题
3. 确保所有必填字段都存在且格式正确
4. 确保所有数据类型正确（数字字段必须是数字，字符串字段必须是字符串）
5. 确保JSON格式正确（括号匹配、逗号正确、引号正确）
6. 确保YAML格式正确（缩进正确、冒号正确）
7. 只输出修复后的${format.toUpperCase()}格式数据，不要添加任何其他说明文字
8. 如果原文本中有部分字段缺失，请根据格式要求补充合理的值

请直接输出修复后的${format.toUpperCase()}格式数据：`;
    } else if (isLocationError) {
      // 据点生成错误修复
      fixPrompt = `# 任务：修复据点信息格式错误

当前AI输出存在格式错误，请根据以下格式要求修复错误：

# 据点JSON格式要求：
\`\`\`json
{
  "name": "据点名称，要符合当前大陆和区域的特色",
  "type": "据点类型（如village/town/city等）",
  "icon": "emoji图标",
  "description": "据点描述，要体现当前大陆和区域的特色",
  "difficulty": 数字（1-10的整数，星级难度）,
  "distance": 数字（距离公里数）,
  "continent": "大陆名称",
  "region": "区域名称",
  "race": "种族（人类/永恒精灵/黑暗精灵/狐族，只允许选择一个）",
  "baseGuards": 数字（据点守军总人数，根据据点难度和类型合理设定）,
  "rewards": {
    "gold": 数字（金币数量）,
    "food": 数字（食物数量）,
    "slaves": 数字（女性奴隶数量，请参考据点实际情况）
  },
  "specialUnit": {
    "name": "特殊单位名称（可选，非必须）",
    "race": "特殊单位种族",
    "unitType": "单位类型（必须是physical或magical）",
    "attributes": {
      "attack": 数字（10-50范围）,
      "defense": 数字（10-50范围）,
      "intelligence": 数字（10-50范围）,
      "speed": 数字（10-50范围）,
      "health": 数字（100-200范围）
    }
  }
}
\`\`\`

# 当前错误的AI输出：
\`\`\`json
${editedText.value}
\`\`\`

# 错误信息：
${errorState.value.message}
${errorState.value.details ? `\n详细错误：\n${errorState.value.details}` : ''}

# 修复要求：
1. 严格按照上述格式要求修复所有格式错误
2. 保持原有的据点信息内容不变，只修复格式问题
3. 确保所有必填字段都存在且格式正确
4. 确保所有数据类型正确（数字字段必须是数字，字符串字段必须是字符串）
5. 确保JSON格式正确（括号匹配、逗号正确、引号正确）
6. 如果原文本中有部分字段缺失，请根据格式要求补充合理的值
7. 只输出修复后的JSON格式数据，不要添加任何其他说明文字

请直接输出修复后的JSON格式数据：`;
    } else {
      // 通用格式错误修复
      fixPrompt = `# 任务：修复格式错误

当前AI输出存在格式错误，请修复以下错误：

# 当前错误的AI输出：
\`\`\`
${editedText.value}
\`\`\`

# 错误信息：
${errorState.value.message}
${errorState.value.details ? `\n详细错误：\n${errorState.value.details}` : ''}

# 修复要求：
1. 修复所有格式错误（JSON/YAML格式问题）
2. 确保所有数据类型正确
3. 确保括号、引号、逗号等符号正确
4. 保持原有内容不变，只修复格式问题
5. 只输出修复后的数据，不要添加任何其他说明文字

请直接输出修复后的数据：`;
    }

    console.log('📝 [AI修复] 构建的修复提示词长度:', fixPrompt.length);

    // 读取流式传输设置
    const globalVars = getVariables({ type: 'global' });
    const enableStreamOutput =
      typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : false;

    // 直接调用AI生成修复（不使用思维链）
    const fixedText = await window.TavernHelper.generate({
      user_input: fixPrompt,
      should_stream: enableStreamOutput,
    });

    if (!fixedText || !fixedText.trim()) {
      throw new Error('AI未返回有效修复结果');
    }

    console.log('✅ [AI修复] AI修复完成');
    console.log('📝 [AI修复] 修复后的文本长度:', fixedText.length);

    // 提取修复后的文本（如果是代码块格式，提取内容）
    let extractedText = fixedText.trim();

    // 尝试提取代码块内容
    const codeBlockMatch = extractedText.match(/```(?:json|yaml)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      extractedText = codeBlockMatch[1].trim();
    }

    // 更新编辑文本
    editedText.value = extractedText;

    toast.success('AI修复完成，已更新编辑文本', { title: '修复成功' });
    console.log('✅ [AI修复] 已更新编辑文本');
  } catch (error) {
    console.error('❌ [AI修复] AI修复失败:', error);
    toast.error(`AI修复失败: ${error instanceof Error ? error.message : '未知错误'}`, { title: '修复失败' });
  } finally {
    isAIFixing.value = false;
    console.log('🔄 [AI修复] AI修复流程结束');
  }
};
</script>

<style scoped lang="scss">
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10200; // 在总结确认弹窗之后，但在游戏设置面板（10000）之前

  .error-modal {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
    border: 2px solid rgba(220, 38, 38, 0.6);
    border-radius: 16px;
    width: 90%;
    max-width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    animation: modalSlideIn 0.3s ease-out;

    @media (max-width: 768px) {
      width: 95%;
      max-height: 90vh;
      border-radius: 12px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(220, 38, 38, 0.3);

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .error-icon {
          font-size: 24px;
          line-height: 1;
        }

        h3 {
          margin: 0;
          color: #ffd7a1;
          font-size: 20px;
          font-weight: 700;
        }
      }
    }

    .modal-content {
      padding: 24px;

      @media (max-width: 768px) {
        padding: 16px;
      }

      .error-message {
        color: #f0e6d2;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 12px;
      }

      .error-summary {
        color: #ffd7a1;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 12px;
        padding: 12px;
        background: rgba(220, 38, 38, 0.1);
        border-radius: 8px;
        border-left: 3px solid rgba(220, 38, 38, 0.6);
      }

      .error-details {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.4;
        background: rgba(0, 0, 0, 0.2);
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid rgba(220, 38, 38, 0.5);
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      }

      .raw-text-editor {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(220, 38, 38, 0.2);

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h4 {
            margin: 0;
            color: #ffd7a1;
            font-size: 16px;
            font-weight: 600;
          }

          .editor-actions {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .reset-button {
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 12px;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #93c5fd;

            &:hover {
              background: rgba(59, 130, 246, 0.3);
              border-color: rgba(59, 130, 246, 0.6);
            }

            &:active {
              transform: scale(0.95);
            }
          }

          .ai-fix-button {
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 12px;
            background: rgba(139, 92, 246, 0.2);
            border: 1px solid rgba(139, 92, 246, 0.4);
            color: #c4b5fd;

            &:hover:not(:disabled) {
              background: rgba(139, 92, 246, 0.3);
              border-color: rgba(139, 92, 246, 0.6);
            }

            &:active:not(:disabled) {
              transform: scale(0.95);
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }
        }

        .editor-textarea {
          width: 100%;
          min-height: 200px;
          max-height: 400px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(220, 38, 38, 0.4);
          color: #f0e6d2;
          font-size: 13px;
          line-height: 1.5;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease;

          &:focus {
            border-color: rgba(220, 38, 38, 0.7);
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
          }

          &::placeholder {
            color: #6b7280;
          }
        }
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding: 16px 24px;
      border-top: 1px solid rgba(220, 38, 38, 0.2);

      @media (max-width: 768px) {
        padding: 12px 16px;
        gap: 8px;
      }

      .retry-button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        background: linear-gradient(180deg, #3b82f6, #2563eb);
        border: 1px solid rgba(59, 130, 246, 0.6);
        color: #ffffff;

        @media (max-width: 768px) {
          padding: 8px 16px;
          font-size: 12px;
        }

        &:hover:not(:disabled) {
          background: linear-gradient(180deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .abandon-button {
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 14px;
        background: linear-gradient(180deg, #dc2626, #b91c1c);
        border: 1px solid rgba(220, 38, 38, 0.6);
        color: #ffffff;

        @media (max-width: 768px) {
          padding: 8px 16px;
          font-size: 12px;
        }

        &:hover {
          background: linear-gradient(180deg, #b91c1c, #991b1b);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
      }
    }
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
