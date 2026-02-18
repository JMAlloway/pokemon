-- AlterTable: widen priceGapPercent from Decimal(6,2) to Decimal(10,2)
-- A $0.04 card with $50 listings = 124,900% gap, which overflows Decimal(6,2) max of 9999.99
ALTER TABLE "EbayListing" ALTER COLUMN "priceGapPercent" TYPE DECIMAL(10,2);
