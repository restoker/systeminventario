CREATE TABLE "configuracion" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"recargo_tarjeta" real DEFAULT 0.05 NOT NULL,
	"comision_vendedor" real DEFAULT 0.03 NOT NULL
);
