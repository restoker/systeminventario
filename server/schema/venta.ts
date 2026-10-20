import { boolean, numeric, real, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { sucursal } from "./sucursal";
import { comprobante } from "./comprobante";
import { caja } from "./caja";
import { tipoPago } from "./tipo-pago";
import { users } from "./auth-schema";

export const venta = coreTable("ventas", {
    cliente: text("cliente"), //nombre del cliente, cuando sea persona natural, si es empresa se guarda el nombre de la empresa
    numeroDocumento: text('numeroDocumento'), //en caso sea persona natural, se guarda el DNI, si es empresa, se guarda el RUC
    telefono: text('telefono'),
    direccion: text('direccion'),
    porConsignacion: boolean("por_consignacion").notNull(),
    recargo: real("recargo").default(0.05),
    subTotal: real("subtotal").notNull(),
    descuento: real("descuento").default(0),
    total: real("total").notNull(),
    saldoPendiente: real("saldoPendiente").notNull(),
    sucursalId: text("sucursal_id").references(() => sucursal.id).notNull(),
    metodoPagoId: text('metodopago_id').notNull().references(() => tipoPago.id),
    comprobanteId: text("comprobante_id").references(() => comprobante.id),
    cajaId: text("caja_id").references(() => caja.id).notNull(),
    vendedor: text("vendedor").references(() => users.id).notNull(),
})

export type Venta = typeof venta.$inferSelect;
export type NewVenta = typeof venta.$inferInsert;
