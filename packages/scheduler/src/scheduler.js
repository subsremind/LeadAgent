import { logger } from "@repo/logs"; // Assuming you have a logger set up in @repo/logger/index.ts
import { CronJob } from "cron";
class SchedulerImpl {
    constructor() {
        this.jobs = new Map();
    }
    schedule(task) {
        // 检查任务是否已存在，如果存在先取消
        if (this.jobs.has(task.id)) {
            logger.info(`Task ${task.id} already exists, replacing it with new configuration`);
            this.cancel(task.id);
        }
        logger.info(`Scheduling task ${task.id} with cron expression ${task.cronExpression}`);
        const job = new CronJob(task.cronExpression, async () => {
            try {
                await task.task();
            }
            catch (error) {
                logger.error(`Task ${task.id} failed:`, error);
            }
        }, null, true);
        this.jobs.set(task.id, job);
    }
    cancel(taskId) {
        const job = this.jobs.get(taskId);
        if (job) {
            logger.info(`Cancelling task ${taskId}`);
            job.stop();
            this.jobs.delete(taskId);
        }
    }
}
// 使用模块级变量和闭包实现单例模式，避免使用全局变量
let _instance = null;
function getSchedulerInstance() {
    if (!_instance) {
        _instance = new SchedulerImpl();
    }
    return _instance;
}
// 导出单例实例
export const scheduler = getSchedulerInstance();
