import { db } from "@repo/database";
import { logger } from "@repo/logs";


export async function userCreditCount() {
  logger.info("=====userCreditCount running=====");
  
  const userCreditUsage = await db.aIRequestLog.groupBy({
    by: ['userId'],
    where: {
      business: 'ai-analyze-post',
    },
    _sum: {
      credit: true,
    },
  })


  // 逐条upsert
  for (const item of userCreditUsage) {

    await db.userCreditUsage.upsert({
      where: {
        userId: item.userId!,
      },
      update: {
        credit: item._sum.credit!,
      },
      create: {
        userId: item.userId!,
        credit: item._sum.credit!,
      },
    })
  }
  
}


