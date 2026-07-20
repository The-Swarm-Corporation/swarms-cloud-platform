import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Playwright global setup. Loads `.env` into `process.env` so test
 * workers see `SWARMS_API_KEY`. Workers are forked from the main
 * process AFTER global setup runs, so they inherit the mutated env.
 */
function loadDotEnv(filename: string): number {
  const path = join(process.cwd(), filename);
  if (!existsSync(path)) return 0;
  let count = 0;
  for (const rawLine of readFileSync(path, 'utf-8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    // Treat empty values as "not set" so an unfilled placeholder doesn't
    // shadow a real shell env value.
    if (value.length === 0) continue;

    const existing = process.env[key];
    if (existing !== undefined && existing.length > 0) continue;
    process.env[key] = value;
    count += 1;
  }
  return count;
}

export default async function globalSetup() {
  // Real shell env wins; .env fills in the gaps.
  const baseCount = loadDotEnv('.env');
  const hasKey = !!process.env.SWARMS_API_KEY;
  console.log(
    `[playwright] env loaded - .env: ${baseCount}, SWARMS_API_KEY: ${
      hasKey ? 'present' : 'missing'
    }`
  );
}
