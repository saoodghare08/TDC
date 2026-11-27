const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const webpush = require('web-push');

const envPath = path.join(process.cwd(), '.env.local');
const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

const existingKeys = new Set();
let adminEmail = 'admin@thedietcascade.com';

for (const line of existingContent.split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx !== -1 && !line.trim().startsWith('#')) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        existingKeys.add(key);
        if (key === 'NEXT_PUBLIC_ADMIN_EMAIL' && val) {
            adminEmail = val;
        }
    }
}

const additions = [];

if (!existingKeys.has('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || !existingKeys.has('VAPID_PRIVATE_KEY')) {
    const vapidKeys = webpush.generateVAPIDKeys();
    if (!existingKeys.has('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
        additions.push(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
    }
    if (!existingKeys.has('VAPID_PRIVATE_KEY')) {
        additions.push(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
    }
}

if (!existingKeys.has('VAPID_SUBJECT')) {
    additions.push(`VAPID_SUBJECT="mailto:${adminEmail}"`);
}

if (!existingKeys.has('CRON_SECRET')) {
    const cronSecret = crypto.randomBytes(24).toString('hex');
    additions.push(`CRON_SECRET="${cronSecret}"`);
}

if (additions.length > 0) {
    const prefix = existingContent.endsWith('\n') || existingContent.length === 0 ? '' : '\n';
    const block = `${prefix}\n# Web Push (VAPID) & Scheduled Cron Secrets\n${additions.join('\n')}\n`;
    fs.appendFileSync(envPath, block, 'utf8');
    console.log(`Added ${additions.length} Web Push / Cron env variable(s) to .env.local.`);
} else {
    console.log('All Web Push & Cron env variables already exist in .env.local.');
}
