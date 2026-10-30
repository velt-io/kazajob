/**
 * KAZAJOB — Migration additive « cycle de vie des offres » (idempotente, relançable).
 *
 * Ajoute à jobs : status, published_at, expires_at (+ index).
 * Attention : en base, la date de création de jobs s'appelle "createdAt" (camelCase).
 * Reprise des données existantes :
 *   - offre active   → status 'published', expire au plus tôt dans 30 jours
 *     (aucune offre en ligne ne disparaît le jour du déploiement) ;
 *   - offre inactive → status 'paused'.
 * La dernière instruction resynchronise status/is_active : à relancer sans risque
 * après le déploiement si l'ancien code a modifié des offres entre-temps.
 *
 * Lancement : npm run db:migrate:job-lifecycle
 * Rollback   : voir migrate-job-lifecycle-down.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS published_at timestamptz`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at timestamptz`,
  `CREATE INDEX IF NOT EXISTS jobs_status_expires_idx ON jobs (status, expires_at)`,

  // Offres inactives existantes → en pause (le DEFAULT les a marquées 'published').
  `UPDATE jobs SET status = 'paused' WHERE is_active = false AND status = 'published'`,

  // Offres actives sans échéance → date de publication + échéance (≥ 30 jours à partir d'aujourd'hui).
  `UPDATE jobs
      SET published_at = COALESCE(published_at, "createdAt"),
          expires_at   = GREATEST("createdAt" + interval '60 days', now() + interval '30 days')
    WHERE status = 'published' AND expires_at IS NULL`,

  // Resynchronisation (idempotente) : une offre réactivée par l'ancien code redevient 'published'.
  `UPDATE jobs
      SET status = 'published',
          published_at = COALESCE(published_at, now()),
          expires_at = COALESCE(expires_at, now() + interval '60 days')
    WHERE is_active = true AND status <> 'published'`,
  `UPDATE jobs SET status = 'paused' WHERE is_active = false AND status = 'published'`,
]

async function run() {
  console.log(`▶ Migration job-lifecycle — ${STATEMENTS.length} instructions`)
  for (const stmt of STATEMENTS) {
    console.log(' ·', stmt.replace(/\s+/g, ' ').slice(0, 90))
    await sql.query(stmt)
  }
  const rows = await sql.query(`SELECT status, count(*)::int AS n FROM jobs GROUP BY status ORDER BY status`)
  console.table(rows)
  console.log('✅ Migration terminée')
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
