-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "reference" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;
