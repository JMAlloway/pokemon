-- Add eBay item ID and URL to RecentSoldListing for verifiable sold comp links
ALTER TABLE "RecentSoldListing" ADD COLUMN "ebayItemId" VARCHAR(100);
ALTER TABLE "RecentSoldListing" ADD COLUMN "ebayUrl" VARCHAR(500);
