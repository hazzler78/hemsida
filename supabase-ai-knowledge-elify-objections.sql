-- Kunskapsartiklar för Grodan: Elify-koncernen, klagomål och invändningar
-- Kör i Supabase SQL Editor (projekt tptwyuywgchxcjxybmya)
-- Säker att köra flera gånger: inaktiverar gamla poster med samma fråga först

UPDATE ai_knowledge
SET active = false
WHERE question IN (
  'Vad gäller för Cheap Energy, Stockholms Elbolag och Svealands Elbolag?',
  'Vad menar folk med att elbolag är svartlistade?',
  'Vad är förhållandet mellan Enkla Elbolaget och Elify Group?',
  'Vad är rimlig elkostnad för en liten lägenhet?'
);

INSERT INTO ai_knowledge (category, question, answer, keywords, active) VALUES
(
  'leverantorer',
  'Vad gäller för Cheap Energy, Stockholms Elbolag och Svealands Elbolag?',
  'Alla tre ingår i **Elify Energy Group** (samma koncern). Konsumentombudsmannen har drivit mål mot dem och Patent- och marknadsdomstolen har bl.a. funnit vilseledande marknadsföring kring elpris efter 12 månader. De har också figurerat på Konsumenternas Energimarknadsbyrås klagomålslista. elchef.se samarbetar med dem, men om användaren uttrycker misstro ska vi inte rekommendera dem – föreslå i stället t.ex. Skellefteå Kraft, Tibber eller Greenely.',
  ARRAY['cheap energy', 'stockholms elbolag', 'svealands', 'elify', 'klagomål', 'konsumentverket', 'ko', 'svartlist'],
  true
),
(
  'leverantorer',
  'Vad menar folk med att elbolag är svartlistade?',
  'Det finns ingen officiell svartlista, men **Konsumenternas Energimarknadsbyrå** publicerar en **klagomålslista** med elbolag som fått ovanligt många klagomål i relation till antal kunder. Cheap Energy, Stockholms Elbolag och Svealands Elbolag har både klagomål och domstolsärenden kopplade till sig. Avfärda inte kundens invändning – erkänn vad som stämmer.',
  ARRAY['svartlist', 'klagomålslist', 'energimarknadsbyrån', 'klagomål', 'varning'],
  true
),
(
  'leverantorer',
  'Vad är förhållandet mellan Enkla Elbolaget och Elify Group?',
  '**Enkla Elbolaget i Sverige AB** tillhör **Dalakraft AB** – det ingår **inte** i Elify Energy Group. Koppla aldrig ihop dem utan verifierad källa. Elify-koncernen driver bl.a. Cheap Energy, Stockholms Elbolag och Svealands Elbolag.',
  ARRAY['enkla elbolaget', 'elify', 'dalakraft', 'ägare', 'koncern'],
  true
),
(
  'priser',
  'Vad är rimlig elkostnad för en liten lägenhet?',
  'För en liten lägenhet (t.ex. 40 kvm) med **bara hushållsel** (ej eluppvärmning) brukar elhandelskostnaden ofta ligga runt några hundralappar per månad – exakt nivå beror på förbrukning och avtal. **2 000+ kr/mån** enbart för hushållsel i en sådan lägenhet låter orimligt högt och kan tyda på höga påslag, fel avtal eller att andra kostnader råkat ingå.',
  ARRAY['dyrt', 'hög räkning', '2400', 'liten lägenhet', '40 kvm', 'hushållsel', 'för mycket'],
  true
);
