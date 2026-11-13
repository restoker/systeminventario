import { z } from 'zod';

export const nuevaDevolucionSchema = z.object({
    sucursalId: z.string().min(1, 'La tienda / sucursal es obligatoria'),
    ventaId: z.string().min(1, 'Selecciona la venta asociada'),
    productoId: z.string().min(1, 'Selecciona el producto a devolver'),
    cantidad: z.coerce
        .number({ error: 'Ingresa una cantidad válida' })
        .int('La cantidad debe ser un número entero')
        .positive('La cantidad devuelta debe ser mayor a 0'),
    motivo: z
        .string()
        .trim()
        .min(3, 'Describe el motivo de la devolución (mínimo 3 caracteres)')
        .max(500, 'El motivo no puede exceder los 500 caracteres'),
});

export type NuevaDevolucionValues = z.infer<typeof nuevaDevolucionSchema>;

export interface DevolucionItemRow {
    id: string;
    fecha: string; // ISO
    fechaFormateada: string;
    horaFormateada: string;
    cantidad: number;
    motivo: string;
    // Producto
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    productoUnidad: string;
    productoImagenUrl: string | null;
    // Tienda / Sucursal
    sucursalId: string;
    sucursalNombre: string;
    sucursalCodigo: string;
    // Venta y Comprobante
    ventaId: string;
    cliente: string | null;
    numeroDocumento: string | null;
    comprobanteRef: string;
    vendedorNombre: string;
    precioUnitarioReferencia: number;
    montoEstimado: number;
}

export interface DevolucionMetrics {
    totalDevoluciones: number;
    totalUnidadesDevueltas: number;
    montoEstimadoDevuelto: number;
    sucursalesAfectadas: number;
}

export interface DevolucionFilters {
    fechaInicio: string;
    fechaFin: string;
    sucursalId: string;
    productoId: string;
    search: string;
}

export interface SucursalOption {
    id: string;
    nombre: string;
    codigo: string;
}

export interface CajaAbiertaOption {
    id: string;
    sucursalId: string;
    montoApertura: number;
    usuarioNombre: string;
    fechaAperturaFormateada: string;
}

export interface ProductoOption {
    id: string;
    nombre: string;
    codigo: string;
    unidad: string;
    precioVenta?: number;
}

export interface VentaItemDevolucionOption {
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    unidad: string;
    cantidadVendida: number;
    cantidadYaDevuelta: number;
    disponibleDevolver: number;
    precioUnitario: number;
}

export interface VentaOptionForDevolucion {
    id: string;
    sucursalId: string;
    sucursalNombre: string;
    fechaFormateada: string;
    cliente: string;
    numeroDocumento: string | null;
    comprobanteRef: string;
    total: number;
    items: VentaItemDevolucionOption[];
}

