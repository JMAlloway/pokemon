-- AlterTable
ALTER TABLE "RecentSoldListing" ADD COLUMN "listingTitle" TEXT;

-- Clear old sold data that predates graded-card filtering so it gets
-- re-fetched with proper title data on the next search execution.
DELETE FROM "RecentSoldListing" WHERE "listingTitle" IS NULL;
