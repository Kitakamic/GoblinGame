<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content character-detail-modal" @click.stop>
      <div class="modal-header">
        <div class="header-left"></div>
        <h4 class="character-title">{{ internalCharacter?.name }}</h4>
        <div class="header-right">
          <button
            class="edit-avatar-btn"
            title="编辑头像"
            @click="internalCharacter && $emit('edit-avatar', internalCharacter)"
          >
            <span class="btn-icon">🖼️</span>
          </button>
          <button class="edit-json-btn" title="编辑JSON" @click="openJsonEditor">
            <span class="btn-icon">⚙️</span>
          </button>
          <button class="close-btn" @click="close">×</button>
        </div>
      </div>
      <div v-if="internalCharacter" class="modal-body">
        <div class="character-detail-content">
          <!-- 人物基础信息展示 -->
          <div class="character-basic-info">
            <!-- 左侧头像 -->
            <div class="character-avatar" :class="`rating-${(internalCharacter.rating || 'D').toLowerCase()}`">
              <div class="avatar-container">
                <img
                  v-if="getCurrentAvatar(internalCharacter)"
                  :src="getCurrentAvatar(internalCharacter)"
                  :alt="internalCharacter.name"
                />
                <div v-else class="default-avatar">
                  <span class="avatar-icon">👤</span>
                </div>
                <div class="avatar-status" :class="internalCharacter.status">
                  {{ getStatusText(internalCharacter.status) }}
                </div>
                <!-- 评级徽章 -->
                <div class="rating-badge-overlay" :class="internalCharacter.rating.toLowerCase()">
                  {{ internalCharacter.rating }}
                </div>

                <!-- 等级标签 -->
                <div class="character-level-badge">
                  <span class="level-icon">LV.</span>
                  <span class="level-value">{{
                    internalCharacter.level ?? Math.floor((internalCharacter.offspring ?? 0) / 10) ?? 1
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 右侧基础信息 -->
            <div class="character-details">
              <div class="basic-info-section">
                <h4>基本信息</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">身份：</span>
                    <span class="info-value">{{ internalCharacter.title }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">种族：</span>
                    <span class="info-value">{{ internalCharacter.race }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">年龄：</span>
                    <span class="info-value">{{ internalCharacter.age }}岁</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">国家：</span>
                    <span class="info-value">{{ internalCharacter.country }}</span>
                  </div>
                </div>
              </div>

              <div v-if="internalCharacter.appearance" class="appearance-info-section">
                <div class="appearance-grid">
                  <div class="appearance-item">
                    <span class="appearance-label">身高：</span>
                    <span class="appearance-value">{{ internalCharacter.appearance.height }}cm</span>
                  </div>
                  <div class="appearance-item">
                    <span class="appearance-label">体重：</span>
                    <span class="appearance-value">{{ internalCharacter.appearance.weight }}kg</span>
                  </div>
                  <div class="appearance-item">
                    <span class="appearance-label">三围：</span>
                    <span class="appearance-value">{{ internalCharacter.appearance.measurements }}</span>
                  </div>
                  <div v-if="internalCharacter.appearance.cupSize" class="appearance-item">
                    <span class="appearance-label">罩杯：</span>
                    <span class="appearance-value">{{ internalCharacter.appearance.cupSize }}</span>
                  </div>
                </div>
              </div>

              <!-- 性格特征 -->
              <div
                v-if="internalCharacter.personality && internalCharacter.personality.length > 0"
                class="personality-section"
              >
                <div
                  class="personality-traits"
                  :class="{ locked: !getUnlockStatus(internalCharacter.loyalty).personality }"
                >
                  <span v-for="trait in internalCharacter.personality" :key="trait" class="personality-trait">{{
                    trait
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 详细属性 -->
          <div class="detail-right">
            <!-- 外貌描述 -->
            <div v-if="internalCharacter.appearance && internalCharacter.appearance.description" class="detail-section">
              <div class="appearance-description">
                <div class="appearance-text-container" style="position: relative; overflow: visible">
                  <p
                    class="appearance-text"
                    style="
                      color: #f0e6d2;
                      font-size: 11px;
                      line-height: 1.6;
                      margin: 0;
                      font-style: italic;
                      text-align: justify;
                      letter-spacing: 0.5px;
                      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                      background: linear-gradient(135deg, rgba(240, 230, 210, 0.1), rgba(240, 230, 210, 0.05));
                      padding: 8px 12px;
                      border-radius: 6px;
                      border-left: 3px solid rgba(205, 133, 63, 0.3);
                      position: relative;
                      z-index: 1;
                    "
                  >
                    {{ internalCharacter.appearance.description }}
                  </p>
                  <div class="appearance-shimmer"></div>
                </div>
              </div>
            </div>

            <div class="detail-stats">
              <div class="stat-detail">
                <div class="stat-label">
                  <span class="stat-icon">💖</span>
                  堕落值
                  <span v-if="internalCharacter.loyalty >= 100" class="max-corruption-badge">已堕落</span>
                </div>
                <div
                  class="stat-bar-detail corruption-bar"
                  :class="{ 'max-corruption': internalCharacter.loyalty >= 100 }"
                >
                  <div
                    class="stat-fill-detail corruption-fill"
                    :style="{ width: internalCharacter.loyalty + '%' }"
                    :class="getLoyaltyClass(internalCharacter.loyalty)"
                  ></div>
                </div>
                <div
                  class="stat-value-detail corruption-value"
                  :class="{ 'max-corruption-text': internalCharacter.loyalty >= 100 }"
                >
                  {{ internalCharacter.loyalty }}%
                  <span v-if="internalCharacter.loyalty >= 100" class="max-corruption-icon">🔥</span>
                </div>
              </div>
              <div class="stat-detail">
                <div class="stat-label">
                  <span class="stat-icon">💪</span>
                  体力
                </div>
                <div class="stat-bar-detail">
                  <div
                    class="stat-fill-detail"
                    :style="{ width: (internalCharacter.stamina / (internalCharacter.maxStamina || 200)) * 100 + '%' }"
                    :class="getStaminaClass(internalCharacter.stamina, internalCharacter.maxStamina || 200)"
                  ></div>
                </div>
                <div class="stat-value-detail">
                  {{ internalCharacter.stamina }}/{{ internalCharacter.maxStamina || 200 }}
                </div>
              </div>
              <div class="stat-detail">
                <div class="stat-label">
                  <span class="stat-icon">🤱</span>
                  生育值
                </div>
                <div class="stat-bar-detail">
                  <div
                    class="stat-fill-detail"
                    :style="{
                      width: (internalCharacter.fertility / (internalCharacter.maxFertility || 200)) * 100 + '%',
                    }"
                    :class="getFertilityClass(internalCharacter.fertility, internalCharacter.maxFertility || 200)"
                  ></div>
                </div>
                <div class="stat-value-detail">
                  {{ internalCharacter.fertility }}/{{ internalCharacter.maxFertility || 200 }}
                </div>
              </div>
              <div class="stat-detail">
                <div class="stat-label">
                  <span class="stat-icon">👶</span>
                  后代数量
                </div>
                <div class="stat-value-detail">{{ internalCharacter.offspring }}</div>
              </div>

              <!-- 生育记录显示 -->
              <div
                v-if="internalCharacter.breedingRecords && internalCharacter.breedingRecords.length > 0"
                class="breeding-records"
              >
                <h4>
                  <span class="section-icon">👶</span>
                  生育记录
                </h4>
                <div class="breeding-stats">
                  <div
                    v-for="(count, type) in getBreedingStats(internalCharacter.breedingRecords)"
                    :key="type"
                    class="breeding-stat"
                  >
                    <span class="goblin-type">{{ type }}</span>
                    <span class="goblin-count">x{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 衣着信息 -->
            <div v-if="internalCharacter.appearance?.clothing" class="detail-section clothing-section">
              <h4 class="expandable-header" @click="isClothingExpanded = !isClothingExpanded">
                <span class="section-icon">👗</span>
                衣着装扮
                <span class="expand-icon" :class="{ expanded: isClothingExpanded }">▼</span>
              </h4>
              <div v-show="isClothingExpanded" class="clothing-grid">
                <div class="clothing-item">
                  <div class="clothing-icon">👑</div>
                  <div class="clothing-content">
                    <div class="clothing-label">头部</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.head || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">👕</div>
                  <div class="clothing-content">
                    <div class="clothing-label">上装</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.top || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">👖</div>
                  <div class="clothing-content">
                    <div class="clothing-label">下装</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.bottom || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">🧦</div>
                  <div class="clothing-content">
                    <div class="clothing-label">袜子</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.socks || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">👠</div>
                  <div class="clothing-content">
                    <div class="clothing-label">鞋子</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.shoes || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">🩱</div>
                  <div class="clothing-content">
                    <div class="clothing-label">内衣</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.underwear || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">💎</div>
                  <div class="clothing-content">
                    <div class="clothing-label">装饰</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.accessories || '无' }}</div>
                  </div>
                </div>
                <div class="clothing-item">
                  <div class="clothing-icon">🎀</div>
                  <div class="clothing-content">
                    <div class="clothing-label">玩具</div>
                    <div class="clothing-text">{{ internalCharacter.appearance.clothing.toys || '无' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 人生经历（10%） -->
            <div
              v-if="internalCharacter.lifeStory"
              class="detail-section"
              :class="{ locked: !getUnlockStatus(internalCharacter.loyalty).lifeStory }"
            >
              <h4>
                <span class="section-icon">📖</span>
                人生经历
                <span v-if="!getUnlockStatus(internalCharacter.loyalty).lifeStory" class="lock-icon">🔒</span>
              </h4>
              <div v-if="getUnlockStatus(internalCharacter.loyalty).lifeStory">
                <div
                  v-if="internalCharacter.lifeStory.childhood && internalCharacter.lifeStory.childhood.length > 0"
                  class="life-story-item"
                >
                  <strong>童年：</strong>
                  <p class="detail-text">{{ internalCharacter.lifeStory.childhood.join(' ') }}</p>
                </div>
                <div
                  v-if="internalCharacter.lifeStory.adolescence && internalCharacter.lifeStory.adolescence.length > 0"
                  class="life-story-item"
                >
                  <strong>青年：</strong>
                  <p class="detail-text">{{ internalCharacter.lifeStory.adolescence.join(' ') }}</p>
                </div>
                <div
                  v-if="internalCharacter.lifeStory.adulthood && internalCharacter.lifeStory.adulthood.length > 0"
                  class="life-story-item"
                >
                  <strong>成年：</strong>
                  <p class="detail-text">{{ internalCharacter.lifeStory.adulthood.join(' ') }}</p>
                </div>
                <div
                  v-if="internalCharacter.lifeStory.currentState && internalCharacter.lifeStory.currentState.length > 0"
                  class="life-story-item"
                >
                  <strong>当前：</strong>
                  <p class="detail-text">{{ internalCharacter.lifeStory.currentState.join(' ') }}</p>
                </div>
              </div>
              <div v-else class="locked-content">
                <div class="lock-message">
                  <span class="lock-icon">🔒</span>
                  <p>需要堕落值达到10%才能查看人生经历</p>
                </div>
              </div>
            </div>

            <!-- 性经验（30%） -->
            <div
              v-if="internalCharacter.sexExperience"
              class="detail-section"
              :class="{ locked: !getUnlockStatus(internalCharacter.loyalty).sensitivePoints }"
            >
              <h4>
                <span class="section-icon">💕</span>
                性经验
                <span v-if="!getUnlockStatus(internalCharacter.loyalty).sensitivePoints" class="lock-icon">🔒</span>
              </h4>
              <div v-if="getUnlockStatus(internalCharacter.loyalty).sensitivePoints">
                <p class="detail-text">{{ internalCharacter.sexExperience }}</p>
              </div>
              <div v-else class="locked-content">
                <div class="lock-message">
                  <span class="lock-icon">🔒</span>
                  <p>需要堕落值达到30%才能查看性经验</p>
                </div>
              </div>
            </div>

            <!-- 敏感点详细信息（30%） -->
            <div
              v-if="getSensitivePoint(character)"
              class="detail-section"
              :class="{ locked: !getUnlockStatus(internalCharacter.loyalty).sensitivePoints }"
            >
              <h4>
                <span class="section-icon">🔍</span>
                敏感点详情
                <span v-if="!getUnlockStatus(internalCharacter.loyalty).sensitivePoints" class="lock-icon">🔒</span>
              </h4>
              <div v-if="getUnlockStatus(internalCharacter.loyalty).sensitivePoints" class="sensitive-details">
                <div class="sensitive-detail-item">
                  <div class="sensitive-detail-header">
                    <span class="sensitive-part">{{ getSensitivePoint(character)?.part }}</span>
                    <span class="sensitive-status active">敏感</span>
                  </div>
                  <p v-if="getSensitivePoint(character)?.description" class="sensitive-description">
                    {{ getSensitivePoint(character)?.description }}
                  </p>
                </div>
              </div>
              <div v-else class="locked-content">
                <div class="lock-message">
                  <span class="lock-icon">🔒</span>
                  <p>需要堕落值达到30%才能查看敏感点详情</p>
                </div>
              </div>
            </div>

            <div
              v-if="internalCharacter.fears"
              class="detail-section"
              :class="{ locked: !getUnlockStatus(internalCharacter.loyalty).fearsAndSecrets }"
            >
              <h4>
                <span class="section-icon">😨</span>
                恐惧
                <span v-if="!getUnlockStatus(internalCharacter.loyalty).fearsAndSecrets" class="lock-icon">🔒</span>
              </h4>
              <div v-if="getUnlockStatus(internalCharacter.loyalty).fearsAndSecrets">
                <p class="detail-text">{{ internalCharacter.fears }}</p>
              </div>
              <div v-else class="locked-content">
                <div class="lock-message">
                  <span class="lock-icon">🔒</span>
                  <p>需要堕落值达到40%才能查看恐惧信息</p>
                </div>
              </div>
            </div>

            <div
              v-if="internalCharacter.secrets"
              class="detail-section"
              :class="{ locked: !getUnlockStatus(internalCharacter.loyalty).fearsAndSecrets }"
            >
              <h4>
                <span class="section-icon">🤫</span>
                秘密
                <span v-if="!getUnlockStatus(internalCharacter.loyalty).fearsAndSecrets" class="lock-icon">🔒</span>
              </h4>
              <div v-if="getUnlockStatus(internalCharacter.loyalty).fearsAndSecrets">
                <p class="detail-text">{{ internalCharacter.secrets }}</p>
              </div>
              <div v-else class="locked-content">
                <div class="lock-message">
                  <span class="lock-icon">🔒</span>
                  <p>需要堕落值达到40%才能查看秘密信息</p>
                </div>
              </div>
            </div>

            <div v-if="internalCharacter.locationId || internalCharacter.capturedAt" class="detail-section">
              <h4>
                <span class="section-icon">ℹ️</span>
                其他信息
              </h4>
              <div v-if="internalCharacter.locationId" class="other-info-item">
                <strong>来源据点：</strong>
                <span class="detail-text">{{ getLocationName(internalCharacter.locationId) }}</span>
              </div>
              <div v-if="internalCharacter.capturedAt" class="other-info-item">
                <strong>被俘获时间：</strong>
                <span class="detail-text">{{ formatCapturedTime(internalCharacter.capturedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- JSON编辑器弹窗 -->
    <CharacterJSONEditor
      :show="showJsonEditor"
      :character="internalCharacter"
      @close="closeJsonEditor"
      @character-updated="handleCharacterUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { AvatarSwitchService } from '../../功能模块层/人物管理/服务/头像切换服务';
import type { Character } from '../../功能模块层/人物管理/类型/人物类型';
import { modularSaveManager } from '../../核心层/服务/存档系统/模块化存档服务';
import { TimeParseService } from '../../核心层/服务/通用服务/时间解析服务';
import { BreedingService } from '../../核心层/服务/通用服务/生育服务';
// 导入本地组件
import CharacterJSONEditor from './人物信息JSON编辑界面.vue';

// 定义组件属性
interface Props {
  show: boolean;
  character: Character | null;
}

// 定义组件事件
interface Emits {
  (e: 'close'): void;
  (e: 'start-training', character: Character): void;
  (e: 'edit-avatar', character: Character): void;
  (e: 'execute', character: Character): void;
  (e: 'character-updated', character: Character): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 内部人物数据，用于响应式更新
const internalCharacter = ref<Character | null>(null);

// 监听 props.character 变化，同步到内部数据
watch(
  () => props.character,
  newCharacter => {
    if (newCharacter) {
      // 使用深拷贝确保响应式更新
      internalCharacter.value = JSON.parse(JSON.stringify(newCharacter));
    } else {
      internalCharacter.value = null;
    }
  },
  { immediate: true, deep: false },
);

// 衣着栏展开状态
const isClothingExpanded = ref(false);

// JSON编辑器状态
const showJsonEditor = ref(false);

// 打开JSON编辑器
const openJsonEditor = () => {
  if (!internalCharacter.value) return;
  showJsonEditor.value = true;
};

// 关闭JSON编辑器
const closeJsonEditor = () => {
  showJsonEditor.value = false;
};

// 处理JSON编辑器更新的人物数据
const handleCharacterUpdated = (updatedCharacter: Character) => {
  // 更新内部人物数据，确保界面立即刷新
  internalCharacter.value = JSON.parse(JSON.stringify(updatedCharacter));
  // 通知父组件更新人物数据
  emit('character-updated', updatedCharacter);
};

// 关闭弹窗
const close = () => {
  emit('close');
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    imprisoned: '关押中',
    training: '调教中',
    breeding: '交配中',
    surrendered: '已堕落',
    deployed: '已编制',
  };
  return statusMap[status] || '未知';
};

// 获取当前应该显示的头像
const getCurrentAvatar = (character: Character | null): string | undefined => {
  if (!character) return undefined;
  return AvatarSwitchService.getAvatarByCorruptionLevel(character);
};

// 获取堕落值样式类
const getLoyaltyClass = (loyalty: number) => {
  if (loyalty >= 80) return 'high';
  if (loyalty >= 50) return 'medium';
  return 'low';
};

// 获取体力样式类
const getStaminaClass = (stamina: number, maxStamina: number) => {
  const percentage = (stamina / maxStamina) * 100;
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
};

// 获取生育值样式类
const getFertilityClass = (fertility: number, maxFertility: number) => {
  const percentage = (fertility / maxFertility) * 100;
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
};

// 获取生育统计
const getBreedingStats = (breedingRecords: any[]) => {
  return BreedingService.getBreedingStats(breedingRecords);
};

// 获取敏感点（只返回敏感的那个部位）
const getSensitivePoint = (character: Character | null) => {
  if (!character?.sensitivePointsDetail) return null;
  return character.sensitivePointsDetail.find(p => p.isSensitive) || null;
};

// 基于堕落值的解锁系统
const getUnlockStatus = (loyalty: number) => {
  return {
    lifeStory: loyalty >= 10, // 10% 解锁人生经历
    personality: loyalty >= 20, // 20% 解锁性格
    sensitivePoints: loyalty >= 30, // 30% 解锁敏感点信息
    fearsAndSecrets: loyalty >= 40, // 40% 解锁恐惧和秘密
  };
};

// 获取据点名称
const getLocationName = (locationId?: string): string => {
  if (!locationId) return '';

  // 如果是交配间ID，直接返回
  if (locationId.startsWith('breeding-')) {
    return `交配间 ${locationId.replace('breeding-', '')}`;
  }

  // 从探索数据中获取据点名称
  try {
    const exploreData = modularSaveManager.getModuleData({ moduleName: 'exploration' }) as any;
    if (exploreData && exploreData.locations) {
      const location = exploreData.locations.find((loc: any) => loc.id === locationId);
      return location ? location.name : locationId;
    }
  } catch (error) {
    console.warn('获取据点名称失败:', error);
  }

  return locationId;
};

// 格式化捕获时间
const formatCapturedTime = (capturedAt?: Date | string): string => {
  if (!capturedAt) return '';

  // 如果已经是格式化的游戏时间字符串，直接返回
  if (typeof capturedAt === 'string') {
    return capturedAt;
  }

  // 如果是Date对象（兼容旧数据），转换为游戏时间格式
  // 这种情况下我们无法准确知道捕获时的游戏时间，所以使用当前游戏时间
  const currentRounds = modularSaveManager.resources.value.rounds;
  const timeInfo = TimeParseService.getTimeInfo(currentRounds);
  return timeInfo.formattedDate;
};
</script>

<style scoped lang="scss">
// 弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow: hidden; // 防止滚动条闪烁
}

// 人物详情弹窗样式
.character-detail-modal {
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  // 防止滚动条闪烁
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 133, 63, 0.5) transparent;
  // 确保稳定的布局
  will-change: auto;
  transform: translateZ(0);
  scrollbar-gutter: stable both-edges;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(205, 133, 63, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(205, 133, 63, 0.7);
  }

  .character-detail-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
    // 防止内容变化导致高度闪烁
    contain: layout;

    // 人物基础信息展示
    .character-basic-info {
      display: flex;
      flex-direction: row;
      gap: 16px;
      padding: 12px;
      background: rgba(40, 26, 20, 0.4);
      border-radius: 8px;
      border: 1px solid rgba(205, 133, 63, 0.3);

      // 左侧头像区域
      .character-avatar {
        flex: 0 0 110px;
        height: 220px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: 8px;
        border: 2px solid rgba(205, 133, 63, 0.3);
        background: rgba(40, 26, 20, 0.2);
        position: relative;

        // 评级边框颜色
        &.rating-s {
          border: 3px solid rgba(220, 20, 60, 0.9);
          box-shadow:
            0 0 25px rgba(220, 20, 60, 0.6),
            0 0 50px rgba(220, 20, 60, 0.3);
          animation: sRatingGlow 2s ease-in-out infinite alternate;
        }
        &.rating-a {
          border: 3px solid rgba(255, 215, 0, 0.8);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
        }
        &.rating-b {
          border: 3px solid rgba(192, 192, 192, 0.8);
          box-shadow: 0 0 15px rgba(192, 192, 192, 0.4);
        }
        &.rating-c {
          border: 3px solid rgba(32, 32, 32, 0.8);
          box-shadow: 0 0 10px rgba(64, 64, 64, 0.3);
        }
        &.rating-d {
          border: 2px solid rgba(205, 133, 63, 0.3);
        }

        .avatar-container {
          width: 100%;
          flex: 1;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            flex: 1;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(40, 26, 20, 0.6);
            color: #cd853f;
            flex: 1;

            .avatar-icon {
              font-size: 32px;
            }
          }
        }

        .avatar-status {
          position: absolute;
          bottom: 4px;
          right: 4px;
          font-size: 8px;
          padding: 2px 4px;
          border-radius: 3px;
          text-align: center;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(2px);
          z-index: 2;

          &.imprisoned {
            background: rgba(34, 197, 94, 0.8);
            color: #fff;
          }
          &.training {
            background: rgba(245, 158, 11, 0.8);
            color: #fff;
          }
          &.breeding {
            background: rgba(168, 85, 247, 0.8);
            color: #fff;
          }
          &.surrendered {
            background: rgba(236, 72, 153, 0.8);
            color: #fff;
          }
          &.deployed {
            background: rgba(59, 130, 246, 0.8);
            color: #fff;
          }
        }

        // 评级徽章覆盖层
        .rating-badge-overlay {
          position: absolute;
          top: 4px;
          left: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
          text-align: center;
          backdrop-filter: blur(2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          z-index: 3;

          &.s {
            background: linear-gradient(135deg, #dc143c, #ff4757);
            color: #fff;
            box-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
            animation: sRatingGlow 2s ease-in-out infinite alternate;
          }
          &.a {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #000;
            box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
          }
          &.b {
            background: linear-gradient(135deg, #c0c0c0, #e0e0e0);
            color: #000;
            box-shadow: 0 0 4px rgba(192, 192, 192, 0.4);
          }
          &.c {
            background: linear-gradient(135deg, #202020, #404040);
            color: #fff;
            box-shadow: 0 0 3px rgba(64, 64, 64, 0.3);
          }
          &.d {
            background: linear-gradient(135deg, #cd853f, #daa520);
            color: #fff;
          }
        }

        // 等级标签
        .character-level-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 600;
          text-align: center;
          z-index: 3;
          background: rgba(255, 215, 0, 0.9);
          color: #000;
          display: flex;
          align-items: center;
          gap: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

          .level-icon {
            font-size: 7px;
          }

          .level-value {
            font-size: 8px;
            font-weight: 700;
          }
        }
      }

      // 右侧详细信息区域
      .character-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .basic-info-section {
          h4 {
            color: #ffd7a1;
            font-size: 14px;
            margin: 0 0 8px 0;
            font-weight: 600;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;

            .info-item {
              display: flex;
              flex-direction: column;
              gap: 2px;

              .info-label {
                color: #cd853f;
                font-size: 10px;
                font-weight: 600;
              }

              .info-value {
                color: #f0e6d2;
                font-size: 11px;

                &.rating-s {
                  color: #dc143c;
                  text-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
                }
                &.rating-a {
                  color: #ffd700;
                }
                &.rating-b {
                  color: #c0c0c0;
                }
                &.rating-c {
                  color: #202020;
                }
                &.rating-d {
                  color: #cd853f;
                }

                // 评级徽章样式
                &.rating-badge {
                  display: inline-block;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 9px;
                  font-weight: 600;
                  color: #fff;

                  &.s {
                    background: linear-gradient(135deg, #dc143c, #ff4757);
                    color: #fff;
                    box-shadow: 0 0 8px rgba(220, 20, 60, 0.6);
                    animation: sRatingGlow 2s ease-in-out infinite alternate;
                  }
                  &.a {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #000;
                    box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
                  }
                  &.b {
                    background: linear-gradient(135deg, #c0c0c0, #e0e0e0);
                    color: #000;
                    box-shadow: 0 0 4px rgba(192, 192, 192, 0.4);
                  }
                  &.c {
                    background: linear-gradient(135deg, #202020, #404040);
                    color: #fff;
                    box-shadow: 0 0 3px rgba(64, 64, 64, 0.3);
                  }
                  &.d {
                    background: linear-gradient(135deg, #cd853f, #daa520);
                    color: #fff;
                  }
                }

                // 状态徽章样式
                &.status-badge {
                  display: inline-block;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 9px;
                  font-weight: 600;

                  &.imprisoned {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                  }
                  &.training {
                    background: rgba(245, 158, 11, 0.2);
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.3);
                  }
                  &.breeding {
                    background: rgba(168, 85, 247, 0.2);
                    color: #a855f7;
                    border: 1px solid rgba(168, 85, 247, 0.3);
                  }
                  &.surrendered {
                    background: rgba(236, 72, 153, 0.2);
                    color: #ec4899;
                    border: 1px solid rgba(236, 72, 153, 0.3);
                  }
                  &.deployed {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                  }
                  &.uncaptured {
                    background: rgba(220, 38, 38, 0.2);
                    color: #dc2626;
                    border: 1px solid rgba(220, 38, 38, 0.3);
                  }
                }
              }
            }
          }
        }

        .appearance-info-section {
          h4 {
            color: #ffd7a1;
            font-size: 14px;
            margin: 0 0 8px 0;
            font-weight: 600;
          }

          .appearance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;

            .appearance-item {
              display: flex;
              flex-direction: column;
              gap: 2px;

              .appearance-label {
                color: #cd853f;
                font-size: 10px;
                font-weight: 600;
              }

              .appearance-value {
                color: #f0e6d2;
                font-size: 10px;
              }
            }
          }

          .appearance-description {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(205, 133, 63, 0.2);

            .appearance-text {
              color: #f0e6d2 !important;
              font-size: 11px !important;
              line-height: 1.6 !important;
              margin: 0 !important;
              font-style: italic !important;
              text-align: justify !important;
              letter-spacing: 0.5px !important;
              text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
              background: linear-gradient(135deg, rgba(240, 230, 210, 0.1), rgba(240, 230, 210, 0.05)) !important;
              padding: 8px 12px !important;
              border-radius: 6px !important;
              border-left: 3px solid rgba(205, 133, 63, 0.3) !important;
              position: relative !important;
              overflow: hidden !important;
              display: block !important;
            }

            .appearance-shimmer {
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              animation: textShimmer 3s infinite;
              z-index: 2;
              pointer-events: none;
            }
          }
        }

        .personality-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(205, 133, 63, 0.2);

          .personality-traits {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            position: relative;

            &.locked {
              filter: blur(2px);
              opacity: 0.6;
            }

            .personality-trait {
              background: rgba(168, 85, 247, 0.2);
              color: #a855f7;
              border: 1px solid rgba(168, 85, 247, 0.3);
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
              transition: all 0.3s ease;
            }
          }
        }
      }
    }

    .detail-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: visible;
      min-height: 0;
      // 防止滚动条闪烁
      scrollbar-width: thin;
      scrollbar-color: rgba(205, 133, 63, 0.3) transparent;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(205, 133, 63, 0.3);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb:hover {
        background: rgba(205, 133, 63, 0.5);
      }

      .detail-stats {
        padding: 12px;
        background: rgba(40, 26, 20, 0.3);
        border-radius: 6px;
        border: 1px solid rgba(205, 133, 63, 0.2);

        h4 {
          color: #ffd7a1;
          font-size: 16px;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;

          .section-icon {
            font-size: 14px;
            opacity: 0.8;
          }
        }

        .stat-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          .stat-label {
            color: #f0e6d2;
            font-size: 12px;
            min-width: 80px;
            display: flex;
            align-items: center;
            gap: 4px;

            .stat-icon {
              font-size: 14px;
              opacity: 0.8;
            }

            .max-corruption-badge {
              background: linear-gradient(135deg, #ff6b35, #ff8c42);
              color: #fff;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 700;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
              box-shadow: 0 2px 4px rgba(255, 107, 53, 0.4);
              animation: badgeGlow 2s ease-in-out infinite alternate;
              margin-left: 4px;
            }
          }

          .stat-bar-detail {
            flex: 1;
            height: 8px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 4px;
            overflow: hidden;

            .stat-fill-detail {
              height: 100%;
              transition: width 0.3s ease;

              &.high {
                background: linear-gradient(90deg, #22c55e, #16a34a);
              }

              &.medium {
                background: linear-gradient(90deg, #f59e0b, #d97706);
              }

              &.low {
                background: linear-gradient(90deg, #dc2626, #b91c1c);
              }
            }

            // 堕落值特殊样式
            &.corruption-bar {
              background: rgba(236, 72, 153, 0.1);
              border: 1px solid rgba(236, 72, 153, 0.2);
              border-radius: 6px;
              position: relative;
              overflow: hidden;

              &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 30%, rgba(236, 72, 153, 0.1) 50%, transparent 70%);
                animation: corruptionShimmer 3s infinite;
              }

              // 最大堕落值特殊效果
              &.max-corruption {
                background: rgba(255, 107, 53, 0.2);
                border: 2px solid rgba(255, 107, 53, 0.6);
                box-shadow: 0 0 12px rgba(255, 107, 53, 0.4);

                &::before {
                  background: linear-gradient(45deg, transparent 20%, rgba(255, 107, 53, 0.3) 50%, transparent 80%);
                  animation: maxCorruptionShimmer 2s infinite;
                }
              }
            }

            .corruption-fill {
              background: linear-gradient(90deg, #ec4899, #be185d, #9d174d);
              position: relative;
              overflow: hidden;
              box-shadow: 0 0 8px rgba(236, 72, 153, 0.4);

              &::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                animation: corruptionGlow 2s infinite;
              }

              &.high {
                background: linear-gradient(90deg, #ec4899, #be185d, #9d174d);
                box-shadow: 0 0 12px rgba(236, 72, 153, 0.6);
              }

              &.medium {
                background: linear-gradient(90deg, #f472b6, #ec4899, #be185d);
                box-shadow: 0 0 8px rgba(236, 72, 153, 0.4);
              }

              &.low {
                background: linear-gradient(90deg, #f9a8d4, #f472b6, #ec4899);
                box-shadow: 0 0 6px rgba(236, 72, 153, 0.3);
              }
            }

            .corruption-value {
              color: #ec4899;
              font-weight: 700;
              text-shadow: 0 0 4px rgba(236, 72, 153, 0.5);

              &.max-corruption-text {
                color: #ff6b35;
                text-shadow: 0 0 8px rgba(255, 107, 53, 0.8);
                animation: maxCorruptionPulse 2s ease-in-out infinite;
              }

              .max-corruption-icon {
                margin-left: 4px;
                font-size: 12px;
                animation: fireGlow 1.5s ease-in-out infinite alternate;
              }
            }
          }

          .stat-value-detail {
            color: #ffe9d2;
            font-weight: 600;
            font-size: 12px;
            min-width: 40px;
            text-align: right;
          }
        }
      }

      // 生育记录样式
      .breeding-records {
        margin-top: 15px;
        padding: 10px;
        background: rgba(139, 69, 19, 0.1);
        border-radius: 8px;
        border: 1px solid rgba(139, 69, 19, 0.3);

        h4 {
          margin: 0 0 10px 0;
          color: #8b4513;
          font-size: 14px;
          font-weight: bold;
        }

        .breeding-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .breeding-stat {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(139, 69, 19, 0.2);
          border-radius: 4px;
          font-size: 12px;

          .goblin-type {
            color: #8b4513;
            font-weight: bold;
          }

          .goblin-count {
            color: #d2691e;
            font-weight: bold;
          }
        }
      }

      // 新增的详细信息样式
      .detail-section {
        padding: 10px;
        background: rgba(40, 26, 20, 0.4);
        border-radius: 6px;
        border: 1px solid rgba(205, 133, 63, 0.3);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        overflow: visible; // 允许内部动画显示

        // 锁定状态样式
        &.locked {
          background: rgba(40, 26, 20, 0.2);
          border: 1px solid rgba(100, 100, 100, 0.3);
          opacity: 0.7;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 40%, rgba(100, 100, 100, 0.1) 50%, transparent 60%);
            animation: lockShimmer 2s infinite;
            pointer-events: none;
          }

          h4 {
            color: #888;
            position: relative;

            .lock-icon {
              margin-left: 6px;
              font-size: 12px;
              opacity: 0.8;
              animation: lockPulse 1.5s infinite;
            }
          }
        }

        h4 {
          color: #ffd7a1;
          font-size: 12px;
          margin: 0 0 6px 0;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;

          .section-icon {
            font-size: 12px;
            opacity: 0.8;
          }
        }

        .detail-text {
          color: #f0e6d2;
          font-size: 11px;
          line-height: 1.3;
          margin: 0;
        }

        .sensitive-points,
        .personality-traits {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 6px;

          .sensitive-point,
          .personality-trait {
            background: rgba(205, 133, 63, 0.2);
            color: #ffd7a1;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 10px;
            border: 1px solid rgba(205, 133, 63, 0.3);
          }
        }

        // 敏感点详情样式
        .sensitive-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;

          .sensitive-detail-item {
            background: rgba(139, 69, 19, 0.1);
            border: 1px solid rgba(139, 69, 19, 0.3);
            border-radius: 6px;
            padding: 8px;
            transition: all 0.2s ease;

            &:hover {
              background: rgba(139, 69, 19, 0.15);
              border-color: rgba(139, 69, 19, 0.4);
            }

            .sensitive-detail-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;

              .sensitive-part {
                color: #8b4513;
                font-weight: 600;
                font-size: 11px;
              }

              .sensitive-status {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: 600;
                background: rgba(220, 38, 38, 0.2);
                color: #dc2626;
                border: 1px solid rgba(220, 38, 38, 0.3);

                &.active {
                  background: rgba(34, 197, 94, 0.2);
                  color: #22c55e;
                  border-color: rgba(34, 197, 94, 0.3);
                }
              }
            }

            .sensitive-description {
              color: #f0e6d2;
              font-size: 10px;
              line-height: 1.3;
              margin: 0;
              font-style: italic;
            }
          }
        }

        // 人生经历样式
        .life-story-item {
          margin-bottom: 6px;

          strong {
            color: #cd853f;
            font-size: 10px;
          }

          p {
            margin: 2px 0 0 0;
            font-size: 10px;
            line-height: 1.2;
          }
        }

        // 外貌信息样式
        .appearance-item {
          margin-bottom: 6px;

          strong {
            color: #cd853f;
            font-size: 10px;
          }

          p {
            margin: 2px 0 0 0;
            font-size: 10px;
            line-height: 1.2;
          }
        }

        // 其他信息样式
        .other-info-item {
          margin-bottom: 4px;

          strong {
            color: #cd853f;
            font-size: 10px;
          }

          .detail-text {
            font-size: 10px;
            margin-left: 4px;
          }
        }

        // 衣着栏样式
        &.clothing-section {
          .expandable-header {
            cursor: pointer;
            user-select: none;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;

            &:hover {
              color: #ffd7a1;
            }

            .expand-icon {
              font-size: 10px;
              transition: transform 0.2s ease;
              opacity: 0.7;

              &.expanded {
                transform: rotate(180deg);
              }
            }
          }

          .clothing-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin-top: 8px;

            .clothing-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px;
              background: rgba(139, 69, 19, 0.1);
              border: 1px solid rgba(139, 69, 19, 0.3);
              border-radius: 6px;
              transition: all 0.2s ease;

              &:hover {
                background: rgba(139, 69, 19, 0.15);
                border-color: rgba(139, 69, 19, 0.4);
                transform: translateY(-1px);
              }

              .clothing-icon {
                font-size: 16px;
                flex-shrink: 0;
                opacity: 0.8;
              }

              .clothing-content {
                flex: 1;
                min-width: 0;

                .clothing-label {
                  color: #cd853f;
                  font-size: 10px;
                  font-weight: 600;
                  margin-bottom: 2px;
                }

                .clothing-text {
                  color: #f0e6d2;
                  font-size: 10px;
                  line-height: 1.2;
                  word-break: break-word;
                }
              }
            }
          }
        }

        // 锁定内容样式
        .locked-content {
          .lock-message {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background: rgba(100, 100, 100, 0.1);
            border: 1px dashed rgba(100, 100, 100, 0.3);
            border-radius: 6px;
            text-align: center;
            margin-top: 8px;

            .lock-icon {
              font-size: 16px;
              opacity: 0.6;
              animation: lockPulse 1.5s infinite;
            }

            p {
              color: #888;
              font-size: 11px;
              margin: 0;
              font-style: italic;
            }
          }
        }
      }
    }
  }
}

.modal-content {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  padding: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(205, 133, 63, 0.2);
    position: relative;

    .header-left {
      flex: 1;
    }

    .character-title {
      margin: 0;
      color: #ffd7a1;
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      flex: 2;
      text-shadow:
        0 0 10px rgba(255, 215, 161, 0.5),
        0 0 20px rgba(255, 215, 161, 0.3),
        0 0 30px rgba(255, 215, 161, 0.1);
      background: linear-gradient(45deg, #ffd7a1, #ffed4e, #ffd7a1);
      background-size: 200% 200%;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: titleGlow 3s ease-in-out infinite;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      min-width: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      justify-content: flex-end;
    }

    .edit-avatar-btn,
    .edit-json-btn {
      background: linear-gradient(135deg, rgba(205, 133, 63, 0.2), rgba(139, 69, 19, 0.3));
      border: 1px solid rgba(205, 133, 63, 0.4);
      color: #ffd7a1;
      border-radius: 6px;
      padding: 6px 8px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin-right: 4px;

      &:hover {
        background: linear-gradient(135deg, rgba(205, 133, 63, 0.3), rgba(139, 69, 19, 0.4));
        border-color: rgba(205, 133, 63, 0.6);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }

      .btn-icon {
        font-size: 12px;
        opacity: 0.9;
      }
    }

    .close-btn {
      background: none;
      border: none;
      color: #f0e6d2;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: #ffd7a1;
      }
    }
  }
}

.action-btn {
  background: linear-gradient(180deg, #3a2a22, #2a201c);
  color: #ffe9d2;
  border: 1px solid rgba(205, 133, 63, 0.35);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 220, 180, 0.08);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow:
      0 6px 12px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 220, 180, 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: linear-gradient(180deg, #8a3c2c, #65261c);
    border-color: rgba(255, 120, 60, 0.5);
    box-shadow:
      0 6px 12px rgba(110, 30, 15, 0.35),
      inset 0 1px 0 rgba(255, 200, 150, 0.12);
  }

  &.danger {
    background: linear-gradient(180deg, #6d2c2c, #4a1f1f);
    border-color: rgba(255, 80, 80, 0.4);
    box-shadow:
      0 6px 12px rgba(80, 20, 20, 0.35),
      inset 0 1px 0 rgba(255, 150, 150, 0.08);
  }
}

// S级闪光动画
@keyframes sRatingGlow {
  0% {
    box-shadow:
      inset 0 1px 0 rgba(255, 100, 100, 0.2),
      0 0 10px rgba(220, 20, 60, 0.6),
      0 0 10px rgba(220, 20, 60, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.4);
  }
  10% {
    box-shadow:
      inset 0 1px 0 rgba(255, 100, 100, 0.3),
      0 0 10px rgba(220, 20, 60, 0.8),
      0 0 10px rgba(220, 20, 60, 0.5),
      0 4px 12px rgba(0, 0, 0, 0.4);
  }
}

// 锁定动画
@keyframes lockPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes lockShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 堕落值特效动画
@keyframes corruptionShimmer {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes corruptionGlow {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 文字闪烁动画
@keyframes textShimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// 标题发光动画
@keyframes titleGlow {
  0% {
    background-position: 0% 50%;
    text-shadow:
      0 0 10px rgba(255, 215, 161, 0.5),
      0 0 20px rgba(255, 215, 161, 0.3),
      0 0 30px rgba(255, 215, 161, 0.1);
  }
  50% {
    background-position: 100% 50%;
    text-shadow:
      0 0 15px rgba(255, 215, 161, 0.7),
      0 0 25px rgba(255, 215, 161, 0.5),
      0 0 35px rgba(255, 215, 161, 0.3);
  }
  100% {
    background-position: 0% 50%;
    text-shadow:
      0 0 10px rgba(255, 215, 161, 0.5),
      0 0 20px rgba(255, 215, 161, 0.3),
      0 0 30px rgba(255, 215, 161, 0.1);
  }
}

// 最大堕落值动画
@keyframes maxCorruptionPulse {
  0%,
  100% {
    color: #ff6b35;
    text-shadow: 0 0 8px rgba(255, 107, 53, 0.8);
  }
  50% {
    color: #ff8c42;
    text-shadow: 0 0 12px rgba(255, 140, 66, 1);
  }
}

@keyframes fireGlow {
  0% {
    filter: brightness(1);
    transform: scale(1);
  }
  100% {
    filter: brightness(1.3);
    transform: scale(1.1);
  }
}

@keyframes badgeGlow {
  0% {
    box-shadow: 0 2px 4px rgba(255, 107, 53, 0.4);
    background: linear-gradient(135deg, #ff6b35, #ff8c42);
  }
  100% {
    box-shadow: 0 4px 8px rgba(255, 107, 53, 0.6);
    background: linear-gradient(135deg, #ff8c42, #ffa726);
  }
}

@keyframes maxCorruptionShimmer {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .character-detail-modal {
    max-width: 95%;
    width: 95%;
    max-height: 90vh;

    .character-detail-content {
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-height: 0;

      .character-basic-info {
        flex-direction: row;
        gap: 8px;
        padding: 8px;

        .character-avatar {
          flex: 0 0 100px;
          height: auto;
          min-height: 240px;
          max-width: 100px;
          display: flex;
          flex-direction: column;
        }

        .character-details {
          flex: 1;
          min-width: 0;

          .basic-info-section {
            .info-grid {
              grid-template-columns: 1fr;
              gap: 0;

              .info-item {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 4px;

                .info-label {
                  font-size: 10px;
                  min-width: 35px;
                  flex-shrink: 0;
                }
                .info-value {
                  font-size: 11px;
                  flex: 1;
                  word-break: break-all;
                }
              }
            }
          }

          .appearance-info-section {
            .appearance-grid {
              grid-template-columns: 1fr;
              gap: 0;

              .appearance-item {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 4px;

                .appearance-label {
                  font-size: 10px;
                  min-width: 35px;
                  flex-shrink: 0;
                }
                .appearance-value {
                  font-size: 11px;
                  flex: 1;
                  word-break: break-all;
                }
              }
            }

            .appearance-description {
              margin-top: 6px;
              padding-top: 6px;
              border-top: 1px solid rgba(205, 133, 63, 0.2);

              .detail-text {
                font-size: 10px;
                line-height: 1.3;
                word-break: break-word;
              }
            }
          }
        }
      }

      .detail-right {
        flex: 1;
        min-height: 0;

        .detail-stats {
          padding: 8px;

          h4 {
            font-size: 14px;
            margin-bottom: 8px;
          }

          .stat-detail {
            margin-bottom: 6px;

            .stat-label {
              font-size: 11px;
              min-width: 70px;
            }

            .stat-value-detail {
              font-size: 11px;
              min-width: 35px;
            }
          }
        }

        .detail-section {
          padding: 8px;

          h4 {
            font-size: 13px;
            margin-bottom: 6px;
          }

          .detail-text {
            font-size: 12px;
            line-height: 1.4;
          }

          .sensitive-points,
          .personality-traits {
            gap: 3px;

            .sensitive-point,
            .personality-trait {
              font-size: 11px;
              padding: 2px 5px;
            }
          }

          .sensitive-details {
            .sensitive-detail-item {
              padding: 6px;

              .sensitive-detail-header {
                .sensitive-part {
                  font-size: 12px;
                }

                .sensitive-status {
                  font-size: 10px;
                  padding: 1px 4px;
                }
              }

              .sensitive-description {
                font-size: 11px;
                line-height: 1.3;
              }
            }
          }

          .life-story-item {
            strong {
              font-size: 11px;
            }

            p {
              font-size: 11px;
              line-height: 1.3;
            }
          }

          .appearance-item {
            strong {
              font-size: 11px;
            }

            p {
              font-size: 11px;
              line-height: 1.3;
            }
          }

          .other-info-item {
            strong {
              font-size: 11px;
            }

            .detail-text {
              font-size: 11px;
            }
          }

          // 衣着栏移动端样式
          &.clothing-section {
            .expandable-header {
              .expand-icon {
                font-size: 9px;
              }
            }

            .clothing-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 6px;

              .clothing-item {
                padding: 6px;
                gap: 6px;

                .clothing-icon {
                  font-size: 14px;
                }

                .clothing-content {
                  .clothing-label {
                    font-size: 11px;
                  }

                  .clothing-text {
                    font-size: 11px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// 超小屏幕优化
@media (max-width: 480px) {
  .character-detail-modal {
    max-width: 98%;
    width: 98%;
    padding: 10px;

    .modal-header {
      margin-bottom: 10px;
      padding-bottom: 6px;

      .character-title {
        font-size: 16px;
      }

      .edit-avatar-btn {
        padding: 4px 6px;
        font-size: 12px;

        .btn-icon {
          font-size: 10px;
        }
      }

      .close-btn {
        font-size: 16px;
        width: 18px;
        height: 18px;
      }
    }

    .character-detail-content {
      .character-basic-info {
        flex-direction: row;
        gap: 6px;
        padding: 6px;

        .character-avatar {
          flex: 0 0 80px;
          height: auto;
          min-height: 200px;
          max-width: 80px;
          display: flex;
          flex-direction: column;
        }

        .character-details {
          .basic-info-section {
            .info-grid {
              gap: 0;

              .info-item {
                .info-label {
                  font-size: 9px;
                  min-width: 30px;
                }
                .info-value {
                  font-size: 10px;
                }
              }
            }
          }

          .appearance-info-section {
            .appearance-grid {
              gap: 0;

              .appearance-item {
                .appearance-label {
                  font-size: 9px;
                  min-width: 30px;
                }
                .appearance-value {
                  font-size: 10px;
                }
              }
            }

            .appearance-description {
              .detail-text {
                font-size: 9px;
                line-height: 1.2;
              }
            }
          }
        }
      }

      .detail-right {
        .detail-stats {
          padding: 6px;

          .stat-detail {
            .stat-label {
              font-size: 9px;
              min-width: 50px;
            }

            .stat-value-detail {
              font-size: 9px;
              min-width: 25px;
            }
          }
        }

        .detail-section {
          padding: 6px;

          h4 {
            font-size: 11px;
            margin-bottom: 4px;
          }

          .detail-text {
            font-size: 10px;
            line-height: 1.3;
          }

          .sensitive-points,
          .personality-traits {
            gap: 2px;

            .sensitive-point,
            .personality-trait {
              font-size: 9px;
              padding: 1px 3px;
            }
          }

          .sensitive-details {
            .sensitive-detail-item {
              padding: 4px;

              .sensitive-detail-header {
                .sensitive-part {
                  font-size: 10px;
                }

                .sensitive-status {
                  font-size: 8px;
                  padding: 1px 3px;
                }
              }

              .sensitive-description {
                font-size: 9px;
                line-height: 1.2;
              }
            }
          }
        }
      }
    }
  }
}

// JSON编辑器样式
.json-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  backdrop-filter: blur(4px);
}

.json-editor-modal {
  background: linear-gradient(135deg, rgba(40, 26, 20, 0.98), rgba(26, 19, 19, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.6);
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  animation: slideIn 0.3s ease;

  .json-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 2px solid rgba(205, 133, 63, 0.4);

    h4 {
      margin: 0;
      color: #ffd7a1;
      font-size: 18px;
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

  .json-editor-body {
    flex: 1;
    padding: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .json-textarea {
      flex: 1;
      width: 100%;
      min-height: 400px;
      padding: 12px;
      background: rgba(30, 20, 16, 0.9);
      border: 2px solid rgba(205, 133, 63, 0.4);
      border-radius: 8px;
      color: #f0e6d2;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: none;
      overflow-y: auto;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: rgba(205, 133, 63, 0.8);
      }

      &::placeholder {
        color: rgba(240, 230, 210, 0.4);
      }
    }

    .json-error {
      margin-top: 12px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 6px;
      color: #fca5a5;
      font-size: 13px;
      line-height: 1.5;
    }
  }

  .json-editor-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 2px solid rgba(205, 133, 63, 0.4);

    .json-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;

      &.json-btn-cancel {
        background: rgba(107, 114, 128, 0.2);
        color: #d1d5db;
        border-color: rgba(107, 114, 128, 0.4);

        &:hover {
          background: rgba(107, 114, 128, 0.3);
          border-color: rgba(107, 114, 128, 0.6);
        }
      }

      &.json-btn-save {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(22, 163, 74, 0.9));
        color: #dcfce7;
        border-color: rgba(34, 197, 94, 0.6);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 1));
          border-color: rgba(34, 197, 94, 0.8);
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
