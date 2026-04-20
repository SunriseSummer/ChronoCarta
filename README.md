# 🏞️山海绘卷 ChronoCarta

一款面向旅行爱好者的个人地点收藏应用。在高德地图上记录足迹、管理照片、由 AI 自动生成旅行文案，并以瀑布流形式回顾所有地点。

---

## 功能概览

- **地图足迹** — 基于高德地图 JS API，气泡标记展示所有已到访地点，点击标记查看详情
- **地点搜索** — 关键字模糊匹配已有地点和高德 POI，支持自动定位当前位置
- **多图上传** — 一次性上传多张照片，自动剥离方向信息并生成三级 WebP 缩略图
- **自适应封面** — Banner 跟随封面照片比例自动调整（竖图固定 1:1，横图保留原比例），最高占屏 60 vh
- **AI 文案** — BYOK 模式调用 OpenAI 兼容接口，基于地点信息 + 图片流式生成文案
- **风格标签** — 内置 13 种文案风格标签（人文地理、实用攻略、吐槽日记、赞美河山、历史沧桑、文化民俗、美食诱惑、自由旷野、摄影视角、小表情、古诗引用、小红书风等）可组合，支持自定义提示词
- **拍摄时间** — 上传照片时自动从 EXIF 提取拍摄时间（`taken_at`），支持前端展示
- **账号系统** — 用户名/密码登录，scrypt 密码哈希，会话基于 Bearer Token + SQLite 存储
- **权限控制** — 普通用户只能编辑自己的地点；管理员可管理全部数据；未登录只能浏览公共地点
- **私密/共享** — 每个地点可独立切换 `private`/`shared` 可见性
- **主题切换** — 跟随系统或手动切换亮色/暗色

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript 5.9 |
| 构建工具 | Vite 8 |
| 样式方案 | Tailwind CSS 4 |
| 路由 | React Router 7（HashRouter） |
| 地图 | 高德地图 JS API (`@amap/amap-jsapi-loader`) |
| 图标 | `@iconify/react`（Solar / HugeIcons） |
| 状态管理 | React Context + `useMemo` |
| IndexedDB | `idb`（客户端离线缓存） |
| 后端框架 | Express 5 |
| 数据库 | SQLite（`better-sqlite3`，WAL 模式） |
| 图片处理 | `sharp` |
| 文件上传 | `multer` |
| 密码哈希 | Node `crypto.scrypt` |

---

## 项目结构

```text
app/
├── server/                     # 后端 Express 服务
│   ├── index.ts                  # REST API 入口（路由、鉴权、错误处理）
│   ├── transformers.ts           # DB 行 → API 响应的转换层
│   ├── db/
│   │   ├── connection.ts           # SQLite 连接 & 迁移
│   │   ├── schema.ts               # 建表 DDL
│   │   ├── types.ts                # PlaceRow 等 DB 行类型
│   │   ├── places.ts               # 地点 CRUD
│   │   ├── photos.ts               # 照片 CRUD
│   │   ├── users.ts                # 用户 & 会话
│   │   └── settings.ts             # 键值设置
│   ├── routes/
│   │   ├── places.ts               # /api/places 路由
│   │   ├── auth.ts                 # /api/auth 路由
│   │   └── settings.ts             # /api/settings 路由
│   ├── middleware/
│   │   └── auth.ts                 # Bearer Token 鉴权中间件
│   └── services/
│       └── images.ts               # 图片管线（目录约定、缩略图生成）
├── seed/                       # 预设数据导入脚本
│   ├── seed.ts                   # 统一种子入口（用户 + 预置地点）
│   ├── seed-presets.ts           # 将 seed/presets 下的图文导入数据库
│   ├── seed-users.ts             # 创建 admin / demo 等初始账号
│   └── presets/                  # 预设地点原始资源
├── shared/
│   └── exif.ts                   # EXIF 提取（前后端共用）
├── client/
│   ├── App.tsx                   # 路由装配
│   ├── main.tsx                  # 应用入口
│   ├── index.css                 # Tailwind 入口 & 主题变量
│   ├── components/
│   │   ├── BannerFrame.tsx         # 通用 Banner 外框（比例计算 + 渐变 + 插槽）
│   │   ├── HeroBanner.tsx          # 只读页 Banner（封装 BannerFrame）
│   │   ├── PlaceEditor.tsx         # 地点编辑器（新增 / 编辑复用）
│   │   ├── AIWriter.tsx            # AI 文案生成面板
│   │   ├── AIConfigSection.tsx     # AI 服务配置表单（BYOK）
│   │   ├── AppToast.tsx            # 通用 Toast 提示
│   │   ├── TagEditor.tsx           # 标签编辑
│   │   ├── PhotoStrip.tsx          # 照片条 / 查看器
│   │   ├── StatsCard.tsx           # 坐标 / 高度 / 时间信息卡
│   │   ├── HeaderActionButton.tsx  # 统一圆角工具按钮
│   │   ├── PageContainer.tsx       # 页面内容最大宽度容器
│   │   ├── PageSection.tsx         # 区块标题 + 说明
│   │   ├── PageLoading.tsx         # 加载占位
│   │   └── map/                    # 地图页局部 UI
│   │       ├── MapSearchPanel.tsx    # 搜索输入 + 下拉候选
│   │       ├── SelectedLocationPanel.tsx # 临时选点信息面板
│   │       ├── MapQuickNav.tsx       # 右下角竖排快捷导航（集锦 / 我的）
│   │       └── SelectedLocationPanel.tsx # 选点信息面板
│   ├── features/
│   │   └── map/                  # 地图业务逻辑
│   │       ├── amap.ts             # 高德 SDK 加载 & 初始化
│   │       ├── types.ts            # 地图域类型
│   │       ├── utils.ts            # 距离 / 搜索等工具
│   │       ├── useAmapPlaceMap.ts   # 地图生命周期、标记管理
│   │       └── useMapSearch.ts     # 搜索候选状态机
│   ├── hooks/
│   │   └── usePlaceDetail.ts     # 根据 URL 参数解析当前地点
│   ├── pages/
│   │   ├── MapView.tsx           # 地图主页（默认路由 /）
│   │   ├── GridView.tsx          # 地点瀑布流（子页 /grid）
│   │   ├── ProfilePage.tsx       # 用户中心（头像、统计、AI 配置、主题、退出）
│   │   ├── PlacePage.tsx         # 新增地点（/place）
│   │   ├── DetailPage.tsx        # 编辑地点（/edit/:id）
│   │   ├── ViewPage.tsx          # 只读详情页（/view/:id）
│   │   └── LoginPage.tsx         # 登录页（/login）
│   ├── store/
│   │   ├── context.tsx           # AppProvider / useEffect 数据初始化
│   │   ├── places-context.ts     # Context 类型 + createContext
│   │   ├── usePlaces.ts          # useContext 快捷钩子
│   │   ├── db.ts                 # 前端 API 客户端（统一 fetch 封装）
│   │   └── ai.ts                 # AI 调用：流式生成、连通性测试
│   ├── lib/
│   │   ├── constants.ts          # 风格标签、服务商、主题常量等
│   │   ├── exif.ts               # 浏览器端 EXIF 拍摄时间提取
│   │   ├── upload.ts             # 照片上传 + EXIF 提取工具
│   │   ├── theme.ts              # 主题切换 Hook
│   │   └── utils.ts              # 通用工具（格式化、去重、封面提取）
│   └── types/
│       └── index.ts              # 跨层共享类型定义（Place 等）
├── data/                       # ⚠️ 运行时目录（首次运行自动生成，已在 .gitignore）
│   ├── travel.db                 # SQLite 数据库文件（含 -wal / -shm）
│   └── images/                   # 上传的原图与缩略图
│       ├── _tmp/                   # multer 临时上传目录
│       ├── _preset/                # 预置地点图片
│       ├── avatars/                # 用户头像
│       └── <username>/             # 用户地点图片（按用户名分组）
├── doc/
│   ├── database.md               # 数据库设计文档
│   └── deploy.md                 # 部署指南
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json / tsconfig.*.json
├── eslint.config.js
└── README.md
```

---

## 页面与导航

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | `MapView` | 主页（地图）。右下角竖排浮动入口进入 **集锦** / **我的** |
| `/grid` | `GridView` | 地点瀑布流。左上角 ← 返回地图 |
| `/profile` | `ProfilePage` | 用户中心（头像、统计、AI 配置、主题、退出）。左上角 ← 返回地图 |
| `/place` | `PlacePage` | 从地图选点后进入，创建新地点 |
| `/edit/:id` | `DetailPage` | 编辑既有地点（仅作者/管理员） |
| `/view/:id` | `ViewPage` | 只读查看（所有人） |
| `/login` | `LoginPage` | 账号登录 |

地图页面的“集锦”“我的”浮动按钮**采用竖排玻璃态风格**，与编辑/返回按钮视觉一致。子页面统一使用左上角 `HeaderActionButton` 返回地图。

---

## 环境要求

- **Node.js** ≥ 18（推荐 20+）
- **C++ 工具链**（`better-sqlite3` / `sharp` 需要原生构建）
  - Windows：Visual Studio Build Tools（含 MSVC 和 Python3）
  - macOS：`xcode-select --install`
  - Linux：`sudo apt install build-essential python3`

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 导入预置用户和预设地点
npm run seed

# 3. 同时启动前后端开发服务器
npm run dev
#   → 前端 http://localhost:5173
#   → 后端 http://localhost:3001
```

初始账号默认在 `seed/seed-users.ts` 中定义，请在首次部署后立刻修改密码或清空 seed 数据。

### 单独启动

```bash
npm run dev:client   # 仅前端（Vite）
npm run dev:server   # 仅后端（tsx watch）
```

### 生产构建

```bash
npm run build        # tsc + vite build + tsc server，产物位于 dist-client/ 和 dist-server/
npm run build:client # 仅构建前端
npm run build:server # 仅构建后端
npm run preview      # 本地预览生产构建
```

### 生产部署

```bash
# 启动后端（推荐使用 PM2 / systemd 托管）
PORT=8080 node dist-server/index.js
```

前端 `dist-client/` 通过 Nginx 托管，`/api` 与 `/images` 反向代理到后端 3001 端口：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    root /path/to/dist-client;
    try_files $uri $uri/ /index.html;
  }
  location /api    { proxy_pass http://127.0.0.1:3001; }
  location /images { proxy_pass http://127.0.0.1:3001; }
}
```

> **安全提示**：`client/lib/constants.ts` 目前直连高德 Web 端 Key；若需在公网部署，建议通过后端代理高德请求或改用密钥白名单限制。

> 详细部署说明见 [doc/deploy.md](doc/deploy.md)。

---

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前后端开发服务器（`concurrently`） |
| `npm run dev:client` | 仅启动 Vite 前端开发服务器 |
| `npm run dev:server` | 仅启动 Express API 服务器（tsx watch 热重载） |
| `npm run seed` | 导入预设地点与初始用户 |
| `npm run build` | TypeScript 编译 + Vite 生产构建 + 后端编译 |
| `npm run build:client` | 仅构建前端（`tsc -b && vite build`） |
| `npm run build:server` | 仅构建后端（`tsc -p tsconfig.server.json`） |
| `npm run lint` | ESLint 代码检查 |
| `npm run preview` | 预览生产构建结果 |

---

## REST API

所有路由统一前缀 `/api`，使用 `Authorization: Bearer <token>` 鉴权。错误响应格式：`{ "error": "<message>" }`，HTTP 状态码即语义码。

### 认证

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/auth/login` | 公开 | 登录，成功返回 `{ user, token }` |
| POST | `/auth/logout` | 登录 | 注销当前 token |
| GET | `/auth/me` | 登录 | 获取当前用户信息 |

### 地点

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/places` | 可选 | 列出可见地点（未登录仅返回公开 / 预设） |
| GET | `/places/:id` | 可选 | 地点详情（含照片、标签） |
| POST | `/places` | 登录 | 创建地点 |
| PUT | `/places/:id` | 作者 / 管理员 | 更新地点 |
| DELETE | `/places/:id` | 作者 / 管理员 | 级联删除地点、照片、磁盘文件 |

### 照片

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/places/:id/photos` | 作者 / 管理员 | `multipart/form-data` 上传照片，自动生成三级缩略图 |
| DELETE | `/photos/:photoId` | 作者 / 管理员 | 删除单张照片（含所有缩略图文件） |

### 设置

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/settings/:key` | 公开 | 读取全局配置 |
| PUT | `/settings/:key` | 管理员 | 写全局配置 |
| GET | `/user/settings/:key` | 登录 | 读取当前用户配置（例如 `ai-config`） |
| PUT | `/user/settings/:key` | 登录 | 写当前用户配置 |

---

## 数据库

使用 SQLite（WAL 模式），文件位于 `data/travel.db`。核心表：

- **users** — 账户信息、scrypt 密码哈希、角色（`admin` / `user`）、头像路径
- **sessions** — Bearer token 会话表
- **places** — 地点主表（坐标、标题、描述、可见性、作者、`image_dir` 等）
- **tags** / **place_tags** — 标签与多对多关联
- **photos** — 照片记录（原图 + 三级缩略图相对路径）
- **settings** — 键值配置（作用域：全局 / 用户）

详细建表语句及索引见 [doc/database.md](doc/database.md)。

---

## 图片处理流程

上传照片经过以下处理（全部并行，失败自动回滚已写入的部分文件）：

1. 原图保存为 `data/images/<image_dir>/<uuid>.<ext>`
2. 从内存 Buffer 一次读入，`sharp` 并发生成三种 WebP：
   - `_sm.webp` — 128 × 128（cover 裁切），用于地图气泡
   - `_md.webp` — 640 × 640（cover 裁切），用于瀑布流 / 照片条
   - `_banner.webp` — 最大 1600 × 1200（保留原比例 inside 缩放），用于详情 Banner

目录命名约定：

| 类型 | 模式 | 示例 |
|------|------|------|
| 用户地点 `image_dir` | `<username>/<lat>N-<lng>E-<YYYYMMDDHHmmss>` | `alice/30.1234N-120.5678E-20260418120000` |
| 用户地点 `route_path` | `<userHash>-<coord>-<ts>` | `a1b2c3d4-30.1234N-120.5678E-20260418120000` |
| 预设地点 `image_dir` | `_preset/<coord>-<ts>` | `_preset/30.1234N-120.5678E-20260418120000` |
| 预设地点 `route_path` | `<coord>-<ts>` | `30.1234N-120.5678E-20260418120000` |
| 头像 | `avatars/<username>.<ext>` | — |

用户名在构造磁盘路径前经过 `sanitizeUsername()` 过滤（仅保留 `a-zA-Z0-9_-\u4e00-\u9fa5`），防止路径穿越。

---

## AI 文案（BYOK）

- 所有 AI 请求由**浏览器直接**发送到您配置的 OpenAI 兼容接口，不经过本应用后端
- 配置项（Provider / API Key / Base URL / Model）保存为当前用户配置（登录时）或全局配置（未登录时）
- 支持以下服务商预设，也可填写任意 OpenAI 兼容端点：
  - OpenAI / DeepSeek / Moonshot / 智谱 GLM / 通义千问 / 月之暗面 等
- 支持流式输出，生成过程中可随时取消
- 可携带照片作为多模态输入（需模型支持 vision）

---

## 代码质量基线

- **TypeScript 严格模式** — `strict: true`，组件 props 均显式类型
- **ESLint** — 启用 `react-hooks/rules-of-hooks`、`react-hooks/exhaustive-deps`、`react/jsx-key` 等关键规则，CI 必过
- **模块分层**
  - `server/`：纯后端，路由 + 数据 + 图片处理
  - `client/features/`：地图等大模块的业务逻辑
  - `client/components/` / `client/components/map/`：展示层
  - `client/store/`：跨组件状态、API 客户端、AI 调用
  - `client/hooks/`：跨页面共享 Hook
- **错误处理** — 前端 `api()` 非 2xx 抛 `ApiError`，401 自动清 token；后端统一错误中间件返回 JSON 错误
- **性能** — 图片多级缩略图 + 懒加载、`sharp` 并行处理、`useMemo` 缓存派生状态、`HashRouter` 免后端路由配置

