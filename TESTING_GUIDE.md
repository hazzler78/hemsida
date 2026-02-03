# Guide för att testa Cheap Energy Automation

## Viktigt: Automation fungerar BARA lokalt

Automationen kräver Playwright som bara fungerar i Node.js runtime. På Cloudflare Pages (Edge Runtime) kommer automationen returnera ett felmeddelande.

## Snabbstart för lokal testning

### 1. Installera Playwright browsers

```bash
npx playwright install chromium
```

### 2. Starta dev server

```bash
npm run dev
```

Servern startar på `http://localhost:3000`

### 3. Testa via test-sidan

Gå till: `http://localhost:3000/test-cheap-energy-chat`

Denna sida har:
- Instruktioner för hur man testar
- CheapEnergyChat-komponenten integrerad
- Tips om vad man ska titta efter

### 4. Testa via huvudchatten (Grodan)

1. Gå till startsidan: `http://localhost:3000`
2. Klicka på chat-ikonen (Grodan)
3. Skriv något som: "Jag vill byta till Cheap Energy med rörligt avtal"
4. AI:n kommer föreslå att använda automation
5. Klicka på "Starta automation ⚡"-knappen
6. Följ instruktionerna i Cheap Energy-chatten

## Testa direkt via API

### Metod 1: PowerShell (Windows)

```powershell
# Testa ett enkelt steg (postnummer)
$body = @{
    sessionId = "test-session-$(Get-Date -Format 'yyyyMMddHHmmss')"
    action = "fill_postnummer"
    data = @{
        postnummer = "12345"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/cheap-energy-automation" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Metod 2: Fullständigt flöde (PowerShell)

```powershell
$body = @{
    sessionId = "test-full-flow-$(Get-Date -Format 'yyyyMMddHHmmss')"
    steps = @(
        @{ action = "fill_postnummer"; data = @{ postnummer = "12345" } },
        @{ action = "fill_forbrukning"; data = @{ forbrukning = "5000" } },
        @{ action = "select_contract_type"; data = @{} },
        @{ action = "fill_personnummer"; data = @{ personnummer = "199001011234" } },
        @{ action = "confirm_address"; data = @{ confirmed = $true } },
        @{ action = "fill_contact_details"; data = @{
            email = "test@example.com"
            telefon = "0701234567"
            tilltradesdatum = "2026-03-01"
            betalsatt = "autogiro"
        }},
        @{ action = "submit_form"; data = @{} }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/cheap-energy-automation" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

## Vad ska du kontrollera?

### 1. Loggar i Supabase

Alla steg loggas till `cheap_energy_automation_logs` tabellen:

```sql
SELECT * FROM cheap_energy_automation_logs 
WHERE session_id = 'ditt-session-id' 
ORDER BY created_at DESC;
```

Kontrollera:
- ✅ Varje steg har status `completed`
- ✅ `step_data` innehåller rätt information
- ✅ Inga `failed` statusar
- ✅ `signing_url` finns när formuläret är skickat

### 2. Browser-fönster (om headless: false)

Om du ändrar `headless: false` i koden kan du se browser-fönstret:
- ✅ Formuläret fylls i korrekt
- ✅ Rätt knappar klickas
- ✅ Inga felmeddelanden på sidan
- ✅ Redirect till signeringssidan fungerar

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

### Problem: "Browser automation är inte tillgängligt i Edge Runtime"

**Lösning:** Detta betyder att koden körs i Edge Runtime. Kontrollera att:
- Du kör `npm run dev` lokalt (inte på Cloudflare Pages)
- `export const runtime = 'edge'` är borttaget eller kommenterat ut i `route.ts`

### Problem: Playwright hittas inte

**Lösning:**
```bash
npm install playwright
npx playwright install chromium
```

### Problem: Selectors hittas inte

**Lösning:** Cheap Energy kan ha ändrat sitt formulär. Kontrollera:
- Öppna Cheap Energy-sidan manuellt
- Inspektera HTML-strukturen
- Uppdatera selectors i `route.ts`

### Problem: Timeout-fel

**Lösning:** Formuläret kan ta tid att ladda. Öka timeout-värden i koden:
```typescript
await page.waitForSelector(selector, { timeout: 15000 }); // Öka från 10000
```

## Testdata

### Postnummer
- `12345` (Stockholm)
- `41301` (Göteborg)
- `21115` (Malmö)

### Personnummer (testdata)
- `199001011234` (1990-01-01)
- `198505151234` (1985-05-15)

### Årsförbrukning
- `2000` kWh/år
- `5000` kWh/år
- `20000` kWh/år

### Betalsätt
- `autogiro`
- `kort`
- `faktura`

## Nästa steg efter testning

1. **Verifiera att alla selectors fungerar** - Testa med olika postnummer och personnummer
2. **Kontrollera felhantering** - Testa med ogiltiga värden
3. **Optimera timeout-värden** - Justera baserat på faktiska laddtider
4. **Förbättra felmeddelanden** - Ge tydligare feedback till användaren
5. **Lägg till retry-logik** - Försök igen vid tillfälliga fel

## Tips

- Använd unika `sessionId` för varje test
- Testa ett steg i taget först för att isolera problem
- Kontrollera browser-konsolen för JavaScript-fel
- Ta screenshots vid fel för att debugga
- Loggarna i Supabase visar exakt vad som händer vid varje steg
