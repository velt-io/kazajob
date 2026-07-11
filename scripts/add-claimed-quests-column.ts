import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('Adding claimed_quests column to profiles table...')
  await db.execute(sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS claimed_quests text[]`)
  console.log('Done.')
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1) })
