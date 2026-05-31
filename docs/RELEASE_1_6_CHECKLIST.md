# 1.6 Release Checklist

本文档用于 1.6.0 作品集知识库版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本: `1.6.0`
- 管理后台包版本: `1.6.0`
- 前台站点包版本: `1.6.0`
- 共享前端包版本: `1.6.0`
- 本版本功能范围: 前台首页作品集路径、既有文章/专题/系列复用展示，以及 1.4/1.5 能力的最终版本收口。

## 必跑验证

```powershell
git status --short --branch

cd backend
.\mvnw.cmd test
cd ..

corepack pnpm --dir frontend test
corepack pnpm --dir frontend build

docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```

若 Corepack 触发依赖状态检查失败，可临时设置 `pnpm_config_verify_deps_before_run=false` 后再运行前端命令。

## 发布后冒烟检查

- 首页在个人介绍之后显示“作品集路径”。
- 作品集路径优先链接最新公开文章、重点专题、进行中的系列和完整归档。
- 当文章、专题或系列为空时，作品集路径至少保留“全部文章”归档入口。
- 首页原有最新文章、内容地图、音乐/个人介绍模块继续可用。
- 专题页、系列页、文章页、归档页和关于页在桌面与移动宽度下无明显文本重叠。
- Sitemap、RSS 和公开 metadata 仍只暴露公开可访问内容。

## 数据和持久化

- 1.6 不新增独立项目案例表；作品集展示复用 `Post`、`Topic`、`Series` 和归档入口。
- 版本号统一提升到 `1.6.0`，部署镜像继续使用 backend Dockerfile 的 `target/*.jar` 通配复制。
- 发布前确认生产 `.env` 已设置真实域名、CORS 来源、JWT 密钥、管理员账号和数据库凭据。
