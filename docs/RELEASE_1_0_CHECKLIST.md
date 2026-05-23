# 1.0 Release Checklist

本文档用于 1.0 版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本：`1.0.0`
- 管理后台包版本：`1.0.0`
- 前台站点包版本：`1.0.0`
- 共享前端包版本：`1.0.0`
- 部署入口：`deploy/docker-compose.yml`
- 统一入口：`deploy/nginx.conf`

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

确认后端单元测试、集成测试和 Flyway 迁移测试通过。

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

从 `deploy/.env.example` 复制为 `deploy/.env` 后必须替换：

- `JWT_SECRET`: 使用至少 32 字符的随机密钥，不能使用示例值或开发值。
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: 使用生产管理员账号，不能使用本地开发账号。
- `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD`: 使用生产数据库密码。
- `SITE_BASE_URL`: 使用公开 HTTPS 域名。
- `CORS_ALLOWED_ORIGINS`: 使用公开站点源，不使用 `*`。
- `SITE_NAME` / `SITE_DESCRIPTION`: 使用最终站点元信息。
- `HTTP_PORT`: 确认不会和目标主机上已有服务冲突。

## 数据和持久化

- `mysql-data` volume 保存业务数据库，发布前需要确认备份策略。
- `uploads` volume 保存上传资源，发布前需要确认备份策略。
- 不要把 `backend/uploads/` 中的本地样例文件复制到生产环境。
- 不要删除生产主机上的 MySQL 或上传 volume，除非已经完成备份并明确执行数据重建。

## Docker 和路由

- `backend/Dockerfile` 使用 `target/*.jar` 复制 Maven 产物，版本号升级不会破坏镜像构建。
- `frontend/.dockerignore` 排除 node_modules、dist、缓存、日志、覆盖率和本地环境文件，避免污染镜像上下文。
- `deploy/docker-compose.yml` 只用 `.env` / `--env-file` 做变量插值，不把整份环境变量文件注入不相关容器。
- `deploy/nginx.conf` 将 `/api/`、`/uploads/`、`/sitemap.xml`、`/feed.xml`、`/robots.txt`、`/health` 转发到后端。
- `/admin/` 转发到管理后台容器，其余路径转发到前台容器。

## 发布后冒烟检查

部署完成后检查：

- `GET /health` 返回健康状态。
- `GET /api/v1/posts` 返回公开文章列表响应。
- `GET /sitemap.xml`、`GET /feed.xml`、`GET /robots.txt` 可以访问。
- 前台首页、文章详情页、归档页可以打开。
- `/admin/` 可以打开登录页，生产管理员账号可以登录。
- 上传资源路径 `/uploads/...` 可以通过 Nginx 访问。

## 仓库清理规则

这些内容不应提交，也不应进入发布镜像：

- `backend/target/`
- `backend/uploads/`
- `frontend/**/node_modules/`
- `frontend/**/dist/`
- `frontend/.vite-cache/`
- `.pnpm-store/`
- `logs/`
- `.claude/`
- `.superpowers/`

历史本地权限文件 `.claude/settings.local.json` 已从受控文件中移除；后续本地 agent 工具状态只保留在忽略目录中。
