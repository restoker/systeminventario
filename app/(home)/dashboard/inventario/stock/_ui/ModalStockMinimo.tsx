'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { updateStockMinimoAction } from '@/server/actions/inventario/stock-minimo-action';
import { StockProductOption } from './ModalAjusteStock';

interface ModalStockMinimoProps {
    isOpen: boolean;
    onClose: () => void;
    sucursalId: string;
    product: StockProductOption | null;
    onSuccess: () => void;
}

export default function ModalStockMinimo({
    isOpen,
    onClose,
    sucursalId,
    product,
    onSuccess,
}: ModalStockMinimoProps) {
    const [stockMinimo, setStockMinimo] = useState<string>('5');

    useEffect(() => {
        if (isOpen && product) {
            setStockMinimo(String(product.stockMinimo ?? 5));
        }
    }, [isOpen, product]);

    const { execute, status } = useAction(updateStockMinimoAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Stock mínimo actualizado');
                onSuccess();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error al actualizar el stock mínimo');
        },
    });

    const isPending = status === 'executing';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        const val = Number(stockMinimo);
        if (Number.isNaN(val) || val < 0) {
            toast.error('Ingresa un stock mínimo válido (0 o superior)');
            return;
        }

        execute({
            sucursalId,
            productoId: product.productoId,
            stockMinimo: val,
        });
    };

    if (!isOpen || !product) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPending) onClose();
            }}
        >
            <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <ShieldAlert className="size-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Umbral de Stock Mínimo
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                                Alerta de reposición por producto
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 text-xs">
                        <span className="font-semibold text-foreground block truncate">{product.nombre}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">[{product.codigo}]</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                            Cantidad mínima de alerta
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                step={1}
                                autoFocus
                                value={stockMinimo}
                                onChange={(e) => setStockMinimo(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                            <span className="text-xs text-muted-foreground font-medium shrink-0">
                                {product.unidad}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            El sistema marcará alerta cuando las existencias sean menores o iguales a este valor.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="size-3 animate-spin" />
                            ) : (
                                <Check className="size-3" />
                            )}
                            <span>Guardar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

