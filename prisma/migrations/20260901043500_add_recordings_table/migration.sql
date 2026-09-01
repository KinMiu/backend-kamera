-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" BIGINT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recordings_deviceId_createdAt_idx" ON "recordings"("deviceId", "createdAt");

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
