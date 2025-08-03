/**
 * Tests for performance monitoring and analytics system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performanceMonitor, PerformanceUtils, type PerformanceMetrics } from '../../../../server/lib/performance-monitor';

// Mock process.memoryUsage and process.cpuUsage
vi.mock('process', () => ({
  memoryUsage: vi.fn(() => ({
    rss: 50 * 1024 * 1024, // 50MB
    heapTotal: 40 * 1024 * 1024, // 40MB
    heapUsed: 30 * 1024 * 1024, // 30MB
    external: 5 * 1024 * 1024, // 5MB
    arrayBuffers: 1 * 1024 * 1024 // 1MB
  })),
  cpuUsage: vi.fn(() => ({
    user: 1000000, // 1 second
    system: 500000 // 0.5 seconds
  })),
  version: 'v18.0.0',
  pid: 12345
}));

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor['metrics'] = [];
  });

  describe('recordMetric', () => {
    it('should record a performance metric', () => {
      const metric: PerformanceMetrics = {
        timestamp: Date.now(),
        method: 'GET',
        endpoint: '/api/test',
        statusCode: 200,
        responseTime: 150,
        userAgent: 'Test Agent'
      };

      performanceMonitor.recordMetric(metric);
      const stats = performanceMonitor.getApiStats();
      
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(150);
    });

    it('should limit metrics to maxMetrics size', () => {
      const maxMetrics = performanceMonitor['maxMetrics'];
      
      // Add more metrics than the limit
      for (let i = 0; i < maxMetrics + 100; i++) {
        performanceMonitor.recordMetric({
          timestamp: Date.now(),
          method: 'GET',
          endpoint: `/api/test${i}`,
          statusCode: 200,
          responseTime: 100
        });
      }

      const stats = performanceMonitor.getApiStats();
      expect(stats.totalRequests).toBe(maxMetrics);
    });
  });

  describe('getApiStats', () => {
    it('should return empty stats when no metrics exist', () => {
      const stats = performanceMonitor.getApiStats();
      
      expect(stats.totalRequests).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(stats.requestsByEndpoint).toEqual({});
      expect(stats.requestsByStatusCode).toEqual({});
      expect(stats.errorRate).toBe(0);
      expect(stats.slowQueries).toEqual([]);
      expect(stats.recentActivity).toEqual([]);
    });

    it('should calculate correct statistics', () => {
      const metrics: PerformanceMetrics[] = [
        {
          timestamp: Date.now(),
          method: 'GET',
          endpoint: '/api/users',
          statusCode: 200,
          responseTime: 100
        },
        {
          timestamp: Date.now(),
          method: 'POST',
          endpoint: '/api/users',
          statusCode: 201,
          responseTime: 200
        },
        {
          timestamp: Date.now(),
          method: 'GET',
          endpoint: '/api/users',
          statusCode: 404,
          responseTime: 50
        },
        {
          timestamp: Date.now(),
          method: 'DELETE',
          endpoint: '/api/users/123',
          statusCode: 500,
          responseTime: 1500 // Slow query
        }
      ];

      metrics.forEach(m => performanceMonitor.recordMetric(m));
      const stats = performanceMonitor.getApiStats();

      expect(stats.totalRequests).toBe(4);
      expect(stats.averageResponseTime).toBe(463); // (100+200+50+1500)/4 = 462.5 rounded to 463
      expect(stats.requestsByEndpoint['GET /api/users']).toBe(2);
      expect(stats.requestsByEndpoint['POST /api/users']).toBe(1);
      expect(stats.requestsByStatusCode[200]).toBe(1);
      expect(stats.requestsByStatusCode[404]).toBe(1);
      expect(stats.requestsByStatusCode[500]).toBe(1);
      expect(stats.errorRate).toBe(50); // 2 errors out of 4 requests
      expect(stats.slowQueries).toHaveLength(1);
      expect(stats.slowQueries[0].responseTime).toBe(1500);
    });

    it('should sort slow queries by response time descending', () => {
      const slowMetrics = [
        { timestamp: Date.now(), method: 'GET', endpoint: '/slow1', statusCode: 200, responseTime: 1200 },
        { timestamp: Date.now(), method: 'GET', endpoint: '/slow2', statusCode: 200, responseTime: 1800 },
        { timestamp: Date.now(), method: 'GET', endpoint: '/slow3', statusCode: 200, responseTime: 1000 },
        { timestamp: Date.now(), method: 'GET', endpoint: '/slow4', statusCode: 200, responseTime: 1500 }
      ];

      slowMetrics.forEach(m => performanceMonitor.recordMetric(m));
      const stats = performanceMonitor.getApiStats();

      expect(stats.slowQueries[0].responseTime).toBe(1800);
      expect(stats.slowQueries[1].responseTime).toBe(1500);
      expect(stats.slowQueries[2].responseTime).toBe(1200);
      expect(stats.slowQueries[3].responseTime).toBe(1000);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health information', () => {
      const health = performanceMonitor.getSystemHealth();
      
      expect(health.timestamp).toBeTypeOf('number');
      expect(health.memoryUsage).toBeDefined();
      expect(health.uptime).toBeTypeOf('number');
      expect(health.nodeVersion).toBe(process.version);
      expect(health.pid).toBe(process.pid);
      expect(health.cpuUsage).toBeDefined();
    });
  });

  describe('getUserAnalytics', () => {
    it('should return empty analytics when no metrics exist', () => {
      const analytics = performanceMonitor.getUserAnalytics();
      
      expect(analytics.totalVisits).toBe(0);
      expect(analytics.uniqueUserAgents).toBe(0);
      expect(analytics.popularEndpoints).toEqual([]);
      expect(analytics.deviceTypes).toEqual({});
      expect(analytics.peakUsageHours).toEqual({});
    });

    it('should calculate user analytics correctly', () => {
      const now = new Date();
      const metrics: PerformanceMetrics[] = [
        {
          timestamp: now.getTime(),
          method: 'GET',
          endpoint: '/api/users',
          statusCode: 200,
          responseTime: 100,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          timestamp: now.getTime(),
          method: 'GET',
          endpoint: '/api/users',
          statusCode: 200,
          responseTime: 150,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile/18A373'
        },
        {
          timestamp: now.getTime(),
          method: 'POST',
          endpoint: '/api/posts',
          statusCode: 201,
          responseTime: 200,
          userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
      ];

      metrics.forEach(m => performanceMonitor.recordMetric(m));
      const analytics = performanceMonitor.getUserAnalytics();

      expect(analytics.totalVisits).toBe(3);
      expect(analytics.uniqueUserAgents).toBe(3);
      expect(analytics.popularEndpoints[0].endpoint).toBe('GET /api/users');
      expect(analytics.popularEndpoints[0].count).toBe(2);
      expect(analytics.deviceTypes.desktop).toBe(1);
      expect(analytics.deviceTypes.mobile).toBe(1);
      expect(analytics.deviceTypes.bot).toBe(1);
      expect(analytics.peakUsageHours[now.getHours()]).toBe(3);
    });
  });

  describe('clearOldMetrics', () => {
    it('should clear metrics older than specified hours', () => {
      const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      const recentTime = Date.now() - (1 * 60 * 60 * 1000); // 1 hour ago

      performanceMonitor.recordMetric({
        timestamp: oldTime,
        method: 'GET',
        endpoint: '/old',
        statusCode: 200,
        responseTime: 100
      });

      performanceMonitor.recordMetric({
        timestamp: recentTime,
        method: 'GET',
        endpoint: '/recent',
        statusCode: 200,
        responseTime: 100
      });

      const clearedCount = performanceMonitor.clearOldMetrics(24);
      const stats = performanceMonitor.getApiStats();

      expect(clearedCount).toBe(1);
      expect(stats.totalRequests).toBe(1);
    });
  });

  describe('getMetricsForEndpoint', () => {
    it('should return metrics for specific endpoint', () => {
      const metrics: PerformanceMetrics[] = [
        { timestamp: Date.now(), method: 'GET', endpoint: '/api/users', statusCode: 200, responseTime: 100 },
        { timestamp: Date.now(), method: 'POST', endpoint: '/api/users', statusCode: 201, responseTime: 150 },
        { timestamp: Date.now(), method: 'GET', endpoint: '/api/posts', statusCode: 200, responseTime: 120 }
      ];

      metrics.forEach(m => performanceMonitor.recordMetric(m));
      
      const getUserMetrics = performanceMonitor.getMetricsForEndpoint('GET', '/api/users');
      const postUserMetrics = performanceMonitor.getMetricsForEndpoint('POST', '/api/users');

      expect(getUserMetrics).toHaveLength(1);
      expect(getUserMetrics[0].method).toBe('GET');
      expect(postUserMetrics).toHaveLength(1);
      expect(postUserMetrics[0].method).toBe('POST');
    });
  });
});

describe('PerformanceUtils', () => {
  describe('formatMemoryUsage', () => {
    it('should format memory usage correctly', () => {
      const memUsage = {
        rss: 50 * 1024 * 1024, // 50MB
        heapTotal: 40 * 1024 * 1024, // 40MB
        heapUsed: 30 * 1024 * 1024, // 30MB
        external: 5 * 1024 * 1024, // 5MB
        arrayBuffers: 1 * 1024 * 1024 // 1MB
      };

      const formatted = PerformanceUtils.formatMemoryUsage(memUsage);
      expect(formatted).toContain('RSS: 50MB');
      expect(formatted).toContain('Heap Used: 30MB');
      expect(formatted).toContain('Heap Total: 40MB');
      expect(formatted).toContain('External: 5MB');
    });
  });

  describe('formatUptime', () => {
    it('should format uptime correctly', () => {
      expect(PerformanceUtils.formatUptime(30000)).toBe('30s');
      expect(PerformanceUtils.formatUptime(90000)).toBe('1m 30s');
      expect(PerformanceUtils.formatUptime(3900000)).toBe('1h 5m');
      expect(PerformanceUtils.formatUptime(90000000)).toBe('1d 1h 0m');
    });
  });

  describe('getPerformanceScore', () => {
    it('should calculate performance score correctly', () => {
      const goodStats = {
        totalRequests: 100,
        averageResponseTime: 150,
        errorRate: 1,
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        slowQueries: [],
        recentActivity: []
      };

      const poorStats = {
        totalRequests: 100,
        averageResponseTime: 2500,
        errorRate: 15,
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        slowQueries: [],
        recentActivity: []
      };

      expect(PerformanceUtils.getPerformanceScore(goodStats)).toBe(98); // 100 - 2 (error penalty)
      expect(PerformanceUtils.getPerformanceScore(poorStats)).toBe(0); // 20 - 30 (error penalty) = -10, clamped to 0
    });

    it('should return 100 for empty stats', () => {
      const emptyStats = {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        slowQueries: [],
        recentActivity: []
      };

      expect(PerformanceUtils.getPerformanceScore(emptyStats)).toBe(100);
    });
  });

  describe('detectIssues', () => {
    it('should detect performance issues', () => {
      const stats = {
        totalRequests: 100,
        averageResponseTime: 1500, // High response time
        errorRate: 10, // High error rate
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        slowQueries: new Array(6).fill({ responseTime: 2000 }), // Many slow queries
        recentActivity: []
      };

      const health = {
        timestamp: Date.now(),
        memoryUsage: {
          rss: 600 * 1024 * 1024, // 600MB - high memory usage
          heapTotal: 600 * 1024 * 1024,
          heapUsed: 600 * 1024 * 1024, // 600MB heap used for high memory trigger
          external: 50 * 1024 * 1024,
          arrayBuffers: 10 * 1024 * 1024
        },
        uptime: 86400000, // 1 day
        nodeVersion: 'v18.0.0',
        pid: 12345
      };

      const issues = PerformanceUtils.detectIssues(stats, health);

      expect(issues).toContain('High average response time: 1500ms');
      expect(issues).toContain('High error rate: 10%');
      expect(issues).toContain('High memory usage: 600MB');
      expect(issues).toContain('6 slow queries detected');
    });

    it('should return no issues for good performance', () => {
      const stats = {
        totalRequests: 100,
        averageResponseTime: 200, // Good response time
        errorRate: 2, // Low error rate
        requestsByEndpoint: {},
        requestsByStatusCode: {},
        slowQueries: [], // No slow queries
        recentActivity: []
      };

      const health = {
        timestamp: Date.now(),
        memoryUsage: {
          rss: 100 * 1024 * 1024, // 100MB - normal memory usage
          heapTotal: 80 * 1024 * 1024,
          heapUsed: 60 * 1024 * 1024,
          external: 10 * 1024 * 1024,
          arrayBuffers: 5 * 1024 * 1024
        },
        uptime: 86400000,
        nodeVersion: 'v18.0.0',
        pid: 12345
      };

      const issues = PerformanceUtils.detectIssues(stats, health);
      expect(issues).toHaveLength(0);
    });
  });
});