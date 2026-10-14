CREATE TYPE "estado_traslado" AS ENUM('pendiente', 'recibido', 'recibido_parcial', 'cancelado');--> statement-breakpoint
CREATE TABLE "stock_sucursal" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"producto_id" text NOT NULL,
	"sucursal_id" text NOT NULL,
	"cantidad" integer DEFAULT 0 NOT NULL,
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stock_sucursal_cantidad_no_negativa" CHECK ("cantidad" >= 0),
	CONSTRAINT "stock_sucursal_minimo_no_negativo" CHECK ("stock_minimo" >= 0)
);
--> statement-breakpoint
CREATE TABLE "traslado" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"codigo" text NOT NULL UNIQUE,
	"fecha_traslado" timestamp DEFAULT now() NOT NULL,
	"estado" "estado_traslado" DEFAULT 'pendiente'::"estado_traslado" NOT NULL,
	"motivo" text NOT NULL,
	"observacion" text,
	"sucursal_origen_id" text NOT NULL,
	"sucursal_destino_id" text NOT NULL,
	"creado_por_id" text NOT NULL,
	"recibido_por_id" text,
	"fecha_envio" timestamp,
	"fecha_recepcion" timestamp,
	CONSTRAINT "traslado_origen_distinto_destino" CHECK ("sucursal_origen_id" <> "sucursal_destino_id")
);
--> statement-breakpoint
CREATE TABLE "traslado_detalle" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"traslado_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad_enviada" integer NOT NULL,
	"cantidad_recibida" integer,
	CONSTRAINT "traslado_detalle_cantidad_enviada_positiva" CHECK ("cantidad_enviada" > 0),
	CONSTRAINT "traslado_detalle_cantidad_recibida_valida" CHECK ("cantidad_recibida" IS NULL OR ("cantidad_recibida" >= 0 AND "cantidad_recibida" <= "cantidad_enviada"))
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_sucursal_id_sucursal_id_fkey";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock_minimo";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sucursal_id";--> statement-breakpoint
CREATE UNIQUE INDEX "stock_sucursal_producto_sucursal_uq" ON "stock_sucursal" ("producto_id","sucursal_id");--> statement-breakpoint
CREATE INDEX "stock_sucursal_sucursal_idx" ON "stock_sucursal" ("sucursal_id");--> statement-breakpoint
CREATE INDEX "traslado_origen_idx" ON "traslado" ("sucursal_origen_id");--> statement-breakpoint
CREATE INDEX "traslado_destino_idx" ON "traslado" ("sucursal_destino_id");--> statement-breakpoint
CREATE INDEX "traslado_estado_idx" ON "traslado" ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "traslado_detalle_traslado_producto_uq" ON "traslado_detalle" ("traslado_id","producto_id");--> statement-breakpoint
CREATE INDEX "traslado_detalle_producto_idx" ON "traslado_detalle" ("producto_id");--> statement-breakpoint
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_producto_id_products_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_sucursal_origen_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_origen_id") REFERENCES "sucursal"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_sucursal_destino_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_destino_id") REFERENCES "sucursal"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_creado_por_id_users_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_recibido_por_id_users_id_fkey" FOREIGN KEY ("recibido_por_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado_detalle" ADD CONSTRAINT "traslado_detalle_traslado_id_traslado_id_fkey" FOREIGN KEY ("traslado_id") REFERENCES "traslado"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "traslado_detalle" ADD CONSTRAINT "traslado_detalle_producto_id_products_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "products"("id") ON DELETE RESTRICT;