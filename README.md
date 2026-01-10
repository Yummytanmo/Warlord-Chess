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

## 部署

### Docker 部署（推荐）

使用 Docker 部署可以确保环境一致性和快速部署。当前配置已集成 Nginx 反向代理，支持通过 80/443 端口直接访问。

#### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

#### 快速部署

1. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env.production

   # 编辑环境变量，修改 NEXT_PUBLIC_APP_URL 为你的实际域名或服务器IP（无需端口号）
   nano .env.production
   ```

   关键配置项：
   ```env
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_APP_URL=http://47.121.129.139
   NEXT_TELEMETRY_DISABLED=1
   ```

2. **构建并启动容器**
   ```bash
   # 构建镜像并启动服务（包含 Nginx 反向代理）
   docker compose up -d --build

   # 查看运行状态
   docker compose ps

   # 查看日志
   docker compose logs -f
   ```

3. **访问应用**

   部署成功后，通过浏览器访问：
   - **HTTP**: `http://47.121.129.139` （无需端口号）
   - 如需 HTTPS，请参考 [SSL_SETUP.md](SSL_SETUP.md) 配置 HTTPS 证书

#### 架构说明

当前部署架构包含：
- **Nginx** (端口 80/443): 反向代理，处理 HTTP/HTTPS 请求和 WebSocket 连接
- **Warlord Chess** (内部端口 3000): Next.js 应用，仅在内网可访问
- 两个服务通过 Docker 网络通信，确保安全性

#### 容器管理命令

```bash
# 查看容器状态
docker compose ps

# 查看实时日志
docker compose logs -f warlord-chess

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重新构建并启动
docker compose up -d --build

# 进入容器调试
docker exec -it warlord-chess sh
```

#### 可选配置

**启用 Redis 持久化**（用于生产环境房间数据持久化）：

编辑 `docker-compose.yml`，取消 Redis 相关配置的注释：
```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: warlord-chess-redis
    restart: unless-stopped
    ...
```

然后在环境变量中配置：
```env
REDIS_URL=redis://redis:6379/0
```

### 传统部署

如果不使用 Docker，可以直接在服务器上运行：

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 生产环境启动
NODE_ENV=production node server.js
```

使用 PM2 进程管理器（推荐）：
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name warlord-chess

# 查看状态
pm2 status

# 查看日志
pm2 logs warlord-chess

# 设置开机自启
pm2 startup
pm2 save
```

### HTTPS 配置

如果需要配置 HTTPS（推荐用于生产环境），请参考 [SSL_SETUP.md](SSL_SETUP.md) 文档，支持以下方案：
- Let's Encrypt 免费证书（推荐）
- 自签名证书（仅用于测试）
- 商业 SSL 证书

### 安全建议

1. **防火墙配置**：只开放 80 和 443 端口
2. **HTTPS 加密**：使用 SSL/TLS 证书保护数据传输
3. **环境变量**：不要将敏感信息提交到代码仓库
4. **定期更新**：保持 Docker 镜像和依赖包更新
5. **监控日志**：定期检查访问日志和错误日志

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