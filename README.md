
## Issue
 **数据库连接失败**

检查 `shema.prisma` ：
 ```
  datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") 
  directUrl = env("DIRECT_URL") 
}

generator client {
  provider = "prisma-client-js"
}
```
**数据库表不存在**
可以本地运行`pnpm --filter database push` 来创建表
正常结果：
```

Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-us-west-1.pooler.supabase.com:5432"

Your database is now in sync with your Prisma schema. Done in 23.26s
```
**install a package**
To install a package globally, run:


`pnpm add -w <package-name>`
To install a package to a specific workspace, run:


`pnpm add --filter <workspace-name> <package-name>`

Here is a list of the workspaces of supastarter:

web
api
auth
database
mail
eslint-config-custom
tsconfig
tailwind
utils

To use the shadcn/ui CLI in your supastarter project simply run the following command from your projects root:

`pnpm --filter web shadcn-ui [command]`
For example to add the skeleton component you would run:

`pnpm --filter=web shadcn-ui add skeleton`

**Create admin user**
`pnpm --filter scripts create:user`

## docker deploy
docker-compose down
cd /data/git/LeadAgent
# 拉取代码，分支是 docker-deploy
git pull

docker build -f apps/web/Dockerfile-task . --no-cache -t leadagent-task

docker build -f apps/web/Dockerfile . --no-cache -t leadagent

docker-compose up -d

docker logs -f -n 200 leadagent-task
docker logs -f -n 200 leadagent
`