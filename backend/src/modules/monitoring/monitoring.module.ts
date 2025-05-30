import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringService } from '../../services/monitoring.service';
import { MetricsService } from '../../services/metrics.service';
import { PrometheusService } from '../../services/prometheus.service';
import { RedisModule } from '../cache/redis.module';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
  ],
  providers: [
    MonitoringService,
    MetricsService,
    PrometheusService,
  ],
  exports: [
    MonitoringService,
    MetricsService,
    PrometheusService,
  ],
})
export class MonitoringModule {} 