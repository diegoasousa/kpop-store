-- Create new enum for OrderStatus
CREATE TYPE "OrderStatus_new" AS ENUM (
  'CREATED',
  'PAID',
  'KTOWN_ORDERED',
  'KTOWN_CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
);

-- Alter Order.status to new enum (drop default first)
ALTER TABLE "Order"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING ("status"::text::"OrderStatus_new");

-- Drop old enum and rename new
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- Update existing pending orders to new CREATED status
UPDATE "Order" SET "status" = 'CREATED' WHERE "status"::text = 'PENDING';

-- Set new default
ALTER TABLE "Order"
  ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- Alter Order table columns
ALTER TABLE "Order"
  DROP COLUMN IF EXISTS "guestName",
  DROP COLUMN IF EXISTS "guestEmail",
  DROP COLUMN IF EXISTS "guestWhatsapp",
  ADD COLUMN "customerName" TEXT,
  ADD COLUMN "customerEmail" TEXT,
  ADD COLUMN "customerPhone" TEXT,
  ADD COLUMN "customerDocument" TEXT,
  ADD COLUMN "shippingAddress" TEXT,
  ADD COLUMN "shippingCity" TEXT,
  ADD COLUMN "shippingState" TEXT,
  ADD COLUMN "shippingZipCode" TEXT;

-- Add variation fields to OrderItemK4u
ALTER TABLE "OrderItemK4u"
  ADD COLUMN "variationId" TEXT,
  ADD COLUMN "variationName" TEXT;
