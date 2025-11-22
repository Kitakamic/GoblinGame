<template>
  <div class="nest-container">
    <!-- 巢穴头部信息 -->
    <NestHeader :total-income="totalIncome" />

    <!-- 建筑分类标签 -->
    <BuildingTabs :active-tab="activeTab" @tab-change="activeTab = $event" />

    <!-- 建筑内容区域 -->
    <div class="building-content">
      <!-- 繁殖间建筑槽位 -->
      <BuildingSlotGrid
        v-if="activeTab === 'breeding'"
        :slots="breedingSlots"
        :slot-type="'breeding'"
        :get-slot-cost="getSlotCost"
        :is-next-unlock-slot="(index: number) => isNextUnlockSlot(index, 'breeding')"
        :get-occupant="(index: number) => getBreedingRoomOccupant(index)"
        @slot-click="(index: number) => handleSlotClick(index, 'breeding')"
        @remove-building="(index: number) => removeBuilding(index, 'breeding')"
        @sacrifice-click="() => {}"
      />

      <!-- 资源建筑槽位 -->
      <BuildingSlotGrid
        v-if="activeTab === 'resource'"
        :slots="resourceSlots"
        :slot-type="'resource'"
        :get-slot-cost="getSlotCost"
        :is-next-unlock-slot="(index: number) => isNextUnlockSlot(index, 'resource')"
        @slot-click="(index: number) => handleSlotClick(index, 'resource')"
        @remove-building="(index: number) => removeBuilding(index, 'resource')"
        @sacrifice-click="openSacrificeDialog"
      />
    </div>

    <!-- 建筑选择菜单 -->
    <BuildingMenu
      :show="showMenu"
      :available-buildings="availableBuildings"
      :can-build="canBuild as any"
      @close="closeMenu"
      @select-building="selectBuilding as any"
    />

    <!-- 献祭对话框 -->
    <SacrificeDialog :show="showSacrificeDialog" @close="closeSacrificeDialog" @confirm="handleSacrificeConfirm" />
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { SacrificeService, type SacrificeAmounts } from '../功能模块层/巢穴/服务/献祭服务';
import { modularSaveManager } from '../核心层/服务/存档系统/模块化存档服务';
import type { NestModuleData } from '../核心层/服务/存档系统/模块化存档类型';
import { PlayerLevelService } from '../核心层/服务/通用服务/玩家等级服务';
import { ConfirmService } from '../核心层/服务/通用服务/确认框服务';
// 巢穴界面子页面
import NestHeader from './巢穴界面子页面/巢穴头部.vue';
import BuildingTabs from './巢穴界面子页面/建筑标签页.vue';
import BuildingSlotGrid from './巢穴界面子页面/建筑槽位网格.vue';
import BuildingMenu from './巢穴界面子页面/建筑选择菜单.vue';
import SacrificeDialog from './巢穴界面子页面/献祭对话框.vue';

// ==================== 类型定义 ====================

/**
 * 建筑效果接口
 */
interface BuildingEffect {
  type: string;
  icon: string;
  description: string;
}

/**
 * 建筑成本接口
 */
interface BuildingCost {
  gold: number;
  food: number;
}

/**
 * 建筑收入接口
 */
interface BuildingIncome {
  gold?: number;
  food?: number;
}

/**
 * 建筑接口定义
 */
interface Building {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: BuildingCost;
  category: 'breeding' | 'resource';
  income?: BuildingIncome; // 每回合收入
  effects: BuildingEffect[];
}

/**
 * 建筑槽位接口定义
 */
interface BuildingSlot {
  building: Building | null;
  unlocked: boolean;
}

/**
 * 槽位类型
 */
type SlotType = 'breeding' | 'resource';

/**
 * 槽位成本接口
 */
interface SlotCost {
  gold: number;
  food: number;
}

// ==================== 资源管理 ====================

// 直接使用 modularSaveManager 获取错误提示功能
const getInsufficientResourcesMessage = modularSaveManager.getInsufficientResourcesMessage.bind(modularSaveManager);

// ==================== 建筑和槽位资源管理 ====================

/**
 * 检查是否能负担建筑成本
 */
const canAffordBuilding = (cost: { gold: number; food: number }): boolean => {
  return modularSaveManager.hasEnoughResources([
    { type: 'gold', amount: cost.gold, reason: '建筑成本' },
    { type: 'food', amount: cost.food, reason: '建筑成本' },
  ]);
};

/**
 * 支付建筑成本
 */
const payForBuilding = (cost: { gold: number; food: number }, buildingName: string): boolean => {
  return modularSaveManager.consumeResources([
    { type: 'gold', amount: cost.gold, reason: `建设${buildingName}` },
    { type: 'food', amount: cost.food, reason: `建设${buildingName}` },
  ]);
};

/**
 * 检查是否能负担槽位开通成本
 */
const canAffordSlotExpansion = (cost: { gold: number; food: number }): boolean => {
  return modularSaveManager.hasEnoughResources([
    { type: 'gold', amount: cost.gold, reason: '槽位开通' },
    { type: 'food', amount: cost.food, reason: '槽位开通' },
  ]);
};

/**
 * 支付槽位开通成本
 */
const payForSlotExpansion = (cost: { gold: number; food: number }): boolean => {
  return modularSaveManager.consumeResources([
    { type: 'gold', amount: cost.gold, reason: '开通槽位' },
    { type: 'food', amount: cost.food, reason: '开通槽位' },
  ]);
};

// ==================== 响应式数据 ====================

// 界面状态
const activeTab = ref<SlotType>('breeding');
const showMenu = ref(false);
const selectedSlotIndex = ref(-1);
const selectedSlotType = ref<SlotType>('breeding');

// 建筑槽位数据
const breedingSlots = ref<BuildingSlot[]>([]);
const resourceSlots = ref<BuildingSlot[]>([]);

// 人物数据
const characters = ref<any[]>([]);

// ==================== 献祭相关数据 ====================

// 献祭对话框状态
const showSacrificeDialog = ref(false);
const currentSacrificeSlotIndex = ref(-1);

// ==================== 建筑数据定义 ====================

/**
 * 繁殖间建筑列表
 */
const breedingBuildings: Building[] = [
  {
    id: 'breeding',
    name: '繁殖间',
    icon: '👶',
    description: '用于俘虏生育哥布林',
    cost: { gold: 50, food: 30 },
    category: 'breeding',
    effects: [{ type: 'breeding', icon: '👶', description: '俘虏生育哥布林' }],
  },
];

/**
 * 资源建筑列表
 */
const resourceBuildings: Building[] = [
  {
    id: 'food',
    name: '食物间',
    icon: '🍖',
    description: '每回合+20食物',
    cost: { gold: 100, food: 50 },
    category: 'resource',
    income: { food: 20 },
    effects: [{ type: 'food', icon: '🍖', description: '每回合+20食物' }],
  },
  {
    id: 'trade',
    name: '贸易间',
    icon: '💰',
    description: '每回合+30金钱',
    cost: { gold: 150, food: 30 },
    category: 'resource',
    income: { gold: 30 },
    effects: [{ type: 'gold', icon: '💰', description: '每回合+30金钱' }],
  },
  {
    id: 'food_warehouse',
    name: '食物仓库',
    icon: '🏚️',
    description: '提高食物储存，食物总收入+10%',
    cost: { gold: 200, food: 120 },
    category: 'resource',
    effects: [{ type: 'food_multiplier', icon: '🍖', description: '食物收入+10%' }],
  },
  {
    id: 'gold_hall',
    name: '金币大厅',
    icon: '🏦',
    description: '改善金币储存，金币总收入+10%',
    cost: { gold: 260, food: 80 },
    category: 'resource',
    effects: [{ type: 'gold_multiplier', icon: '💰', description: '金钱收入+10%' }],
  },
  {
    id: 'sacrifice_altar',
    name: '献祭祭坛',
    icon: '🔥',
    description: '献祭哥布林升级人物等级',
    cost: { gold: 3000, food: 1500 },
    category: 'resource',
    effects: [{ type: 'sacrifice', icon: '🔥', description: '献祭哥布林升级等级' }],
  },
];

// ==================== 计算属性 ====================

/**
 * 当前可用建筑列表（根据选中的标签页）
 */
const availableBuildings = computed(() => {
  const buildings = activeTab.value === 'breeding' ? breedingBuildings : resourceBuildings;

  // 为繁殖间计算动态成本
  if (activeTab.value === 'breeding') {
    return buildings.map(building => {
      if (building.id === 'breeding') {
        const existingBreedingCount = breedingSlots.value.filter(slot => slot.building?.id === 'breeding').length;
        return {
          ...building,
          cost: {
            gold: building.cost.gold + existingBreedingCount * 25,
            food: building.cost.food + existingBreedingCount * 15,
          },
        };
      }
      return building;
    });
  }

  // 资源建筑：过滤掉已存在的献祭祭坛（只允许建造1个）
  return buildings.filter(building => {
    if (building.id === 'sacrifice_altar') {
      // 检查是否已经有献祭祭坛
      const existingAltarCount = resourceSlots.value.filter(slot => slot.building?.id === 'sacrifice_altar').length;
      return existingAltarCount === 0; // 如果已经有1个或以上，则不显示
    }
    return true;
  });
});

/**
 * 计算所有建筑的总收入
 */
const totalIncome = computed(() => {
  let totalGold = 0;
  let totalFood = 0;

  // 计算繁殖间建筑收入
  breedingSlots.value.forEach(slot => {
    if (slot.building && slot.building.income) {
      if (slot.building.income.gold) totalGold += slot.building.income.gold;
      if (slot.building.income.food) totalFood += slot.building.income.food;
    }
  });

  // 计算资源建筑收入
  resourceSlots.value.forEach(slot => {
    if (slot.building && slot.building.income) {
      if (slot.building.income.gold) totalGold += slot.building.income.gold;
      if (slot.building.income.food) totalFood += slot.building.income.food;
    }
  });

  // 应用加成：每座食物仓库使食物收入+10%，每座金币大厅使金钱收入+10%
  const foodWarehouseCount = resourceSlots.value.filter(s => s.building?.id === 'food_warehouse').length;
  const goldHallCount = resourceSlots.value.filter(s => s.building?.id === 'gold_hall').length;

  if (foodWarehouseCount > 0) {
    totalFood = Math.round(totalFood * Math.pow(1.1, foodWarehouseCount));
  }
  if (goldHallCount > 0) {
    totalGold = Math.round(totalGold * Math.pow(1.1, goldHallCount));
  }

  return { gold: totalGold, food: totalFood };
});

// ==================== 槽位管理 ====================

/**
 * 初始化建筑槽位
 */
const initializeSlots = () => {
  console.log('开始初始化槽位...');

  // 初始化繁殖间槽位
  breedingSlots.value = [];
  // 前两个槽位默认开通，首槽位放置繁殖间
  breedingSlots.value.push({
    building: breedingBuildings.find(b => b.id === 'breeding') || null,
    unlocked: true,
  });
  breedingSlots.value.push({
    building: null,
    unlocked: true,
  });

  // 初始化资源建筑槽位
  resourceSlots.value = [];
  // 第一个槽位默认开通并放置食物间
  resourceSlots.value.push({
    building: resourceBuildings.find(b => b.id === 'food') || null,
    unlocked: true,
  });
  // 第二个槽位默认开通并放置贸易间
  resourceSlots.value.push({
    building: resourceBuildings.find(b => b.id === 'trade') || null,
    unlocked: true,
  });
  // 添加一个可开通的槽位
  resourceSlots.value.push({
    building: null,
    unlocked: false,
  });

  console.log('槽位初始化完成:');
  console.log('繁殖间槽位:', breedingSlots.value);
  console.log('资源建筑槽位:', resourceSlots.value);
};

/**
 * 添加新槽位
 */
const addNewSlot = (type: SlotType) => {
  if (type === 'breeding') {
    breedingSlots.value.push({
      building: null,
      unlocked: false,
    });
  } else {
    resourceSlots.value.push({
      building: null,
      unlocked: false,
    });
  }
};

/**
 * 获取槽位开通成本
 */
const getSlotCost = (index: number): SlotCost => {
  // 繁殖间和资源建筑使用相同的槽位开通成本逻辑：前2个槽位免费，其后逐渐增加
  const baseGold = 200;
  const baseFood = 100;
  const multiplier = Math.max(0, index - 1); // 前2个槽位免费
  return {
    gold: baseGold + multiplier * 50,
    food: baseFood + multiplier * 20,
  };
};

// ==================== 槽位状态管理 ====================

/**
 * 处理槽位点击事件
 */
const handleSlotClick = (index: number, type: SlotType) => {
  const slots = type === 'breeding' ? breedingSlots.value : resourceSlots.value;
  const slot = slots[index];

  if (!slot.unlocked) {
    // 检查是否可以开通（按顺序开通）
    if (canUnlockSlot(index, type)) {
      const cost = getSlotCost(index);

      // 检查资源是否足够
      if (canAffordSlotExpansion(cost)) {
        // 消耗资源并开通槽位
        if (payForSlotExpansion(cost)) {
          slot.unlocked = true;
          // 开通槽位后，添加一个新的可开通槽位
          addNewSlot(type);
          // 立即保存，确保数据不丢失
          saveBuildingData();
          console.log('槽位开通成功，数据已保存');
        }
      } else {
        // 显示资源不足提示
        const message = getInsufficientResourcesMessage([
          { type: 'gold', amount: cost.gold, reason: '槽位开通' },
          { type: 'food', amount: cost.food, reason: '槽位开通' },
        ]);
        console.log(message);
        // 这里可以显示toast提示
      }
    }
    // 如果不能开通，不显示任何提示，保持界面简洁
  } else if (!slot.building) {
    // 选择建筑
    showBuildingMenu(index, type);
  }
};

/**
 * 检查是否可以开通槽位（按顺序开通）
 */
const canUnlockSlot = (index: number, type: SlotType) => {
  const slots = type === 'breeding' ? breedingSlots.value : resourceSlots.value;

  if (type === 'breeding') {
    // 繁殖间：与资源建筑相同，前2个槽位默认开通
    if (index < 2) return true;

    // 检查前面的槽位是否都已开通
    for (let i = 2; i < index; i++) {
      if (!slots[i].unlocked) {
        return false;
      }
    }
    return true;
  } else {
    // 资源建筑：前2个槽位默认开通
    if (index < 2) return true;

    // 检查前面的槽位是否都已开通
    for (let i = 2; i < index; i++) {
      if (!slots[i].unlocked) {
        return false;
      }
    }
    return true;
  }
};

/**
 * 检查是否是下一个可开通的槽位
 */
const isNextUnlockSlot = (index: number, type: SlotType) => {
  const slots = type === 'breeding' ? breedingSlots.value : resourceSlots.value;
  if (slots[index].unlocked) return false;

  if (type === 'breeding') {
    // 繁殖间：与资源建筑相同，从索引2开始查找第一个未开通的槽位
    for (let i = 2; i < slots.length; i++) {
      if (!slots[i].unlocked) {
        return i === index;
      }
    }
  } else {
    // 资源建筑：从索引2开始查找第一个未开通的槽位
    for (let i = 2; i < slots.length; i++) {
      if (!slots[i].unlocked) {
        return i === index;
      }
    }
  }
  return false;
};

// getSlotClasses 已移至 BuildingSlotGrid 组件内部

// ==================== 建筑菜单管理 ====================

/**
 * 显示建筑选择菜单
 */
const showBuildingMenu = (slotIndex: number, type: SlotType) => {
  selectedSlotIndex.value = slotIndex;
  selectedSlotType.value = type;
  showMenu.value = true;
};

/**
 * 关闭建筑菜单
 */
const closeMenu = () => {
  showMenu.value = false;
  selectedSlotIndex.value = -1;
};

// ==================== 建筑建设管理 ====================

/**
 * 检查是否可以建设指定建筑
 */
const canBuild = (building: Building) => {
  // 检查献祭祭坛是否已存在（只允许建造1个）
  if (building.id === 'sacrifice_altar') {
    const existingAltarCount = resourceSlots.value.filter(slot => slot.building?.id === 'sacrifice_altar').length;
    if (existingAltarCount >= 1) {
      return false; // 已经有一个献祭祭坛，不能再建造
    }
    return canAffordBuilding(building.cost);
  }

  if (building.id === 'breeding') {
    // 繁殖间成本基于现有数量
    const existingBreedingCount = breedingSlots.value.filter(slot => slot.building?.id === 'breeding').length;
    const dynamicCost = {
      gold: building.cost.gold + existingBreedingCount * 25,
      food: building.cost.food + existingBreedingCount * 15,
    };
    return canAffordBuilding(dynamicCost);
  } else {
    return canAffordBuilding(building.cost);
  }
};

/**
 * 选择建筑进行建设
 */
const selectBuilding = (building: Building) => {
  // 检查献祭祭坛是否已存在
  if (building.id === 'sacrifice_altar') {
    const existingAltarCount = resourceSlots.value.filter(slot => slot.building?.id === 'sacrifice_altar').length;
    if (existingAltarCount >= 1) {
      console.log('献祭祭坛只能建造1个');
      // 可以在这里显示提示消息
      return;
    }
  }

  if (!canBuild(building)) {
    // 显示资源不足提示
    let cost = building.cost;
    if (building.id === 'breeding') {
      // 繁殖间使用动态成本
      const existingBreedingCount = breedingSlots.value.filter(slot => slot.building?.id === 'breeding').length;
      cost = {
        gold: building.cost.gold + existingBreedingCount * 25,
        food: building.cost.food + existingBreedingCount * 15,
      };
    }
    const message = getInsufficientResourcesMessage([
      { type: 'gold', amount: cost.gold, reason: `建设${building.name}` },
      { type: 'food', amount: cost.food, reason: `建设${building.name}` },
    ]);
    console.log(message);
    return;
  }

  if (selectedSlotIndex.value >= 0) {
    // 计算实际成本
    let actualCost = building.cost;
    if (building.id === 'breeding') {
      // 繁殖间使用动态成本
      const existingBreedingCount = breedingSlots.value.filter(slot => slot.building?.id === 'breeding').length;
      actualCost = {
        gold: building.cost.gold + existingBreedingCount * 25,
        food: building.cost.food + existingBreedingCount * 15,
      };
    }

    // 消耗资源并建设建筑
    if (payForBuilding(actualCost, building.name)) {
      const slots = selectedSlotType.value === 'breeding' ? breedingSlots.value : resourceSlots.value;
      slots[selectedSlotIndex.value].building = building;
      // 立即保存，确保数据不丢失
      saveBuildingData();
      console.log('建筑建设成功，数据已保存');
      closeMenu();
    }
  }
};

/**
 * 拆除建筑
 */
const removeBuilding = async (slotIndex: number, type: SlotType) => {
  const slots = type === 'breeding' ? breedingSlots.value : resourceSlots.value;
  const building = slots[slotIndex].building;
  if (!building) return;

  const confirmed = await ConfirmService.showWarning(
    `确定要拆除 ${building.name} 吗？`,
    '确认拆除',
    `拆除后将失去该建筑的所有效果，且无法恢复。`,
  );

  if (confirmed) {
    slots[slotIndex].building = null;
    // 立即保存，确保数据不丢失
    saveBuildingData();
    console.log('建筑拆除成功，数据已保存');
  }
};

// ==================== 数据持久化 ====================

/**
 * 保存建筑数据到模块化存档系统
 */
const saveBuildingData = (): void => {
  try {
    // 计算当前总收入
    const currentTotalIncome = totalIncome.value;

    const nestData: NestModuleData = {
      breedingSlots: breedingSlots.value,
      resourceSlots: resourceSlots.value,
      activeTab: activeTab.value,
      totalIncome: currentTotalIncome,
      breedingRoomInfo: [], // 繁殖间信息由调教界面同步管理
    };

    console.log('保存巢穴数据到模块化存档系统:', nestData);

    // 使用模块化存档服务更新巢穴数据
    modularSaveManager.updateModuleData({
      moduleName: 'nest',
      data: nestData,
    });

    console.log('巢穴数据保存成功');
  } catch (error) {
    console.error('保存巢穴数据失败:', error);
    // 可以在这里添加用户提示
  }
};

/**
 * 从模块化存档系统加载建筑数据
 */
const loadBuildingData = (): void => {
  try {
    console.log('从模块化存档系统加载巢穴数据');

    // 获取当前游戏数据
    const currentGameData = modularSaveManager.getCurrentGameData();

    if (currentGameData && currentGameData.nest) {
      const nestData = currentGameData.nest;
      console.log('加载到巢穴数据:', nestData);

      // 更新界面数据
      breedingSlots.value = nestData.breedingSlots || [];
      resourceSlots.value = nestData.resourceSlots || [];
      activeTab.value = nestData.activeTab || 'breeding';

      console.log('巢穴数据加载成功');
    } else {
      console.log('没有找到巢穴数据，使用初始数据');
      // 如果没有数据，使用初始数据
      const initialNestData = modularSaveManager.getInitialNestData();
      if (initialNestData) {
        breedingSlots.value = initialNestData.breedingSlots;
        resourceSlots.value = initialNestData.resourceSlots;
        activeTab.value = initialNestData.activeTab;
        console.log('使用初始巢穴数据');
      } else {
        console.warn('无法获取初始巢穴数据');
      }
    }
  } catch (error) {
    console.error('加载巢穴数据失败:', error);
    // 发生错误时使用初始数据作为后备
    try {
      const initialNestData = modularSaveManager.getInitialNestData();
      if (initialNestData) {
        breedingSlots.value = initialNestData.breedingSlots;
        resourceSlots.value = initialNestData.resourceSlots;
        activeTab.value = initialNestData.activeTab;
        console.log('使用初始数据作为后备方案');
      }
    } catch (fallbackError) {
      console.error('后备方案也失败:', fallbackError);
    }
  }
};

// ==================== 自动保存机制 ====================

/**
 * 监听建筑数据变化，自动保存
 */
watch(
  [breedingSlots, resourceSlots, activeTab],
  () => {
    // 延迟保存，避免频繁保存
    setTimeout(() => {
      saveBuildingData();
    }, 100);
  },
  { deep: true },
);

// ==================== 组件生命周期 ====================

/**
 * 组件挂载时初始化
 */
onMounted(() => {
  console.log('巢穴界面挂载');
  // 初始化槽位
  initializeSlots();
  // 直接加载建筑数据，简单可靠
  loadBuildingData();
  // 加载人物数据
  loadCharacters();
});

/**
 * 获取交配间占用者
 */
const getBreedingRoomOccupant = (roomIndex: number) => {
  const roomId = `breeding-${roomIndex}`;

  // 首先从巢穴模块的繁殖间信息中查找
  try {
    const nestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;
    if (nestData && nestData.breedingRoomInfo) {
      const roomInfo = nestData.breedingRoomInfo.find((room: any) => room.roomId === roomId);
      if (roomInfo) {
        return {
          id: roomInfo.characterId,
          name: roomInfo.characterName,
          status: roomInfo.status,
        };
      }
    }
  } catch (error) {
    console.error('从巢穴模块获取繁殖间信息失败:', error);
  }

  // 如果巢穴模块中没有，则从人物数据中查找（兼容性）
  return characters.value.find(
    char => char.locationId === roomId && (char.status === 'breeding' || char.status === 'imprisoned'),
  );
};

/**
 * 加载人物数据
 */
const loadCharacters = () => {
  try {
    const trainingData = modularSaveManager.getModuleData({ moduleName: 'training' }) as any;
    if (trainingData && trainingData.characters) {
      characters.value = trainingData.characters;
    }
  } catch (error) {
    console.error('加载人物数据失败:', error);
  }
};

/**
 * 同步繁殖间占用信息
 */
const syncBreedingRoomInfo = () => {
  try {
    const breedingRoomInfo: any[] = [];

    // 遍历所有人物，找出占用繁殖间的人物
    characters.value.forEach(char => {
      if (char.locationId && char.locationId.startsWith('breeding-')) {
        breedingRoomInfo.push({
          roomId: char.locationId,
          characterId: char.id,
          characterName: char.name,
          status: char.status === 'breeding' ? 'breeding' : 'imprisoned',
          occupiedAt: new Date(),
        });
      }
    });

    // 获取当前巢穴数据
    const currentNestData = modularSaveManager.getModuleData({ moduleName: 'nest' }) as any;

    // 更新巢穴数据
    modularSaveManager.updateModuleData({
      moduleName: 'nest',
      data: {
        ...currentNestData,
        breedingRoomInfo: breedingRoomInfo,
      },
    });

    console.log('巢穴界面：繁殖间占用信息已同步:', breedingRoomInfo);
  } catch (error) {
    console.error('巢穴界面：同步繁殖间信息失败:', error);
  }
};

/**
 * 组件激活时重新加载数据（防止从其他页面返回时数据不同步）
 */
onActivated(() => {
  console.log('巢穴界面激活');
  loadBuildingData();
  loadCharacters();
  // 同步繁殖间信息，确保显示最新状态
  syncBreedingRoomInfo();
});

// ==================== 献祭相关方法 ====================

/**
 * 打开献祭对话框
 */
const openSacrificeDialog = (slotIndex: number) => {
  currentSacrificeSlotIndex.value = slotIndex;
  showSacrificeDialog.value = true;
};

/**
 * 关闭献祭对话框
 */
const closeSacrificeDialog = () => {
  showSacrificeDialog.value = false;
  currentSacrificeSlotIndex.value = -1;
};

/**
 * 处理献祭确认
 */
const handleSacrificeConfirm = async (characterId: string, sacrificeAmounts: SacrificeAmounts) => {
  // 计算献祭总数和提示信息
  const totalAmount =
    sacrificeAmounts.normalGoblins +
    sacrificeAmounts.warriorGoblins +
    sacrificeAmounts.shamanGoblins +
    sacrificeAmounts.paladinGoblins;
  const sacrificeMessage = SacrificeService.getSacrificeMessage(characterId, sacrificeAmounts);

  // 确认献祭
  const confirmed = await ConfirmService.showWarning(
    `确定要献祭 ${totalAmount} 个哥布林吗？`,
    '确认献祭',
    `将消耗 ${totalAmount} 个哥布林，${sacrificeMessage.message}`,
  );

  if (!confirmed) {
    return;
  }

  // 执行献祭
  const result = SacrificeService.performSacrifice(characterId, sacrificeAmounts);

  if (result.success) {
    if (result.newLevel > result.oldLevel) {
      console.log(result.message);
      // 献祭成功后，更新玩家等级（因为人物等级提升了）
      PlayerLevelService.updatePlayerLevel();
      // 触发事件通知调教界面刷新人物数据
      eventEmit('人物等级更新');
      // 可以在这里显示成功提示
    } else {
      console.log(result.message);
      // 即使等级没有提升，也更新玩家等级（确保玩家等级是最新的）
      PlayerLevelService.updatePlayerLevel();
      // 可以在这里显示提示
    }
  } else {
    console.error(result.message);
    // 可以在这里显示错误提示
    return;
  }

  // 关闭对话框
  closeSacrificeDialog();
};
</script>

<style lang="scss" scoped>
// ==================== 基础容器样式 ====================

.nest-container {
  height: calc(100vh - 90px);
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
}

// 头部和标签页样式已移至子组件

// ==================== 内容区域样式 ====================

.building-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.building-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 槽位、网格、菜单和献祭按钮样式已移至子组件
</style>
