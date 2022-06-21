/*
  Warnings:

  - You are about to drop the column `type` on the `cards` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "cards_type_index";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "type";

-- DropEnum
DROP TYPE "card_type";
