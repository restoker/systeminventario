ALTER TABLE "compra" ADD COLUMN "ruc_id" text;--> statement-breakpoint
ALTER TABLE "comprobante" ADD COLUMN "ruc_id" text;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD COLUMN "razon_social" text;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD COLUMN "direccion_fiscal" text;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD COLUMN "telefono" text;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD COLUMN "activo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD COLUMN "es_principal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tipo_comprobante" ADD COLUMN "ruc_id" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "ruc_id" text;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ALTER COLUMN "numero_ruc" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ruc_empresa" ADD CONSTRAINT "ruc_empresa_numero_ruc_key" UNIQUE("numero_ruc");--> statement-breakpoint
ALTER TABLE "compra" ADD CONSTRAINT "compra_ruc_id_ruc_empresa_id_fkey" FOREIGN KEY ("ruc_id") REFERENCES "ruc_empresa"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_ruc_id_ruc_empresa_id_fkey" FOREIGN KEY ("ruc_id") REFERENCES "ruc_empresa"("id");--> statement-breakpoint
ALTER TABLE "tipo_comprobante" ADD CONSTRAINT "tipo_comprobante_ruc_id_ruc_empresa_id_fkey" FOREIGN KEY ("ruc_id") REFERENCES "ruc_empresa"("id");--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_ruc_id_ruc_empresa_id_fkey" FOREIGN KEY ("ruc_id") REFERENCES "ruc_empresa"("id");