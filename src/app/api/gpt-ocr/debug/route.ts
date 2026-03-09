import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as unknown as number[]);
  }
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Läs filen och konvertera till base64 utan Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type;
    const base64Image = `data:${mimeType};base64,${arrayBufferToBase64(arrayBuffer)}`;

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Step 1: Extract structured data
    const extractionPrompt = `Du är en expert på svenska elräkningar. Din uppgift är att extrahera ALLA kostnader från fakturan och strukturera dem i JSON-format.

**VIKTIGT - SPRÅK:**
- Du MÅSTE alltid svara på svenska, oavsett vilket språk fakturan är på
- Använd endast svenska ord och termer

**EXTRAKTIONSREGEL:**
Extrahera ALLA kostnader från fakturan och returnera dem som en JSON-array. Varje kostnad ska ha:
- "name": exakt text från fakturan (t.ex. "Fast månadsavgift", "Elavtal årsavgift")
- "amount": belopp i kr från "Totalt"-kolumnen - INTE från "öre/kWh" eller "kr/mån"
- "section": vilken sektion den tillhör ("Elnät" eller "Elhandel")
- "description": kort beskrivning av vad kostnaden är

**KRITISKT FÖR DECIMALTEcken:**
- Svenska fakturor använder KOMMA som decimaltecken (t.ex. "44,84 kr", "13,80 kr")
- JSON kräver PUNKT som decimaltecken (t.ex. 44.84, 13.80)
- DU MÅSTE konvertera komma till punkt när du skriver amount-värdet i JSON
- Exempel: Om fakturan visar "44,84 kr" → skriv "amount": 44.84 i JSON
- Exempel: Om fakturan visar "13,80 kr" → skriv "amount": 13.80 i JSON

**EXEMPEL JSON:**
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
  }
]

**VIKTIGT:**
- Inkludera ALLA kostnader, även de som inte är "onödiga"
- Läs exakt belopp från "Totalt" eller motsvarande kolumn
- **KRITISKT**: Leta särskilt efter "Elavtal årsavgift" - denna kostnad missas ofta men är viktig
- Var särskilt uppmärksam på "Fast månadsavgift", "Profilpris", "Rörliga kostnader", "Fast påslag"
- Om en kostnad har både års- och månadsbelopp, inkludera månadsbeloppet
- **EXTRA VIKTIGT**: "Elavtal årsavgift" kan stå som en egen rad eller som del av en längre text - leta efter den överallt

Svara ENDAST med JSON-arrayen, inget annat.`;

    const extractionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4',
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
        max_tokens: 2000,
        temperature: 0.0,
      }),
    });

    const debugInfo: {
      step1_success: boolean;
      extractedJson: string;
      parsedData: unknown;
      parseError: string | null;
      elavtalFound: boolean;
      elavtalAmount: number | null;
      regexMatch: RegExpMatchArray | null;
    } = {
      step1_success: false,
      extractedJson: '',
      parsedData: null,
      parseError: null,
      elavtalFound: false,
      elavtalAmount: null,
      regexMatch: null
    };

    if (extractionRes.ok) {
      const extractionData = await extractionRes.json();
      const extractedJson = extractionData.choices?.[0]?.message?.content || '';
      debugInfo.step1_success = true;
      debugInfo.extractedJson = extractedJson;
      
      try {
        let cleanJson = extractedJson.trim();
        if (cleanJson.startsWith('```json')) {
          cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Samma robusta normalisering som i huvud-API:t:
        cleanJson = cleanJson.replace(/"amount"\s*:\s*([0-9][0-9., ]*)/g, (match: string, num: string) => {
          const raw = String(num);
          const hasComma = raw.includes(',');
          const hasSpace = /\s/.test(raw);

          if (!hasComma && !hasSpace) {
            return match;
          }

          const withoutSpaces = raw.replace(/\s+/g, '');
          const parts = withoutSpaces.split(/[.,]/);

          if (parts.length === 1) {
            return `"amount": ${parts[0]}`;
          }

          const decimals = parts.pop() as string;
          const integer = parts.join('');
          return `"amount": ${integer}.${decimals}`;
        });

        const parsedData = JSON.parse(cleanJson) as { name?: string; amount?: number }[];
        debugInfo.parsedData = parsedData;
        
        const elavtalItem = parsedData.find((item) => 
          item.name && item.name.toLowerCase().includes('elavtal årsavgift')
        );
        
        if (elavtalItem && typeof elavtalItem.amount === 'number') {
          debugInfo.elavtalFound = true;
          debugInfo.elavtalAmount = elavtalItem.amount;
        }
        
        const elavtalMatch = extractedJson.match(/["']?Elavtal årsavgift["']?\s*[,\]]\s*["']?(\d+(?:[,.]\d+)?)["']?\s*kr/);
        debugInfo.regexMatch = elavtalMatch as RegExpMatchArray | null;
        
      } catch (parseError) {
        debugInfo.parseError = String(parseError);
      }
    } else {
      const errorText = await extractionRes.text();
      console.error('OpenAI extraction error (gpt-5.4):', extractionRes.status, errorText);
      return NextResponse.json(
        {
          error: 'OpenAI extraction failed',
          status: extractionRes.status,
          body: errorText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      debug: debugInfo,
      message: 'Debug information for invoice analysis'
    });

  } catch (err) {
    console.error('Debug error:', err);
    return NextResponse.json({ error: 'Debug failed', details: String(err) }, { status: 500 });
  }
}
