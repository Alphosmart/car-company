-- Add vehicle segmentation fields used by navbar inventory categories
ALTER TABLE "Car"
ADD COLUMN IF NOT EXISTS "vehicleType" TEXT NOT NULL DEFAULT 'car';

ALTER TABLE "Car"
ADD COLUMN IF NOT EXISTS "segment" TEXT;
