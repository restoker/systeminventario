import { check, index, integer, text, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { coreTable } from "./communityShieldColumns";
import { products } from "./products";
import { sucursal } from "./sucursal";

/**
 * Stock de cada producto en cada sucursal.
 * Reemplaza a `products.stock` / `products.stockMinimo` / `products.sucursalId`
 * para que un mismo producto pueda existir en varias sucursales y trasladarse.
 */
export const stockSucursal = coreTable("stock_sucursal", {
    productoId: text("producto_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sucursalId: text("sucursal_id").notNull().references(() => sucursal.id, { onDelete: "cascade" }),
    cantidad: integer("cantidad").default(0).notNull(),
    stockMinimo: integer("stock_minimo").default(0).notNull(),
}, (t) => [
    uniqueIndex("stock_sucursal_producto_sucursal_uq").on(t.productoId, t.sucursalId),
    index("stock_sucursal_sucursal_idx").on(t.sucursalId),
    check("stock_sucursal_cantidad_no_negativa", sql`${t.cantidad} >= 0`),
    check("stock_sucursal_minimo_no_negativo", sql`${t.stockMinimo} >= 0`),
]);

export type StockSucursal = typeof stockSucursal.$inferSelect;
export type NewStockSucursal = typeof stockSucursal.$inferInsert;
