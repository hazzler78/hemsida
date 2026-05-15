#!/usr/bin/env node
/**
 * Granskar spårdata i Supabase (senaste 30 dagar).
 * Kör: node scripts/audit-tracking.mjs
 * Kräver NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY i .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env.local', '.env']) {
  const path = join(root, name);
  if (!existsSync(path)) continue;
  readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const eq = t.indexOf('=');
      if (eq <= 0) return;
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[t.slice(0, eq).trim()] = v;
    });
  break;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Saknar Supabase URL/nyckel i .env.local');
  process.exit(1);
}

const supabase = createClient(url.trim(), key.trim());
const from = new Date();
from.setDate(from.getDate() - 30);
const fromISO = from.toISOString();

function pct(n, d) {
  if (!d) return '—';
  return `${((n / d) * 100).toFixed(1)}%`;
}

function withSession(rows) {
  return rows.filter((r) => r.session_id && String(r.session_id).length > 0).length;
}

async function fetchAll(table, select, extra = (q) => q) {
  const pageSize = 1000;
  let offset = 0;
  const all = [];
  for (;;) {
    let q = supabase.from(table).select(select).gte('created_at', fromISO).range(offset, offset + pageSize - 1);
    q = extra(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function main() {
  console.log(`\n=== Spårningsaudit (sedan ${fromISO.slice(0, 10)}) ===\n`);

  const pageViews = await fetchAll('page_views', 'path,session_id,is_bot,is_preview,created_at');
  const heroImp = await fetchAll('hero_impressions', 'variant,session_id,created_at');
  const heroClk = await fetchAll('hero_clicks', 'target,session_id,created_at');
  const affiliate = await fetchAll('affiliate_clicks', 'contract_type,session_id,created_at');

  const home = pageViews.filter((p) => p.path === '/' && !p.is_bot && p.is_preview !== true);
  const rorligtV2 = pageViews.filter((p) => p.path === '/rorligt-avtal-v2' && !p.is_bot);
  const rorligtOld = pageViews.filter((p) => p.path === '/rorligt-avtal' && !p.is_bot);
  const bots = pageViews.filter((p) => p.is_bot === true).length;

  console.log('PAGE VIEWS');
  console.log(`  Totalt (30d):     ${pageViews.length}`);
  console.log(`  Botar:            ${bots} (${pct(bots, pageViews.length)})`);
  console.log(`  Startsida /:      ${home.length} (session ifylld: ${withSession(home)}/${home.length})`);
  console.log(`  /rorligt-avtal-v2: ${rorligtV2.length}`);
  console.log(`  /rorligt-avtal:   ${rorligtOld.length}`);

  console.log('\nHERO');
  console.log(`  Impressions:      ${heroImp.length} (session: ${withSession(heroImp)}/${heroImp.length})`);
  console.log(`  Clicks:           ${heroClk.length} (session: ${withSession(heroClk)}/${heroClk.length})`);
  console.log(`  CTR (clk/imp):    ${pct(heroClk.length, heroImp.length)}  ← kan bli >100% (olika dedupe)`);
  console.log(`  Klick vs startsida: ${pct(heroClk.length, home.length)}`);

  const affRorligt = affiliate.filter((a) => a.contract_type === 'rorligt');
  console.log('\nAFFILIATE');
  console.log(`  Rörligt klick:    ${affRorligt.length} (session: ${withSession(affRorligt)}/${affRorligt.length})`);

  console.log('\nFUNNEL (volym, 30d)');
  console.log(`  1 Startsida       ${home.length}`);
  console.log(`  2 Hero-klick      ${heroClk.length}  (${pct(heroClk.length, home.length)} av steg 1)`);
  console.log(`  3 Avtalssida      ${rorligtV2.length + rorligtOld.length}  (${pct(rorligtV2.length + rorligtOld.length, heroClk.length)} av steg 2)`);
  console.log(`  4 Affiliate       ${affRorligt.length}  (${pct(affRorligt.length, rorligtV2.length + rorligtOld.length)} av steg 3)`);

  // Session overlap (only rows with session_id)
  const homeSessions = new Set(home.map((p) => p.session_id).filter(Boolean));
  const heroClkSessions = new Set(heroClk.map((p) => p.session_id).filter(Boolean));
  const contractSessions = new Set(
    [...rorligtV2, ...rorligtOld].map((p) => p.session_id).filter(Boolean)
  );
  const affSessions = new Set(affRorligt.map((p) => p.session_id).filter(Boolean));

  let homeToHero = 0;
  for (const s of homeSessions) if (heroClkSessions.has(s)) homeToHero++;

  let heroToContract = 0;
  for (const s of heroClkSessions) if (contractSessions.has(s)) heroToContract++;

  let contractToAff = 0;
  for (const s of contractSessions) if (affSessions.has(s)) contractToAff++;

  console.log('\nSESSION-KOPPLING (samma session_id i localStorage – se varning om split keys)');
  console.log(`  Unika session / startsida:     ${homeSessions.size}`);
  console.log(`  Davar hero-klick (ej tom sid): ${heroClkSessions.size}`);
  console.log(`  Davar avtalssida:              ${contractSessions.size}`);
  console.log(`  Davar affiliate:               ${affSessions.size}`);
  console.log(`  Home → hero (samma session):   ${homeToHero} (${pct(homeToHero, homeSessions.size)})`);
  console.log(`  Hero → avtal (samma session):  ${heroToContract} (${pct(heroToContract, heroClkSessions.size)})`);
  console.log(`  Avtal → affiliate:             ${contractToAff} (${pct(contractToAff, contractSessions.size)})`);

  const emptyHeroSession = heroClk.filter((c) => !c.session_id).length;
  const emptyHomeSession = home.filter((p) => !p.session_id).length;
  if (emptyHeroSession > heroClk.length * 0.1 || emptyHomeSession > home.length * 0.1) {
    console.log('\n⚠️  Många rader utan session_id – session-baserad funnel blir opålitlig.');
  }

  const topPaths = new Map();
  pageViews
    .filter((p) => !p.is_bot)
    .forEach((p) => {
      const path = p.path || '(null)';
      topPaths.set(path, (topPaths.get(path) || 0) + 1);
    });
  console.log('\nTOP 10 PATHS (exkl. botar)');
  [...topPaths.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([path, n]) => console.log(`  ${n.toString().padStart(6)}  ${path}`));

  const nullPaths = pageViews.filter((p) => p.path == null);
  if (nullPaths.length) {
    const sorted = [...nullPaths].sort((a, b) => a.created_at.localeCompare(b.created_at));
    console.log('\n⚠️  PAGE_VIEWS UTAN PATH:', nullPaths.length);
    console.log(`  Äldsta: ${sorted[0].created_at}`);
    console.log(`  Senaste: ${sorted[sorted.length - 1].created_at}`);
    console.log('  Trolig orsak: äldre tracking eller felaktig payload – filtrera bort i dashboard.');
  }

  const heroTargets = new Map();
  heroClk.forEach((c) => {
    const t = c.target || '(saknas)';
    heroTargets.set(t, (heroTargets.get(t) || 0) + 1);
  });
  if (heroTargets.size) {
    console.log('\nHERO-KLICK per target:');
    [...heroTargets.entries()].forEach(([t, n]) => console.log(`  ${n}  ${t}`));
  }

  const heroWithSession = withSession(heroClk);
  const affWithSession = withSession(affRorligt);
  if (heroWithSession === 0 && heroClk.length > 50) {
    console.log('\n⚠️  Hero/affiliate saknar session_id i DB – efter deploy ska getOrCreateSessionId fylla detta.');
  } else if (heroWithSession > 0) {
    console.log(`\n✓  Hero-klick med session_id: ${heroWithSession}/${heroClk.length}`);
  }

  console.log('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
