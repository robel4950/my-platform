-- AlterTable
ALTER TABLE "VipContract" ADD COLUMN     "lastClaimedAt" TIMESTAMP(3),
ADD COLUMN     "reference" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';
