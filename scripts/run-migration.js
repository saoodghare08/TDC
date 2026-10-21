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
        const sql = fs.readFileSync('supabase/migrations/20261021000000_create_recipes_table.sql', 'utf8');
        await client.query(sql);
        console.log('Migration executed successfully! Recipes table and seed data created.');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await client.end();
    }
}

run();
