-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "fired_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "cards_fired_at_index" ON "cards"("fired_at");
