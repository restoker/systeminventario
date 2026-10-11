CREATE TYPE "user_role" AS ENUM('admin', 'saler');--> statement-breakpoint
CREATE TYPE "estado_caja" AS ENUM('abierto', 'cerrado');--> statement-breakpoint
CREATE TYPE "estado_ingreso" AS ENUM('activo', 'anulado');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text NOT NULL,
	"phone" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"fecha_apertura" timestamp with time zone DEFAULT now(),
	"fecha_cierre" timestamp with time zone,
	"monto_apertura" real NOT NULL,
	"monto_cierre" real,
	"estado" "estado_caja" DEFAULT 'cerrado'::"estado_caja",
	"userId" uuid NOT NULL,
	"fecha_creada" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comprobante" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"numero" text NOT NULL,
	"monto" real NOT NULL,
	"estado" boolean DEFAULT true,
	"direccion" text,
	"telefono" text,
	"numeroDocumento" text,
	"nombre" text,
	"createdByUserId" uuid,
	"tipoDocumentoId" uuid,
	"tipoComprobantePagoId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingresos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"monto" real NOT NULL,
	"descripcion" text NOT NULL,
	"estado" "estado_ingreso" DEFAULT 'activo'::"estado_ingreso",
	"otros" boolean DEFAULT false,
	"isfromAdelanto" boolean DEFAULT false,
	"cajaId" uuid NOT NULL,
	"createdByUserId" uuid,
	"tipoPagoId" uuid NOT NULL,
	"comprobanteId" uuid
);
--> statement-breakpoint
CREATE TABLE "marcas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"imagen" text,
	"descripcion" text,
	"pais" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"codigo" text NOT NULL UNIQUE,
	"price" real NOT NULL,
	"description" text NOT NULL,
	"precio_compra" real,
	"precio_venta" real NOT NULL,
	"igv" real DEFAULT 0.18,
	"image" text,
	"en_consignacion" boolean DEFAULT false,
	"stock" integer NOT NULL,
	"stock_minimo" integer NOT NULL,
	"nota" text,
	"slug" text NOT NULL,
	"category_id" uuid NOT NULL,
	"marca_id" uuid,
	"unidad_id" uuid,
	"proveedor_id" uuid,
	"sucursal_id" uuid
);
--> statement-breakpoint
CREATE TABLE "proveedor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text NOT NULL,
	"direccion" text NOT NULL,
	"email" text,
	"numero_documento" text UNIQUE,
	"activo" boolean DEFAULT true,
	"razon_social" text
);
--> statement-breakpoint
CREATE TABLE "sucursal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"direccion" text NOT NULL,
	"telefono" text NOT NULL,
	"email" text,
	"activo" boolean DEFAULT true,
	"numero_documento" text UNIQUE,
	"ruc" text,
	"razon_social" text
);
--> statement-breakpoint
CREATE TABLE "tipo_comprobante" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"estado" boolean DEFAULT true,
	"series" text NOT NULL,
	"numero" text NOT NULL,
	"nombre_sunat" text,
	"correlative" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipo_documento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"estado" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "tipo_pago" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"estado" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "unidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"abreviatura" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "caja" ADD CONSTRAINT "caja_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_createdByUserId_users_id_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_tipoDocumentoId_tipo_documento_id_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipo_documento"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_tipoComprobantePagoId_tipo_comprobante_id_fkey" FOREIGN KEY ("tipoComprobantePagoId") REFERENCES "tipo_comprobante"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cajaId_caja_id_fkey" FOREIGN KEY ("cajaId") REFERENCES "caja"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_createdByUserId_users_id_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_tipoPagoId_tipo_pago_id_fkey" FOREIGN KEY ("tipoPagoId") REFERENCES "tipo_pago"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_comprobanteId_comprobante_id_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "comprobante"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categorias_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categorias"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_marca_id_marcas_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_unidad_id_unidades_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_proveedor_id_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id");