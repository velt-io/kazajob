/**
 * KAZAJOB — Migration additive « anti-abus authentification » (idempotente).
 *
 * Crée auth_rate_limits : compteurs de tentatives (connexion, inscription,
 * mot de passe oublié) utilisés par src/lib/rate-limit.ts. Les clés sont des
 * empreintes SHA-256 : aucune adresse email ni IP en clair.
 * Tant que la table n'existe pas, l'anti-abus laisse tout passer (fail-open).
 *
 * Lancement : npm run db:migrate:auth-rate-limits
 * Rollback   : DROP TABLE IF EXISTS auth_rate_limits;
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS auth_rate_limits (
     key          text PRIMARY KEY,
     count        integer NOT NULL DEFAULT 1,
     window_start timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS auth_rate_limits_window_idx ON auth_rate_limits (window_start)`,
]

async function run() {
  console.log(`▶ Migration auth-rate-limits — ${STATEMENTS.length} instructions`)
  for (const stmt of STATEMENTS) {
    console.log(' ·', stmt.replace(/\s+/g, ' ').slice(0, 90))
    await sql.query(stmt)
  }
  console.log('✅ Migration terminée')
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
