<template>
  <div v-if="show" class="sacrifice-dialog-overlay" @click.self="handleClose">
    <div class="sacrifice-dialog">
      <div class="dialog-header">
        <h4>🔥 献祭哥布林升级等级</h4>
        <button class="close-dialog" @click="handleClose">×</button>
      </div>
      <div class="dialog-content">
        <!-- 人物选择 -->
        <div class="character-selection">
          <label class="character-label">选择升级人物：</label>
          <select v-model="selectedCharacterId" class="character-select">
            <option v-for="character in upgradableCharacters" :key="character.id" :value="character.id">
              {{ character.name }} ({{ character.title || '无称号' }}) - 等级
              {{ character.level ?? Math.floor((character.offspring ?? 0) / 10) ?? 1 }}
            </option>
          </select>
        </div>
        <div class="current-level-info">
          <p>
            {{ selectedCharacter?.name || '未选择人物' }} 当前等级: <strong>{{ currentCharacterLevel }}</strong>
          </p>
        </div>
        <div class="goblin-selection">
          <div v-for="goblinType in goblinTypes" :key="goblinType.id" class="goblin-type-row">
            <div class="goblin-type-info">
              <span class="goblin-icon">{{ goblinType.icon }}</span>
              <span class="goblin-name">{{ goblinType.name }}</span>
              <span class="goblin-available">可用: {{ getGoblinCount(goblinType.id as keyof SacrificeAmounts) }}</span>
              <span class="goblin-experience">需要: {{ goblinType.requiredAmount }}只/级</span>
            </div>
            <div class="goblin-input-group">
              <button
                class="input-button"
                :disabled="sacrificeAmounts[goblinType.id as keyof SacrificeAmounts] <= 0"
                @click="decreaseGoblin(goblinType.id as keyof SacrificeAmounts)"
              >
                −
              </button>
              <input
                v-model.number="sacrificeAmounts[goblinType.id as keyof SacrificeAmounts]"
                type="number"
                :min="0"
                :max="getGoblinCount(goblinType.id as keyof SacrificeAmounts)"
                class="goblin-input"
              />
              <button
                class="input-button"
                :disabled="
                  sacrificeAmounts[goblinType.id as keyof SacrificeAmounts] >=
                  getGoblinCount(goblinType.id as keyof SacrificeAmounts)
                "
                @click="increaseGoblin(goblinType.id as keyof SacrificeAmounts)"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div class="sacrifice-summary">
          <p>
            献祭总数: <strong>{{ totalSacrificeAmount }}</strong>
          </p>
          <p v-if="canLevelUp" class="level-up-preview">
            将升级至等级 <strong>{{ predictedLevel }}</strong
            >（提升 <strong>{{ levelUps }}</strong> 级）
            <br v-if="contributingTypes.length > 1" />
            <template v-if="contributingTypes.length > 1">
              <span class="level-breakdown">
                （
                <template v-for="(item, index) in contributingTypes" :key="item.type.id">
                  {{ item.type.name }}+{{ item.levelUps }}级<template v-if="index < contributingTypes.length - 1">
                    +
                  </template>
                </template>
                = 总计{{ levelUps }}级）
              </span>
            </template>
          </p>
          <p v-else class="insufficient-experience">
            数量不足，无法升级。需要满足以下条件之一：
            <br />
            <span v-for="goblinType in goblinTypes" :key="goblinType.id" class="requirement-item">
              {{ goblinType.name }}需要{{ goblinType.requiredAmount }}只
            </span>
          </p>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="cancel-button" @click="handleClose">取消</button>
        <button
          class="confirm-button"
          :disabled="!canLevelUp || totalSacrificeAmount === 0 || !selectedCharacterId"
          @click="handleConfirm"
        >
          献祭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Character } from '../../功能模块层/人物管理/类型/人物类型';
import { CharacterLevelUpService } from '../../核心层/服务/通用服务/人物升级服务';
import { SacrificeService, type SacrificeAmounts } from '../../核心层/服务/通用服务/献祭服务';

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', characterId: string, amounts: SacrificeAmounts): void;
}>();

// 哥布林类型配置（从服务中获取）
const goblinTypes = SacrificeService.GOBLIN_TYPES;

// 可升级人物列表
const upgradableCharacters = ref<Character[]>([]);

// 选中的人物ID
const selectedCharacterId = ref<string>('');

// 献祭数量
const sacrificeAmounts = ref<SacrificeAmounts>({
  normalGoblins: 0,
  warriorGoblins: 0,
  shamanGoblins: 0,
  paladinGoblins: 0,
});

// ==================== 计算属性 ====================

/**
 * 获取选中的人物
 */
const selectedCharacter = computed(() => {
  return upgradableCharacters.value.find(char => char.id === selectedCharacterId.value);
});

/**
 * 获取选中人物当前等级
 */
const currentCharacterLevel = computed(() => {
  if (!selectedCharacterId.value) {
    return 1;
  }
  return CharacterLevelUpService.getCharacterLevel(selectedCharacterId.value);
});

/**
 * 获取指定类型的哥布林数量
 */
const getGoblinCount = (goblinTypeId: keyof SacrificeAmounts): number => {
  return SacrificeService.getGoblinCount(goblinTypeId);
};

/**
 * 计算献祭总数
 */
const totalSacrificeAmount = computed(() => {
  return (
    sacrificeAmounts.value.normalGoblins +
    sacrificeAmounts.value.warriorGoblins +
    sacrificeAmounts.value.shamanGoblins +
    sacrificeAmounts.value.paladinGoblins
  );
});

/**
 * 计算可以升多少级
 */
const levelUps = computed(() => {
  return SacrificeService.calculateLevelUps(sacrificeAmounts.value);
});

/**
 * 计算每种类型可以升多少级（用于显示详细信息）
 */
const levelUpsByType = computed(() => {
  return SacrificeService.calculateLevelUpsByType(sacrificeAmounts.value);
});

/**
 * 过滤出有贡献的类型（levelUps > 0）
 */
const contributingTypes = computed(() => {
  return levelUpsByType.value.filter(item => item.levelUps > 0);
});

/**
 * 计算预测升级后的等级
 */
const predictedLevel = computed(() => {
  return currentCharacterLevel.value + levelUps.value;
});

/**
 * 是否可以升级
 */
const canLevelUp = computed(() => {
  return levelUps.value > 0;
});

// ==================== 方法 ====================

/**
 * 增加指定类型的哥布林数量（每次增加升1级所需的固定数量）
 */
const increaseGoblin = (goblinTypeId: keyof SacrificeAmounts) => {
  const goblinType = goblinTypes.find(t => t.id === goblinTypeId);
  if (!goblinType) return;

  const current = sacrificeAmounts.value[goblinTypeId] || 0;
  const max = getGoblinCount(goblinTypeId);
  const requiredAmount = goblinType.requiredAmount; // 升1级所需的固定数量

  // 每次增加升1级所需的固定数量
  const nextAmount = current + requiredAmount;
  if (nextAmount <= max) {
    sacrificeAmounts.value[goblinTypeId] = nextAmount;
  } else if (current < max) {
    // 如果增加后超过上限，则增加到上限
    sacrificeAmounts.value[goblinTypeId] = max;
  }
};

/**
 * 减少指定类型的哥布林数量（每次减少升1级所需的固定数量）
 */
const decreaseGoblin = (goblinTypeId: keyof SacrificeAmounts) => {
  const goblinType = goblinTypes.find(t => t.id === goblinTypeId);
  if (!goblinType) return;

  const current = sacrificeAmounts.value[goblinTypeId] || 0;
  const requiredAmount = goblinType.requiredAmount; // 升1级所需的固定数量

  // 每次减少升1级所需的固定数量
  if (current >= requiredAmount) {
    sacrificeAmounts.value[goblinTypeId] = current - requiredAmount;
  } else if (current > 0) {
    // 如果当前数量小于所需数量，则直接减少到0
    sacrificeAmounts.value[goblinTypeId] = 0;
  }
};

/**
 * 处理关闭
 */
const handleClose = () => {
  // 重置献祭数量
  sacrificeAmounts.value = {
    normalGoblins: 0,
    warriorGoblins: 0,
    shamanGoblins: 0,
    paladinGoblins: 0,
  };
  emit('close');
};

/**
 * 处理确认
 */
const handleConfirm = () => {
  if (!selectedCharacterId.value) {
    return;
  }
  emit('confirm', selectedCharacterId.value, { ...sacrificeAmounts.value });
};

/**
 * 加载可升级人物列表
 */
const loadUpgradableCharacters = () => {
  upgradableCharacters.value = CharacterLevelUpService.getUpgradableCharacters();
  // 默认选择第一个人物
  if (upgradableCharacters.value.length > 0) {
    selectedCharacterId.value = upgradableCharacters.value[0].id;
  } else {
    selectedCharacterId.value = '';
  }
};

// 监听显示状态，重置数据
watch(
  () => props.show,
  newVal => {
    if (newVal) {
      // 加载可升级人物列表
      loadUpgradableCharacters();
      // 重置献祭数量
      sacrificeAmounts.value = {
        normalGoblins: 0,
        warriorGoblins: 0,
        shamanGoblins: 0,
        paladinGoblins: 0,
      };
    }
  },
);
</script>

<style lang="scss" scoped>
// ==================== 献祭对话框样式 ====================

.sacrifice-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.sacrifice-dialog {
  background: linear-gradient(180deg, rgba(40, 26, 20, 0.95), rgba(25, 17, 14, 0.98));
  border: 2px solid rgba(220, 38, 38, 0.5);
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(220, 38, 38, 0.3);
    padding-bottom: 12px;

    h4 {
      color: #ffd7a1;
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }

    .close-dialog {
      background: none;
      border: none;
      color: #f0e6d2;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(220, 38, 38, 0.2);
        color: #ff6b6b;
      }
    }
  }

  .dialog-content {
    .character-selection {
      margin-bottom: 16px;

      .character-label {
        display: block;
        color: #ffd7a1;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .character-select {
        width: 100%;
        background: rgba(28, 20, 17, 0.9);
        border: 1px solid rgba(205, 133, 63, 0.3);
        border-radius: 8px;
        color: #ffd7a1;
        padding: 10px 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }

        &:hover {
          border-color: rgba(205, 133, 63, 0.5);
        }

        option {
          background: rgba(28, 20, 17, 0.95);
          color: #ffd7a1;
        }
      }
    }

    .current-level-info {
      background: linear-gradient(180deg, rgba(34, 197, 94, 0.15), rgba(28, 20, 17, 0.9));
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;

      p {
        margin: 0;
        color: #f0e6d2;
        font-size: 16px;

        strong {
          color: #22c55e;
          font-size: 18px;
        }
      }
    }

    .goblin-selection {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .goblin-type-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(180deg, rgba(44, 30, 24, 0.8), rgba(28, 20, 17, 0.9));
      border: 1px solid rgba(205, 133, 63, 0.3);
      border-radius: 10px;
      padding: 12px;
      gap: 12px;

      .goblin-type-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;

        .goblin-icon {
          font-size: 24px;
        }

        .goblin-name {
          color: #ffd7a1;
          font-weight: 600;
          font-size: 14px;
          min-width: 100px;
        }

        .goblin-available {
          color: #9ca3af;
          font-size: 12px;
        }

        .goblin-experience {
          color: #22c55e;
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }
      }

      .goblin-input-group {
        display: flex;
        align-items: center;
        gap: 4px;

        .input-button {
          background: linear-gradient(180deg, rgba(205, 133, 63, 0.6), rgba(139, 69, 19, 0.8));
          color: #ffffff;
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover:not(:disabled) {
            background: linear-gradient(180deg, rgba(205, 133, 63, 0.8), rgba(139, 69, 19, 1));
            transform: scale(1.1);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .goblin-input {
          background: rgba(28, 20, 17, 0.9);
          border: 1px solid rgba(205, 133, 63, 0.3);
          border-radius: 6px;
          color: #ffd7a1;
          text-align: center;
          width: 60px;
          height: 32px;
          font-size: 14px;
          font-weight: 600;

          // 隐藏number输入框的上下箭头按钮
          appearance: textfield;
          -moz-appearance: textfield;
          &::-webkit-inner-spin-button,
          &::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }

          &:focus {
            outline: none;
            border-color: rgba(34, 197, 94, 0.5);
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
          }
        }
      }
    }

    .sacrifice-summary {
      background: linear-gradient(180deg, rgba(220, 38, 38, 0.15), rgba(28, 20, 17, 0.9));
      border: 1px solid rgba(220, 38, 38, 0.3);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;

      p {
        margin: 8px 0;
        color: #f0e6d2;
        font-size: 14px;

        strong {
          color: #ff6b6b;
          font-size: 16px;
        }

        &.level-up-preview {
          color: #22c55e;
          font-weight: 600;

          strong {
            color: #22c55e;
            font-size: 18px;
          }
        }

        &.insufficient-experience {
          color: #fbbf24;
        }
      }
    }
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;

    .cancel-button,
    .confirm-button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-button {
      background: linear-gradient(180deg, rgba(107, 114, 128, 0.6), rgba(75, 85, 99, 0.8));
      color: #ffffff;

      &:hover {
        background: linear-gradient(180deg, rgba(107, 114, 128, 0.8), rgba(75, 85, 99, 1));
        transform: translateY(-1px);
      }
    }

    .confirm-button {
      background: linear-gradient(180deg, #dc2626, #b91c1c);
      color: #ffffff;

      &:hover:not(:disabled) {
        background: linear-gradient(180deg, #ef4444, #dc2626);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

// ==================== 移动端响应式样式 ====================
@media (max-width: 768px) {
  .sacrifice-dialog-overlay {
    padding: 10px;
  }

  .sacrifice-dialog {
    padding: 16px;
    max-height: 95vh;
    border-radius: 12px;

    .dialog-header {
      margin-bottom: 16px;
      padding-bottom: 10px;

      h4 {
        font-size: 18px;
      }

      .close-dialog {
        font-size: 24px;
        width: 36px;
        height: 36px;
      }
    }

    .dialog-content {
      .character-selection {
        margin-bottom: 12px;

        .character-label {
          font-size: 13px;
          margin-bottom: 6px;
        }

        .character-select {
          padding: 12px;
          font-size: 14px;
        }
      }

      .current-level-info {
        padding: 10px;
        margin-bottom: 16px;

        p {
          font-size: 14px;

          strong {
            font-size: 16px;
          }
        }
      }

      .goblin-selection {
        gap: 10px;
        margin-bottom: 16px;
      }

      .goblin-type-row {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 12px;

        .goblin-type-info {
          flex-wrap: wrap;
          gap: 6px;

          .goblin-icon {
            font-size: 20px;
          }

          .goblin-name {
            font-size: 13px;
            min-width: auto;
            flex: 0 0 auto;
          }

          .goblin-available {
            font-size: 11px;
            flex: 1;
            min-width: 0;
          }

          .goblin-experience {
            font-size: 11px;
            margin-left: 0;
            flex: 0 0 100%;
          }
        }

        .goblin-input-group {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;

          .input-button {
            width: 44px;
            height: 44px;
            font-size: 20px;
            border-radius: 8px;
            // 增大触摸区域，避免误触
            min-width: 44px;
            min-height: 44px;
            // 添加触摸反馈
            -webkit-tap-highlight-color: rgba(205, 133, 63, 0.3);

            // 右侧加号按钮特殊处理，确保易于点击
            &:last-child {
              margin-left: auto;
              // 可以添加额外的视觉提示
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          }

          .goblin-input {
            flex: 1;
            min-width: 0;
            height: 44px;
            font-size: 16px;
            padding: 0 8px;
            // 移动端输入框字体要大一些，方便阅读
          }
        }
      }

      .sacrifice-summary {
        padding: 10px;
        margin-bottom: 16px;

        p {
          font-size: 13px;
          margin: 6px 0;

          strong {
            font-size: 15px;
          }

          &.level-up-preview {
            strong {
              font-size: 17px;
            }
          }
        }

        .requirement-item {
          display: block;
          margin: 4px 0;
          font-size: 12px;
        }
      }
    }

    .dialog-actions {
      flex-direction: column;
      gap: 10px;
      margin-top: 16px;

      .cancel-button,
      .confirm-button {
        width: 100%;
        padding: 12px 20px;
        font-size: 16px;
        // 移动端按钮要更大，便于点击
        min-height: 48px;
      }
    }
  }
}

// ==================== 小屏幕优化（最大宽度480px） ====================
@media (max-width: 480px) {
  .sacrifice-dialog {
    padding: 12px;

    .dialog-header {
      h4 {
        font-size: 16px;
      }
    }

    .dialog-content {
      .goblin-type-row {
        .goblin-input-group {
          .input-button {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .goblin-input {
            height: 40px;
            font-size: 15px;
          }
        }
      }
    }
  }
}
</style>
