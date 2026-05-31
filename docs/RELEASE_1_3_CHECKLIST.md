# 1.3 Release Checklist

本文档用于 1.3.0 作者工作台版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本: `1.3.0`
- 管理后台包版本: `1.3.0`
- 前台站点包版本: `1.3.0`
- 共享前端包版本: `1.3.0`
- 本版本功能范围: 排期发布、SEO 字段、文章修订历史、相关文章、浏览量、评论审核、媒体引用检查、操作日志和增强健康检查。

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

确认后端单元测试、集成测试、排期可见性、修订恢复、评论审核、媒体引用检查和 Flyway 迁移测试通过。

```powershell
corepack pnpm --dir frontend test
corepack pnpm --dir frontend build
```

确认前端 workspace 测试、类型检查和构建通过。若当前环境只有 Corepack 暴露的 pnpm，可临时设置 `pnpm_config_verify_deps_before_run=false` 后再运行上述命令。

```powershell
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.example config
```

确认 Docker Compose 文件、环境变量插值、服务依赖和 volume 定义有效。

## 发布后冒烟检查

- `/health` 返回 `status`、`database` 和 `uploads`，且均为 `UP`。
- 后台文章列表可以搜索、筛选状态、筛选内容结构，并能进入编辑页。
- 新建 `SCHEDULED` 文章后，未来发布时间前不出现在公开列表、搜索、详情、RSS 或 sitemap。
- 已到期排期文章可以在公开列表和详情页访问。
- 文章详情页使用 SEO 标题/描述生成 metadata，并显示浏览量和相关文章。
- 编辑已有文章后，后台修订历史出现旧版本，且可以恢复。
- 新评论默认进入待审核状态；通过审核后才出现在公开评论列表。
- 媒体删除前会提示被哪些文章引用；仍被引用的媒体不会被直接删除。
- 后台控制台显示草稿、已排期、缺摘要、未入专题等内容治理指标。

## 数据和持久化

- `V5__author_workflow_governance.sql` 新增 `posts` SEO/浏览量字段、`post_comments.status`、`post_revisions` 和 `operation_logs`。
- 发布前确认 MySQL volume 已备份；回滚时不得删除 `post_revisions`，除非已经明确接受修订历史丢失。
- 上传 volume 继续保存媒体资源；删除媒体前以引用检查结果为准。
