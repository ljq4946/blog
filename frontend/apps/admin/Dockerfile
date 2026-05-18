FROM node:22-alpine AS build
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @blog/shared build
RUN pnpm --filter @blog/admin exec vue-tsc --noEmit
RUN pnpm --filter @blog/admin exec vite build --base=/admin/ --logLevel error

FROM nginx:1.27-alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html/admin
EXPOSE 80
