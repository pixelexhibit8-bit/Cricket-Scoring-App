const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const projectRef = 'gwgshbwxqhcwgkpaykin';
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.argv[2];

if (!dbPassword) {
  console.error('ERROR: Please provide database password as argument or set SUPABASE_DB_PASSWORD in .env');
  process.exit(1);
}

// Supabase PostgreSQL Connection Pooler / Direct Host
const connectionStrings = [
  // 1. Transaction Pooler (port 6543)
  `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  // 2. Session Pooler (port 5432)
  `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  // 3. Direct DB host (port 5432)
  `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`
];

async function run() {
  const sqlPath = path.join(__dirname, 'cricflow_industry_schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  let client = null;
  let connected = false;

  for (const connStr of connectionStrings) {
    try {
      console.log('Attempting connection to Supabase PostgreSQL...');
      client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();
      connected = true;
      console.log('Connected successfully!');
      break;
    } catch (err) {
      console.warn('Connection failed, trying alternative pooler host...', err.message);
      if (client) await client.end().catch(() => {});
    }
  }

  if (!connected) {
    console.error('CRITICAL: Could not connect to Supabase PostgreSQL. Check password.');
    process.exit(1);
  }

  try {
    console.log('Executing cricflow_industry_schema.sql...');
    await client.query(sqlContent);
    console.log('ALL 9 INDUSTRY TABLES, INDEXES, POLICIES & REALTIME CREATED SUCCESSFULLY!');

    // Verification
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\nVerified Public Tables in Supabase:');
    res.rows.forEach(r => console.log(' - ' + r.table_name));

  } catch (sqlErr) {
    console.error('SQL Execution Error:', sqlErr);
  } finally {
    await client.end();
  }
}

run();
