-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('LEGACY', 'KTOWN4U');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestWhatsapp" TEXT,
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'LEGACY',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OrderItemK4u" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "goodsNo" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priceAmount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItemK4u_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItemK4u" ADD CONSTRAINT "OrderItemK4u_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemK4u" ADD CONSTRAINT "OrderItemK4u_productId_fkey" FOREIGN KEY ("productId") REFERENCES "PreorderProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
