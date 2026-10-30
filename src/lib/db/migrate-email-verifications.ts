/**
 * KAZAJOB — Migration additive « vérification de l'email » (idempotente).
 *
 * Crée email_verifications. Les comptes existants n'y ont pas de ligne et
 * restent donc considérés comme vérifiés : aucun utilisateur actuel n'est gêné.
 * Tant que la table n'existe pas, tout compte est considéré vérifié (fail-open).
 *
 * Lancement : npm run db:migrate:email-verifications
 * Rollback   : DROP TABLE IF EXISTS email_verifications;
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS email_verifications (
     user_id     uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
     verified_at timestamptz,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
]

async function run() {
  console.log(`▶ Migration email-verifications — ${STATEMENTS.length} instruction(s)`)
  for (const stmt of STATEMENTS) {
    console.log(' ·', stmt.replace(/\s+/g, ' ').slice(0, 90))
    await sql.query(stmt)
  }
  console.log('✅ Migration terminée')
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
