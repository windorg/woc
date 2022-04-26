-- AlterTable
ALTER TABLE "users" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';
