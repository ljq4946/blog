# Modular Blog

1.1 版本的模块化博客系统，包含 Java 21 Spring Boot 后端、Vue 3 管理后台、Vue 3 前台站点、共享 TypeScript API/DTO 包，以及 Docker Compose + Nginx 部署入口。

项目结构说明见 [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)，1.1 发布检查见 [docs/RELEASE_1_1_CHECKLIST.md](docs/RELEASE_1_1_CHECKLIST.md)，1.0 历史检查单保留在 [docs/RELEASE_1_0_CHECKLIST.md](docs/RELEASE_1_0_CHECKLIST.md)。

## 1.1 更新内容

- 首页新增可配置的音乐播放与个人介绍模块，管理端可直接维护首页资料。
- 前台新增归档发现页与搜索能力，支持按关键词、分类、标签和年月筛选文章。
- 文章阅读体验增强，补充目录、阅读进度、回到顶部、代码块交互与更完整的富文本展示。
- 管理端文章编辑器增强，支持封面预览、引用媒体插入、草稿恢复与更稳定的排版预览。
- 前台首页视觉与海报布局完成第二轮调整，适配近期内容展示。


## 项目结构速览

- `backend/`: Spring Boot API 服务，负责认证、文章、分类、标签、媒体、评论、点赞、站点单页、RSS、Sitemap 和健康检查。
- `frontend/apps/admin/`: 管理后台，提供登录、文章编辑、分类标签、媒体、评论、关于页和首页资料管理。
- `frontend/apps/web/`: 前台阅读站点，提供首页、文章详情、归档发现、分类、标签、关于页和互动入口。
- `frontend/packages/shared/`: 前后端共享的 DTO、API 客户端、Token 存储等代码。
- `deploy/`: Docker Compose、Nginx 路由和环境变量模板。
- `scripts/`: Windows 本地开发启动脚本。
- `docs/`: 项目结构文档、发布检查单、设计记录和实施计划。

## 一键启动（Windows）

双击仓库根目录下的 `start-project.cmd` 可以启动本地项目。它会检查 Docker，启动或复用 `blog-dev-mysql` 数据库容器，并分别启动后端、管理端和前台：

- 前台站点: `http://127.0.0.1:5174/posts`
- 管理后台: `http://127.0.0.1:5173/admin`
- 后端接口: `http://localhost:8080`
- 管理员账号: `4946`
- 管理员密码: `541312`

如果某个服务已经在运行，启动脚本会跳过重复启动。

## 本地验证

后端测试:

```powershell
cd backend
.\mvnw.cmd test
```

前端安装、测试和构建:

```powershell
corepack pnpm --dir frontend install
corepack pnpm --dir frontend test
corepack pnpm --dir frontend build
```

也可以在 `frontend/` 目录内运行:

```powershell
corepack pnpm test
corepack pnpm build
```

## 1.1 发布前检查

每次部署 1.1 前至少执行:

```powershell
git status --short --branch

cd backend
.\mvnw.cmd test
cd ..

corepack pnpm --dir frontend test
corepack pnpm --dir frontend build

docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```

发布前还需要确认:

- 工作区没有未提交的发布相关代码。
- `deploy/.env` 已从 `deploy/.env.example` 复制并替换所有密钥、管理员账号、域名和数据库密码。
- `JWT_SECRET` 使用足够长的随机密钥，不复用示例值或开发值。
- `CORS_ALLOWED_ORIGINS` 设置为公开站点域名，不使用 `*`。
- MySQL volume 和上传 volume 已纳入备份策略。
- 本地生成目录、日志、Playwright 临时目录、agent 工具状态和上传样例不参与发布镜像。

## 生产风格运行

```powershell
cd deploy
Copy-Item .env.example .env
# 修改 .env 中的密钥、管理员账号、域名和数据库密码
docker compose up -d --build
```

路由:

- 前台站点: `http://localhost:8088/`
- 管理后台: `http://localhost:8088/admin/`
- API: `http://localhost:8088/api/v1/posts`
- 上传资源: `http://localhost:8088/uploads/...`
- Sitemap: `http://localhost:8088/sitemap.xml`
- RSS: `http://localhost:8088/feed.xml`
- 健康检查: `http://localhost:8088/health`

生产环境必须修改这些值:

- `JWT_SECRET`: 使用足够长的随机密钥。
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: 替换默认开发账号。
- `SITE_BASE_URL`: 设置为公开访问域名，例如 `https://blog.example.com`。
- `SITE_NAME` / `SITE_DESCRIPTION`: 站点元信息，会用于 RSS 和发现接口。
- `CORS_ALLOWED_ORIGINS`: 设置为公开域名，不要在生产环境使用 `*`。
- `MYSQL_*`: 使用生产数据库凭据，并备份 MySQL volume。

栈启动后运行 E2E:

```powershell
cd frontend
$env:E2E_BASE_URL="http://localhost:8088"
$env:E2E_ADMIN_USERNAME="4946"
$env:E2E_ADMIN_PASSWORD="541312"
corepack pnpm e2e
```
