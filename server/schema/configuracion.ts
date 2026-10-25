import { real } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const configuracion = coreTable("configuracion", {
    recargoTarjeta: real("recargo_tarjeta").default(0.05).notNull(),
    comisionVendedor: real("comision_vendedor").default(0.03).notNull(),
});

export type Configuracion = typeof configuracion.$inferSelect;
export type NewConfiguracion = typeof configuracion.$inferInsert;
