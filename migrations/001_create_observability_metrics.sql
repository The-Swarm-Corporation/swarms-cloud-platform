-- Migration: Create observability_metrics rollup table
-- Apply via Supabase dashboard (SQL Editor) or: psql $DATABASE_URL -f migrations/001_create_observability_metrics.sql

-- Main rollup table for observability metrics
CREATE TABLE IF NOT EXISTS observability_metrics (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         text NOT NULL,
  bucket_ts       timestamptz NOT NULL,
  requests        integer NOT NULL DEFAULT 0,
  errors          integer NOT NULL DEFAULT 0,
  latency_p50_ms  float,
  latency_p95_ms  float,
  latency_p99_ms  float,
  input_tokens    bigint DEFAULT 0,
  output_tokens   bigint DEFAULT 0,
  total_cost_usd  float DEFAULT 0,
  agent_name      text,
  model           text,
  endpoint        text,
  swarm_type      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, bucket_ts, agent_name, model, endpoint, swarm_type)
);

-- Index for time-series queries (primary)
CREATE INDEX IF NOT EXISTS idx_om_user_time
  ON observability_metrics(user_id, bucket_ts DESC);

-- Index for group-by agent queries
CREATE INDEX IF NOT EXISTS idx_om_user_agent_time
  ON observability_metrics(user_id, agent_name, bucket_ts DESC)
  WHERE agent_name IS NOT NULL;

-- Index for group-by model queries
CREATE INDEX IF NOT EXISTS idx_om_user_model_time
  ON observability_metrics(user_id, model, bucket_ts DESC)
  WHERE model IS NOT NULL;

-- Index for group-by endpoint queries
CREATE INDEX IF NOT EXISTS idx_om_user_endpoint_time
  ON observability_metrics(user_id, endpoint, bucket_ts DESC)
  WHERE endpoint IS NOT NULL;

-- Index for group-by swarm_type queries
CREATE INDEX IF NOT EXISTS idx_om_user_swarm_type_time
  ON observability_metrics(user_id, swarm_type, bucket_ts DESC)
  WHERE swarm_type IS NOT NULL;

-- Auto-vacuum and analyze
ALTER TABLE observability_metrics SET (
  autovacuum_vacuum_threshold = 50,
  autovacuum_analyze_threshold = 50
);

-- Enable RLS
ALTER TABLE observability_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY IF NOT EXISTS om_users_select ON observability_metrics
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS om_users_insert ON observability_metrics
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS om_users_update ON observability_metrics
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS om_users_delete ON observability_metrics
  FOR DELETE USING (auth.uid()::text = user_id);

COMMENT ON TABLE observability_metrics IS 'Pre-aggregated observability metrics per 1-minute bucket, populated by periodic upsert from /v1/swarm/logs';
