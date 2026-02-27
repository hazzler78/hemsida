#!/usr/bin/env node
/**
 * Hämtar chatlog från Supabase och skriver ut till stdout.
 * Kör: node scripts/fetch-chatlog.mjs
 * Kräver: SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY i .env eller .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Ladda .env eller .env.local (sök i projekt-rot)
for (const name of ['.env.local', '.env']) {
  const path = join(rootDir, name);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    });
    break;
  }
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(JSON.stringify({ error: 'Saknar SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY i .env/.env.local' }));
  process.exit(1);
}

const supabase = createClient(url.trim().replace(/^"|"$/g, ''), key.trim().replace(/^"|"$/g, ''));

const days = parseInt(process.argv[2] || '60', 10);
const from = new Date();
from.setDate(from.getDate() - days);
const fromISO = from.toISOString();

const { data, error } = await supabase
  .from('chatlog')
  .select('id, created_at, session_id, messages')
  .gte('created_at', fromISO)
  .order('created_at', { ascending: false })
  .limit(500);

if (error) {
  console.error(JSON.stringify({ error: error.message }));
  process.exit(1);
}

console.log(JSON.stringify({ count: data?.length ?? 0, rows: data ?? [] }, null, 2));
