CREATE TYPE "user_role" AS ENUM('admin', 'saler');--> statement-breakpoint
CREATE TYPE "estado_caja" AS ENUM('abierto', 'cerrado');--> statement-breakpoint
CREATE TYPE "estado_egreso" AS ENUM('activo', 'anulado');--> statement-breakpoint
CREATE TYPE "motivo_egreso" AS ENUM('compras', 'servicios', 'remuneracion', 'administrativo', 'comision', 'otros');--> statement-breakpoint
CREATE TYPE "tipo_comprobante_pago" AS ENUM('ticket', 'boleta', 'factura', 'cheque', 'sin comprobante');--> statement-breakpoint
CREATE TYPE "estado_ingreso" AS ENUM('activo', 'anulado');--> statement-breakpoint
CREATE TYPE "motivo_kardex" AS ENUM('COMPRA', 'TRASLADO_ENTRADA', 'DEVOLUCION_CLIENTE', 'AJUSTE_POSITIVO', 'INVENTARIO_INICIAL', 'ANULACION_SALIDA', 'VENTA', 'TRASLADO_SALIDA', 'DEVOLUCION_PROVEEDOR', 'AJUSTE_NEGATIVO', 'MERMA', 'ANULACION_ENTRADA');--> statement-breakpoint
CREATE TYPE "origen_kardex" AS ENUM('VENTA', 'INGRESO', 'EGRESO', 'TRASLADO', 'DEVOLUCION', 'AJUSTE', 'INVENTARIO');--> statement-breakpoint
CREATE TYPE "tipo_movimiento_kardex" AS ENUM('ENTRADA', 'SALIDA');--> statement-breakpoint
CREATE TYPE "estado_traslado" AS ENUM('pendiente', 'recibido', 'recibido_parcial', 'cancelado');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
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
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
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
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "caja" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"fecha_apertura" timestamp with time zone DEFAULT now(),
	"fecha_cierre" timestamp with time zone,
	"monto_apertura" real NOT NULL,
	"monto_cierre" real,
	"estado" "estado_caja" DEFAULT 'cerrado'::"estado_caja",
	"userId" text NOT NULL,
	"fecha_creada" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comprobante" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"numero" text NOT NULL,
	"monto" real NOT NULL,
	"estado" boolean DEFAULT true,
	"direccion" text,
	"telefono" text,
	"numeroDocumento" text,
	"nombre" text,
	"createdByUserId" text,
	"tipoDocumentoId" text,
	"tipoComprobantePagoId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devolucion" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cantidad" integer NOT NULL,
	"fecha" timestamp DEFAULT now() NOT NULL,
	"motivo" text NOT NULL,
	"sucursal_id" text NOT NULL,
	"venta_id" text NOT NULL,
	"producto_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "egresos" (
	"id" text PRIMARY KEY,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tipoDocumento" "tipo_comprobante_pago",
	"motivo" "motivo_egreso" NOT NULL,
	"serie" text,
	"numero" text,
	"fecha" timestamp with time zone,
	"descripcion" text NOT NULL,
	"monto" real NOT NULL,
	"estado" "estado_egreso" DEFAULT 'activo'::"estado_egreso",
	"cajaId" text NOT NULL,
	"createdByUserId" text
);
--> statement-breakpoint
CREATE TABLE "igv" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" real NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "ingresos" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"monto" real NOT NULL,
	"descripcion" text NOT NULL,
	"estado" "estado_ingreso" DEFAULT 'activo'::"estado_ingreso",
	"otros" boolean DEFAULT false,
	"isfromAdelanto" boolean DEFAULT false,
	"cajaId" text NOT NULL,
	"createdByUserId" text,
	"tipoPagoId" text NOT NULL,
	"comprobanteId" text
);
--> statement-breakpoint
CREATE TABLE "kardex" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"secuencia" integer NOT NULL,
	"tipo_movimiento" "tipo_movimiento_kardex" NOT NULL,
	"motivo" "motivo_kardex" NOT NULL,
	"detalle_motivo" text,
	"origen_tipo" "origen_kardex",
	"origen_id" text,
	"cantidad" integer NOT NULL,
	"stock_anterior" integer NOT NULL,
	"stock_actual" integer NOT NULL,
	"costo_unitario" numeric(14,4),
	"costo_total" numeric(14,2) GENERATED ALWAYS AS ("cantidad" * "costo_unitario") STORED,
	"costo_promedio" numeric(14,4),
	"saldo_valorizado" numeric(14,2) GENERATED ALWAYS AS ("stock_actual" * "costo_promedio") STORED,
	"precio_venta_unitario" numeric(14,2),
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"comprobante_ref" text,
	"movimiento_revertido_id" text,
	"producto_id" text NOT NULL,
	"sucursal_id" text NOT NULL,
	"usuario_id" text,
	CONSTRAINT "kardex_secuencia_positiva" CHECK ("secuencia" > 0),
	CONSTRAINT "kardex_cantidad_positiva" CHECK ("cantidad" > 0),
	CONSTRAINT "kardex_stock_anterior_valido" CHECK ("stock_anterior" >= 0),
	CONSTRAINT "kardex_stock_actual_valido" CHECK ("stock_actual" >= 0),
	CONSTRAINT "kardex_stock_cuadra" CHECK (("tipo_movimiento" = 'ENTRADA' AND "stock_actual" = "stock_anterior" + "cantidad")
             OR ("tipo_movimiento" = 'SALIDA' AND "stock_actual" = "stock_anterior" - "cantidad")),
	CONSTRAINT "kardex_tipo_motivo_coherente" CHECK (("tipo_movimiento" = 'ENTRADA' AND "motivo"::text IN ('COMPRA', 'TRASLADO_ENTRADA', 'DEVOLUCION_CLIENTE', 'AJUSTE_POSITIVO', 'INVENTARIO_INICIAL', 'ANULACION_SALIDA'))
             OR ("tipo_movimiento" = 'SALIDA' AND "motivo"::text IN ('VENTA', 'TRASLADO_SALIDA', 'DEVOLUCION_PROVEEDOR', 'AJUSTE_NEGATIVO', 'MERMA', 'ANULACION_ENTRADA'))),
	CONSTRAINT "kardex_origen_completo" CHECK (("origen_tipo" IS NULL) = ("origen_id" IS NULL)),
	CONSTRAINT "kardex_anulacion_referencia" CHECK (("motivo"::text IN ('ANULACION_ENTRADA', 'ANULACION_SALIDA')) = ("movimiento_revertido_id" IS NOT NULL)),
	CONSTRAINT "kardex_montos_no_negativos" CHECK (coalesce("costo_unitario", 0) >= 0
            AND coalesce("costo_promedio", 0) >= 0
            AND coalesce("precio_venta_unitario", 0) >= 0)
);
--> statement-breakpoint
CREATE TABLE "marcas" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"imagen" text,
	"descripcion" text,
	"pais" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"codigo" text NOT NULL UNIQUE,
	"description" text NOT NULL,
	"precio_compra" real DEFAULT 0,
	"precio_venta" real NOT NULL,
	"igv" real DEFAULT 0.18,
	"image" text,
	"en_consignacion" boolean DEFAULT false,
	"nota" text,
	"category_id" text NOT NULL,
	"marca_id" text,
	"unidad_id" text NOT NULL,
	"proveedor_id" text
);
--> statement-breakpoint
CREATE TABLE "proveedor" (
	"id" text PRIMARY KEY,
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
CREATE TABLE "stock_sucursal" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"producto_id" text NOT NULL,
	"sucursal_id" text NOT NULL,
	"cantidad" integer DEFAULT 0 NOT NULL,
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stock_sucursal_cantidad_no_negativa" CHECK ("cantidad" >= 0),
	CONSTRAINT "stock_sucursal_minimo_no_negativo" CHECK ("stock_minimo" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sucursal" (
	"id" text PRIMARY KEY,
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
	"id" text PRIMARY KEY,
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
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"estado" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "tipo_pago" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"estado" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "traslado" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"codigo" text NOT NULL UNIQUE,
	"fecha_traslado" timestamp DEFAULT now() NOT NULL,
	"estado" "estado_traslado" DEFAULT 'pendiente'::"estado_traslado" NOT NULL,
	"motivo" text NOT NULL,
	"observacion" text,
	"sucursal_origen_id" text NOT NULL,
	"sucursal_destino_id" text NOT NULL,
	"creado_por_id" text NOT NULL,
	"recibido_por_id" text,
	"fecha_envio" timestamp,
	"fecha_recepcion" timestamp,
	CONSTRAINT "traslado_origen_distinto_destino" CHECK ("sucursal_origen_id" <> "sucursal_destino_id")
);
--> statement-breakpoint
CREATE TABLE "traslado_detalle" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"traslado_id" text NOT NULL,
	"producto_id" text NOT NULL,
	"cantidad_enviada" integer NOT NULL,
	"cantidad_recibida" integer,
	CONSTRAINT "traslado_detalle_cantidad_enviada_positiva" CHECK ("cantidad_enviada" > 0),
	CONSTRAINT "traslado_detalle_cantidad_recibida_valida" CHECK ("cantidad_recibida" IS NULL OR ("cantidad_recibida" >= 0 AND "cantidad_recibida" <= "cantidad_enviada"))
);
--> statement-breakpoint
CREATE TABLE "unidades" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"nombre" text NOT NULL,
	"abreviatura" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventas" (
	"id" text PRIMARY KEY,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"por_consignacion" boolean NOT NULL,
	"sucursal_id" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "kardex_producto_sucursal_secuencia_uq" ON "kardex" ("producto_id","sucursal_id","secuencia");--> statement-breakpoint
CREATE UNIQUE INDEX "kardex_movimiento_revertido_uq" ON "kardex" ("movimiento_revertido_id");--> statement-breakpoint
CREATE INDEX "kardex_producto_sucursal_fecha_idx" ON "kardex" ("producto_id","sucursal_id","fecha");--> statement-breakpoint
CREATE INDEX "kardex_sucursal_fecha_idx" ON "kardex" ("sucursal_id","fecha");--> statement-breakpoint
CREATE INDEX "kardex_sucursal_motivo_fecha_idx" ON "kardex" ("sucursal_id","motivo","fecha");--> statement-breakpoint
CREATE INDEX "kardex_origen_idx" ON "kardex" ("origen_tipo","origen_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_sucursal_producto_sucursal_uq" ON "stock_sucursal" ("producto_id","sucursal_id");--> statement-breakpoint
CREATE INDEX "stock_sucursal_sucursal_idx" ON "stock_sucursal" ("sucursal_id");--> statement-breakpoint
CREATE INDEX "traslado_origen_idx" ON "traslado" ("sucursal_origen_id");--> statement-breakpoint
CREATE INDEX "traslado_destino_idx" ON "traslado" ("sucursal_destino_id");--> statement-breakpoint
CREATE INDEX "traslado_estado_idx" ON "traslado" ("estado");--> statement-breakpoint
CREATE UNIQUE INDEX "traslado_detalle_traslado_producto_uq" ON "traslado_detalle" ("traslado_id","producto_id");--> statement-breakpoint
CREATE INDEX "traslado_detalle_producto_idx" ON "traslado_detalle" ("producto_id");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "caja" ADD CONSTRAINT "caja_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_createdByUserId_users_id_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_tipoDocumentoId_tipo_documento_id_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipo_documento"("id");--> statement-breakpoint
ALTER TABLE "comprobante" ADD CONSTRAINT "comprobante_tipoComprobantePagoId_tipo_comprobante_id_fkey" FOREIGN KEY ("tipoComprobantePagoId") REFERENCES "tipo_comprobante"("id");--> statement-breakpoint
ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id");--> statement-breakpoint
ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_venta_id_ventas_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id");--> statement-breakpoint
ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_producto_id_products_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_cajaId_caja_id_fkey" FOREIGN KEY ("cajaId") REFERENCES "caja"("id");--> statement-breakpoint
ALTER TABLE "egresos" ADD CONSTRAINT "egresos_createdByUserId_users_id_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cajaId_caja_id_fkey" FOREIGN KEY ("cajaId") REFERENCES "caja"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_createdByUserId_users_id_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_tipoPagoId_tipo_pago_id_fkey" FOREIGN KEY ("tipoPagoId") REFERENCES "tipo_pago"("id");--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_comprobanteId_comprobante_id_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "comprobante"("id");--> statement-breakpoint
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_movimiento_revertido_id_kardex_id_fkey" FOREIGN KEY ("movimiento_revertido_id") REFERENCES "kardex"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_producto_id_products_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "products"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_usuario_id_users_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categorias_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categorias"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_marca_id_marcas_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_unidad_id_unidades_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_proveedor_id_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id");--> statement-breakpoint
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_producto_id_products_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_sucursal_origen_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_origen_id") REFERENCES "sucursal"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_sucursal_destino_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_destino_id") REFERENCES "sucursal"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_creado_por_id_users_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado" ADD CONSTRAINT "traslado_recibido_por_id_users_id_fkey" FOREIGN KEY ("recibido_por_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "traslado_detalle" ADD CONSTRAINT "traslado_detalle_traslado_id_traslado_id_fkey" FOREIGN KEY ("traslado_id") REFERENCES "traslado"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "traslado_detalle" ADD CONSTRAINT "traslado_detalle_producto_id_products_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "products"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sucursal_id_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursal"("id");