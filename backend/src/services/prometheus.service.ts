import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  private readonly registry: Registry;
  private readonly counters = new Map<string, Counter<string>>();
  private readonly histograms = new Map<string, Histogram<string>>();
  private readonly gauges = new Map<string, Gauge<string>>();

  constructor() {
    this.registry = new Registry();
  }

  incrementCounter(name: string, labels: Record<string, string | undefined>): void {
    let counter = this.counters.get(name);
    if (!counter) {
      counter = new Counter({
        name,
        help: `Counter for ${name}`,
        labelNames: Object.keys(labels),
        registers: [this.registry]
      });
      this.counters.set(name, counter);
    }
    counter.inc(labels);
  }

  observeHistogram(name: string, value: number, labels: Record<string, string>): void {
    let histogram = this.histograms.get(name);
    if (!histogram) {
      histogram = new Histogram({
        name,
        help: `Histogram for ${name}`,
        labelNames: Object.keys(labels),
        registers: [this.registry]
      });
      this.histograms.set(name, histogram);
    }
    histogram.observe(labels, value);
  }

  setGauge(name: string, value: number, labels: Record<string, string>): void {
    let gauge = this.gauges.get(name);
    if (!gauge) {
      gauge = new Gauge({
        name,
        help: `Gauge for ${name}`,
        labelNames: Object.keys(labels),
        registers: [this.registry]
      });
      this.gauges.set(name, gauge);
    }
    gauge.set(labels, value);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
} 