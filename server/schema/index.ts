import { users, sessions, accounts, verifications, roleEnum } from "./auth-schema";
import { caja } from "./caja";
import { categorias } from "./categorias";
import { comprobante } from "./comprobante";
import { estadoIngresoEnum, ingresos } from "./ingreso";
import { marcas } from "./marca";
import { products } from "./products";
import { proveedor } from "./proveedor";
import { sucursal } from "./sucursal";
import { tipoComprobante } from "./tipo-comprobante";
import { tipoDocumento } from "./tipo-documento";
import { tipoPago } from "./tipo-pago";
import { unidades } from "./unidad";
import { estadoTraslado, traslado, trasladoDetalle } from "./traslado";
import { stockSucursal } from "./stock-sucursal";
import { venta } from "./venta";

export default {
    users,
    products,
    sessions,
    accounts,
    verifications,
    roleEnum,
    categorias,
    marcas,
    unidades,
    proveedor,
    sucursal,
    tipoComprobante,
    tipoPago,
    tipoDocumento,
    comprobante,
    ingresos,
    estadoIngresoEnum,
    caja,
    traslado,
    trasladoDetalle,
    estadoTraslado,
    stockSucursal,
    venta,
}