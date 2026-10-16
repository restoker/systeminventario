import { boolean, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { sucursal } from "./sucursal";

export const venta = coreTable("ventas", {
    porConsignacion: boolean("por_consignacion").notNull(),
    sucursalId: text("sucursal_id").references(() => sucursal.id).notNull(),
})

export type Venta = typeof venta.$inferSelect;
export type NewVenta = typeof venta.$inferInsert;
