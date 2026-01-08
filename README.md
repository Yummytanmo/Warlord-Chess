# 楚汉棋战 | Warlord Chess

结合楚汉英雄技能的创新象棋游戏

An innovative chess game with Chu-Han hero abilities

## 技术栈

- **Next.js 14** - React全栈框架
- **TypeScript 5.x** - 类型安全
- **Tailwind CSS** - 样式框架
- **Konva.js + React-Konva** - 游戏渲染引擎
- **Socket.IO** - 实时多人对战通信
- **Framer Motion** - 动画库
- **Zustand** - 状态管理
- **Vitest** - 测试框架
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

2. **启动服务器（支持多人对战）**
   ```bash
   # 启动自定义服务器 (Next.js + Socket.IO)
   node server.js
   ```
   
   应用将在 http://localhost:3000 启动

3. **构建生产版本**
   ```bash
   npm run build
   NODE_ENV=production node server.js
   ```

### 开发命令

```bash
# 启动开发服务器（Next.js 默认，不支持多人对战 Socket 功能）
npm run dev

# 启动支持多人对战的开发服务器
node server.js

# 运行所有测试
npm test

# 运行E2E测试
npm run test:e2e

# 代码检查
npm run lint
```

### 游戏说明

1. **多人对战**：访问首页点击“创建房间”，将链接分享给好友即可开始对战。
2. **武将选择**：游戏开始前，双方需选择一名楚汉名将（如项羽、刘邦、韩信等）。
3. **英雄技能**：每个武将拥有独特的被动、主动或限定技，点击武将头像旁的技能按钮即可释放。
4. **游戏控制**：支持悔棋、提和、认输、重新开始及重选武将功能。
5. **规则增强**：实现了“送将检测”（禁止自杀步）及“对面笑”（飞将）等传统规则。

## 项目结构

```
src/
├── app/                 # Next.js App Router
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   └── game/           # 游戏相关组件（棋盘、武将面板、对话框等）
├── types/              # TypeScript类型定义
├── store/              # Zustand状态管理
├── lib/                # 核心逻辑（GameManager, 棋盘规则, 武将数据）
└── test/               # 测试文件
server.js               # 自定义 Socket.IO 服务器
```

## 游戏特色

- **传统象棋与英雄技能的结合** - 在经典象棋基础上加入丰富的武将技能系统。
- **实时多人对战** - 基于 Socket.IO 的稳定房间系统和状态同步。
- **现代化 Web 技术栈** - 提供流畅的动画和响应式界面。
- **完善的规则校验** - 包含合规移动检查、将军检测、送将检测等。

## 开发进度

当前已完成的功能：
- ✅ 基础象棋规则和移动验证
- ✅ Konva.js 渲染引擎和棋盘界面
- ✅ 实时多人对战（房间系统、状态同步）
- ✅ 武将技能系统（项羽、刘邦、韩信、萧何、张良、樊哙）
- ✅ 悔棋、提和、认输、重新开始、重选武将
- ✅ 防止送将逻辑（Suicide Prevention）
- ✅ 完整的测试框架（单元测试、集成测试、E2E测试）

计划中的功能：
- 📋 更多武将扩展
- 📋 游戏回放系统
- 📋 AI 对手（单机模式）

## 历史背景

游戏以楚汉争霸时期为背景，玩家可以选择项羽、刘邦、韩信、萧何、张良、樊哙等历史名将，每个英雄都拥有独特的技能，为传统象棋带来全新的策略体验。

## 故障排除

### 常见问题

**Q: 启动时出现端口占用错误**
```bash
# 检查端口占用
lsof -i :3000
# 杀掉占用进程
kill -9 <PID>
```

**Q: 多人对战无法连接**
- 确保使用 `node server.js` 启动服务器，而不是 `npm run dev`。
- 检查网络连接及防火墙设置。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情