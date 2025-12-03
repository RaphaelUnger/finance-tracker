import { performance } from 'perf_hooks';
import { InteractionManager, DeviceInfo, Platform } from 'react-native';

export interface PerformanceMetrics {
  appStartTime: number;
  navigationTime: number;
  databaseQueryTime: number;
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
}

export interface PerformanceBenchmark {
  name: string;
  target: number;
  actual: number;
  status: 'pass' | 'warning' | 'fail';
  impact: 'low' | 'medium' | 'high';
}

export interface MemoryLeak {
  component: string;
  leakType: 'listener' | 'timer' | 'reference' | 'subscription';
  description: string;
  severity: 'low' | 'medium' | 'high';
  fixSuggestion: string;
}

class PerformanceMonitoringService {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();
  private memorySnapshots: number[] = [];
  private renderTimes: Map<string, number[]> = new Map();
  private isMonitoring: boolean = false;
  private leakDetectors: Map<string, any> = new Map();

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (__DEV__) {
      this.isMonitoring = true;
      this.startMemoryMonitoring();
      this.setupLeakDetection();
    }
  }

  /**
   * App startup performance monitoring
   */
  markAppStart(): void {
    this.startTimes.set('appStart', performance.now());
  }

  markAppReady(): void {
    const startTime = this.startTimes.get('appStart');
    if (startTime) {
      const appStartTime = performance.now() - startTime;
      this.metrics.set('appStartTime', appStartTime);
      console.log(`🚀 App started in ${appStartTime.toFixed(2)}ms`);

      if (appStartTime > 2000) {
        console.warn(`⚠️ App start time exceeded target (${appStartTime.toFixed(2)}ms > 2000ms)`);
      }
    }
  }

  /**
   * Navigation performance monitoring
   */
  markNavigationStart(screenName: string): void {
    this.startTimes.set(`navigation_${screenName}`, performance.now());
  }

  markNavigationEnd(screenName: string): void {
    const startTime = this.startTimes.get(`navigation_${screenName}`);
    if (startTime) {
      const navigationTime = performance.now() - startTime;
      this.metrics.set(`navigation_${screenName}`, navigationTime);

      if (navigationTime > 500) {
        console.warn(`⚠️ Navigation to ${screenName} slow: ${navigationTime.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Database query performance monitoring
   */
  async measureDatabaseQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryFunction();
      const queryTime = performance.now() - startTime;

      this.metrics.set(`db_${queryName}`, queryTime);

      if (queryTime > 100) {
        console.warn(`⚠️ Database query ${queryName} slow: ${queryTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const queryTime = performance.now() - startTime;
      console.error(`❌ Database query ${queryName} failed after ${queryTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * Component render time monitoring
   */
  measureComponentRender(componentName: string, renderFunction: () => void): void {
    const startTime = performance.now();

    renderFunction();

    const renderTime = performance.now() - startTime;

    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }

    const times = this.renderTimes.get(componentName)!;
    times.push(renderTime);

    // Keep only last 10 render times
    if (times.length > 10) {
      times.shift();
    }

    const avgRenderTime = times.reduce((sum, time) => sum + time, 0) / times.length;

    if (avgRenderTime > 16.67) { // 60 FPS = 16.67ms per frame
      console.warn(`⚠️ Component ${componentName} rendering slowly: ${avgRenderTime.toFixed(2)}ms avg`);
    }
  }

  /**
   * Memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!this.isMonitoring) return;

    // Take memory snapshot every 30 seconds
    setInterval(() => {
      this.takeMemorySnapshot();
    }, 30000);

    // Initial snapshot
    this.takeMemorySnapshot();
  }

  private takeMemorySnapshot(): void {
    if (Platform.OS === 'android') {
      // On Android, we can use DeviceInfo or native modules
      try {
        // This would require a native module implementation
        const memoryInfo = { usedJSHeapSize: 0 }; // Placeholder
        this.memorySnapshots.push(memoryInfo.usedJSHeapSize);

        if (this.memorySnapshots.length > 20) {
          this.memorySnapshots.shift();
        }

        this.detectMemoryLeaks();
      } catch (error) {
        console.warn('Memory monitoring not available on this platform');
      }
    }
  }

  private detectMemoryLeaks(): void {
    if (this.memorySnapshots.length < 5) return;

    const recentSnapshots = this.memorySnapshots.slice(-5);
    const isIncreasing = recentSnapshots.every((snapshot, index) => {
      if (index === 0) return true;
      return snapshot > recentSnapshots[index - 1];
    });

    const growthRate = (recentSnapshots[recentSnapshots.length - 1] - recentSnapshots[0]) / recentSnapshots[0];

    if (isIncreasing && growthRate > 0.2) { // 20% growth in memory
      console.warn('🔥 Potential memory leak detected!');
      this.generateMemoryLeakReport();
    }
  }

  /**
   * Leak detection setup
   */
  private setupLeakDetection(): void {
    // Monitor common leak sources
    this.setupTimerLeakDetection();
    this.setupListenerLeakDetection();
    this.setupSubscriptionLeakDetection();
  }

  private setupTimerLeakDetection(): void {
    const originalSetTimeout = global.setTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearTimeout = global.clearTimeout;
    const originalClearInterval = global.clearInterval;

    const activeTimers = new Set();

    global.setTimeout = ((callback: any, delay?: number, ...args: any[]) => {
      const id = originalSetTimeout(callback, delay, ...args);
      activeTimers.add(id);
      return id;
    }) as any;

    global.setInterval = ((callback: any, delay?: number, ...args: any[]) => {
      const id = originalSetInterval(callback, delay, ...args);
      activeTimers.add(id);
      return id;
    }) as any;

    global.clearTimeout = (id: any) => {
      activeTimers.delete(id);
      return originalClearTimeout(id);
    };

    global.clearInterval = (id: any) => {
      activeTimers.delete(id);
      return originalClearInterval(id);
    };

    // Check for timer leaks every minute
    setInterval(() => {
      if (activeTimers.size > 50) {
        console.warn(`⚠️ Many active timers detected: ${activeTimers.size}`);
      }
    }, 60000);
  }

  private setupListenerLeakDetection(): void {
    // This would monitor EventEmitter and component listeners
    // Implementation would require more specific monitoring
  }

  private setupSubscriptionLeakDetection(): void {
    // Monitor Redux and other subscriptions
    // Implementation would track subscription/unsubscription patterns
  }

  /**
   * Performance benchmark checking
   */
  getBenchmarks(): PerformanceBenchmark[] {
    const benchmarks: PerformanceBenchmark[] = [];

    // App start time benchmark
    const appStartTime = this.metrics.get('appStartTime');
    if (appStartTime !== undefined) {
      benchmarks.push({
        name: 'App Start Time',
        target: 2000,
        actual: appStartTime,
        status: appStartTime <= 2000 ? 'pass' : appStartTime <= 3000 ? 'warning' : 'fail',
        impact: 'high'
      });
    }

    // Navigation benchmarks
    for (const [key, time] of this.metrics.entries()) {
      if (key.startsWith('navigation_')) {
        const screenName = key.replace('navigation_', '');
        benchmarks.push({
          name: `Navigation to ${screenName}`,
          target: 500,
          actual: time,
          status: time <= 500 ? 'pass' : time <= 750 ? 'warning' : 'fail',
          impact: 'medium'
        });
      }
    }

    // Database query benchmarks
    for (const [key, time] of this.metrics.entries()) {
      if (key.startsWith('db_')) {
        const queryName = key.replace('db_', '');
        benchmarks.push({
          name: `Database Query: ${queryName}`,
          target: 50,
          actual: time,
          status: time <= 50 ? 'pass' : time <= 100 ? 'warning' : 'fail',
          impact: 'medium'
        });
      }
    }

    return benchmarks;
  }

  /**
   * Memory leak report generation
   */
  private generateMemoryLeakReport(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Common React Native memory leak patterns
    leaks.push({
      component: 'Global',
      leakType: 'timer',
      description: 'Uncleaned timers (setTimeout/setInterval)',
      severity: 'medium',
      fixSuggestion: 'Clear all timers in componentWillUnmount or useEffect cleanup'
    });

    leaks.push({
      component: 'Navigation',
      leakType: 'listener',
      description: 'Navigation event listeners not removed',
      severity: 'low',
      fixSuggestion: 'Remove navigation listeners in cleanup functions'
    });

    leaks.push({
      component: 'Redux',
      leakType: 'subscription',
      description: 'Redux subscriptions not unsubscribed',
      severity: 'medium',
      fixSuggestion: 'Unsubscribe from Redux store in component cleanup'
    });

    return leaks;
  }

  /**
   * Bundle size analysis
   */
  analyzeBundleSize(): { size: number; recommendations: string[] } {
    // This would require integration with Metro bundler
    // For now, return estimated analysis
    const estimatedSize = 15 * 1024 * 1024; // 15MB estimated
    const recommendations: string[] = [];

    if (estimatedSize > 20 * 1024 * 1024) { // > 20MB
      recommendations.push('Consider code splitting for large dependencies');
      recommendations.push('Use dynamic imports for infrequently used modules');
      recommendations.push('Remove unused dependencies');
    }

    if (estimatedSize > 15 * 1024 * 1024) { // > 15MB
      recommendations.push('Optimize image assets with WebP format');
      recommendations.push('Use vector icons instead of image icons');
    }

    return {
      size: estimatedSize,
      recommendations
    };
  }

  /**
   * FPS monitoring
   */
  monitorFPS(callback: (fps: number) => void): () => void {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) { // Every second
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        callback(fps);

        if (fps < 50) {
          console.warn(`⚠️ Low FPS detected: ${fps}`);
        }

        frames = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);

    return () => {
      this.isMonitoring = false;
    };
  }

  /**
   * Performance optimization suggestions
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const benchmarks = this.getBenchmarks();

    // Check failed benchmarks
    const failedBenchmarks = benchmarks.filter(b => b.status === 'fail');
    const warningBenchmarks = benchmarks.filter(b => b.status === 'warning');

    if (failedBenchmarks.some(b => b.name === 'App Start Time')) {
      suggestions.push('Optimize app startup by lazy loading non-critical components');
      suggestions.push('Move heavy computations to background threads');
      suggestions.push('Reduce initial bundle size with code splitting');
    }

    if (failedBenchmarks.some(b => b.name.includes('Navigation'))) {
      suggestions.push('Implement screen pre-loading for frequently accessed screens');
      suggestions.push('Optimize component mounting with React.memo and useMemo');
      suggestions.push('Use native navigation optimizations');
    }

    if (failedBenchmarks.some(b => b.name.includes('Database'))) {
      suggestions.push('Add database indexes for frequently queried columns');
      suggestions.push('Implement query result caching');
      suggestions.push('Use database connection pooling');
    }

    // General performance suggestions
    if (warningBenchmarks.length > 0) {
      suggestions.push('Profile component renders with React DevTools');
      suggestions.push('Implement list virtualization for large datasets');
      suggestions.push('Optimize image loading with lazy loading and caching');
    }

    // Memory optimization
    const memoryGrowth = this.memorySnapshots.length > 5 ?
      (this.memorySnapshots[this.memorySnapshots.length - 1] - this.memorySnapshots[0]) / this.memorySnapshots[0] : 0;

    if (memoryGrowth > 0.1) {
      suggestions.push('Review component lifecycle methods for memory leaks');
      suggestions.push('Implement proper cleanup in useEffect hooks');
      suggestions.push('Use WeakMap and WeakSet for caching where appropriate');
    }

    return suggestions;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): {
    metrics: PerformanceMetrics;
    benchmarks: PerformanceBenchmark[];
    leaks: MemoryLeak[];
    suggestions: string[];
    bundleAnalysis: { size: number; recommendations: string[] };
  } {
    const report = {
      metrics: {
        appStartTime: this.metrics.get('appStartTime') || 0,
        navigationTime: Array.from(this.metrics.entries())
          .filter(([key]) => key.startsWith('navigation_'))
          .reduce((avg, [, time], _, arr) => avg + time / arr.length, 0),
        databaseQueryTime: Array.from(this.metrics.entries())
          .filter(([key]) => key.startsWith('db_'))
          .reduce((avg, [, time], _, arr) => avg + time / arr.length, 0),
        memoryUsage: this.memorySnapshots[this.memorySnapshots.length - 1] || 0,
        renderTime: Array.from(this.renderTimes.values())
          .flat()
          .reduce((avg, time, _, arr) => avg + time / arr.length, 0),
        bundleSize: this.analyzeBundleSize().size
      },
      benchmarks: this.getBenchmarks(),
      leaks: this.generateMemoryLeakReport(),
      suggestions: this.getOptimizationSuggestions(),
      bundleAnalysis: this.analyzeBundleSize()
    };

    return report;
  }

  /**
   * Performance testing utilities
   */
  async runPerformanceTest(
    testName: string,
    testFunction: () => Promise<void>,
    iterations: number = 5
  ): Promise<{ average: number; min: number; max: number; results: number[] }> {
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await testFunction();
      const endTime = performance.now();
      results.push(endTime - startTime);
    }

    const average = results.reduce((sum, time) => sum + time, 0) / results.length;
    const min = Math.min(...results);
    const max = Math.max(...results);

    console.log(`📊 Performance Test: ${testName}`);
    console.log(`Average: ${average.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);

    return { average, min, max, results };
  }

  /**
   * Cleanup and stop monitoring
   */
  cleanup(): void {
    this.isMonitoring = false;
    this.metrics.clear();
    this.startTimes.clear();
    this.memorySnapshots.length = 0;
    this.renderTimes.clear();
    this.leakDetectors.clear();
  }
}

export default new PerformanceMonitoringService();
