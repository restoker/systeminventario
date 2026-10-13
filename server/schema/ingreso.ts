import { boolean, pgEnum, real, text, uuid } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { caja } from "./caja";
import { users } from "./auth-schema";
import { tipoPago } from "./tipo-pago";
import { comprobante } from "./comprobante";

export const estadoIngresoEnum = pgEnum("estado_ingreso", ["activo", "anulado"]);

export const ingresos = coreTable("ingresos", {
    monto: real('monto').notNull(),
    descripcion: text('descripcion').notNull(),
    estado: estadoIngresoEnum('estado').default('activo'),
    otros: boolean('otros').default(false),
    isfromAdelanto: boolean('isfromAdelanto').default(false),
    cajaId: text('cajaId').notNull().references(() => caja.id),
    createdByUserId: text('createdByUserId').references(() => users.id),
    tipoPagoId: text('tipoPagoId').notNull().references(() => tipoPago.id),//tipo de pago hace refencia si se pago con yape, plin, efectivo, tarjeta, etc.
    comprobanteId: text('comprobanteId').references(() => comprobante.id),
});

