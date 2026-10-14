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
import { traslado, trasladoDetalle } from "../schema/traslado";
import { stockSucursal } from "../schema/stock-sucursal";

export const relations = defineRelations({ users, sessions, accounts, categorias, products, marcas, unidades, proveedor, sucursal, tipoComprobante, tipoPago, traslado, trasladoDetalle, stockSucursal }, (r) => ({
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
        stocks: r.many.stockSucursal({
            from: r.products.id,
            to: r.stockSucursal.productoId,
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
    sucursal: {
        stocks: r.many.stockSucursal({
            from: r.sucursal.id,
            to: r.stockSucursal.sucursalId,
        }),
        trasladosEnviados: r.many.traslado({
            from: r.sucursal.id,
            to: r.traslado.sucursalOrigenId,
            alias: "traslado_origen",
        }),
        trasladosRecibidos: r.many.traslado({
            from: r.sucursal.id,
            to: r.traslado.sucursalDestinoId,
            alias: "traslado_destino",
        }),
    },
    stockSucursal: {
        producto: r.one.products({
            from: r.stockSucursal.productoId,
            to: r.products.id,
        }),
        sucursal: r.one.sucursal({
            from: r.stockSucursal.sucursalId,
            to: r.sucursal.id,
        }),
    },
    traslado: {
        sucursalOrigen: r.one.sucursal({
            from: r.traslado.sucursalOrigenId,
            to: r.sucursal.id,
            alias: "traslado_origen",
        }),
        sucursalDestino: r.one.sucursal({
            from: r.traslado.sucursalDestinoId,
            to: r.sucursal.id,
            alias: "traslado_destino",
        }),
        creadoPor: r.one.users({
            from: r.traslado.creadoPorId,
            to: r.users.id,
            alias: "traslado_creado_por",
        }),
        recibidoPor: r.one.users({
            from: r.traslado.recibidoPorId,
            to: r.users.id,
            alias: "traslado_recibido_por",
        }),
        detalles: r.many.trasladoDetalle({
            from: r.traslado.id,
            to: r.trasladoDetalle.trasladoId,
        }),
    },
    trasladoDetalle: {
        traslado: r.one.traslado({
            from: r.trasladoDetalle.trasladoId,
            to: r.traslado.id,
        }),
        producto: r.one.products({
            from: r.trasladoDetalle.productoId,
            to: r.products.id,
        }),
    },
}));

