/*
  Warnings:

  - A unique constraint covering the columns `[trip_id,id]` on the table `itinerary_day` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trip_id,id]` on the table `proposal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "itinerary_day_id" UUID NOT NULL,
    "proposal_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6),
    "location" VARCHAR(255),
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_proposal_id_key" ON "activity"("proposal_id");

-- CreateIndex
CREATE INDEX "activity_trip_id_idx" ON "activity"("trip_id");

-- CreateIndex
CREATE INDEX "activity_itinerary_day_id_idx" ON "activity"("itinerary_day_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_trip_id_proposal_id_key" ON "activity"("trip_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_day_trip_id_id_key" ON "itinerary_day"("trip_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_trip_id_id_key" ON "proposal"("trip_id", "id");

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_trip_id_itinerary_day_id_fkey" FOREIGN KEY ("trip_id", "itinerary_day_id") REFERENCES "itinerary_day"("trip_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_trip_id_proposal_id_fkey" FOREIGN KEY ("trip_id", "proposal_id") REFERENCES "proposal"("trip_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity" ADD CONSTRAINT "activity_time_check" CHECK ("end_time" IS NULL OR "end_time" >= "start_time");