-- Manual rate type for rörligt: 'hourly' (timpris) or 'monthly' (månadspris)
-- Run once: wrangler d1 execute elchef-tracking --remote --file=./migrate-providers-manual-rate-type.sql
ALTER TABLE page_providers ADD COLUMN manual_rate_type TEXT;
