# GrokChat-analys – senaste 60 dagarna

Baserat på 76 chatloggposter (GrokChat på sajten, inte Telegram).

---

## Topp 10 mest återkommande teman/fraser

| # | Tema / fras | Antal ungefär | Beskrivning |
|---|-------------|---------------|-------------|
| 1 | **"Jag väljer rörligt/fastpris"** | ~15 | Tydligt avtalsval, brukar leda till CTA |
| 2 | **"Vad kostar Cheap Energy?" / "Billigast elpris"** | ~12 | Fokus på pris och Cheap Energy |
| 3 | **"Hur vet jag om jag betalar för mycket?"** | ~5 | Osäkerhet kring nuvarande kostnad |
| 4 | **"När jag byter – sägs mitt avtal upp automatiskt?"** | ~3 | Rädsla för processen |
| 5 | **"Vilket avtal passar mig?" (lägenhet, låg förbrukning)** | ~4 | Behov av personlig rekommendation |
| 6 | **"Har ni Greenely/Tibber/X?"** | ~6 | Koll på specifika leverantörer |
| 7 | **"Jag vill byta" / "Byta elavtal"** | ~8 | Bytet-intention |
| 8 | **"Får jag välja vilket elbolag?"** | ~2 | Kontroll över valet |
| 9 | **"Vad är skillnaden rörligt vs fastpris?"** | ~4 | Behöver tydlighet |
| 10 | **"Eon/Vattenfall – stannar de kvar?" (nätbolag)** | ~2 | Förvirring nät vs leverantör |

---

## Leverantörer som nämns oftast

- **Cheap Energy** – mest förekommande (priser, "billigast")
- **Greenely** – flera frågor om tillgänglighet och info
- **Svealands Elbolag** – fastpris
- **Eon** – nuvarande leverantör
- **Vattenfall** – jämförelser
- **GodEl / Göta Energi** – enstaka frågor

---

## Exempel som visar varför man tvekar

1. *"Jag hittar inget på listade elavtal om försäljning av el. Vilka villkor gäller där?"*  
   → Otydlighet kring villkor.

2. *"När jag byter säger mitt befintliga upp då automatiskt?"*  
   → Rädsla att missa uppsägning.

3. *"Jag undrar hur jag vet om vad jag betalar och hur jag vet att jag kan få bättre."*  
   → Behov av tydlig besparingsinformation.

4. *"Den info som finns om Greenly stämmer inte... falsk marknadsföring."*  
   → Misstro mot information.

5. *"jag är riktigt irriterad på er – er AI under all kritik som inte ens kan läsa av mina fakturor."*  
   → Negativ upplevelse av fakturaanalys.

---

## Rekommenderade FAQ-punkter (baserat på chatten)

1. **Uppsägning** – "Sägs mitt avtal upp automatiskt när jag byter?"  
2. **Tid** – "Hur lång tid tar bytet?" (1–4 veckor)  
3. **Bindningstid** – "De flesta avtal har 0–3 månaders uppsägningstid."  
4. **Rörligt vs fastpris** – kort jämförelse + rekommendation  
5. **Nätbolag** – "Eon/Vattenfall kan fortfarande vara nätbolag – du byter bara leverantör."  
6. **Villkor** – "Villkoren visas tydligt innan du registrerar – ingen dold information."

---

## Statistik

- **Totalt antal chatloggposter**: 76 (60 dagar)  
- **Unika sessioner**: ~50+  
- **Andel som leder till CTA** ("Jag väljer rörligt/fastpris", "Ja", "Teckna avtal"): ~35 %

---

## Telegram-sammanfattning

En sammanfattning av GrokChat kan skickas till Telegram:

1. **Från admin-dashboard**: Klicka på "📤 GrokChat till Telegram" under "Djupdyk i data"
2. **Via API**: `GET /api/admin/telegram-summary?days=7` med header `x-admin-password: <lösenord>`
3. **Cron**: Anropa samma URL via Cloudflare Cron för veckovis sammanfattning

Sammanfattningen innehåller: antal chattutbyten, vanligast nämnda leverantörer, exempel på frågor.
