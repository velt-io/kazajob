/**
 * KAZAJOB — One-shot : fixe la date de fin de la campagne KazaLaunch à 6 mois.
 * Lancement : npx tsx --env-file=.env.local src/lib/db/set-kazalaunch-endsAt.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

async function run() {
  const rows = await sql.query(
    `UPDATE launch_campaigns
        SET ends_at = NOW() + INTERVAL '6 months',
            state   = 'active'
      WHERE slug = 'kazalaunch'
      RETURNING id, name, state, ends_at`,
  )
  if (rows.length === 0) {
    console.log('⚠️  Aucune campagne "kazalaunch" trouvée.')
  } else {
    console.log('✅ Campagne mise à jour :', JSON.stringify(rows[0]))
  }
}

run().catch((e) => { console.error('❌', e); process.exit(1) })
