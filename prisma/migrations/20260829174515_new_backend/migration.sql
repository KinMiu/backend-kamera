/*
  Warnings:

  - You are about to drop the `blueprints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `endpoints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `test_summaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_blueprints` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "blueprints" DROP CONSTRAINT "blueprints_userId_fkey";

-- DropForeignKey
ALTER TABLE "endpoints" DROP CONSTRAINT "endpoints_blueprintId_fkey";

-- DropForeignKey
ALTER TABLE "test_details" DROP CONSTRAINT "test_details_testSummaryId_fkey";

-- DropForeignKey
ALTER TABLE "test_summaries" DROP CONSTRAINT "test_summaries_blueprintId_fkey";

-- DropForeignKey
ALTER TABLE "user_blueprints" DROP CONSTRAINT "user_blueprints_blueprintId_fkey";

-- DropTable
DROP TABLE "blueprints";

-- DropTable
DROP TABLE "endpoints";

-- DropTable
DROP TABLE "test_details";

-- DropTable
DROP TABLE "test_summaries";

-- DropTable
DROP TABLE "user_blueprints";

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "rtspEndpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
