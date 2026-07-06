/**
 * KAZAJOB — Migration additive « billing-overrides » (idempotente).
 *
 * Ajoute :
 *   - company_subscriptions : colonnes de dérogation admin (override)
 *   - jobs : colonne billing_origin pour tracer la source d'une annonce
 *
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-billing-overrides.ts
 * Rollback   : voir migrate-billing-overrides-down.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  // company_subscriptions — dérogations admin
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS admin_override_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS override_max_active_jobs integer`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS override_reason text`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS override_until timestamptz`,

  // jobs — traçabilité facturation
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS billing_origin text NOT NULL DEFAULT 'normal'`,
]

async function run() {
  console.log(`▶ Migration billing-overrides — ${STATEMENTS.length} instructions`)
  for (const stmt of STATEMENTS) {
    console.log(' ·', stmt.slice(0, 80))
    await sql.query(stmt)
  }
  console.log('✅ Migration terminée')
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
