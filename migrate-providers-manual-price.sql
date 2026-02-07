-- Manual price fields for providers (used for sorting "billigast först" and for providers without prisfil)
-- Run once: wrangler d1 execute <DB_NAME> --file=./migrate-providers-manual-price.sql
ALTER TABLE page_providers ADD COLUMN manual_monthly_fee_kr REAL;
ALTER TABLE page_providers ADD COLUMN manual_surcharge_ore_per_kwh REAL;
