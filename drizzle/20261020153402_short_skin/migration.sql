CREATE TABLE "comision" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"porcentaje" real NOT NULL,
	"vendedor_id" text
);
--> statement-breakpoint
CREATE TABLE "productos_venta" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cantidad" integer NOT NULL,
	"precio" real NOT NULL,
	"descuento" real DEFAULT 0,
	"product_id" text NOT NULL,
	"precio_total" real NOT NULL,
	"venta_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "cliente" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "numeroDocumento" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "telefono" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "direccion" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "recargo" real DEFAULT 0.05;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "subtotal" real NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "descuento" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "total" real NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "saldoPendiente" real NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "metodopago_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "comprobante_id" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "caja_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "vendedor" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comision" ADD CONSTRAINT "comision_vendedor_id_users_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "productos_venta" ADD CONSTRAINT "productos_venta_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "productos_venta" ADD CONSTRAINT "productos_venta_venta_id_ventas_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id");--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_metodopago_id_tipo_pago_id_fkey" FOREIGN KEY ("metodopago_id") REFERENCES "tipo_pago"("id");--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_comprobante_id_comprobante_id_fkey" FOREIGN KEY ("comprobante_id") REFERENCES "comprobante"("id");--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_caja_id_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "caja"("id");--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_vendedor_users_id_fkey" FOREIGN KEY ("vendedor") REFERENCES "users"("id");