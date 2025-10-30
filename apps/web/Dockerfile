FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
 
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune @repo/web --docker
 
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

ARG NEXT_PUBLIC_SITE_URL="http://52.226.163.36:3000"
ARG NEXT_PUBLIC_PRODUCT_ID_PRO_MONTHLY="prod_77mnWUvIXKJuLKisxMRTIn"
ARG NEXT_PUBLIC_PRODUCT_ID_PRO_YEARLY="prod_TSRTiZYbv8sOPzHEG7Vvv"
ARG NEXT_PUBLIC_AVATARS_BUCKET_NAME="avatars"

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_PRODUCT_ID_PRO_MONTHLY=${NEXT_PUBLIC_PRODUCT_ID_PRO_MONTHLY} \
    NEXT_PUBLIC_PRODUCT_ID_PRO_YEARLY=${NEXT_PUBLIC_PRODUCT_ID_PRO_YEARLY} \
    NEXT_PUBLIC_AVATARS_BUCKET_NAME=${NEXT_PUBLIC_AVATARS_BUCKET_NAME:-avatars} \
    CYPRESS_INSTALL_BINARY=0
 
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
ENV CYPRESS_INSTALL_BINARY=0
RUN pnpm install
 
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
 
RUN pnpm turbo run build --filter=@repo/web...
 
FROM base AS runner
WORKDIR /app
 
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
 
COPY --from=installer /app/apps/web/next.config.ts .
COPY --from=installer /app/apps/web/package.json .
 
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
 
USER nextjs
 
EXPOSE 3000
 
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
 
CMD ["node", "apps/web/server.js"]