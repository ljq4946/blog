# 1.5 Release Checklist

本文档用于 1.5.0 写作效率版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本: `1.5.0`
- 管理后台包版本: `1.5.0`
- 前台站点包版本: `1.5.0`
- 共享前端包版本: `1.5.0`
- 本版本功能范围: 后台轻量统计、控制台反馈指标、热门文章列表和文章编辑器写作模板。

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

- 后台控制台显示总浏览、总点赞、评论总数、待审核评论、已通过评论、已拒绝评论和热门文章。
- 热门文章统计能按浏览/点赞/评论数据展示公开文章。
- 新建文章页显示“写作模板”面板。
- 点击“项目案例”模板后，摘要和正文插入项目案例骨架，发布设置保持不变。
- 点击“技术笔记”或“版本复盘”模板后，已有正文不会被直接覆盖，而是在当前正文后追加结构。
- 保存草稿、发布文章、恢复修订、草稿恢复和发布检查仍按 1.3/1.4 行为工作。

## 数据和持久化

- 1.5 不新增数据库表；统计来自文章浏览量、点赞数和评论状态。
- 写作模板是前端编辑器能力，不改变公开 API 或数据库结构。
- 评论审核状态和文章浏览量依赖 1.3/1.4 已有迁移，发布前仍需备份 MySQL volume。
