CREATE TABLE "imagen_producto" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "image";