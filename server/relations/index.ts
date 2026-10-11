import { defineRelations } from "drizzle-orm";
import { users, sessions, accounts } from "../schema/auth-schema";
import { categorias } from "../schema/categorias";
import { products } from "../schema/products";
import { marcas } from "../schema/marca";
import { unidades } from "../schema/unidad";
import { proveedor } from "../schema/proveedor";
import { sucursal } from "../schema/sucursal";
import { tipoComprobante } from "../schema/tipo-comprobante";
import { tipoPago } from "../schema/tipo-pago";

export const relations = defineRelations({ users, sessions, accounts, categorias, products, marcas, unidades, proveedor, sucursal, tipoComprobante, tipoPago }, (r) => ({
    users: {
        sessions: r.many.sessions({
            from: r.users.id,
            to: r.sessions.userId
        }),
        accounts: r.many.accounts({
            from: r.users.id,
            to: r.accounts.userId
        })
    },
    sessions: {
        user: r.one.users({
            from: r.sessions.userId,
            to: r.users.id
        })
    },
    accounts: {
        user: r.one.users({
            from: r.accounts.userId,
            to: r.users.id
        })
    },
    categorias: {
        products: r.many.products({
            from: r.categorias.id,
            to: r.products.categoryId
        })
    },
    products: {
        categoria: r.one.categorias({
            from: r.products.categoryId,
            to: r.categorias.id
        }),
        marca: r.one.marcas({
            from: r.products.marcaId,
            to: r.marcas.id
        }),
        unidad: r.one.unidades({
            from: r.products.unidadId,
            to: r.unidades.id
        }),
        proveedor: r.one.proveedor({
            from: r.products.proveedorId,
            to: r.proveedor.id
        }),
        sucursal: r.one.sucursal({
            from: r.products.sucursalId,
            to: r.sucursal.id
        }),
    },
    marcas: {
        products: r.many.products({
            from: r.marcas.id,
            to: r.products.marcaId,
        })
    },
    unidades: {
        products: r.many.products({
            from: r.unidades.id,
            to: r.products.unidadId,
        })
    },
}));

