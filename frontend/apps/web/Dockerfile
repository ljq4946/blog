FROM node:22-alpine AS build
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/constructivist.css ./apps/constructivist.css
COPY apps/web ./apps/web
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @blog/shared build
RUN pnpm --filter @blog/web exec vue-tsc --noEmit
RUN pnpm --filter @blog/web exec vite build --logLevel error

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
