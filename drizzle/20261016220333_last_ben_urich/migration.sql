ALTER TABLE "sucursal" DROP CONSTRAINT "sucursal_numero_documento_key";--> statement-breakpoint
ALTER TABLE "sucursal" ADD COLUMN "codigo" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sucursal" DROP COLUMN "numero_documento";--> statement-breakpoint
ALTER TABLE "sucursal" ADD CONSTRAINT "sucursal_codigo_key" UNIQUE("codigo");