import { db } from "@repo/database";
import { logger } from "@repo/logs";
export async function cleanData() {
    logger.info("=====cleanData running=====");
    const unUsedPath = await db.$queryRaw `
      with c as (
      select * from category c 
      ),
      a as (
      select * from agent_setting
      ),
      r as (
      select a.subreddit ~ c.path as included,c.id,c.path from a,c 
      )

      SELECT path from r 
      group by path 
      having bool_or(included) = false`;
    logger.info(`cleanData unUsedPath ${unUsedPath.length} `);
    if (unUsedPath.length === 0) {
        logger.info(`cleanData no unUsedPath`);
        return;
    }
    // 删除未使用的分类路径
    // await db.category.deleteMany({
    //   where: {
    //     path: {
    //       in: unUsedPath.map((item) => item.path),
    //     },
    //   },
    // });
    logger.info(`cleanData delete ${unUsedPath.length}`);
}
