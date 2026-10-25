'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, Loader2, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { deleteProveedorAction } from '@/server/actions/proveedor/delete-proveedor-action';
import { toggleProveedorAction } from '@/server/actions/proveedor/toggle-proveedor-action';
import { ProveedorWithProductCount } from '@/interfaces';

interface ModalDeleteProveedorProps {
    isOpen: boolean;
    onClose: () => void;
    proveedor: ProveedorWithProductCount | null;
    onSuccess?: () => void;
}

export default function ModalDeleteProveedor({
    isOpen,
    onClose,
    proveedor,
    onSuccess,
}: ModalDeleteProveedorProps) {
    const hasProducts = Boolean(proveedor && proveedor.totalProductos > 0);

    const { execute: executeDelete, status: deleteStatus } = useAction(deleteProveedorAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg);
                onSuccess?.();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Error al intentar eliminar el proveedor');
        },
    });

    const { execute: executeToggle, status: toggleStatus } = useAction(toggleProveedorAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success('Proveedor desactivado correctamente');
                onSuccess?.();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Error al desactivar el proveedor');
        },
    });

    const isPending = deleteStatus === 'executing' || toggleStatus === 'executing';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPending]);

    if (!isOpen || !proveedor) return null;

    const handleDelete = () => {
        executeDelete({ id: proveedor.id });
    };

    const handleDeactivate = () => {
        executeToggle({ id: proveedor.id, activo: false });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPending) onClose();
            }}
        >
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                                hasProducts
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-destructive/10 text-destructive'
                            }`}
                        >
                            {hasProducts ? (
                                <ShieldAlert className="size-5" />
                            ) : (
                                <AlertTriangle className="size-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">
                                {hasProducts ? 'Proveedor con Productos Activos' : 'Eliminar Proveedor'}
                            </h3>
                            <p className="text-xs text-muted-foreground capitalize">
                                {proveedor.nombre}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed">
                    {hasProducts ? (
                        <p>
                            Este proveedor no puede ser eliminado porque está vinculado a{' '}
                            <strong className="text-foreground font-semibold">
                                {proveedor.totalProductos} producto(s)
                            </strong>{' '}
                            del catálogo. Eliminarlo rompería el historial de compras y el kardex. Te sugerimos
                            cambiar su estado a inactivo para evitar nuevas asignaciones.
                        </p>
                    ) : (
                        <p>
                            ¿Estás seguro de que deseas eliminar permanentemente a{' '}
                            <strong className="text-foreground font-semibold capitalize">
                                {proveedor.nombre}
                            </strong>
                            ? Esta acción eliminará su registro de forma definitiva.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                    >
                        Cancelar
                    </button>

                    {hasProducts ? (
                        proveedor.activo ? (
                            <button
                                type="button"
                                onClick={handleDeactivate}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isPending ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <PowerOff className="size-3.5" />
                                )}
                                <span>Desactivar Proveedor</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg bg-secondary px-3.5 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                                Entendido
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3.5 py-2 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="size-3.5" />
                            )}
                            <span>Eliminar Definitivamente</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
