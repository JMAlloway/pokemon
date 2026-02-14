-- Widen ebayUrl from VARCHAR(500) to TEXT to handle long Browse API URLs
ALTER TABLE "RecentSoldListing" ALTER COLUMN "ebayUrl" TYPE TEXT;
