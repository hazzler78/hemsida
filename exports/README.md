# Exporterade Filer

Detta är exporterade filer för postnummer och elområden. Dessa filer kan kopieras direkt till andra projekt.

## Snabbstart

### 1. Exportera filer

```bash
# Exportera alla format
npm run export:postal

# Eller specifikt format
npm run export:postal:json    # JSON
npm run export:postal:ts       # TypeScript
npm run export:postal:sql      # SQL
```

### 2. Kopiera till ditt projekt

Välj det format som passar ditt projekt och kopiera filen.

## Tillgängliga Format

### `postal-to-area.json`
- **Format:** JSON med metadata och data
- **Användning:** API:er, web-applikationer, Python-projekt
- **Storlek:** ~320 KB

### `postal-to-area-array.json`
- **Format:** JSON array med objekt
- **Användning:** När du behöver iterera över alla postnummer
- **Storlek:** ~320 KB

### `postal-to-area.ts`
- **Format:** TypeScript-modul med typer och funktioner
- **Användning:** TypeScript/Next.js/React-projekt
- **Storlek:** ~500 KB
- **Innehåller:** 
  - `POSTAL_TO_AREA` - Record med alla mappningar
  - `getPriceAreaFromPostalCode()` - Funktion för lookup
  - `isValidSwedishPostalCode()` - Validering
  - `PRICE_AREAS` - Information om områden

### `postal-to-area.js`
- **Format:** Standalone JavaScript (fungerar överallt)
- **Användning:** Node.js, vanilla JavaScript, browser
- **Storlek:** ~500 KB
- **Stödjer:** CommonJS och ES6 modules

### `postal-to-area.sql`
- **Format:** SQL INSERT-statements
- **Användning:** Databaser (SQLite, PostgreSQL, MySQL)
- **Storlek:** ~800 KB
- **Innehåller:** CREATE TABLE och INSERT-statements

## Exempel

### TypeScript/Next.js
```typescript
import { getPriceAreaFromPostalCode } from './postal-to-area';
const area = getPriceAreaFromPostalCode('10004'); // 'se3'
```

### JavaScript/Node.js
```javascript
const { getPriceAreaFromPostalCode } = require('./postal-to-area');
const area = getPriceAreaFromPostalCode('10004'); // 'se3'
```

### Python
```python
import json
with open('postal-to-area.json') as f:
    data = json.load(f)
area = data['postalCodes'].get('10004', 'se3')
```

### SQL
```sql
SELECT area_code FROM postal_to_area WHERE postal_code = '10004';
```

## Uppdatering

Filer i denna mapp ignoreras i git (se `.gitignore`). 
För att uppdatera filerna, kör export-scriptet igen.

## Mer Information

Se `../EXPORT_GUIDE.md` för detaljerad guide om hur du använder dessa filer i olika projekt.
