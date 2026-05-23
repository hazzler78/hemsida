#!/usr/bin/env node
/**
 * Lägger till Elify/invändnings-kunskap i Supabase ai_knowledge.
 * Kör: node scripts/seed-elify-knowledge.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

for (const name of ['.env.local', '.env']) {
  const path = join(rootDir, name);
  if (existsSync(path)) {
    readFileSync(path, 'utf8').split(/\r?\n/).forEach((line) => {
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Saknar SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url.trim(), key.trim());

const items = [
  {
    category: 'leverantorer',
    question: 'Vad gäller för Cheap Energy, Stockholms Elbolag och Svealands Elbolag?',
    answer:
      'Alla tre ingår i **Elify Energy Group** (samma koncern). Konsumentombudsmannen har drivit mål mot dem och Patent- och marknadsdomstolen har bl.a. funnit vilseledande marknadsföring kring elpris efter 12 månader. De har också figurerat på Konsumenternas Energimarknadsbyrås klagomålslista. elchef.se samarbetar med dem, men om användaren uttrycker misstro ska vi inte rekommendera dem – föreslå i stället t.ex. Skellefteå Kraft, Tibber eller Greenely.',
    keywords: ['cheap energy', 'stockholms elbolag', 'svealands', 'elify', 'klagomål', 'konsumentverket', 'ko', 'svartlist'],
    active: true,
  },
  {
    category: 'leverantorer',
    question: 'Vad menar folk med att elbolag är svartlistade?',
    answer:
      'Det finns ingen officiell svartlista, men **Konsumenternas Energimarknadsbyrå** publicerar en **klagomålslista** med elbolag som fått ovanligt många klagomål i relation till antal kunder. Cheap Energy, Stockholms Elbolag och Svealands Elbolag har både klagomål och domstolsärenden kopplade till sig. Avfärda inte kundens invändning – erkänn vad som stämmer.',
    keywords: ['svartlist', 'klagomålslist', 'energimarknadsbyrån', 'klagomål', 'varning'],
    active: true,
  },
  {
    category: 'leverantorer',
    question: 'Vad är förhållandet mellan Enkla Elbolaget och Elify Group?',
    answer:
      '**Enkla Elbolaget i Sverige AB** tillhör **Dalakraft AB** – det ingår **inte** i Elify Energy Group. Koppla aldrig ihop dem utan verifierad källa. Elify-koncernen driver bl.a. Cheap Energy, Stockholms Elbolag och Svealands Elbolag.',
    keywords: ['enkla elbolaget', 'elify', 'dalakraft', 'ägare', 'koncern'],
    active: true,
  },
  {
    category: 'priser',
    question: 'Vad är rimlig elkostnad för en liten lägenhet?',
    answer:
      'För en liten lägenhet (t.ex. 40 kvm) med **bara hushållsel** (ej eluppvärmning) brukar elhandelskostnaden ofta ligga runt några hundralappar per månad – exakt nivå beror på förbrukning och avtal. **2 000+ kr/mån** enbart för hushållsel i en sådan lägenhet låter orimligt högt och kan tyda på höga påslag, fel avtal eller att andra kostnader råkat ingå.',
    keywords: ['dyrt', 'hög räkning', '2400', 'liten lägenhet', '40 kvm', 'hushållsel', 'för mycket'],
    active: true,
  },
];

for (const item of items) {
  const { error: deactivateError } = await supabase
    .from('ai_knowledge')
    .update({ active: false })
    .eq('question', item.question);

  if (deactivateError) {
    console.error('Deactivate error:', deactivateError.message);
    process.exit(1);
  }
}

const { data, error } = await supabase.from('ai_knowledge').insert(items).select('id, question');

if (error) {
  console.error('Insert error:', error.message);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, inserted: data }, null, 2));
