-- CreateTable
CREATE TABLE "SetCard" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "setCode" VARCHAR(20) NOT NULL,
    "cardNumber" VARCHAR(10) NOT NULL,
    "cardName" VARCHAR(255) NOT NULL,
    "rarity" VARCHAR(50) NOT NULL,
    "imageSmall" TEXT,
    "imageLarge" TEXT,
    "marketPrice" DECIMAL(10,2),
    "priceLow" DECIMAL(10,2),
    "priceHigh" DECIMAL(10,2),
    "priceVariant" VARCHAR(50),
    "types" VARCHAR(50)[],
    "supertype" VARCHAR(50),
    "subtypes" VARCHAR(50)[],
    "hp" VARCHAR(10),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SetCard_setCode_cardNumber_key" ON "SetCard"("setCode", "cardNumber");

-- CreateIndex
CREATE INDEX "SetCard_setCode_idx" ON "SetCard"("setCode");
