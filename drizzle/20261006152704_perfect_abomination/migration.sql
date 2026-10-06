CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"price" real NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"stock" integer NOT NULL,
	"slug" text NOT NULL
);
