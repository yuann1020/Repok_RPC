-- CreateEnum
CREATE TYPE "CourtCategory" AS ENUM ('STANDARD', 'CHAMPIONSHIP');

-- AlterTable
ALTER TABLE "courts" ADD COLUMN     "category" "CourtCategory" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "facilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "court_type" SET DEFAULT 'INDOOR';
