-- AlterTable
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealTitle" TEXT;
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealBuyingOption" VARCHAR(20);
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealBidCount" SMALLINT;
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealEndTime" TIMESTAMP(3);
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealSellerName" VARCHAR(100);
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealSellerFeedback" DECIMAL(5,2);
ALTER TABLE "ChaseListCard" ADD COLUMN "bestDealHasTypo" BOOLEAN;
