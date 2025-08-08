/**
 * Performance Monitor - Client-side performance violation detection and prevention
 * 
 * Monitors main thread blocking, forced reflows, and provides real-time performance insights
 * to prevent setTimeout and layout violations.
 */

export interface PerformanceViolation {
  type: 'setTimeout' | 'forcedReflow' | 'mainThreadBlocking';
  duration: number;
  timestamp: number;
  source?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ClientPerformanceMonitor {
  private violations: PerformanceViolation[] = [];
  private isMonitoring = false;
  private performanceObserver?: PerformanceObserver;
  
  // Performance thresholds (in milliseconds)
  private readonly THRESHOLDS = {
    setTimeout: 50, // setTimeout operations should be under 50ms
    forcedReflow: 16, // Forced reflows should be under 16ms (60fps budget)
    mainThreadBlocking: 16 // Main thread blocking should be under 16ms
  };

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring || typeof window === 'undefined') return;
    
    this.isMonitoring = true;
    
    // Monitor long tasks (main thread blocking)
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          
          entries.forEach((entry) => {
            if (entry.entryType === 'longtask' && entry.duration > this.THRESHOLDS.mainThreadBlocking) {
              this.recordViolation({
                type: 'mainThreadBlocking',
                duration: entry.duration,
                timestamp: Date.now(),
                source: entry.name || 'unknown',
                severity: this.getSeverity('mainThreadBlocking', entry.duration)
              });
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
    
    // Monitor console violations (setTimeout, forced reflow warnings)
    this.interceptConsoleWarnings();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this.performanceObserver?.disconnect();
  }

  /**
   * Record a performance violation
   */
  private recordViolation(violation: PerformanceViolation) {
    this.violations.push(violation);
    
    // Keep only last 100 violations to prevent memory leaks
    if (this.violations.length > 100) {
      this.violations = this.violations.slice(-100);
    }
    
    // Log critical violations in development
    if (process.env.NODE_ENV === 'development' && violation.severity === 'critical') {
      console.warn(`🚨 Critical Performance Violation:`, violation);
    }
  }

  /**
   * Get severity level based on violation type and duration
   */
  private getSeverity(type: keyof typeof this.THRESHOLDS, duration: number): PerformanceViolation['severity'] {
    const threshold = this.THRESHOLDS[type];
    const ratio = duration / threshold;
    
    if (ratio >= 5) return 'critical'; // 5x over threshold
    if (ratio >= 3) return 'high';     // 3x over threshold
    if (ratio >= 2) return 'medium';   // 2x over threshold
    return 'low';
  }

  /**
   * Intercept console warnings to detect performance violations
   */
  private interceptConsoleWarnings() {
    const originalWarn = console.warn;
    
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Detect setTimeout violations
      const setTimeoutMatch = message.match(/setTimeout.*handler took (\d+)ms/);
      if (setTimeoutMatch) {
        const duration = parseInt(setTimeoutMatch[1]);
        this.recordViolation({
          type: 'setTimeout',
          duration,
          timestamp: Date.now(),
          source: 'console',
          severity: this.getSeverity('setTimeout', duration)
        });
      }
      
      // Detect forced reflow violations
      const reflowMatch = message.match(/Forced reflow.*took (\d+)ms/);
      if (reflowMatch) {
        const duration = parseInt(reflowMatch[1]);
        this.recordViolation({
          type: 'forcedReflow',
          duration,
          timestamp: Date.now(),
          source: 'console',
          severity: this.getSeverity('forcedReflow', duration)
        });
      }
      
      // Call original console.warn
      originalWarn.apply(console, args);
    };
  }

  /**
   * Get current performance violations
   */
  getViolations(): PerformanceViolation[] {
    return [...this.violations];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const recentViolations = this.violations.filter(v => now - v.timestamp < 60000); // Last minute
    
    return {
      totalViolations: this.violations.length,
      recentViolations: recentViolations.length,
      criticalViolations: this.violations.filter(v => v.severity === 'critical').length,
      averageDuration: this.violations.length > 0 
        ? this.violations.reduce((sum, v) => sum + v.duration, 0) / this.violations.length 
        : 0,
      violationsByType: {
        setTimeout: this.violations.filter(v => v.type === 'setTimeout').length,
        forcedReflow: this.violations.filter(v => v.type === 'forcedReflow').length,
        mainThreadBlocking: this.violations.filter(v => v.type === 'mainThreadBlocking').length,
      }
    };
  }

  /**
   * Clear all recorded violations
   */
  clearViolations() {
    this.violations = [];
  }

  /**
   * Performance-optimized setTimeout replacement
   * Automatically uses requestAnimationFrame for short delays to prevent violations
   */
  static optimizedTimeout(callback: () => void, delay: number): number | void {
    if (delay < 50) {
      // Use requestAnimationFrame for short delays to prevent violations
      return requestAnimationFrame(() => {
        if (delay > 16) {
          // Add minimal delay using nested RAF for delays between 16-50ms
          requestAnimationFrame(callback);
        } else {
          callback();
        }
      });
    } else {
      // Use regular setTimeout for longer delays
      return window.setTimeout(callback, delay);
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new ClientPerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
}

// Make available on window for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}