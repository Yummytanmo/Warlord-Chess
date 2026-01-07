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

## 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 安装与运行

1. **克隆项目并安装依赖**
   ```bash
   git clone <repository-url>
   cd warlord-chess
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   应用将在 http://localhost:3000 启动

3. **构建生产版本**
   ```bash
   npm run build
   npm start
   ```

### 开发命令

```bash
# 启动开发服务器（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行所有测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 运行测试UI界面
npm run test:ui

# 运行E2E测试
npm run test:e2e

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 游戏说明

1. 打开浏览器访问 http://localhost:3000
2. 当前版本支持基础象棋对战，武将选择功能正在开发中
3. 点击棋子进行选择，拖拽或点击目标位置进行移动
4. 体验流畅的棋子动画和现代化的游戏界面

**注意**: 武将技能系统和英雄选择功能将在后续版本中推出

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

- **传统象棋规则与楚汉英雄技能的创新结合** - 在经典象棋基础上加入英雄技能系统（开发中）
- **现代化Web技术栈** - 使用Next.js 14、TypeScript等最新技术，提供流畅的游戏体验
- **完整的测试覆盖** - 包括单元测试、属性测试和E2E测试，确保游戏质量
- **响应式设计** - 支持桌面和移动设备，随时随地畅玩
- **实时对战** - 支持在线多人对战（规划中）

## 开发进度

当前已完成的功能：
- ✅ 基础象棋规则和移动验证
- ✅ Konva.js渲染引擎和棋盘界面
- ✅ 棋子拖拽和动画效果
- ✅ 完整的测试框架（单元测试、属性测试）
- ✅ TypeScript类型系统

正在开发的功能：
- 🚧 武将技能系统
- 🚧 英雄选择界面
- 🚧 游戏状态管理优化

计划中的功能：
- 📋 在线多人对战
- 📋 游戏回放系统
- 📋 AI对手

## 技术亮点

- **属性测试（Property-Based Testing）** - 使用fast-check进行全面的游戏逻辑验证
- **Canvas渲染** - 基于Konva.js的高性能游戏渲染引擎
- **状态管理** - 使用Zustand进行轻量级状态管理
- **类型安全** - 完整的TypeScript类型定义，减少运行时错误

## 历史背景

游戏以楚汉争霸时期为背景，玩家可以选择项羽、刘邦、韩信、萧何、张良、樊哙等历史名将，每个英雄都拥有独特的技能，为传统象棋带来全新的策略体验。

## 故障排除

### 常见问题

**Q: 启动时出现端口占用错误**
```bash
# 检查端口占用
lsof -i :3000
# 或者使用其他端口启动
npm run dev -- -p 3001
```

**Q: 依赖安装失败**
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

**Q: 测试运行失败**
```bash
# 确保所有依赖已安装
npm install
# 运行类型检查
npm run type-check
```

### 开发建议

- 推荐使用VS Code并安装TypeScript、ESLint扩展
- 开发前运行 `npm run type-check` 确保类型正确
- 提交代码前运行 `npm test` 确保所有测试通过

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情