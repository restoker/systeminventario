import { check, index, integer, numeric, pgEnum, text, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { immutableTable } from "./communityShieldColumns";
import { products } from "./products";
import { sucursal } from "./sucursal";
import { users } from "./auth-schema";

// Dirección del flujo de inventario
export const tipoMovimientoKardexEnum = pgEnum("tipo_movimiento_kardex", [
    "ENTRADA",
    "SALIDA",
]);

/**
 * Motivos que SUMAN stock (tipoMovimiento = ENTRADA).
 */
export const MOTIVOS_ENTRADA = [
    // Adquisición de mercadería a un proveedor (aumenta stock y actualiza costo de compra)
    "COMPRA",
    // Recepción y confirmación de stock en la sucursal destino procedente de otra sucursal
    "TRASLADO_ENTRADA",
    // Reingreso de mercadería por devolución o cambio solicitado por el cliente
    "DEVOLUCION_CLIENTE",
    // Regularización tras conteo/auditoría física (se encontraron más unidades de las registradas)
    "AJUSTE_POSITIVO",
    // Carga inicial de existencias al iniciar operaciones o registrar un nuevo producto en la sucursal
    "INVENTARIO_INICIAL",
    // Contramovimiento que revierte una SALIDA registrada por error (ej. venta anulada)
    "ANULACION_SALIDA",
] as const;

/**
 * Motivos que RESTAN stock (tipoMovimiento = SALIDA).
 */
export const MOTIVOS_SALIDA = [
    // Despacho o entrega de productos por venta a un cliente
    "VENTA",
    // Envío de stock desde la sucursal origen hacia otra sucursal
    "TRASLADO_SALIDA",
    // Devolución de mercadería al proveedor (por falla, vencimiento o error de pedido)
    "DEVOLUCION_PROVEEDOR",
    // Regularización tras conteo/auditoría física (faltante de stock en almacén)
    "AJUSTE_NEGATIVO",
    // Pérdida justificada por descomposición, rotura, vencimiento o merma operativa
    "MERMA",
    // Contramovimiento que revierte una ENTRADA registrada por error (ej. compra anulada)
    "ANULACION_ENTRADA",
] as const;

/**
 * Catálogo de motivos u operaciones que justifican el movimiento en el Kardex.
 */
export const motivoKardexEnum = pgEnum("motivo_kardex", [...MOTIVOS_ENTRADA, ...MOTIVOS_SALIDA]);

export type MotivoKardex = (typeof motivoKardexEnum.enumValues)[number];
export type TipoMovimientoKardex = (typeof tipoMovimientoKardexEnum.enumValues)[number];

/** Deriva la dirección del movimiento a partir del motivo (usar en la capa de servicio). */
export function tipoMovimientoDeMotivo(motivo: MotivoKardex): TipoMovimientoKardex {
    return (MOTIVOS_ENTRADA as readonly string[]).includes(motivo) ? "ENTRADA" : "SALIDA";
}

/**
 * Módulo/entidad del sistema que originó el movimiento.
 */
export const origenKardexEnum = pgEnum("origen_kardex", [
    "VENTA",
    "INGRESO",
    "EGRESO",
    "TRASLADO",
    "DEVOLUCION",
    "AJUSTE",
    "INVENTARIO",
]);

const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(", "));

/**
 * Kardex: libro de movimientos de inventario por producto y sucursal.
 * Es APPEND-ONLY: los registros no se editan ni eliminan; los errores se
 * corrigen insertando un contramovimiento (ANULACION_ENTRADA / ANULACION_SALIDA).
 *
 * Al insertar (dentro de una transacción):
 *  1. Bloquear la fila de `stock_sucursal` con SELECT ... FOR UPDATE.
 *  2. Calcular stockAnterior / stockActual / secuencia (= última + 1).
 *  3. Insertar en kardex y actualizar `stock_sucursal.cantidad`.
 *
 * Los montos usan `numeric` (modo string) para precisión exacta: operar con
 * una librería decimal o en SQL, nunca con floats de JS.
 */
export const kardex = immutableTable(
    "kardex",
    {
        // Correlativo del movimiento dentro de (producto, sucursal): orden determinista y control de concurrencia
        secuencia: integer("secuencia").notNull(),
        // Dirección del flujo: ENTRADA o SALIDA (debe ser coherente con el motivo)
        tipoMovimiento: tipoMovimientoKardexEnum("tipo_movimiento").notNull(),
        // Justificación operativa del movimiento (COMPRA, VENTA, TRASLADO, etc.)
        motivo: motivoKardexEnum("motivo").notNull(),
        // Observación o nota adicional sobre la causa del movimiento
        detalleMotivo: text("detalle_motivo"),
        // Módulo origen del movimiento (VENTA, INGRESO, TRASLADO, ...)
        origenTipo: origenKardexEnum("origen_tipo"),
        // ID del registro que originó este movimiento en el sistema
        origenId: text("origen_id"),
        // Unidades que entran o salen en este movimiento (número positivo)
        cantidad: integer("cantidad").notNull(),
        // Stock que existía en la sucursal antes de este movimiento
        stockAnterior: integer("stock_anterior").notNull(),
        // Stock resultante en la sucursal tras aplicar el movimiento
        stockActual: integer("stock_actual").notNull(),
        // Costo unitario de compra o adquisición para este movimiento
        costoUnitario: numeric("costo_unitario", { precision: 14, scale: 4 }),
        // Monto total valorizado del movimiento (calculado: cantidad * costoUnitario)
        costoTotal: numeric("costo_total", { precision: 14, scale: 2 })
            .generatedAlwaysAs(sql`"cantidad" * "costo_unitario"`),
        // Costo promedio ponderado resultante del producto en la sucursal
        costoPromedio: numeric("costo_promedio", { precision: 14, scale: 4 }),
        // Valor monetario del inventario remanente (calculado: stockActual * costoPromedio)
        saldoValorizado: numeric("saldo_valorizado", { precision: 14, scale: 2 })
            .generatedAlwaysAs(sql`"stock_actual" * "costo_promedio"`),
        // Precio de venta unitario si la operación corresponde a una venta
        precioVentaUnitario: numeric("precio_venta_unitario", { precision: 14, scale: 2 }),
        // Fecha y hora del movimiento en el inventario
        fecha: timestamp("fecha", { withTimezone: true }).defaultNow().notNull(),
        // Serie o correlativo legible del documento de respaldo (ej: "B001-00124", "TR-00045")
        comprobanteRef: text("comprobante_ref"),
        // Movimiento original que este registro revierte (solo para motivos ANULACION_*)
        movimientoRevertidoId: text("movimiento_revertido_id")
            .references((): AnyPgColumn => kardex.id, { onDelete: "restrict" }),
        // Producto que se mueve en el inventario
        productoId: text("producto_id")
            .notNull()
            .references(() => products.id, { onDelete: "restrict" }),
        // Sucursal donde se registra el movimiento físico
        sucursalId: text("sucursal_id")
            .notNull()
            .references(() => sucursal.id, { onDelete: "restrict" }),
        // Usuario o colaborador responsable que ejecutó la operación
        usuarioId: text("usuario_id")
            .references(() => users.id, { onDelete: "set null" }),
    },
    (t) => [
        // Orden y concurrencia: dos inserts simultáneos con la misma secuencia fallan en vez de corromper el saldo
        uniqueIndex("kardex_producto_sucursal_secuencia_uq").on(t.productoId, t.sucursalId, t.secuencia),
        // Un movimiento solo puede revertirse una vez
        uniqueIndex("kardex_movimiento_revertido_uq").on(t.movimientoRevertidoId),
        index("kardex_producto_sucursal_fecha_idx").on(t.productoId, t.sucursalId, t.fecha),
        index("kardex_sucursal_fecha_idx").on(t.sucursalId, t.fecha),
        index("kardex_sucursal_motivo_fecha_idx").on(t.sucursalId, t.motivo, t.fecha),
        index("kardex_origen_idx").on(t.origenTipo, t.origenId),
        check("kardex_secuencia_positiva", sql`${t.secuencia} > 0`),
        check("kardex_cantidad_positiva", sql`${t.cantidad} > 0`),
        check("kardex_stock_anterior_valido", sql`${t.stockAnterior} >= 0`),
        check("kardex_stock_actual_valido", sql`${t.stockActual} >= 0`),
        // La aritmética del stock debe cuadrar con la dirección del movimiento
        check(
            "kardex_stock_cuadra",
            sql`(${t.tipoMovimiento} = 'ENTRADA' AND ${t.stockActual} = ${t.stockAnterior} + ${t.cantidad})
             OR (${t.tipoMovimiento} = 'SALIDA' AND ${t.stockActual} = ${t.stockAnterior} - ${t.cantidad})`
        ),
        // El motivo determina la dirección (no se permite ENTRADA + VENTA, etc.)
        check(
            "kardex_tipo_motivo_coherente",
            sql`(${t.tipoMovimiento} = 'ENTRADA' AND ${t.motivo}::text IN (${sqlList(MOTIVOS_ENTRADA)}))
             OR (${t.tipoMovimiento} = 'SALIDA' AND ${t.motivo}::text IN (${sqlList(MOTIVOS_SALIDA)}))`
        ),
        // origenTipo y origenId van juntos (ambos o ninguno)
        check("kardex_origen_completo", sql`(${t.origenTipo} IS NULL) = (${t.origenId} IS NULL)`),
        // Las anulaciones deben apuntar al movimiento que revierten, y solo ellas
        check(
            "kardex_anulacion_referencia",
            sql`(${t.motivo}::text IN ('ANULACION_ENTRADA', 'ANULACION_SALIDA')) = (${t.movimientoRevertidoId} IS NOT NULL)`
        ),
        check(
            "kardex_montos_no_negativos",
            sql`coalesce(${t.costoUnitario}, 0) >= 0
            AND coalesce(${t.costoPromedio}, 0) >= 0
            AND coalesce(${t.precioVentaUnitario}, 0) >= 0`
        ),
    ]
);

export type Kardex = typeof kardex.$inferSelect;
export type NewKardex = typeof kardex.$inferInsert;