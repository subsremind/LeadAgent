"use client";
import { useEffect } from 'react';
// 本地存储键名
const ANALYTICS_STORAGE_KEY = 'app_analytics_data';
const VISITOR_ID_KEY = 'app_visitor_id';
// 生成唯一访客ID
const generateVisitorId = () => {
    return 'visitor_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
// 获取或创建访客ID
const getVisitorId = () => {
    if (typeof window === 'undefined')
        return '';
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = generateVisitorId();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
};
// 获取今天的日期字符串（用于UV统计）
const getTodayString = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
// 更新并获取分析数据
export const getAnalyticsData = () => {
    if (typeof window === 'undefined') {
        return { pv: 0, uv: 0, lastVisit: '' };
    }
    const today = getTodayString();
    const visitorId = getVisitorId();
    // 从本地存储获取数据
    let data = {
        pv: 0,
        uv: 0,
        lastVisit: ''
    };
    try {
        const storedData = localStorage.getItem(ANALYTICS_STORAGE_KEY);
        if (storedData) {
            data = JSON.parse(storedData);
        }
    }
    catch (error) {
        console.error('Failed to parse analytics data:', error);
    }
    // 更新PV计数
    data.pv += 1;
    // 更新UV计数（如果今天首次访问）
    if (data.lastVisit !== today) {
        data.uv += 1;
        data.lastVisit = today;
    }
    // 保存更新后的数据
    try {
        localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
    }
    catch (error) {
        console.error('Failed to save analytics data:', error);
    }
    return data;
};
// 重置分析数据
export const resetAnalyticsData = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ANALYTICS_STORAGE_KEY);
    }
};
export function AnalyticsScript() {
    useEffect(() => {
        // 页面加载时增加PV/UV计数
        const analyticsData = getAnalyticsData();
        // 可选：将数据发送到服务器
        const sendAnalyticsToServer = async () => {
            try {
                // 这里可以添加发送到后端API的代码
                // await fetch('/api/analytics', {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify({ ...analyticsData, page: window.location.pathname })
                // });
                console.log('Analytics data updated:', analyticsData);
            }
            catch (error) {
                console.error('Failed to send analytics data:', error);
            }
        };
        sendAnalyticsToServer();
    }, []);
    // 不需要渲染任何内容
    return null;
}
export function useAnalytics() {
    const trackEvent = (event, data) => {
        if (typeof window === 'undefined') {
            return;
        }
        // 收集事件数据
        const eventData = {
            event,
            timestamp: new Date().toISOString(),
            visitorId: getVisitorId(),
            page: window.location.pathname,
            ...data
        };
        console.log('Tracking event:', eventData);
        // 可选：将事件数据发送到服务器
        // try {
        //   fetch('/api/analytics/event', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(eventData)
        //   });
        // } catch (error) {
        //   console.error('Failed to track event:', error);
        // }
    };
    return {
        trackEvent,
        getAnalyticsData
    };
}
