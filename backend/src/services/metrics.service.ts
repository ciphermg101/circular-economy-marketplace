import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from '../utils/logger';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  
  // Counters
  private readonly httpRequestsTotal: Counter;
  private readonly authFailuresTotal: Counter;
  private readonly errorTotal: Counter;
  
  // Histograms
  private readonly httpRequestDurationSeconds: Histogram;
  private readonly databaseQueryDurationSeconds: Histogram;
  
  // Gauges
  private readonly activeUsers: Gauge;
  private readonly activeConnections: Gauge;

  constructor() {
    this.registry = new Registry();
    
    // Initialize counters
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.authFailuresTotal = new Counter({
      name: 'auth_failures_total',
      help: 'Total number of authentication failures',
      labelNames: ['reason'],
      registers: [this.registry],
    });

    this.errorTotal = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // Initialize histograms
    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.databaseQueryDurationSeconds = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    // Initialize gauges
    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of active users',
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });

    // Add default metrics (CPU, memory, etc.)
    this.registry.setDefaultLabels({
      app: 'circular-economy-marketplace',
    });
  }

  // Record HTTP request
  recordHttpRequest(method: string, path: string, status: number, duration: number): void {
    try {
      this.httpRequestsTotal.labels(method, path, status.toString()).inc();
      this.httpRequestDurationSeconds.labels(method, path, status.toString()).observe(duration);
    } catch (error) {
      logger.error('Error recording HTTP metrics:', error);
    }
  }

  // Record authentication failure
  recordAuthFailure(reason: string): void {
    try {
      this.authFailuresTotal.labels(reason).inc();
    } catch (error) {
      logger.error('Error recording auth failure metrics:', error);
    }
  }

  // Record error
  recordError(type: string): void {
    try {
      this.errorTotal.labels(type).inc();
    } catch (error) {
      logger.error('Error recording error metrics:', error);
    }
  }

  // Record database query
  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    try {
      this.databaseQueryDurationSeconds.labels(operation, table).observe(duration);
    } catch (error) {
      logger.error('Error recording database metrics:', error);
    }
  }

  // Update active users count
  setActiveUsers(count: number): void {
    try {
      this.activeUsers.set(count);
    } catch (error) {
      logger.error('Error updating active users metric:', error);
    }
  }

  // Update active connections count
  setActiveConnections(count: number): void {
    try {
      this.activeConnections.set(count);
    } catch (error) {
      logger.error('Error updating active connections metric:', error);
    }
  }

  // Get metrics
  async getMetrics(): Promise<string> {
    try {
      return await this.registry.metrics();
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }
} 