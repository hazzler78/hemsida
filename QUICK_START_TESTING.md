# Snabbstart: Testa Cheap Energy Automation Lokalt

## Steg 1: Installera Playwright browsers

```bash
npx playwright install chromium
```

## Steg 2: Starta dev server

```bash
npm run dev
```

Servern startar på `http://localhost:3000`

## Steg 3: Testa automationen

### Alternativ A: Via test-sidan (enklast)

1. Gå till: `http://localhost:3000/test-cheap-energy-chat`
2. Klicka på chat-ikonen längst ner till höger
3. Följ instruktionerna i chatten:
   - Skriv ditt postnummer (t.ex. "12345")
   - Välj årsförbrukning (1, 2 eller 3)
   - Skriv personnummer (t.ex. "199001011234")
   - Svara på adressbekräftelse (Ja/Nej)
   - Fyll i kontaktuppgifter (e-post, telefon, etc.)
4. Automationen körs automatiskt i bakgrunden när du skickar formuläret

### Alternativ B: Via huvudchatten (Grodan)

1. Gå till: `http://localhost:3000`
2. Klicka på chat-ikonen (Grodan)
3. Skriv: "Jag vill byta till Cheap Energy med rörligt avtal"
4. AI:n kommer föreslå automation
5. Klicka på "Starta automation ⚡"-knappen
6. Följ instruktionerna i Cheap Energy-chatten

### Alternativ C: Direkt via API (för avancerad testning)

Se `TEST_LOCAL_AUTOMATION.md` för PowerShell/Bash-exempel.

## Vad ska du kontrollera?

### 1. Loggar i Supabase

Kontrollera att alla steg loggas korrekt:

```sql
SELECT * FROM cheap_energy_automation_logs 
WHERE session_id = 'ditt-session-id' 
ORDER BY created_at DESC;
```

Varje steg bör ha:
- ✅ Status: `completed`
- ✅ `step_data` innehåller rätt information
- ✅ Inga `failed` statusar
- ✅ `signing_url` finns när formuläret är skickat

### 2. Browser-fönster (för debugging)

Om du vill se browser-fönstret, ändra i `route.ts`:

```typescript
const browser = await chromium.launch({ headless: false }); // Ändra till false
```

Då kan du se exakt vad som händer i browser-fönstret.

### 3. API-svar

Kontrollera att API:et returnerar:

```json
{
  "success": true,
  "results": {
    "postnummer": "completed",
    "forbrukning": "completed",
    "contractType": "completed",
    "personnummer": "completed",
    "addressConfirmation": "completed",
    "contactDetails": "completed",
    "submit": "completed",
    "signingUrl": "https://avtal.cheapenergy.se/..."
  }
}
```

## Vanliga problem

### "Browser automation är inte tillgängligt i Edge Runtime"

**Lösning:** Detta betyder att koden körs i Edge Runtime. Kontrollera att:
- Du kör `npm run dev` lokalt (inte på Cloudflare Pages)
- `export const runtime = 'edge'` är kommenterat ut i `route.ts` (rad 8)

### Playwright hittas inte

**Lösning:**
```bash
npm install playwright
npx playwright install chromium
```

### Selectors hittas inte

**Lösning:** Cheap Energy kan ha ändrat sitt formulär. Kontrollera:
- Öppna Cheap Energy-sidan manuellt
- Inspektera HTML-strukturen
- Uppdatera selectors i `route.ts`

## Testdata

- **Postnummer:** `12345` (Stockholm), `41301` (Göteborg), `21115` (Malmö)
- **Personnummer:** `199001011234` (1990-01-01)
- **Årsförbrukning:** `2000`, `5000`, eller `20000` kWh/år
- **Betalsätt:** `autogiro`, `kort`, eller `faktura`

## Tips

- Använd unika `sessionId` för varje test
- Testa ett steg i taget först för att isolera problem
- Kontrollera browser-konsolen för JavaScript-fel
- Loggarna i Supabase visar exakt vad som händer vid varje steg
