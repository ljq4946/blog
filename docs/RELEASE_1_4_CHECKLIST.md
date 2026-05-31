# 1.4 Release Checklist

本文档用于 1.4.0 内容治理版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本: `1.4.0`
- 管理后台包版本: `1.4.0`
- 前台站点包版本: `1.4.0`
- 共享前端包版本: `1.4.0`
- 本版本功能范围: 内容治理快照、后台控制台治理指标、内容地图、专题覆盖信号、系列断档信号和前台首页内容发现区。

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

确认后端认证、文章、专题、系列、内容治理、统计、评论、媒体、RSS、Sitemap 和健康检查测试通过。Docker 不可用时，`FlywayMigrationTest` 会按配置跳过 Testcontainers 验证。

```powershell
corepack pnpm --dir frontend test
corepack pnpm --dir frontend build
```

确认前端 workspace 测试、类型检查和构建通过。若 Corepack 触发依赖状态检查失败，可临时设置 `pnpm_config_verify_deps_before_run=false` 后再运行。

```powershell
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```

确认 Docker Compose 文件、环境变量插值、服务依赖和 volume 定义有效。

## 发布后冒烟检查

- 后台控制台显示草稿、已排期、缺摘要、缺封面、未入专题、空专题和系列问题指标。
- 后台内容地图能看到文章待完善项、空专题和系列断档，并能进入对应维护动作。
- 专题管理页展示每个专题的文章覆盖数量和空专题状态。
- 系列管理页展示每个系列的文章数量、空系列、顺序冲突和缺失序号。
- 前台首页显示最新文章、重点专题、进行中的系列和归档入口。
- `/sitemap.xml` 包含首页、归档、关于、专题、系列、专题详情、系列详情和公开文章 URL。
- `/feed.xml` 只包含当前可公开访问的已发布文章，不包含草稿或未到发布时间的排期文章。

## 数据和持久化

- `V5__author_workflow_governance.sql` 已随 1.3/1.4 工作流引入文章 SEO、浏览量、评论状态、修订历史和操作日志字段。
- 1.4 不新增独立内容治理表；治理数据由现有文章、专题和系列关系实时汇总。
- 发布前确认 MySQL volume 已备份，上传 volume 继续保存媒体资源。
