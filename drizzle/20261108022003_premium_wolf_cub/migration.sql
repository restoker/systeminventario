ALTER TABLE "compra" ALTER COLUMN "tipoComprobanteId" SET DATA TYPE text USING "tipoComprobanteId"::text;--> statement-breakpoint
ALTER TABLE "productosCompras" ALTER COLUMN "compraId" SET DATA TYPE text USING "compraId"::text;--> statement-breakpoint
ALTER TABLE "productosCompras" ALTER COLUMN "productoId" SET DATA TYPE text USING "productoId"::text;