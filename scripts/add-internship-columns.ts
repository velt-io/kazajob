import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('Adding internship columns to jobs table...')

  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internship_duration text`)
  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internship_paid boolean`)
  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internship_compensation text`)
  await db.execute(sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internship_agreement_required boolean NOT NULL DEFAULT true`)

  console.log('✅ Internship columns added.')

  // Add unique constraint on launch_campaign_enrollments if not exists
  await db.execute(sql`
    ALTER TABLE launch_campaign_enrollments
    ADD CONSTRAINT IF NOT EXISTS launch_campaign_enrollments_company_id_campaign_id_unique
    UNIQUE (company_id, campaign_id)
  `)
  console.log('✅ Unique constraint on enrollments ensured.')
}

main().catch((err) => { console.error(err); process.exit(1) })
