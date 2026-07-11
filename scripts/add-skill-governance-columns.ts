import { db } from '../src/lib/db'
import { sql } from 'drizzle-orm'
import { normalizeSkillName } from '../src/lib/skills'

async function main() {
  console.log('Adding skill governance columns to skills table...')

  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS normalized_name text`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin'`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS created_by_id uuid REFERENCES profiles(id)`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS merged_into_id uuid REFERENCES skills(id)`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS approved_by_id uuid REFERENCES profiles(id)`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS approved_at timestamptz`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS rejection_reason text`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS aliases text[]`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT now()`)
  await db.execute(sql`ALTER TABLE skills ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now()`)

  console.log('Columns added. Backfilling normalized_name for existing skills...')

  const rows = await db.execute<{ id: string; name: string }>(sql`SELECT id, name FROM skills WHERE normalized_name IS NULL`)
  for (const row of rows.rows as unknown as { id: string; name: string }[]) {
    await db.execute(sql`UPDATE skills SET normalized_name = ${normalizeSkillName(row.name)} WHERE id = ${row.id}`)
  }

  console.log(`Backfilled ${rows.rows.length} rows.`)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS skills_normalized_name_idx ON skills (normalized_name)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS skills_status_idx ON skills (status)`)

  console.log('Skill governance migration complete.')
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1) })
