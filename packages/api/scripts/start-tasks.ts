#!/usr/bin/env node

/**
 * 定时任务启动脚本
 * 用于独立启动定时任务服务，而不仅仅依赖API模块的编译
 */

// 加载环境变量
import * as dotenv from 'dotenv';
dotenv.config();

// 导入任务初始化函数
import { initializeTasks } from '../src/tasks';
import { logger } from '@repo/logs';

// 记录启动信息
logger.info('Starting LeadAgent Task Service...');

// 初始化定时任务
initializeTasks();

// 保持进程运行
process.on('SIGINT', () => {
  logger.info('Shutting down task service...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down task service...');
  process.exit(0);
});

logger.info('LeadAgent Task Service started successfully! Tasks are running.');