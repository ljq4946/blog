# 2.0 Release Checklist

本文档用于 2.0.0 个人知识沉淀版本部署前的人工检查和自动化验证。每次正式发布都应重新执行命令，不复用历史结果。

## 版本范围

- 后端 Maven 版本: `2.0.0`
- 管理后台包版本: `2.0.0`
- 前台站点包版本: `2.0.0`
- 共享前端包版本: `2.0.0`
- 本版本功能范围: 私有笔记、公开文章、知识搜索、内容关系、笔记转文章草稿、JSON 备份导出，以及公开面只暴露公开已发布文章的安全边界。

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

- 后台侧边栏显示“知识库”，并能进入私有笔记工作台。
- 新建私有笔记时，保存请求使用 `visibility: PRIVATE` 和 `contentType: NOTE`。
- 私有笔记不会出现在 `/api/v1/posts`、`/api/v1/archive`、`/feed.xml`、`/sitemap.xml` 或前台文章页。
- 知识库搜索能按标题、摘要、正文、标签、专题和系列命中私有笔记。
- 私有笔记能转成 `PUBLIC + ARTICLE + DRAFT` 的文章草稿，原笔记继续保留。
- 后台文章编辑器能维护可见性和内容类型；公开发布仍需通过标题、URL 和正文必填检查。
- 后台导出接口返回包含文章/笔记、分类、标签、专题、系列和媒体元数据的 JSON 备份。

## 数据和持久化

- `V6__private_knowledge_system.sql` 为 `posts` 和 `post_revisions` 增加可见性与内容类型，并创建 `knowledge_relations`。
- 历史文章迁移默认值为 `PUBLIC + ARTICLE`，保持公开 URL、归档、RSS、Sitemap、专题和系列页面兼容。
- 生产发布前确认 MySQL volume 已备份，上传 volume 继续保留媒体资源。
