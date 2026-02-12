-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('common', 'uncommon', 'rare', 'holoRare', 'other');

-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('mint', 'nearMint', 'excellent', 'good', 'fair', 'poor');

-- CreateEnum
CREATE TYPE "SearchFrequency" AS ENUM ('manual', 'hourly', 'fourHourly', 'daily', 'weekly');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('active', 'sold', 'delisted');

-- CreateEnum
CREATE TYPE "TypoCategory" AS ENUM ('cardName', 'setName', 'rarity', 'condition');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('eBaySearch', 'PriceBaseline', 'SavedDealsMonitoring');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "set" VARCHAR(100),
    "rarity" "Rarity",
    "condition" "Condition",
    "searchFrequency" "SearchFrequency" NOT NULL DEFAULT 'manual',
    "priceThresholdPercent" DECIMAL(5,2),
    "recencyScoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbayListing" (
    "id" UUID NOT NULL,
    "ebayListingId" TEXT NOT NULL,
    "searchQueryId" UUID NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "listingTitle" VARCHAR(500) NOT NULL,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "recentSoldPrice" DECIMAL(10,2),
    "priceGapPercent" DECIMAL(6,2),
    "hasTypo" BOOLEAN NOT NULL DEFAULT false,
    "typoDetails" TEXT,
    "typoConfidenceScore" DECIMAL(5,2),
    "dealScore" SMALLINT,
    "recencyScore" DECIMAL(5,2),
    "sellerName" VARCHAR(255),
    "sellerRating" DECIMAL(3,1),
    "sellerFeedbackPercent" DECIMAL(5,2),
    "listingUrl" TEXT NOT NULL,
    "images" TEXT[],
    "description" TEXT,
    "condition" VARCHAR(50),
    "listingStatus" "ListingStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),

    CONSTRAINT "EbayListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedListing" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ebayListingId" TEXT NOT NULL,
    "priceAtSave" DECIMAL(10,2) NOT NULL,
    "recentSoldPriceAtSave" DECIMAL(10,2),
    "dealScoreAtSave" SMALLINT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPrice" DECIMAL(10,2),
    "priceChangePercent" DECIMAL(6,2),
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "lastPriceCheckAt" TIMESTAMP(3),

    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentSoldListing" (
    "id" UUID NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "set" VARCHAR(100),
    "rarity" VARCHAR(50),
    "condition" VARCHAR(50),
    "soldPrice" DECIMAL(10,2) NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "daysOld" SMALLINT,
    "source" VARCHAR(50) NOT NULL DEFAULT 'eBay',
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentSoldListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypoPattern" (
    "id" UUID NOT NULL,
    "correctSpelling" VARCHAR(255) NOT NULL,
    "commonMisspelling" VARCHAR(255) NOT NULL,
    "category" "TypoCategory",
    "levenshteinDistance" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypoPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJobLog" (
    "id" UUID NOT NULL,
    "searchQueryId" UUID NOT NULL,
    "jobType" "JobType" NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "listingsFound" INTEGER,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BackgroundJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_idx" ON "SearchQuery"("userId");

-- CreateIndex
CREATE INDEX "SearchQuery_searchFrequency_idx" ON "SearchQuery"("searchFrequency");

-- CreateIndex
CREATE UNIQUE INDEX "EbayListing_ebayListingId_key" ON "EbayListing"("ebayListingId");

-- CreateIndex
CREATE INDEX "EbayListing_searchQueryId_idx" ON "EbayListing"("searchQueryId");

-- CreateIndex
CREATE INDEX "EbayListing_ebayListingId_idx" ON "EbayListing"("ebayListingId");

-- CreateIndex
CREATE INDEX "EbayListing_listingStatus_idx" ON "EbayListing"("listingStatus");

-- CreateIndex
CREATE INDEX "EbayListing_dealScore_idx" ON "EbayListing"("dealScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedListing_ebayListingId_key" ON "SavedListing"("ebayListingId");

-- CreateIndex
CREATE INDEX "SavedListing_userId_idx" ON "SavedListing"("userId");

-- CreateIndex
CREATE INDEX "SavedListing_status_idx" ON "SavedListing"("status");

-- CreateIndex
CREATE INDEX "RecentSoldListing_cardName_idx" ON "RecentSoldListing"("cardName");

-- CreateIndex
CREATE INDEX "RecentSoldListing_soldAt_idx" ON "RecentSoldListing"("soldAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypoPattern_commonMisspelling_key" ON "TypoPattern"("commonMisspelling");

-- CreateIndex
CREATE INDEX "TypoPattern_correctSpelling_idx" ON "TypoPattern"("correctSpelling");

-- CreateIndex
CREATE INDEX "BackgroundJobLog_searchQueryId_idx" ON "BackgroundJobLog"("searchQueryId");

-- CreateIndex
CREATE INDEX "BackgroundJobLog_status_idx" ON "BackgroundJobLog"("status");

-- AddForeignKey
ALTER TABLE "SearchQuery" ADD CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbayListing" ADD CONSTRAINT "EbayListing_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "SearchQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_ebayListingId_fkey" FOREIGN KEY ("ebayListingId") REFERENCES "EbayListing"("ebayListingId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundJobLog" ADD CONSTRAINT "BackgroundJobLog_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "SearchQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
