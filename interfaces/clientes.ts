export type ClienteTipoCategoria = 'empresa' | 'persona' | 'varios';

export type ClienteSegmentoFiltro =
    | 'all'
    | 'empresa'
    | 'persona'
    | 'con_saldo'
    | 'sin_documento';

export type ClienteOrdenFiltro =
    | 'ultima_compra'
    | 'mayor_gasto'
    | 'mas_compras'
    | 'saldo_pendiente'
    | 'nombre';

export interface ClienteSucursalOption {
    id: string;
    nombre: string;
    codigo: string;
}

export interface ClienteVentaProductoItem {
    id: string;
    productId: string;
    productoNombre: string;
    productoCodigo: string;
    unidadAbreviatura: string;
    cantidad: number;
    precio: number;
    descuento: number;
    precioTotal: number;
}

export interface ClienteVentaHistorialItem {
    id: string;
    fechaIso: string;
    fechaFormateada: string;
    horaFormateada: string;
    sucursalId: string;
    sucursalNombre: string;
    vendedorNombre: string;
    metodoPagoNombre: string;
    comprobanteRef: string;
    comprobanteEstado: boolean | null;
    pagado: boolean;
    subTotal: number;
    descuento: number;
    total: number;
    saldoPendiente: number;
    productosCount: number;
    productos: ClienteVentaProductoItem[];
}

export interface ClienteResumenRow {
    id: string;
    nombre: string;
    categoria: ClienteTipoCategoria;
    numeroDocumento: string | null;
    tipoDocumentoNombre: string | null;
    telefono: string | null;
    direccion: string | null;
    totalCompras: number;
    totalProductos: number;
    totalGastado: number;
    ticketPromedio: number;
    totalDescuentos: number;
    totalPendiente: number;
    ventasConSaldoCount: number;
    primeraCompraIso: string;
    ultimaCompraIso: string;
    ultimaCompraFormateada: string;
    ultimaCompraHora: string;
    sucursalPrincipalNombre: string;
    sucursalesNombres: string[];
    metodosPago: string[];
    esPublicoGeneral: boolean;
    ventas: ClienteVentaHistorialItem[];
}

export interface ClientesMetrics {
    totalPerfiles: number;
    clientesIdentificados: number;
    clientesEmpresa: number;
    clientesPersona: number;
    clientesSinDocumento: number;
    clientesFrecuentes: number;
    clientesConSaldo: number;
    totalVentasAnalizadas: number;
    montoTotalVendido: number;
    montoSaldoPendiente: number;
    ventasPublicoGeneralCount: number;
}

export interface ClientesFilters {
    search: string;
    segmento: ClienteSegmentoFiltro;
    sucursalId: string;
    sortBy: ClienteOrdenFiltro;
}
