import { scheduler } from "@repo/scheduler";
import { syncRedditPost } from "../lib/sync-reddit-post";
import { getNoAnalyzePost } from "../lib/ai-analyzepost";
import { cleanData } from "../lib/clean-data";
import { config } from "@repo/config";
import { logger } from "@repo/logs";
import { userCreditCount } from "../lib/user_credit_count";
import { summaryRedditPost } from "../lib/summary-reddit-post";

const tasks = [
  {
    id: "sync-reddit-post",
    cronExpression: "5 10 */2 * * *",
    enabled: true,
    task: async () => {
      try {
        await syncRedditPost();
      } catch (error) {
        console.error("Failed to sync Reddit posts:", error);
      }
    },
  },
  {
    id: "summary-reddit-post",
    cronExpression: "1/20 * * * * *",
    enabled: true,
    task: async () => {
      try {
        await summaryRedditPost();
      } catch (error) {
        console.error("Failed to sync Reddit posts:", error);
      }
    },
  },
  {
    id: "ai-analyze-reddit-post",
    cronExpression: "10 30 */2 * * *",
    enabled: true,
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
    cronExpression: "15 1/30 * * * *",
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
    cronExpression: "20 20 * * * *",
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
  //       await syncRedditPost();
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
