-- Ensure CompanyProfile exists and supports homepage carousel media storage
CREATE TABLE IF NOT EXISTS "CompanyProfile" (
	"id" TEXT NOT NULL,
	"yearsInBusiness" INTEGER NOT NULL,
	"carsSold" INTEGER NOT NULL,
	"happyCustomers" INTEGER NOT NULL,
	"citiesServed" INTEGER NOT NULL,
	"team" JSONB[],
	"heroSlides" JSONB NOT NULL DEFAULT '[]'::JSONB,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CompanyProfile"
ADD COLUMN IF NOT EXISTS "heroSlides" JSONB NOT NULL DEFAULT '[]'::JSONB;
