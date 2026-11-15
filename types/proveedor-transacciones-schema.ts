import { z } from 'zod';

export const pagarCompraProveedorSchema = z.object({
    compraId: z.string().min(1, 'El identificador de la compra es obligatorio'),
});

export type PagarCompraProveedorInput = z.infer<typeof pagarCompraProveedorSchema>;

export interface CompraProductoDetalle {
    id: string;
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface CompraProveedorRow {
    id: string;
    numeroComprobante: string;
    tipoComprobanteNombre: string;
    tipoComprobanteSerie: string;
    monto: number;
    estado: 'pagado' | 'pendiente';
    isACredito: boolean;
    numeroDiasCredito: number | null;
    fechaEmisionIso: string;
    fechaEmisionFormateada: string;
    horaEmisionFormateada: string;
    fechaVencimientoIso: string | null;
    fechaVencimientoFormateada: string | null;
    diasRestantes: number | null; // < 0 = vencida, 0 = vence hoy, > 0 = días restantes
    proveedorId: string;
    proveedorNombre: string;
    proveedorRazonSocial: string | null;
    proveedorDocumento: string | null;
    proveedorTelefono: string | null;
    sucursalId: string;
    sucursalNombre: string;
    sucursalCodigo: string;
    usuarioNombre: string;
    itemsCount: number;
    totalUnidades: number;
    items: CompraProductoDetalle[];
}

export interface TransaccionesMetrics {
    totalTransacciones: number;
    montoTotalComprado: number;
    montoPendientePagar: number;
    montoTotalPagado: number;
    cantidadPendientes: number;
    cantidadPagadas: number;
    cantidadVencidas: number;
    proveedoresConDeuda: number;
}

export interface TransaccionesFilters {
    fechaInicio: string;
    fechaFin: string;
    proveedorId: string;
    sucursalId: string;
    estado: 'all' | 'pendiente' | 'pagado';
    condicion: 'all' | 'credito' | 'contado';
    search: string;
}

export interface ProveedorFilterOption {
    id: string;
    nombre: string;
    razonSocial: string | null;
    numeroDocumento: string | null;
}

export interface SucursalFilterOption {
    id: string;
    nombre: string;
    codigo: string;
}

export interface CajaAbiertaTransaccionOption {
    id: string;
    sucursalId: string;
    usuarioNombre: string;
    fechaAperturaFormateada: string;
}
