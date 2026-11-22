CREATE TABLE "facturacion" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ubigeo" text,
	"provincia" text,
	"distrito" text,
	"departamento" text,
	"pathCert" text,
	"logo" text,
	"usuarioSol" text,
	"claveSol" text,
	"passwordCertificadoDigital" text,
	"produccion" boolean DEFAULT false,
	"clienteId" text,
	"clienteSecret" text,
	"rucEmpresaId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facturacion" ADD CONSTRAINT "facturacion_rucEmpresaId_ruc_empresa_id_fkey" FOREIGN KEY ("rucEmpresaId") REFERENCES "ruc_empresa"("id");