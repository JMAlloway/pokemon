-- Per-search listing snapshots: prevent cross-search contamination
--
-- Previously, EbayListing had a globally unique ebayListingId. When the same
-- eBay listing appeared in multiple search queries, the last search to run
-- would overwrite analysis fields (typo flags, deal scores, baselines) for
-- all searches. This migration changes to per-search snapshots where each
-- search query gets its own copy of the listing with independent analysis.

-- Step 1: Drop the old SavedListing FK that references EbayListing.ebayListingId
ALTER TABLE "SavedListing" DROP CONSTRAINT IF EXISTS "SavedListing_ebayListingId_fkey";

-- Step 2: Add listingId column to SavedListing (FK to EbayListing.id)
-- Populate it from the existing ebayListingId relationship
ALTER TABLE "SavedListing" ADD COLUMN "listingId" UUID;

UPDATE "SavedListing" sl
SET "listingId" = el."id"
FROM "EbayListing" el
WHERE sl."ebayListingId" = el."ebayListingId";

-- Remove any orphaned SavedListings that don't match an EbayListing
DELETE FROM "SavedListing" WHERE "listingId" IS NULL;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE "SavedListing" ALTER COLUMN "listingId" SET NOT NULL;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_key" UNIQUE ("listingId");

-- Step 3: Add the new FK from SavedListing.listingId to EbayListing.id
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "EbayListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Drop the old unique constraint on EbayListing.ebayListingId
ALTER TABLE "EbayListing" DROP CONSTRAINT IF EXISTS "EbayListing_ebayListingId_key";

-- Step 5: Drop the old unique constraint on SavedListing.ebayListingId
-- (keep the column for display/monitoring, just not as a unique FK)
ALTER TABLE "SavedListing" DROP CONSTRAINT IF EXISTS "SavedListing_ebayListingId_key";

-- Step 6: Add compound unique constraint on EbayListing (searchQueryId + ebayListingId)
ALTER TABLE "EbayListing" ADD CONSTRAINT "EbayListing_searchQueryId_ebayListingId_key"
  UNIQUE ("searchQueryId", "ebayListingId");

-- Step 7: Add index on SavedListing.ebayListingId for monitoring queries
CREATE INDEX IF NOT EXISTS "SavedListing_ebayListingId_idx" ON "SavedListing"("ebayListingId");
