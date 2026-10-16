CREATE TABLE "ventas" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"por_consignacion" boolean NOT NULL,
	"sucursal_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "precio_compra" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "unidad_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id");