import { EventRarity, EventType, RandomEvent } from '../类型定义/事件类型';

// 回合开始随机事件配置
export const roundStartEvents: RandomEvent[] = [
  {
    id: 'round_start_rumors',
    name: '世界传闻',
    description: '关于哥布林巢穴的传闻在大陆上传播...',
    type: EventType.RANDOM,
    rarity: EventRarity.COMMON,
    trigger: {
      minRound: 1,
      probability: 0.2,
    },
    dialogueConfig: {
      title: '📰 世界传闻',
      subtitle: '关于哥布林巢穴的消息在世界上传播',
      welcomeText: '📰 世界传闻记录',
      welcomeHint: '最近，出现了一些关于哥布林巢穴的传闻，这些消息可能会影响你的发展...',
      showCustomInput: false, // 关闭自定义输入功能
      initialOptions: [
        { text: '仔细了解传闻', label: '了解', value: 'understand' },
        { text: '忽略这些消息', label: '忽略', value: 'ignore' },
      ],
      onAIGenerate: async () => {
        // 仔细了解传闻的提示词
        const prompt = `
        请作为一个中立的叙述者，讲述世界上目前对于哥布林巢穴的传闻。

指导原则：
1. 参考世界书中的相关设定，如世界设定/大陆设定/势力种族设定/哥布林设定等
2. 参考巢穴当前的资源状态/征服记录等信息，作为传闻的背景
3. 用第三人称叙述，类似故事中的旁白，语言要生动真实，符合奇幻冒险色情游戏的风格
4. 保持神秘和紧张的氛围
5. 字数控制在400字左右
`;

        try {
          const response = await window.TavernHelper.generate({
            user_input: prompt,
          });
          return response;
        } catch (error) {
          console.error('AI生成失败:', error);
          return '传闻在大陆上传播，但具体内容模糊不清...';
        }
      },
      onOptionSelect: (option: any) => {
        // 如果选择忽略，直接结束对话
        if (option.value === 'ignore') {
          console.log('玩家选择忽略传闻，直接结束对话');
          // 返回 false 阻止AI生成，直接结束对话
          return false;
        } else if (option.value === 'understand') {
          console.log('玩家选择了解传闻');
        }
        // 其他情况继续正常流程
        return true;
      },
      onDialogueClose: () => {
        console.log('传闻事件关闭');
      },
    },
  },
];
