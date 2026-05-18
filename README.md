# Modular Blog

Production-oriented modular blog system with:

- Java 21 Spring Boot backend under `backend/`
- Vue 3 admin app under `frontend/apps/admin`
- Vue 3 public web app under `frontend/apps/web`
- Shared TypeScript API/DTO utilities under `frontend/packages/shared`
- Docker Compose and Nginx production routing under `deploy/`

## Local Verification

## 一键启动（Windows）

双击仓库根目录下的 `start-project.cmd` 可以直接启动本地项目。它会自动检查 Docker，启动或复用 `blog-dev-mysql` 数据库容器，并分别启动后端、管理端和前台：

- 前台站点：http://127.0.0.1:5174/posts
- 管理后台：http://127.0.0.1:5173/admin
- 后端接口：http://localhost:8080
- 管理员账号：`4946`
- 管理员密码：`541312`

如果某个服务已经在运行，启动脚本会跳过重复启动。

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend:

```powershell
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend install --no-frozen-lockfile
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend test
node C:\Users\17439\AppData\Local\node\corepack\v1\pnpm\11.1.2\dist\pnpm.mjs --dir frontend build
```

On a normal shell with pnpm available, use `corepack pnpm --dir frontend test` and `corepack pnpm --dir frontend build`.

## Production-Like Run

```powershell
cd deploy
Copy-Item .env.example .env
# edit .env secrets
docker compose up -d --build
```

Routes:

- Public site: `http://localhost:8088/`
- Admin app: `http://localhost:8088/admin/`
- API: `http://localhost:8088/api/v1/posts`
- Uploads: `http://localhost:8088/uploads/...`

Run E2E after the stack is up:

```powershell
cd frontend
$env:E2E_BASE_URL="http://localhost:8088"
$env:E2E_ADMIN_USERNAME="4946"
$env:E2E_ADMIN_PASSWORD="541312"
corepack pnpm e2e
```
