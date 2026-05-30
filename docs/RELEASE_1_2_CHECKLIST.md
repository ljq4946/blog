# 1.2 Release Checklist

本文档用于 1.2.0 版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本: `1.2.0`
- 管理后台包版本: `1.2.0`
- 前台站点包版本: `1.2.0`
- 共享前端包版本: `1.2.0`
- 部署入口: `deploy/docker-compose.yml`
- 统一入口: `deploy/nginx.conf`
- 本版本功能范围: 专题、系列、公开页面展示、技术 SEO metadata、RSS、Sitemap 和 Robots。

## 必跑验证

```powershell
git status --short --branch
```

确认没有意外未提交文件；发布提交完成后应只剩允许忽略的本地生成目录。

```powershell
cd backend
.\mvnw.cmd test
cd ..
```

确认后端单元测试、集成测试和 Flyway 迁移测试通过。若本机 Docker 不可用导致 Testcontainers 迁移测试跳过，需要在发布记录中注明这是本机环境限制。

```powershell
corepack pnpm --dir frontend test
corepack pnpm --dir frontend build
```

确认前端 workspace 测试、类型检查和构建通过。

```powershell
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```

确认 Docker Compose 文件、环境变量插值、服务依赖和 volume 定义有效。

## 生产环境变量

从 `deploy/.env.example` 复制为 `deploy/.env` 后必须替换:

- `JWT_SECRET`: 使用至少 32 字符的随机密钥，不能使用示例值或开发值。
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: 使用生产管理员账号，不能使用本地开发账号。
- `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD`: 使用生产数据库密码。
- `SITE_BASE_URL`: 使用公开 HTTPS 域名，供 RSS、Sitemap、canonical 和结构化数据使用。
- `CORS_ALLOWED_ORIGINS`: 使用公开站点源，不使用 `*`。
- `SITE_NAME` / `SITE_DESCRIPTION`: 使用最终站点元信息。
- `HTTP_PORT`: 确认不会和目标主机上已有服务冲突。
- `UPLOAD_MAX_FILE_SIZE` / `UPLOAD_MAX_REQUEST_SIZE`: 如有大文件上传需求，确认与反向代理和磁盘策略一致。

## 数据和持久化

- `mysql-data` volume 保存业务数据库，发布前确认备份策略。
- `uploads` volume 保存上传资源，发布前确认备份策略。
- 不要把 `backend/uploads/` 中的本地样例文件复制到生产环境。
- 不要删除生产主机上的 MySQL 或上传 volume，除非已经完成备份并明确执行数据重建。
- 专题、系列和文章关联已由 Flyway 管理，不需要发布时手工改库。

## Docker 和路由

- `backend/Dockerfile` 使用 `target/*.jar` 复制 Maven 产物，版本号升级不会破坏镜像构建。
- `frontend/.dockerignore` 排除 `node_modules`、`dist`、缓存、日志、覆盖率和本地环境文件，避免污染镜像上下文。
- `deploy/docker-compose.yml` 只用 `.env` / `--env-file` 做变量插值，不把整份环境变量文件注入不相关容器。
- `deploy/nginx.conf` 将 `/api/`、`/uploads/`、`/sitemap.xml`、`/feed.xml`、`/robots.txt` 和 `/health` 转发到后端。
- `/admin/` 转发到管理后台容器，其余路径转发到前台容器，包括 `/topics`、`/series`、专题详情页和系列详情页。

## 发布后冒烟检查

部署完成后检查:

- `GET /health` 返回健康状态。
- `GET /api/v1/posts` 返回公开文章列表响应。
- `GET /api/v1/archive` 可以正常返回归档发现结果。
- `GET /api/v1/topics` 和 `GET /api/v1/series` 可以返回公开专题和系列列表。
- `GET /sitemap.xml`、`GET /feed.xml`、`GET /robots.txt` 可以访问。
- `GET /sitemap.xml` 包含首页、归档、关于页、已发布文章、`/topics`、`/series`、公开专题详情页和公开系列详情页。
- 前台首页、文章详情页、归档页、`/topics`、`/series` 可以打开。
- 至少一个公开专题详情页和一个公开系列详情页可以打开，并显示已发布文章列表。
- 文章详情页包含正确标题、摘要、canonical、Open Graph、Twitter card 和 `BlogPosting` JSON-LD。
- 专题和系列详情页包含正确标题、描述、canonical 和 `CollectionPage` JSON-LD。
- 首页音乐模块与个人介绍模块显示正常。
- `/admin/` 可以打开登录页，生产管理员账号可以登录。
- 管理端文章保存、专题管理、系列管理、媒体上传和文章编辑器能正常工作。
- 上传资源路径 `/uploads/...` 可以通过 Nginx 访问。

## 仓库清理规则

这些内容不应提交，也不应进入发布镜像:

- `backend/target/`
- `backend/uploads/`
- `frontend/**/node_modules/`
- `frontend/**/dist/`
- `frontend/.vite-cache/`
- `.pnpm-store/`
- `logs/`
- `.claude/`
- `.superpowers/`

历史本地权限文件和 agent 工具状态只保留在忽略目录中。
