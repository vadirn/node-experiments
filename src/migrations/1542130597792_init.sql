CREATE TABLE "public"."users" (
    "id" uuid,
    "email" text NOT NULL,
    "props" jsonb,
    PRIMARY KEY ("id"),
    UNIQUE ("email")
);

CREATE TABLE "public"."authentication" (
    "id" uuid,
    "token" text NOT NULL,
    "type" smallint NOT NULL DEFAULT '0',
    "created_by" uuid,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
);
