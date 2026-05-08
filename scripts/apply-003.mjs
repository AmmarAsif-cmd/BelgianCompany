/**
 * Applies supabase/003_stores_anon_select_login.sql using the Supabase CLI.
 * Requires DATABASE_URL in the environment or in .env.local (non-public DB URI from Supabase dashboard).
 */
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const envPath = join(root, '.env.local')

let dbUrl = process.env.DATABASE_URL

if (!dbUrl && existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.*)$/)
    if (m) {
      dbUrl = m[1].trim().replace(/^["']|["']$/g, '')
      break
    }
  }
}

if (!dbUrl) {
  console.error(`
Missing DATABASE_URL.

1. Supabase Dashboard → Project Settings → Database
2. Under "Connection string", choose URI and copy the Postgres URL (includes password).
3. Add to .env.local:
   DATABASE_URL=postgresql://postgres.[ref]:YOUR_PASSWORD@...

   If your password has special characters, use percent-encoding in the URL.

4. Run: npm run db:apply-003
`)
  process.exit(1)
}

const sqlFile = join(root, 'supabase', '003_stores_anon_select_login.sql')
const result = spawnSync(
  'npx',
  ['--yes', 'supabase@latest', 'db', 'query', '-f', sqlFile, '--db-url', dbUrl],
  { cwd: root, stdio: 'inherit', shell: true }
)

process.exit(result.status ?? 1)
