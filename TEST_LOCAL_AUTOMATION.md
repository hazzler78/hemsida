# Testa Cheap Energy Automation Lokalt

## Förutsättningar

1. **Installera Playwright browsers** (om inte redan gjort):
```bash
npx playwright install chromium
```

2. **Kontrollera miljövariabler**:
Se till att du har en `.env.local` fil med:
```env
SUPABASE_URL=din_supabase_url
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key
```

## Starta Dev Server

```bash
npm run dev
```

Servern startar på `http://localhost:3000`

## Testa API Endpoint

### Metod 1: Med curl (PowerShell)

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

### Metod 2: Med curl (Bash/Git Bash)

```bash
# Testa ett enkelt steg (postnummer)
curl -X POST http://localhost:3000/api/cheap-energy-automation \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "action": "fill_postnummer",
    "data": { "postnummer": "12345" }
  }'
```

### Metod 3: Kör flera steg i sekvens (Rekommenderat)

**PowerShell:**
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

**Bash/Git Bash:**
```bash
curl -X POST http://localhost:3000/api/cheap-energy-automation \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-full-flow-123",
    "steps": [
      { "action": "fill_postnummer", "data": { "postnummer": "12345" } },
      { "action": "fill_forbrukning", "data": { "forbrukning": "5000" } },
      { "action": "select_contract_type", "data": {} },
      { "action": "fill_personnummer", "data": { "personnummer": "199001011234" } },
      { "action": "confirm_address", "data": { "confirmed": true } },
      { "action": "fill_contact_details", "data": {
        "email": "test@example.com",
        "telefon": "0701234567",
        "tilltradesdatum": "2026-03-01",
        "betalsatt": "autogiro"
      }},
      { "action": "submit_form", "data": {} }
    ]
  }'
```

## Testa med Postman eller Insomnia

1. **URL**: `POST http://localhost:3000/api/cheap-energy-automation`
2. **Headers**: `Content-Type: application/json`
3. **Body** (JSON):
```json
{
  "sessionId": "test-session-123",
  "steps": [
    { "action": "fill_postnummer", "data": { "postnummer": "12345" } },
    { "action": "fill_forbrukning", "data": { "forbrukning": "5000" } }
  ]
}
```

## Förväntat Svar

**Framgång:**
```json
{
  "success": true,
  "results": {
    "postnummer": "completed",
    "forbrukning": "completed",
    ...
  }
}
```

**Fel:**
```json
{
  "error": "Felmeddelande här"
}
```

## Kontrollera Loggar i Supabase

Alla steg loggas till `cheap_energy_automation_logs` tabellen. Du kan kontrollera:

```sql
SELECT * FROM cheap_energy_automation_logs 
WHERE session_id = 'test-session-123' 
ORDER BY created_at DESC;
```

## Felsökning

1. **Playwright hittas inte**: Kör `npx playwright install chromium`
2. **Supabase-fel**: Kontrollera att miljövariablerna är korrekta
3. **Timeout**: Formuläret kan ta tid att ladda, öka timeout i koden om nödvändigt
4. **Selector hittas inte**: Formuläret på Cheap Energy kan ha ändrats, kontrollera selectors

## Testa Endast Ett Steg

För att testa ett specifikt steg i taget:

```powershell
# Testa bara postnummer
$body = @{
    sessionId = "test-postnummer"
    action = "fill_postnummer"
    data = @{ postnummer = "12345" }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/cheap-energy-automation" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

## Tips

- Använd unika `sessionId` för varje test för att undvika konflikter
- Testa ett steg i taget först för att isolera problem
- Kontrollera browser-konsolen om du kör Playwright i non-headless mode (ändra `headless: false` i koden)
- Loggarna i Supabase visar exakt vad som händer vid varje steg
