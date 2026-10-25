import { text, real, integer, uuid, boolean } from "drizzle-orm/pg-core";
import { coreTable } from "./communityShieldColumns";
import { categorias } from "./categorias";
import { marcas } from "./marca";
import { unidades } from "./unidad";
import { proveedor } from "./proveedor";
// import { sucursal } from "./sucursal";

export const products = coreTable("products", {
    name: text("name").notNull(),
    codigo: text("codigo").unique().notNull(),
    // price: real("price").notNull(),
    description: text("description").notNull(),
    precioCompra: real("precio_compra").default(0),
    precioVenta: real("precio_venta").notNull(),
    igv: real("igv").default(0.18),
    // image: text("image"),
    enConsignacion: boolean("en_consignacion").default(false),//si esta en consignación se no se establece el precio de compra
    // el stock por sucursal vive en `stock_sucursal`
    nota: text("nota"),
    // slug: text("slug").notNull(),
    categoryId: text("category_id").notNull().references(() => categorias.id),
    marcaId: text("marca_id").references(() => marcas.id),
    unidadId: text("unidad_id").notNull().references(() => unidades.id),
    proveedorId: text("proveedor_id").references(() => proveedor.id),
    // sucursalId: text("sucursal_id").references(() => sucursal.id),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;


