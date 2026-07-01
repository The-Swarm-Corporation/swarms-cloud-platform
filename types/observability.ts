export type TimeRange = '15m' | '1h' | '24h' | '7d' | '30d' | 'custom';
export type Granularity = '1m' | '5m' | '15m' | '1h' | '1d';
export type GroupBy = 'none' | 'agent' | 'model' | 'endpoint' | 'swarm_type';
export type ChartTab = 'throughput' | 'latency' | 'errors' | 'cost' | 'tokens';

export interface MetricBucket {
  ts: string; requests: number; errors: number;
  latency_p50: number | null; latency_p95: number | null; latency_p99: number | null;
  total_cost: number; input_tokens: number; output_tokens: number;
}

export interface TopGroup { key: string; requests: number; errors: number; total_cost: number; latency_p99: number | null; }
export interface MetricsTotals {
  requests: number; errors: number;
  latency_p50: number | null; latency_p95: number | null; latency_p99: number | null;
  total_cost: number; input_tokens: number; output_tokens: number;
  rate_limit_events: number;
  top_errors: Array<{ message: string; count: number }>;
}
export interface MetricsResponse { buckets: MetricBucket[]; totals: MetricsTotals; top_groups: TopGroup[]; degraded: boolean; }

export const GRANULARITY_MAP: Record<TimeRange, Granularity> = { '15m': '1m', '1h': '5m', '24h': '1h', '7d': '1h', '30d': '1d', 'custom': '1h' };
export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [{ value: '1m', label: '1m' }, { value: '5m', label: '5m' }, { value: '15m', label: '15m' }, { value: '1h', label: '1h' }, { value: '1d', label: '1d' }];
export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [{ value: 'none', label: 'None' }, { value: 'agent', label: 'Agent' }, { value: 'model', label: 'Model' }, { value: 'endpoint', label: 'Endpoint' }, { value: 'swarm_type', label: 'Swarm type' }];
export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [{ value: '15m', label: 'Last 15m' }, { value: '1h', label: 'Last 1h' }, { value: '24h', label: 'Last 24h' }, { value: '7d', label: 'Last 7d' }, { value: '30d', label: 'Last 30d' }, { value: 'custom', label: 'Custom' }];
export const RANGE_LABELS: Record<TimeRange, string> = { '15m': 'Last 15m', '1h': 'Last 1h', '24h': 'Last 24h', '7d': 'Last 7d', '30d': 'Last 30d', 'custom': 'Custom' };
