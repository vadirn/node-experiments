CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "users" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "email" text NOT NULL,
    "role" smallint NOT NULL DEFAULT '1',
    "props" jsonb,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    UNIQUE ("email")
);

CREATE TABLE "authentication" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "token" text NOT NULL,
    "type" smallint NOT NULL DEFAULT '1',
    "created_by" uuid,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("created_by") REFERENCES 
    "users"("id")
);
