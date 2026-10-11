import { text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const unidades = coreTable("unidades", {
    nombre: text("nombre").notNull(),
    abreviatura: text("abreviatura").notNull(),
});

export type Unidad = typeof unidades.$inferSelect;
export type NewUnidad = typeof unidades.$inferInsert;