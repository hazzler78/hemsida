import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  generateKnowledgeSummary 
} from '@/lib/knowledgeBase';

// Typer för pris-API:t (hämtas via våra egna endpoints, inte direkt från leverantörer)
type ProviderRateType = 'hourly' | 'monthly';

interface ProviderPriceItem {
  monthly_fee_kr: number;
  surcharge_ore_per_kwh: number;
  rate_type: ProviderRateType;
}

interface ProviderVariablePricesResponse {
  providers: Record<string, ProviderPriceItem>;
}

interface ProviderFixedPricesResponse {
  providers: Record<string, number>;
}

// Typ för leverantör från /api/providers
interface PageProviderApi {
  id?: number;
  name: string;
  type: 'rorligt' | 'fastpris';
  logo_url: string;
  description: string;
  url: string;
  is_recommended: boolean;
  display_order: number;
  active: boolean;
  campaign_text?: string | null;
  campaign_bold?: boolean | null;
  campaign_italic?: boolean | null;
  best_price_badge_text?: string | null;
  manual_monthly_fee_kr?: number | null;
  manual_surcharge_ore_per_kwh?: number | null;
  manual_rate_type?: 'hourly' | 'monthly' | 'quarterly' | null;
}

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';
const XAI_CHAT_MODEL = process.env.XAI_CHAT_MODEL || 'grok-4.20-non-reasoning';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Hjälpfunktion: format med svensk decimal (1,2)
function formatSwedishDecimal(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

// Funktion för att hämta sammanfattade leverantörspriser via våra interna pris-API:er
async function getLiveProviderPriceSummary(req: NextRequest): Promise<string | null> {
  try {
    const origin = req.nextUrl.origin;
    // Standardantagande: SE3 och 13 500 kWh/år – samma default som /api/prices/providers
    const variableUrl = `${origin}/api/prices/providers?area=se3&consumption=13500`;
    const fixedUrl = `${origin}/api/prices/providers/fixed?area=se3&period=1_year`;

    const [variableRes, fixedRes] = await Promise.all([
      fetch(variableUrl, { headers: { Accept: 'application/json' } }),
      fetch(fixedUrl, { headers: { Accept: 'application/json' } }),
    ]);

    if (!variableRes.ok && !fixedRes.ok) {
      return null;
    }

    let variableData: ProviderVariablePricesResponse | null = null;
    let fixedData: ProviderFixedPricesResponse | null = null;

    try {
      if (variableRes.ok) {
        variableData = await variableRes.json() as ProviderVariablePricesResponse;
      }
    } catch {
      variableData = null;
    }

    try {
      if (fixedRes.ok) {
        fixedData = await fixedRes.json() as ProviderFixedPricesResponse;
      }
    } catch {
      fixedData = null;
    }

    const lines: string[] = [];
    lines.push('## AKTUELLA ELPRISER (automatisk hämtning, ungefärliga)');
    lines.push('> Priserna är uppskattningar baserade på leverantörernas egna prisfiler. Exakta villkor visas alltid på respektive avtalssida.');
    lines.push('');

    if (variableData && Object.keys(variableData.providers).length > 0) {
      lines.push('### Rörligt pris – SE3, ca 13 500 kWh/år');
      Object.entries(variableData.providers).forEach(([name, p]) => {
        if (!p) return;
        const monthly = formatSwedishDecimal(p.monthly_fee_kr, 0);
        const surcharge = formatSwedishDecimal(p.surcharge_ore_per_kwh, 1);
        const rateLabel = p.rate_type === 'hourly' ? 'rörligt timpris' : 'rörligt månadspris';
        lines.push(`• **${name}**: ca ${monthly} kr/mån + ~${surcharge} öre/kWh (${rateLabel})`);
      });
      lines.push('');
    }

    if (fixedData && Object.keys(fixedData.providers).length > 0) {
      lines.push('### Fastpris 1 år – SE3 (ungefärliga totalpriser inkl. moms)');
      Object.entries(fixedData.providers).forEach(([name, price]) => {
        if (price == null) return;
        const priceStr = formatSwedishDecimal(price, 1);
        lines.push(`• **${name}**: ca ${priceStr} öre/kWh`);
      });
      lines.push('');
    }

    const summary = lines.join('\n').trim();
    return summary.length > 0 ? summary : null;
  } catch {
    // Om pris-API:t fallerar ska chatten fortfarande fungera – hoppa bara över prisdelen
    return null;
  }
}

// Funktion för att hämta aktuella leverantörer från /api/providers (admin-sidan)
async function getProvidersFromAdmin(req: NextRequest): Promise<string | null> {
  try {
    const origin = req.nextUrl.origin;

    const [rorligtRes, fastprisRes] = await Promise.all([
      fetch(`${origin}/api/providers?type=rorligt&active=true`, { headers: { Accept: 'application/json' } }),
      fetch(`${origin}/api/providers?type=fastpris&active=true`, { headers: { Accept: 'application/json' } }),
    ]);

    if (!rorligtRes.ok && !fastprisRes.ok) {
      return null;
    }

    const lines: string[] = [];
    lines.push('## AKTUELLA LEVERANTÖRER (från admin /providers)');
    lines.push('> **Elify-koncernen:** Cheap Energy, Stockholms Elbolag och Svealands Elbolag ingår i samma koncern (Elify Energy Group). Om användaren uttrycker misstro, nämner klagomål, Konsumentverket/KO, dom eller "svartlista" – se avsnittet INVÄNDNINGAR i systemprompten. Rekommendera då INTE dessa bolag.');
    lines.push('');

    if (rorligtRes.ok) {
      const rJson = await rorligtRes.json() as { providers?: PageProviderApi[] };
      const rList = (rJson.providers || []).filter(p => p.active);
      if (rList.length > 0) {
        lines.push('### Rörligt avtal');
        rList.forEach(p => {
          const badges: string[] = [];
          if (p.is_recommended) badges.push('Rekommenderad');
          if (p.best_price_badge_text) badges.push(p.best_price_badge_text);
          const badgeText = badges.length ? ` – ${badges.join(' | ')}` : '';
          lines.push(`• **${p.name}**${badgeText}: ${p.description}`);
        });
        lines.push('');
      }
    }

    if (fastprisRes.ok) {
      const fJson = await fastprisRes.json() as { providers?: PageProviderApi[] };
      const fList = (fJson.providers || []).filter(p => p.active);
      if (fList.length > 0) {
        lines.push('### Fastprisavtal');
        fList.forEach(p => {
          const badges: string[] = [];
          if (p.is_recommended) badges.push('Rekommenderad');
          if (p.best_price_badge_text) badges.push(p.best_price_badge_text);
          const badgeText = badges.length ? ` – ${badges.join(' | ')}` : '';
          lines.push(`• **${p.name}**${badgeText}: ${p.description}`);
        });
        lines.push('');
      }
    }

    const summary = lines.join('\n').trim();
    return summary.length > 0 ? summary : null;
  } catch {
    // Om providers-API:t fallerar ska chatten fortfarande fungera – hoppa bara över leverantörsdelen
    return null;
  }
}

// Funktion för att hämta dynamisk kunskap från Supabase
async function getDynamicKnowledge() {
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
      .gte('valid_to', new Date().toISOString().split('T')[0])
      .order('valid_to', { ascending: true });

    // Hämta ALL kunskap istället för bara relevant
    // const relevantKnowledge = knowledgeData?.filter(item => 
    //   item.keywords.some((keyword: string) => 
    //     userQuestion.toLowerCase().includes(keyword.toLowerCase())
    //   )
    // ) || [];

    return {
      knowledge: knowledgeData || [], // All kunskap
      campaigns: campaignData || []
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
• Vi samarbetar med flera olika elleverantörer.
• Den aktuella listan över leverantörer och deras erbjudanden hämtas automatiskt från systemet (admin-sidan för leverantörer). Ange inte egna påhittade leverantörer.

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

## INVÄNDNINGAR, TROVÄRDIGHET OCH ELIFY-KONCERNEN
Detta avsnitt gäller **före** säljande rekommendationer när användaren ifrågasätter bolag eller elchef.se.

### Fakta att hålla sig till
• **Cheap Energy**, **Stockholms Elbolag** och **Svealands Elbolag** ingår i **Elify Energy Group** (samma koncern).
• Konsumentombudsmannen (KO) har drivit mål mot dessa tre bolag. Patent- och marknadsdomstolen har bl.a. i april 2026 funnit att marknadsföringen kring elpris efter 12 månader var vilseledande.
• Bolagen har också figurerat på **Konsumenternas Energimarknadsbyrås klagomålslista** (bolag med många klagomål i relation till antal kunder). Det är inte en officiell "svartlista", men kunder menar ofta den listan när de säger "svartlistade".
• **Enkla Elbolaget** tillhör **Dalakraft AB** – det ingår **inte** i Elify-koncernen. Koppla aldrig ihop dem utan verifierad källa.
• elchef.se samarbetar med flera elleverantörer, inklusive bolag i Elify-koncernen. Var transparent om detta när det är relevant.

### Hur du ska svara vid invändningar
• **Avfärda aldrig** kundens invändning med "det stämmer inte" om klagomål, KO, dom eller klagomålslista – erkänn vad som stämmer och var tydlig med nyanser.
• Om användaren **inte litar på** Cheap Energy, Stockholms Elbolag eller Svealands Elbolag: **sluta rekommendera dem**. Föreslå i stället t.ex. **Skellefteå Kraft**, **Tibber**, **Greenely**, **E.ON** eller **Vattenfall** – bolag utanför Elify-koncernen.
• Om användaren berättar om **mycket höga elräkningar** (t.ex. tusentals kronor/mån för liten lägenhet med bara hushållsel): bekräfta att det låter orimligt högt och rekommendera **inte** samma koncern som kunden kritiserar.
• Om du gjort ett **faktumfel** (t.ex. fel ägare/koncern): erkänn det direkt, tacka för rättelsen, och ge ett korrigerat svar utan att argumentera.
• Om användaren är **arg eller tappat förtroendet**: var kort, respektfull och avsluta utan att pusha avtal.

### När du får rekommendera Elify-bolagen
• Endast om användaren **inte** uttryckt misstro eller kritik mot dem.
• Var då transparent: nämn att de kan ha bra introduktionspris men att användaren bör läsa **hela avtalsvillkoren**, särskilt pris **efter** eventuell kampanjperiod (ofta 12 månader).

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

## CHEAP ENERGY AUTOMATION
• När användaren vill byta till Cheap Energy och har valt rörligt avtal, kan du föreslå att använda vår automation
• Automationen fyller automatiskt i formuläret på Cheap Energy's sida medan användaren chattar
• Använd **inte** automation eller rekommendera Cheap Energy om användaren uttryckt misstro mot Elify-bolagen (se avsnittet INVÄNDNINGAR)
• Använd [START_CHEAP_ENERGY_AUTOMATION] när användaren:
  - Har valt rörligt avtal OCH
  - Uttrycker intresse för Cheap Energy OCH
  - Inte har uttryckt misstro mot Elify-koncernen OCH
  - Vill att du hjälper till att fylla i formuläret
• Förklara att automationen samlar in information steg-för-steg och fyller i formuläret automatiskt

## VIKTIGA TRIGGERS – använd alltid
• [SHOW_CONTRACT_CHOICE] – vid tydlig köpsignal
• [SHOW_CONTACT_FORM] – vid önskemål om personlig hjälp
• [SHOW_BILL_UPLOAD] – vid frågor om elräkningsanalys eller uppladdning
• [START_CHEAP_ENERGY_AUTOMATION] – när användaren vill byta till Cheap Energy med automation

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
• "Är Cheap Energy/Stockholms Elbolag/Svealands svartlistade?" → Erkänn klagomål och KO-mål. Förklara klagomålslistan. Rekommendera dem inte om användaren redan uttryckt misstro.
• "Ligger Enkla Elbolaget bakom Elify?" → Svara: "Nej. Enkla Elbolaget tillhör Dalakraft AB, inte Elify Energy Group."

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
    // const userMessage = messages[messages.length - 1]?.content || ''; // Temporärt inaktiverat
    
    // Hämta dynamisk kunskap från Supabase
    const dynamicKnowledge = await getDynamicKnowledge();
    
    // Hämta aktuella priser via våra interna pris-API:er (ej kritiskt; AI fungerar även utan)
    const livePriceSummary = await getLiveProviderPriceSummary(req);
    // Hämta aktuella leverantörer från admin-sidan (/api/providers)
    const adminProvidersSummary = await getProvidersFromAdmin(req);
    
    // Debug: logga vad som hämtades
    if (dynamicKnowledge) {
      console.log('Dynamisk kunskap hämtad:', {
        knowledgeCount: dynamicKnowledge.knowledge.length,
        campaignCount: dynamicKnowledge.campaigns.length
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
    }

    // Lägg till automatisk leverantörslista från admin om den finns
    if (adminProvidersSummary) {
      enhancedSystemPrompt += '\n\n' + adminProvidersSummary;
    }

    // Lägg till automatisk pris-sammanfattning om den finns tillgänglig
    if (livePriceSummary) {
      enhancedSystemPrompt += '\n\n' + livePriceSummary;
    }
    
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
        model: XAI_CHAT_MODEL,
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