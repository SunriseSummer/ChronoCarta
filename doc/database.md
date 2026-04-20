# 数据库设计说明 — Travel App

## 1. 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| 数据库引擎 | **better-sqlite3**（WAL 模式） | 高性能同步 SQLite 绑定，需本地编译 |
| 后端框架 | **Express 5** | REST API 服务 |
| 图片处理 | **sharp** | 服务端自动生成多级缩略图 |
| 文件上传 | **multer** | multipart/form-data 解析 |
| 运行时 | **tsx** | TypeScript 直接运行，开发热重载 |

> better-sqlite3 依赖 node-gyp 本地编译 C++ 原生模块，需要 Visual Studio Build Tools（Windows）或 Xcode CLI（macOS）或 build-essential（Linux）。

---

## 2. 数据库表结构

### 2.1 places — 地点主表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TEXT | PK | 语义化 ID (如 `20240321-143022-三阳盆地`) |
| `title` | TEXT | NOT NULL | 地点名称 |
| `lng` | REAL | NOT NULL | 经度 |
| `lat` | REAL | NOT NULL | 纬度 |
| `altitude` | REAL | 可空 | 海拔（米） |
| `address` | TEXT | '' | 逆地理编码地址 |
| `category` | TEXT | '' | 分类 |
| `description` | TEXT | '' | AI 生成或手写的文案 |
| `tone` | TEXT | CHECK | 文案风格：`literary` \| `practical` \| `humor` |
| `visited_at` | INTEGER | 可空 | 用户自定义到访时间（毫秒时间戳） |
| `created_at` | INTEGER | NOT NULL | 记录创建时间 |
| `updated_at` | INTEGER | NOT NULL | 最后修改时间 |
| `user_id` | TEXT | FK → users.id | 所属用户（预置为 NULL） |
| `is_preset` | INTEGER | 0 | 是否预置地点（1=预置只读） |
| `is_draft` | INTEGER | 0 | 是否为未确认的草稿记录（1=草稿） |
| `visibility` | TEXT | CHECK | 可见性：`private` \| `shared`（默认 `private`） |
| `route_path` | TEXT | NOT NULL, '' | 前端路由路径段，用于 URL 友好的地点访问 |
| `image_dir` | TEXT | NOT NULL, '' | 图片存储子目录（相对于 `data/images/`） |

**`route_path` 格式：**
- 用户地点：`<userHash8>-<lat>N-<lng>E-<YYYYMMDDHHmmss>`（`userHash8` 为用户名 SHA1 前 8 位）
- 预置地点：`<lat>N-<lng>E-<YYYYMMDDHHmmss>`

**`image_dir` 格式：**
- 用户地点：`<username>/<lat>N-<lng>E-<YYYYMMDDHHmmss>`
- 预置地点：`_preset/<lat>N-<lng>E-<YYYYMMDDHHmmss>`

**索引：**
- `idx_places_created` → `created_at`（列表排序）
- `idx_places_category` → `category`（分类筛选）
- `idx_places_route_path` → `route_path`（路由查找）

### 2.2 tags — 标签表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK AUTO | 标签 ID |
| `name` | TEXT | UNIQUE | 标签名称（如 `自然风光`） |

### 2.3 place_tags — 地点-标签关联表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `place_id` | TEXT | FK → places.id | 地点 ID |
| `tag_id` | INTEGER | FK → tags.id | 标签 ID |
| `sort_order` | INTEGER | 0 | 排列顺序 |
| | | PK(place_id, tag_id) | 复合主键 |

> **设计说明：** 标签采用多对多关系，而非直接在地点表中存储 JSON 数组。优势：① 标签可全局去重 ② 支持按标签查询 ③ 便于统计分析。

### 2.4 photos — 照片表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK AUTO | 照片 ID |
| `place_id` | TEXT | FK → places.id | 所属地点 |
| `sort_order` | INTEGER | 0 | 排列顺序 |
| `is_cover` | INTEGER | 0 | 是否为封面 (1=是) |
| `original` | TEXT | NOT NULL | 原图文件名 (如 `a1b2c3d4.jpg`) |
| `thumb_sm` | TEXT | '' | 128×128 小缩略图文件名 |
| `thumb_md` | TEXT | '' | 640×640 中缩略图文件名 |
| `thumb_banner` | TEXT | '' | ≤1600×1200 Banner 缩略图（保留原始比例） |
| `width` | INTEGER | 0 | 原图宽度（像素） |
| `height` | INTEGER | 0 | 原图高度（像素） |
| `size_bytes` | INTEGER | 0 | 原图文件大小（字节） |
| `taken_at` | INTEGER | 可空 | 照片拍摄时间（毫秒时间戳，从 EXIF 提取） |
| `created_at` | INTEGER | NOT NULL | 记录创建时间 |

**索引：** `idx_photos_place` → `(place_id, sort_order)`

### 2.5 settings — 设置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `key` | TEXT | PK | 设置键名 |
| `value` | TEXT | '' | 设置值（JSON 序列化） |

用途：存储 AI 服务配置（`ai-config`）、种子标记（`presets-seeded`、`users-seeded`）等。

### 2.6 users — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TEXT | PK | 随机 16 位十六进制 ID |
| `username` | TEXT | UNIQUE | 用户名 |
| `password_hash` | TEXT | NOT NULL | 密码散列（scrypt，格式 `salt:hash`） |
| `display_name` | TEXT | '' | 显示名称 |
| `avatar` | TEXT | '' | 头像 URL（如 `/images/avatars/xxx.jpg`） |
| `created_at` | INTEGER | NOT NULL | 注册时间 |
| `role` | TEXT | CHECK | 用户角色：`user` \| `admin`（默认 `user`） |

### 2.7 sessions — 会话表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `token` | TEXT | PK | 随机 64 位十六进制令牌 |
| `user_id` | TEXT | FK → users.id | 所属用户 |
| `created_at` | INTEGER | NOT NULL | 创建时间 |

### 2.8 user_settings — 用户配置表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `user_id` | TEXT | FK → users.id | 所属用户 |
| `key` | TEXT | NOT NULL | 配置键名 |
| `value` | TEXT | '' | 配置值（JSON 序列化） |
| | | PK(user_id, key) | 复合主键 |

> **权限模型：**
> - 预置地点（`is_preset=1`）所有人可浏览，管理员可编辑/删除，普通用户不可修改。
> - 用户地点（`is_preset=0`）本人可编辑/删除；设为 `shared` 时其他已登录用户可查看；设为 `private`（默认）时仅本人可见。
> - 草稿地点（`is_draft=1`）仅创建者和管理员可见，不出现在公共列表中。
> - 管理员（`role='admin'`）可查看、编辑、删除所有地点（包括预置和其他用户的私密地点）。

---

## 3. 图片管理体系

### 3.1 目录结构

```
seed/
├── presets/              ← 预设数据与原始照片
└── users/                ← 预设用户头像

data/
├── travel.db            ← SQLite 数据库文件
└── images/
    ├── _tmp/            ← multer 临时上传目录
    ├── _preset/         ← 预置地点图片（按坐标-时间戳分目录）
    │   └── 29.8306N-118.4695E-20260419143241/
    │       ├── a1b2c3d4.jpg          ← 原图
    │       ├── a1b2c3d4_sm.webp      ← 128×128 (地图气泡)
    │       ├── a1b2c3d4_md.webp      ← 640×640 (瀑布流/照片条)
    │       └── a1b2c3d4_banner.webp  ← ≤1600×1200 (详情页头部，保留原始比例)
    ├── avatars/         ← 用户头像
    │   └── <userId>.jpg
    └── <username>/      ← 用户地点图片（按用户名分组）
        └── 30.0963N-120.3795E-20260419143555/
            ├── a1b2c3d4.jpg
            ├── a1b2c3d4_sm.webp
            ├── a1b2c3d4_md.webp
            └── a1b2c3d4_banner.webp
```

说明：`seed/presets/` 中只保留数据库初始化所需的原始资源。预设数据导入时会复用运行时的图片处理逻辑，在 `data/images/` 下生成原图副本和 3 种缩略图。

### 3.2 缩略图尺寸分级

| 级别 | 尺寸 | 格式 | 用途 | 典型大小 |
|------|------|------|------|---------|
| `sm` | 128×128 | WebP | 地图标记气泡 | 3-8 KB |
| `md` | 640×640 | WebP | 瀑布流卡片、照片横滑条 | 30-80 KB |
| `banner` | ≤1600×1200 | WebP | 详情/浏览页头部 Banner（保留原始比例） | 100-400 KB |
| 原图 | 原始 | 保留 | 点击查看原图 | 2-7 MB |

### 3.3 缩略图生成流程

```
用户上传照片 (multipart/form-data，最多 20 张)
        │
        ▼
  multer 存入 _tmp/
        │
        ▼
  sharp 一次性读入 Buffer → 获取 width/height/size
        │
        ├──→ 复制原图到 images/<image_dir>/<uuid>.ext
        ├──→ 生成 _sm.webp (128×128, cover 裁切, Q80)   ┐
        ├──→ 生成 _md.webp (640×640, cover 裁切, Q80)   ├ Promise.all 并行
        └──→ 生成 _banner.webp (≤1600×1200, inside 保比例, Q85) ┘
        │
        ▼
  删除 _tmp 临时文件（失败时回滚已写入文件）
        │
        ▼
  写入 photos 表 (文件名、尺寸、大小、拍摄时间)
```

### 3.4 前端 URL 格式

API 返回的照片对象示例：

```json
{
  "id": 11,
  "original": "/images/_preset/29.8306N-118.4695E-20260419143241/b84810aab5919be5.jpg",
  "thumb_sm": "/images/_preset/29.8306N-118.4695E-20260419143241/b84810aab5919be5_sm.webp",
  "thumb_md": "/images/_preset/29.8306N-118.4695E-20260419143241/b84810aab5919be5_md.webp",
  "thumb_banner": "/images/_preset/29.8306N-118.4695E-20260419143241/b84810aab5919be5_banner.webp",
  "width": 3072,
  "height": 3500,
  "sort_order": 0,
  "takenAt": 1713521561000
}
```

各页面使用的缩略图级别：
- **地图标记气泡** → `thumb_sm` (128px)
- **瀑布流卡片** → `thumb_md` (640px)
- **信息页照片条** → `thumb_md` (640px)
- **信息页头部 Banner** → `thumb_banner` (≤1600×1200，保留原始比例)，容器跟随照片比例（竖屏最高 1:1），maxHeight 60vh
- **点击查看原图** → `original`

---

## 4. API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录（body: `{username, password}`→`{token, user}`） |
| POST | `/api/auth/logout` | 登出（需 Authorization） |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 地点（含权限控制）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/places` | 获取预置+当前用户+共享的地点（管理员见全部） |
| GET | `/api/places/:id` | 获取单个地点（预置任何人可看，共享已登录可看，私密仅本人/管理员） |
| POST | `/api/places` | 创建地点（🔒需登录） |
| PUT | `/api/places/:id` | 更新地点（🔒需登录+本人或管理员） |
| DELETE | `/api/places/:id` | 删除地点（🔒需登录+本人或管理员） |

### 照片

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/places/:id/photos` | 上传照片（🔒需登录+本人） |
| DELETE | `/api/photos/:photoId` | 删除单张照片（🔒需登录+本人） |

### 设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings/:key` | 获取全局设置值 |
| PUT | `/api/settings/:key` | 设置全局值 (body: `{ value: "..." }`) |
| GET | `/api/user/settings/:key` | 获取用户设置值（🔒需登录） |
| PUT | `/api/user/settings/:key` | 设置用户值（🔒需登录） |

### 静态图片

| 路径 | 说明 |
|------|------|
| `/images/<image_dir>/<filename>` | 图片静态服务（7天缓存） |

---

## 5. 运行方式

```bash
# 1. 首次运行：导入预设数据
npm run seed

# 2. 首次运行：导入预设用户（Summer / ,20250103.ljj + China1~China5）
npm run seed:users

# 3. 启动后端 API 服务（默认端口 3001）
npm run dev:server

# 4. 启动前端开发服务器（Vite，自动代理 /api → localhost:3001）
npm run dev
```

预设种子脚本和对应资源统一放在项目根目录的 `seed/` 下，便于集中管理数据库初始化内容。

预设图片的缩略图不会预先写回 `seed/`；它们会在 `npm run seed` 执行时生成到运行时目录 `data/images/`。

Vite 开发服务器已配置代理：
- `/api` → `http://localhost:3001`
- `/images` → `http://localhost:3001`

---

## 6. 注意事项

1. **数据持久化**：better-sqlite3 使用 WAL 模式直接读写 `data/travel.db` 文件，所有操作同步完成，无需手动导出。

2. **图片文件安全**：删除地点时会级联删除该地点目录下的所有图片文件。删除单张照片时仅删除对应的原图和 3 张缩略图。

3. **缩略图策略**：正方形缩略图（sm / md）使用 `cover` + `centre` 裁切填满；Banner 缩略图使用 `inside` + `withoutEnlargement` 保留原始宽高比。

4. **文件命名**：照片文件名使用 8 字节随机十六进制命名（如 `a1b2c3d4e5f6a7b8.jpg`），避免中文路径和特殊字符问题。

5. **数据库文件位置**：数据库和图片均存储在项目根目录的 `data/` 文件夹下，建议将 `data/` 加入 `.gitignore`。
