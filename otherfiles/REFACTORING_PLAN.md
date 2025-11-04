# 人物卡界面重构计划

## 当前问题
- 单文件2918行，难以维护
- 功能模块耦合度高
- 样式代码占据大量空间（约1800+行）
- JSON编辑器逻辑复杂且独立性强

## 拆分方案

### 1. 核心组件拆分（高优先级）

#### CharacterJSONEditor.vue
**位置**: `共享资源层/组件/CharacterJSONEditor.vue`
**职责**: 
- JSON编辑器的完整功能
- 字段名中英文转换逻辑
- JSON验证和保存逻辑
**优势**: 
- 完全独立，可在其他地方复用
- 逻辑复杂，分离后更易维护

#### CharacterAvatar.vue
**位置**: `共享资源层/组件/CharacterAvatar.vue`
**职责**:
- 人物头像展示
- 评级徽章显示
- 等级标签
- 状态标签
**优势**: 
- 可复用于其他界面（如人物列表）
- 样式独立，易于调整

#### CharacterStats.vue
**位置**: `共享资源层/组件/CharacterStats.vue`
**职责**:
- 堕落值、体力、生育值展示
- 属性条样式和动画
- 生育记录统计
**优势**:
- 属性展示逻辑独立
- 可在其他地方复用

### 2. 信息展示组件拆分（中优先级）

#### CharacterBasicInfo.vue
**位置**: `调教界面子页面/组件/CharacterBasicInfo.vue`
**职责**: 基础信息展示（身份、种族、年龄、国家）

#### CharacterAppearance.vue
**位置**: `调教界面子页面/组件/CharacterAppearance.vue`
**职责**: 外貌信息展示（身高、体重、三围、描述）

#### ClothingDisplay.vue
**位置**: `调教界面子页面/组件/ClothingDisplay.vue`
**职责**: 衣着信息展示（可折叠）

#### LifeStorySection.vue
**位置**: `调教界面子页面/组件/LifeStorySection.vue`
**职责**: 人生经历展示（含解锁逻辑）

#### SensitivePointsSection.vue
**位置**: `调教界面子页面/组件/SensitivePointsSection.vue`
**职责**: 敏感点详情展示（含解锁逻辑）

#### SecretsSection.vue
**位置**: `调教界面子页面/组件/SecretsSection.vue`
**职责**: 恐惧和秘密展示（含解锁逻辑）

### 3. 通用组件

#### LockedContentSection.vue
**位置**: `共享资源层/组件/LockedContentSection.vue`
**职责**: 
- 锁定内容展示的通用UI
- 锁定消息和动画
**优势**: 可复用，统一锁定样式

## 拆分后的文件结构

```
调教界面子页面/
├── 人物卡界面.vue (主组件，约800-1000行)
├── 换装界面.vue
├── 选项式调教界面.vue
└── 组件/
    ├── CharacterBasicInfo.vue
    ├── CharacterAppearance.vue
    ├── ClothingDisplay.vue
    ├── LifeStorySection.vue
    ├── SensitivePointsSection.vue
    └── SecretsSection.vue

共享资源层/
└── 组件/
    ├── CharacterJSONEditor.vue
    ├── CharacterAvatar.vue
    ├── CharacterStats.vue
    └── LockedContentSection.vue
```

## 重构步骤

1. **第一阶段**: 拆分JSON编辑器（最独立）
2. **第二阶段**: 拆分头像和属性展示（复用性高）
3. **第三阶段**: 拆分信息展示组件
4. **第四阶段**: 提取通用锁定组件

## 预期收益

- **可维护性**: 每个组件职责单一，易于理解和修改
- **可复用性**: 头像、属性等组件可在其他界面复用
- **可测试性**: 小组件更容易编写单元测试
- **性能**: 可按需加载组件，减少初始加载体积

## 注意事项

- 保持props和events接口的一致性
- 注意样式的作用域（scoped）
- 确保响应式数据正确传递
- 保持向后兼容，不影响现有功能

