/**
 * Performance Dashboard Component
 * 
 * Displays comprehensive performance metrics, system health, and user analytics
 * for monitoring application performance and usage patterns.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Monitor,
  Smartphone,
  Bot,
  RefreshCw
} from 'lucide-react';

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatusCode: Record<number, number>;
  errorRate: number;
  slowQueries: Array<{
    endpoint: string;
    method: string;
    responseTime: number;
    timestamp: number;
  }>;
  recentActivity: Array<{
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    timestamp: number;
  }>;
}

interface SystemHealth {
  timestamp: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  nodeVersion: string;
  pid: number;
  performanceScore: number;
  issues: string[];
  formattedMemory: string;
  formattedUptime: string;
}

interface UserAnalytics {
  totalVisits: number;
  uniqueUserAgents: number;
  popularEndpoints: Array<{ endpoint: string; count: number }>;
  deviceTypes: Record<string, number>;
  peakUsageHours: Record<number, number>;
}

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Performance-optimized data fetching with progressive loading to prevent main thread blocking
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use progressive loading instead of Promise.all to prevent 81ms main thread blocking
      // Each API call is deferred to its own frame for better performance
      
      // Fetch stats first (most important)
      const statsRes = await fetch('/api/performance/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
        
        // Defer next API call to prevent blocking
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      // Fetch health data (second priority)
      const healthRes = await fetch('/api/performance/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.data);
        
        // Defer final API call to prevent blocking
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      // Fetch analytics last (lowest priority)
      const analyticsRes = await fetch('/api/performance/analytics');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data);
      }
      
      // Check if all critical requests succeeded
      if (!statsRes.ok || !healthRes.ok) {
        throw new Error('Failed to fetch critical performance data');
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchPerformanceData();
    
    // Performance-optimized auto-refresh using requestAnimationFrame instead of setInterval
    // This prevents setTimeout violations by using frame-based timing
    let rafId: number;
    let lastRefreshTime = Date.now();
    const REFRESH_INTERVAL = 30000; // 30 seconds
    
    const performanceRefreshLoop = () => {
      const now = Date.now();
      
      if (now - lastRefreshTime >= REFRESH_INTERVAL) {
        // Use requestAnimationFrame to defer the actual fetch operation
        requestAnimationFrame(() => {
          fetchPerformanceData();
        });
        lastRefreshTime = now;
      }
      
      // Continue the loop using requestAnimationFrame instead of setTimeout
      rafId = requestAnimationFrame(performanceRefreshLoop);
    };
    
    // Start the performance refresh loop
    rafId = requestAnimationFrame(performanceRefreshLoop);
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-forest"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error loading performance data: {error}</p>
        <Button onClick={fetchPerformanceData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">
            System performance and usage analytics
            {lastUpdated && (
              <span className="ml-2 text-sm">
                (Last updated: {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchPerformanceData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Performance Score</p>
                  <p className={`text-2xl font-bold ${getStatusColor(health.performanceScore)}`}>
                    {health.performanceScore}
                  </p>
                </div>
                <Activity className={`h-8 w-8 ${getStatusColor(health.performanceScore)}`} />
              </div>
              <div className="mt-2">
                {getStatusBadge(health.performanceScore)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{health.formattedUptime}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Node.js {health.nodeVersion}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(health.memoryUsage.heapUsed / 1024 / 1024)}MB
                  </p>
                </div>
                <Monitor className="h-8 w-8 text-purple-600" />
              </div>
              <Progress 
                value={(health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{health.issues.length}</p>
                </div>
                {health.issues.length === 0 ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                )}
              </div>
              {health.issues.length > 0 && (
                <p className="text-xs text-red-600 mt-1">Issues detected</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues Alert */}
      {health && health.issues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Performance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index} className="text-red-700 text-sm">• {issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">User Analytics</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Request Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Requests:</span>
                      <span className="font-semibold">{formatNumber(stats.totalRequests)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Response Time:</span>
                      <span className="font-semibold">{stats.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error Rate:</span>
                      <span className={`font-semibold ${stats.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.errorRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Code Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.requestsByStatusCode)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([code, count]) => (
                        <div key={code} className="flex justify-between">
                          <span className="text-gray-600">{code}:</span>
                          <span className="font-semibold">{formatNumber(count)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {stats.slowQueries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-600 flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Slow Queries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.slowQueries.slice(0, 5).map((query, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{query.method} {query.endpoint}</span>
                            <span className="text-orange-600">{query.responseTime}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    User Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Visits:</span>
                      <span className="font-semibold">{formatNumber(analytics.totalVisits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unique Visitors:</span>
                      <span className="font-semibold">{formatNumber(analytics.uniqueUserAgents)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics.deviceTypes).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {device === 'mobile' && <Smartphone className="h-4 w-4 mr-2" />}
                          {device === 'desktop' && <Monitor className="h-4 w-4 mr-2" />}
                          {device === 'bot' && <Bot className="h-4 w-4 mr-2" />}
                          <span className="text-gray-600 capitalize">{device}:</span>
                        </div>
                        <span className="font-semibold">{formatNumber(count)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Popular Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.popularEndpoints.slice(0, 5).map((endpoint, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{endpoint.endpoint}</span>
                        <span className="font-semibold">{formatNumber(endpoint.count)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.requestsByEndpoint)
                    .sort(([, a], [, b]) => b - a)
                    .map(([endpoint, count]) => (
                      <div key={endpoint} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-900 font-mono text-sm">{endpoint}</span>
                        <Badge variant="outline">{formatNumber(count)} requests</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={activity.statusCode >= 400 ? "destructive" : "default"}
                          className="w-12 justify-center"
                        >
                          {activity.statusCode}
                        </Badge>
                        <span className="font-mono text-sm">{activity.method} {activity.endpoint}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{activity.responseTime}ms</div>
                        <div className="text-xs text-gray-500">{formatTime(activity.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}