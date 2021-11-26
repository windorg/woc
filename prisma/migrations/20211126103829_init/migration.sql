CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('job_status_not_started', 'job_status_running', 'job_status_failed', 'job_status_timed_out', 'job_status_succeeded', 'job_status_retry');

-- CreateEnum
CREATE TYPE "subscription_update_kind" AS ENUM ('suk_board', 'suk_card', 'suk_card_update', 'suk_reply');

-- CreateTable
CREATE TABLE "boards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL DEFAULT E'',
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settings" JSONB NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL DEFAULT E'',
    "board_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settings" JSONB NOT NULL,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_updates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "card_id" UUID NOT NULL,
    "settings" JSONB NOT NULL,
    "owner_id" UUID NOT NULL,

    CONSTRAINT "card_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followed_users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subscriber_id" UUID NOT NULL,
    "followed_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "card_update_id" UUID NOT NULL,
    "author_id" UUID,
    "settings" JSONB NOT NULL,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_updates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subscriber_id" UUID NOT NULL,
    "board_id" UUID,
    "card_id" UUID,
    "card_update_id" UUID,
    "reply_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_kind" "subscription_update_kind" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subscription_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "display_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "locked_at" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boards_owner_id_index" ON "boards"("owner_id");

-- CreateIndex
CREATE INDEX "cards_owner_id_index" ON "cards"("owner_id");

-- CreateIndex
CREATE INDEX "card_updates_card_id_index" ON "card_updates"("card_id");

-- CreateIndex
CREATE INDEX "card_updates_owner_id_index" ON "card_updates"("owner_id");

-- CreateIndex
CREATE INDEX "followed_users_followed_user_id_index" ON "followed_users"("followed_user_id");

-- CreateIndex
CREATE INDEX "followed_users_subscriber_id_index" ON "followed_users"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "followed_users_unique" ON "followed_users"("subscriber_id", "followed_user_id");

-- CreateIndex
CREATE INDEX "replies_author_id_index" ON "replies"("author_id");

-- CreateIndex
CREATE INDEX "replies_card_update_id_index" ON "replies"("card_update_id");

-- CreateIndex
CREATE INDEX "subscription_updates_board_id_index" ON "subscription_updates"("board_id");

-- CreateIndex
CREATE INDEX "subscription_updates_card_id_index" ON "subscription_updates"("card_id");

-- CreateIndex
CREATE INDEX "subscription_updates_card_update_id_index" ON "subscription_updates"("card_update_id");

-- CreateIndex
CREATE INDEX "subscription_updates_reply_id_index" ON "subscription_updates"("reply_id");

-- CreateIndex
CREATE INDEX "subscription_updates_subscriber_id_index" ON "subscription_updates"("subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_handle_key" ON "users"("handle");

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_ref_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_ref_board_id" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_ref_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_updates" ADD CONSTRAINT "card_updates_ref_card_id" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_updates" ADD CONSTRAINT "card_updates_ref_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "followed_users" ADD CONSTRAINT "followed_users_ref_followed_user_id" FOREIGN KEY ("followed_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "followed_users" ADD CONSTRAINT "followed_users_ref_subscriber_id" FOREIGN KEY ("subscriber_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_ref_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_ref_card_update_id" FOREIGN KEY ("card_update_id") REFERENCES "card_updates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_updates" ADD CONSTRAINT "subscription_updates_ref_board_id" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_updates" ADD CONSTRAINT "subscription_updates_ref_card_id" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_updates" ADD CONSTRAINT "subscription_updates_ref_card_update_id" FOREIGN KEY ("card_update_id") REFERENCES "card_updates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_updates" ADD CONSTRAINT "subscription_updates_ref_reply_id" FOREIGN KEY ("reply_id") REFERENCES "replies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscription_updates" ADD CONSTRAINT "subscription_updates_ref_subscriber_id" FOREIGN KEY ("subscriber_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
