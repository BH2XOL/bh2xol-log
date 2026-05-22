# bh2xol-log

业余无线电通联日志（QSO Logbook），部署在 Cloudflare Workers + D1。

## 功能

- 通联日志展示 — 公开页面，显示全部 QSO 记录，支持按呼号/模式/时间筛选
- 最佳 DX 统计 — 根据 Maidenhead Grid 自动计算最远距离，也支持手动设定
- ADIF 导入 — 拖拽或点击上传 .adif 文件，自动去重
- 手动添加 QSO — 管理后台逐条录入
- 批量删除 — 勾选后一键删除
- 首页设置 — 自定义"最近活动"文本
- 主题切换 — 浅色/深色主题，带平滑过渡动画

## 技术栈

| 层 | 技术 |
| --- | --- |
| 运行环境 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| Web 框架 | Hono |
| 认证 | HMAC-SHA256 Session Cookie |
| 部署 | GitHub Actions + Wrangler |
| 语言 | TypeScript |

## 目录结构

```
src/
├── index.ts               # Hono 入口，路由注册
├── styles.ts              # 全局样式（CSS 变量 + 组件）
├── types.ts               # 类型定义
├── lib/
│   ├── db.ts              # D1 数据库操作
│   ├── adif.ts            # ADIF 解析与去重
│   ├── grid.ts            # Maidenhead 网格距离计算
│   └── github.ts #end.ts         # 公开日志页面
    ├── admin.ts            # 管理后台（登录 + 管理面板）
    └── api.ts              # REST API
```

## 环境变量

通过 `wrangler secret put` 加密上传，在 Cloudflare Dashboard 中值被隐藏：

| 变量 | 说明 |
| --- | --- |
| DOMAIN | 部署域名 |
| CALLSIGN | 你的呼号 |
| BLOG_URL | 博客链接 |
| QRZ_URL | QRZ 个人主页 |
| MY_GRIDS | 你的 Maidenhead Grid，逗号分隔 |
| ADMIN_EMAIL | 管理员登录邮箱 |
| ADMIN_PASSWORD_HASH | 密码的 SHA-256 十六进制 |
| SESSION_SECRET | Session 签名密钥 |

## 本地开发

```bash
git clone https://github.com/BH2XOL/bh2xol-log
cd bh2xol-log
npm install
wrangler dev
```

## 部署

```bash
npm run deploy
```

或推送 `main` 分支自动触发 GitHub Actions 部署。

## API

### 公开

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | / | 公开日志页 |
| GET | /api/qsos?call=&mode=&date= | JSON 搜索 |

### 管理（需 Session）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /admin/api/upload | 上传 ADIF 文本 |
| POST | /admin/api/add | 手动添加 QSO |
| POST | /admin/api/delete | 批量删除 |
| GET | /admin/api/list | 获取全部 QSO |
| POST | /admin/api/bestdx | 设置最佳 DX |
| POST | /admin/api/lastact | 设置最近活动 |

## 授权

MIT
