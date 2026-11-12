export const MOTIVOS_LABELS: Record<string, string> = {
    COMPRA: 'Compra a Proveedor',
    VENTA: 'Venta a Cliente',
    TRASLADO_ENTRADA: 'Traslado Recibido',
    TRASLADO_SALIDA: 'Traslado Enviado',
    AJUSTE_POSITIVO: 'Ajuste Sobrante (+)',
    AJUSTE_NEGATIVO: 'Ajuste Faltante (-)',
    MERMA: 'Merma o Pérdida',
    INVENTARIO_INICIAL: 'Inventario Inicial',
    DEVOLUCION_CLIENTE: 'Devolución de Cliente',
    DEVOLUCION_PROVEEDOR: 'Devolución a Proveedor',
    ANULACION_ENTRADA: 'Anulación de Entrada',
    ANULACION_SALIDA: 'Anulación de Salida',
};

export interface KardexItemRow {
    id: string;
    secuencia: number;
    fecha: string; // ISO string
    fechaFormateada: string;
    horaFormateada: string;
    tipoMovimiento: 'ENTRADA' | 'SALIDA';
    motivo: string;
    motivoLegible: string;
    detalleMotivo: string | null;
    origenTipo: string | null;
    comprobanteRef: string | null;
    cantidad: number;
    stockAnterior: number;
    stockActual: number;
    costoUnitario: number;
    costoTotal: number;
    costoPromedio: number;
    saldoValorizado: number;
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    productoImagenUrl: string | null;
    productoUnidad: string;
    categoria: string;
    sucursalId: string;
    sucursalNombre: string;
    sucursalCodigo: string;
    usuarioId: string | null;
    usuarioNombre: string;
}

export interface KardexMetrics {
    totalMovimientos: number;
    totalEntradas: number;
    totalSalidas: number;
    balanceNetoUnidades: number;
    valorTotalEntradas: number;
    valorTotalSalidas: number;
}

