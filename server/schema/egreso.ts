import { pgEnum, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { users } from "./auth-schema";
import { caja } from "./caja";

export const tipoComprobantePagoEnum = pgEnum("tipo_comprobante_pago", ["ticket", "boleta", "factura", "cheque", "sin comprobante"]);
export const motivoEgresoEnum = pgEnum("motivo_egreso", ["compras", "servicios", "remuneracion", "administrativo", "comision", "otros"]);
export const estadoEgresoEnum = pgEnum("estado_egreso", ["activo", "anulado"]);

export const egresos = coreTable("egresos", {
    tipoDocumento: tipoComprobantePagoEnum('tipoDocumento'),
    motivo: motivoEgresoEnum('motivo').notNull(),
    serie: text('serie'),
    numero: text('numero'),
    fecha: timestamp('fecha', { mode: 'date', withTimezone: true }),
    descripcion: text('descripcion').notNull(),
    monto: real('monto').notNull(),
    estado: estadoEgresoEnum('estado').default('activo'),
    cajaId: text('cajaId').notNull().references(() => caja.id),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow(),
    createdByUserId: text('createdByUserId').references(() => users.id),
});