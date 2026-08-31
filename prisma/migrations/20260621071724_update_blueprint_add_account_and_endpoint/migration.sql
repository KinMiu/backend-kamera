/*
  Warnings:

  - You are about to drop the column `endpoints` on the `blueprints` table. All the data in the column will be lost.
  - Added the required column `identifierField` to the `blueprints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loginEndpoint` to the `blueprints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordField` to the `blueprints` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blueprints" DROP COLUMN "endpoints",
ADD COLUMN     "identifierField" TEXT NOT NULL,
ADD COLUMN     "loginEndpoint" TEXT NOT NULL,
ADD COLUMN     "passwordField" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "endpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "expectedStatus" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "allowedRoles" JSONB,

    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blueprints" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blueprintId" TEXT NOT NULL,

    CONSTRAINT "user_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_blueprints_blueprintId_identifier_key" ON "user_blueprints"("blueprintId", "identifier");

-- AddForeignKey
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blueprints" ADD CONSTRAINT "user_blueprints_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
