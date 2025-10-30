<template>
  <div v-if="show" class="story-summary-modal">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">📚 剧情总结</h2>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <!-- 说明信息 -->
          <div class="section info-section">
            <p class="info-text">📚 将总结和压缩人物剧情、据点征服、冒头事件等记录，减少数据量</p>
            <template v-if="summaryCheckResult?.needsSummary">
              <p class="info-text warning-text">⚠️ 检测到以下条目超过5万tokens，建议优先总结：</p>
              <ul class="over-threshold-list">
                <li
                  v-for="detail in summaryCheckResult.entryDetails.filter(d => d.exceedsThreshold)"
                  :key="detail.type"
                >
                  {{ detail.typeName }}：{{ detail.tokens.toLocaleString() }} tokens
                  <span
                    v-if="detail.type === 'character_story_history' && overThresholdCharacters.length > 0"
                    class="character-names"
                  >
                    ({{ overThresholdCharacters.map(c => c.name).join('、') }})
                  </span>
                </li>
              </ul>
            </template>
          </div>

          <!-- 条目类型列表 -->
          <div class="section entries-section">
            <h3 class="section-title">选择要总结的条目类型</h3>

            <!-- 据点征服记录 -->
            <div v-if="availableEntries.conquest > 0" class="entry-type-card">
              <label class="entry-type-label">
                <input v-model="selectedEntryType" type="radio" value="conquest_records" />
                <div class="entry-type-info">
                  <span class="entry-type-name">📍 据点征服记录</span>
                  <span class="entry-type-count">
                    ({{ availableEntries.conquest }} 条，约 {{ entriesDetails.conquest?.totalTokens || 0 }} tokens)
                  </span>
                </div>
              </label>
            </div>

            <!-- 冒头事件记录 -->
            <div v-if="availableEntries.events > 0" class="entry-type-card">
              <label class="entry-type-label">
                <input v-model="selectedEntryType" type="radio" value="game_event_story" />
                <div class="entry-type-info">
                  <span class="entry-type-name">🎲 冒头事件记录</span>
                  <span class="entry-type-count">
                    ({{ availableEntries.events }} 条，约 {{ entriesDetails.events?.totalTokens || 0 }} tokens)
                  </span>
                </div>
              </label>
            </div>

            <!-- 人物剧情记录 -->
            <div v-if="availableEntries.characters > 0" class="entry-type-card">
              <label class="entry-type-label">
                <input v-model="selectedEntryType" type="radio" value="character_story_history" />
                <div class="entry-type-info">
                  <span class="entry-type-name">👤 人物剧情记录</span>
                  <span class="entry-type-count">
                    <template v-if="selectedCharacterId">
                      ({{ selectedCharacter }}，约 {{ entriesDetails.characters?.totalTokens || 0 }} tokens)
                    </template>
                    <template v-else>
                      ({{ availableEntries.characters }} 条，全部约
                      {{ entriesDetails.characters?.totalTokens || 0 }} tokens)
                    </template>
                  </span>
                </div>
              </label>

              <!-- 人物选择下拉菜单 -->
              <div v-if="selectedEntryType === 'character_story_history'" class="character-dropdown">
                <div class="dropdown-header">
                  <span class="dropdown-label">选择人物:</span>
                  <button class="btn-primary btn-sm" :disabled="loadingCharacters" @click="loadCharacters">
                    {{ loadingCharacters ? '加载中...' : '刷新' }}
                  </button>
                </div>
                <select v-model="selectedCharacterId" class="character-select" :disabled="loadingCharacters">
                  <option value="" disabled>请选择人物</option>
                  <option v-for="character in filteredCharacters" :key="character.id" :value="character.id">
                    {{ character.name }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="!hasAnyEntries" class="no-entries-hint">暂无符合条件的条目</div>
          </div>

          <!-- 操作按钮 -->
          <div class="section action-section">
            <button class="btn-primary btn-large" :disabled="!canSummarize || processing" @click="handleSummarize">
              {{ processing ? '处理中...' : '开始总结' }}
            </button>
            <button class="btn-secondary btn-large" @click="$emit('close')">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义弹窗提示 -->
    <ToastContainer ref="toastRef" />

    <!-- 确认弹窗 -->
    <SummaryConfirmModal
      :show="showConfirmModal"
      :title="confirmModalTitle"
      :info-text="confirmModalInfo"
      :content="confirmModalContent"
      @confirm="handleConfirmSummary"
      @cancel="handleCancelSummary"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { SummaryCheckResult } from '../服务/总结检查服务';
import { SummaryCheckService } from '../服务/总结检查服务';
import ToastContainer from '../组件/弹窗提示.vue';
import SummaryConfirmModal from '../组件/总结确认弹窗.vue';
import { StorySummaryManager } from './剧情总结管理器';

// Props
const { show } = defineProps<{
  show: boolean;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 常量 - 固定世界书名称
const WORLDBOOK_NAME = '哥布林巢穴-人物档案';

// 状态
const availableEntries = ref({ conquest: 0, characters: 0, events: 0 });
const selectedEntryType = ref<string>(''); // 改为单选
const characters = ref<Array<{ id: string; name: string }>>([]);
const selectedCharacterId = ref('');
const loadingCharacters = ref(false);
const processing = ref(false);

// 弹窗提示引用
const toastRef = ref<InstanceType<typeof ToastContainer>>();

// 确认弹窗状态
const showConfirmModal = ref(false);
const confirmModalTitle = ref('');
const confirmModalInfo = ref('');
const confirmModalContent = ref('');
const pendingSummaries = ref<
  Map<number, { summary: string; incremental: boolean; entryName: string; entryType: string }>
>(new Map());

// 是否有任何条目
const hasAnyEntries = computed(() => {
  return (
    availableEntries.value.conquest > 0 || availableEntries.value.characters > 0 || availableEntries.value.events > 0
  );
});

// 过滤后的人物列表
const filteredCharacters = computed(() => {
  return characters.value;
});

// 选中的角色名称
const selectedCharacter = computed(() => {
  if (!selectedCharacterId.value) return '';
  const character = characters.value.find(c => c.id === selectedCharacterId.value);
  return character ? character.name : '';
});

// 监听人物选择，重新计算tokens
watch(
  () => selectedCharacterId.value,
  async characterId => {
    if (selectedEntryType.value === 'character_story_history') {
      // 重新加载并计算选中人物的tokens
      const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);
      const characterStoryEntries = entries.filter(e => e.extra?.entry_type === 'character_story_history');

      if (characterId) {
        // 只计算选中人物的tokens
        entriesDetails.value.characters = {
          count: 1,
          totalTokens: characterStoryEntries
            .filter(e => e.extra?.character_id === characterId)
            .reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0),
        };
      } else {
        // 计算所有人物剧情的tokens
        entriesDetails.value.characters = {
          count: characterStoryEntries.length,
          totalTokens: characterStoryEntries.reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0),
        };
      }
    }
  },
);

// 是否可以总结
const canSummarize = computed(() => {
  if (!selectedEntryType.value) return false;

  // 如果是人物剧情记录，需要选择人物
  if (selectedEntryType.value === 'character_story_history') {
    return selectedCharacterId.value !== '';
  }

  return true;
});

// 监听是否选中了人物剧情记录，自动加载人物列表
watch(
  () => selectedEntryType.value === 'character_story_history',
  isSelected => {
    if (isSelected && characters.value.length === 0) {
      loadCharacters();
    }
  },
);

// 存储条目详情（用于显示token信息）
const entriesDetails = ref<Record<string, { count: number; totalTokens: number }>>({});

// 总结检查结果
const summaryCheckResult = ref<SummaryCheckResult | null>(null);

// 超过阈值的角色列表
const overThresholdCharacters = ref<Array<{ id: string; name: string; tokens: number }>>([]);

// 加载世界书条目统计
async function loadEntriesStats() {
  try {
    const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);

    availableEntries.value = {
      conquest: entries.filter(e => e.extra?.entry_type === 'conquest_records').length,
      characters: entries.filter(e => e.extra?.entry_type === 'character_story_history').length,
      events: entries.filter(e => e.extra?.entry_type === 'game_event_story').length,
    };

    // 计算token信息
    const characterStoryEntries = entries.filter(e => e.extra?.entry_type === 'character_story_history');
    entriesDetails.value = {
      conquest: {
        count: availableEntries.value.conquest,
        totalTokens: entries
          .filter(e => e.extra?.entry_type === 'conquest_records')
          .reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0),
      },
      characters: {
        count: availableEntries.value.characters,
        totalTokens: characterStoryEntries.reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0),
      },
      events: {
        count: availableEntries.value.events,
        totalTokens: entries
          .filter(e => e.extra?.entry_type === 'game_event_story')
          .reduce((sum, e) => sum + StorySummaryManager.calculateEntryTokens(e), 0),
      },
    };

    // 执行总结检查
    summaryCheckResult.value = await SummaryCheckService.checkIfSummaryNeeded();

    // 如果人物剧情超过阈值，找出具体是哪些角色
    if (summaryCheckResult.value.needsSummary) {
      const characterDetail = summaryCheckResult.value.entryDetails.find(d => d.type === 'character_story_history');
      if (characterDetail && characterDetail.exceedsThreshold) {
        // 按人物计算tokens
        const characterTokensByPerson = new Map<string, { name: string; tokens: number }>();
        characterStoryEntries.forEach(entry => {
          const characterId = entry.extra?.character_id || '';
          const characterName = entry.extra?.character_name || entry.name || '';
          const tokens = StorySummaryManager.calculateEntryTokens(entry);

          if (characterId) {
            const existing = characterTokensByPerson.get(characterId);
            if (existing) {
              existing.tokens += tokens;
            } else {
              characterTokensByPerson.set(characterId, { name: characterName, tokens });
            }
          }
        });

        // 找出超过阈值的角色
        overThresholdCharacters.value = Array.from(characterTokensByPerson.entries())
          .filter(([, data]) => data.tokens > 50000)
          .map(([id, data]) => ({ id, name: data.name, tokens: data.tokens }));
      }
    }

    console.log('📊 可用条目统计:', availableEntries.value);
    console.log('📊 Token统计:', entriesDetails.value);
  } catch (error) {
    console.error('加载条目统计失败:', error);
  }
}

// 加载人物列表
async function loadCharacters() {
  if (loadingCharacters.value) return;

  loadingCharacters.value = true;
  try {
    characters.value = await StorySummaryManager.getCharactersInWorldbook(WORLDBOOK_NAME);
    console.log(`加载了 ${characters.value.length} 个人物`);
    toastRef.value?.success(`加载了 ${characters.value.length} 个人物`);
  } catch (error) {
    console.error('加载人物列表失败:', error);
    toastRef.value?.error('加载人物列表失败');
  } finally {
    loadingCharacters.value = false;
  }
}

// 处理总结
async function handleSummarize() {
  if (!canSummarize.value || processing.value) return;

  // 检查人物剧情记录是否选择了人物
  if (selectedEntryType.value === 'character_story_history' && !selectedCharacterId.value) {
    toastRef.value?.warning('请选择要总结的人物');
    return;
  }

  processing.value = true;
  try {
    // 准备角色ID列表
    let characterIds: string[] | undefined;
    if (selectedEntryType.value === 'character_story_history' && selectedCharacterId.value) {
      characterIds = [selectedCharacterId.value];
    }

    // 只传一个条目类型
    const entryTypes = [selectedEntryType.value];

    // 生成总结（不直接更新世界书）
    const summaries = await StorySummaryManager.generateSummaries(
      WORLDBOOK_NAME,
      entryTypes,
      characterIds,
      toastRef.value,
    );

    if (summaries.size === 0) {
      toastRef.value?.warning('没有可总结的内容');
      return;
    }

    // 只有一个条目，简化显示
    const firstSummary = summaries.values().next().value;
    if (firstSummary) {
      // 保存待确认的总结
      pendingSummaries.value = summaries;

      // 显示确认弹窗（直接显示内容，不需要标记）
      confirmModalTitle.value = `AI 总结完成 - ${firstSummary.entryName}`;
      confirmModalInfo.value = 'AI 已生成总结内容，请检查并编辑后确认更新到世界书';
      confirmModalContent.value = firstSummary.summary;
      showConfirmModal.value = true;
    }
  } catch (error) {
    console.error('总结失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toastRef.value?.error(`总结失败：${errorMessage}`);
  } finally {
    processing.value = false;
  }
}

// 确认总结
async function handleConfirmSummary(content: string) {
  try {
    // 只有一个条目，直接使用编辑后的内容
    const finalSummaries = new Map<
      number,
      { summary: string; incremental: boolean; entryName?: string; entryType?: string }
    >();

    // 获取唯一的一个条目的UID
    const firstEntry = pendingSummaries.value.entries().next().value;
    if (!firstEntry) {
      toastRef.value?.error('没有待确认的总结');
      return;
    }
    const [uid, originalData] = firstEntry;

    // 使用用户编辑后的内容
    finalSummaries.set(uid, {
      summary: content.trim(),
      incremental: originalData.incremental,
    });

    // 应用总结到世界书
    await StorySummaryManager.applySummaries(WORLDBOOK_NAME, finalSummaries);

    toastRef.value?.success('剧情总结已更新到世界书！');

    showConfirmModal.value = false;
    pendingSummaries.value = new Map();

    // 关闭对话框
    setTimeout(() => {
      emit('close');
    }, 1500);
  } catch (error) {
    console.error('应用总结失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toastRef.value?.error(`应用总结失败：${errorMessage}`);

    // 错误时不关闭确认弹窗，让用户重新尝试
    showConfirmModal.value = true;
  }
}

// 取消总结
function handleCancelSummary() {
  showConfirmModal.value = false;
  pendingSummaries.value = new Map();
  toastRef.value?.info('已取消总结');
}

// 监听show变化，当对话框打开时重新加载条目统计
watch(
  () => show,
  async isVisible => {
    if (isVisible) {
      await loadEntriesStats();
      // 重置选择状态
      selectedEntryType.value = '';
      selectedCharacterId.value = '';
      characters.value = [];
    }
  },
);

// 初始化
onMounted(async () => {
  if (show) {
    await loadEntriesStats();
  }
});
</script>

<style scoped lang="scss">
.story-summary-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 200, 150, 0.08);
  border: 2px solid rgba(205, 133, 63, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
  background: rgba(40, 26, 20, 0.8);
}

.modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #ffd7a1;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.6),
    0 0 12px rgba(255, 120, 40, 0.3);
}

.close-btn {
  background: rgba(40, 26, 20, 0.9);
  border: 2px solid rgba(255, 180, 120, 0.6);
  border-radius: 6px;
  font-size: 20px;
  color: #ffd7a1;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 5px 10px;
  width: 36px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 200, 150, 0.2);

  &:hover {
    background: rgba(255, 180, 120, 0.15);
    border-color: rgba(255, 180, 120, 0.9);
    transform: scale(1.1) rotate(90deg);
    box-shadow:
      0 4px 12px rgba(255, 180, 120, 0.3),
      inset 0 1px 2px rgba(255, 200, 150, 0.3);
  }
}

.modal-body {
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 30px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-section {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-left: 4px solid rgba(255, 180, 120, 0.6);
  padding: 15px;
  border-radius: 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.3);
}

.info-text {
  margin: 0;
  color: #ffe9d2;
  line-height: 1.6;
  font-size: 14px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd7a1;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.2);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.entries-section {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.6), rgba(25, 17, 14, 0.8));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);
}

.entry-type-card {
  margin-bottom: 15px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.5), rgba(25, 17, 14, 0.7));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s ease;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
    border-color: rgba(205, 133, 63, 0.4);
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.entry-type-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
}

.entry-type-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.entry-type-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffe9d2;
}

.entry-type-count {
  font-size: 14px;
  color: rgba(255, 233, 210, 0.7);
}

.character-dropdown {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dropdown-label {
  font-size: 14px;
  color: #ffe9d2;
  font-weight: 600;
}

.character-dropdown {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(205, 133, 63, 0.2);
}

.character-select {
  width: 100%;
  padding: 10px 15px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 8px;
  color: #ffe9d2;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.3);

  &:focus {
    outline: none;
    border-color: rgba(255, 180, 120, 0.6);
    background: linear-gradient(180deg, rgba(40, 26, 20, 0.9), rgba(25, 17, 14, 1));
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 4px 12px rgba(255, 180, 120, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #281a14;
    color: #ffe9d2;
  }
}

.no-entries-hint {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
}

.action-section {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-primary,
.btn-secondary {
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  flex: 1;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  color: #ffe9d2;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #8a3c2c, #65261c);
    border-color: rgba(255, 120, 60, 0.5);
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 6px 16px rgba(110, 30, 15, 0.4);
    color: #ffd7a1;
  }
}

.btn-secondary {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  color: rgba(255, 233, 210, 0.8);
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover:not(:disabled) {
    background: rgba(40, 26, 20, 0.9);
    border-color: rgba(205, 133, 63, 0.5);
    transform: translateY(-2px);
    color: #ffe9d2;
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 6px 16px rgba(0, 0, 0, 0.4);
  }
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  flex: 0 0 auto;
}

.btn-large {
  padding: 15px 30px;
  font-size: 16px;
}

.warning-text {
  color: #fbbf24;
  font-weight: 600;
  margin-top: 12px;

  .over-threshold-list {
    margin: 8px 0 0 20px;
    padding: 0;
    list-style-type: disc;

    li {
      margin: 4px 0;
      color: #ffe9d2;

      .character-names {
        color: #f59e0b;
        font-weight: 700;
      }
    }
  }
}
</style>
