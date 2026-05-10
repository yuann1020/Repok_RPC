-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';

-- DropIndex
DROP INDEX "booking_items_availability_id_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "expires_at" TIMESTAMP(3),
ADD COLUMN "expired_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "bookings_status_expires_at_idx" ON "bookings"("status", "expires_at");

-- CreateIndex
CREATE INDEX "booking_items_availability_id_idx" ON "booking_items"("availability_id");
