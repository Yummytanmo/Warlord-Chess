# 楚汉棋战 | Warlord Chess

结合楚汉英雄技能的创新象棋游戏

An innovative chess game with Chu-Han hero abilities

## 技术栈

- **Next.js 14** - React全栈框架
- **TypeScript 5.x** - 类型安全
- **Tailwind CSS** - 样式框架
- **Konva.js + React-Konva** - 游戏渲染引擎
- **Framer Motion** - 动画库
- **Zustand** - 状态管理
- **Vitest** - 测试框架
- **fast-check** - 属性测试
- **Playwright** - E2E测试

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 运行E2E测试
npm run test:e2e

# 类型检查
npm run type-check
```

## 项目结构

```
src/
├── app/                 # Next.js App Router
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   └── game/           # 游戏相关组件
├── types/              # TypeScript类型定义
├── store/              # Zustand状态管理
├── lib/                # 工具函数
└── test/               # 测试文件
    ├── properties/     # 属性测试
    └── e2e/           # E2E测试
```

## 游戏特色

- 传统象棋规则与楚汉英雄技能的创新结合
- 现代化Web技术栈，流畅的游戏体验
- 完整的测试覆盖，包括属性测试和E2E测试
- 响应式设计，支持多种设备

## 历史背景

游戏以楚汉争霸时期为背景，玩家可以选择项羽、刘邦、韩信、萧何、张良、樊哙等历史名将，每个英雄都拥有独特的技能，为传统象棋带来全新的策略体验。