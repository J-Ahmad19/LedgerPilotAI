import { logger } from './logger.js';
import client from 'prom-client';

// Collect default node metrics
client.collectDefaultMetrics();

// Define custom metrics
export const prometheusMetrics = {
  reconciliationDuration: new client.Histogram({
    name: 'reconciliation_duration_seconds',
    help: 'Duration of reconciliation runs in seconds',
    labelNames: ['tenantId', 'runId'],
    buckets: [1, 5, 10, 30, 60, 120, 300, 600]
  }),
  recordsProcessed: new client.Counter({
    name: 'records_processed_total',
    help: 'Total number of records processed',
    labelNames: ['tenantId', 'runId']
  }),
  matchRate: new client.Gauge({
    name: 'match_rate_percent',
    help: 'Match rate percentage',
    labelNames: ['tenantId', 'runId']
  }),
  exceptionRate: new client.Gauge({
    name: 'exception_rate_percent',
    help: 'Exception rate percentage',
    labelNames: ['tenantId', 'runId']
  }),
  aiUsage: new client.Counter({
    name: 'ai_usage_total',
    help: 'Total number of AI interactions',
    labelNames: ['task', 'tenantId', 'result']
  }),
  aiFailure: new client.Counter({
    name: 'ai_failure_total',
    help: 'Total number of failed AI interactions',
    labelNames: ['task', 'tenantId']
  }),
  workerFailures: new client.Counter({
    name: 'worker_failures_total',
    help: 'Total number of worker job failures',
    labelNames: ['tenantId']
  }),
  apiLatency: new client.Histogram({
    name: 'api_latency_seconds',
    help: 'API latency in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
  })
};

interface MetricPayload {
  name: string;
  value: number | string;
  unit?: string;
  tags?: Record<string, any>;
}

export const metrics = {
  /**
   * Get the prometheus registry to expose metrics
   */
  getRegistry: () => client.register,

  /**
   * Log a structured metric event and update Prometheus if applicable
   */
  log: (payload: MetricPayload) => {
    // Standard Pino logging
    logger.info({
      type: 'metric',
      metric: payload.name,
      value: payload.value,
      unit: payload.unit,
      ...payload.tags
    });

    // Prometheus recording
    const val = Number(payload.value);
    if (!isNaN(val)) {
      if (payload.name === 'reconciliation_duration') {
        const seconds = payload.unit === 'ms' ? val / 1000 : val;
        prometheusMetrics.reconciliationDuration.observe({ tenantId: payload.tags?.tenantId, runId: payload.tags?.runId }, seconds);
      } else if (payload.name === 'records_processed') {
        prometheusMetrics.recordsProcessed.inc({ tenantId: payload.tags?.tenantId, runId: payload.tags?.runId }, val);
      } else if (payload.name === 'match_rate') {
        prometheusMetrics.matchRate.set({ tenantId: payload.tags?.tenantId, runId: payload.tags?.runId }, val);
      } else if (payload.name === 'exception_rate') {
        prometheusMetrics.exceptionRate.set({ tenantId: payload.tags?.tenantId, runId: payload.tags?.runId }, val);
      } else if (payload.name === 'ai_usage') {
        prometheusMetrics.aiUsage.inc({ task: payload.tags?.task, tenantId: payload.tags?.tenantId, result: payload.tags?.result }, val);
      } else if (payload.name === 'ai_failure_rate') {
        prometheusMetrics.aiFailure.inc({ task: payload.tags?.task, tenantId: payload.tags?.tenantId }, val);
      }
    }
  },

  /**
   * Log an operational event (e.g. worker started, job failed)
   */
  event: (eventName: string, details?: Record<string, any>) => {
    logger.info({
      type: 'event',
      event: eventName,
      ...details
    });
  },
  
  /**
   * Log an operational error
   */
  error: (eventName: string, error: Error, details?: Record<string, any>) => {
    logger.error({
      type: 'error',
      event: eventName,
      err: error,
      ...details
    });

    if (eventName === 'worker_job_failed' || eventName === 'bullmq_job_failed') {
      prometheusMetrics.workerFailures.inc({ tenantId: details?.tenantId });
    }
  }
};
