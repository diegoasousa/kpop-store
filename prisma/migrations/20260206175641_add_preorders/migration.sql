-- CreateEnum
CREATE TYPE "PreorderStatus" AS ENUM ('RESERVED', 'PAID', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELED');

-- AlterTable
ALTER TABLE "ProductVariation" ADD COLUMN     "priceCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PreorderProduct" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ktown4u',
    "goodsNo" INTEGER NOT NULL,
    "shopNo" INTEGER NOT NULL,
    "grpNo" INTEGER,
    "groupName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "sale" BOOLEAN NOT NULL,
    "isAdult" BOOLEAN NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priceAmount" DECIMAL(10,2) NOT NULL,
    "priceOriginalAmount" DECIMAL(10,2),
    "imgThumb" TEXT NOT NULL,
    "imgT1" TEXT,
    "imgT2" TEXT,
    "categoryPath" TEXT,
    "raw" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreorderProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preorder" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "status" "PreorderStatus" NOT NULL DEFAULT 'RESERVED',
    "priceLocked" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceAmount" DECIMAL(10,2) NOT NULL,
    "sale" BOOLEAN NOT NULL,
    "raw" JSONB NOT NULL,

    CONSTRAINT "ProductSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreorderProduct_goodsNo_key" ON "PreorderProduct"("goodsNo");

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PreorderProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSnapshot" ADD CONSTRAINT "ProductSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PreorderProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
