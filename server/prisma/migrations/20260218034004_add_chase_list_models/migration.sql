-- CreateEnum
CREATE TYPE "ChaseCardStatus" AS ENUM ('needed', 'dealFound', 'purchased');

-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'ChaseListScan';

-- AlterTable
ALTER TABLE "EbayListing" ADD COLUMN     "shippingEstimated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RecentSoldListing" ADD COLUMN     "shippingCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "SetCard" (
    "id" UUID NOT NULL,
    "setName" VARCHAR(100) NOT NULL,
    "cardNumber" VARCHAR(20) NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "rarity" VARCHAR(50),
    "cardType" VARCHAR(50),
    "imageUrl" TEXT,
    "marketPrice" DECIMAL(10,2),
    "lastPriceUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaseList" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "setName" VARCHAR(100) NOT NULL,
    "alertMinPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "alertMaxPrice" DECIMAL(10,2),
    "alertCooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "scanEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaseList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaseListCard" (
    "id" UUID NOT NULL,
    "chaseListId" UUID NOT NULL,
    "setCardId" UUID NOT NULL,
    "status" "ChaseCardStatus" NOT NULL DEFAULT 'needed',
    "maxPriceOverride" DECIMAL(10,2),
    "bestDealUrl" TEXT,
    "bestDealPrice" DECIMAL(10,2),
    "bestDealScore" SMALLINT,
    "lastAlertedAt" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChaseListCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SetCard_setName_idx" ON "SetCard"("setName");

-- CreateIndex
CREATE UNIQUE INDEX "SetCard_setName_cardNumber_key" ON "SetCard"("setName", "cardNumber");

-- CreateIndex
CREATE INDEX "ChaseList_userId_idx" ON "ChaseList"("userId");

-- CreateIndex
CREATE INDEX "ChaseList_scanEnabled_idx" ON "ChaseList"("scanEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "ChaseList_userId_setName_key" ON "ChaseList"("userId", "setName");

-- CreateIndex
CREATE INDEX "ChaseListCard_chaseListId_idx" ON "ChaseListCard"("chaseListId");

-- CreateIndex
CREATE INDEX "ChaseListCard_status_idx" ON "ChaseListCard"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChaseListCard_chaseListId_setCardId_key" ON "ChaseListCard"("chaseListId", "setCardId");

-- AddForeignKey
ALTER TABLE "ChaseList" ADD CONSTRAINT "ChaseList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaseListCard" ADD CONSTRAINT "ChaseListCard_chaseListId_fkey" FOREIGN KEY ("chaseListId") REFERENCES "ChaseList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaseListCard" ADD CONSTRAINT "ChaseListCard_setCardId_fkey" FOREIGN KEY ("setCardId") REFERENCES "SetCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
