# Cheap Energy Formulär - Anteckningar

## Problem
Cheap Energy's SalesysForm fungerar inte med formId: `tmp-9075a4d0-eca0-4466-86db-6ae1c41f05d9`

## Felmeddelanden
```
GET https://skaffa.salesys.se/api/offers/web-forms-v1/tmp-9075a4d0-eca0-4466-86db-6ae1c41f05d9/resources 400 (Bad Request)
Error: validationError
Error getting offer web form tmp-9075a4d0-eca0-4466-86db-6ae1c41f05d9 context
```

## Status
- ✅ SalesysForm-komponenten fungerar (testad med test-formId)
- ❌ Cheap Energy's formId är inte giltigt/aktivt
- 🔄 Tillfälligt lösning: Externa länk till Cheap Energy

## Nästa steg
1. Kontakta Emil från Salesys med felmeddelandena
2. Bekräfta att formId:et är aktivt
3. Få rätt formId för Cheap Energy
4. Testa formuläret igen
5. Implementera SalesysForm när det fungerar

## Datum
2025-01-12

## Kontakt
Emil från Salesys - behöver bekräfta Cheap Energy's formId
