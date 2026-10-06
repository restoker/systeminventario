import { pgTable, text, real, integer, uuid } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    price: real("price").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    stock: integer("stock").notNull(),
    slug: text("slug").notNull(),
    // categoryId: text("category_id").notNull().references(() => categories.id),

});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;


