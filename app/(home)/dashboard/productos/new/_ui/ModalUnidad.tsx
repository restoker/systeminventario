'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Sparkles, X, Check, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Unidad } from '@/interfaces';
import { newUnidadSchema, NewUnidadSchema } from '@/types/new-unidad-schema';
import { newUnidadAction } from '@/server/actions/unidad/new-unidad-action';
import { useAction } from 'next-safe-action/hooks';

// const unidadSchema = z.object({
//     nombre: z
//         .string()
//         .min(2, 'El nombre debe tener al menos 2 caracteres')
//         .max(100, 'El nombre no puede exceder 100 caracteres'),
//     abreviatura: z
//         .string()
//         .min(1, 'La abreviatura es obligatoria')
//         .max(5, 'La abreviatura debe tener como máximo 5 caracteres'),
// });

// type UnidadFormValues = z.infer<typeof unidadSchema>;

interface ModalUnidadProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (unidad: Unidad) => void;
}

const inputBaseClass =
    'block w-full rounded-lg border border-black/20 bg-white py-2.5 px-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

export default function ModalUnidad({ isOpen, onClose, onSuccess }: ModalUnidadProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewUnidadSchema>({
        resolver: zodResolver(newUnidadSchema),
        defaultValues: {
            nombre: '',
            abreviatura: '',
        },
    });

    const { execute, status } = useAction(newUnidadAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg);
                onClose();
                reset();
            } else {
                toast.error(data.msg);
            }
        },
        onError: (error) => {
            toast.error('Error al crear la unidad');
        },
    })

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

    const onSubmit = (data: NewUnidadSchema) => {
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
                            Nueva Unidad de Medida
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
                            <label htmlFor="undNombre" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Nombre de la Unidad <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="nombre"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="undNombre"
                                        type="text"
                                        autoFocus
                                        placeholder="Ej. Kilogramo, Paquete, Docena"
                                        className={`${inputBaseClass} ${errors.nombre ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                    />
                                )}
                            />
                            {errors.nombre && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.nombre.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="undAbrev" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Abreviatura / Código SUNAT <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="abreviatura"
                                render={({ field: { value, onChange, ...rest } }) => (
                                    <input
                                        {...rest}
                                        value={value}
                                        onChange={(e) => onChange(e.target.value.toUpperCase())}
                                        id="undAbrev"
                                        type="text"
                                        maxLength={5}
                                        placeholder="Ej. KGM, PK, DZN"
                                        className={`${inputBaseClass} ${errors.abreviatura ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                    />
                                )}
                            />
                            {errors.abreviatura && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.abreviatura.message}
                                </p>
                            )}
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Código de unidad según catálogo 03 de SUNAT.
                            </p>
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
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FC7819] hover:bg-[#e0650e] px-4 py-2 text-xs font-semibold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            <span>Guardar y Seleccionar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
