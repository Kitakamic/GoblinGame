<template>
  <div v-if="show" class="debug-overlay">
    <div class="debug-panel" @click.stop>
      <div class="panel-header">
        <h3>🐛 调试工具</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="panel-content">
        <!-- 修复功能区域 -->
        <div class="debug-section">
          <h4 class="section-title">据点修复</h4>

          <div class="debug-item">
            <div class="debug-desc">
              <span class="desc-text">修复据点俘虏问题</span>
              <span class="desc-detail"
                >检查已征服的据点，如果据点有英雄但调教模块中没有对应人物，则将英雄状态改为 imprisoned</span
              >
            </div>
            <button class="debug-button" :disabled="isFixing" @click="fixLocationCaptures">
              {{ isFixing ? '⏳ 修复中...' : '🔧 修复据点俘虏' }}
            </button>
          </div>

          <div v-if="fixResult" class="fix-result" :class="fixResult.type">
            <div class="result-header">
              <span class="result-icon">{{ fixResult.type === 'success' ? '✅' : '❌' }}</span>
              <span class="result-title">{{ fixResult.type === 'success' ? '修复完成' : '修复失败' }}</span>
            </div>
            <div class="result-content">
              <p>{{ fixResult.message }}</p>
              <ul v-if="fixResult.details && fixResult.details.length > 0" class="result-details">
                <li v-for="(detail, index) in fixResult.details" :key="index">{{ detail }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 人物数据调试区域 -->
        <div class="debug-section">
          <h4 class="section-title">人物数据调试</h4>

          <div class="debug-item">
            <div class="debug-desc">
              <span class="desc-text">修改人物数据并更新世界书</span>
              <span class="desc-detail">选择人物后可以修改其属性、状态等信息，修改后会同步更新到存档和世界书</span>
            </div>

            <!-- 人物选择 -->
            <div class="character-select-wrapper">
              <div class="select-header">
                <label class="select-label">选择人物：</label>
                <button class="refresh-btn" title="刷新人物列表" @click="refreshCharacters">🔄 刷新</button>
              </div>
              <select v-model="selectedCharacterId" class="character-select" @change="onCharacterSelected">
                <option value="">-- 请选择人物 --</option>
                <option v-for="char in availableCharacters" :key="char.id" :value="char.id">
                  {{ char.name }} ({{ char.title }}) - {{ getStatusText(char.status) }}
                </option>
              </select>
              <div v-if="availableCharacters.length === 0" class="empty-hint">
                <span class="hint-icon">ℹ️</span>
                <span class="hint-text">未找到人物数据</span>
                <div class="hint-detail">
                  数据来源：存档中的 training 模块 (characters 数组)<br />
                  当前人物数：{{ getCharactersCount() }}<br />
                  <span v-if="!isGameDataLoaded()" class="hint-warning">
                    ⚠️ 存档数据未加载，请先加载存档或开始新游戏
                  </span>
                </div>
              </div>
            </div>

            <!-- 编辑表单 -->
            <div v-if="selectedCharacter && editedCharacter" class="character-edit-form">
              <div class="form-row">
                <label class="form-label">姓名：</label>
                <input v-model="editedCharacter.name" class="form-input" type="text" />
              </div>

              <div class="form-row">
                <label class="form-label">身份：</label>
                <input v-model="editedCharacter.title" class="form-input" type="text" />
              </div>

              <div class="form-row">
                <label class="form-label">年龄：</label>
                <input v-model.number="editedCharacter.age" class="form-input" type="number" min="1" />
              </div>

              <div class="form-row">
                <label class="form-label">忠诚度：</label>
                <input v-model.number="editedCharacter.loyalty" class="form-input" type="number" min="0" max="100" />
              </div>

              <div class="form-row">
                <label class="form-label">状态：</label>
                <select v-model="editedCharacter.status" class="form-select">
                  <option value="imprisoned">关押中</option>
                  <option value="training">调教中</option>
                  <option value="breeding">交配中</option>
                  <option value="surrendered">已堕落</option>
                  <option value="deployed">已编制</option>
                </select>
              </div>

              <div class="form-row">
                <label class="form-label">当前体力：</label>
                <input v-model.number="editedCharacter.stamina" class="form-input" type="number" min="0" />
              </div>

              <div class="form-row">
                <label class="form-label">最大体力：</label>
                <input v-model.number="editedCharacter.maxStamina" class="form-input" type="number" min="0" />
              </div>

              <div class="form-row">
                <label class="form-label">当前生育力：</label>
                <input v-model.number="editedCharacter.fertility" class="form-input" type="number" min="0" />
              </div>

              <div class="form-row">
                <label class="form-label">最大生育力：</label>
                <input v-model.number="editedCharacter.maxFertility" class="form-input" type="number" min="0" />
              </div>

              <div class="form-row">
                <label class="form-label">外貌描述：</label>
                <textarea
                  v-if="editedCharacter.appearance"
                  v-model="editedCharacter.appearance.description"
                  class="form-textarea"
                  rows="3"
                  placeholder="输入外貌描述..."
                ></textarea>
              </div>

              <div class="form-row">
                <label class="form-label">童年经历（每行一条）：</label>
                <textarea
                  class="form-textarea"
                  rows="3"
                  placeholder="输入童年经历，每行一条..."
                  :value="getLifeStoryText(editedCharacter.lifeStory?.childhood)"
                  @input="updateLifeStory('childhood', $event)"
                ></textarea>
              </div>

              <div class="form-row">
                <label class="form-label">青少年经历（每行一条）：</label>
                <textarea
                  class="form-textarea"
                  rows="3"
                  placeholder="输入青少年经历，每行一条..."
                  :value="getLifeStoryText(editedCharacter.lifeStory?.adolescence)"
                  @input="updateLifeStory('adolescence', $event)"
                ></textarea>
              </div>

              <div class="form-row">
                <label class="form-label">成年经历（每行一条）：</label>
                <textarea
                  class="form-textarea"
                  rows="3"
                  placeholder="输入成年经历，每行一条..."
                  :value="getLifeStoryText(editedCharacter.lifeStory?.adulthood)"
                  @input="updateLifeStory('adulthood', $event)"
                ></textarea>
              </div>

              <div class="form-row">
                <label class="form-label">当前状态（每行一条）：</label>
                <textarea
                  class="form-textarea"
                  rows="3"
                  placeholder="输入当前状态，每行一条..."
                  :value="getLifeStoryText(editedCharacter.lifeStory?.currentState)"
                  @input="updateLifeStory('currentState', $event)"
                ></textarea>
              </div>

              <button class="debug-button" :disabled="isUpdatingCharacter" @click="updateCharacterData">
                {{ isUpdatingCharacter ? '⏳ 更新中...' : '💾 保存并更新世界书' }}
              </button>
            </div>

            <div v-if="characterUpdateResult" class="fix-result" :class="characterUpdateResult.type">
              <div class="result-header">
                <span class="result-icon">{{ characterUpdateResult.type === 'success' ? '✅' : '❌' }}</span>
                <span class="result-title">
                  {{ characterUpdateResult.type === 'success' ? '更新完成' : '更新失败' }}
                </span>
              </div>
              <div class="result-content">
                <p>{{ characterUpdateResult.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { WorldbookService } from '../世界书管理/世界书服务';
import type { Character } from '../人物管理/类型/人物类型';
import { modularSaveManager } from '../存档管理/模块化存档服务';
import { exploreService } from '../探索/服务/探索服务';
import { toast } from '../服务/弹窗提示服务';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isFixing = ref(false);
const fixResult = ref<{
  type: 'success' | 'error';
  message: string;
  details?: string[];
} | null>(null);

// 人物数据调试相关状态
const selectedCharacterId = ref<string>('');
const selectedCharacter = ref<Character | null>(null);
const editedCharacter = ref<Character | null>(null);
const isUpdatingCharacter = ref(false);
const characterUpdateResult = ref<{
  type: 'success' | 'error';
  message: string;
} | null>(null);

// 获取所有可用人物（使用 ref 而不是 computed，因为 modularSaveManager 的数据不是响应式的）
const availableCharacters = ref<Character[]>([]);

// 刷新人物列表
function refreshCharacters() {
  const currentGameData = modularSaveManager.getCurrentGameData();
  console.log('🔍 [调试界面] 刷新人物列表，当前游戏数据:', currentGameData ? '已加载' : '未加载');

  if (!currentGameData) {
    console.warn('⚠️ [调试界面] 当前游戏数据未加载，无法获取人物数据');
    availableCharacters.value = [];
    return;
  }

  const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
  console.log('🔍 [调试界面] 训练模块数据:', trainingData ? '存在' : '不存在');

  if (!trainingData) {
    console.warn('⚠️ [调试界面] 训练模块数据不存在');
    availableCharacters.value = [];
    return;
  }

  const characters = (trainingData.characters || []) as Character[];
  console.log(`🔍 [调试界面] 人物总数: ${characters.length}`);

  // 排除玩家角色
  const filtered = characters.filter(char => char.status !== 'player');
  console.log(`🔍 [调试界面] 过滤后人物数 (排除玩家): ${filtered.length}`);

  availableCharacters.value = filtered;
}

function close() {
  emit('close');
  fixResult.value = null;
  characterUpdateResult.value = null;
  selectedCharacterId.value = '';
  selectedCharacter.value = null;
  editedCharacter.value = null;
}

// 获取状态文本
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    imprisoned: '关押中',
    training: '调教中',
    breeding: '交配中',
    surrendered: '已堕落',
    deployed: '已编制',
    enemy: '敌人',
    uncaptured: '未捕获',
    player: '玩家',
  };
  return statusMap[status] || status;
}

// 人物选择变化
function onCharacterSelected() {
  if (!selectedCharacterId.value) {
    selectedCharacter.value = null;
    editedCharacter.value = null;
    characterUpdateResult.value = null;
    return;
  }

  const character = availableCharacters.value.find(char => char.id === selectedCharacterId.value);
  if (character) {
    selectedCharacter.value = character;
    // 深拷贝人物数据用于编辑
    const edited = JSON.parse(JSON.stringify(character));

    // 确保 appearance 对象存在
    if (!edited.appearance) {
      edited.appearance = {
        height: 0,
        weight: 0,
        measurements: '',
        description: '',
      };
    }

    // 确保 appearance.description 存在
    if (!edited.appearance.description) {
      edited.appearance.description = '';
    }

    // 确保 lifeStory 对象存在
    if (!edited.lifeStory) {
      edited.lifeStory = {
        childhood: [],
        adolescence: [],
        adulthood: [],
        currentState: [],
      };
    }

    editedCharacter.value = edited;
    characterUpdateResult.value = null;
  }
}

// 将人生经历数组转换为文本（每行一条）
function getLifeStoryText(items?: string[]): string {
  if (!items || items.length === 0) return '';
  return items.join('\n');
}

// 更新人生经历（将多行文本转换为数组）
function updateLifeStory(field: 'childhood' | 'adolescence' | 'adulthood' | 'currentState', event: Event) {
  if (!editedCharacter.value) return;

  const target = event.target as HTMLTextAreaElement;
  const text = target.value || '';

  // 确保 lifeStory 对象存在
  if (!editedCharacter.value.lifeStory) {
    editedCharacter.value.lifeStory = {
      childhood: [],
      adolescence: [],
      adulthood: [],
      currentState: [],
    };
  }

  // 将文本按行分割，过滤空行
  const items = text.split('\n').filter(line => line.trim().length > 0);
  editedCharacter.value.lifeStory[field] = items;
}

// 更新人物数据
async function updateCharacterData() {
  if (!editedCharacter.value || !selectedCharacter.value) {
    toast.error('请先选择人物');
    return;
  }

  // 验证状态：不允许设置为 player、enemy、uncaptured
  const forbiddenStatuses = ['player', 'enemy', 'uncaptured'];
  if (forbiddenStatuses.includes(editedCharacter.value.status)) {
    toast.error('不允许将状态设置为玩家、敌人或未捕获');
    characterUpdateResult.value = {
      type: 'error',
      message: '不允许将状态设置为玩家、敌人或未捕获',
    };
    return;
  }

  isUpdatingCharacter.value = true;
  characterUpdateResult.value = null;

  try {
    console.log('🔧 开始更新人物数据:', editedCharacter.value.name);

    // 获取训练数据
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    const characters = (trainingData?.characters || []) as Character[];

    // 更新人物数据
    const updatedCharacters = characters.map(char => {
      if (char.id === editedCharacter.value!.id) {
        return editedCharacter.value!;
      }
      return char;
    });

    // 更新存档
    modularSaveManager.updateModuleData({
      moduleName: 'training',
      data: {
        ...trainingData,
        characters: updatedCharacters,
      },
    });

    // 保存到数据库
    await modularSaveManager.saveCurrentGameData(0);

    // 更新世界书
    await WorldbookService.updateCharacterEntry(editedCharacter.value);

    // 更新本地引用
    selectedCharacter.value = editedCharacter.value;

    // 刷新人物列表，确保显示最新数据
    refreshCharacters();

    characterUpdateResult.value = {
      type: 'success',
      message: `已成功更新人物 ${editedCharacter.value.name} 的数据并同步到世界书`,
    };

    toast.success(`人物 ${editedCharacter.value.name} 数据已更新`);

    console.log('✅ 人物数据更新完成');
  } catch (error) {
    console.error('❌ 更新人物数据失败:', error);
    characterUpdateResult.value = {
      type: 'error',
      message: `更新失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
    toast.error(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    isUpdatingCharacter.value = false;
  }
}

// 监听显示状态，重置表单
watch(
  () => props.show,
  newVal => {
    if (!newVal) {
      // 关闭时重置
      selectedCharacterId.value = '';
      selectedCharacter.value = null;
      editedCharacter.value = null;
      characterUpdateResult.value = null;
    } else {
      // 打开时刷新数据
      console.log('🔍 [调试界面] 调试界面打开，刷新人物数据');
      refreshCharacters();
      console.log('🔍 [调试界面] 刷新后可用人物数量:', availableCharacters.value.length);
    }
  },
);

// 获取人物总数（包括玩家）
function getCharactersCount(): number {
  const currentGameData = modularSaveManager.getCurrentGameData();
  if (!currentGameData) return 0;

  const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
  if (!trainingData || !trainingData.characters) return 0;

  return trainingData.characters.length;
}

// 检查游戏数据是否已加载
function isGameDataLoaded(): boolean {
  return modularSaveManager.getCurrentGameData() !== null;
}

async function fixLocationCaptures() {
  if (isFixing.value) return;

  isFixing.value = true;
  fixResult.value = null;

  try {
    console.log('🔧 开始修复据点俘虏问题...');

    // 获取所有据点
    const allLocations = exploreService.getAllLocations();
    console.log('📋 所有据点数量:', allLocations.length);

    // 获取已征服的据点
    const conqueredLocations = allLocations.filter(loc => loc.status === 'conquered');
    console.log('🏰 已征服据点数量:', conqueredLocations.length);

    // 获取调教模块中的人物
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    const trainingCharacters = (trainingData?.characters || []) as Character[];
    console.log('👥 调教模块中人物数量:', trainingCharacters.length);

    const fixedLocations: string[] = [];
    const fixedCharacters: string[] = [];
    const skippedLocations: string[] = [];

    // 遍历已征服的据点
    for (const location of conqueredLocations) {
      if (!location.rewards?.heroes || location.rewards.heroes.length === 0) {
        skippedLocations.push(`${location.name}（无英雄）`);
        continue;
      }

      // 检查据点中的每个英雄
      for (const hero of location.rewards.heroes) {
        // 检查调教模块中是否存在对应的人物
        const existingCharacter = trainingCharacters.find(char => char.id === hero.id || char.name === hero.name);

        if (!existingCharacter) {
          // 如果不存在，创建新人物并设置为 imprisoned 状态
          const newCharacter: Character = {
            ...hero,
            status: 'imprisoned',
            capturedAt: new Date(),
          };

          // 添加到调教模块
          trainingCharacters.push(newCharacter);
          fixedCharacters.push(`${hero.name} (${location.name})`);
          console.log(`✅ 已修复: ${hero.name} 从据点 ${location.name} 添加到调教模块`);
        } else {
          // 如果人物已存在，不进行任何修改，跳过
          console.log(`⏭️ 跳过: ${hero.name} 已存在于调教模块中（状态: ${existingCharacter.status}），不进行修改`);
        }
      }

      if (fixedCharacters.length > 0) {
        fixedLocations.push(location.name);
      }
    }

    // 保存更新后的调教数据
    if (fixedCharacters.length > 0) {
      modularSaveManager.updateModuleData({
        moduleName: 'training',
        data: {
          ...trainingData,
          characters: trainingCharacters,
        },
      });

      // 强制保存到酒馆存档
      await modularSaveManager.saveCurrentGameData(0);
    }

    // 显示结果
    if (fixedCharacters.length > 0) {
      fixResult.value = {
        type: 'success',
        message: `成功修复 ${fixedLocations.length} 个据点，${fixedCharacters.length} 个人物`,
        details: [
          `修复的据点: ${fixedLocations.join('、')}`,
          `修复的人物: ${fixedCharacters.slice(0, 10).join('、')}${fixedCharacters.length > 10 ? ` 等 ${fixedCharacters.length} 人` : ''}`,
        ],
      };
    } else {
      fixResult.value = {
        type: 'success',
        message: '未发现需要修复的问题',
        details:
          skippedLocations.length > 0
            ? [
                `跳过的据点: ${skippedLocations.slice(0, 5).join('、')}${skippedLocations.length > 5 ? ` 等 ${skippedLocations.length} 个` : ''}`,
              ]
            : undefined,
      };
    }

    console.log('✅ 修复完成');
  } catch (error) {
    console.error('❌ 修复失败:', error);
    fixResult.value = {
      type: 'error',
      message: `修复失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  } finally {
    isFixing.value = false;
  }
}
</script>

<style scoped lang="scss">
.debug-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11000;
  animation: fadeIn 0.3s ease;
}

.debug-panel {
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

.debug-section {
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

.debug-item {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.debug-desc {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .desc-text {
    color: #f0e6d2;
    font-weight: 600;
    font-size: 14px;
  }

  .desc-detail {
    color: #9ca3af;
    font-size: 12px;
    line-height: 1.5;
  }
}

.debug-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(67, 56, 202, 0.98));
  border: 2px solid rgba(139, 92, 246, 0.6);
  border-radius: 8px;
  color: #c4b5fd;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(124, 58, 237, 0.9));
    border-color: rgba(167, 139, 250, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.fix-result {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid;
  animation: fadeIn 0.3s ease;

  &.success {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.5);
  }

  &.error {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.5);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .result-icon {
      font-size: 18px;
    }

    .result-title {
      color: #f0e6d2;
      font-weight: 600;
      font-size: 14px;
    }
  }

  .result-content {
    .result-details {
      margin-top: 8px;
      padding-left: 20px;
      color: #9ca3af;
      font-size: 12px;
      line-height: 1.6;

      li {
        margin-bottom: 4px;
      }
    }
  }
}

.character-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;

  .select-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .select-label {
    color: #f0e6d2;
    font-size: 14px;
    font-weight: 600;
  }

  .refresh-btn {
    padding: 6px 12px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(67, 56, 202, 0.8));
    border: 1px solid rgba(139, 92, 246, 0.5);
    border-radius: 6px;
    color: #c4b5fd;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

    &:hover {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(124, 58, 237, 0.9));
      border-color: rgba(167, 139, 250, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4);
    }
  }

  .character-select {
    padding: 10px 12px;
    background: rgba(40, 26, 20, 0.8);
    border: 2px solid rgba(205, 133, 63, 0.4);
    border-radius: 8px;
    color: #f0e6d2;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(205, 133, 63, 0.6);
    }

    &:focus {
      outline: none;
      border-color: rgba(205, 133, 63, 0.8);
    }

    option {
      background: rgba(40, 26, 20, 0.95);
      color: #f0e6d2;
    }
  }

  .empty-hint {
    margin-top: 12px;
    padding: 12px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .hint-icon {
      font-size: 16px;
      margin-right: 6px;
    }

    .hint-text {
      color: #c4b5fd;
      font-weight: 600;
      font-size: 13px;
    }

    .hint-detail {
      color: #9ca3af;
      font-size: 12px;
      line-height: 1.6;
      margin-left: 22px;
    }

    .hint-warning {
      color: #fbbf24;
      font-weight: 600;
    }
  }
}

.character-edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  background: rgba(40, 26, 20, 0.3);
  border: 2px solid rgba(205, 133, 63, 0.3);
  border-radius: 8px;

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .form-label {
      color: #ffd7a1;
      font-size: 13px;
      font-weight: 600;
    }

    .form-input,
    .form-select {
      padding: 8px 12px;
      background: rgba(40, 26, 20, 0.8);
      border: 2px solid rgba(205, 133, 63, 0.4);
      border-radius: 6px;
      color: #f0e6d2;
      font-size: 14px;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: rgba(205, 133, 63, 0.8);
      }

      &[type='number'] {
        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          opacity: 1;
        }
      }
    }

    .form-select {
      cursor: pointer;

      &:hover {
        border-color: rgba(205, 133, 63, 0.6);
      }

      option {
        background: rgba(40, 26, 20, 0.95);
        color: #f0e6d2;
      }
    }

    .form-textarea {
      padding: 8px 12px;
      background: rgba(40, 26, 20, 0.8);
      border: 2px solid rgba(205, 133, 63, 0.4);
      border-radius: 6px;
      color: #f0e6d2;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 60px;
      transition: all 0.2s ease;
      line-height: 1.5;

      &:focus {
        outline: none;
        border-color: rgba(205, 133, 63, 0.8);
      }

      &::placeholder {
        color: rgba(240, 230, 210, 0.4);
      }
    }
  }
}
</style>
