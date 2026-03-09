import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'edge';

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as unknown as number[]);
  }
  // btoa is available in Edge runtime
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const consentRaw = formData.get('consent');
    const consent = typeof consentRaw === 'string' ? consentRaw === 'true' : false;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded or file is not a valid image.' }, { status: 400 });
    }

    // Läs filen som ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type;
    const fileSize = (file as File).size;
    
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(mimeType)) {
      return NextResponse.json({ error: 'Endast PNG och JPG stöds just nu.' }, { status: 400 });
    }

    // Konvertera bilden till base64 (utan Buffer)
    const base64Image = `data:${mimeType};base64,${arrayBufferToBase64(arrayBuffer)}`;
    const imageSha256 = await sha256Hex(arrayBuffer);

    // Step 1: Extract structured data from invoice
    const extractionPrompt = `Du är en expert på svenska elräkningar från ALLA elleverantörer. Din uppgift är att extrahera ALLA kostnader från fakturan och strukturera dem i JSON-format.

VIKTIGT - FLEXIBILITET:
- Du MÅSTE hantera fakturor från ALLA elleverantörer (E.ON, Fortum, Vattenfall, EDF, Göteborg Energi, Stockholm Exergi, m.fl.)
- Olika leverantörer har olika fakturaformat och terminologi - anpassa dig efter varje faktura
- Du MÅSTE alltid svara på svenska, oavsett vilket språk fakturan är på
- Använd endast svenska ord och termer

EXTRAKTIONSREGEL:
Extrahera ALLA kostnader från fakturan och returnera dem som en JSON-array. Varje kostnad ska ha:
- "name": exakt text från fakturan (t.ex. "Fast månadsavgift", "Elavtal årsavgift")
- "amount": belopp i kr från "Totalt"-kolumnen - INTE från "öre/kWh" eller "kr/mån"
- "section": vilken sektion den tillhör ("Elnät" eller "Elhandel")
- "description": kort beskrivning av vad kostnaden är

KRITISKT FÖR DECIMALTEcken:
- Svenska fakturor använder KOMMA som decimaltecken (t.ex. "44,84 kr", "13,80 kr")
- JSON kräver PUNKT som decimaltecken (t.ex. 44.84, 13.80)
- DU MÅSTE konvertera komma till punkt när du skriver amount-värdet i JSON
- Exempel: Om fakturan visar "44,84 kr" → skriv "amount": 44.84 i JSON
- Exempel: Om fakturan visar "13,80 kr" → skriv "amount": 13.80 i JSON
- Exempel: Om fakturan visar "31,20 kr" → skriv "amount": 31.20 i JSON

KRITISKT FÖR BELOPP:
- Läs ALLTID från den sista kolumnen som innehåller slutbeloppet i kr
- Ignorera kolumner med "öre/kWh", "kr/mån", "kr/kWh" - dessa är bara pris per enhet
- Slutbeloppet är det som faktiskt debiteras kunden

EXEMPEL JSON:
[
  {
    "name": "Fast månadsavgift",
    "amount": 31.20,
    "section": "Elhandel",
    "description": "Månatlig fast avgift från elleverantören"
  },
  {
    "name": "Elavtal årsavgift",
    "amount": 44.84,
    "section": "Elhandel", 
    "description": "Årsavgift för elavtalet"
  },
  {
    "name": "Elöverföring",
    "amount": 217.13,
    "section": "Elnät",
    "description": "Nätavgift för elöverföring"
  },
  {
    "name": "Påslag",
    "amount": 13.80,
    "section": "Elhandel",
    "description": "Påslag på elpriset (läs från Totalt-kolumnen, inte från öre/kWh)"
  }
]

VIKTIGT - FLEXIBELT FÖR ALLA LEVERANTÖRER:
- Inkludera ALLA kostnader, även de som inte är "onödiga"
- KRITISKT: Läs ALLTID beloppet från "Totalt"-kolumnen eller den sista kolumnen med belopp
- Läs INTE från "öre/kWh" eller "kr/mån" kolumner - bara slutbeloppet
- KRITISKT: Leta särskilt efter "Elavtal årsavgift" - denna kostnad missas ofta men är viktig
- Var särskilt uppmärksam på "Fast månadsavgift", "Profilpris", "Rörliga kostnader", "Fast påslag", "Påslag"
- Om en kostnad har både års- och månadsbelopp, inkludera månadsbeloppet
- EXTRA VIKTIGT: "Elavtal årsavgift" kan stå som en egen rad eller som del av en längre text - leta efter den överallt
- BELOPPSLÄSNING: För "Påslag" - läs det exakta beloppet som står i "Totalt"-kolumnen, inte från beräkningen

LEVERANTÖRSSPECIFIKA TERMER:
- E.ON: "Elavtal årsavgift", "Fast påslag", "Rörliga kostnader"
- Fortum: "Månadsavgift", "Påslag", "Elcertifikat"
- Vattenfall: "Fast avgift", "Påslag", "Årsavgift"
- EDF: "Abonnemangsavgift", "Påslag", "Serviceavgift"
- Göteborg Energi: "Månadsavgift", "Påslag", "Elcertifikat"
- Stockholm Exergi: "Fast avgift", "Påslag", "Årsavgift"
- Andra leverantörer: Anpassa efter fakturans terminologi

JSON-FORMAT KRITISKT:
- Använd endast dubbla citattecken för strängar
- Inga trailing commas
- Inga kommentarer i JSON
- Perfekt formatering krävs
- Starta direkt med [ och sluta med ]

SLUTLIG PÅMINNELSE:
- Läs belopp från "Totalt"-kolumnen, INTE från "öre/kWh" eller "kr/mån"
- För "Månadsavgift": läs från "Totalt"-kolumnen (t.ex. fakturan visar "55,20 kr"), konvertera till JSON: "amount": 55.20
- För "Påslag": läs från "Totalt"-kolumnen (t.ex. fakturan visar "13,80 kr"), konvertera till JSON: "amount": 13.80
- För "Elavtal årsavgift": läs från "Totalt"-kolumnen (t.ex. fakturan visar "44,84 kr"), konvertera till JSON: "amount": 44.84
- KOMMA på fakturan → PUNKT i JSON - detta är KRITISKT för korrekt parsing

KRITISKT EXEMPEL FÖR FORTUM-FAKTUROR:
På Fortum-fakturor ser du ofta:
- "Påslag: 690 kWh at 2,00 öre/kWh, totaling 13,80 kr"
- Läs ALLTID "13,80 kr" (slutbeloppet), INTE "2,00 öre/kWh" (enhetspriset)
- Konvertera till JSON: "amount": 13.80 (komma → punkt)
- Samma gäller för "Månadsavgift: 1 Mån at 55,20 kr/mån, totaling 55,20 kr"
- Läs ALLTID "55,20 kr" (slutbeloppet), INTE "55,20 kr/mån" (enhetspriset)
- Konvertera till JSON: "amount": 55.20 (komma → punkt)

VIKTIGT - FÖR ALLA LEVERANTÖRER:
- Leta efter ordet "totaling" eller "totalt" följt av beloppet i kr
- Ignorera alltid siffror följda av "öre/kWh", "kr/mån", "kr/kWh"
- Slutbeloppet är det som faktiskt debiteras kunden

EXTRA VIKTIGT FÖR PÅSLAG:
- På alla fakturor: läs från "Totalt"-kolumnen eller sista kolumnen med belopp
- På Fortum-fakturor: "Påslag: 690 kWh at 2,00 öre/kWh, totaling 13,80 kr" - läs "13,80 kr"
- På andra leverantörer: läs från "Totalt"-kolumnen eller sista kolumnen med belopp
- KRITISKT: Läs ALLTID slutbeloppet, INTE enhetspriset (öre/kWh, kr/mån)

Svara ENDAST med JSON-arrayen, inget annat text.`;

    // Step 2: Calculate unnecessary costs from structured data
    const calculationPrompt = `Du är en expert på svenska elräkningar från ALLA elleverantörer. Baserat på den extraherade JSON-datan, identifiera onödiga kostnader och beräkna total besparing.

ORDLISTA - ONÖDIGA KOSTNADER (endast under Elhandel):
- Månadsavgift, Fast månadsavgift, Fast månadsavg., Månadsavg.
- Rörliga kostnader, Rörlig kostnad, Rörliga avgifter, Rörlig avgift
- Fast påslag, Fasta påslag, Fast avgift, Fast avg., Fasta avgifter, Fast kostnad, Fasta kostnader, Påslag, Påslag (alla varianter)
- Fast påslag spot
- Årsavgift, Årsavg., Årskostnad, Elavtal årsavgift, Årsavgift elavtal
- Förvaltat Portfölj Utfall, Förvaltat portfölj utfall
- Bra miljöval, Bra miljöval (Licens Elklart AB)
- Trygg, Trygghetspaket
- Basavgift, Grundavgift, Administrationsavgift, Abonnemangsavgift, Grundpris
- Fakturaavgift, Kundavgift, Elhandelsavgift, Handelsavgift
- Indexavgift
- Grön elavgift, Ursprungsgarantiavgift, Ursprung
- Miljöpaket, Serviceavgift, Leverantörsavgift
- Dröjsmålsränta, Påminnelsesavgift, Priskollen
- Rent vatten, Fossilfri, Fossilfri ingår
- Profilpris, Bundet profilpris

LEVERANTÖRSSPECIFIKA ONÖDIGA KOSTNADER:
- E.ON: "Elavtal årsavgift", "Fast påslag", "Rörliga kostnader"
- Fortum: "Månadsavgift", "Påslag", "Elcertifikat"
- Vattenfall: "Fast avgift", "Påslag", "Årsavgift"
- EDF: "Abonnemangsavgift", "Påslag", "Serviceavgift"
- Göteborg Energi: "Månadsavgift", "Påslag", "Elcertifikat"
- Stockholm Exergi: "Fast avgift", "Påslag", "Årsavgift"
- Andra leverantörer: Identifiera liknande avgifter och påslag

EXKLUDERA (räknas INTE som onödiga):
- Elöverföring, Energiskatt, Medel spotpris, Spotpris, Elpris
- Elcertifikat, Elcertifikatavgift
- Bundet elpris, Fastpris (själva energipriset), Rörligt elpris (själva energipriset)
- Förbrukning, kWh, Öre/kWh, Kr/kWh

INSTRUKTION:
1. Gå igenom JSON-datan och identifiera alla kostnader som matchar ordlistan OCH är under "Elhandel"
2. Summera alla onödiga kostnader
3. Använd beloppen exakt som de står i JSON (om fakturan visar belopp inklusive moms, gör ingen extra 25 % påslag i beräkningen)
4. Presentera resultatet enligt formatet nedan

FORMAT:
🚨 Dina onödiga elavgifter upptäckta!

Jag har hittat [antal] onödiga avgifter på din elräkning som kostar dig pengar varje månad:

💸 Onödiga kostnader denna månad:
1. [Kostnadsnamn]: [belopp] kr
2. [Kostnadsnamn]: [belopp] kr

💰 Din årliga besparing:
Du betalar [total] kr/månad i onödiga avgifter (inklusive moms) = [total × 12] kr/år!

Detta är pengar som går direkt till din elleverantör utan att du får något extra för dem.

✅ Lösningen:
Byt till ett avtal utan dessa avgifter och spara [total × 12] kr/år (inklusive moms)!

🎯 Välj ditt nya avtal:
- Rörligt avtal: 0 kr i avgifter första året – spara [total × 12] kr/år
- Fastpris med prisgaranti: Prisgaranti med valfri bindningstid

⏰ Byt idag – det tar bara 2 minuter och vi fixar allt åt dig!

Svara på svenska och var hjälpsam och pedagogisk.`; // Updated fastpris text

    // Original single-step prompt (fallback)
    const systemPrompt = `Du är en expert på svenska elräkningar som hjälper användare identifiera extra kostnader, dolda avgifter och onödiga tillägg på deras elfakturor. 

VIKTIGT - SPRÅK:
- Du MÅSTE alltid svara på svenska, oavsett vilket språk fakturan är på
- Även om fakturan är på norska, danska eller engelska, svara alltid på svenska
- Använd endast svenska ord och termer
- Ignorera språket i fakturan - analysera innehållet men svara på svenska
- Använd svenska valutaformat (kr, öre) och svenska decimaler (komma istället för punkt)

EXPERTIS:
- Du förstår skillnaden mellan elöverföring (nätavgift) och elhandel (leverantörsavgift)
- Du kan identifiera vilka avgifter som är obligatoriska vs valfria
- Du förstår att vissa "fasta avgifter" är nätavgifter (obligatoriska) medan andra är leverantörsavgifter (valfria)
- Kontext är avgörande: Titta på vilken sektion avgiften tillhör (Elnät vs Elhandel)

NOGGRANN LÄSNING:
- Läs av exakt belopp från "Totalt" eller motsvarande kolumn
- Blanda inte ihop olika avgifter med varandra
- Var särskilt uppmärksam på att inte blanda "Årsavgift" med "Elöverföring"
- DUBBELKOLLA ALLA POSTER: Gå igenom fakturan rad för rad och leta efter ALLA avgifter som matchar listan nedan
- VIKTIGT: Om du hittar en avgift som matchar listan, inkludera den OAVSETT var den står på fakturan
- EXTRA VIKTIGT: Leta särskilt efter ord som innehåller "år", "månad", "fast", "rörlig", "påslag" - även om de står i samma rad som andra ord
- VIKTIGT: Om du ser en avgift som har både ett årsbelopp (t.ex. "384 kr") och ett månadsbelopp (t.ex. "32,61 kr"), inkludera månadsbeloppet i beräkningen
- BERÄKNINGSREGEL FÖR Elcertifikat: Om "Elcertifikat" eller "Elcertifikatavgift" anges i öre/kWh, räkna ut kostnaden som (öre per kWh × total kWh) / 100 = kr, avrunda till två decimaler. Denna post ska ALLTID ingå i onödiga kostnader.

SYFTE:
Analysera fakturan, leta efter poster som avviker från normala eller nödvändiga avgifter, och förklara dessa poster i ett enkelt och begripligt språk. Ge tips på hur användaren kan undvika dessa kostnader i framtiden eller byta till ett mer förmånligt elavtal.

VIKTIGT: Efter att du har identifierat alla extra avgifter, summera ALLA belopp och visa den totala besparingen som kunden kan göra genom att byta till ett avtal utan dessa extra kostnader.

SÄRSKILT VIKTIGT - LETA EFTER:
- Alla avgifter som innehåller "år" eller "månad" (t.ex. "årsavgift", "månadsavgift")
- Alla "fasta" eller "rörliga" kostnader
- Alla "påslag" av något slag
- SÄRSKILT: Leta efter "Elavtal årsavgift" eller liknande text som innehåller både "elavtal" och "årsavgift"
- EXTRA VIKTIGT: "Elavtal årsavgift" är en vanlig extra avgift som ofta missas - leta särskilt efter denna exakta text
- EXTRA VIKTIGT: Leta särskilt efter "Rörliga kostnader" eller "Rörlig kostnad" - detta är en vanlig extra avgift som ofta missas
- SÄRSKILT: Leta efter "Elcertifikat" eller "Elcertifikatavgift" och inkludera den enligt beräkningsregeln ovan
- Gå igenom VARJE rad på fakturan och kontrollera om den innehåller någon av dessa avgifter
- KRITISKT: Om du ser "Fast avgift" under sektionen Elhandel/Elhandelsföretag – inkludera den alltid i onödiga kostnader. Om "Fast avgift" även förekommer under Elnät/Elöverföring ska den EXKLUDERAS. Inkludera endast den under Elhandel.
 - KRITISKT: Om du ser "Profilpris" eller "Bundet profilpris" som en EGEN radpost under Elhandel – inkludera den i onödiga kostnader. Om det står under Elnät/Elöverföring ska det EXKLUDERAS.
 - VIKTIG FÖRVÄXLINGSREGEL: Blanda inte ihop "Bundet elpris" (själva energipriset per kWh) med "Profilpris". "Bundet elpris", "Elpris", "Fastpris per kWh" och liknande är INTE onödiga kostnader och ska exkluderas. "Profilpris"/"Bundet profilpris" är däremot ett extra påslag och ska inkluderas när det ligger under Elhandel.

ORDLISTA - ALLA DETTA RÄKNAS SOM ONÖDIGA KOSTNADER:
- Månadsavgift, Fast månadsavgift, Fast månadsavg., Månadsavg.
- Rörliga kostnader, Rörlig kostnad, Rörliga avgifter, Rörlig avgift
- Fast påslag, Fasta påslag, Fast avgift, Fast avg., Fasta avgifter, Fast kostnad, Fasta kostnader, Påslag
- Fast påslag spot, Fast påslag elcertifikat
- Årsavgift, Årsavg., Årskostnad, Elavtal årsavgift, Årsavgift elavtal (endast om under Elhandel/leverantörsavgift; exkludera om under Elnät/Elöverföring)
- Förvaltat Portfölj Utfall, Förvaltat portfölj utfall
- Bra miljöval, Bra miljöval (Licens Elklart AB)
- Trygg, Trygghetspaket
- Basavgift, Grundavgift, Administrationsavgift, Abonnemangsavgift, Grundpris
- Fakturaavgift, Kundavgift, Elhandelsavgift, Handelsavgift
- Indexavgift, Elcertifikatavgift, Elcertifikat
- Grön elavgift, Ursprungsgarantiavgift, Ursprung
- Miljöpaket, Serviceavgift, Leverantörsavgift
- Dröjsmålsränta, Påminnelsesavgift, Priskollen
- Rent vatten, Fossilfri, Fossilfri ingår
 - Profilpris, Bundet profilpris

ORDLISTA - KOSTNADER SOM INTE RÄKNAS SOM EXTRA:
- Moms, Elöverföring, Energiskatt, Medel spotpris, Spotpris, Elpris
- Bundet elpris, Fastpris (själva energipriset), Rörligt elpris (själva energipriset)
- Förbrukning, kWh, Öre/kWh, Kr/kWh

VIKTIGT: Inkludera ALLA kostnader från första listan i summeringen av onödiga kostnader. Exkludera kostnader från andra listan.

SUMMERING:
1. Lista ALLA hittade onödiga kostnader med belopp
2. Summera ALLA belopp till en total besparing
3. Visa den totala besparingen tydligt i slutet

VIKTIGT - SLUTTEXT:
Efter summeringen, avsluta alltid med denna exakta text:

"💰 Din årliga besparing:
Du betalar [total] kr/månad i onödiga avgifter (inklusive moms) = [total × 12] kr/år!

Detta är pengar som går direkt till din elleverantör utan att du får något extra för dem.

✅ Lösningen:
Byt till ett avtal utan dessa avgifter och spara [total × 12] kr/år (inklusive moms)!

🎯 Välj ditt nya avtal:
- Rörligt avtal: 0 kr i avgifter första året – spara [total × 12] kr/år
- Fastprisavtal: Prisgaranti med valfri bindningstid – spara [total × 12] kr/år

⏰ Byt idag – det tar bara 2 minuter och vi fixar allt åt dig!"

Svara på svenska och var hjälpsam och pedagogisk.`;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Two-step approach: Extract JSON first, then calculate (med robust fallback till gpt-4o)
    let gptAnswer = '';
    
    try {
      // Step 1: Extract structured data (försök först med gpt-5.4, fallback till gpt-4o)
      let extractionData: any | null = null;
      let extractedJson = '';

      const extractionPayloadBase = {
        messages: [
          { role: 'system', content: extractionPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahera alla kostnader från denna elräkning som JSON-array. SVARA ENDAST MED JSON.' },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.0,
      };

      // Försök med gpt-5.4 först
      // För gpt-5.4 används max_completion_tokens istället för max_tokens
      let extractionRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({ model: 'gpt-5.4', ...extractionPayloadBase, max_completion_tokens: 2000 }),
      });

      if (!extractionRes.ok) {
        console.log('gpt-5.4 extraction failed, status:', extractionRes.status);
        try {
          const text = await extractionRes.text();
          console.log('gpt-5.4 extraction body:', text);
        } catch {}

        // Fallback till gpt-4o
        extractionRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({ model: 'gpt-4o', ...extractionPayloadBase, max_tokens: 2000 }),
        });
      }

      if (extractionRes.ok) {
        extractionData = await extractionRes.json();
        const extractedJson = extractionData.choices?.[0]?.message?.content || '';
        console.log('Raw extraction response:', extractedJson.substring(0, 200));
        
        try {
          let cleanJson = extractedJson.trim();
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          }
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Normalisera alla "amount"-värden där modellen använt svenska/”stökiga” format:
          // - Endast om talet innehåller KOMMA eller MELLANSLAG (t.ex. "3 143,52" eller "3,143.52")
          // - Rena JSON-tal som "208.13" eller "656.00" lämnas orörda
          cleanJson = cleanJson.replace(/"amount"\s*:\s*([0-9][0-9., ]*)/g, (match: string, num: string) => {
            const raw = String(num);
            const hasComma = raw.includes(',');
            const hasSpace = /\s/.test(raw);

            // Om talet redan ser ut som ett normalt JSON-tal utan komma/mellanslag: returnera oförändrat
            if (!hasComma && !hasSpace) {
              return match;
            }

            // Ta bort alla mellanslag
            const withoutSpaces = raw.replace(/\s+/g, '');
            const parts = withoutSpaces.split(/[.,]/);

            if (parts.length === 1) {
              // Inga decimaler, bara heltal
              return `"amount": ${parts[0]}`;
            }

            const decimals = parts.pop() as string;
            const integer = parts.join('');
            return `"amount": ${integer}.${decimals}`;
          });
          
          console.log('Cleaned JSON:', cleanJson.substring(0, 200));
          const parsed = JSON.parse(cleanJson) as { name?: string; amount?: number; section?: string }[];
          
          const includeTerms = [
            'månadsavgift',
            'fast månadsavg',
            'rörliga kostnader',
            'rörlig kostnad',
            'rörliga avgifter',
            'rörlig avgift',
            'fast påslag',
            'fasta påslag',
            'fast avgift',
            'fasta avgifter',
            'fast kostnad',
            'fasta kostnader',
            'påslag',
            'årsavgift',
            'elavtal årsavgift',
            'årskostnad',
            'förvaltat portfölj utfall',
            'bra miljöval',
            'trygg',
            'basavgift',
            'grundavgift',
            'administrationsavgift',
            'abonnemangsavgift',
            'grundpris',
            'fakturaavgift',
            'kundavgift',
            'elhandelsavgift',
            'handelsavgift',
            'indexavgift',
            'grön elavgift',
            'ursprungsgarantiavgift',
            'ursprung',
            'miljöpaket',
            'serviceavgift',
            'leverantörsavgift',
            'dröjsmålsränta',
            'påminnelsesavgift',
            'priskollen',
            'rent vatten',
            'fossilfri',
            'profilpris',
            'bundet profilpris'
          ];
          
          const excludeTerms = [
            'elöverföring',
            'energiskatt',
            'medel spotpris',
            'spotpris',
            'elpris',
            'elcertifikat',
            'elcertifikatavgift',
            'förbrukning',
            'kwh',
            'öre/kwh',
            'kr/kwh',
            'moms'
          ];
          
          const unnecessaryItems = parsed.filter((item) => {
            if (!item || !item.name || typeof item.amount !== 'number') return false;
            if (!item.section || item.section.toLowerCase() !== 'elhandel') return false;
            const nameLower = item.name.toLowerCase();
            if (excludeTerms.some((t) => nameLower.includes(t))) return false;
            return includeTerms.some((t) => nameLower.includes(t));
          });
          
          const monthlyTotal = unnecessaryItems.reduce((sum, item) => sum + (item.amount || 0), 0);
          const yearlyTotal = monthlyTotal * 12;
          
          const lines = unnecessaryItems.map((item, idx) => {
            const amountStr = (item.amount ?? 0).toFixed(2).replace('.', ',');
            return `${idx + 1}. ${item.name}: ${amountStr} kr`;
          });
          
          const monthlyStr = monthlyTotal.toFixed(2).replace('.', ',');
          const yearlyStr = yearlyTotal.toFixed(2).replace('.', ',');
          
          gptAnswer = [
            '🚨 Dina onödiga elavgifter upptäckta!',
            '',
            `Jag har hittat ${unnecessaryItems.length} onödiga avgifter på din elräkning som kostar dig pengar varje månad:`,
            '',
            '💸 Onödiga kostnader denna månad:',
            ...lines,
            '',
            '💰 Din årliga besparing:',
            `Du betalar ${monthlyStr} kr/månad i onödiga avgifter (inklusive moms om beloppen i fakturan är inklusive moms) = ${yearlyStr} kr/år!`,
            '',
            'Detta är pengar som går direkt till din elleverantör utan att du får något extra för dem.',
            '',
            '✅ Lösningen:',
            `Byt till ett avtal utan dessa avgifter och spara ${yearlyStr} kr/år (inklusive moms)!`,
            '',
            '🎯 Välj ditt nya avtal:',
            `- Rörligt avtal: 0 kr i avgifter första året – spara ${yearlyStr} kr/år`,
            `- Fastpris med prisgaranti: Prisgaranti med valfri bindningstid`,
            '',
            '⏰ Byt idag – det tar bara 2 minuter och vi fixar allt åt dig!'
          ].join('\n');
          
          console.log('Extracted JSON preview:', cleanJson.substring(0, 500));
        } catch (parseError) {
          console.log('Failed to parse extraction JSON or build summary:', parseError);
          console.log('Raw response that failed to parse:', extractedJson);
          console.log('Falling back to single-step approach');
        }
      }
    } catch {
      console.log('Two-step approach failed, falling back to single-step approach');
    }

    // Fallback till original single-step-analys om tvåstegsflödet misslyckades helt
    if (!gptAnswer) {
      const singleStepPayloadBase = {
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Vad betalar jag i onödiga kostnader? Analysera denna elräkning enligt instruktionerna. SVARA ENDAST PÅ SVENSKA - oavsett vilket språk fakturan är på.' },
              { type: 'image_url', image_url: { url: base64Image } }
            ]
          }
        ],
        temperature: 0.1,
      };

      // Försök först med gpt-5.4
      let openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({ model: 'gpt-5.4', ...singleStepPayloadBase, max_completion_tokens: 1200 }),
      });

      if (!openaiRes.ok) {
        console.log('gpt-5.4 single-step failed, status:', openaiRes.status);
        try {
          const text = await openaiRes.text();
          console.log('gpt-5.4 single-step body:', text);
        } catch {}

        // Fallback till gpt-4o för single-step
        openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({ model: 'gpt-4o', ...singleStepPayloadBase, max_tokens: 1200 }),
        });
      }

      if (openaiRes.ok) {
        const gptData = await openaiRes.json();
        gptAnswer = gptData.choices?.[0]?.message?.content || '';
      }
    }

    if (!gptAnswer) {
      return NextResponse.json({ error: 'OpenAI Vision error - both two-step and fallback approaches failed' }, { status: 500 });
    }

    // Försök logga analysen i Supabase
    let logId: number | null = null;
    try {
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const sessionId = req.headers.get('x-session-id') || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
        const userAgent = req.headers.get('user-agent') || 'unknown';

        const { data: insertData, error } = await supabase
          .from('invoice_ocr')
          .insert([
            {
              session_id: sessionId,
              user_agent: userAgent,
              file_mime: mimeType,
              file_size: fileSize,
              image_sha256: imageSha256,
              model: 'gpt-5.4',
              system_prompt_version: '2025-01-vision-v1',
              gpt_answer: gptAnswer,
              consent: consent,
            }
          ])
          .select('id')
          .single();

        if (!error && insertData) {
          logId = insertData.id as number;
          // Om samtycke: ladda upp filen till privat bucket och spara referensen
          if (consent) {
            try {
              const bucketName = 'invoice-ocr';
              // Ensure the storage bucket exists (create if missing)
              try {
                const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);
                if (getBucketError || !existingBucket) {
                  await supabase.storage.createBucket(bucketName, {
                    public: false,
                    fileSizeLimit: 20 * 1024 * 1024, // 20 MB
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
                  });
                }
              } catch {
                try {
                  await supabase.storage.createBucket(bucketName, {
                    public: false,
                    fileSizeLimit: 20 * 1024 * 1024,
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
                  });
                } catch {}
              }
              const storageKey = `${logId}/${imageSha256}.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
              // First try SDK upload (works in many environments)
              const uploadRes = await supabase.storage.from(bucketName).upload(storageKey, file, {
                contentType: mimeType,
                upsert: false,
              });

              let uploadedOk = !uploadRes.error;

              // If SDK upload failed (common on edge runtimes), fall back to Storage REST API
              if (!uploadedOk) {
                try {
                  const cleanSupabaseUrl = SUPABASE_URL.replace(/"/g, '').replace(/\/$/, '');
                  // Important: Do NOT URL-encode the full path; slashes must remain as separators
                  const restUrl = `${cleanSupabaseUrl}/storage/v1/object/${bucketName}/${storageKey}`;
                  const arrayBuffer = await file.arrayBuffer();
                  const restRes = await fetch(restUrl, {
                    method: 'POST',
                    headers: {
                      apikey: SUPABASE_SERVICE_ROLE_KEY,
                      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                      'Content-Type': mimeType,
                      'x-upsert': 'false',
                    },
                    body: arrayBuffer,
                  });
                  uploadedOk = restRes.ok;
                } catch (restErr) {
                  console.error('REST upload to Supabase Storage failed:', restErr);
                }
              }

              if (uploadedOk) {
                await supabase.from('invoice_ocr_files').insert([
                  {
                    invoice_ocr_id: logId,
                    storage_key: storageKey,
                    image_sha256: imageSha256,
                  }
                ]);
              }
            } catch (e) {
              console.error('Failed to upload invoice image to storage:', e);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to log invoice OCR to Supabase:', e);
    }

    return NextResponse.json({ gptAnswer, logId });
  } catch (err) {
    console.error('Unexpected error in /api/gpt-ocr:', err);
    return NextResponse.json({ error: 'Unexpected error', details: String(err) }, { status: 500 });
  }
} 