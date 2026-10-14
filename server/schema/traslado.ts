import { check, index, integer, pgEnum, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { coreTable } from "./communityShieldColumns";
import { sucursal } from "./sucursal";
import { products } from "./products";
import { users } from "./auth-schema";

export const estadoTraslado = pgEnum("estado_traslado", ["pendiente", "recibido", "recibido_parcial", "cancelado"]);

/**
 * Cabecera del traslado: un envío de una sucursal a otra.
 * Los productos enviados van en `trasladoDetalle`.
 */
export const traslado = coreTable("traslado", {
    codigo: text("codigo").notNull().unique(), // correlativo legible, ej. TR-000123
    fechaTraslado: timestamp("fecha_traslado").defaultNow().notNull(),
    estado: estadoTraslado("estado").default("pendiente").notNull(),
    motivo: text("motivo").notNull(),
    observacion: text("observacion"),
    sucursalOrigenId: text("sucursal_origen_id").notNull().references(() => sucursal.id, { onDelete: "restrict" }),
    sucursalDestinoId: text("sucursal_destino_id").notNull().references(() => sucursal.id, { onDelete: "restrict" }),
    creadoPorId: text("creado_por_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    recibidoPorId: text("recibido_por_id").references(() => users.id, { onDelete: "restrict" }),
    fechaEnvio: timestamp("fecha_envio"),
    fechaRecepcion: timestamp("fecha_recepcion"),
}, (t) => [
    check("traslado_origen_distinto_destino", sql`${t.sucursalOrigenId} <> ${t.sucursalDestinoId}`),
    index("traslado_origen_idx").on(t.sucursalOrigenId),
    index("traslado_destino_idx").on(t.sucursalDestinoId),
    index("traslado_estado_idx").on(t.estado),
]);

/**
 * Detalle del traslado: cada producto y su cantidad.
 * `cantidadRecibida` < `cantidadEnviada` => estado `recibido_parcial`.
 */
export const trasladoDetalle = coreTable("traslado_detalle", {
    trasladoId: text("traslado_id").notNull().references(() => traslado.id, { onDelete: "cascade" }),
    productoId: text("producto_id").notNull().references(() => products.id, { onDelete: "restrict" }),
    cantidadEnviada: integer("cantidad_enviada").notNull(),
    cantidadRecibida: integer("cantidad_recibida"),
}, (t) => [
    check("traslado_detalle_cantidad_enviada_positiva", sql`${t.cantidadEnviada} > 0`),
    check("traslado_detalle_cantidad_recibida_valida", sql`${t.cantidadRecibida} IS NULL OR (${t.cantidadRecibida} >= 0 AND ${t.cantidadRecibida} <= ${t.cantidadEnviada})`),
    uniqueIndex("traslado_detalle_traslado_producto_uq").on(t.trasladoId, t.productoId),
    index("traslado_detalle_producto_idx").on(t.productoId),
]);

export type Traslado = typeof traslado.$inferSelect;
export type NewTraslado = typeof traslado.$inferInsert;
export type TrasladoDetalle = typeof trasladoDetalle.$inferSelect;
export type NewTrasladoDetalle = typeof trasladoDetalle.$inferInsert;