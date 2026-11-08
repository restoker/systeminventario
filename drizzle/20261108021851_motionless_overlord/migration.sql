CREATE TYPE "estado_compra" AS ENUM('pagado', 'pendiente');--> statement-breakpoint
CREATE TABLE "compra" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"monto" real NOT NULL,
	"numeroComprobante" text NOT NULL,
	"isACredito" boolean DEFAULT false,
	"numeroDiasCredito" integer,
	"fechaComprobante" timestamp with time zone,
	"estado" "estado_compra" DEFAULT 'pendiente'::"estado_compra",
	"tipoComprobanteId" integer NOT NULL,
	"userId" text NOT NULL,
	"cajaId" text NOT NULL,
	"proveedorId" text NOT NULL,
	"sucursalId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productosCompras" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"precio" real NOT NULL,
	"cantidad" real NOT NULL,
	"compraId" integer NOT NULL,
	"productoId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_tipoComprobanteId_tipo_comprobante_id_fkey" FOREIGN KEY ("tipoComprobanteId") REFERENCES "tipo_comprobante"("id");--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_cajaId_caja_id_fkey" FOREIGN KEY ("cajaId") REFERENCES "caja"("id");--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_proveedorId_proveedor_id_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedor"("id");--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_sucursalId_sucursal_id_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursal"("id");--> statement-breakpoint
ALTER TABLE "productosCompras" ADD CONSTRAINT "productosCompras_compraId_compra_id_fkey" FOREIGN KEY ("compraId") REFERENCES "compra"("id");--> statement-breakpoint
ALTER TABLE "productosCompras" ADD CONSTRAINT "productosCompras_productoId_products_id_fkey" FOREIGN KEY ("productoId") REFERENCES "products"("id");