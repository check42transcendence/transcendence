-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- Case-insensitive uniqueness for email and username
CREATE UNIQUE INDEX "user_email_ci_unique"
ON "user" (lower("email"));

CREATE UNIQUE INDEX "user_username_ci_unique"
ON "user" (lower("username"));
