'use client';

import React, { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, X, Check, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Igv } from '@/interfaces';
import { newIgvSchema, NewIgvSchema } from '@/types/igv-schema';
import { useAction } from 'next-safe-action/hooks';
import { newIgvAction } from '@/server/actions/igv/new-igv-action';

interface ModalIgvProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (igv: Igv) => void;
}

const inputBaseClass =
    'block w-full rounded-lg border border-black/20 bg-white py-2.5 px-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

export default function ModalIgv({ isOpen, onClose, onSuccess }: ModalIgvProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewIgvSchema>({
        resolver: zodResolver(newIgvSchema),
        defaultValues: {
            value: 0.18,
            isActive: true,
        },
    });

    const watchValue = useWatch({ control, name: 'value' });

    const { execute, status } = useAction(newIgvAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg);
                if (data.igv) {
                    onSuccess(data.igv);
                }
                reset();
                onClose();
            } else {
                toast.error(data?.msg || 'Error al agregar el impuesto');
            }
        },
        onError: () => {
            toast.error('Ocurrió un error al agregar el impuesto');
        },
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const onSubmit = (data: NewIgvSchema) => {
        execute(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div className="relative w-full max-w-md rounded-xl border border-black/15 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-neutral-900 animate-in zoom-in-95 duration-200 space-y-5">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FC7819] uppercase tracking-wider">
                            <Sparkles className="size-3.5" />
                            <span>Agregar nueva opción</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Nuevo Impuesto (IGV)
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Esta opción se añadirá a la lista y quedará seleccionada automáticamente.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="igvValue" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Tasa de IGV (Decimal) <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="value"
                                render={({ field: { value, onChange, ...rest } }) => (
                                    <input
                                        {...rest}
                                        id="igvValue"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="1"
                                        autoFocus
                                        value={value === undefined || isNaN(value) ? '' : value}
                                        onChange={(e) =>
                                            onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                        }
                                        placeholder="0.18"
                                        className={`${inputBaseClass} ${errors.value ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                    />
                                )}
                            />
                            {errors.value && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.value.message}
                                </p>
                            )}
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                <span>Ejemplo: 0.18 para 18%, 0.10 para 10%, 0 para exonerado.</span>
                                {typeof watchValue === 'number' && !isNaN(watchValue) && watchValue <= 1 && (
                                    <span className="font-semibold text-[#FC7819]">
                                        = {(watchValue * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Estado Activo */}
                        <div className="pt-1">
                            <Controller
                                control={control}
                                name="isActive"
                                render={({ field: { value, onChange } }) => (
                                    <label htmlFor="igvIsActive" className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-black/80 dark:text-white/80">
                                        <input
                                            id="igvIsActive"
                                            type="checkbox"
                                            checked={!!value}
                                            onChange={(e) => onChange(e.target.checked)}
                                            className="size-4 rounded border-black/20 text-[#FC7819] focus:ring-[#FC7819] dark:border-white/20 dark:bg-white/5"
                                        />
                                        <span>Tasa de impuesto activa para facturación</span>
                                    </label>
                                )}
                            />
                        </div>
                    </div>

                    {/* Botones del Modal */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10 dark:border-white/10">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg border border-black/20 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'executing' || isSubmitting}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FC7819] hover:bg-[#e0650e] px-4 py-2 text-xs font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            <span>{status === 'executing' ? 'Guardando...' : 'Guardar y Seleccionar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
