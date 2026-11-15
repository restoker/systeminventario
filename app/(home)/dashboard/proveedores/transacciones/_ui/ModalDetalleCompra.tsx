'use client';

import React, { useEffect } from 'react';
import {
    X,
    ReceiptText,
    Building2,
    Store,
    Calendar,
    Clock,
    User,
    Boxes,
    Wallet,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompraProveedorRow } from '@/types/proveedor-transacciones-schema';

interface ModalDetalleCompraProps {
    compra: CompraProveedorRow | null;
    onClose: () => void;
    onRequestPay: (compra: CompraProveedorRow) => void;
}

export default function ModalDetalleCompra({
    compra,
    onClose,
    onRequestPay,
}: ModalDetalleCompraProps) {
    useEffect(() => {
        if (!compra) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [compra, onClose]);

    if (!compra) return null;

    const isPendiente = compra.estado === 'pendiente';
    const isVencida = isPendiente && compra.diasRestantes !== null && compra.diasRestantes < 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-detalle-compra-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-2xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/70 bg-muted/20">
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                {compra.tipoComprobanteNombre}
                            </span>
                            <Badge
                                variant={isPendiente ? 'outline' : 'secondary'}
                                className={
                                    isVencida
                                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px]'
                                        : isPendiente
                                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px]'
                                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]'
                                }
                            >
                                {isVencida ? 'Pago Vencido' : isPendiente ? 'Pago Pendiente' : 'Pagado'}
                            </Badge>
                        </div>
                        <h2
                            id="modal-detalle-compra-title"
                            className="text-lg font-bold font-mono text-foreground tracking-tight truncate"
                        >
                            {compra.numeroComprobante}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        aria-label="Cerrar detalle"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-5 space-y-5">
                    {/* Metadatos Operativos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-border/70 bg-muted/15 p-3.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <Building2 className="size-3.5 text-primary" />
                                <span>Proveedor</span>
                            </div>
                            <p className="font-semibold text-sm text-foreground">
                                {compra.proveedorNombre}
                            </p>
                            {compra.proveedorRazonSocial &&
                                compra.proveedorRazonSocial !== compra.proveedorNombre && (
                                    <p className="text-[11px] text-muted-foreground">
                                        {compra.proveedorRazonSocial}
                                    </p>
                                )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-0.5 font-mono">
                                <span>Doc: {compra.proveedorDocumento || 'No registrado'}</span>
                                {compra.proveedorTelefono && <span>Tel: {compra.proveedorTelefono}</span>}
                            </div>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-muted/15 p-3.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <ReceiptText className="size-3.5 text-primary" />
                                <span>Registro y Condición</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Store className="size-3" /> Sede:
                                </span>
                                <span className="font-semibold text-foreground">{compra.sucursalNombre}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="size-3" /> Emisión:
                                </span>
                                <span className="font-medium text-foreground">
                                    {compra.fechaEmisionFormateada} • {compra.horaEmisionFormateada}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <User className="size-3" /> Registrado por:
                                </span>
                                <span className="font-medium text-foreground">{compra.usuarioNombre}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="size-3" /> Condición:
                                </span>
                                <span className="font-semibold text-foreground">
                                    {compra.isACredito
                                        ? `Crédito (${compra.numeroDiasCredito || 0} días)`
                                        : 'Al Contado'}
                                </span>
                            </div>
                            {compra.isACredito && compra.fechaVencimientoFormateada && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Vencimiento:</span>
                                    <span
                                        className={`font-mono font-semibold ${
                                            isVencida
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : 'text-foreground'
                                        }`}
                                    >
                                        {compra.fechaVencimientoFormateada}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Aviso si tiene saldo pendiente */}
                    {isPendiente && (
                        <div
                            className={`rounded-xl border px-3.5 py-2.5 text-xs flex items-center gap-2.5 ${
                                isVencida
                                    ? 'border-rose-500/40 bg-rose-500/8 text-rose-700 dark:text-rose-300'
                                    : 'border-amber-500/40 bg-amber-500/8 text-amber-700 dark:text-amber-300'
                            }`}
                        >
                            <AlertTriangle className="size-4 shrink-0" />
                            <span>
                                {isVencida
                                    ? `Esta factura a crédito venció hace ${Math.abs(compra.diasRestantes!)} día(s). Pendiente de pago en caja.`
                                    : compra.diasRestantes === 0
                                    ? 'Esta compra a crédito vence el día de hoy.'
                                    : compra.diasRestantes !== null
                                    ? `Compra a crédito pendiente de liquidación (vencimiento en ${compra.diasRestantes} día(s)).`
                                    : 'Compra registrada a crédito pendiente de liquidación.'}
                            </span>
                        </div>
                    )}

                    {/* Productos Incluidos */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Boxes className="size-3.5 text-primary" />
                                <span>Productos de la Compra ({compra.itemsCount})</span>
                            </h3>
                            <span className="text-[11px] font-mono text-muted-foreground">
                                {compra.totalUnidades} unid. totales
                            </span>
                        </div>

                        <div className="rounded-xl border border-border/80 overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/40 border-b border-border/70 text-[11px] uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="py-2.5 px-3 text-left font-semibold">Producto</th>
                                        <th className="py-2.5 px-3 text-right font-semibold">Cant.</th>
                                        <th className="py-2.5 px-3 text-right font-semibold">Costo Unit.</th>
                                        <th className="py-2.5 px-3 text-right font-semibold">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {compra.items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-6 px-3 text-center text-muted-foreground"
                                            >
                                                No se registraron líneas de detalle para esta compra.
                                            </td>
                                        </tr>
                                    ) : (
                                        compra.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/20">
                                                <td className="py-2.5 px-3">
                                                    <div className="font-medium text-foreground">
                                                        {item.productoNombre}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-muted-foreground">
                                                        {item.productoCodigo}
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                                                    {item.cantidad} {item.unidad}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                                                    S/ {item.precioUnitario.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-foreground whitespace-nowrap">
                                                    S/ {item.subtotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="bg-muted/25 border-t border-border/70">
                                    <tr>
                                        <td colSpan={3} className="py-2.5 px-3 text-right font-semibold text-foreground">
                                            Total Comprobante:
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-sm tabular-nums text-foreground whitespace-nowrap">
                                            S/ {compra.monto.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-border/70 bg-muted/15">
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        {!isPendiente && (
                            <>
                                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Obligación liquidada con el proveedor</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="h-8.5 px-3.5 text-xs cursor-pointer"
                        >
                            Cerrar
                        </Button>
                        {isPendiente && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    onRequestPay(compra);
                                }}
                                className="h-8.5 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer"
                            >
                                <Wallet className="size-3.5" />
                                <span>Registrar Pago (S/ {compra.monto.toFixed(2)})</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
