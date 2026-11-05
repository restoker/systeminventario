ALTER TABLE "ventas" RENAME COLUMN "por_consignacion" TO "pagado";--> statement-breakpoint
ALTER TABLE "caja" ALTER COLUMN "estado" SET DEFAULT 'abierto'::"estado_caja";--> statement-breakpoint
ALTER TABLE "ventas" ALTER COLUMN "pagado" SET DEFAULT false;