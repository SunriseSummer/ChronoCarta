# 生产环境部署指南

## 一、环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18 | 推荐 20 LTS |
| npm | ≥ 9 | |
| 操作系统 | Linux / macOS / Windows | Windows 需安装 Visual Studio Build Tools（better-sqlite3 编译） |

> better-sqlite3 依赖 node-gyp 编译 C++ 原生模块。Linux 需要 `build-essential`，macOS 需要 Xcode CLI。

## 二、项目结构概览

```
app/
├── server/          # Express 后端（TypeScript）
├── client/          # React 前端（TypeScript）
├── shared/          # 前后端共享代码（EXIF 提取等）
├── seed/            # 预设数据导入脚本
├── data/            # 运行时数据（SQLite 数据库 + 图片）
│   ├── travel.db
│   └── images/
│       ├── _tmp/        # 上传临时目录
│       ├── _preset/     # 预置地点图片
│       ├── avatars/     # 用户头像
│       └── <username>/  # 用户地点图片
├── dist-client/     # 前端构建产物（vite build 生成）
└── dist-server/     # 后端构建产物（tsc 生成）
```

## 三、构建步骤

### 3.1 安装依赖

```bash
npm install
```

### 3.2 导入预设数据（可选）

首次部署时，可导入预置地点和默认账号：

```bash
npm run seed
```

该命令会在 `data/` 下创建 SQLite 数据库并将 `seed/presets/` 中的预设地点和照片导入 `data/images/` 目录。

### 3.3 构建前端和后端

```bash
npm run build
```

等同于依次执行 `tsc -b`（类型检查）→ `vite build`（前端打包到 `dist-client/`）→ `tsc -p tsconfig.server.json`（后端编译到 `dist-server/`）。

## 四、启动服务

### 4.1 生产模式

```bash
PORT=8080 node dist-server/index.js
```

默认端口为 `3001`，通过环境变量 `PORT` 覆盖。

同时启动 Vite 开发服务器（前端热更新）和 tsx watch（后端自动重载），前端通过 Vite proxy 将 `/api` 和 `/images` 请求转发到后端 `http://localhost:3001`。

### 4.2 生产环境托管前端静态文件

生产环境下由 Express 同时托管前端和后端，无需 Vite 开发服务器。需在 `server/index.ts` 的 `app.listen` 之前、所有 `/api` 和 `/images` 路由之后添加 SPA 静态文件托管：

```ts
import path from 'node:path';
import fs from 'node:fs';

const DIST_DIR = path.resolve(import.meta.dirname, '../dist-client');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '7d' }));
  // SPA fallback：所有非 API/images 请求返回 index.html
  app.get('{*any}', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}
```

> 前端使用 **HashRouter**，所以 SPA fallback 主要用于处理直接访问根路径的情况。

## 五、Nginx 反向代理（可选）

如果需要绑定域名、启用 HTTPS 或 80 端口，可用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name travel.example.com;

    # 可选：静态文件直接由 Nginx 托管（性能更好）
    # location / {
    #     root /path/to/app/dist-client;
    #     try_files $uri $uri/ /index.html;
    # }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 图片缓存
    location /images/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 7d;
        expires 7d;
    }
}
```

HTTPS 配置建议使用 [Certbot](https://certbot.eff.org/) 自动获取 Let's Encrypt 证书。
