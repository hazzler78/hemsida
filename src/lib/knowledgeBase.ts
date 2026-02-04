// Dynamisk kunskapsbas för AI-chatten
// Denna fil kan uppdateras enkelt för att hålla AI:n uppdaterad

export interface KnowledgeItem {
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  lastUpdated: string;
}

export interface CampaignInfo {
  id: string;
  title: string;
  description: string;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface ProviderInfo {
  name: string;
  type: 'rorligt' | 'fastpris' | 'foretag';
  features: string[];
  url: string;
  active: boolean;
}

// Vanliga frågor och svar
export const faqKnowledge: KnowledgeItem[] = [
  {
    category: "elavtal",
    question: "Hur hittar jag bra elavtal?",
    answer: "Registrera din e-post i formuläret i foten av sidan för att få tidiga erbjudanden innan de blir fullbokade.",
    keywords: ["hitta", "bra", "erbjudanden", "registrera", "e-post"],
    lastUpdated: "2025-01-20"
  },
  {
    category: "elavtal",
    question: "Vad ska jag välja - Fastpris eller Rörligt?",
    answer: "**Fastpris**: Förutsägbart under hela avtalsperioden, bra om du vill undvika prisschocker. **Rörligt**: Följer marknaden, historiskt billigare över tid men kan variera. Fundera: Tror du elpriserna blir billigare eller dyrare framöver?",
    keywords: ["fastpris", "rorligt", "val", "prisschocker", "marknad"],
    lastUpdated: "2025-01-20"
  },
  {
    category: "byte",
    question: "Måste jag säga upp mitt gamla elavtal om jag byter leverantör?",
    answer: "Nej, du behöver oftast inte säga upp ditt gamla elavtal själv. När du byter elleverantör hanterar den nya leverantören vanligtvis bytet åt dig, inklusive uppsägningen av ditt tidigare avtal.",
    keywords: ["uppsaga", "gamla", "avtal", "byte", "leverantör"],
    lastUpdated: "2025-01-20"
  },
  {
    category: "avgifter",
    question: "Är det någon avgift för att säga upp ett elavtal?",
    answer: "Rörliga elavtal kan oftast sägas upp utan avgift och har normalt en uppsägningstid på en månad. Fastprisavtal däremot har en bindningstid, och om du vill avsluta avtalet i förtid kan det tillkomma en brytavgift (även kallad lösenavgift).",
    keywords: ["avgift", "uppsaga", "brytavgift", "lösenavgift", "bindningstid"],
    lastUpdated: "2025-01-20"
  },
  {
    category: "elomraden",
    question: "Vilket Elområde/Elzon tillhör jag?",
    answer: "Sverige är indelat i fyra elområden: **SE1** - Norra Sverige, **SE2** - Norra Mellansverige, **SE3** - Södra Mellansverige, **SE4** - Södra Sverige. Vilket elområde du tillhör beror på var du bor och påverkar elpriset i din region.",
    keywords: ["elområde", "elzon", "SE1", "SE2", "SE3", "SE4", "region"],
    lastUpdated: "2025-01-20"
  },
  {
    category: "angerratt",
    question: "Kan jag ångra mitt elavtal?",
    answer: "Ja, enligt distansavtalslagen har du ångerrätt i 14 dagar när du tecknar ett avtal på distans. Det innebär att du kan ångra avtalet utan kostnad inom denna period. Undantag: betald förbrukad el under ångerperioden.",
    keywords: ["ångra", "avtal", "14 dagar", "distansavtalslagen", "kostnad"],
    lastUpdated: "2025-01-20"
  }
];

// Aktuella kampanjer
export const activeCampaigns: CampaignInfo[] = [
  {
    id: "rorligt-2025",
    title: "Rörligt avtal - 0 kr i avgifter",
    description: "0 kr i avgifter första året – utan bindningstid",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    active: true
  },
  {
    id: "fastpris-2025",
    title: "Fastprisavtal med prisgaranti",
    description: "Prisgaranti med valfri bindningstid (1-3 år)",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    active: true
  },
  {
    id: "foretag-2025",
    title: "Företagsavtal via Energi2.se",
    description: "Särskilda företagsavtal för företag",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    active: true
  }
];

// Leverantörsinformation
export const providers: ProviderInfo[] = [
  {
    name: "Cheap Energy",
    type: "rorligt",
    features: ["0 kr månadsavgift", "0 öre påslag", "Ingen bindningstid"],
    url: "https://www.cheapenergy.se/teckna-elavtal/?src=Elchef",
    active: true
  },
  {
    name: "Svekraft",
    type: "rorligt",
    features: ["0 kr månadsavgift", "7,99 öre påslag", "Ingen bindningstid"],
    url: "https://www.svekraft.com/elavtal/?src=Elchef",
    active: true
  },
  {
    name: "Motala",
    type: "rorligt",
    features: ["Konkurrenskraftiga elavtal", "För privatpersoner"],
    url: "https://motalaenergi.se/privatperson/?src=Elchef",
    active: true
  },
  {
    name: "Svealands Elbolag",
    type: "fastpris",
    features: ["Prisgaranti", "Valfri bindningstid", "Inga dolda avgifter"],
    url: "https://www.svealandselbolag.se/teckna-avtal/?src=Elchef",
    active: true
  },
  {
    name: "Cheap Energy",
    type: "fastpris",
    features: ["Konkurrenskraftiga fastpriser", "Trygghet och förutsägbarhet"],
    url: "https://www.cheapenergy.se/teckna-elavtal/?src=Elchef",
    active: true
  },
  {
    name: "Stockholms Elbolag",
    type: "fastpris",
    features: ["Fast elpris", "Tydliga villkor", "Förutsägbara kostnader"],
    url: "https://www.stockholmselbolag.se/elavtal/?src=Elchef",
    active: true
  },
  {
    name: "Svekraft",
    type: "fastpris",
    features: ["Stabila fastpriser", "Låsta priser", "Kontroll över elbudget"],
    url: "https://www.svekraft.com/elavtal/?src=Elchef",
    active: true
  },
  {
    name: "Motala",
    type: "fastpris",
    features: ["Konkurrenskraftiga elavtal", "För privatpersoner"],
    url: "https://motalaenergi.se/privatperson/?src=Elchef",
    active: true
  },
  {
    name: "Energi2.se",
    type: "foretag",
    features: ["Företagsavtal", "Skräddarsydda lösningar", "Volymrabatter"],
    url: "https://www.energi2.se/elavtal/?src=Elchef",
    active: true
  }
];

// Bytprocessinformation
export const bytProcess = {
  steps: [
    "Fyll i formuläret med dina uppgifter",
    "Välj avtalstyp (rörligt eller fastpris)",
    "Vi fixar uppsägningen hos ditt gamla elbolag",
    "Klart på 14 dagar",
    "Inga avgifter - helt gratis"
  ],
  features: [
    "Helt digitalt - inga papper eller samtal",
    "Vi hanterar allt åt dig",
    "Ångerrätt i 14 dagar",
    "Inga dolda kostnader"
  ],
  timeFrame: "14 dagar"
};

// Vädrets påverkan på elpriset
export const weatherImpact = {
  lowerPrices: [
    { factor: "Regn", reason: "Fyller vattenmagasin i norr – billig vattenkraft" },
    { factor: "Vind", reason: "Mycket vindkraftproduktion pressar priset" },
    { factor: "Värme", reason: "Mindre efterfrågan på uppvärmning" }
  ],
  higherPrices: [
    { factor: "Torka eller vindstilla", reason: "Mindre billig el – vi importerar dyrare el" }
  ]
};

// Sommartips
export const summerTips = {
  title: "Sommaren är perfekt för att säkra ett bra elavtal",
  reasons: [
    "Många vill låsa in låga sommarpriser inför hösten",
    "Hos oss elchef.se får du rörligt pris utan påslag – bara marknadspriset",
    "Vi visar även fasta elavtal för dig som vill slippa prisschocker"
  ]
};

// Hemsidans grundinformation
export const companyInfo = {
  name: "Elchef.se",
  company: "VKNG LTD",
  experience: "30+ års erfarenhet från branschen",
  description: "Vi är INTE ett elbolag - du får aldrig en elräkning från oss. Vi jobbar oberoende och samarbetar med flera elleverantörer för att lyfta fram kampanjer och rabatter som faktiskt gör skillnad.",
  mission: "Ge dig kontrollen tillbaka. Du ska slippa lägga timmar på att leta själv. Vi visar bara fram avtal som är värda att överväga – med tydliga villkor och priser du faktiskt förstår."
};

// Funktion för att hämta relevant kunskap baserat på fråga
export function findRelevantKnowledge(question: string): KnowledgeItem[] {
  const lowerQuestion = question.toLowerCase();
  return faqKnowledge.filter(item => 
    item.keywords.some(keyword => 
      lowerQuestion.includes(keyword.toLowerCase())
    )
  );
}

// Funktion för att hämta aktiva kampanjer
export function getActiveCampaigns(): CampaignInfo[] {
  const now = new Date();
  return activeCampaigns.filter(campaign => 
    campaign.active && 
    new Date(campaign.validFrom) <= now && 
    new Date(campaign.validTo) >= now
  );
}

// Funktion för att hämta leverantörer efter typ
export function getProvidersByType(type: 'rorligt' | 'fastpris' | 'foretag'): ProviderInfo[] {
  return providers.filter(provider => 
    provider.type === type && provider.active
  );
}

// Funktion för att generera sammanfattning av aktuell kunskap
export function generateKnowledgeSummary(): string {
  const activeCampaigns = getActiveCampaigns();
  const rorligtProviders = getProvidersByType('rorligt');
  const fastprisProviders = getProvidersByType('fastpris');
  
  let summary = `## Aktuella erbjudanden (${new Date().toLocaleDateString('sv-SE')})\n\n`;
  
  if (activeCampaigns.length > 0) {
    summary += "**Aktiva kampanjer:**\n";
    activeCampaigns.forEach(campaign => {
      summary += `• ${campaign.title}: ${campaign.description}\n`;
    });
    summary += "\n";
  }
  
  if (rorligtProviders.length > 0) {
    summary += "**Rörliga avtal:**\n";
    rorligtProviders.forEach(provider => {
      summary += `• ${provider.name}: ${provider.features.join(', ')}\n`;
    });
    summary += "\n";
  }
  
  if (fastprisProviders.length > 0) {
    summary += "**Fastprisavtal:**\n";
    fastprisProviders.forEach(provider => {
      summary += `• ${provider.name}: ${provider.features.join(', ')}\n`;
    });
    summary += "\n";
  }
  
  summary += `**Bytprocess:** ${bytProcess.timeFrame}, ${bytProcess.features.join(', ')}\n`;
  summary += `**Företag:** ${companyInfo.description}`;
  
  return summary;
}
