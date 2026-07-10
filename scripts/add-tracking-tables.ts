import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('Creating tracking_integrations table...')
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tracking_integrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      provider text NOT NULL,
      identifier text,
      custom_code text,
      placement text NOT NULL DEFAULT 'body_end',
      environment text NOT NULL DEFAULT 'production',
      consent_category text NOT NULL DEFAULT 'marketing',
      route_scope jsonb,
      is_active boolean NOT NULL DEFAULT false,
      starts_at timestamptz,
      ends_at timestamptz,
      created_by_id uuid REFERENCES profiles(id),
      updated_by_id uuid REFERENCES profiles(id),
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )
  `)

  console.log('Creating tracking_integration_versions table...')
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS tracking_integration_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      integration_id uuid NOT NULL REFERENCES tracking_integrations(id) ON DELETE CASCADE,
      version integer NOT NULL,
      snapshot jsonb NOT NULL,
      created_by_id uuid REFERENCES profiles(id),
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS tracking_integrations_active_idx ON tracking_integrations (is_active)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS tracking_integration_versions_integration_idx ON tracking_integration_versions (integration_id)`)

  console.log('Tracking tables migration complete.')
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1) })
