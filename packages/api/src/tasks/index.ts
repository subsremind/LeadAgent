import { scheduler } from "@repo/scheduler";
import { getRedditPost } from "../lib/task-redditpost";
import { config } from "@repo/config";
import { logger } from "@repo/logs";

/**
 * 初始化所有定时任务
 * 这些任务会在API服务启动时自动开始执行
 */
export function initializeTasks() {
  logger.info("=============initialize tasks");
  // 获取Reddit帖子的定时任务
  scheduler.schedule({
    id: "sync-reddit-post",
    cronExpression: config.syncPost?.cronExpression,
    task: async () => {
      try {
        logger.info("=============start to sync reddit post", new Date());
        // await getRedditPost();
      } catch (error) {
        console.error("Failed to sync Reddit posts:", error);
      }
    },
  });

  // 可以在这里添加更多的定时任务
  // scheduler.schedule({
  //   id: "another-task",
  //   cronExpression: "0 * * * * *", // 每分钟执行一次
  //   task: async () => {
  //     // 任务逻辑
  //   },
  // });
}

/**
 * 取消所有定时任务
 * 可以在应用程序关闭时调用
 */
export function cancelAllTasks() {
  // 在这里实现取消所有任务的逻辑，如果需要的话
}