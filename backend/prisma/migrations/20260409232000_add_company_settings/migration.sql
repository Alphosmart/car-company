-- Add configurable company settings storage
ALTER TABLE "CompanyProfile"
ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}'::JSONB;