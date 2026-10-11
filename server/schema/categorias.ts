import { text } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";

export const categorias = coreTable("categorias", {
    nombre: text("nombre").notNull(),
});

export type Categoria = typeof categorias.$inferSelect;
export type NewCategoria = typeof categorias.$inferInsert;