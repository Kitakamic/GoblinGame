<template>
  <div v-if="show" class="story-summary-modal">
    <div class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">📚 剧情总结</h2>
          <button class="close-btn" @click="handleCancel">✕</button>
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
                    {{ character.title ? `${character.title}-${character.name}` : character.name }}
                  </option>
                </select>
              </div>

              <!-- 保留对话轮数设置 -->
              <div v-if="selectedEntryType === 'character_story_history'" class="retained-dialogues-setting">
                <div class="setting-label">
                  <span>保留对话轮数:</span>
                  <span class="setting-hint">（总结时将保留最近N轮对话，不发送给AI）</span>
                </div>
                <div class="setting-input-group">
                  <input
                    v-model.number="retainedDialogueRounds"
                    type="number"
                    min="0"
                    max="20"
                    class="setting-input"
                    @change="saveRetainedDialogueRounds"
                  />
                  <span class="setting-unit">轮</span>
                </div>
              </div>
            </div>

            <div v-if="!hasAnyEntries" class="no-entries-hint">暂无符合条件的条目</div>
          </div>

          <!-- 操作按钮 -->
          <div class="section action-section">
            <button class="btn-primary btn-large" :disabled="!canSummarize || processing" @click="handleSummarize">
              {{ processing ? '处理中...' : '开始总结' }}
            </button>
            <button class="btn-secondary btn-large" @click="handleCancel">取消</button>
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
      info-type="warning"
      @confirm="handleConfirmSummary"
      @cancel="handleCancelSummary"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import ToastContainer from '../../共享资源层/组件/弹窗提示.vue';
import SummaryConfirmModal from '../../共享资源层/组件/总结确认弹窗.vue';
import { StorySummaryManager } from '../../核心层/服务/世界书管理/服务/剧情总结管理器';
import type { SummaryCheckResult } from '../../核心层/服务/通用服务/总结检查服务';
import { SummaryCheckService } from '../../核心层/服务/通用服务/总结检查服务';

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
const characters = ref<Array<{ id: string; name: string; title?: string }>>([]);
const selectedCharacterId = ref('');
const loadingCharacters = ref(false);
const processing = ref(false);
const retainedDialogueRounds = ref(5); // 保留的对话轮数（默认5轮）

// 弹窗提示引用
const toastRef = ref<InstanceType<typeof ToastContainer>>();

// 确认弹窗状态
const showConfirmModal = ref(false);
const confirmModalTitle = ref('');
const confirmModalInfo = ref('');
const confirmModalContent = ref('');
const pendingSummaries = ref<
  Map<
    number,
    { summary: string; incremental: boolean; entryName: string; entryType: string; retainedDialogues?: string }
  >
>(new Map());
// 存储被禁用的条目UID，用于取消时恢复
const disabledEntryUids = ref<number[]>([]);

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

// 选中的角色名称（包含title）
const selectedCharacter = computed(() => {
  if (!selectedCharacterId.value) return '';
  const character = characters.value.find(c => c.id === selectedCharacterId.value);
  if (!character) return '';
  return character.title ? `${character.title}-${character.name}` : character.name;
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

// 加载保留对话轮数设置
function loadRetainedDialogueRounds() {
  try {
    const globalVars = getVariables({ type: 'global' });
    const rounds = globalVars['summary_retained_dialogue_rounds'];
    if (typeof rounds === 'number' && rounds >= 0) {
      retainedDialogueRounds.value = rounds;
    }
  } catch (error) {
    console.warn('读取保留对话轮数设置失败:', error);
  }
}

// 保存保留对话轮数设置
function saveRetainedDialogueRounds() {
  try {
    const rounds = Math.max(0, Math.min(20, Math.floor(retainedDialogueRounds.value || 0)));
    retainedDialogueRounds.value = rounds;
    replaceVariables({ summary_retained_dialogue_rounds: rounds }, { type: 'global' });
    console.log(`✅ 已保存保留对话轮数设置: ${rounds} 轮`);
  } catch (error) {
    console.error('保存保留对话轮数设置失败:', error);
    toastRef.value?.error('保存设置失败');
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

  // 如果是人物剧情记录，检查实际对话轮数是否足够（设置为0轮时跳过检查，表示不保留任何对话）
  if (
    selectedEntryType.value === 'character_story_history' &&
    selectedCharacterId.value &&
    retainedDialogueRounds.value > 0
  ) {
    try {
      // 获取该人物的世界书条目
      const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);
      const characterEntry = entries.find(
        e => e.extra?.entry_type === 'character_story_history' && e.extra?.character_id === selectedCharacterId.value,
      );

      if (characterEntry) {
        // 解析对话记录
        const { TrainingRecordManager } = await import('../../核心层/服务/世界书管理/管理器/人物剧情/调教记录管理器');
        const records = TrainingRecordManager.parseTrainingHistory(characterEntry.content || '');

        // 计算实际对话轮数（每轮 = 用户输入 + AI回复 = 2条）
        const actualRounds = Math.floor(records.length / 2);
        const settingRounds = retainedDialogueRounds.value;

        // 如果实际轮数小于设置的保留轮数，禁止总结
        if (actualRounds < settingRounds) {
          toastRef.value?.warning(
            `⚠️ 当前人物只有 ${actualRounds} 轮对话记录，无法保留 ${settingRounds} 轮。请将"保留对话轮数"调整为 ${actualRounds} 轮或更少后再进行总结。`,
            { duration: 6000 },
          );
          return;
        }

        console.log(`✅ 对话轮数检查通过: 实际 ${actualRounds} 轮，设置保留 ${settingRounds} 轮`);
      } else {
        console.warn('⚠️ 未找到该人物的世界书条目');
      }
    } catch (error) {
      console.error('检查人物对话记录失败:', error);
      toastRef.value?.error('检查对话记录失败，请重试');
      return;
    }
  } else if (selectedEntryType.value === 'character_story_history' && retainedDialogueRounds.value === 0) {
    console.log('ℹ️ 保留对话轮数设置为0，跳过对话轮数检查（将不保留任何对话，所有对话用于总结）');
  }

  processing.value = true;
  let tempDisabledUids: number[] = [];
  try {
    // 准备角色ID列表
    let characterIds: string[] | undefined;
    if (selectedEntryType.value === 'character_story_history' && selectedCharacterId.value) {
      characterIds = [selectedCharacterId.value];
    }

    // 只传单个条目类型（单选，不支持多选）
    // 生成总结（不直接更新世界书，但会禁用相关条目）
    const summaries = await StorySummaryManager.generateSummaries(
      WORLDBOOK_NAME,
      selectedEntryType.value,
      characterIds,
      toastRef.value,
    );

    // 获取被禁用的条目UID（generateSummaries 会禁用条目，即使总结失败）
    if (summaries.size > 0) {
      tempDisabledUids = Array.from(summaries.keys());
      disabledEntryUids.value = tempDisabledUids;
    } else {
      // 如果没有生成总结，尝试恢复可能被禁用的条目
      // 需要获取实际被禁用的条目
      try {
        const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);
        const disabledEntries = entries.filter(
          e =>
            e.extra?.entry_type === selectedEntryType.value &&
            (!characterIds || characterIds.includes(e.extra?.character_id || '')) &&
            e.enabled === false &&
            e.extra?._original_enabled !== undefined,
        );
        if (disabledEntries.length > 0) {
          tempDisabledUids = disabledEntries.map(e => e.uid);
          disabledEntryUids.value = tempDisabledUids;
          await StorySummaryManager.restoreDisabledEntries(WORLDBOOK_NAME, tempDisabledUids);
          disabledEntryUids.value = [];
          console.log(`✅ 已恢复 ${tempDisabledUids.length} 个被禁用的条目`);
        }
      } catch (error) {
        console.error('恢复禁用条目失败:', error);
      }
      toastRef.value?.warning('没有可总结的内容');
      return;
    }

    // 保存被禁用的条目UID（用于取消时恢复）
    disabledEntryUids.value = tempDisabledUids;

    // 只有一个条目，简化显示
    const firstSummary = summaries.values().next().value;
    if (firstSummary) {
      // 保存待确认的总结
      pendingSummaries.value = summaries;

      // 先显示强烈的警告提示
      toastRef.value?.warning(
        '⚠️ AI 总结已生成！请仔细检查输出内容，清理可能存在的多余思维链、重复内容或无关信息，确认无误后再应用！',
        { duration: 5000 },
      );

      // 延迟一小段时间后再显示确认弹窗，让用户看到警告
      setTimeout(() => {
        // 显示确认弹窗（直接显示内容，不需要标记）
        confirmModalTitle.value = `⚠️ 请仔细检查 - ${firstSummary.entryName}`;
        confirmModalInfo.value =
          '⚠️ 强烈建议：请仔细检查AI生成的总结，清理多余的思维链、重复段落或无关内容。确认内容准确无误后再点击"确认并更新"！';
        confirmModalContent.value = firstSummary.summary;
        showConfirmModal.value = true;
      }, 500);
    }
  } catch (error) {
    console.error('总结失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toastRef.value?.error(`总结失败：${errorMessage}`);

    // 总结失败时，恢复所有可能被禁用的条目
    try {
      const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);
      const disabledEntries = entries.filter(
        e =>
          e.extra?.entry_type === selectedEntryType.value &&
          (!selectedCharacterId.value ||
            !selectedEntryType.value ||
            selectedEntryType.value !== 'character_story_history' ||
            e.extra?.character_id === selectedCharacterId.value) &&
          e.enabled === false &&
          e.extra?._original_enabled !== undefined,
      );
      if (disabledEntries.length > 0) {
        const uidsToRestore = disabledEntries.map(e => e.uid);
        await StorySummaryManager.restoreDisabledEntries(WORLDBOOK_NAME, uidsToRestore);
        disabledEntryUids.value = [];
        console.log(`✅ 总结失败，已恢复 ${uidsToRestore.length} 个被禁用的条目`);
      }
    } catch (restoreError) {
      console.error('恢复禁用条目失败:', restoreError);
    }
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
      { summary: string; incremental: boolean; entryName?: string; entryType?: string; retainedDialogues?: string }
    >();

    // 获取唯一的一个条目的UID
    const firstEntry = pendingSummaries.value.entries().next().value;
    if (!firstEntry) {
      toastRef.value?.error('没有待确认的总结');
      return;
    }
    const [uid, originalData] = firstEntry;

    // 使用用户编辑后的内容，保留 retainedDialogues
    finalSummaries.set(uid, {
      summary: content.trim(),
      incremental: originalData.incremental,
      retainedDialogues: originalData.retainedDialogues,
    });

    // 应用总结到世界书（应用总结时会自动启用条目）
    await StorySummaryManager.applySummaries(WORLDBOOK_NAME, finalSummaries);

    // 清除禁用条目记录（已应用总结，条目会被设置为启用）
    disabledEntryUids.value = [];

    toastRef.value?.success('剧情总结已更新到世界书！');

    showConfirmModal.value = false;
    pendingSummaries.value = new Map();

    // 重新加载条目统计，以便用户可以继续总结其他条目
    await loadEntriesStats();
  } catch (error) {
    console.error('应用总结失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toastRef.value?.error(`应用总结失败：${errorMessage}`);

    // 错误时不关闭确认弹窗，让用户重新尝试
    showConfirmModal.value = true;
  }
}

// 取消总结（确认弹窗的取消）
async function handleCancelSummary() {
  try {
    // 恢复被禁用的条目
    if (disabledEntryUids.value.length > 0) {
      await StorySummaryManager.restoreDisabledEntries(WORLDBOOK_NAME, disabledEntryUids.value);
      console.log(`✅ 已恢复 ${disabledEntryUids.value.length} 个条目的启用状态`);
      disabledEntryUids.value = [];
    }
  } catch (error) {
    console.error('恢复禁用条目失败:', error);
    toastRef.value?.error('恢复条目状态失败，请手动检查世界书');
  }

  showConfirmModal.value = false;
  pendingSummaries.value = new Map();
  toastRef.value?.info('已取消总结，相关条目已恢复启用状态');
}

// 取消操作（主界面的取消按钮）
async function handleCancel() {
  try {
    // 如果有记录的禁用条目UID，优先使用
    let uidsToRestore = disabledEntryUids.value.length > 0 ? [...disabledEntryUids.value] : [];

    // 如果没有记录的UID，尝试从世界书中查找被禁用的条目（带有 _original_enabled 标记的）
    if (uidsToRestore.length === 0) {
      try {
        const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);
        const disabledEntries = entries.filter(e => e.enabled === false && e.extra?._original_enabled !== undefined);
        if (disabledEntries.length > 0) {
          uidsToRestore = disabledEntries.map(e => e.uid);
          console.log(`🔍 发现 ${uidsToRestore.length} 个被禁用的条目，准备恢复`);
        }
      } catch (error) {
        console.error('查找禁用条目失败:', error);
      }
    }

    // 如果有需要恢复的条目，恢复它们
    if (uidsToRestore.length > 0) {
      await StorySummaryManager.restoreDisabledEntries(WORLDBOOK_NAME, uidsToRestore);
      console.log(`✅ 已恢复 ${uidsToRestore.length} 个条目的启用状态`);
      disabledEntryUids.value = [];
      toastRef.value?.info(`已恢复 ${uidsToRestore.length} 个条目状态`);
    }

    // 清除待确认的总结
    pendingSummaries.value = new Map();
  } catch (error) {
    console.error('恢复禁用条目失败:', error);
    toastRef.value?.error('恢复条目状态失败，请手动检查世界书');
  }

  // 关闭确认弹窗（如果打开）
  showConfirmModal.value = false;

  // 关闭界面
  emit('close');
}

// 监听show变化，当对话框打开/关闭时处理
watch(
  () => show,
  async (isVisible, wasVisible) => {
    if (isVisible) {
      // 界面打开时：加载条目统计和设置
      await loadEntriesStats();
      loadRetainedDialogueRounds();
      // 重置选择状态
      selectedEntryType.value = '';
      selectedCharacterId.value = '';
      characters.value = [];
    } else if (wasVisible) {
      // 界面关闭时：如果有未完成的总结，恢复条目状态
      try {
        // 优先使用记录的UID
        let uidsToRestore = disabledEntryUids.value.length > 0 ? [...disabledEntryUids.value] : [];

        // 如果没有记录的UID，尝试从世界书中查找被禁用的条目
        if (uidsToRestore.length === 0) {
          const entries = await StorySummaryManager.getWorldbookEntries(WORLDBOOK_NAME);
          const disabledEntries = entries.filter(e => e.enabled === false && e.extra?._original_enabled !== undefined);
          if (disabledEntries.length > 0) {
            uidsToRestore = disabledEntries.map(e => e.uid);
            console.log(`🔍 界面关闭时发现 ${uidsToRestore.length} 个被禁用的条目，准备恢复`);
          }
        }

        // 如果有需要恢复的条目，恢复它们
        if (uidsToRestore.length > 0) {
          await StorySummaryManager.restoreDisabledEntries(WORLDBOOK_NAME, uidsToRestore);
          console.log(`✅ 界面关闭时已恢复 ${uidsToRestore.length} 个条目的启用状态`);
          disabledEntryUids.value = [];
          pendingSummaries.value = new Map();
        }
      } catch (error) {
        console.error('恢复禁用条目失败:', error);
        // 界面已关闭，无法显示 toast，只能记录错误
      }
    }
  },
);

// 初始化
onMounted(async () => {
  if (show) {
    await loadEntriesStats();
    loadRetainedDialogueRounds();
  }
});

// 监听 show prop，当界面显示时加载设置
watch(
  () => show,
  isShow => {
    if (isShow) {
      loadRetainedDialogueRounds();
    }
  },
);
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

.retained-dialogues-setting {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(205, 133, 63, 0.2);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #ffe9d2;
  font-weight: 600;
}

.setting-hint {
  font-size: 12px;
  color: rgba(255, 233, 210, 0.6);
  font-weight: normal;
}

.setting-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-input {
  width: 80px;
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 6px;
  color: #ffe9d2;
  font-size: 14px;
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

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
}

.setting-unit {
  font-size: 14px;
  color: rgba(255, 233, 210, 0.8);
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
