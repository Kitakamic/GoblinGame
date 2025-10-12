<template>
  <div class="army-formation-container">
    <div class="formation-content">
      <!-- 标题区域 -->
      <header class="formation-header">
        <h1 class="main-title">⚔️ 部队编制</h1>
      </header>

      <!-- 队长编制区域 -->
      <section class="captains-section">
        <div class="captains-grid">
          <div
            v-for="(captain, index) in captainSlots"
            :key="index"
            class="captain-slot"
            :class="{ empty: !captain, selected: selectedCaptainIndex === index }"
            @click="selectCaptain(index)"
          >
            <div v-if="captain" class="captain-card">
              <!-- 队长肖像图片区域 - 占满整个卡片 -->
              <div class="captain-portrait">
                <img
                  v-if="captain.avatar && captain.avatar.startsWith('http')"
                  :src="captain.avatar"
                  :alt="captain.name"
                  @error="handleImageError"
                />
                <div v-else class="default-portrait">
                  <span class="portrait-icon">{{ captain.avatar || '👤' }}</span>
                </div>

                <!-- 队长名称 - 竖排显示在左上角 -->
                <div class="captain-name-vertical-left">
                  {{ captain.name }}
                </div>

                <!-- 操作按钮 - 放在右上角 -->
                <div class="captain-actions">
                  <button class="configure-troops-btn" title="配置部队" @click.stop="openTroopConfig(index)">⚙️</button>
                  <button class="remove-captain-btn" title="移除队长" @click.stop="removeCaptain(index)">×</button>
                </div>

                <!-- 等级标识 - 放在操作按钮下面 -->
                <div class="captain-level-badge">
                  <span class="level-icon">⭐</span>
                  <span class="level-value">{{ Math.floor(captain.offspring / 10) }}</span>
                </div>

                <!-- 四维和部队信息网格 -->
                <div class="captain-info-grid">
                  <!-- 部队信息 - 移到上面 -->
                  <div class="captain-troops">
                    <div class="troop-count">部队: {{ getCaptainTroopCount(captain) }}</div>
                    <div class="health-count">血量: {{ getCaptainTotalHealthForCard(captain) }}</div>
                  </div>

                  <!-- 四维属性 -->
                  <div class="captain-stats">
                    <div class="stat-item">
                      <span>攻:</span>
                      <span>{{ captain.attributes.attack + getCaptainAttributeBonus(captain, 'attack') }}</span>
                    </div>
                    <div class="stat-item">
                      <span>防:</span>
                      <span>{{ captain.attributes.defense + getCaptainAttributeBonus(captain, 'defense') }}</span>
                    </div>
                    <div class="stat-item">
                      <span>知:</span>
                      <span>{{
                        captain.attributes.intelligence + getCaptainAttributeBonus(captain, 'intelligence')
                      }}</span>
                    </div>
                    <div class="stat-item">
                      <span>速:</span>
                      <span>{{ captain.attributes.speed + getCaptainAttributeBonus(captain, 'speed') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-slot" @click="openCaptainSelection">
              <div class="empty-icon">+</div>
              <div class="empty-text">选择队长</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 操作按钮 -->
      <div class="formation-actions">
        <button class="action-btn config-btn" title="管理部队配置" @click="openConfigManager">
          <span class="text">配置管理</span>
        </button>
        <button class="action-btn reset-btn" title="清空所有队长配置" @click="resetFormation">
          <span class="text">重置编制</span>
        </button>
      </div>
    </div>

    <!-- 队长选择弹窗 -->
    <div v-if="showCaptainSelection" class="captain-selection-modal" @click="closeCaptainSelection">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🎯 选择队长</h3>
          <button class="close-btn" @click="closeCaptainSelection">×</button>
        </div>
        <div class="captain-list">
          <div
            v-for="captain in availableCaptains"
            :key="captain.id"
            class="captain-option"
            :class="{ disabled: captain.isUsed }"
            @click="addCaptain(captain)"
          >
            <div class="captain-avatar">
              <img
                v-if="captain.avatar && captain.avatar.startsWith('http')"
                :src="captain.avatar"
                :alt="captain.name"
                @error="handleImageError"
              />
              <span v-else>{{ captain.avatar }}</span>
            </div>
            <div class="captain-details">
              <h4>{{ captain.name }}</h4>
              <p>{{ captain.description }}</p>
              <div class="captain-attributes">
                <div class="attr-item">
                  <span>攻:</span>
                  <span>{{ captain.attributes.attack }}</span>
                </div>
                <div class="attr-item">
                  <span>防:</span>
                  <span>{{ captain.attributes.defense }}</span>
                </div>
                <div class="attr-item">
                  <span>知:</span>
                  <span>{{ captain.attributes.intelligence }}</span>
                </div>
                <div class="attr-item">
                  <span>速:</span>
                  <span>{{ captain.attributes.speed }}</span>
                </div>
              </div>
              <div class="captain-level">等级 {{ captain.level }}</div>
            </div>
            <div v-if="captain.isUsed" class="used-badge">已使用</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 部队配置弹窗 -->
    <div v-if="showTroopConfig" class="troop-config-modal" @click="closeTroopConfig">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>⚔️ 配置部队</h3>
          <div class="modal-actions">
            <button class="confirm-btn" @click="confirmTroopConfig">✓</button>
            <button class="close-btn" @click="cancelTroopConfig">×</button>
          </div>
        </div>
        <div class="troop-config-content">
          <!-- 队长信息 -->
          <div class="captain-info-section">
            <div class="captain-details">
              <h4>{{ currentConfigCaptain?.name }}</h4>
              <div class="captain-attributes">
                <div class="attr-item">
                  <span>攻:</span>
                  <span
                    >{{ currentConfigCaptain?.attributes.attack
                    }}<span class="bonus-text">+{{ getAttributeBonus('attack') }}</span></span
                  >
                </div>
                <div class="attr-item">
                  <span>防:</span>
                  <span
                    >{{ currentConfigCaptain?.attributes.defense
                    }}<span class="bonus-text">+{{ getAttributeBonus('defense') }}</span></span
                  >
                </div>
                <div class="attr-item">
                  <span>知:</span>
                  <span
                    >{{ currentConfigCaptain?.attributes.intelligence
                    }}<span class="bonus-text">+{{ getAttributeBonus('intelligence') }}</span></span
                  >
                </div>
                <div class="attr-item">
                  <span>速:</span>
                  <span
                    >{{ currentConfigCaptain?.attributes.speed
                    }}<span class="bonus-text">+{{ getAttributeBonus('speed') }}</span></span
                  >
                </div>
                <div class="attr-item">
                  <span>血:</span>
                  <span
                    >{{ getCaptainBaseHealth()
                    }}<span class="bonus-text">+{{ getAttributeBonus('health') }}</span></span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 部队配置 -->
          <div class="troops-config-section">
            <div class="troops-limit">可配置部队等级: {{ currentConfigCaptain?.level }} 个</div>
            <div class="resource-info">
              <div v-for="goblinUnit in GOBLIN_UNIT_CHARACTERS" :key="goblinUnit.id" class="resource-item">
                <span class="resource-name">{{ goblinUnit.id }}:</span>
                <span class="resource-count">
                  总数量: {{ getCurrentGoblinCount(goblinUnit.id) }} | 已编制: {{ getUsedGoblinCount(goblinUnit.id) }} |
                  可用: {{ Math.max(0, getCurrentGoblinCount(goblinUnit.id) - getUsedGoblinCount(goblinUnit.id)) }}
                </span>
              </div>
            </div>
            <div class="troops-sliders">
              <div v-for="goblinUnit in GOBLIN_UNIT_CHARACTERS" :key="goblinUnit.id" class="troop-slider-item">
                <div class="troop-label">
                  <span class="troop-name">
                    {{ goblinUnit.id }}
                  </span>
                  <span class="troop-description">{{ goblinUnit.title }}</span>
                </div>
                <div class="slider-container">
                  <input
                    type="range"
                    class="troop-slider"
                    :min="0"
                    :max="getMaxTroopCount(goblinUnit.id)"
                    :value="getTroopCount(goblinUnit.id)"
                    @input="setTroopCount(goblinUnit.id, parseInt(($event.target as HTMLInputElement).value))"
                  />
                  <span class="slider-value">
                    {{ getTroopCount(goblinUnit.id) }}/{{ getMaxTroopCount(goblinUnit.id) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置管理弹窗 -->
    <div v-if="showConfigManager" class="config-manager-modal" @click="closeConfigManager">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📋 部队配置管理</h3>
          <button class="close-btn" @click="closeConfigManager">×</button>
        </div>
        <div class="config-manager-content">
          <!-- 保存当前配置 -->
          <div class="save-config-section">
            <h4>保存当前配置</h4>
            <div class="save-form">
              <input v-model="newConfigName" type="text" placeholder="配置名称" class="config-name-input" />
              <input
                v-model="newConfigDescription"
                type="text"
                placeholder="配置描述（可选）"
                class="config-desc-input"
              />
              <button class="save-config-btn" :disabled="!newConfigName.trim()" @click="saveCurrentConfig">
                保存配置
              </button>
            </div>
          </div>

          <!-- 配置列表 -->
          <div class="config-list-section">
            <h4>已保存的配置</h4>
            <div class="config-list">
              <div v-for="config in savedConfigs" :key="config.id" class="config-item">
                <div class="config-info">
                  <div class="config-name">{{ config.name }}</div>
                  <div v-if="config.description" class="config-desc">{{ config.description }}</div>
                  <div class="config-meta">创建时间: {{ formatTime(config.createdAt) }}</div>
                </div>
                <div class="config-actions">
                  <button class="load-config-btn" title="加载配置" @click="loadConfig(config.id)">📂</button>
                  <button class="delete-config-btn" title="删除配置" @click="deleteConfig(config.id)">🗑️</button>
                </div>
              </div>
              <div v-if="savedConfigs.length === 0" class="no-configs">暂无保存的配置</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义确认框 -->
    <CustomConfirm
      :show="showConfirm"
      :title="confirmConfig.title"
      :message="confirmConfig.message"
      :details="confirmConfig.details"
      :confirm-text="confirmConfig.confirmText"
      :cancel-text="confirmConfig.cancelText"
      :show-cancel="confirmConfig.showCancel"
      :show-close="confirmConfig.showClose"
      :type="confirmConfig.type"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Character } from '../../人物管理/类型/人物类型';
import { modularSaveManager } from '../../存档管理/模块化存档服务';
import CustomConfirm from '../../组件/自定义确认框.vue';
import { FormationService } from '../服务/部队编制服务';
import { GOBLIN_UNIT_CHARACTERS } from '../类型/单位数据表';
import type { Captain } from '../类型/队长类型';

// 响应式数据
const captainSlots = ref<(Captain | null)[]>(Array(6).fill(null));
const selectedCaptainIndex = ref<number | null>(null);
const availableCaptains = ref<Captain[]>([]);
const availableCharacters = ref<Character[]>([]);
const showCaptainSelection = ref(false);
const showTroopConfig = ref(false);
const showConfigManager = ref(false);
const currentConfigCaptainIndex = ref<number | null>(null);

// 配置管理相关
const savedConfigs = ref<any[]>([]);
const newConfigName = ref('');
const newConfigDescription = ref('');

// 自定义确认框相关
const showConfirm = ref(false);
const confirmConfig = ref({
  title: '提示',
  message: '',
  details: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'info' as 'info' | 'warning' | 'danger' | 'success',
  showCancel: true,
  showClose: true,
});
const confirmCallback = ref<(() => void) | null>(null);

// 计算属性

const currentConfigCaptain = computed(() => {
  if (currentConfigCaptainIndex.value === null) return null;
  return captainSlots.value[currentConfigCaptainIndex.value];
});

// 方法
const loadAvailableCharacters = () => {
  try {
    // 从模块化存档系统获取调教数据中的人物
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    if (trainingData && trainingData.characters) {
      // 筛选出可用的角色（已堕落状态或玩家角色，且可战斗）
      const characters = trainingData.characters.filter(
        (char: Character) =>
          ((char.status === 'surrendered' || char.status === 'player') && char.canCombat === true) ||
          char.name === '哥布林之王',
      );
      availableCharacters.value = characters;
      console.log('可用人物数据（已过滤不可战斗角色）:', characters);
    }
  } catch (error) {
    console.error('加载人物数据失败:', error);
    availableCharacters.value = [];
  }
};

const initializeCaptains = () => {
  // 从人物数据创建队长选项，使用真实的人物属性
  availableCaptains.value = availableCharacters.value.map(character => ({
    id: character.id,
    name: character.name,
    avatar: character.avatar || '👤',
    level: character.level || 1,
    offspring: character.offspring || 0,
    attributes: {
      attack: character.attributes.attack,
      defense: character.attributes.defense,
      intelligence: character.attributes.intelligence,
      speed: character.attributes.speed,
      health: character.attributes.health,
    },
    description: `${character.title} - 堕落值: ${character.loyalty || 0}`,
    isUsed: false,
  }));
};

const selectCaptain = (index: number) => {
  selectedCaptainIndex.value = index;
};

const addCaptain = (captain: Captain) => {
  if (captain.isUsed) return;

  const emptySlotIndex = captainSlots.value.findIndex(slot => slot === null);
  if (emptySlotIndex === -1) return;

  // 复制队长并初始化部队配置
  const newCaptain: Captain = {
    ...captain,
    troops: { 普通哥布林: 0, 哥布林战士: 0, 哥布林萨满: 0, 哥布林圣骑士: 0 },
  };

  captainSlots.value[emptySlotIndex] = newCaptain;
  captain.isUsed = true;
  selectedCaptainIndex.value = emptySlotIndex;
  showCaptainSelection.value = false;

  // 自动保存（包含人物状态更新）
  autoSave();
};

// 队长选择弹窗相关方法
const openCaptainSelection = () => {
  showCaptainSelection.value = true;
};

const closeCaptainSelection = () => {
  showCaptainSelection.value = false;
};

// 部队配置弹窗相关方法
const openTroopConfig = (index: number) => {
  currentConfigCaptainIndex.value = index;
  showTroopConfig.value = true;
};

const closeTroopConfig = () => {
  showTroopConfig.value = false;
  currentConfigCaptainIndex.value = null;
};

// 确认部队配置
const confirmTroopConfig = () => {
  if (currentConfigCaptainIndex.value !== null && currentConfigCaptain.value) {
    // 计算部队属性加成
    const attackBonus = getAttributeBonus('attack');
    const defenseBonus = getAttributeBonus('defense');
    const intelligenceBonus = getAttributeBonus('intelligence');
    const speedBonus = getAttributeBonus('speed');
    const healthBonus = getAttributeBonus('health');

    // 创建带有属性加成的队长数据
    const updatedCaptain = {
      ...currentConfigCaptain.value,
      // 保存原始属性（用于恢复）
      originalAttributes: { ...currentConfigCaptain.value.attributes },
      // 应用部队加成到属性中
      attributes: {
        ...currentConfigCaptain.value.attributes,
        attack: currentConfigCaptain.value.attributes.attack + attackBonus,
        defense: currentConfigCaptain.value.attributes.defense + defenseBonus,
        intelligence: currentConfigCaptain.value.attributes.intelligence + intelligenceBonus,
        speed: currentConfigCaptain.value.attributes.speed + speedBonus,
        health: currentConfigCaptain.value.attributes.health + healthBonus,
      },
      // 保存部队加成信息
      troopBonuses: {
        attack: attackBonus,
        defense: defenseBonus,
        intelligence: intelligenceBonus,
        speed: speedBonus,
        health: healthBonus,
      },
    };

    // 保存更新后的队长数据
    captainSlots.value[currentConfigCaptainIndex.value] = updatedCaptain;

    console.log(`队长 ${updatedCaptain.name} 属性已更新:`, {
      原始属性: updatedCaptain.originalAttributes,
      部队加成: updatedCaptain.troopBonuses,
      最终属性: updatedCaptain.attributes,
    });

    // 自动保存
    autoSave();
  }
  showTroopConfig.value = false;
  currentConfigCaptainIndex.value = null;
};

// 取消部队配置（不保存）
const cancelTroopConfig = () => {
  // 恢复到原始状态，不保存任何更改
  if (currentConfigCaptainIndex.value !== null) {
    // 这里可以恢复到原始状态，或者直接关闭
    // 由于我们没有保存原始状态，直接关闭即可
  }
  showTroopConfig.value = false;
  currentConfigCaptainIndex.value = null;
};

const removeCaptain = (index: number) => {
  const captain = captainSlots.value[index];
  if (captain) {
    // 恢复队长可用状态
    const originalCaptain = availableCaptains.value.find(c => c.id === captain.id);
    if (originalCaptain) {
      originalCaptain.isUsed = false;
    }

    // 恢复人物状态为已堕落，并恢复原始属性
    try {
      const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
      if (trainingData && trainingData.characters) {
        const character = trainingData.characters.find((char: Character) => char.id === captain.id);
        if (character) {
          character.status = 'surrendered';

          // 如果有原始属性，恢复原始属性
          if (captain.originalAttributes) {
            character.attributes = { ...captain.originalAttributes };
            console.log(`人物 ${character.name} 属性已恢复为原始属性:`, character.attributes);
          }

          // 清除位置信息
          character.formationPosition = undefined;
          console.log(`人物 ${character.name} 位置信息已清除`);

          modularSaveManager.updateModuleData({ moduleName: 'training', data: trainingData });
          console.log(`人物 ${character.name} 状态已恢复为已堕落`);
        }
      }
    } catch (error) {
      console.error('恢复人物状态失败:', error);
    }

    captainSlots.value[index] = null;
    if (selectedCaptainIndex.value === index) {
      selectedCaptainIndex.value = null;
    }

    // 自动保存
    autoSave();
  }
};

const getCaptainTroopCount = (captain: Captain) => {
  if (!captain.troops) return 0;
  return Object.values(captain.troops).reduce((sum, count) => sum + count, 0);
};

const getTroopCount = (type: string) => {
  if (!currentConfigCaptain.value?.troops) return 0;
  return currentConfigCaptain.value.troops[type as keyof typeof currentConfigCaptain.value.troops] || 0;
};

const getMaxTroopCount = (type: string) => {
  if (!currentConfigCaptain.value) return 0;

  // 获取队长等级限制
  const remainingLevels = getRemainingLevelsForType(type);
  const levelCost = TROOP_LEVEL_COSTS[type] || 1;
  const levelLimit = Math.floor(remainingLevels / levelCost);

  // 获取实际哥布林资源数量
  const availableGoblins = getCurrentGoblinCount(type);

  // 获取其他队长已使用的哥布林数量
  const usedGoblins = getUsedGoblinCount(type);

  // 计算可用的哥布林数量
  const availableCount = Math.max(0, availableGoblins - usedGoblins);

  // 返回等级限制和资源限制中的较小值
  const maxCount = Math.min(levelLimit, availableCount);

  console.log(`计算最大哥布林数量 ${type}:`, {
    等级限制: levelLimit,
    可用资源: availableGoblins,
    已使用: usedGoblins,
    实际可用: availableCount,
    最终限制: maxCount,
  });

  return maxCount;
};

const getRemainingLevelsForType = (type: string) => {
  if (!currentConfigCaptain.value?.troops) return currentConfigCaptain.value?.level || 0;

  const troops = currentConfigCaptain.value.troops;
  let usedLevels = 0;
  Object.keys(troops).forEach(troopType => {
    if (troopType !== type) {
      usedLevels += ((troops as any)[troopType] || 0) * (TROOP_LEVEL_COSTS[troopType] || 0);
    }
  });

  return Math.max(0, (currentConfigCaptain.value.level || 0) - usedLevels);
};

const setTroopCount = (type: string, count: number) => {
  if (!currentConfigCaptain.value) return;

  if (!currentConfigCaptain.value.troops) {
    currentConfigCaptain.value.troops = {
      普通哥布林: 0,
      哥布林战士: 0,
      哥布林萨满: 0,
      哥布林圣骑士: 0,
    };
  }

  if (type in currentConfigCaptain.value.troops) {
    (currentConfigCaptain.value.troops as any)[type] = count;
  }
};

// 计算属性加成
const getAttributeBonus = (attribute: string) => {
  if (!currentConfigCaptain.value?.troops) return 0;

  const troops = currentConfigCaptain.value.troops;
  let bonus = 0;

  // 使用单位数据计算属性加成，根据部队等级计算加成比例
  Object.entries(troops).forEach(([type, count]) => {
    // 直接使用中文名称查找单位
    const goblinUnit = GOBLIN_UNIT_CHARACTERS.find(unit => unit.id === type);

    if (goblinUnit && count > 0) {
      const unitAttributes = goblinUnit.attributes;
      // 根据部队等级计算加成比例，最高等级10，加成比例 = level/10
      const troopLevel = Math.min(goblinUnit.level, 10);
      const troopMultiplier = troopLevel / 10;

      console.log(`计算部队加成: ${type} x${count}, 等级:${troopLevel}, 倍数:${troopMultiplier}`);

      switch (attribute) {
        case 'attack': {
          const attackBonus = Math.floor(count * unitAttributes.attack * troopMultiplier);
          bonus += attackBonus;
          console.log(`攻击加成: ${count} * ${unitAttributes.attack} * ${troopMultiplier} = ${attackBonus}`);
          break;
        }
        case 'defense': {
          const defenseBonus = Math.floor(count * unitAttributes.defense * troopMultiplier);
          bonus += defenseBonus;
          console.log(`防御加成: ${count} * ${unitAttributes.defense} * ${troopMultiplier} = ${defenseBonus}`);
          break;
        }
        case 'intelligence': {
          const intelligenceBonus = Math.floor(count * unitAttributes.intelligence * troopMultiplier);
          bonus += intelligenceBonus;
          console.log(
            `智力加成: ${count} * ${unitAttributes.intelligence} * ${troopMultiplier} = ${intelligenceBonus}`,
          );
          break;
        }
        case 'speed': {
          const speedBonus = Math.floor(count * unitAttributes.speed * troopMultiplier);
          bonus += speedBonus;
          console.log(`速度加成: ${count} * ${unitAttributes.speed} * ${troopMultiplier} = ${speedBonus}`);
          break;
        }
        case 'health': {
          const healthBonus = Math.floor(count * goblinUnit.attributes.health * troopMultiplier);
          bonus += healthBonus;
          console.log(`血量加成: ${count} * ${goblinUnit.attributes.health} * ${troopMultiplier} = ${healthBonus}`);
          break;
        }
      }
    }
  });

  console.log(`总${attribute}加成: ${bonus}`);
  return bonus;
};

// 哥布林类型等级消耗配置（直接使用中文名称）
const TROOP_LEVEL_COSTS: Record<string, number> = {
  普通哥布林: 0.1, // 普通哥布林按0.1计算，可编制10倍数量
  哥布林战士: 1,
  哥布林萨满: 1,
  哥布林圣骑士: 1,
};

// 获取当前哥布林数量
const getCurrentGoblinCount = (goblinType: string) => {
  try {
    // 确保存档系统已初始化
    if (!modularSaveManager.getCurrentGameData()) {
      console.log('存档系统未初始化，创建新游戏数据');
      modularSaveManager.createNewGame();
    }

    // 哥布林类型到资源ID的映射
    const goblinResourceMapping: Record<string, string> = {
      普通哥布林: 'normalGoblins',
      哥布林战士: 'warriorGoblins',
      哥布林萨满: 'shamanGoblins',
      哥布林圣骑士: 'paladinGoblins',
    };

    const resourceId = goblinResourceMapping[goblinType] || goblinType;
    const count =
      modularSaveManager.resources.value[resourceId as keyof typeof modularSaveManager.resources.value] || 0;
    console.log(`获取哥布林数量 ${goblinType} (${resourceId}): ${count}`);
    return count;
  } catch (error) {
    console.error('获取哥布林数量失败:', error);
    return 0;
  }
};

// 获取其他队长已使用的哥布林数量
const getUsedGoblinCount = (goblinType: string) => {
  try {
    let usedCount = 0;

    // 遍历所有队长槽位，计算已使用的哥布林数量
    captainSlots.value.forEach(captain => {
      // 跳过当前正在配置的队长
      if (captain && captain.id === currentConfigCaptain.value?.id) {
        return;
      }

      // 计算其他队长使用的该类型哥布林数量
      if (captain && captain.troops) {
        const count = captain.troops[goblinType as keyof typeof captain.troops] || 0;
        usedCount += count;
      }
    });

    console.log(`其他队长已使用的 ${goblinType} 数量: ${usedCount}`);
    return usedCount;
  } catch (error) {
    console.error('获取已使用哥布林数量失败:', error);
    return 0;
  }
};

// 获取队长基础血量
const getCaptainBaseHealth = () => {
  if (!currentConfigCaptain.value) return 0;
  // 使用人物的实际血量属性，如果没有则使用等级 * 10 作为后备
  return currentConfigCaptain.value.attributes?.health || currentConfigCaptain.value.level * 10;
};

// 获取部队卡显示的总血量
const getCaptainTotalHealthForCard = (captain: Captain) => {
  if (!captain) return 0;
  // 使用人物的实际血量属性，如果没有则使用等级 * 10 作为后备
  const baseHealth = captain.attributes?.health || captain.level * 10;
  let bonusHealth = 0;

  if (captain.troops) {
    Object.entries(captain.troops).forEach(([type, count]) => {
      // 直接使用中文名称查找单位
      const goblinUnit = GOBLIN_UNIT_CHARACTERS.find(unit => unit.id === type);

      if (goblinUnit && count > 0) {
        // 根据部队等级计算加成比例，最高等级10，加成比例 = level/10
        const troopLevel = Math.min(goblinUnit.level, 10);
        const troopMultiplier = troopLevel / 10;
        bonusHealth += Math.floor(count * goblinUnit.attributes.health * troopMultiplier);
      }
    });
  }

  return baseHealth + bonusHealth;
};

// 获取部队卡的属性加成
const getCaptainAttributeBonus = (captain: Captain, attribute: string) => {
  if (!captain?.troops) return 0;

  let bonus = 0;
  Object.entries(captain.troops).forEach(([type, count]) => {
    // 直接使用中文名称查找单位
    const goblinUnit = GOBLIN_UNIT_CHARACTERS.find(unit => unit.id === type);

    if (goblinUnit && count > 0) {
      const unitAttributes = goblinUnit.attributes;
      // 根据部队等级计算加成比例，最高等级10，加成比例 = level/10
      const troopLevel = Math.min(goblinUnit.level, 10);
      const troopMultiplier = troopLevel / 10;
      switch (attribute) {
        case 'attack':
          bonus += Math.floor(count * unitAttributes.attack * troopMultiplier);
          break;
        case 'defense':
          bonus += Math.floor(count * unitAttributes.defense * troopMultiplier);
          break;
        case 'intelligence':
          bonus += Math.floor(count * unitAttributes.intelligence * troopMultiplier);
          break;
        case 'speed':
          bonus += Math.floor(count * unitAttributes.speed * troopMultiplier);
          break;
      }
    }
  });

  return bonus;
};

// 自动保存功能
const autoSave = async () => {
  try {
    // 自动保存到存档系统
    await FormationService.saveFormationData(captainSlots.value);
    console.log('部队编制已自动保存');
  } catch (error) {
    console.error('自动保存失败:', error);
  }
};

const resetFormation = () => {
  // 恢复所有已编制人物的状态和属性
  try {
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    if (trainingData && trainingData.characters) {
      captainSlots.value.forEach(captain => {
        if (captain) {
          const character = trainingData.characters.find((char: Character) => char.id === captain.id);
          if (character) {
            character.status = 'surrendered';

            // 如果有原始属性，恢复原始属性
            if (captain.originalAttributes) {
              character.attributes = { ...captain.originalAttributes };
              console.log(`人物 ${character.name} 属性已恢复为原始属性:`, character.attributes);
            }

            // 清除位置信息
            character.formationPosition = undefined;
            console.log(`人物 ${character.name} 位置信息已清除`);

            console.log(`人物 ${character.name} 状态已恢复为已堕落`);
          }
        }
      });
      modularSaveManager.updateModuleData({ moduleName: 'training', data: trainingData });
    }
  } catch (error) {
    console.error('重置人物状态失败:', error);
  }

  captainSlots.value = Array(6).fill(null);
  selectedCaptainIndex.value = null;
  availableCaptains.value.forEach(captain => {
    captain.isUsed = false;
  });

  // 自动保存
  autoSave();
};

// 配置管理相关方法
const openConfigManager = () => {
  loadSavedConfigs();
  showConfigManager.value = true;
};

const closeConfigManager = () => {
  showConfigManager.value = false;
  newConfigName.value = '';
  newConfigDescription.value = '';
};

const loadSavedConfigs = () => {
  try {
    savedConfigs.value = FormationService.getFormationConfigs();
  } catch (error) {
    console.error('加载配置列表失败:', error);
    savedConfigs.value = [];
  }
};

const saveCurrentConfig = () => {
  if (!newConfigName.value.trim()) {
    showCustomConfirm({
      title: '输入错误',
      message: '请输入配置名称！',
      type: 'warning',
      showCancel: false,
    });
    return;
  }

  try {
    FormationService.saveFormationConfig({
      name: newConfigName.value.trim(),
      description: newConfigDescription.value.trim() || undefined,
      captainSlots: captainSlots.value,
    });

    showCustomConfirm({
      title: '保存成功',
      message: '配置保存成功！',
      type: 'success',
      showCancel: false,
    });
    newConfigName.value = '';
    newConfigDescription.value = '';
    loadSavedConfigs();
  } catch (error) {
    console.error('保存配置失败:', error);
    showCustomConfirm({
      title: '保存失败',
      message: '保存配置失败，请重试！',
      type: 'danger',
      showCancel: false,
    });
  }
};

const loadConfig = (configId: string) => {
  try {
    const configSlots = FormationService.loadFormationConfig(configId);
    captainSlots.value = configSlots;

    // 同步更新可用队长的使用状态
    syncCaptainUsageStatus();

    // 自动保存到存档系统
    autoSave();

    showCustomConfirm({
      title: '加载成功',
      message: '配置加载成功！',
      type: 'success',
      showCancel: false,
    });
    closeConfigManager();
  } catch (error) {
    console.error('加载配置失败:', error);
    showCustomConfirm({
      title: '加载失败',
      message: '加载配置失败，请重试！',
      type: 'danger',
      showCancel: false,
    });
  }
};

const deleteConfig = (configId: string) => {
  showCustomConfirm({
    title: '确认删除',
    message: '确定要删除这个配置吗？',
    details: '删除后无法恢复，请谨慎操作。',
    type: 'danger',
    confirmText: '删除',
    cancelText: '取消',
    onConfirm: () => {
      try {
        const success = FormationService.deleteFormationConfig(configId);
        if (success) {
          showCustomConfirm({
            title: '删除成功',
            message: '配置删除成功！',
            type: 'success',
            showCancel: false,
          });
          loadSavedConfigs();
        } else {
          showCustomConfirm({
            title: '删除失败',
            message: '删除配置失败，请重试！',
            type: 'danger',
            showCancel: false,
          });
        }
      } catch (error) {
        console.error('删除配置失败:', error);
        showCustomConfirm({
          title: '删除失败',
          message: '删除配置失败，请重试！',
          type: 'danger',
          showCancel: false,
        });
      }
    },
  });
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 自定义确认框方法
const showCustomConfirm = (config: {
  title?: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  showCancel?: boolean;
  showClose?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}) => {
  confirmConfig.value = {
    title: config.title || '提示',
    message: config.message,
    details: config.details || '',
    confirmText: config.confirmText || '确定',
    cancelText: config.cancelText || '取消',
    type: config.type || 'info',
    showCancel: config.showCancel !== false,
    showClose: config.showClose !== false,
  };
  confirmCallback.value = config.onConfirm || null;
  showConfirm.value = true;
};

const handleConfirm = () => {
  if (confirmCallback.value) {
    confirmCallback.value();
  }
  showConfirm.value = false;
  confirmCallback.value = null;
};

const handleCancel = () => {
  showConfirm.value = false;
  confirmCallback.value = null;
};

const handleClose = () => {
  showConfirm.value = false;
  confirmCallback.value = null;
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};

// 同步队长使用状态
const syncCaptainUsageStatus = () => {
  // 获取所有已编制的队长ID
  const usedCaptainIds = captainSlots.value.filter(captain => captain !== null).map(captain => captain!.id);

  // 更新可用队长的使用状态
  availableCaptains.value.forEach(captain => {
    captain.isUsed = usedCaptainIds.includes(captain.id);
  });

  console.log('已同步队长使用状态:', {
    usedCaptainIds,
    availableCaptains: availableCaptains.value.map(c => ({ id: c.id, name: c.name, isUsed: c.isUsed })),
  });
};

// 加载已保存的编制数据
const loadFormationData = () => {
  try {
    // 从存档系统加载部队编制数据
    const formationData = FormationService.loadFormationData();
    if (formationData && formationData.length > 0) {
      captainSlots.value = formationData;
      console.log('已从存档系统加载部队编制数据:', formationData);

      // 同步更新可用队长的使用状态
      syncCaptainUsageStatus();
    }
  } catch (error) {
    console.error('加载部队编制数据失败:', error);
  }
};

onMounted(async () => {
  // 确保存档系统已初始化
  try {
    if (!modularSaveManager.getCurrentGameData()) {
      console.log('部队编制界面：存档系统未初始化，正在初始化...');
      await modularSaveManager.init();
      modularSaveManager.createNewGame();
    }
  } catch (error) {
    console.error('初始化存档系统失败:', error);
  }

  loadAvailableCharacters();
  initializeCaptains();
  loadFormationData();
});
</script>

<style scoped lang="scss">
.army-formation-container {
  height: 710px;
  width: 100%;
  max-width: 100%;
  padding: 16px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.6), rgba(25, 17, 14, 0.85));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 8px 18px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  color: #f0e6d2;
  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Helvetica,
    Arial,
    'Apple Color Emoji',
    'Segoe UI Emoji';
}

/* 部队编制内容区域 */
.formation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标题样式 */
.formation-header {
  position: relative;
  text-align: center;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;

  .main-title {
    margin: 0;
    font-size: 28px;
    letter-spacing: 2px;
    color: #ffd7a1;
    text-shadow:
      0 2px 6px rgba(0, 0, 0, 0.6),
      0 0 12px rgba(255, 120, 40, 0.3);
    position: relative;
    display: inline-block;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -8px;
      transform: translateX(-50%);
      width: 80%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255, 180, 120, 0.6), transparent);
    }
  }

  .subtitle {
    margin-top: 8px;
    font-size: 16px;
    color: #9ca3af;
    opacity: 0.8;
  }
}

/* 区域标题 */
.section-header {
  margin-bottom: 16px;

  h3 {
    margin: 0;
    color: #ffd7a1;
    font-size: 16px;
    font-weight: 700;
    border-bottom: 1px solid rgba(205, 133, 63, 0.3);
    padding-bottom: 8px;
  }
}

/* 队长编制区域 */
.captains-section {
  flex: 1;
  margin-bottom: 16px;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-right: 8px;
}

.captains-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  height: 100%;
  align-content: start;
  justify-content: center;
  padding-top: 20px;
}

.captain-slot {
  background: transparent;
  border: 3px solid rgba(205, 133, 63, 0.4);
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    border-color: rgba(205, 133, 63, 0.6);
  }

  &.selected {
    border-color: rgba(52, 152, 219, 0.6);
    box-shadow: 0 0 15px rgba(52, 152, 219, 0.3);
  }

  &.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);

    .empty-icon {
      font-size: 24px;
      color: #9ca3af;
      margin-bottom: 8px;
    }

    .empty-text {
      color: #9ca3af;
      font-size: 12px;
    }
  }
}

.captain-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

// 队长肖像图片区域
.captain-portrait {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 2;
  border-radius: 9px; // 比外框圆角稍小，形成内嵌效果

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-portrait {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(205, 133, 63, 0.3), rgba(255, 120, 60, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;

    .portrait-icon {
      font-size: 64px;
      opacity: 0.8;
    }
  }
}

// 队长名称 - 竖排显示在左上角
.captain-name-vertical-left {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 3;
  color: #ffd7a1;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 4px;
  border-radius: 4px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  max-height: 80%;
  overflow: hidden;
  white-space: nowrap;
}

// 操作按钮 - 放在右上角
.captain-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 4;
  display: flex;
  gap: 4px;

  .configure-troops-btn {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 10px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
    }
  }

  .remove-captain-btn {
    background: rgba(220, 38, 38, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(220, 38, 38, 1);
      transform: scale(1.1);
    }
  }
}

// 等级标签 - 放在操作按钮下面
.captain-level-badge {
  position: absolute;
  top: 40px;
  right: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  z-index: 3;
  background: rgba(255, 215, 0, 0.9);
  color: #000;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

  .level-icon {
    font-size: 11px;
  }

  .level-value {
    font-size: 12px;
    font-weight: 700;
  }
}

// 队长名称 - 竖着显示在右侧
.captain-name-vertical {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  color: #ffd7a1;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 4px;
  border-radius: 4px;
  max-height: 80%;
  overflow: hidden;
  white-space: nowrap;
  max-width: 40px;

  // 自动缩小字号
  font-size: clamp(10px, 2.5vw, 16px);
}

// 四维和部队信息网格
.captain-info-grid {
  position: absolute;
  bottom: 30px;
  left: 4px;
  right: 4px;
  z-index: 3;
  display: grid;
  grid-template-rows: 1fr 1fr; // 部队信息和四维各占1行
  gap: 2px;
  height: 70px;
}

.captain-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;

  .stat-item {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #f0e6d2;
    padding: 2px 4px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
}

.captain-troops {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .troop-count {
    font-size: 9px;
    color: #f59e0b;
    font-weight: 600;
    text-align: center;
    padding: 2px 4px;
    background: rgba(245, 158, 11, 0.2);
    border-radius: 3px;
    border: 1px solid rgba(245, 158, 11, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    width: 100%;
  }

  .health-count {
    font-size: 9px;
    color: #dc2626;
    font-weight: 600;
    text-align: center;
    padding: 2px 4px;
    background: rgba(220, 38, 38, 0.2);
    border-radius: 3px;
    border: 1px solid rgba(220, 38, 38, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    width: 100%;
  }
}

/* 内联部队配置 */
.inline-troops-config {
  margin-top: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(205, 133, 63, 0.2);

  .troops-limit {
    color: #f59e0b;
    font-weight: 600;
    font-size: 11px;
    margin-bottom: 8px;
    text-align: center;
  }

  .troops-grid-inline {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 8px;
  }

  .troop-type-inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    font-size: 10px;

    label {
      color: #f0e6d2;
      font-weight: 600;
    }
  }

  .troop-controls-inline {
    display: flex;
    align-items: center;
    gap: 4px;

    button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 3px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: #2563eb;
        transform: scale(1.1);
      }

      &:disabled {
        background: #6b7280;
        cursor: not-allowed;
        transform: none;
      }
    }

    .troop-count {
      min-width: 16px;
      text-align: center;
      color: #f0e6d2;
      font-weight: 600;
      font-size: 10px;
    }
  }

  .troops-summary-inline {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #9ca3af;

    span.warning {
      color: #dc2626;
    }
  }
}

/* 部队配置区域 */
.troops-configuration {
  margin-bottom: 24px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 12px;
  padding: 16px;
}

.troops-info {
  margin-bottom: 16px;

  .troops-limit {
    color: #f59e0b;
    font-weight: 600;
    font-size: 14px;

    .limit-note {
      color: #9ca3af;
      font-size: 12px;
      font-weight: 400;
    }
  }
}

.troops-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.troop-type {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  label {
    color: #f0e6d2;
    font-weight: 600;
    font-size: 12px;
  }
}

.troop-controls {
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &:disabled {
      background: #6b7280;
      cursor: not-allowed;
    }
  }

  .troop-count {
    min-width: 24px;
    text-align: center;
    color: #f0e6d2;
    font-weight: 600;
    font-size: 12px;
  }
}

.troops-summary {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span:first-child {
      color: #9ca3af;
      font-size: 12px;
    }

    span:last-child {
      color: #f0e6d2;
      font-weight: 600;
      font-size: 14px;

      &.warning {
        color: #dc2626;
      }
    }
  }
}

/* 部队预览 */
.army-preview {
  margin-bottom: 24px;
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.7), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.25);
  border-radius: 12px;
  padding: 16px;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    font-size: 12px;

    span:first-child {
      color: #9ca3af;
    }

    span:last-child {
      color: #f0e6d2;
      font-weight: 600;
    }
  }
}

.preview-troops {
  h4 {
    margin: 0 0 8px 0;
    color: #ffd7a1;
    font-size: 14px;
    font-weight: 600;
  }
}

.troop-composition {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.composition-item {
  display: flex;
  justify-content: space-between;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 11px;

  span:first-child {
    color: #9ca3af;
  }

  span:last-child {
    color: #f0e6d2;
    font-weight: 600;
  }
}

/* 操作按钮 */
.formation-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 16px;
  flex-shrink: 0;
}

.action-btn {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.8), rgba(25, 17, 14, 0.9));
  border: 1px solid rgba(205, 133, 63, 0.3);
  border-radius: 12px;
  padding: 16px 24px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 200, 150, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #f0e6d2;
  font-size: 14px;
  font-weight: 600;
  min-width: 120px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 200, 150, 0.12),
      0 6px 16px rgba(0, 0, 0, 0.4);
    border-color: rgba(205, 133, 63, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .text {
    font-weight: 700;
    font-size: 16px;
  }

  &.config-btn {
    &:hover:not(:disabled) {
      background: linear-gradient(180deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.3));
      border-color: rgba(168, 85, 247, 0.5);
      color: #a855f7;
    }
  }

  &.reset-btn {
    &:hover:not(:disabled) {
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3));
      border-color: rgba(59, 130, 246, 0.5);
      color: #3b82f6;
    }
  }
}

/* 队长选择弹窗 */
.captain-selection-modal,
.troop-config-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 2px solid rgba(205, 133, 63, 0.3);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow:
    0 0 30px rgba(205, 133, 63, 0.2),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(205, 133, 63, 0.3);

  h3 {
    margin: 0;
    color: #ffd7a1;
    font-size: 18px;
    font-weight: 700;
  }

  .modal-actions {
    display: flex;
    gap: 8px;
  }

  .confirm-btn {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
    color: #f0e6d2;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(16, 185, 129, 0.3);
    }
  }

  .close-btn {
    background: rgba(220, 38, 38, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 6px;
    padding: 4px 8px;
    color: #f0e6d2;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(220, 38, 38, 0.3);
    }
  }
}

.captain-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
}

.captain-option {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  margin-bottom: 8px;

  &:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .captain-avatar {
    font-size: 24px;
    margin-right: 12px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(205, 133, 63, 0.3), rgba(255, 120, 60, 0.2));

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-size: 24px;
    }
  }

  .captain-details {
    flex: 1;

    h4 {
      margin: 0 0 4px 0;
      color: #f0e6d2;
      font-size: 14px;
      font-weight: 600;
    }

    p {
      margin: 0 0 8px 0;
      color: #9ca3af;
      font-size: 12px;
    }

    .captain-attributes {
      display: flex;
      gap: 12px;
      margin-bottom: 4px;

      .attr-item {
        display: flex;
        gap: 4px;
        font-size: 11px;
        color: #9ca3af;

        span:last-child {
          color: #f0e6d2;
          font-weight: 600;
        }
      }
    }

    .captain-level {
      color: #3b82f6;
      font-size: 11px;
      font-weight: 600;
    }
  }

  .used-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #dc2626;
    color: white;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
  }
}

/* 宽屏布局调整 */
@media (min-width: 1200px) {
  .captain-slot {
    height: 500px;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .captains-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .army-formation-container {
    padding: 12px;
  }

  .captains-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    flex: 1;
    min-height: 0;
  }

  .captain-slot {
    height: 270px;
    padding: 0;
  }

  .captain-header {
    margin-bottom: 12px;

    .captain-avatar {
      font-size: 24px;
    }

    .captain-info h4 {
      font-size: 16px;
    }

    .captain-level {
      font-size: 12px;
    }

    .captain-actions {
      gap: 2px;
    }

    .configure-troops-btn,
    .remove-captain-btn {
      width: 16px;
      height: 16px;
      font-size: 8px;
    }
  }

  .captain-stats {
    gap: 8px;
    margin-bottom: 12px;

    .stat-item {
      font-size: 12px;
      padding: 4px 6px;
    }
  }

  .captain-troops {
    .troop-count {
      font-size: 12px;
    }
  }

  .captain-name-vertical-left {
    font-size: 12px;
  }

  .preview-stats {
    grid-template-columns: 1fr;
  }

  .troop-composition {
    grid-template-columns: 1fr;
  }

  .formation-actions {
    flex-direction: row;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: auto;
    padding-top: 16px;
  }

  .action-btn {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 80px;
    flex: 1;
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .formation-header {
    margin-bottom: 16px;

    .main-title {
      font-size: 20px;
    }

    .subtitle {
      font-size: 12px;
    }
  }

  .captains-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    flex: 1;
    min-height: 0;
  }

  .captain-slot {
    height: 270px;
    padding: 0;
  }

  .captain-header {
    margin-bottom: 8px;

    .captain-avatar {
      font-size: 20px;
    }

    .captain-info h4 {
      font-size: 14px;
    }

    .captain-level {
      font-size: 10px;
    }

    .captain-actions {
      gap: 1px;
    }

    .configure-troops-btn,
    .remove-captain-btn {
      width: 14px;
      height: 14px;
      font-size: 7px;
    }
  }

  .captain-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 8px;

    .stat-item {
      font-size: 10px;
      padding: 3px 4px;
    }
  }

  .captain-troops {
    .troop-count {
      font-size: 10px;
    }
  }

  .captain-name-vertical-left {
    font-size: 10px;
  }

  .section-header h3 {
    font-size: 14px;
  }

  .preview-stats {
    gap: 8px;

    .stat-item {
      padding: 6px;
      font-size: 11px;
    }
  }

  .troop-composition {
    gap: 4px;

    .composition-item {
      padding: 4px;
      font-size: 10px;
    }
  }

  .formation-actions {
    flex-direction: row;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: auto;
    padding-top: 12px;
  }

  .action-btn {
    padding: 6px 8px;
    font-size: 10px;
    min-width: 70px;
    flex: 1;
    max-width: 100px;

    .text {
      font-size: 10px;
    }
  }

  .modal-content {
    margin: 10px;
    max-height: 90vh;
  }

  .captain-option {
    padding: 8px;

    .captain-avatar {
      font-size: 20px;
      margin-right: 8px;
    }

    .captain-details {
      h4 {
        font-size: 12px;
      }

      p {
        font-size: 10px;
      }

      .captain-attributes {
        gap: 8px;

        .attr-item {
          font-size: 9px;
        }
      }

      .captain-level {
        font-size: 10px;
      }
    }
  }
}

/* 部队配置弹窗专用样式 */
.troop-config-modal .modal-content {
  max-width: 500px;
  max-height: 85vh;
}

/* 配置管理弹窗样式 */
.config-manager-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.config-manager-modal .modal-content {
  max-width: 800px;
  max-height: 90vh;
  width: 100%;
}

.config-manager-content {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.save-config-section {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(205, 133, 63, 0.2);

  h4 {
    margin: 0 0 16px 0;
    color: #ffd7a1;
    font-size: 16px;
    font-weight: 600;
  }

  .save-form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .config-name-input,
    .config-desc-input {
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(205, 133, 63, 0.3);
      border-radius: 6px;
      color: #f0e6d2;
      font-size: 14px;

      &::placeholder {
        color: #9ca3af;
      }

      &:focus {
        outline: none;
        border-color: rgba(205, 133, 63, 0.6);
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .save-config-btn {
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3));
      border: 1px solid rgba(34, 197, 94, 0.4);
      border-radius: 6px;
      padding: 10px 16px;
      color: #f0e6d2;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: linear-gradient(180deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.4));
        border-color: rgba(34, 197, 94, 0.6);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.config-list-section {
  h4 {
    margin: 0 0 16px 0;
    color: #ffd7a1;
    font-size: 16px;
    font-weight: 600;
  }

  .config-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(205, 133, 63, 0.2);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(205, 133, 63, 0.4);
    }

    .config-info {
      flex: 1;

      .config-name {
        color: #f0e6d2;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .config-desc {
        color: #9ca3af;
        font-size: 14px;
        margin-bottom: 4px;
      }

      .config-meta {
        color: #6b7280;
        font-size: 12px;
      }
    }

    .config-actions {
      display: flex;
      gap: 8px;

      .load-config-btn,
      .delete-config-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(205, 133, 63, 0.3);
        border-radius: 6px;
        padding: 8px 12px;
        color: #f0e6d2;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(205, 133, 63, 0.5);
        }
      }

      .delete-config-btn:hover {
        background: rgba(220, 38, 38, 0.2);
        border-color: rgba(220, 38, 38, 0.4);
      }
    }
  }

  .no-configs {
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
    padding: 40px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px dashed rgba(205, 133, 63, 0.3);
  }
}

.troop-config-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.captain-info-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(205, 133, 63, 0.2);

  .captain-avatar {
    font-size: 32px;
  }

  .captain-details {
    flex: 1;

    h4 {
      margin: 0 0 8px 0;
      color: #f0e6d2;
      font-size: 18px;
      font-weight: 600;
    }

    .captain-attributes {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .attr-item {
        display: flex;
        gap: 4px;
        font-size: 12px;
        color: #9ca3af;

        span:last-child {
          color: #f0e6d2;
          font-weight: 600;
        }
      }
    }

    .bonus-text {
      color: #dc2626 !important;
      font-weight: 600;
    }
  }
}

.troops-config-section {
  margin-bottom: 20px;

  .troops-limit {
    color: #f59e0b;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 16px;
    text-align: center;
  }

  .resource-info {
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(205, 133, 63, 0.2);

    .resource-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .resource-name {
        color: #f0e6d2;
        font-weight: 600;
        min-width: 80px;
      }

      .resource-count {
        color: #9ca3af;
        font-size: 11px;
        flex: 1;
        text-align: right;
      }
    }
  }

  .troops-sliders {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .troop-slider-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(205, 133, 63, 0.2);

    .troop-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;

      .troop-name {
        color: #f0e6d2;
        font-weight: 600;
        font-size: 14px;
      }

      .troop-description {
        color: #9ca3af;
        font-size: 12px;
        flex: 1;
        text-align: right;
      }
    }

    .slider-container {
      display: flex;
      align-items: center;
      gap: 15px;

      .troop-slider {
        flex: 1;
        height: 6px;
        background: rgba(255, 200, 150, 0.2);
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #ffd7a1;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;

          &:hover {
            background: #ffed4e;
            transform: scale(1.1);
          }
        }

        &::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #ffd7a1;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;

          &:hover {
            background: #ffed4e;
            transform: scale(1.1);
          }
        }

        &::-webkit-slider-track {
          background: rgba(255, 200, 150, 0.2);
          border-radius: 3px;
        }

        &::-moz-range-track {
          background: rgba(255, 200, 150, 0.2);
          border-radius: 3px;
          border: none;
        }
      }

      .slider-value {
        min-width: 30px;
        text-align: center;
        font-size: 16px;
        font-weight: 600;
        color: #f0e6d2;
        background: rgba(0, 0, 0, 0.3);
        padding: 5px 10px;
        border-radius: 4px;
        border: 1px solid rgba(255, 200, 150, 0.3);
      }
    }
  }
}

.attribute-bonus-section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(34, 197, 94, 0.3);

  h4 {
    margin: 0 0 12px 0;
    color: #22c55e;
    font-size: 16px;
    font-weight: 600;
  }

  .bonus-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    .bonus-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;

      .bonus-label {
        color: #9ca3af;
        font-size: 12px;
      }

      .bonus-value {
        color: #22c55e;
        font-weight: 600;
        font-size: 12px;
      }
    }
  }
}

.troops-summary {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;

    span:first-child {
      color: #9ca3af;
      font-size: 12px;
    }

    span:last-child {
      color: #f0e6d2;
      font-weight: 600;
      font-size: 14px;

      &.warning {
        color: #dc2626;
      }
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .troop-config-modal .modal-content {
    max-width: 90vw;
    max-height: 90vh;
  }

  .troop-config-content {
    padding: 16px;
  }

  .captain-info-section {
    flex-direction: column;
    text-align: center;
    gap: 12px;

    .captain-attributes {
      justify-content: center;
      gap: 2px;
      flex-wrap: nowrap;
      display: flex;

      .attr-item {
        font-size: 9px;
        padding: 1px 2px;
        min-width: 0;
        flex: 1;
      }
    }
  }

  .troops-config-section {
    .troop-slider-item {
      .troop-label {
        .troop-name {
          font-size: 13px;
        }

        .troop-description {
          font-size: 11px;
        }
      }

      .slider-container {
        .troop-slider {
          height: 7px;

          &::-webkit-slider-thumb {
            width: 19px;
            height: 19px;
          }

          &::-moz-range-thumb {
            width: 19px;
            height: 19px;
          }
        }

        .slider-value {
          font-size: 14px;
          padding: 4px 8px;
        }
      }
    }
  }

  .attribute-bonus-section {
    .bonus-stats {
      grid-template-columns: 1fr;
    }
  }

  .troops-summary {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .troop-config-content {
    padding: 12px;
  }

  .captain-info-section {
    padding: 12px;

    .captain-avatar {
      font-size: 24px;
    }

    .captain-details h4 {
      font-size: 16px;
    }

    .captain-attributes {
      gap: 8px;

      .attr-item {
        font-size: 11px;
      }
    }
  }

  .troops-config-section {
    .troop-slider-item {
      padding: 8px;

      .troop-label {
        .troop-name {
          font-size: 12px;
        }

        .troop-description {
          font-size: 10px;
        }
      }

      .slider-container {
        gap: 8px;

        .troop-slider {
          height: 8px;

          &::-webkit-slider-thumb {
            width: 18px;
            height: 18px;
          }

          &::-moz-range-thumb {
            width: 18px;
            height: 18px;
          }
        }

        .slider-value {
          font-size: 12px;
          padding: 3px 6px;
          min-width: 25px;
        }
      }
    }
  }

  .attribute-bonus-section {
    padding: 12px;

    h4 {
      font-size: 14px;
    }

    .bonus-stats .bonus-item {
      padding: 4px 6px;
      font-size: 11px;
    }
  }
}
</style>
