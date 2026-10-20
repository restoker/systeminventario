import { real, text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { users } from "./auth-schema";

export const comision = coreTable("comision", {
    porcentaje: real('porcentaje').notNull(),
    vendedorId: text('vendedor_id').references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
    }),
});

export type Comision = typeof comision.$inferSelect;
export type NewComision = typeof comision.$inferInsert;