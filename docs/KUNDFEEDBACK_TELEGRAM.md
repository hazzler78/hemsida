# Kundfeedback från Telegram – kontaktformulär & GrokChat

Analys baserad på export från Elchef-Telegamkanalen (juli 2025 – feb 2026).  
Cirka 179 kontaktmeddelanden + GrokChat-sammanfattningar.

---

## Återkommande teman

### 1. "Jag vet inte vilket som passar mig"

| Exempel | Meddelande |
|---------|------------|
| Pawel | "Jag ser att genom er kan jag spara pengar men vet inte vilken är bäst för mig att byta" |
| Mika Heikkilä | "Jag skulle vilja ha hjälp med att hitta ett bra elavtal för mig" |
| Ernest Gegaj, Jacob Melki, Morad | Vill bli kontaktade för mer information |

**Implikation:** Vägledning för att välja rätt avtal behöver bli tydligare på sidan.

---

### 2. Spara pengar / sänka kostnader

| Exempel | Meddelande |
|---------|------------|
| Annalena | "Jag behöver hjälp med sänka min elkostnader – jag har fått nog utav dessa överpriser" |
| Lukas, Emerson | "Behöver hjälp att sänka mina elkostnader" |
| Stig Johansson, Anders, Christina | "Sänka elkostnader / el kostnaden" |

---

### 3. Tekniska problem i flödet

| Exempel | Meddelande |
|---------|------------|
| Ulf Johansson | "Jag har fyllt i alla uppgifter men lyckas inte teckna något avtal" |
| Per-Ove Carlsson | "Hur får jag rabatten genom Elchef200?" |

**Implikation:** Felsök tecknandeflödet; tydliggör hur kampanjkoder/rabatter fungerar.

---

### 4. Företagsinfo / legitimitet

| Exempel | Meddelande |
|---------|------------|
| Thomas Allgoth | "Var finner jag erat juridiska företagsnamn och regnr?" |
| Morad | "Nyfiken att veta mer om er" |

**Implikation:** Synliggör juridiskt namn, org.nr och företagsinfo (t.ex. i footer).

---

### 5. Solceller

| Exempel | Meddelande |
|---------|------------|
| Thomas Bengtsson | "Om man har solceller ca 9 kW – vilket elbolag ska man välja?" |
| Jonas Schützer Larsson | Solceller 14.4 kWp – negativt pris på överskottsel, "total förlust" |
| Gustav Wiebe | Luft-vattenpump + solceller 12–13 kW – intresserad av besparing mot Eon |
| Christer Backéus | "Säljer billigt och köper dyrt – önskar info hur jag ska hantera det" |
| Witold | "Har solceller och batterier – letar efter billig el" |

**Implikation:** Egen sektion/FAQ för solcelleägare (överskottsel, negativa priser, batterier).

---

### 6. Särskilda situationer

| Situation | Exempel | Meddelande |
|-----------|---------|------------|
| Kombination fast + rörligt | Therese | "Kan man ha fast pris dec–mars och rörligt resten av året? Vi bor villa område 3" |
| Hyresvärd | Johnny ewert | "Har en hyresfastighet – jag undrar vad jag kan få för pris?" |
| Fritidsvilla | Susan Blomberg | "3 personer, fritidsvilla elområde 4 – Eon – tjänar vi på att byta?" |
| Dolda avgifter | Emma | "Kolla svärfars elavtal – finns det dolda avgifter?" |
| Konkret byte | Tetiana | Vill byta från Fortum till Elchef rörligt – bostadsrätt, angivit ID |

---

### 7. Negativ feedback – GrokChat/AI

| Citat | Problem |
|-------|---------|
| "Jag är riktigt irriterad på er – eran AI under all kritik som inte ens kan läsa" | Fakturaanalys/OCR fungerar dåligt |
| "Jag hittar inget på listade elavtal om försäljning av el – vilka villkor gäller?" | Otydlig info om villkor |

**Implikation:** Förbättra fakturaanalys (fallback vid OCR-fel, tydligare felmeddelanden); förtydliga villkorsinfo.

---

### 8. Nätavgift – förvirring

| Exempel | Meddelande |
|---------|------------|
| Ingvar Jensen | "Det är nätavgiften – den fasta biten som ska sänkas. Jag betalar mer till den fasta biten än för min elförbrukning 6 månader om året" |
| Theo Ahnfeldt | "Kan ni gå förbi packet som äger ledningen/tråden? Det är ju de som ockrar" |

**Implikation:** Tydlig förklaring av skillnaden mellan elhandel (leverantör) och elnät – ni hjälper med leverantören, inte nätavgiften.

---

## Koncept: Värdefull info innan registrering

**Problem:** Många vet inte vad de ska göra – och har inte ens börjat. Registrering sker först när de klickar på affiliate-länk hos leverantören (postnummer, förbrukning etc. fylls i där).

**Idé:** Ge värdefull information *innan* postnummer/registrering – så besökare får hjälp direkt, bygger förtroende och vet vad nästa steg är.

**Data ni redan har:**

| Data | Användning |
|------|------------|
| **Billigast just nu** | Leverantör som är billigast för SE3, 12 000 kWh (standard). Visa t.ex. "Billigast idag: Cheap Energy" |
| **Rekommenderat** | Leverantörer med `is_recommended` – visa "Rekommenderat idag: X, Y" |
| **Trustpilot** | Omdömen/rating – redan på sidan |
| **Trygghetsbadges** | "100% säkert", "Ingen bindningstid" – redan på rorligt-avtal-v2 |
| **Prisnivåer** | Spotpris, fastpris 6m/12m per elområde – HeroPriceWidget kräver postnummer |

**Konkret funktion:** En sektion på startsidan (eller direkt under Hero) som visar t.ex.:

1. **"Billigast just nu"** – leverantör + ungefärligt pris (SE3, 12k kWh som default)
2. **"Rekommenderat idag"** – 1–2 leverantörer vi rekommenderar
3. **Kort vägledning** – "Rörligt passar de flesta. Fastpris ger trygghet mot svängningar."
4. **Trygghetsbadges** – 100% säkert, ingen bindning, avtal sägs upp automatiskt

Allt utan att användaren fyller i postnummer. När de känner sig trygga kan de klicka "Se rörligt avtal" → fyller i postnummer/förbrukning → klickar affiliate-länk.

---

## Förbättringsförslag – prioriterad lista

| Prioritet | Åtgärd | Källa |
|-----------|--------|-------|
| 1 | **Värdefull info innan postnummer** – Visa "billigast just nu", rekommenderat, vägledning och trygghetsbadges på startsidan utan krav på postnummer | Pawel, Mika, m.fl. |
| 2 | **Vägledning "Vad passar mig?"** – FAQ eller interaktiv guide | Pawel, Mika, m.fl. |
| 3 | **Solceller** – särskild sektion/FAQ för solcelleägare | Thomas B., Jonas, Gustav, Christer |
| 4 | **Tekniska fel** – felsök tecknandeflödet | Ulf Johansson |
| 5 | **Juridiskt namn & org.nr** – synlig i footer | Thomas Allgoth |
| 6 | **GrokChat/fakturaanalys** – fallback vid OCR-fel, tydligare fel | GrokChat-feedback |
| 7 | **Nät vs leverantör** – tydlig förklaring (ni hjälper inte med nätavgiften) | Ingvar, Theo |
| 8 | **Kombination fast/rörligt** – förklara om det går (dec–mars fast, resten rörligt) | Therese |
| 9 | **Rabatt/kampanjkoder** – tydliggör hur Elchef200/rabatter används | Per-Ove |

---

## Data och källor

- **Källa:** Telegram ChatExport 2026-02-27 (`messages.html`)
- **Period:** 2025-07-11 – 2026-02-27
- **Meddelanden med text:** ca 179
- **GrokChat-sammanfattning:** Via `/api/admin/telegram-summary?days=7`

Se även: `CHATLOG_ANALYS_60D.md` för GrokChat-detaljer.
