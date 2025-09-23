
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

**Create admin user**
`pnpm --filter scripts create:user`