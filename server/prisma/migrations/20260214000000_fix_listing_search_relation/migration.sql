-- Add listingId column to SavedListing if it doesn't already exist
ALTER TABLE "SavedListing" ADD COLUMN IF NOT EXISTS "listingId" UUID;

-- Populate listingId from the existing ebayListingId → EbayListing.id mapping
UPDATE "SavedListing" sl
SET "listingId" = el."id"
FROM "EbayListing" el
WHERE el."ebayListingId" = sl."ebayListingId"
  AND sl."listingId" IS NULL;

-- Remove any orphaned SavedListings that couldn't be mapped
DELETE FROM "SavedListing" WHERE "listingId" IS NULL;

-- Make listingId NOT NULL now that data is populated
ALTER TABLE "SavedListing" ALTER COLUMN "listingId" SET NOT NULL;

-- Drop old FK constraint on SavedListing.ebayListingId → EbayListing.ebayListingId (if exists)
ALTER TABLE "SavedListing" DROP CONSTRAINT IF EXISTS "SavedListing_ebayListingId_fkey";

-- Drop old unique constraint on SavedListing.ebayListingId (if exists)
DROP INDEX IF EXISTS "SavedListing_ebayListingId_key";

-- Drop old unique constraint on EbayListing.ebayListingId (if exists)
DROP INDEX IF EXISTS "EbayListing_ebayListingId_key";

-- Add compound unique constraint on EbayListing (searchQueryId + ebayListingId)
CREATE UNIQUE INDEX IF NOT EXISTS "EbayListing_searchQueryId_ebayListingId_key" ON "EbayListing"("searchQueryId", "ebayListingId");

-- Add new FK constraint on SavedListing.listingId → EbayListing.id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SavedListing_listingId_fkey') THEN
    ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "EbayListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add composite unique on SavedListing (userId + ebayListingId) to prevent duplicate saves
CREATE UNIQUE INDEX IF NOT EXISTS "SavedListing_userId_ebayListingId_key" ON "SavedListing"("userId", "ebayListingId");

-- Add unique constraint on SavedListing.listingId
CREATE UNIQUE INDEX IF NOT EXISTS "SavedListing_listingId_key" ON "SavedListing"("listingId");
