# Project Structure

本文档说明当前仓库的模块边界、运行入口和维护约定。

## 顶层目录

```text
.
├── backend/                  # Spring Boot API 服务
├── frontend/                 # pnpm workspace，包含前台、后台和共享包
├── deploy/                   # Docker Compose、Nginx 和环境变量模板
├── scripts/                  # Windows 本地开发启动脚本
├── docs/                     # 项目文档、历史设计文档和实施计划
├── start-project.cmd         # 一键启动入口，调用 scripts/start-project.ps1
└── README.md                 # 快速入口和常用命令
```

## 后端：`backend/`

后端是 Java 21 + Spring Boot 3 应用，使用 JPA、Flyway、Spring Security、JWT、MySQL 和测试环境 H2/Testcontainers。

核心目录：

- `src/main/java/com/example/blog/auth/`: 登录、JWT、认证过滤器、管理员初始化和用户角色。
- `src/main/java/com/example/blog/post/`: 文章实体、DTO、仓储、服务、管理 API、公开列表、搜索、详情和归档 API。
- `src/main/java/com/example/blog/category/` 与 `tag/`: 分类和标签的公开读取与后台管理 API。
- `src/main/java/com/example/blog/media/`: 媒体上传、分页列表、删除和上传目录配置。
- `src/main/java/com/example/blog/sitepage/`: 关于页等站点单页内容。
- `src/main/java/com/example/blog/interaction/`: 公开评论、点赞、后台评论审核入口。
- `src/main/java/com/example/blog/discovery/`: `sitemap.xml`、`feed.xml`、`robots.txt` 和 `/health`。
- `src/main/java/com/example/blog/config/`: CORS、JWT、上传、站点信息、异常处理和安全配置。
- `src/main/java/com/example/blog/security/html/`: HTML 内容清洗。
- `src/main/resources/db/migration/`: Flyway 数据库迁移。
- `src/test/java/com/example/blog/`: 后端单元和集成测试。

本地运行默认读取 `application.yml` 中的开发配置，可通过环境变量覆盖数据库、管理员账号、JWT、站点元信息、CORS 和上传目录。

## 前端：`frontend/`

前端是 pnpm workspace。根目录的 `package.json` 编排测试、构建和 E2E，`tsconfig.base.json` 提供共享 TypeScript 配置。

### `frontend/apps/admin/`

管理后台使用 Vue 3、Vue Router、Pinia、Element Plus 和 TipTap。

主要职责：

- 登录与当前用户校验。
- 文章列表、新建、编辑、发布状态、摘要、分类、标签和封面/引用媒体管理。
- 分类、标签、媒体库、评论、关于页管理。
- 通过 `src/lib/api.ts` 调用 `/api/v1/admin/...` 与 `/api/v1/auth/...`。

### `frontend/apps/web/`

前台站点使用 Vue 3、Vue Router 和 Highlight.js。

主要职责：

- 首页文章流、文章详情、分类页、标签页、归档页和关于页。
- 文章目录、阅读偏好、阅读进度、代码高亮。
- 评论和点赞交互。
- 通过 `src/lib/api.ts` 调用公开 API：`/api/v1/posts`、`/api/v1/archive`、`/api/v1/categories`、`/api/v1/tags` 等。

### `frontend/packages/shared/`

共享包提供：

- DTO 和领域类型定义。
- `ApiClient` HTTP 封装。
- Token 存储和认证辅助逻辑。
- 可被 `@blog/admin` 和 `@blog/web` 通过 workspace 依赖复用。

### 共享样式

`frontend/apps/constructivist.css` 是前台和后台共同引用的视觉基础层，定义纸张底色、黑色描边、红/蓝/黄强调色和基础控件样式。

## 部署：`deploy/`

- `docker-compose.yml`: 编排 MySQL、后端、管理后台、前台和 Nginx。
- `nginx.conf`: 统一入口路由，转发 `/api/`、`/uploads/`、发现文件、健康检查、`/admin/` 和前台页面。
- `.env.example`: 生产风格环境变量模板，复制为 `.env` 后再修改密钥、域名和数据库密码。

## 脚本：`scripts/`

保留的脚本都是本地开发启动链路的一部分：

- `start-project.ps1`: 检查 Docker，启动 MySQL、后端、后台和前台，并打开浏览器。
- `run-backend.cmd`: 启动 Spring Boot 后端。
- `run-admin.cmd`: 启动管理后台 Vite dev server。
- `run-web.cmd`: 启动前台 Vite dev server。

历史导入脚本和旧 JSON 种子数据已经移除。后续需要演示数据时，应优先使用 Flyway、后端测试 fixture，或新增有维护说明的脚本。

## 忽略和生成目录

这些目录不应提交：

- `backend/target/`
- `frontend/**/node_modules/`
- `frontend/**/dist/`
- `frontend/.vite-cache/`
- `.pnpm-store/`
- `uploads/`
- `logs/`
- `.superpowers/`

## 常用命令

```powershell
# 后端测试
cd backend
.\mvnw.cmd test

# 前端测试
corepack pnpm --dir frontend test

# 前端构建
corepack pnpm --dir frontend build

# 生产风格配置检查
$env:ENV_FILE=".env.example"
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
Remove-Item Env:ENV_FILE
```
