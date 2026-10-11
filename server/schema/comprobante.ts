import { users } from "./auth-schema";
import { coreTable } from "./communityShieldColumns";
import { boolean, integer, real, text, uuid } from "drizzle-orm/pg-core";
import { tipoComprobante } from "./tipo-comprobante";
import { tipoDocumento } from "./tipo-documento";

export const comprobante = coreTable("comprobante", {
    numero: text('numero').notNull(),
    monto: real('monto').notNull(),
    estado: boolean('estado').default(true),
    direccion: text('direccion'),
    telefono: text('telefono'),
    numeroDocumento: text('numeroDocumento'),
    nombre: text('nombre'),
    createdByUserId: uuid('createdByUserId').references(() => users.id),
    tipoDocumentoId: uuid('tipoDocumentoId').references(() => tipoDocumento.id),
    tipoComprobanteId: uuid('tipoComprobantePagoId').notNull().references(() => tipoComprobante.id),
});

export type Comprobante = typeof comprobante.$inferSelect;
export type NewComprobante = typeof comprobante.$inferInsert;
