import { PrismaClient } from "@prisma/client";
// 配置客户端打印insert 的 sql 语句
const prismaClientSingleton = () => {
	return new PrismaClient({
		log: [{ emit: "stdout", level: "query" }],
	});
};

declare global {
	var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// biome-ignore lint/suspicious/noRedeclare: <explanation>
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
	globalThis.prisma = prisma;
}

export { prisma as db };
