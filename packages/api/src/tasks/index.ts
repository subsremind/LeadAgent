import { scheduler } from "@repo/scheduler";
import { getRedditPost } from "../lib/task-redditpost";
import { getNoAnalyzePost } from "../lib/ai-analyzepost";
import { cleanData } from "../lib/clean-data";
import { config } from "@repo/config";
import { logger } from "@repo/logs";
import { userCreditCount } from "../lib/user_credit_count";

const tasks = [
  {
    id: "sync-reddit-post",
    cronExpression: "0 40 */2 * * *",
    enabled: false,
    task: async () => {
      try {
        await getRedditPost();
      } catch (error) {
        console.error("Failed to sync Reddit posts:", error);
      }
    },
  },
  {
    id: "ai-analyze-reddit-post",
    cronExpression: "0 50 */2 * * *",
    enabled: false,
    task: async () => {
      try {
		    await getNoAnalyzePost();
      } catch (error) {
        console.error("Failed to get no analyze posts:", error);
      }
    },
  },
  {
    id: "clean-data",
    cronExpression: "0 0 4 * * *",
    enabled: true,
    task: async () => {
      try {
		    await cleanData();
      } catch (error) {
        console.error("Failed to clean data:", error);
      }
    },
  },
  {
    id: "credit-usage",
    cronExpression: "0/10 * * * * *",
    enabled: true,
    task: async () => {
      try {
        await userCreditCount();
      } catch (error) {
        console.error("Failed to credit usage:", error);
      }
    },
  },
]
/**
 * 初始化所有定时任务
 * 这些任务会在API服务启动时自动开始执行
 */
export function initializeTasks() {
  // 循环遍历所有任务
  tasks.forEach((task) => {
    if (task.enabled) {
      scheduler.schedule({
        id: task.id,
        cronExpression: task.cronExpression,
        task: task.task,
      });
    }
  });


  // scheduler.schedule({
  //   id: "sync-reddit-post",
  //   cronExpression: config.syncPost?.cronExpression,
  //   task: async () => {
  //     try {
  //       //logger.info("=============start to sync reddit post", new Date());
  //       await getRedditPost();
  //     } catch (error) {
  //       console.error("Failed to sync Reddit posts:", error);
  //     }
  //   },
  // });

  // // 可以在这里添加更多的定时任务
  // scheduler.schedule({
  //   id: "ai-analyze-reddit-post",
  //   cronExpression: config.aiAnalyze?.cronExpression,
  //   task: async () => {
  //      try {
	// 	//logger.info("=============start to get no analyze post", new Date());
	// 	    await getNoAnalyzePost();
  //     } catch (error) {
  //       console.error("Failed to get no analyze posts:", error);
  //     }
  //   },
  // });

  // scheduler.schedule({
  //   id: "clean-data",
  //   cronExpression: config.cleanData?.cronExpression,
  //   task: async () => {
  //      try {
        
	// 	    await cleanData();
  //     } catch (error) {
  //       console.error("Failed to clean data:", error);
  //     }
  //   },
  // });

  // scheduler.schedule({
  //   id: "credit-usage",
  //   cronExpression: config.creditCount?.cronExpression,
  //   task: async () => {
  //      try {
        
	// 	    await cleanData();
  //     } catch (error) {
  //       console.error("Failed to clean data:", error);
  //     }
  //   },
  // });

  // scheduler.schedule({
  //   id: "credit-usage",
  //   cronExpression: config.creditCount?.cronExpression,
  //   task: async () => {
  //      try {
        
	// 	    await cleanData();
  //     } catch (error) {
  //       console.error("Failed to clean data:", error);
  //     }
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
