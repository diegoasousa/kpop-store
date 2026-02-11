-- CreateTable
CREATE TABLE "ProductDetail" (
    "id" TEXT NOT NULL,
    "goodsNo" INTEGER NOT NULL,
    "productNo" INTEGER,
    "productName" TEXT,
    "productContent" TEXT,
    "policy" TEXT,
    "raw" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductDetail_goodsNo_key" ON "ProductDetail"("goodsNo");
