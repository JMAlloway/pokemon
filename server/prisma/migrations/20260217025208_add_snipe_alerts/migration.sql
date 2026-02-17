-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('AUCTION_ENDING', 'BIN_DEAL');

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'AlertCheck';

-- AlterTable
ALTER TABLE "SetCard" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SnipeAlert" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "sets" VARCHAR(100)[],
    "cardNames" VARCHAR(255)[],
    "maxHoursRemaining" SMALLINT,
    "maxBids" SMALLINT,
    "minPriceGapPercent" DECIMAL(5,2),
    "maxPriceDollars" DECIMAL(10,2),
    "minDealScore" SMALLINT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnipeAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" UUID NOT NULL,
    "snipeAlertId" UUID NOT NULL,
    "ebayListingId" TEXT NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "listingTitle" VARCHAR(500) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "marketPrice" DECIMAL(10,2),
    "priceGapPercent" DECIMAL(10,2),
    "listingUrl" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SnipeAlert_userId_idx" ON "SnipeAlert"("userId");

-- CreateIndex
CREATE INDEX "SnipeAlert_enabled_idx" ON "SnipeAlert"("enabled");

-- CreateIndex
CREATE INDEX "AlertHistory_snipeAlertId_idx" ON "AlertHistory"("snipeAlertId");

-- CreateIndex
CREATE INDEX "AlertHistory_ebayListingId_idx" ON "AlertHistory"("ebayListingId");

-- CreateIndex
CREATE INDEX "AlertHistory_triggeredAt_idx" ON "AlertHistory"("triggeredAt");

-- AddForeignKey
ALTER TABLE "SnipeAlert" ADD CONSTRAINT "SnipeAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertHistory" ADD CONSTRAINT "AlertHistory_snipeAlertId_fkey" FOREIGN KEY ("snipeAlertId") REFERENCES "SnipeAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
