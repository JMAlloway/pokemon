-- CreateEnum
CREATE TYPE "BuyingOption" AS ENUM ('FIXED_PRICE', 'AUCTION');

-- AlterTable
ALTER TABLE "EbayListing" ADD COLUMN "buyingOption" "BuyingOption" NOT NULL DEFAULT 'FIXED_PRICE';
ALTER TABLE "EbayListing" ADD COLUMN "bidCount" SMALLINT;
ALTER TABLE "EbayListing" ADD COLUMN "currentBidPrice" DECIMAL(10,2);
ALTER TABLE "EbayListing" ADD COLUMN "auctionEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EbayListing_buyingOption_idx" ON "EbayListing"("buyingOption");
