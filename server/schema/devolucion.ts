import { coreTable } from "./communityShieldColumns";
import { integer, timestamp, text } from "drizzle-orm/pg-core";
import { venta } from "./venta";
import { products } from "./products";
import { sucursal } from "./sucursal";

export const devolucion = coreTable('devolucion', {
    cantidad: integer('cantidad').notNull(),
    fecha: timestamp('fecha').notNull().defaultNow(),
    motivo: text('motivo').notNull(),
    sucursalId: integer('sucursal_id').notNull().references(() => sucursal.id),
    ventaId: integer('venta_id').notNull().references(() => venta.id),
    productoId: integer('producto_id').notNull().references(() => products.id),
})