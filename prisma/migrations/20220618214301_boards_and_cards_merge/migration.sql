-- Boards are almost gone
ALTER TABLE "boards" DROP CONSTRAINT "boards_ref_owner_id";
ALTER TABLE "cards" DROP CONSTRAINT "cards_ref_board_id";
ALTER TABLE "subscription_updates" DROP CONSTRAINT "subscription_updates_ref_board_id";
DROP INDEX "subscription_updates_board_id_index";
ALTER TABLE "subscription_updates" DROP COLUMN "board_id";

-- Card type enum
CREATE TYPE "card_type" AS ENUM('card', 'board');

-- Cards gain some new stuff
ALTER TABLE "cards" ADD COLUMN "children_order" UUID[];
ALTER TABLE "cards" RENAME COLUMN "board_id" TO "parent_id";
ALTER TABLE "cards" ADD CONSTRAINT "cards_ref_parent_id" FOREIGN KEY ("parent_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "cards" ADD COLUMN "type" "card_type" NOT NULL DEFAULT 'card';
ALTER TABLE "cards" ALTER COLUMN "type" DROP DEFAULT;
CREATE INDEX "cards_type_index" ON "cards" ("type");

-- Cards without parents will be boards, so we need to allow nullable parent_id
ALTER TABLE "cards" ALTER COLUMN "parent_id" DROP NOT NULL;

-- Move all rows from 'boards' to 'cards'
DO LANGUAGE plpgsql $$
BEGIN
  FOR board IN SELECT * FROM "boards" LOOP
    INSERT INTO "cards" 
      (id, "type", title, parent_id, created_at, settings, children_order, owner_id)
      VALUES
      (board.id, 'board', board.title, NULL, board.created_at, board.settings, board.card_order, board.owner_id);
  END LOOP;
END$$;

-- Now boards are actually gone
DROP TABLE "boards";