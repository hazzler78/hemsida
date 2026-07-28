# Mall för länkar i sociala medier – Elchef

Använd dessa länkar när ni postar på Elchefs sociala kanaler. Då syns trafiken korrekt i admin-dashboarden under "Sociala medier".

---

## Kortlänkar (rekommenderas – enkla att komma ihåg)

| Plattform | Kortlänk | Landar på |
|-----------|----------|-----------|
| **YouTube** | `https://www.elchef.se/yt` | fakturaanalys + UTM |
| **Facebook** | `https://www.elchef.se/fb` | fakturaanalys · facebook / bio |
| **Instagram** | `https://www.elchef.se/ig` | fakturaanalys · instagram / bio (**länk i bio**) |
| **TikTok** | `https://www.elchef.se/tt` | fakturaanalys · tiktok / bio |
| **Pinterest** | `https://www.elchef.se/pin` | fakturaanalys + UTM |
| **X (Twitter)** | `https://www.elchef.se/x` | fakturaanalys + UTM |
| **LinkedIn** | `https://www.elchef.se/in` | fakturaanalys + UTM |
| **Snapchat** | `https://www.elchef.se/snap` | fakturaanalys + UTM |

Bio: räcker med `https://www.elchef.se/ig`. Extra `?utm_campaign=…&utm_content=…` från Reels **behålls** (middleware merge).

---

## Fullständiga länkar (med UTM)

*Kortlänkarna ovan redirectar via `src/middleware.ts` till fakturaanalys.*

### Facebook
```
https://www.elchef.se/fb
```

### Instagram (bio / Stories)
```
https://www.elchef.se/ig
```

### TikTok
```
https://www.elchef.se/tt
```

### Pinterest
```
https://elchef.se?utm_source=pinterest&utm_medium=social
```

### YouTube (videobeskrivning, pinnade kommentar)
```
https://elchef.se?utm_source=youtube&utm_medium=social
```

### X (Twitter)
```
https://elchef.se?utm_source=x&utm_medium=social
```

### LinkedIn
```
https://elchef.se?utm_source=linkedin&utm_medium=social
```

### Snapchat
```
https://elchef.se?utm_source=snapchat&utm_medium=social
```

---

## Kortlänkar till specifika sidor

För sidor utöver startsidan, använd dessa mönster (kortlänk + sida):

| Mål | YouTube | Facebook | Instagram | TikTok | Pinterest | X |
|-----|---------|----------|-----------|--------|-----------|---|
| **Startsida** | elchef.se/yt | elchef.se/fb | elchef.se/ig | elchef.se/tt | elchef.se/pin | elchef.se/x |
| **Jämför elpriser** | elchef.se/jamfor-elpriser?utm_source=youtube&utm_medium=social | elchef.se/jamfor-elpriser?utm_source=facebook&utm_medium=social | elchef.se/jamfor-elpriser?utm_source=instagram&utm_medium=social | elchef.se/jamfor-elpriser?utm_source=tiktok&utm_medium=social | elchef.se/jamfor-elpriser?utm_source=pinterest&utm_medium=social | elchef.se/jamfor-elpriser?utm_source=x&utm_medium=social |
| **Fakturaanalys** | elchef.se/fakturaanalys?utm_source=youtube&utm_medium=social | elchef.se/fakturaanalys?utm_source=facebook&utm_medium=social | elchef.se/fakturaanalys?utm_source=instagram&utm_medium=social | elchef.se/fakturaanalys?utm_source=tiktok&utm_medium=social | elchef.se/fakturaanalys?utm_source=pinterest&utm_medium=social | elchef.se/fakturaanalys?utm_source=x&utm_medium=social |
| **Byt elavtal** | elchef.se/byt-elavtal?utm_source=youtube&utm_medium=social | elchef.se/byt-elavtal?utm_source=facebook&utm_medium=social | elchef.se/byt-elavtal?utm_source=instagram&utm_medium=social | elchef.se/byt-elavtal?utm_source=tiktok&utm_medium=social | elchef.se/byt-elavtal?utm_source=pinterest&utm_medium=social | elchef.se/byt-elavtal?utm_source=x&utm_medium=social |

---

## Spåra specifikt inlägg eller video

Lägg till `&utm_campaign=` med ett kort namn för att se vilket inlägg eller vilken video som driver trafiken:

**Exempel – YouTube-video "Så byter du elavtal 2025":**
```
https://elchef.se?utm_source=youtube&utm_medium=social&utm_campaign=byta-elavtal-2025
```

**Exempel – Facebook-inlägg om sommarpriser:**
```
https://elchef.se?utm_source=facebook&utm_medium=social&utm_campaign=sommarpriser
```

Dessa visas under "Aktiva kampanjer" i admin-dashboarden.

---

## Snabbkopiering

| Plattform | Kortlänk |
|-----------|----------|
| **YouTube** | `https://elchef.se/yt` |
| **Facebook** | `https://elchef.se/fb` |
| **Instagram** | `https://elchef.se/ig` → fakturaanalys (**länk i bio**; caption-URL:er är inte klickbara) |
| **TikTok** | `https://elchef.se/tt` |
| **Pinterest** | `https://elchef.se/pin` |
| **X** | `https://elchef.se/x` |
| **LinkedIn** | `https://elchef.se/in` |
| **Snapchat** | `https://elchef.se/snap` |

---

*Kortlänkarna redirectar till startsidan med rätt UTM-parametrar. Data visas i Admin → Dashboard → Sociala medier.*
