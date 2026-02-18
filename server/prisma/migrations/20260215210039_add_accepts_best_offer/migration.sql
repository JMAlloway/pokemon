-- AlterTable
ALTER TABLE "EbayListing" ADD COLUMN     "acceptsBestOffer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SellerProfile" (
    "id" UUID NOT NULL,
    "sellerName" VARCHAR(255) NOT NULL,
    "totalListingsSeen" INTEGER NOT NULL DEFAULT 0,
    "dealsCount" INTEGER NOT NULL DEFAULT 0,
    "typosCount" INTEGER NOT NULL DEFAULT 0,
    "avgDealScore" DECIMAL(5,2),
    "avgPriceGapPercent" DECIMAL(6,2),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardNames" VARCHAR(255)[],

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" UUID NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "set" VARCHAR(100),
    "baselinePrice" DECIMAL(10,2) NOT NULL,
    "sampleSize" SMALLINT NOT NULL,
    "recencyScore" DECIMAL(5,2),
    "source" VARCHAR(50) NOT NULL DEFAULT 'search',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerProfile_sellerName_key" ON "SellerProfile"("sellerName");

-- CreateIndex
CREATE INDEX "SellerProfile_dealsCount_idx" ON "SellerProfile"("dealsCount" DESC);

-- CreateIndex
CREATE INDEX "SellerProfile_sellerName_idx" ON "SellerProfile"("sellerName");

-- CreateIndex
CREATE INDEX "MarketSnapshot_cardName_capturedAt_idx" ON "MarketSnapshot"("cardName", "capturedAt");

-- CreateIndex
CREATE INDEX "MarketSnapshot_capturedAt_idx" ON "MarketSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "SavedListing_listingId_idx" ON "SavedListing"("listingId");
