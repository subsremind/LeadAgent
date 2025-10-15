import { logger } from "@repo/logs"; // Assuming you have a logger set up in @repo/logger/index.ts
import { CronJob } from "cron";
import type { ScheduledTask, Scheduler } from "../types";

class SchedulerImpl implements Scheduler {
	private jobs: Map<string, CronJob> = new Map();

	schedule(task: ScheduledTask): void {
		// 检查任务是否已存在，如果存在先取消
		if (this.jobs.has(task.id)) {
			logger.info(`Task ${task.id} already exists, replacing it with new configuration`);
			this.cancel(task.id);
		}
		
		logger.info(`Scheduling task ${task.id} with cron expression ${task.cronExpression}`);
		const job = new CronJob(
			task.cronExpression,
			async () => {
				try {
					await task.task();
				} catch (error) {
					logger.error(`Task ${task.id} failed:`, error);
				}
			},
			null,
			true,
		);
		this.jobs.set(task.id, job);
	}

	cancel(taskId: string): void {
		const job = this.jobs.get(taskId);
		if (job) {
			logger.info(`Cancelling task ${taskId}`);
			job.stop();
			this.jobs.delete(taskId);
		}
	}
}

// 使用单例模式确保全局只有一个scheduler实例
if (!global._schedulerInstance) {
	global._schedulerInstance = new SchedulerImpl();
}

export const scheduler = global._schedulerInstance as SchedulerImpl;
