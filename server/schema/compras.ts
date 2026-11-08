import { boolean, integer, pgEnum, real, text, timestamp } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { tipoComprobante } from "./tipo-comprobante";
import { users } from "./auth-schema";
import { caja } from "./caja";
import { proveedor } from "./proveedor";
import { sucursal } from "./sucursal";

export const EstadoCompra = pgEnum("estado_compra", ["pagado", "pendiente"]);
// export const estadoEgresoEnum = pgEnum("estado_egreso", ["activo", "anulado"]);

export const compra = coreTable('compra', {
    monto: real('monto').notNull(),
    numeroComprobante: text('numeroComprobante').notNull(),
    isACredito: boolean('isACredito').default(false),
    numeroDiasCredito: integer('numeroDiasCredito'),
    fechaComprobante: timestamp('fechaComprobante', { mode: 'date', withTimezone: true }),
    estado: EstadoCompra('estado').default('pendiente'),
    tipoComprobanteId: text('tipoComprobanteId').notNull().references(() => tipoComprobante.id),
    userId: text('userId').notNull().references(() => users.id),
    cajaId: text('cajaId').notNull().references(() => caja.id),
    proveedorId: text('proveedorId').references(() => proveedor.id).notNull(),
    sucursalId: text('sucursalId').notNull().references(() => sucursal.id),
})