import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  generateKnowledgeSummary 
} from '@/lib/knowledgeBase';
// import { CheapEnergyPrices } from '@/lib/types'; // Temporärt inaktiverat

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Funktion för att hämta aktuella elpriser (temporärt inaktiverad)
// async function getCurrentPrices(): Promise<CheapEnergyPrices | null> {
//   try {
//     // Hämta direkt från Stockholms Elbolag
//     console.log('🔍 getCurrentPrices: Hämtar direkt från Stockholms Elbolag...');
//     
//     const response = await fetch('https://www.stockholmselbolag.se/Site_Priser_SthlmsEL_de2.json', {
//       headers: {
//         'Accept': 'application/json',
//         'User-Agent': 'Elchef-Price-Checker/1.0'
//       }
//     });
//     
//     if (!response.ok) {
//       console.error('Failed to fetch prices:', response.status);
//       return null;
//     }
//     
//     const prices = await response.json();
//     console.log('✅ getCurrentPrices: Hämtade priser:', prices.spot_prices);
//     return prices;
//   } catch (error) {
//     console.error('Error fetching current prices:', error);
//     return null;
//   }
// }

// Funktion för att hämta dynamisk kunskap från Supabase
async function getDynamicKnowledge(userQuestion: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Hämta relevant kunskap baserat på användarens fråga
    const { data: knowledgeData } = await supabase
      .from('ai_knowledge')
      .select('*')
      .eq('active', true)
      .order('lastUpdated', { ascending: false });

    // Hämta aktiva kampanjer
    const { data: campaignData } = await supabase
      .from('ai_campaigns')
      .select('*')
      .eq('active', true)
      .gte('validTo', new Date().toISOString().split('T')[0])
      .order('validTo', { ascending: true });

    // Hämta aktiva leverantörer
    const { data: providerData } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    // Hämta ALL kunskap istället för bara relevant
    // const relevantKnowledge = knowledgeData?.filter(item => 
    //   item.keywords.some((keyword: string) => 
    //     userQuestion.toLowerCase().includes(keyword.toLowerCase())
    //   )
    // ) || [];

    return {
      knowledge: knowledgeData || [], // All kunskap
      campaigns: campaignData || [],
      providers: providerData || []
    };
  } catch (error) {
    console.error('Error fetching dynamic knowledge:', error);
    return null;
  }
}

const SYSTEM_PROMPT = `Du är "Grodan", en AI-assistent som hjälper svenska konsumenter med elavtal och elmarknaden – särskilt via elchef.se.

## SYFTE OCH EXPERTIS
Du är en expert på svenska elavtal och elmarknaden med djup kunskap om:
- Elavtal (rörligt, fast, tillsvidare)
- Elmarknadens struktur och funktion
- Kostnader, skatter, avgifter och påslag
- Miljöpåverkan och grön el
- Hur man byter elleverantör
- Elområden (SE1, SE2, SE3, SE4)
- Aktuella kampanjer och erbjudanden

## HEMSIDANS INNEHÅLL OCH KUNSKAP

### Om Elchef.se
• elchef.se tillhandahålls av VKNG LTD enligt våra [villkor](/villkor) och [integritetspolicy](/integritetspolicy)
• Vi är INTE ett elbolag - du får aldrig en elräkning från oss
• Vi jobbar oberoende och samarbetar med flera elleverantörer
• Vi visar bara avtal som är värda att överväga - med tydliga villkor
• Vi har 30+ års erfarenhet från branschen

### Aktuella Erbjudanden (2025)
• **Rörligt avtal**: 0 kr i avgifter första året – utan bindningstid
• **Fastprisavtal**: Prisgaranti med valfri bindningstid (1-3 år)
• **Företagsavtal**: Via energi2.se/elchef/ för företag

### Leverantörer
• **Rörligt avtal**: Cheap Energy (0 kr månadsavgift, 0 öre påslag)
• **Fastprisavtal**: Svealand Energi
• **Företag**: Energi2.se

### Bytprocess
• Helt digitalt - inga papper eller samtal
• Vi fixar uppsägningen hos ditt gamla elbolag
• Klart på 14 dagar
• Gratis byte - inga avgifter
• Ångerrätt i 14 dagar enligt distansavtalslagen

### Elområden (SE1-SE4)
• **SE1**: Norra Sverige
• **SE2**: Norra Mellansverige  
• **SE3**: Södra Mellansverige
• **SE4**: Södra Sverige
• Elområdet påverkar elpriset i din region

### Vanliga Frågor och Svar

**Hur hittar jag bra elavtal?**
Registrera din e-post i formuläret i foten av sidan för att få tidiga erbjudanden innan de blir fullbokade.

**Vad ska jag välja - Fastpris eller Rörligt?**
• **Fastpris**: Förutsägbart under hela avtalsperioden, bra om du vill undvika prisschocker
• **Rörligt**: Följer marknaden, historiskt billigare över tid men kan variera
• Fundera: Tror du elpriserna blir billigare eller dyrare framöver?

**Måste jag säga upp mitt gamla avtal?**
Nej, den nya leverantören hanterar bytet åt dig inklusive uppsägningen.

**Avgifter vid uppsägning?**
• **Rörliga avtal**: Oftast gratis, 1 månads uppsägningstid
• **Fastprisavtal**: Kan ha brytavgift (lösenavgift) beroende på återstående tid

**Kan jag ångra mitt avtal?**
Ja, 14 dagars ångerrätt enligt distansavtalslagen. Undantag: betald förbrukad el under ångerperioden.

### Vädrets påverkan på elpriset
• **Regn**: Lägre pris (fyller vattenmagasin, billig vattenkraft)
• **Vind**: Lägre pris (mycket vindkraftproduktion)
• **Värme**: Ofta lägre pris (mindre efterfrågan på uppvärmning)
• **Torka/vindstilla**: Högre pris (mindre billig el, dyrare import)

### Sommaren - perfekt tid för byte
• Många vill låsa in låga sommarpriser inför hösten
• Hos elchef.se får du rörligt pris utan påslag - bara marknadspriset
• Vi visar även fasta elavtal för dig som vill slippa prisschocker

## SPRÅK OCH TON
• Alltid på enkel svenska
• Undvik krångliga eller tekniska uttryck
• Använd punktlistor och **fetstil** för tydlighet
• Använd exempel och jämförelser (t.ex. "tänk på rörligt elpris som bensinpriset – det varierar")
• Var naturlig och samtalig – som en hjälpsam vän
• HÄLSA ENDAST I FÖRSTA SVARET. Inled ALDRIG efterföljande svar med hälsning (t.ex. "Hej").

## SVARSLÄNGD - VIKTIGT
• Håll svaren KORTA och KONKRETA
• Max 2-3 meningar per svar om möjligt
• Undvik långa förklaringar och utfyllnad
• Ge direkt svar på frågan utan onödig bakgrund
• Använd punktlistor för att hålla det kort och tydligt

## FORMATERING OCH LÄSBARHET
• Använd **fetstil** för nyckelord, *kursiv* för betoning
• Använd punktlistor (-) och numrerade listor (1. 2. 3.)
• Använd > citat för viktiga tips
• Använd [länkar](url) när relevant
• Strukturera längre svar med rubriker (###)

## SÄKERHETSPOLICY
• Gör inga påståenden om samröre med "Elbyte AB" eller "Elbyte Norden AB"
• Lämna inte ut, gissa eller fabricera organisationsnummer
• Uppgifter om ägare/styrelse ska inte spekuleras om
• Om du inte är säker: säg "Jag vet inte" och hänvisa till källa

## SÄLJANDE FOKUS (utan överlöften)
• Lyft fram att byte via elchef.se är smidigt och guideat
• Föreslå val utifrån användarens situation
• Fråga gärna om hushållsinformation (boendeform, storlek, uppvärmning)
• Fråga INTE efter postnummer eller elområde
• Föreslå nästa steg när relevant: "Vill du att vi går vidare med avtalsval?"

## KONTAKTFORMULÄR
• Om användaren vill ha personlig hjälp, föreslå kontaktformuläret och inkludera [SHOW_CONTACT_FORM]
• När det är inskickat: tacka kort och inkludera [CONTACT_FORM_SUBMITTED]
• Om användaren ber om formuläret igen efter att det visats: påpeka att det redan finns i chatten

## ELRÄKNINGSANALYS
• Vi har en avancerad AI som kan analysera elräkningar och visa exakt hur mycket användaren kan spara
• Om användaren frågar om att ladda upp elräkning, analysera räkningar, eller hur de kan se sina besparingar: visa bill upload-funktionen och inkludera [SHOW_BILL_UPLOAD]
• Förklara att funktionen kan:
  - Läsa alla kostnader från elräkningen
  - Jämföra med våra avtal
  - Visa exakt besparingspotential
  - Ge personliga rekommendationer
• När analysen är klar: tacka och förklara resultatet

## AVTALSVAL OCH KÖPSIGNALER
• När användaren uttrycker tydligt intresse för byte ("Ja", "Absolut", "Gärna", etc.), visa avtalsval och inkludera [SHOW_CONTRACT_CHOICE]
• Förklara kort skillnaden:
  - **Rörligt**: följer marknaden, kan variera, 0 kr avgifter första året
  - **Fastpris**: låst pris i 1–3 år, mer förutsägbart
• Bekräfta valet och förklara att registrering öppnas i nytt fönster

## VIKTIGA TRIGGERS – använd alltid
• [SHOW_CONTRACT_CHOICE] – vid tydlig köpsignal
• [SHOW_CONTACT_FORM] – vid önskemål om personlig hjälp
• [SHOW_BILL_UPLOAD] – vid frågor om elräkningsanalys eller uppladdning

## KONVERSATIONSREGLER
• Var hjälpsam, konkret och förtroendeingivande
• Bygg förtroende genom nytta och enkelhet
• Undvik utfyllnad
• Om användaren redan delat info, referera till den naturligt
• Använd alltid information från hemsidan - var uppdaterad på aktuella erbjudanden

## SPECIFIKA FRÅGEEXEMPEL (följ exakt)
• "Vilket företag står bakom elchef.se?" → Svara: "elchef.se tillhandahålls av VKNG LTD enligt våra villkor och integritetspolicy."
• "Vad är organisationsnumret?" → Svara: "Jag har tyvärr inte ett bekräftat organisationsnummer här. Verifiera via Bolagsverket, eller skriv din fråga så kan vi återkomma via kontaktformuläret."
• "Samarbetar ni med Elbyte (AB/Norden AB)?" → Svara: "elchef.se drivs av VKNG LTD. Jag har inga uppgifter här om samarbete med Elbyte."
• "Vem är huvudman/ägare?" → Svara: "Sådana uppgifter finns i officiella register (t.ex. Bolagsverket). Jag kan tyvärr inte lämna det här."

## AKTUELLA KAMPANJER OCH PRISER
• **Rörligt avtal**: 0 kr i avgifter första året, utan bindningstid
• **Fastprisavtal**: Prisgaranti med valfri bindningstid
• **Företag**: Särskilda företagsavtal via energi2.se
• Alla priser är aktuella och kan variera - exakta villkor visas vid registrering`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId, contractChoice } = body;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Meddelanden saknas eller fel format' }, { status: 400 });
    }
    if (!XAI_API_KEY) {
      return NextResponse.json({ error: 'XAI_API_KEY saknas i miljövariabler' }, { status: 500 });
    }
    
    // Hämta användarens senaste meddelande för att hitta relevant kunskap
    const userMessage = messages[messages.length - 1]?.content || '';
    
    // Hämta dynamisk kunskap från Supabase
    const dynamicKnowledge = await getDynamicKnowledge(userMessage);
    
    // Temporärt inaktiverat prisfunktionen - API fungerar men orsakar 500-fel i AI
    // const currentPrices = null; // Temporärt inaktiverat
    
    // Debug: logga vad som hämtades
    if (dynamicKnowledge) {
      console.log('Dynamisk kunskap hämtad:', {
        knowledgeCount: dynamicKnowledge.knowledge.length,
        campaignCount: dynamicKnowledge.campaigns.length,
        providerCount: dynamicKnowledge.providers.length
      });
    }
    
    // Skapa en dynamisk systemprompt som inkluderar aktuell information
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    
    if (dynamicKnowledge) {
      // Lägg till all kunskap från admin
      if (dynamicKnowledge.knowledge.length > 0) {
        enhancedSystemPrompt += '\n\n## AKTUELL KUNSKAPSBAS (från admin)\n';
        dynamicKnowledge.knowledge.forEach(item => {
          enhancedSystemPrompt += `**${item.question}**\n${item.answer}\n\n`;
        });
      }
      
      // Lägg till aktuella kampanjer
      if (dynamicKnowledge.campaigns.length > 0) {
        enhancedSystemPrompt += '\n## AKTUELLA KAMPANJER\n';
        dynamicKnowledge.campaigns.forEach(campaign => {
          enhancedSystemPrompt += `• **${campaign.title}**: ${campaign.description}\n`;
        });
        enhancedSystemPrompt += '\n';
      }
      
      // Lägg till aktuella leverantörer
      if (dynamicKnowledge.providers.length > 0) {
        enhancedSystemPrompt += '\n## AKTUELLA LEVERANTÖRER\n';
        dynamicKnowledge.providers.forEach(provider => {
          enhancedSystemPrompt += `• **${provider.name}** (${provider.type}): ${provider.features.join(', ')}\n`;
        });
        enhancedSystemPrompt += '\n';
      }
    }
    
    // Temporärt inaktiverat prisfunktionen
    // if (currentPrices) {
    //   enhancedSystemPrompt += '\n\n## AKTUELLA ELPRISER (uppdaterade från leverantör)\n';
    //   enhancedSystemPrompt += `**Rörliga priser (spot) per kWh:**\n`;
    //   enhancedSystemPrompt += `• SE1 (Norra Sverige): ${currentPrices.spot_prices.se1?.toFixed(2) || 'N/A'} öre/kWh\n`;
    //   enhancedSystemPrompt += `• SE2 (Norra Mellansverige): ${currentPrices.spot_prices.se2?.toFixed(2) || 'N/A'} öre/kWh\n`;
    //   enhancedSystemPrompt += `• SE3 (Södra Mellansverige): ${currentPrices.spot_prices.se3?.toFixed(2) || 'N/A'} öre/kWh\n`;
    //   enhancedSystemPrompt += `• SE4 (Södra Sverige): ${currentPrices.spot_prices.se4?.toFixed(2) || 'N/A'} öre/kWh\n\n`;
    //   
    //   enhancedSystemPrompt += `**Våra rörliga avtal:**\n`;
    //   enhancedSystemPrompt += `• 0 kr månadsavgift första året\n`;
    //   enhancedSystemPrompt += `• 0 öre påslag på spotpriset\n`;
    //   enhancedSystemPrompt += `• Ingen bindningstid\n\n`;
    //   
    //   enhancedSystemPrompt += `**Fastprisavtal (6 månader):**\n`;
    //   enhancedSystemPrompt += `• SE1: ${currentPrices.variable_fixed_prices.se1?.['6_months']?.toFixed(2) || 'N/A'} öre/kWh\n`;
    //   enhancedSystemPrompt += `• SE2: ${currentPrices.variable_fixed_prices.se2?.['6_months']?.toFixed(2) || 'N/A'} öre/kWh\n`;
    //   enhancedSystemPrompt += `• SE3: ${currentPrices.variable_fixed_prices.se3?.['6_months']?.toFixed(2) || 'N/A'} öre/kWh\n`;
    //   enhancedSystemPrompt += `• SE4: ${currentPrices.variable_fixed_prices.se4?.['6_months']?.toFixed(2) || 'N/A'} öre/kWh\n\n`;
    // }
    
    // Om ingen dynamisk kunskap finns, använd statisk fallback
    if (!dynamicKnowledge) {
      enhancedSystemPrompt += '\n\n## AKTUELL INFORMATION (från statisk kunskapsbas)\n';
      enhancedSystemPrompt += generateKnowledgeSummary();
    }
    
    // Lägg till system-prompt först (nu med dynamisk kunskap från Supabase)
    const fullMessages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages,
    ];
    
    // Om användaren har valt avtal, lägg till kontext
    if (contractChoice) {
      const contractContext = contractChoice === 'rorligt' 
        ? 'VIKTIGT: Användaren har valt rörligt avtal. Bekräfta valet och förklara att de kommer skickas till registrering. Var positiv och förtroendeingivande.'
        : 'VIKTIGT: Användaren har valt fastpris. Bekräfta valet och förklara att de kommer skickas till registrering. Var positiv och förtroendeingivande.';
      
      fullMessages.push({ role: 'system', content: contractContext });
    }
    
    const xaiRes = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: fullMessages,
        model: 'grok-3-latest',
        stream: false,
        temperature: 0.3,
      }),
    });
    if (!xaiRes.ok) {
      const err = await xaiRes.text();
      return NextResponse.json({ error: 'Fel från X.ai', details: err }, { status: 500 });
    }
    const data = await xaiRes.json();

    // Säkerhetsfilter: förhindra felaktiga företagsuppgifter och fabricerade org.nr
    function sanitizeAiResponse(text: string): string {
      if (!text) return text;
      const mentionsElbyte = /\bElbyte( Norden)?( AB)?\b/i.test(text);
      const mentionsOrgNum = /\b559264[- ]?8047\b/i.test(text);
      if (!mentionsElbyte && !mentionsOrgNum) return text;

      const correction = [
        '**Korrigering:**',
        '- elchef.se tillhandahålls av VKNG LTD enligt våra [villkor](/villkor) och [integritetspolicy](/integritetspolicy).',
        '- Vi lämnar inte ut el or gissar organisationsnummer i chatten. Verifiera via [Bolagsverket](https://www.bolagsverket.se) eller kontakta oss på info@elchef.se.'
      ].join('\n');

      // Behåll ursprunglig text men lägg till tydlig korrigering överst
      return correction + '\n\n' + text;
    }

    try {
      const aiContent = data?.choices?.[0]?.message?.content || '';
      const safeContent = sanitizeAiResponse(aiContent);
      if (safeContent !== aiContent) {
        // Skriv tillbaka det sanerade svaret i samma struktur
        if (data?.choices?.[0]?.message) {
          data.choices[0].message.content = safeContent;
        }
      }
    } catch {}

    // Spara chatlogg till Supabase om konfigurerat
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Använd sessionId från frontend eller generera en om den saknas
        const finalSessionId = sessionId || Date.now().toString(36) + Math.random().toString(36).substr(2);
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Hitta det senaste användarmeddelandet (det som just skickades)
        const lastUserMessage = messages[messages.length - 1];
        
        // Skapa en array med bara det aktuella meddelandeutbytet
        const currentExchange = [
          lastUserMessage, // Användarens senaste meddelande
          { role: 'assistant', content: data.choices?.[0]?.message?.content || '' } // AI-svaret
        ];
        
        await supabase.from('chatlog').insert([
          {
            session_id: finalSessionId,
            user_agent: userAgent,
            messages: currentExchange, // Spara bara det aktuella utbytet, inte hela konversationen
            ai_response: data.choices?.[0]?.message?.content,
            total_tokens: data.usage?.total_tokens || 0,
          }
        ]);
      } catch {}
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 });
  }
} 

export const runtime = 'edge'; 