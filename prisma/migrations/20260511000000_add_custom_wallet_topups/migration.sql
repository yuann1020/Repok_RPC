-- AlterTable
ALTER TABLE "top_up_orders" ADD COLUMN "is_custom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "top_up_orders" ALTER COLUMN "package_code" DROP NOT NULL;
