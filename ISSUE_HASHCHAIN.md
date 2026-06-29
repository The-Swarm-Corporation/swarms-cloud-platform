# Future Enhancement: Tamper-Evidence via Hash Chain

## Issue Reference
Part of [#11 Audit log page for account, workspace, and billing activity](https://github.com/The-Swarm-Corporation/swarms-cloud-platform/issues/11)

## Overview
Implement hash-chain tamper-evidence for the `audit_events` table to detect any unauthorized modifications to audit records.

## Proposed Implementation

### Database Changes

1. Add `prev_row_hash` column to `audit_events`:
```sql
ALTER TABLE public.audit_events
ADD COLUMN prev_row_hash text;
```

2. Add computed `row_hash` column or compute it on insert:
```sql
-- Each row's hash = sha256(prev_row_hash || row_payload)
-- row_payload = org_id || actor_user_id || actor_kind || action || target_kind || target_id || metadata || created_at
```

### Write Path Changes

When inserting a new audit event:
1. Query the last inserted row for the same `org_id` to get its `row_hash`
2. Compute `prev_row_hash = last_row.row_hash`
3. Compute `row_hash = sha256(prev_row_hash || payload_json)`
4. Insert with both values populated

### Verification Path

Add a verification function that:
1. Retrieves all rows for an org ordered by `created_at`
2. Verifies each row's `row_hash` matches `sha256(prev_row_hash || payload)`
3. Returns `{ valid: boolean, broken_at: string | null }`

### Export Changes

On CSV export, include `row_hash` and `prev_row_hash` columns so auditors can verify the chain independently.

## Status
Not yet implemented — reserved for post-v1 SOC 2 compliance work.
