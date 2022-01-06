-- DropForeignKey
ALTER TABLE "subscription_updates" DROP CONSTRAINT "subscription_updates_ref_reply_id";

-- AddForeignKey
ALTER TABLE "subscription_updates" ADD CONSTRAINT "subscription_updates_ref_reply_id" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
