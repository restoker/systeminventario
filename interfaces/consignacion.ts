export interface VentaConsignacionItemRow {
    id: string; // ID de productoVenta
    ventaId: string;
    fecha: string; // ISO string
    fechaFormateada: string;
    horaFormateada: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    precioTotal: number;
    // Producto
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    productoUnidad: string;
    productoImagenUrl: string | null;
    // Marca
    marcaId: string | null;
    marcaNombre: string;
    // Tienda / Sucursal
    sucursalId: string;
    sucursalNombre: string;
    sucursalCodigo: string;
    // Vendedor
    vendedorId: string;
    vendedorNombre: string;
    vendedorEmail: string;
    // Cliente y comprobante
    cliente: string | null;
    numeroDocumento: string | null;
    comprobanteRef: string;
    tipoComprobante: string | null;
    metodoPago: string | null;
    pagado: boolean;
}

export interface ConsignacionMetrics {
    totalRegistros: number;
    totalUnidades: number;
    montoTotalVendido: number;
    ticketPromedio: number;
}

export interface ConsignacionFilters {
    fechaInicio: string;
    fechaFin: string;
    marcaId: string;
    sucursalId: string;
    vendedorId: string;
    search: string;
}

export interface MarcaOption {
    id: string;
    nombre: string;
}

export interface SucursalOption {
    id: string;
    nombre: string;
    codigo: string;
}

export interface VendedorOption {
    id: string;
    name: string | null;
    email: string;
}

