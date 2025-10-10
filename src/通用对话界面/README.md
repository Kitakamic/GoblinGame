# 通用对话界面

这是一个基于调教界面设计的通用对话界面，可以用于各种特殊事件、任务对话等场景。

## 特性

- **可配置的对话流程**：支持自定义欢迎文本、初始选项等
- **灵活的AI集成**：支持自定义AI生成函数或使用默认AI
- **数据持久化**：支持对话历史的保存和加载
- **消息管理**：支持编辑、删除消息
- **选项系统**：支持预设选项和自定义输入
- **分页浏览**：支持对话历史的分页查看

## 使用方法

### 基本使用

```vue
<template>
  <GenericDialogueInterface
    :dialogue-config="dialogueConfig"
    @close="handleClose"
    @end-dialogue="handleEnd"
  />
</template>

<script setup>
import GenericDialogueInterface from './通用对话界面.vue';

const dialogueConfig = {
  title: '对话标题',
  subtitle: '对话副标题',
  welcomeText: '欢迎文本',
  welcomeHint: '提示文本',
  saveKey: 'unique_dialogue_key', // 用于数据持久化
  // ... 其他配置
};
</script>
```

### 配置选项

#### DialogueConfig 接口

```typescript
interface DialogueConfig {
  title: string;                    // 对话标题
  subtitle?: string;                 // 对话副标题
  welcomeText: string;              // 欢迎文本
  welcomeHint: string;              // 提示文本
  customPlaceholder?: string;       // 自定义输入占位符
  initialOptions?: DialogueOption[]; // 初始选项
  saveKey?: string;                 // 数据持久化键
  onOptionSelect?: (option: DialogueOption) => void;     // 选项选择回调
  onCustomInput?: (text: string) => void;                // 自定义输入回调
  onAIGenerate?: (userInput: string) => Promise<string>; // AI生成回调
  onDialogueEnd?: () => void;       // 对话结束回调
  onDialogueClose?: () => void;     // 对话关闭回调
}
```

#### DialogueOption 接口

```typescript
interface DialogueOption {
  text: string;    // 选项文本
  label?: string;  // 选项标签
  value?: any;     // 选项值
}
```

## 使用场景

### 1. 特殊事件对话

```typescript
const specialEventConfig = {
  title: '神秘商人',
  subtitle: '一个神秘的商人出现在你面前',
  welcomeText: '🎭 神秘商人',
  welcomeHint: '这个商人似乎有什么特别的东西要卖给你...',
  initialOptions: [
    { text: '询问商品', label: '询问' },
    { text: '讨价还价', label: '讨价' },
    { text: '直接离开', label: '离开' },
  ],
  saveKey: 'special_event_merchant',
  onAIGenerate: async (userInput) => {
    // 自定义AI生成逻辑
    return await window.TavernHelper.generate({
      user_input: `[特殊事件-神秘商人]\n用户说: ${userInput}`,
    });
  },
};
```

### 2. 任务对话

```typescript
const questConfig = {
  title: '村长委托',
  subtitle: '村长有重要的事情要告诉你',
  welcomeText: '🏘️ 村长委托',
  welcomeHint: '村长看起来有些焦急，似乎有什么紧急的事情...',
  initialOptions: [
    { text: '接受委托', label: '接受' },
    { text: '询问详情', label: '询问' },
    { text: '拒绝委托', label: '拒绝' },
  ],
  saveKey: 'quest_mayor',
  onDialogueEnd: () => {
    // 任务完成后的处理
    console.log('任务对话结束，获得任务奖励');
  },
};
```

### 3. 商店对话

```typescript
const shopConfig = {
  title: '魔法商店',
  subtitle: '欢迎来到魔法商店',
  welcomeText: '🛒 魔法商店',
  welcomeHint: '这里有各种神奇的魔法物品...',
  initialOptions: [
    { text: '查看商品', label: '查看' },
    { text: '购买物品', label: '购买' },
    { text: '出售物品', label: '出售' },
  ],
  saveKey: 'shop_magic',
  onOptionSelect: (option) => {
    // 根据选项执行不同的商店逻辑
    switch (option.label) {
      case '查看':
        // 显示商品列表
        break;
      case '购买':
        // 打开购买界面
        break;
      case '出售':
        // 打开出售界面
        break;
    }
  },
};
```

## 与调教界面的区别

| 特性         | 调教界面               | 通用对话界面         |
| ------------ | ---------------------- | -------------------- |
| 角色信息显示 | ✅ 显示角色头像、属性   | ❌ 不显示角色信息     |
| 属性变化解析 | ✅ 解析忠诚度、体力变化 | ❌ 不处理属性变化     |
| 世界书集成   | ✅ 更新世界书信息       | ❌ 不涉及世界书       |
| 业务逻辑耦合 | ✅ 高度耦合调教逻辑     | ❌ 低耦合，可配置     |
| 复用性       | ❌ 仅适用于调教         | ✅ 适用于各种对话场景 |
| 配置灵活性   | ❌ 固定配置             | ✅ 高度可配置         |

## 最佳实践

1. **合理使用回调函数**：根据具体场景实现相应的回调函数
2. **数据持久化**：为每个对话设置唯一的 `saveKey`
3. **错误处理**：在回调函数中添加适当的错误处理
4. **性能优化**：对于大量对话，考虑使用虚拟滚动
5. **样式定制**：可以通过CSS变量或主题系统定制界面样式

## 扩展功能

- 支持语音对话
- 支持多媒体内容（图片、音频、视频）
- 支持对话分支和条件逻辑
- 支持对话模板和预设
- 支持多语言国际化
