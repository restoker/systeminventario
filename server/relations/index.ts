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
import { venta } from "../schema/venta";
import { kardex } from "../schema/kardex";
import { igv } from "../schema/igv";
import { imagenProducto } from "../schema/imagen-producto";
import { tipoDocumento } from "../schema/tipo-documento";
import { comision } from "../schema/comision";
import { configuracion } from "../schema/configuracion";
import { caja } from "../schema/caja";
import { comprobante } from "../schema/comprobante";
import { usuarioSucursal } from "../schema/usuario-sucursal";

export const relations = defineRelations({ users, sessions, accounts, categorias, products, marcas, unidades, proveedor, sucursal, tipoComprobante, tipoPago, traslado, trasladoDetalle, stockSucursal, venta, kardex, igv, imagenProducto, tipoDocumento, comision, configuracion, caja, comprobante, usuarioSucursal }, (r) => ({
    users: {
        // 1:N — sesiones de Better Auth del usuario.
        sessions: r.many.sessions({
            from: r.users.id,
            to: r.sessions.userId
        }),
        // 1:N — cuentas (credenciales/proveedores) de Better Auth.
        accounts: r.many.accounts({
            from: r.users.id,
            to: r.accounts.userId
        }),
        // N:M — sucursales donde el usuario puede vender, a través de `usuario_sucursal`.
        // admin → varias; saler → una sola (validado al asignar).
        // Uso: db.query.users.findFirst({ with: { sucursales: true } })
        sucursales: r.many.sucursal({
            from: r.users.id.through(r.usuarioSucursal.userId),
            to: r.sucursal.id.through(r.usuarioSucursal.sucursalId),
        }),
        // 1:N — filas de la tabla intermedia (útil para ver fecha de asignación).
        asignacionesSucursal: r.many.usuarioSucursal({
            from: r.users.id,
            to: r.usuarioSucursal.userId,
        }),
        // 1:N — cajas abiertas por el usuario.
        cajas: r.many.caja({
            from: r.users.id,
            to: r.caja.userId,
        }),
        // 1:N — ventas realizadas por el usuario (columna `ventas.vendedor`).
        ventas: r.many.venta({
            from: r.users.id,
            to: r.venta.vendedor,
        }),
        // 1:N — comisiones configuradas para el vendedor.
        comisiones: r.many.comision({
            from: r.users.id,
            to: r.comision.vendedorId,
        }),
    },
    // Tabla intermedia usuario ↔ sucursal: cada fila apunta a UN usuario y UNA sucursal.
    usuarioSucursal: {
        user: r.one.users({
            from: r.usuarioSucursal.userId,
            to: r.users.id,
        }),
        sucursal: r.one.sucursal({
            from: r.usuarioSucursal.sucursalId,
            to: r.sucursal.id,
        }),
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
        kardexs: r.many.kardex({
            from: r.products.id,
            to: r.kardex.productoId,
        }),
        imagenes: r.many.imagenProducto({
            from: r.products.id,
            to: r.imagenProducto.productoId,
        }),
    },
    imagenProducto: {
        product: r.one.products({
            from: r.imagenProducto.productoId,
            to: r.products.id,
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
        movimientosKardex: r.many.kardex({
            from: r.sucursal.id,
            to: r.kardex.sucursalId,
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
        // N:M — usuarios que pueden vender en esta sucursal (inversa de users.sucursales).
        usuarios: r.many.users({
            from: r.sucursal.id.through(r.usuarioSucursal.sucursalId),
            to: r.users.id.through(r.usuarioSucursal.userId),
        }),
        // 1:N — cajas de la sucursal.
        cajas: r.many.caja({
            from: r.sucursal.id,
            to: r.caja.sucursalId,
        }),
        // 1:N — ventas registradas en la sucursal.
        ventas: r.many.venta({
            from: r.sucursal.id,
            to: r.venta.sucursalId,
        }),
    },
    // Caja: pertenece a UN usuario y a UNA sucursal; agrupa muchas ventas.
    caja: {
        usuario: r.one.users({
            from: r.caja.userId,
            to: r.users.id,
        }),
        sucursal: r.one.sucursal({
            from: r.caja.sucursalId,
            to: r.sucursal.id,
        }),
        ventas: r.many.venta({
            from: r.caja.id,
            to: r.venta.cajaId,
        }),
    },
    // Venta: es el lado "N" de todas sus FKs, por eso todas son `one`.
    venta: {
        sucursal: r.one.sucursal({
            from: r.venta.sucursalId,
            to: r.sucursal.id,
        }),
        caja: r.one.caja({
            from: r.venta.cajaId,
            to: r.caja.id,
        }),
        usuario: r.one.users({
            from: r.venta.vendedor,
            to: r.users.id,
        }),
        metodoPago: r.one.tipoPago({
            from: r.venta.metodoPagoId,
            to: r.tipoPago.id,
        }),
        // Opcional: comprobanteId es nullable.
        comprobante: r.one.comprobante({
            from: r.venta.comprobanteId,
            to: r.comprobante.id,
        }),
    },
    // Comprobante: tipo, tipo de documento y usuario que lo creó.
    comprobante: {
        tipoComprobante: r.one.tipoComprobante({
            from: r.comprobante.tipoComprobanteId,
            to: r.tipoComprobante.id,
        }),
        tipoDocumento: r.one.tipoDocumento({
            from: r.comprobante.tipoDocumentoId,
            to: r.tipoDocumento.id,
        }),
        creadoPor: r.one.users({
            from: r.comprobante.createdByUserId,
            to: r.users.id,
        }),
        ventas: r.many.venta({ //TODO: ⚠️ revisar esta relacion, ya que solamente se puede emitir un comprobante por venta, no muchas.
            from: r.comprobante.id,
            to: r.venta.comprobanteId,
        }),
    },
    // Comisión: pertenece a UN vendedor.
    comision: {
        vendedor: r.one.users({
            from: r.comision.vendedorId,
            to: r.users.id,
        }),
    },
    // Método de pago: usado por muchas ventas.
    tipoPago: {
        ventas: r.many.venta({
            from: r.tipoPago.id,
            to: r.venta.metodoPagoId,
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
    kardex: {
        producto: r.one.products({
            from: r.kardex.productoId,
            to: r.products.id,
        }),
        sucursal: r.one.sucursal({
            from: r.kardex.sucursalId,
            to: r.sucursal.id,
        }),
        usuario: r.one.users({
            from: r.kardex.usuarioId,
            to: r.users.id,
        }),
        movimientoRevertido: r.one.kardex({
            from: r.kardex.movimientoRevertidoId,
            to: r.kardex.id,
        }),
    },
}));

