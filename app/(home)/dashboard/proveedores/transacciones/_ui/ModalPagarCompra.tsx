'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    X,
    Wallet,
    Lock,
    Unlock,
    Loader2,
    CheckCircle2,
    Building2,
    Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';

import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { pagarCompraProveedorAction } from '@/server/actions/proveedor/pagar-compra-action';
import { abrirCajaAction } from '@/server/actions/caja/abrir-caja-action';
import {
    CajaAbiertaTransaccionOption,
    CompraProveedorRow,
} from '@/types/proveedor-transacciones-schema';

interface ModalPagarCompraProps {
    compra: CompraProveedorRow | null;
    cajasAbiertas: CajaAbiertaTransaccionOption[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function ModalPagarCompra({
    compra,
    cajasAbiertas,
    onClose,
    onSuccess,
}: ModalPagarCompraProps) {
    const router = useRouter();
    const [montoAperturaInput, setMontoAperturaInput] = useState('0');
    const [localOpenedCajas, setLocalOpenedCajas] = useState<
        Record<string, CajaAbiertaTransaccionOption>
    >({});

    const cajaActiva = useMemo(() => {
        if (!compra) return null;
        return (
            cajasAbiertas.find((c) => c.sucursalId === compra.sucursalId) ||
            localOpenedCajas[compra.sucursalId] ||
            null
        );
    }, [compra, cajasAbiertas, localOpenedCajas]);

    const { execute: executePagar, status: pagarStatus } = useAction(
        pagarCompraProveedorAction,
        {
            onSuccess: ({ data }) => {
                if (data?.ok) {
                    toast.success(data.msg || 'Pago al proveedor registrado exitosamente.');
                    onSuccess();
                    onClose();
                } else {
                    toast.error(data?.msg || 'No se pudo registrar el pago.');
                }
            },
            onError: ({ error }) => {
                toast.error(error.serverError || 'Error inesperado al procesar el pago.');
            },
        }
    );

    const { execute: executeAbrirCaja, status: abrirCajaStatus } = useAction(
        abrirCajaAction,
        {
            onSuccess: ({ data, input }) => {
                if (data?.ok) {
                    toast.success(data.msg || 'Caja abierta exitosamente.');
                    setLocalOpenedCajas((prev) => ({
                        ...prev,
                        [input.sucursalId]: {
                            id: `opened-${input.sucursalId}`,
                            sucursalId: input.sucursalId,
                            usuarioNombre: 'Tú (Recién abierta)',
                            fechaAperturaFormateada: 'Ahora mismo',
                        },
                    }));
                    router.refresh();
                } else {
                    toast.error(data?.msg || 'No se pudo abrir la caja en esta sucursal.');
                }
            },
            onError: ({ error }) => {
                toast.error(error.serverError || 'Error al abrir la caja.');
            },
        }
    );

    const isPaying = pagarStatus === 'executing';
    const isOpeningCaja = abrirCajaStatus === 'executing';

    useEffect(() => {
        if (!compra) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPaying && !isOpeningCaja) onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [compra, isPaying, isOpeningCaja, onClose]);

    if (!compra) return null;

    const handleAbrirCaja = () => {
        const montoNum = Number(montoAperturaInput);
        if (Number.isNaN(montoNum) || montoNum < 0) {
            toast.error('Ingresa un monto inicial válido (mayor o igual a 0).');
            return;
        }
        executeAbrirCaja({
            sucursalId: compra.sucursalId,
            montoInicial: montoNum,
        });
    };

    const handleConfirmPay = () => {
        if (!cajaActiva) {
            toast.error(
                `Debes abrir la caja en ${compra.sucursalNombre} antes de registrar este egreso.`
            );
            return;
        }
        executePagar({ compraId: compra.id });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-pagar-compra-title"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPaying && !isOpeningCaja) onClose();
            }}
        >
            <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/70 bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Wallet className="size-4.5" />
                        </div>
                        <div className="min-w-0">
                            <h2
                                id="modal-pagar-compra-title"
                                className="text-base font-bold text-foreground tracking-tight truncate"
                            >
                                Registrar Pago a Proveedor
                            </h2>
                            <p className="text-xs text-muted-foreground truncate">
                                Liquida la deuda pendiente y genera el egreso en caja abierta.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPaying || isOpeningCaja}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Resumen de la compra */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="size-3.5" /> Proveedor
                            </span>
                            <span className="font-semibold text-foreground text-right">
                                {compra.proveedorNombre}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Comprobante</span>
                            <span className="font-mono font-bold text-foreground">
                                {compra.tipoComprobanteNombre}: {compra.numeroComprobante}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <Store className="size-3.5" /> Sucursal
                            </span>
                            <span className="font-medium text-foreground">{compra.sucursalNombre}</span>
                        </div>
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                            <span className="font-semibold text-foreground">Monto a Pagar (Egreso)</span>
                            <span className="text-lg font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                                S/ {compra.monto.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Verificación de Caja Abierta en la Sucursal */}
                    {cajaActiva ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3.5 py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Unlock className="size-3.5" />
                                </div>
                                <div className="min-w-0 text-xs">
                                    <p className="font-semibold text-foreground truncate">
                                        Caja abierta en {compra.sucursalNombre}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        Cajero: {cajaActiva.usuarioNombre} • Apertura: {cajaActiva.fechaAperturaFormateada}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold shrink-0">
                                Lista
                            </Badge>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-amber-500/45 bg-amber-500/8 p-3.5 space-y-3">
                            <div className="flex items-start gap-2.5">
                                <div className="size-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Lock className="size-3.5" />
                                </div>
                                <div className="min-w-0 text-xs space-y-0.5">
                                    <p className="font-semibold text-foreground">
                                        Caja cerrada en {compra.sucursalNombre}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Para pagar esta obligación y registrar la salida de dinero, abre una caja en{' '}
                                        <span className="font-semibold text-foreground">
                                            {compra.sucursalNombre}
                                        </span>
                                        :
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-end gap-2 pt-1">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[11px] font-medium text-muted-foreground block">
                                        Monto inicial de caja (S/)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={montoAperturaInput}
                                        onChange={(e) => setMontoAperturaInput(e.target.value)}
                                        disabled={isOpeningCaja || isPaying}
                                        className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAbrirCaja}
                                    disabled={isOpeningCaja || isPaying}
                                    className="h-8.5 px-3 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
                                >
                                    {isOpeningCaja ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>Abriendo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="size-3.5" />
                                            <span>Abrir Caja</span>
                                        </>
                                    )}
                                </Button>
                                <Link
                                    href={`/dashboard/caja?sucursalId=${compra.sucursalId}`}
                                    className={buttonVariants({
                                        variant: 'outline',
                                        size: 'sm',
                                        className: 'h-8.5 px-2.5 text-xs shrink-0',
                                    })}
                                >
                                    Ir a Caja
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/70 bg-muted/15">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={isPaying || isOpeningCaja}
                        className="h-9 px-4 text-xs cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleConfirmPay}
                        disabled={isPaying || isOpeningCaja || !cajaActiva}
                        className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                        {isPaying ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Procesando pago...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-3.5" />
                                <span>Confirmar Pago (S/ {compra.monto.toFixed(2)})</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
