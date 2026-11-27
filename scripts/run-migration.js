const fs = require('fs');
const { Client } = require('pg');

const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of envLines) {
    const idx = line.indexOf('=');
    if (idx !== -1) {
        const k = line.slice(0, idx).trim();
        let v = line.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
        }
        env[k] = v;
    }
}

let connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL;
if (connectionString) {
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
}

async function run() {
    console.log('Connecting to database via connection string...');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Postgres successfully!');
        const migrationPath =
            process.argv[2] ||
            'supabase/migrations/20261117000000_create_client_plans_and_invoices.sql';
        console.log(`Executing migration: ${migrationPath}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(sql);
        console.log(`Migration executed successfully: ${migrationPath}`);

        const check = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('clients', 'client_diet_plans', 'client_invoices', 'admin_push_subscriptions', 'admin_notification_logs')
            ORDER BY table_name;
        `);
        console.log(
            'Verified tables:',
            check.rows.map((r) => r.table_name).join(', ')
        );
    } catch (err) {
        console.error('Migration error:', err);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

run();
