-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "card_order" UUID[] DEFAULT '{}'::UUID[];

update boards set card_order = (select array_agg(id order by created_at desc) from cards where board_id = boards.id);

ALTER TABLE "boards" ALTER COLUMN "card_order" DROP DEFAULT;