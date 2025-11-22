<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content avatar-edit-modal" @click.stop>
      <div class="modal-header">
        <div class="header-left"></div>
        <h4 class="avatar-edit-title">编辑头像 - {{ character?.name }}</h4>
        <div class="header-right">
          <button class="close-btn" @click="close">×</button>
        </div>
      </div>
      <div v-if="character" class="modal-body">
        <div class="avatar-options">
          <!-- 头像字段选择 -->
          <div class="option-group">
            <label>应用到哪个头像:</label>
            <select v-model="selectedAvatarField" class="avatar-field-select">
              <option value="avatar">正常状态头像</option>
              <option value="corruptedAvatar">半堕落头像</option>
              <option value="fullyCorruptedAvatar">完全堕落头像</option>
            </select>
          </div>

          <!-- 文生图生成 -->
          <div class="option-group">
            <label>🎨 AI文生图生成:</label>
            <div class="prompt-generation-group">
              <button
                class="action-btn secondary generate-prompt-btn"
                :disabled="!character || isGeneratingPrompt"
                @click="generatePromptWithAI"
              >
                {{ isGeneratingPrompt ? '生成中...' : '🤖 AI生成提示词' }}
              </button>
            </div>
            <div class="generate-image-group">
              <textarea
                v-model="imagePrompt"
                class="prompt-textarea"
                placeholder="点击上方按钮让AI生成提示词，或手动输入提示词..."
                rows="3"
              ></textarea>
              <button
                class="action-btn primary generate-btn"
                :disabled="!imagePrompt.trim() || isGeneratingImage"
                @click="generateImageForAvatar"
              >
                {{ isGeneratingImage ? '生成中...' : '生成图片' }}
              </button>
            </div>
            <div v-if="generatedImagePreview" class="generated-image-preview">
              <img :src="generatedImagePreview" alt="生成的图片预览" />
              <button class="action-btn primary apply-btn" @click="applyGeneratedImage">应用此图片</button>
            </div>
          </div>

          <div class="option-divider">或</div>

          <div class="option-group">
            <label>网络图片URL:</label>
            <div class="url-input-group">
              <input v-model="avatarUrl" type="url" placeholder="输入图片链接..." class="url-input" />
              <button class="action-btn primary url-set-btn" @click="setAvatarFromUrl">设置</button>
            </div>
          </div>
          <div class="option-group">
            <label>本地图片:</label>
            <input type="file" accept="image/*" class="file-input" @change="handleFileUpload" />
          </div>
          <div class="option-group">
            <label>随机头像:</label>
            <button
              class="action-btn primary random-avatar-btn"
              :disabled="!character?.race"
              @click="setRandomAvatarByRace"
            >
              🎲 随机选择同种族头像
            </button>
            <div v-if="!character?.race" class="random-avatar-hint">提示：需要先选择人物种族</div>
            <button
              class="action-btn reset-avatar-btn"
              :disabled="!character || (!character.originalAvatar && selectedAvatarField === 'avatar')"
              @click="resetAvatarToOriginal"
            >
              🔄 恢复初始头像
            </button>
            <div
              v-if="!character || (!character.originalAvatar && selectedAvatarField === 'avatar')"
              class="reset-avatar-hint"
            >
              无法恢复：角色还没有保存初始头像值（首次打开时会自动保存）
            </div>
            <div v-else class="reset-avatar-hint">恢复到人物初始头像</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 弹窗提示组件 -->
  <ToastNotification ref="toastRef" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { generateImage } from '../../共享资源层/文生图/文生图服务';
import ToastNotification from '../../共享资源层/组件/弹窗提示.vue';
import type { Character } from '../../功能模块层/人物管理/类型/人物类型';
import { pictureResourceMappingService } from '../../功能模块层/探索/服务/图片资源映射服务';
import { generateWithChainOfThought } from '../../核心层/服务/世界书管理/工具/AI生成助手';
import { ChainOfThoughtMode } from '../../核心层/服务/世界书管理/工具/思维链管理器';
import { WorldbookService } from '../../核心层/服务/世界书管理/服务/世界书服务';

// 定义组件属性
interface Props {
  show: boolean;
  character: Character | null;
}

// 定义组件事件
interface Emits {
  (e: 'close'): void;
  (e: 'character-updated', character: Character): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 内部状态
const selectedAvatarField = ref<'avatar' | 'corruptedAvatar' | 'fullyCorruptedAvatar'>('avatar');
const avatarUrl = ref('');
const imagePrompt = ref('');
const isGeneratingImage = ref(false);
const isGeneratingPrompt = ref(false);
const generatedImagePreview = ref<string>('');
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null);

// 监听头像字段选择变化，自动更新URL显示
watch(selectedAvatarField, () => {
  updateAvatarUrlByField();
});

// 监听 character 变化，初始化数据
watch(
  () => props.character,
  newCharacter => {
    if (newCharacter) {
      selectedAvatarField.value = 'avatar';
      updateAvatarUrlByField();
      // 初始化文生图相关变量
      imagePrompt.value = '';
      isGeneratingImage.value = false;
      isGeneratingPrompt.value = false;
      generatedImagePreview.value = '';
      // 保存原始头像值（首次打开时）
      saveOriginalAvatars(newCharacter);
    }
  },
  { immediate: true },
);

// 根据选择字段更新URL显示
const updateAvatarUrlByField = () => {
  if (!props.character) return;

  const field = selectedAvatarField.value;
  const currentValue = (props.character as any)[field] as string | undefined;
  avatarUrl.value = currentValue || '';
};

// 保存原始头像值（首次打开时）
const saveOriginalAvatars = async (character: Character) => {
  let needsSave = false;
  if (!character.originalAvatar && character.avatar) {
    character.originalAvatar = character.avatar;
    needsSave = true;
  }
  if (!character.originalCorruptedAvatar && character.corruptedAvatar) {
    character.originalCorruptedAvatar = character.corruptedAvatar;
    needsSave = true;
  }
  if (!character.originalFullyCorruptedAvatar && character.fullyCorruptedAvatar) {
    character.originalFullyCorruptedAvatar = character.fullyCorruptedAvatar;
    needsSave = true;
  }

  // 如果保存了原始值，更新数据库和世界书
  if (needsSave) {
    // 更新世界书
    await WorldbookService.updateCharacterEntry(character);
    // 通知父组件保存数据
    emit('character-updated', character);
    console.log('📸 [头像编辑] 已保存当前头像为原始值（首次打开）');
  }
};

// 关闭弹窗
const close = () => {
  emit('close');
};

// 构建基于人物信息的提示词（用于AI生成提示词）
const buildCharacterInfo = (character: Character): string => {
  let info = '';

  info += `种族：${character.race}\n`;
  if (character.title) {
    info += `身份：${character.title}\n`;
  }

  // 外观信息
  if (character.appearance) {
    const appearance = character.appearance;
    if (appearance.description) {
      info += `外貌描述：${appearance.description}\n`;
    }
    if (appearance.height) {
      info += `身高：${appearance.height}cm\n`;
    }
    if (appearance.measurements) {
      info += `三围：${appearance.measurements}\n`;
    }
    if (appearance.cupSize) {
      info += `罩杯：${appearance.cupSize}\n`;
    }
  }

  // 性格特征
  if (character.personality && character.personality.length > 0) {
    info += `性格：${character.personality.join('、')}\n`;
  }

  // 衣着信息
  if (character.appearance?.clothing) {
    const clothing = character.appearance.clothing;
    const clothingItems: string[] = [];
    if (clothing.head) clothingItems.push(`头部：${clothing.head}`);
    if (clothing.top) clothingItems.push(`上装：${clothing.top}`);
    if (clothing.bottom) clothingItems.push(`下装：${clothing.bottom}`);
    if (clothing.socks) clothingItems.push(`袜子：${clothing.socks}`);
    if (clothing.shoes) clothingItems.push(`鞋子：${clothing.shoes}`);
    if (clothing.underwear) clothingItems.push(`内衣：${clothing.underwear}`);
    if (clothing.accessories) clothingItems.push(`装饰：${clothing.accessories}`);
    if (clothing.toys) clothingItems.push(`玩具：${clothing.toys}`);
    if (clothingItems.length > 0) {
      info += `衣着：${clothingItems.join('、')}\n`;
    }
  }

  return info.trim();
};

// AI生成提示词
const generatePromptWithAI = async () => {
  if (!props.character) {
    toastRef.value?.warning('无法获取人物信息', { title: '提示', duration: 3000 });
    return;
  }

  try {
    isGeneratingPrompt.value = true;
    toastRef.value?.info('正在生成提示词，请稍候...', { title: 'AI生成', duration: 5000 });

    // 构建基于人物信息的中文描述
    const characterInfo = buildCharacterInfo(props.character);

    // 构建AI生成提示词的请求
    const prompt = `请根据以下人物信息，生成人物肖像tags。要求请参考<tags_generation_guidance>：
<tags_generation_guidance>
# 1. Base Rules:
  extract_tags:
    - Extract drawing tags from plot and output in content
    - Tags must be in English, accurate and concise
    - Follow tag "Rule 4. ordering rules" strictly
    - Prioritize "Rule 8. fixed character tags" when applicable
    - DO NOT output any males tags unless it is a NSFW scene
  round_review:
    - Compare current tags with previous round
    - Check if character appearance tags or loras need updates based on plot changes

# 2. Format Requirements:
  tag_count:
    minimum: 70
  lora_usage:
    - ONLY use loras that are explicitly defined in "lora/default tag library" section
    - DO NOT create or assume new lora names
    - Must use exact lora from library
    - Invalid loras will be ignored and removed from output
  tag_quality:
    - Remove duplicates and contradictory tags
    - Exclude negative tags
    - Limit male character appearance tags
    - Prioritize female characters in composition
    - Use safe terms like "thicc" or "curvy" for body descriptions
  formatting:
    - Place loras immediately after related tags
    - Separate all tags with commas (no line breaks)
    - Wrap char1 tags (from character to temporary) in parentheses
    - Add "BREAK" after char1 section
    - Wrap char2/user tags in parentheses
    - For interaction tags use source# (active) and target# (passive)
    - Default to "girl+boy" when gender unspecified
    - Use complete fixed character tags with suffixes
    - Avoid unnecessary quality words and obscure terms
    - Limit POV image to once per round
    - No duplicate camera tags in same round
    - Replace male character names with "{{faceless man,light skin,grey suit}}"
    - Duplicate tags for multiple characters (except loras)

# 3. Image format: <image>tags</image>

# 4. Tag Order Rules:
  analysis (important):
    - Follow attention requirements
    - Identify scene subject
    - Select most appropriate tags
    - Apply weight system

  sequence:
    - [1_count]: number of boys/girls/animals
    - [2_character]: core identity from fixed characters
    - [3_features]: hair color/style > eyes > age > body type > chest
    - [4_clothing]: outfit style > top > bottom > underwear > accessories > colors/materials > exposure
    - [5_expression]: facial expression > emotion > voice
    - [6_action]: basic pose > behavior > body movements
    - [7_interaction]: interaction object > method > body part > gender positions
    - [8_temporary]: liquids > gases > items > tools > physiological reactions
    - [9_secondary_character]: same structure as char1 but simplified (<10 tags), DO NOT USE MALE UNLESS SEX SENCE
    - [10_lora]: appropriate loras from library
    - [11_template]: fusion templates if applicable
    - [12_camera]: fullbody ＞ perspective > camera angle > close-up > composition
    - [13_background]: style > scene location > weather/time/atmosphere
    - [14_adjustments]: replace conflicts & add missing key tags

# 5. Conditional Additions:
  composition_guidelines:
    - Analyze current perspective
    - Consider manga/photography/illustration framing principles
    - Determine first vs third person perspective
    - Select optimal camera angle
    - Add camera effects if needed
    - Use appropriate tags when perspective not specified
  nsfw_details:
    physical_deformation:
      - Consider object/body part contact deformations
      - Account for soft object compression, bouncing, gravity effects
    fluid_effects:
      - Consider fluid flow dynamics
      - Account for fluid transfer between surfaces
      - Use "cum on body" or "cum on/in [body part]" format
      - Add appropriate tags based on physical properties

# 6. Lora/Default Tag Library:
  lora: NO LORA NOW
  format: "<lora:name.safetensors:weight:weight>, tag, {tag}, ..."
  priority_levels:
    S: feature/clothing class
    A: action/interaction/camera class
    B: temporary/expression/background class
    C: fusion templates and regular tags
  conflict_resolution:
    - New loras prioritized over existing ones
    - Main feature loras over secondary feature loras
    - Unique effect loras over general effect loras
    - Default library tags replace similar fusion template tags
  conflict_handling:
    - Mutually exclusive: higher priority replaces lower
    - Partial conflict: keep main features, remove secondary
    - Quantity limit: remove from lowest priority up
    - Tag conflict: follow higher priority lora tags
    - Compensation: add compensatory tags when removing lower priority loras

# 7. Weight System:
  max_weighted_tags: 6
  distribution:
    high(1.3):
      limit: 1
      priorities: [count, hairstyle, eye color, main features]
    medium(1.2):
      limit: 1
      priorities: [expression, clothing state, body focus]
    light(1.1):
      limit: 2
      priorities: [action, interaction, scene focus, user focus]
    base(no weight):
      limit: 2
      priorities: [atmosphere, secondary effects]
  application_rules:
    character_class: never weight character names or base tags
    focus_control: weight based on visual impact
    angle_requirement: must include camera angle tag
    overflow: convert excess weighted tags to unweighted

# 8. Fixed Character Tags:
  character_priority:
    - Character-specific tags and loras MUST be output first in tag sequence
    - Use complete predefined character tag sets when available
    - Never modify or substitute character-specific tags
    - If character has associated lora, it must be included
    - Character tags take precedence over general scene tags
	- DO NOT output character name
</tags_generation_guidance>

人物信息：
${characterInfo}

请生成人物当前的肖像tags，只需输出一条，禁止以人物名称作为tags：`;

    // 读取流式传输设置
    const globalVars = window.TavernHelper.getVariables({ type: 'global' });
    const enableStreamOutput =
      typeof globalVars['enable_stream_output'] === 'boolean' ? globalVars['enable_stream_output'] : false;

    // 使用带思维链的AI生成（使用人物调教模式）
    const aiResponse = await generateWithChainOfThought(ChainOfThoughtMode.CHARACTER_TRAINING, {
      user_input: prompt,
      should_stream: enableStreamOutput,
    });

    if (!aiResponse || !aiResponse.trim()) {
      throw new Error('AI未返回有效响应');
    }

    // 清理AI回复，提取提示词
    let generatedPrompt = aiResponse.trim();

    // 优先提取 <image>...</image> 标签内的内容
    const imageTagMatch = generatedPrompt.match(/<image>(.*?)<\/image>/is);
    if (imageTagMatch && imageTagMatch[1]) {
      // 如果找到image标签，提取标签内的内容
      generatedPrompt = imageTagMatch[1].trim();
    }

    // 设置生成的提示词
    imagePrompt.value = generatedPrompt;

    toastRef.value?.success('提示词生成成功！', {
      title: '生成成功',
      duration: 1000,
    });
  } catch (error) {
    console.error('生成提示词失败:', error);
    toastRef.value?.error(error instanceof Error ? error.message : '生成提示词失败，请检查AI接口是否正常工作', {
      title: '生成失败',
      duration: 2000,
    });
  } finally {
    isGeneratingPrompt.value = false;
  }
};

// 生成图片（文生图）
const generateImageForAvatar = async () => {
  if (!imagePrompt.value.trim()) {
    toastRef.value?.warning('请输入提示词或点击"AI生成提示词"按钮', { title: '提示', duration: 1000 });
    return;
  }

  try {
    isGeneratingImage.value = true;
    generatedImagePreview.value = '';

    const prompt = imagePrompt.value.trim();
    toastRef.value?.info('正在生成图片，请稍候...', { title: '文生图', duration: 5000 });

    // 人物头像使用固定尺寸：728x1456（宽x高）
    const imageData = await generateImage(prompt, 728, 1456);

    generatedImagePreview.value = imageData;
    toastRef.value?.success('图片生成成功！请预览后点击"应用此图片"按钮应用', {
      title: '生成成功',
      duration: 5000,
    });
  } catch (error) {
    console.error('生成图片失败:', error);
    toastRef.value?.error(error instanceof Error ? error.message : '生成图片失败，请检查文生图接口是否正常工作', {
      title: '生成失败',
      duration: 5000,
    });
  } finally {
    isGeneratingImage.value = false;
  }
};

// 应用生成的图片
const applyGeneratedImage = () => {
  if (!props.character || !generatedImagePreview.value) {
    toastRef.value?.warning('没有可应用的图片', { title: '提示', duration: 3000 });
    return;
  }

  const field = selectedAvatarField.value;
  const updatedCharacter = { ...props.character };

  // 应用图片到选择的字段
  (updatedCharacter as any)[field] = generatedImagePreview.value;

  // 更新世界书
  WorldbookService.updateCharacterEntry(updatedCharacter);

  // 通知父组件更新人物数据
  emit('character-updated', updatedCharacter);

  const fieldName = field === 'avatar' ? '正常状态头像' : field === 'corruptedAvatar' ? '半堕落头像' : '完全堕落头像';
  toastRef.value?.success(`已将生成的图片应用到${fieldName}`, {
    title: '应用成功',
    duration: 3000,
  });

  // 关闭弹窗
  close();
};

// 从URL设置头像
const setAvatarFromUrl = () => {
  if (props.character && avatarUrl.value) {
    const field = selectedAvatarField.value;
    const updatedCharacter = { ...props.character };

    (updatedCharacter as any)[field] = avatarUrl.value;

    // 更新世界书
    WorldbookService.updateCharacterEntry(updatedCharacter);

    // 通知父组件更新人物数据
    emit('character-updated', updatedCharacter);

    close();
  }
};

// 处理文件上传
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && props.character) {
    const reader = new FileReader();
    reader.onload = e => {
      if (props.character && e.target?.result) {
        const field = selectedAvatarField.value;
        const updatedCharacter = { ...props.character };

        (updatedCharacter as any)[field] = e.target.result as string;

        // 更新世界书
        WorldbookService.updateCharacterEntry(updatedCharacter);

        // 通知父组件更新人物数据
        emit('character-updated', updatedCharacter);

        close();
      }
    };
    reader.readAsDataURL(file);
  }
};

// 根据种族随机选择头像
const setRandomAvatarByRace = () => {
  if (!props.character || !props.character.race) {
    toastRef.value?.warning('无法获取人物种族信息', { title: '提示', duration: 3000 });
    return;
  }

  const race = props.character.race;
  const randomAvatarUrl = pictureResourceMappingService.getRandomAvatarByRace(race);

  if (!randomAvatarUrl) {
    toastRef.value?.warning(`未找到种族 "${race}" 的头像资源，请使用其他方式设置头像`, {
      title: '未找到头像',
      duration: 4000,
    });
    return;
  }

  // 应用头像到选择的字段
  const field = selectedAvatarField.value;
  const updatedCharacter = { ...props.character };

  (updatedCharacter as any)[field] = randomAvatarUrl;

  // 更新世界书
  WorldbookService.updateCharacterEntry(updatedCharacter);

  // 通知父组件更新人物数据
  emit('character-updated', updatedCharacter);

  toastRef.value?.success(`已为 ${props.character.name} 随机选择了一个 ${race} 种族的头像`, {
    title: '头像设置成功',
    duration: 3000,
  });

  // 关闭弹窗
  close();
};

// 恢复初始头像（从持久化的原始值恢复）
const resetAvatarToOriginal = () => {
  if (!props.character) {
    toastRef.value?.warning('无法获取人物信息', { title: '提示', duration: 3000 });
    return;
  }

  const field = selectedAvatarField.value;

  // 从持久化的原始头像字段读取初始值
  const originalFieldMap: Record<string, keyof Character> = {
    avatar: 'originalAvatar',
    corruptedAvatar: 'originalCorruptedAvatar',
    fullyCorruptedAvatar: 'originalFullyCorruptedAvatar',
  };
  const originalField = originalFieldMap[field];
  const originalValue = props.character[originalField] as string | undefined;

  if (originalValue === undefined && field === 'avatar') {
    toastRef.value?.warning('该角色还没有保存原始头像值，请在首次打开头像编辑界面时保存', {
      title: '无法恢复',
      duration: 4000,
    });
    return;
  }

  // 恢复当前选择的头像字段为原始值
  const updatedCharacter = { ...props.character };
  (updatedCharacter as any)[field] = originalValue;

  // 更新世界书
  WorldbookService.updateCharacterEntry(updatedCharacter);

  // 通知父组件更新人物数据
  emit('character-updated', updatedCharacter);

  const fieldName = field === 'avatar' ? '正常状态头像' : field === 'corruptedAvatar' ? '半堕落头像' : '完全堕落头像';
  const actionText = originalValue ? '已恢复' : '已清空';
  toastRef.value?.success(`${actionText} ${fieldName}，恢复到人物初始头像`, {
    title: '恢复成功',
    duration: 3000,
  });
};
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.95), rgba(60, 40, 30, 0.95));
  border: 2px solid rgba(205, 133, 63, 0.4);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(205, 133, 63, 0.6), rgba(139, 90, 43, 0.5));
    border-radius: 5px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(205, 133, 63, 0.8), rgba(139, 90, 43, 0.7));
    }

    &:active {
      background: linear-gradient(135deg, rgba(255, 180, 100, 0.9), rgba(205, 133, 63, 0.8));
    }
  }

  // Firefox 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 133, 63, 0.6) rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.3);
  background: rgba(20, 13, 10, 0.5);

  .header-left {
    flex: 1;
  }

  .avatar-edit-title {
    flex: 2;
    color: #f0e6d2;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
    margin: 0;
  }

  .header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .close-btn {
    background: rgba(220, 38, 38, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.4);
    color: #fca5a5;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: rgba(220, 38, 38, 0.3);
      border-color: rgba(220, 38, 38, 0.6);
    }
  }
}

.modal-body {
  padding: 20px;
}

.avatar-options {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .option-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      color: #f0e6d2;
      font-weight: 600;
      font-size: 14px;
    }

    .url-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .url-input {
      background: rgba(40, 26, 20, 0.7);
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffe9d2;
      font-size: 14px;
      width: 100%;

      &:focus {
        outline: none;
        border-color: rgba(255, 120, 60, 0.5);
      }
    }

    .url-set-btn {
      width: 100%;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
    }

    .file-input {
      background: rgba(40, 26, 20, 0.7);
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffe9d2;
      font-size: 14px;
    }

    .random-avatar-btn {
      width: 100%;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .random-avatar-hint {
      margin-top: 8px;
      color: rgba(205, 133, 63, 0.7);
      font-size: 12px;
      font-style: italic;
    }

    .reset-avatar-btn {
      width: 100%;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
      background: rgba(107, 114, 128, 0.2);
      color: #d1d5db;
      border-color: rgba(107, 114, 128, 0.4);

      &:hover:not(:disabled) {
        background: rgba(107, 114, 128, 0.3);
        border-color: rgba(107, 114, 128, 0.6);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .reset-avatar-hint {
      margin-top: 4px;
      color: rgba(205, 133, 63, 0.6);
      font-size: 11px;
      font-style: italic;
    }

    .avatar-field-select {
      background: rgba(40, 26, 20, 0.7);
      border: 1px solid rgba(205, 133, 63, 0.25);
      border-radius: 8px;
      padding: 8px 12px;
      color: #ffe9d2;
      font-size: 14px;
      width: 100%;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: rgba(255, 120, 60, 0.5);
      }
    }

    .prompt-generation-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;

      .generate-prompt-btn {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .generate-image-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .prompt-textarea {
        background: rgba(40, 26, 20, 0.7);
        border: 1px solid rgba(205, 133, 63, 0.25);
        border-radius: 8px;
        padding: 8px 12px;
        color: #ffe9d2;
        font-size: 14px;
        width: 100%;
        resize: vertical;
        min-height: 80px;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: rgba(255, 120, 60, 0.5);
        }

        &::placeholder {
          color: rgba(255, 233, 210, 0.5);
        }
      }

      .generate-btn {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .generated-image-preview {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
      padding: 12px;
      background: rgba(40, 26, 20, 0.5);
      border: 1px solid rgba(205, 133, 63, 0.3);
      border-radius: 8px;

      img {
        width: 100%;
        max-width: 300px;
        height: auto;
        border-radius: 8px;
        border: 1px solid rgba(205, 133, 63, 0.3);
        margin: 0 auto;
      }

      .apply-btn {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
      }
    }

    .option-divider {
      text-align: center;
      color: rgba(205, 133, 63, 0.6);
      font-size: 12px;
      font-weight: 600;
      margin: 8px 0;
      position: relative;

      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 40%;
        height: 1px;
        background: rgba(205, 133, 63, 0.3);
      }

      &::before {
        left: 0;
      }

      &::after {
        right: 0;
      }
    }
  }
}

.action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &.primary {
    background: linear-gradient(135deg, rgba(255, 120, 60, 0.8), rgba(255, 80, 40, 0.8));
    color: #fff;
    border-color: rgba(255, 120, 60, 0.5);

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(255, 120, 60, 1), rgba(255, 80, 40, 1));
      box-shadow: 0 4px 12px rgba(255, 120, 60, 0.3);
    }
  }

  &.secondary {
    background: rgba(107, 114, 128, 0.2);
    color: #d1d5db;
    border-color: rgba(107, 114, 128, 0.4);

    &:hover:not(:disabled) {
      background: rgba(107, 114, 128, 0.3);
      border-color: rgba(107, 114, 128, 0.6);
    }
  }
}
</style>
