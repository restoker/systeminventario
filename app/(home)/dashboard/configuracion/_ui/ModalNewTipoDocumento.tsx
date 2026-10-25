'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, X, Check, CircleAlert, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { newTipoDocumentoAction } from '@/server/actions/tipo-documento/tipo-documento-actions';
import { tipoDocumentoSchema, TipoDocumentoInput } from '@/types/tipo-documento-schema';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (doc: { id: string; nombre: string; estado: boolean | null }) => void;
}

const inputBaseClass =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-black placeholder:text-black/40 focus:border-[#FC7819] focus:outline-hidden focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 transition-colors";

export default function ModalNewTipoDocumento({ isOpen, onClose, onSuccess }: Props) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TipoDocumentoInput>({
        resolver: zodResolver(tipoDocumentoSchema),
        defaultValues: {
            nombre: '',
            estado: true,
        },
    });

    const { execute, status } = useAction(newTipoDocumentoAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg);
                if (data.data && onSuccess) {
                    onSuccess(data.data);
                }
                reset();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Error al registrar el tipo de documento');
        },
    });

    const isPending = status === 'executing';

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPending]);

    if (!isOpen) return null;

    const onSubmit = (data: TipoDocumentoInput) => {
        execute(data);
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
            <div className="relative w-full max-w-md rounded-xl border border-black/15 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-neutral-900 animate-in zoom-in-95 duration-200 space-y-5">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FC7819] uppercase tracking-wider">
                            <Sparkles className="size-3.5" />
                            <span>Documentos de Identidad</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Nuevo Tipo de Documento
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Registra un documento de identidad para usar en ventas, clientes y comprobantes.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                        aria-label="Cerrar modal"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="docNombre" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Nombre del Documento <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="nombre"
                                render={({ field }) => (
                                    <div className="relative">
                                        <input
                                            {...field}
                                            id="docNombre"
                                            type="text"
                                            autoFocus
                                            placeholder="Ej. Cédula de Identidad, P.T.P."
                                            className={`${inputBaseClass} pl-8 ${errors.nombre ? 'border-red-500! focus:border-red-500!' : ''}`}
                                        />
                                        <FileText className="absolute left-2.5 top-2.5 size-3.5 text-black/40 dark:text-white/40" />
                                    </div>
                                )}
                            />
                            {errors.nombre && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.nombre.message}
                                </p>
                            )}
                        </div>

                        {/* Estado Activo */}
                        <div className="pt-1">
                            <Controller
                                control={control}
                                name="estado"
                                render={({ field: { value, onChange } }) => (
                                    <label htmlFor="docEstado" className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-black/80 dark:text-white/80">
                                        <input
                                            id="docEstado"
                                            type="checkbox"
                                            checked={!!value}
                                            onChange={(e) => onChange(e.target.checked)}
                                            className="size-4 rounded border-black/20 text-[#FC7819] focus:ring-[#FC7819] dark:border-white/20 dark:bg-white/5"
                                        />
                                        <span>Habilitar documento inmediatamente para transacciones</span>
                                    </label>
                                )}
                            />
                        </div>
                    </div>

                    {/* Botones del Modal */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10 dark:border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="rounded-lg border border-black/20 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FC7819] hover:bg-[#e0650e] px-4 py-2 text-xs font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            <span>{isPending ? 'Guardando...' : 'Crear Documento'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
