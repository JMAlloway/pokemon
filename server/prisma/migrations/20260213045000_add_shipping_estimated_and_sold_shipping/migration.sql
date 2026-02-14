-- Add shippingEstimated flag to EbayListing
ALTER TABLE "EbayListing" ADD COLUMN "shippingEstimated" BOOLEAN NOT NULL DEFAULT false;

-- Add shippingCost to RecentSoldListing for real sold comp shipping data
ALTER TABLE "RecentSoldListing" ADD COLUMN "shippingCost" DECIMAL(10,2);
