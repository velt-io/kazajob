/**
 * KAZAJOB — Rollback migration « billing-overrides ».
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-billing-overrides-down.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS admin_override_enabled`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS override_max_active_jobs`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS override_reason`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS override_until`,
  `ALTER TABLE jobs DROP COLUMN IF EXISTS billing_origin`,
]

async function run() {
  console.log(`▶ Rollback billing-overrides — ${STATEMENTS.length} instructions`)
  for (const stmt of STATEMENTS) {
    console.log(' ·', stmt.slice(0, 80))
    await sql.query(stmt)
  }
  console.log('✅ Rollback terminé')
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
