/**
 * Performance monitoring and analytics system
 * 
 * Provides comprehensive monitoring of API performance, user interactions,
 * and system health metrics with minimal overhead.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timestamp: number;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  contentLength?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  error?: string;
}

/**
 * API usage statistics
 */
export interface ApiStats {
  totalRequests: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatusCode: Record<number, number>;
  errorRate: number;
  slowQueries: PerformanceMetrics[];
  recentActivity: PerformanceMetrics[];
}

/**
 * System health metrics
 */
export interface SystemHealth {
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
  nodeVersion: string;
  pid: number;
  cpuUsage?: NodeJS.CpuUsage;
}

/**
 * User analytics data
 */
export interface UserAnalytics {
  totalVisits: number;
  uniqueUserAgents: number;
  popularEndpoints: Array<{ endpoint: string; count: number }>;
  deviceTypes: Record<string, number>;
  peakUsageHours: Record<number, number>;
}

/**
 * Performance monitoring class with in-memory storage
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests
  private readonly slowQueryThreshold = 1000; // 1 second
  private startTime = Date.now();

  /**
   * Records a performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Gets API usage statistics
   */
  getApiStats(): ApiStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        errorRate: 0,
        slowQueries: [],
        recentActivity: []
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    
    // Count requests by endpoint
    const requestsByEndpoint: Record<string, number> = {};
    this.metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      requestsByEndpoint[key] = (requestsByEndpoint[key] || 0) + 1;
    });

    // Count requests by status code
    const requestsByStatusCode: Record<number, number> = {};
    this.metrics.forEach(m => {
      requestsByStatusCode[m.statusCode] = (requestsByStatusCode[m.statusCode] || 0) + 1;
    });

    // Calculate error rate (4xx and 5xx responses)
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Get slow queries
    const slowQueries = this.metrics
      .filter(m => m.responseTime >= this.slowQueryThreshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10); // Top 10 slowest

    // Get recent activity (last 50 requests)
    const recentActivity = this.metrics.slice(-50).reverse();

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      requestsByEndpoint,
      requestsByStatusCode,
      errorRate: Math.round(errorRate * 100) / 100,
      slowQueries,
      recentActivity
    };
  }

  /**
   * Gets system health metrics
   */
  getSystemHealth(): SystemHealth {
    return {
      timestamp: Date.now(),
      memoryUsage: process.memoryUsage(),
      uptime: Date.now() - this.startTime,
      nodeVersion: process.version,
      pid: process.pid,
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Gets user analytics
   */
  getUserAnalytics(): UserAnalytics {
    if (this.metrics.length === 0) {
      return {
        totalVisits: 0,
        uniqueUserAgents: 0,
        popularEndpoints: [],
        deviceTypes: {},
        peakUsageHours: {}
      };
    }

    // Count unique user agents (approximate unique users)
    const userAgents = new Set(this.metrics.map(m => m.userAgent).filter(Boolean));
    
    // Popular endpoints
    const endpointCounts: Record<string, number> = {};
    this.metrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      endpointCounts[key] = (endpointCounts[key] || 0) + 1;
    });
    
    const popularEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device types (simplified detection from user agent)
    const deviceTypes: Record<string, number> = {};
    this.metrics.forEach(m => {
      if (!m.userAgent) return;
      
      const ua = m.userAgent.toLowerCase();
      let deviceType = 'desktop';
      
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'mobile';
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet';
      } else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
        deviceType = 'bot';
      }
      
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
    });

    // Peak usage hours
    const peakUsageHours: Record<number, number> = {};
    this.metrics.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      peakUsageHours[hour] = (peakUsageHours[hour] || 0) + 1;
    });

    return {
      totalVisits: this.metrics.length,
      uniqueUserAgents: userAgents.size,
      popularEndpoints,
      deviceTypes,
      peakUsageHours
    };
  }

  /**
   * Clears old metrics (useful for maintenance)
   */
  clearOldMetrics(olderThanHours: number = 24): number {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const originalLength = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    return originalLength - this.metrics.length;
  }

  /**
   * Gets metrics filtered by time range
   */
  getMetricsByTimeRange(startTime: number, endTime: number): PerformanceMetrics[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Gets metrics for a specific endpoint
   */
  getMetricsForEndpoint(method: string, endpoint: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.method === method && m.endpoint === endpoint);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Express middleware for performance monitoring
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Override res.end to capture response information
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Record the metric
    const metric: PerformanceMetrics = {
      timestamp: startTime,
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('user-agent'),
      contentLength: res.get('content-length') ? parseInt(res.get('content-length')!) : undefined,
      memoryUsage: process.memoryUsage()
    };

    // Add error message for 4xx/5xx responses
    if (res.statusCode >= 400) {
      metric.error = `HTTP ${res.statusCode}`;
    }

    performanceMonitor.recordMetric(metric);
    
    // Call original end method with proper arguments
    return originalEnd.call(this, chunk, encoding as any, cb);
  };

  next();
}

/**
 * Express error handler that records error metrics
 */
export function errorTrackingMiddleware(error: Error, req: Request, res: Response, next: NextFunction): void {
  const metric: PerformanceMetrics = {
    timestamp: Date.now(),
    method: req.method,
    endpoint: req.path,
    statusCode: 500,
    responseTime: 0, // Not available for unhandled errors
    userAgent: req.get('user-agent'),
    error: error.message,
    memoryUsage: process.memoryUsage()
  };

  performanceMonitor.recordMetric(metric);
  next(error);
}

/**
 * Utility functions for performance analysis
 */
export const PerformanceUtils = {
  /**
   * Format memory usage for display
   */
  formatMemoryUsage(memUsage: NodeJS.MemoryUsage): string {
    const formatMB = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    return `RSS: ${formatMB(memUsage.rss)}MB, Heap Used: ${formatMB(memUsage.heapUsed)}MB, ` +
           `Heap Total: ${formatMB(memUsage.heapTotal)}MB, External: ${formatMB(memUsage.external)}MB`;
  },

  /**
   * Format uptime for display
   */
  formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  /**
   * Get performance score (0-100) based on response times
   */
  getPerformanceScore(stats: ApiStats): number {
    if (stats.totalRequests === 0) return 100;
    
    const avgResponseTime = stats.averageResponseTime;
    const errorRate = stats.errorRate;
    
    // Score based on response time (lower is better)
    let timeScore = 100;
    if (avgResponseTime > 2000) timeScore = 20;
    else if (avgResponseTime > 1000) timeScore = 50;
    else if (avgResponseTime > 500) timeScore = 70;
    else if (avgResponseTime > 200) timeScore = 85;
    
    // Reduce score based on error rate
    const errorPenalty = Math.min(errorRate * 2, 50); // Max 50 point penalty
    
    return Math.max(0, Math.round(timeScore - errorPenalty));
  },

  /**
   * Detect performance issues
   */
  detectIssues(stats: ApiStats, health: SystemHealth): string[] {
    const issues: string[] = [];
    
    // High response time
    if (stats.averageResponseTime > 1000) {
      issues.push(`High average response time: ${stats.averageResponseTime}ms`);
    }
    
    // High error rate
    if (stats.errorRate > 5) {
      issues.push(`High error rate: ${stats.errorRate}%`);
    }
    
    // Memory usage
    const memUsageMB = health.memoryUsage.heapUsed / 1024 / 1024;
    if (memUsageMB > 500) {
      issues.push(`High memory usage: ${Math.round(memUsageMB)}MB`);
    }
    
    // Slow queries
    if (stats.slowQueries.length > 5) {
      issues.push(`${stats.slowQueries.length} slow queries detected`);
    }
    
    return issues;
  }
};