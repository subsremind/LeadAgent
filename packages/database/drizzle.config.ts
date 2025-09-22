// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  /* 1. 指定数据库方言 */
  dialect: 'postgresql', // 必填，可选 "postgresql" | "mysql" | "sqlite" | "singlestore" | "turso"

  /* 2. 模式文件路径（支持 glob） */
  schema: './drizzle/schema.ts', // 或 './src/db/schema/*.ts'

  /* 3. 迁移文件输出目录 */
  out: './drizzle',

  /* 4. 数据库连接信息 */
  dbCredentials: {
    // 统一使用连接字符串（Prisma-Postgres/Neon 均支持）
    url: process.env.DATABASE_URL!, // 例如 postgresql://user:pass@host:port/db?sslmode=require
  },

  /* 5. 可选：迁移记录表名/模式 */
  migrations: {
    table: '__drizzle_migrations', // 默认
    schema: 'drizzle', // PostgreSQL 默认模式
  },

  /* 6. 可选：开发体验 */
  verbose: true, // 打印执行的 SQL
  strict: true,  // 强制确认风险提示
});