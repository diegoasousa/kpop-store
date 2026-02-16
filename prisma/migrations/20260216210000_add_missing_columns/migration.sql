-- AlterTable PreorderProduct: add namePt, releaseType, sortOrder
ALTER TABLE "PreorderProduct" ADD COLUMN IF NOT EXISTS "namePt" TEXT;
ALTER TABLE "PreorderProduct" ADD COLUMN IF NOT EXISTS "releaseType" TEXT;
ALTER TABLE "PreorderProduct" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;

-- AlterTable ProductDetail: add productContentPt, policyPt
ALTER TABLE "ProductDetail" ADD COLUMN IF NOT EXISTS "productContentPt" TEXT;
ALTER TABLE "ProductDetail" ADD COLUMN IF NOT EXISTS "policyPt" TEXT;

-- AddForeignKey
ALTER TABLE "ProductDetail" ADD CONSTRAINT "ProductDetail_goodsNo_fkey" FOREIGN KEY ("goodsNo") REFERENCES "PreorderProduct"("goodsNo") ON DELETE RESTRICT ON UPDATE CASCADE;
