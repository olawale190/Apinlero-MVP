/**
 * One-shot migration: Create conversation_sessions table with RLS.
 * Uses pg (node-postgres) for DDL support.
 * Self-deletes after successful execution.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { unlink } from 'fs/promises';
import { fileURLToPath } from 'url';

dotenv.config();

// Build Supabase direct connection string from SUPABASE_URL
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
const supabaseUrl = process.env.SUPABASE_URL; // https://xxxx.supabase.co
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in .env');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD in .env');
  console.error('   Add it to your .env: SUPABASE_DB_PASSWORD=your-database-password');
  console.error('   Find it in Supabase Dashboard → Project Settings → Database → Connection string');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Supabase connection pooler (transaction mode for DDL)
const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`;

async function runMigration() {
  console.log('🔄 Connecting to Supabase PostgreSQL...');

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Create table
    console.log('📝 Creating conversation_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_phone TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'IDLE',
        current_order JSONB DEFAULT '[]',
        pending_question TEXT,
        context JSONB,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        expires_at TIMESTAMPTZ DEFAULT now() + interval '2 hours'
      );
    `);
    console.log('✅ Table created');

    // Create index
    console.log('📝 Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_phone ON conversation_sessions(customer_phone);
    `);
    console.log('✅ Index created');

    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    await client.query(`
      ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ RLS enabled');

    // Create policy: only service_role can access (backend-only table)
    console.log('🔒 Creating RLS policy (service_role only)...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'conversation_sessions' AND policyname = 'Service role full access'
        ) THEN
          CREATE POLICY "Service role full access" ON conversation_sessions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        END IF;
      END
      $$;
    `);
    console.log('✅ RLS policy created (service_role only — no anon/public access)');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'conversation_sessions'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Table structure:');
    result.rows.forEach(r => console.log(`   ${r.column_name}: ${r.data_type}`));

    console.log('\n✅ Migration complete!');
    return true;
  } finally {
    await client.end();
  }
}

try {
  const success = await runMigration();
  if (success) {
    const scriptPath = fileURLToPath(import.meta.url);
    await unlink(scriptPath);
    console.log('🧹 Migration script self-deleted.');
  }
} catch (err) {
  console.error('❌ Migration failed:', err.message);
  if (err.message.includes('password authentication failed')) {
    console.error('\n💡 Check your SUPABASE_DB_PASSWORD in .env');
    console.error('   Find it: Supabase Dashboard → Project Settings → Database → Connection string');
  }
  process.exit(1);
}
