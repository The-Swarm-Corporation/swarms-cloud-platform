export type TimeRange = '15m' | '1h' | '24h' | '7d' | '30d' | 'custom';

export type Granularity = '1m' | '5m' | '1h' | '1d';

export type GroupByDimension = 'none' | 'agent' | 'model' | 'endpoint' | 'swarm_type';

export interface ObservabilityBucket {
  ts: string; // ISO 8601
  requests: number;
  errors: number;
  latency_p50: number | null;
  latency_p95: number | null;
  latency_p99: number | null;
  total_cost: number | null;
  total_tokens: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export interface ObservabilityTotals {
  requests: number;
  errors: number;
  latency_p50: number | null;
  latency_p95: number | null;
  latency_p99: number | null;
  total_cost: number | null;
  total_tokens: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
}

export interface ObservabilityDeltas {
  requests_delta: number | null;
  latency_delta: number | null;
  errors_delta: number | null;
  cost_delta: number | null;
}

export interface TopGroupItem {
  key: string;
  requests: number;
  errors: number;
  total_cost: number | null;
  total_tokens: number | null;
}

export interface ObservabilityMetricsResponse {
  degraded: boolean;
  range: { from: string; to: string };
  granularity: Granularity;
  group_by: GroupByDimension;
  buckets: ObservabilityBucket[];
  totals: ObservabilityTotals;
  deltas: ObservabilityDeltas;
  top_groups: TopGroupItem[];
}

export type MetricTab = 'throughput' | 'latency' | 'errors' | 'cost' | 'tokens';
