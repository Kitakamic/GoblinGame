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

      <!-- 全局建筑（点建式） -->
      <GlobalBuildingsGrid
        v-if="activeTab === 'global'"
        :available-buildings="globalBuildings"
        :built-buildings="builtGlobalBuildings"
        :is-unlocked="checkGlobalBuildingUnlock"
        :can-build="canBuildGlobalBuilding"
        @build="handleBuildGlobalBuilding"
        @remove="handleRemoveGlobalBuilding"
        @interact="handleGlobalBuildingInteract"
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

    <!-- 谒见厅界面 -->
    <AudienceHallInterface :show="showAudienceHall" @close="showAudienceHall = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { SacrificeService, type SacrificeAmounts } from '../功能模块层/巢穴/服务/献祭服务';
import { modularSaveManager } from '../核心层/服务/存档系统/模块化存档服务';
import type { NestModuleData } from '../核心层/服务/存档系统/模块化存档类型';
import { PlayerLevelService } from '../核心层/服务/通用服务/玩家等级服务';
import { ConfirmService } from '../核心层/服务/通用服务/确认框服务';
// 建筑类型和数据
import { breedingBuildings, globalBuildings, resourceBuildings } from '../功能模块层/巢穴/数据/建筑数据';
import type { Building, BuildingSlot, SlotCost, SlotType } from '../功能模块层/巢穴/类型/建筑类型';
// 巢穴界面子页面
import GlobalBuildingsGrid from './巢穴界面子页面/全局建筑网格.vue';
import AudienceHallInterface from './巢穴界面子页面/全局建筑页面/谒见厅界面.vue';
import NestHeader from './巢穴界面子页面/巢穴头部.vue';
import BuildingTabs from './巢穴界面子页面/建筑标签页.vue';
import BuildingSlotGrid from './巢穴界面子页面/建筑槽位网格.vue';
import BuildingMenu from './巢穴界面子页面/建筑选择菜单.vue';
import SacrificeDialog from './巢穴界面子页面/献祭对话框.vue';

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
// 全局建筑使用点建式，记录已建造数量
const builtGlobalBuildings = ref<Record<string, number>>({});

// 人物数据
const characters = ref<any[]>([]);

// ==================== 献祭相关数据 ====================

// 献祭对话框状态
const showSacrificeDialog = ref(false);
const currentSacrificeSlotIndex = ref(-1);

// 谒见厅界面状态
const showAudienceHall = ref(false);

// ==================== 建筑数据 ====================
// 建筑数据已从 '../功能模块层/巢穴/数据/建筑数据' 导入

// ==================== 计算属性 ====================

/**
 * 当前可用建筑列表（根据选中的标签页）
 */
const availableBuildings = computed(() => {
  let buildings: Building[];
  if (activeTab.value === 'breeding') {
    buildings = breedingBuildings;
  } else if (activeTab.value === 'resource') {
    buildings = resourceBuildings;
  } else {
    buildings = globalBuildings;
  }

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
  if (activeTab.value === 'resource') {
    return buildings.filter(building => {
      if (building.id === 'sacrifice_altar') {
        // 检查是否已经有献祭祭坛
        const existingAltarCount = resourceSlots.value.filter(slot => slot.building?.id === 'sacrifice_altar').length;
        return existingAltarCount === 0; // 如果已经有1个或以上，则不显示
      }
      return true;
    });
  }

  // 全局建筑：直接返回所有建筑
  return buildings;
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

  // 计算全局建筑收入（点建式）
  globalBuildings.forEach(building => {
    const count = builtGlobalBuildings.value[building.id] || 0;
    if (count > 0 && building.income) {
      if (building.income.gold) totalGold += building.income.gold * count;
      if (building.income.food) totalFood += building.income.food * count;
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

  // 初始化全局建筑（点建式，不需要槽位）
  builtGlobalBuildings.value = {};

  console.log('槽位初始化完成:');
  console.log('繁殖间槽位:', breedingSlots.value);
  console.log('资源建筑槽位:', resourceSlots.value);
  console.log('全局建筑（点建式）:', builtGlobalBuildings.value);
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
  } else if (type === 'resource') {
    resourceSlots.value.push({
      building: null,
      unlocked: false,
    });
  }
  // 全局建筑使用点建式，不需要添加槽位
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
  // 全局建筑使用点建式，不在这里处理
  if (type === 'global') {
    return;
  }
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
  // 全局建筑使用点建式，不在这里处理
  if (type === 'global') {
    return false;
  }
  const slots = type === 'breeding' ? breedingSlots.value : resourceSlots.value;

  if (type === 'breeding') {
    // 繁殖间：前2个槽位默认开通
    if (index < 2) return true;

    // 检查前面的槽位是否都已开通
    for (let i = 2; i < index; i++) {
      if (!slots[i].unlocked) {
        return false;
      }
    }
    return true;
  } else if (type === 'resource') {
    // 资源建筑：前2个槽位默认开通
    if (index < 2) return true;

    // 检查前面的槽位是否都已开通
    for (let i = 2; i < index; i++) {
      if (!slots[i].unlocked) {
        return false;
      }
    }
    return true;
  } else {
    // 全局建筑：前1个槽位默认开通
    if (index < 1) return true;

    // 检查前面的槽位是否都已开通
    for (let i = 1; i < index; i++) {
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
  // 全局建筑使用点建式，不在这里处理
  if (type === 'global') {
    return false;
  }
  const slots = type === 'breeding' ? breedingSlots.value : resourceSlots.value;
  if (slots[index].unlocked) return false;

  if (type === 'breeding') {
    // 繁殖间：从索引2开始查找第一个未开通的槽位
    for (let i = 2; i < slots.length; i++) {
      if (!slots[i].unlocked) {
        return i === index;
      }
    }
  } else if (type === 'resource') {
    // 资源建筑：从索引2开始查找第一个未开通的槽位
    for (let i = 2; i < slots.length; i++) {
      if (!slots[i].unlocked) {
        return i === index;
      }
    }
  } else {
    // 全局建筑：从索引1开始查找第一个未开通的槽位
    for (let i = 1; i < slots.length; i++) {
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
      // 全局建筑使用点建式，不在这里处理
      if (selectedSlotType.value === 'global') {
        console.warn('全局建筑应使用点建式，不应通过菜单建造');
        return;
      }

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
  const slots = type === 'breeding' ? breedingSlots.value : type === 'resource' ? resourceSlots.value : [];
  const building = slots[slotIndex]?.building;
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

// ==================== 全局建筑点建式管理 ====================

/**
 * 检查全局建筑是否解锁（简化版：只检查建筑前置和布尔值）
 */
const checkGlobalBuildingUnlock = (building: Building): boolean => {
  if (!building.unlockCondition) {
    return true; // 没有解锁条件，默认解锁
  }

  const condition = building.unlockCondition;

  // 检查布尔值解锁状态（由外部逻辑设置）
  if (condition.isUnlocked !== undefined) {
    return condition.isUnlocked;
  }

  // 检查需要建造的其他建筑
  if (condition.requiredBuildings && condition.requiredBuildings.length > 0) {
    for (const requiredId of condition.requiredBuildings) {
      const count = builtGlobalBuildings.value[requiredId] || 0;
      if (count === 0) {
        return false;
      }
    }
  }

  return true;
};

/**
 * 检查是否可以建造全局建筑
 */
const canBuildGlobalBuilding = (building: Building): boolean => {
  // 检查是否解锁
  if (!checkGlobalBuildingUnlock(building)) {
    return false;
  }

  // 全局建筑每个只能建造一个（maxCount = 1）
  const currentCount = builtGlobalBuildings.value[building.id] || 0;
  if (currentCount >= 1) {
    return false;
  }

  // 检查资源是否足够
  return canAffordBuilding(building.cost);
};

/**
 * 建造全局建筑
 */
const handleBuildGlobalBuilding = (building: Building) => {
  if (!canBuildGlobalBuilding(building)) {
    const message = getInsufficientResourcesMessage([
      { type: 'gold', amount: building.cost.gold, reason: `建设${building.name}` },
      { type: 'food', amount: building.cost.food, reason: `建设${building.name}` },
    ]);
    console.log(message);
    return;
  }

  // 消耗资源
  if (payForBuilding(building.cost, building.name)) {
    // 全局建筑每个只能建造一个
    builtGlobalBuildings.value[building.id] = 1;

    // 立即保存
    saveBuildingData();
    console.log(`全局建筑 ${building.name} 建造成功`);
  }
};

/**
 * 拆除全局建筑
 */
const handleRemoveGlobalBuilding = async (building: Building) => {
  const currentCount = builtGlobalBuildings.value[building.id] || 0;
  if (currentCount === 0) return;

  const confirmed = await ConfirmService.showWarning(
    `确定要拆除一个 ${building.name} 吗？`,
    '确认拆除',
    `当前已建造 ${currentCount} 个，拆除后将失去该建筑的所有效果。`,
  );

  if (confirmed) {
    builtGlobalBuildings.value[building.id] = currentCount - 1;
    if (builtGlobalBuildings.value[building.id] === 0) {
      delete builtGlobalBuildings.value[building.id];
    }
    // 立即保存
    saveBuildingData();
    console.log(`全局建筑 ${building.name} 拆除成功，剩余数量: ${builtGlobalBuildings.value[building.id] || 0}`);
  }
};

/**
 * 处理全局建筑互动
 * 根据建筑ID打开对应的互动界面
 */
const handleGlobalBuildingInteract = (building: Building) => {
  console.log(`进入 ${building.name} 进行互动`);

  // 根据建筑ID打开对应的界面
  if (building.id === 'audience_hall') {
    showAudienceHall.value = true;
  }
  // 未来可以在这里添加其他建筑的互动界面
  // 例如：if (building.id === 'brothel') { showBrothel.value = true; }
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
      globalSlots: [], // 全局建筑改为点建式，不再使用槽位
      builtGlobalBuildings: builtGlobalBuildings.value,
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

      // 加载全局建筑（点建式）
      if (nestData.builtGlobalBuildings) {
        builtGlobalBuildings.value = nestData.builtGlobalBuildings;
      } else if (nestData.globalSlots && nestData.globalSlots.length > 0) {
        // 旧存档迁移：如果使用旧的 globalSlots，转换为点建式
        console.log('检测到旧存档，迁移全局建筑数据');
        const migrated: Record<string, number> = {};
        nestData.globalSlots.forEach(slot => {
          if (slot.building) {
            migrated[slot.building.id] = (migrated[slot.building.id] || 0) + 1;
          }
        });
        builtGlobalBuildings.value = migrated;
        // 立即保存更新后的数据
        saveBuildingData();
      } else {
        builtGlobalBuildings.value = {};
      }

      // 确保谒见厅默认存在（新建筑迁移）
      if (!builtGlobalBuildings.value['audience_hall']) {
        builtGlobalBuildings.value['audience_hall'] = 1;
        // 立即保存更新后的数据
        saveBuildingData();
        console.log('为旧存档添加默认谒见厅');
      }

      activeTab.value = nestData.activeTab || 'breeding';

      console.log('巢穴数据加载成功');
    } else {
      console.log('没有找到巢穴数据，使用初始数据');
      // 如果没有数据，使用初始数据
      const initialNestData = modularSaveManager.getInitialNestData();
      if (initialNestData) {
        breedingSlots.value = initialNestData.breedingSlots;
        resourceSlots.value = initialNestData.resourceSlots;
        // 全局建筑使用点建式
        builtGlobalBuildings.value = initialNestData.builtGlobalBuildings || {};
        // 确保谒见厅默认存在
        if (!builtGlobalBuildings.value['audience_hall']) {
          builtGlobalBuildings.value['audience_hall'] = 1;
        }
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
        // 全局建筑使用点建式
        builtGlobalBuildings.value = initialNestData.builtGlobalBuildings || {};
        // 确保谒见厅默认存在
        if (!builtGlobalBuildings.value['audience_hall']) {
          builtGlobalBuildings.value['audience_hall'] = 1;
        }
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

  // 检查是否需要自动打开谒见厅
  const eventToOpen = (window as any).openAudienceHallWithEvent;
  if (eventToOpen) {
    showAudienceHall.value = true;
    // 清除标记
    delete (window as any).openAudienceHallWithEvent;
  }
});

// 监听打开谒见厅的自定义事件
const handleOpenAudienceHall = (event: CustomEvent) => {
  if (event.detail?.event) {
    showAudienceHall.value = true;
  }
};

onMounted(() => {
  window.addEventListener('open-audience-hall', handleOpenAudienceHall as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('open-audience-hall', handleOpenAudienceHall as EventListener);
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
