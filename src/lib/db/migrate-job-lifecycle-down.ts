/**
 * KAZAJOB — Rollback de la migration « cycle de vie des offres ».
 * is_active reste la source de vérité de la visibilité : rien n'est perdu côté public.
 *
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-job-lifecycle-down.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `DROP INDEX IF EXISTS jobs_status_expires_idx`,
  `ALTER TABLE jobs DROP COLUMN IF EXISTS expires_at`,
  `ALTER TABLE jobs DROP COLUMN IF EXISTS published_at`,
  `ALTER TABLE jobs DROP COLUMN IF EXISTS status`,
]

async function run() {
  for (const stmt of STATEMENTS) {
    console.log(' ·', stmt)
    await sql.query(stmt)
  }
  console.log('✅ Rollback terminé')
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
