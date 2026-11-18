CREATE TABLE "ruc_empresa" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"numero_ruc" text,
	"nombre" text NOT NULL,
	"descripcion" text
);
--> statement-breakpoint
ALTER TABLE "sucursal" ADD CONSTRAINT "sucursal_ruc_ruc_empresa_numero_ruc_fkey" FOREIGN KEY ("ruc") REFERENCES "ruc_empresa"("numero_ruc");