# Project Structure

本文档说明当前仓库的模块边界、运行入口和维护约定。1.6 发布前检查清单见 [RELEASE_1_6_CHECKLIST.md](RELEASE_1_6_CHECKLIST.md)，1.5、1.4、1.3、1.2、1.1 和 1.0 历史检查单保留在本目录中。

## 顶层目录

```text
.
|-- backend/                  # Spring Boot API 服务
|-- frontend/                 # pnpm workspace，包含前台、后台和共享包
|-- deploy/                   # Docker Compose、Nginx 和环境变量模板
|-- scripts/                  # Windows 本地开发启动脚本
|-- docs/                     # 项目文档、发布检查单、设计记录和实施计划
|-- start-project.cmd         # 一键启动入口，调用 scripts/start-project.ps1
|-- README.md                 # 快速入口和常用命令
`-- CHANGELOG.md              # 版本变更记录
```

## 后端: `backend/`

后端是 Java 21 + Spring Boot 3 应用，使用 JPA、Flyway、Spring Security、JWT、MySQL，以及 H2/Testcontainers 测试环境。

核心目录:

- `src/main/java/com/example/blog/auth/`: 登录、JWT、认证过滤器、管理员初始化和用户角色。
- `src/main/java/com/example/blog/post/`: 文章实体、DTO、仓储、服务、修订历史、管理 API、公开列表、搜索、详情、相关文章和归档 API。
- `src/main/java/com/example/blog/category/` 与 `tag/`: 分类和标签的公开读取与后台管理 API。
- `src/main/java/com/example/blog/topic/`: 扁平专题、公开专题页数据和后台专题管理 API。
- `src/main/java/com/example/blog/series/`: 有序阅读系列、可选主专题关联和系列公开/后台 API。
- `src/main/java/com/example/blog/media/`: 媒体上传、分页列表、删除和上传目录配置。
- `src/main/java/com/example/blog/homeprofile/`: 首页资料读取与后台维护接口。
- `src/main/java/com/example/blog/sitepage/`: 关于页等站点单页内容。
- `src/main/java/com/example/blog/interaction/`: 公开评论、点赞、后台评论审核入口。
- `src/main/java/com/example/blog/operation/`: 后台关键作者操作日志。
- `src/main/java/com/example/blog/statistics/`: 后台轻量统计快照，汇总浏览量、点赞数、评论状态和热门文章。
- `src/main/java/com/example/blog/governance/`: 后台内容治理快照，汇总文章待完善项、专题覆盖和系列维护信号。
- `src/main/java/com/example/blog/discovery/`: `sitemap.xml`、`feed.xml`、`robots.txt` 和 `/health`。
- `src/main/java/com/example/blog/config/`: CORS、JWT、上传、站点信息、异常处理和安全配置。
- `src/main/java/com/example/blog/security/html/`: HTML 内容清洗。
- `src/main/resources/db/migration/`: Flyway 数据库迁移。
- `src/test/java/com/example/blog/`: 后端单元和集成测试。

当前后端 Maven 版本为 `1.6.0`。

## 前端: `frontend/`

前端是 pnpm workspace。根目录的 `package.json` 编排测试、构建和 E2E，`tsconfig.base.json` 提供共享 TypeScript 配置。

### `frontend/apps/admin/`

管理后台使用 Vue 3、Vue Router、Pinia、Element Plus 和 TipTap。

主要职责:

- 登录与当前用户校验。
- 文章列表搜索筛选、新建、编辑、发布状态、排期、SEO 字段、摘要、分类、标签和封面/引用媒体管理。
- 控制台展示内容治理指标和轻量反馈统计；内容地图将空专题、系列断档和文章待完善项整理为下一步维护动作；专题与系列管理展示覆盖数量、空专题和系列断档，并支持在文章发布面板中维护专题归属、系列归属和系列顺序。
- 文章编辑器提供项目案例、技术笔记和版本复盘写作模板，用于快速生成可继续编辑的文章骨架。
- 分类、标签、媒体库、评论、关于页和首页资料管理。
- 通过 `src/lib/api.ts` 调用 `/api/v1/admin/...` 与 `/api/v1/auth/...`。

当前包版本为 `1.6.0`。

### `frontend/apps/web/`

前台站点使用 Vue 3、Vue Router 和 Highlight.js。

主要职责:

- 首页作品集路径、首页文章流、首页音乐/个人介绍区块、专题/系列发现入口、文章详情、分类页、标签页、归档发现页和关于页。
- 专题和系列索引/详情页，用于长期技术知识地图和顺序阅读路径。
- 文章目录、阅读偏好、阅读进度、代码高亮、相关文章、浏览量、评论和点赞交互。
- 通过 `src/lib/api.ts` 调用公开 API，例如 `/api/v1/posts`、`/api/v1/archive`、`/api/v1/categories`、`/api/v1/tags` 等。

当前包版本为 `1.6.0`。

### `frontend/packages/shared/`

共享包提供:

- DTO 和领域类型定义。
- `ApiClient` HTTP 封装。
- Token 存储和认证辅助逻辑。
- 可被 `@blog/admin` 和 `@blog/web` 通过 workspace 依赖复用。

当前包版本为 `1.6.0`。

### 共享样式

`frontend/apps/constructivist.css` 是前台和后台共同引用的视觉基础层，定义纸张底色、黑色描边、红/蓝/黄强调色和基础控件样式。

## 部署: `deploy/`

- `docker-compose.yml`: 编排 MySQL、后端、管理后台、前台和 Nginx。
- `nginx.conf`: 统一入口路由，转发 `/api/`、`/uploads/`、发现文件、健康检查、`/admin/` 和前台页面。
- `.env.example`: 生产风格环境变量模板，复制为 `.env` 后再修改密钥、域名和数据库密码。

后端镜像使用 Maven 构建 `1.6.0` jar，并在 Dockerfile 中使用 `target/*.jar` 复制产物，避免后续版本号变更导致镜像构建失败。前端 Docker build context 由 `frontend/.dockerignore` 排除依赖目录、构建产物、缓存、日志、覆盖率和本地环境文件。

## 脚本: `scripts/`

保留的脚本都是本地开发启动链路的一部分:

- `start-project.ps1`: 检查 Docker，启动 MySQL、后端、后台和前台，并打开浏览器。
- `run-backend.cmd`: 启动 Spring Boot 后端。
- `run-admin.cmd`: 启动管理后台 Vite dev server。
- `run-web.cmd`: 启动前台 Vite dev server。

历史导入脚本和旧 JSON 种子数据已经移除。后续需要演示数据时，应优先使用 Flyway、后端测试 fixture，或新增有维护说明的脚本。

## 忽略和生成目录

这些目录不应提交:

- `backend/target/`
- `frontend/**/node_modules/`
- `frontend/**/dist/`
- `frontend/.vite-cache/`
- `.pnpm-store/`
- `uploads/`
- `logs/`
- `.claude/`
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
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```
