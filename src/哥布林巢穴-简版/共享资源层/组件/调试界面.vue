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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Character } from '../../功能模块层/人物管理/类型/人物类型';
import { exploreService } from '../../功能模块层/探索/服务/探索服务';
import { modularSaveManager } from '../../核心层/服务/存档系统/模块化存档服务';

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

function close() {
  emit('close');
  fixResult.value = null;
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
</style>
