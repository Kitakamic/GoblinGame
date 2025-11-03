/**
 * Phase 1 导入路径更新脚本
 *
 * 使用方法：
 * node scripts/update-imports-phase1.js
 *
 * 注意：
 * 1. 运行前确保已提交所有改动或创建备份
 * 2. 运行后检查是否有遗漏的导入路径
 * 3. 建议使用 Git 查看改动（git diff）
 */

const fs = require('fs');
const path = require('path');

// 项目根目录
const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src', '哥布林巢穴-简版');

// 递归查找文件
function findSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 dist
      if (file !== 'node_modules' && file !== 'dist') {
        findSourceFiles(filePath, fileList);
      }
    } else {
      // 只处理 .ts, .vue, .js 文件
      const ext = path.extname(file);
      if (['.ts', '.vue', '.js'].includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// 需要更新的导入路径映射
const importMappings = [
  // 存档管理相关
  {
    from: /from ['"]\.\.\/存档管理\/(模块化存档服务|数据库服务|模块化存档类型|存档界面)['"]/g,
    to: (match, fileName) => `from '../core/save/${fileName}'`,
    description: '存档管理服务导入路径',
  },
  {
    from: /import ['"]\.\.\/存档管理\/(模块化存档服务|数据库服务|模块化存档类型|存档界面)['"]/g,
    to: (match, fileName) => `import '../core/save/${fileName}'`,
    description: '存档管理服务导入路径（import 形式）',
  },

  // 世界书服务相关
  {
    from: /from ['"]\.\.\/世界书管理\/世界书服务['"]/g,
    to: `from '../core/worldbook/services/世界书服务'`,
    description: '世界书服务导入路径',
  },
  {
    from: /from ['"]\.\.\/世界书管理\/剧情总结管理器['"]/g,
    to: `from '../core/worldbook/services/剧情总结管理器'`,
    description: '剧情总结管理器导入路径',
  },

  // 世界书管理器相关
  {
    from: /from ['"]\.\.\/世界书管理\/(人物信息管理器|资源同步管理器|战斗总结管理器|调教记录管理器|据点征服管理器|战前对话管理器|冒头事件管理器)['"]/g,
    to: (match, fileName) => `from '../core/worldbook/managers/${fileName}'`,
    description: '世界书管理器导入路径',
  },

  // 世界书工具相关
  {
    from: /from ['"]\.\.\/世界书管理\/(思维链管理器|记录构建器|世界书助手|AI生成助手)['"]/g,
    to: (match, fileName) => `from '../core/worldbook/utils/${fileName}'`,
    description: '世界书工具导入路径',
  },

  // 世界书类型相关
  {
    from: /from ['"]\.\.\/世界书管理\/世界书类型定义['"]/g,
    to: `from '../core/worldbook/types/世界书类型定义'`,
    description: '世界书类型定义导入路径',
  },

  // 世界书视图相关
  {
    from: /from ['"]\.\.\/世界书管理\/剧情总结界面['"]/g,
    to: `from '../core/worldbook/views/剧情总结界面'`,
    description: '剧情总结界面导入路径',
  },

  // 通用服务相关
  {
    from: /from ['"]\.\.\/服务\/(时间解析服务|确认框服务|弹窗提示服务|生育服务|行动力服务|献祭服务|玩家等级服务|人物升级服务|总结检查服务|欢迎提示服务|生成错误服务|版本信息)['"]/g,
    to: (match, fileName) => `from '../core/common/${fileName}'`,
    description: '通用服务导入路径',
  },
  {
    from: /import ['"]\.\.\/服务\/(时间解析服务|确认框服务|弹窗提示服务|生育服务|行动力服务|献祭服务|玩家等级服务|人物升级服务|总结检查服务|欢迎提示服务|生成错误服务|版本信息)['"]/g,
    to: (match, fileName) => `import '../core/common/${fileName}'`,
    description: '通用服务导入路径（import 形式）',
  },
];

// 查找所有需要更新的文件
function getAllFiles() {
  if (!fs.existsSync(srcDir)) {
    console.warn(`⚠️  目录不存在: ${srcDir}`);
    return [];
  }
  return findSourceFiles(srcDir);
}

// 更新单个文件的导入路径
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  const changes = [];

  importMappings.forEach(mapping => {
    const before = content;

    if (typeof mapping.to === 'function') {
      content = content.replace(mapping.from, mapping.to);
    } else {
      content = content.replace(mapping.from, mapping.to);
    }

    if (content !== before) {
      hasChanges = true;
      changes.push(mapping.description);
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relativePath = path.relative(projectRoot, filePath);
    console.log(`✅ 已更新: ${relativePath}`);
    if (changes.length > 0) {
      console.log(`   改动: ${changes.join(', ')}`);
    }
    return true;
  }

  return false;
}

// 主函数
function main() {
  console.log('🚀 开始更新 Phase 1 导入路径...\n');

  const files = getAllFiles();
  console.log(`📁 找到 ${files.length} 个文件\n`);

  let updatedCount = 0;
  files.forEach(file => {
    if (updateFile(file)) {
      updatedCount++;
    }
  });

  console.log(`\n✨ 完成！共更新 ${updatedCount} 个文件`);
  console.log('\n⚠️  请检查以下内容：');
  console.log('   1. 使用 git diff 查看所有改动');
  console.log('   2. 使用 TypeScript 编译器检查是否有错误');
  console.log('   3. 测试关键功能确保正常');
  console.log('   4. 如有遗漏，手动修复剩余的导入路径');
}

// 运行
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

module.exports = { updateFile, importMappings };
