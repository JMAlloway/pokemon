-- AlterTable: Add portfolio tracking fields to SavedListing
ALTER TABLE "SavedListing" ADD COLUMN "purchased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SavedListing" ADD COLUMN "purchasePrice" DECIMAL(10,2);
ALTER TABLE "SavedListing" ADD COLUMN "purchasedAt" TIMESTAMP(3);
ALTER TABLE "SavedListing" ADD COLUMN "soldPrice" DECIMAL(10,2);
ALTER TABLE "SavedListing" ADD COLUMN "soldAt" TIMESTAMP(3);
ALTER TABLE "SavedListing" ADD COLUMN "platformFees" DECIMAL(10,2);
ALTER TABLE "SavedListing" ADD COLUMN "shippingPaid" DECIMAL(10,2);
ALTER TABLE "SavedListing" ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "SavedListing_purchased_idx" ON "SavedListing"("purchased");

-- AlterTable: Add notification settings to User
ALTER TABLE "User" ADD COLUMN "discordWebhookUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramBotToken" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "telegramChatId" VARCHAR(100);
