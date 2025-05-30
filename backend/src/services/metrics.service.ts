import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrometheusService } from './prometheus.service';
import { ErrorCategory, ErrorSeverity } from '../types/error.types';

interface MetricValue {
  value: number;
  timestamp: number;
}

export interface MetricLabels {
  [key: string]: string;
}

export interface ErrorMetric {
  type: ErrorCategory;
  severity: ErrorSeverity;
  context?: string;
  path?: string;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  context?: string;
}

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly redis: Redis;
  private readonly retentionPeriod: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly prometheusService: PrometheusService
  ) {
    const redisConfig = {
      host: this.configService.get<string>('redis.host') || 'localhost',
      port: this.configService.get<number>('redis.port') || 6379,
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.metricsDb') || 1,
    };

    this.redis = new Redis(redisConfig);
    this.retentionPeriod = this.configService.get<number>('metrics.retentionPeriod', 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      this.logger.log('Metrics service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize metrics service:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
      this.logger.log('Metrics service destroyed');
    } catch (error) {
      this.logger.error('Error destroying metrics service:', error);
    }
  }

  private serializeLabels(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort()
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('|');
  }

  private getMetricKey(name: string, labels: Record<string, string> = {}): string {
    const labelString = this.serializeLabels(labels);
    return `metrics:${name}${labelString ? `:${labelString}` : ''}`;
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, partialKeys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...partialKeys);
    } while (cursor !== '0');

    return keys;
  }

  async increment(name: string, labels: Record<string, string> = {}, value: number = 1): Promise<void> {
    const key = this.getMetricKey(name, labels);
    const now = Date.now();

    try {
      const pipeline = this.redis.multi();
      pipeline.zadd(key, now, JSON.stringify({ value, timestamp: now }));
      pipeline.zremrangebyscore(key, '-inf', now - this.retentionPeriod);
      pipeline.expire(key, Math.floor(this.retentionPeriod / 1000));
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to increment metric ${name}:`, error);
    }
  }

  async decrement(name: string, labels: Record<string, string> = {}, value: number = 1): Promise<void> {
    await this.increment(name, labels, -value);
  }

  async set(name: string, value: number, labels: Record<string, string> = {}): Promise<void> {
    const key = this.getMetricKey(name, labels);
    const now = Date.now();

    try {
      const pipeline = this.redis.multi();
      pipeline.zadd(key, now, JSON.stringify({ value, timestamp: now }));
      pipeline.zremrangebyscore(key, '-inf', now - this.retentionPeriod);
      pipeline.expire(key, Math.floor(this.retentionPeriod / 1000));
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to set metric ${name}:`, error);
    }
  }

  async get(name: string, labels: Record<string, string> = {}): Promise<MetricValue | null> {
    const key = this.getMetricKey(name, labels);

    try {
      const result = await this.redis.zrevrange(key, 0, 0);
      if (result.length === 0) return null;
      return JSON.parse(result[0]);
    } catch (error) {
      this.logger.error(`Failed to get metric ${name}:`, error);
      return null;
    }
  }

  async getRange(
    name: string,
    start: number,
    end: number = Date.now(),
    labels: Record<string, string> = {},
  ): Promise<MetricValue[]> {
    const key = this.getMetricKey(name, labels);

    try {
      const result = await this.redis.zrangebyscore(key, start, end);
      return result.map(item => JSON.parse(item));
    } catch (error) {
      this.logger.error(`Failed to get metric range ${name}:`, error);
      return [];
    }
  }

  async incrementErrorCount(errorType: string, module: string): Promise<void> {
    await this.increment('errors_total', { type: errorType, module });
  }

  async getErrorCounts(timeframe: number = 24 * 60 * 60 * 1000): Promise<Record<string, number>> {
    const now = Date.now();
    const start = now - timeframe;
    const pattern = 'metrics:errors_total:*';
    const counts: Record<string, number> = {};

    try {
      const keys = await this.scanKeys(pattern);

      for (const key of keys) {
        const [, , name, rawLabels] = key.split(':', 4); // metrics:name:labelstring
        const labelParts = rawLabels.split('|').map(part => part.split('='));
        const labels: Record<string, string> = Object.fromEntries(labelParts.map(([k, v]) => [k, decodeURIComponent(v)]));

        const values = await this.getRange('errors_total', start, now, labels);
        const count = values.reduce((sum, item) => sum + item.value, 0);
        counts[`${labels.type}:${labels.module}`] = count;
      }

      return counts;
    } catch (error) {
      this.logger.error('Failed to get error counts:', error);
      return {};
    }
  }

  recordError(error: ErrorMetric): void {
    this.prometheusService.incrementCounter('app_errors_total', {
      type: error.type,
      severity: error.severity,
      context: error.context || 'unknown',
      path: error.path || 'unknown'
    });
  }

  recordPerformance(metric: PerformanceMetric): void {
    this.prometheusService.observeHistogram('app_operation_duration_seconds', metric.duration, {
      operation: metric.operation,
      success: metric.success.toString(),
      context: metric.context || 'unknown'
    });
  }

  recordRequestDuration(path: string, method: string, statusCode: number, duration: number): void {
    this.prometheusService.observeHistogram('http_request_duration_seconds', duration, {
      path,
      method,
      status: statusCode.toString()
    });
  }

  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    this.prometheusService.observeHistogram('database_query_duration_seconds', duration, {
      operation,
      table,
      success: success.toString()
    });
  }

  recordCacheOperation(operation: string, key: string, duration?: number): void {
    const keyPrefix = key.split(':')[0];

    this.prometheusService.incrementCounter('cache_operations_total', {
      operation,
      key: keyPrefix,
    });

    if (duration !== undefined) {
      this.prometheusService.observeHistogram('cache_operation_duration_seconds', duration, {
        operation,
        key: keyPrefix,
      });
    }
  }

  recordCacheHit(cacheName: string): void {
    this.prometheusService.incrementCounter('cache_hits_total', { cache: cacheName });
  }

  recordCacheMiss(cacheName: string): void {
    this.prometheusService.incrementCounter('cache_misses_total', { cache: cacheName });
  }

  setActiveConnections(service: string, count: number): void {
    this.prometheusService.setGauge('active_connections', count, { service });
  }

  recordHttpRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.prometheusService.observeHistogram('http_request_duration_seconds', duration, {
      method,
      path,
      status: statusCode.toString()
    });

    this.prometheusService.incrementCounter('http_requests_total', {
      method,
      path,
      status: statusCode.toString()
    });
  }
}
