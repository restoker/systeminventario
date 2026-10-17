'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, X, Check, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Categoria } from '@/interfaces';
import { newCategoriaSchema, NewCategoriaSchema } from '@/types/new-categoria-schema';
import { useAction } from 'next-safe-action/hooks';
import { newCategoriaAction } from '@/server/actions/categorias/new-categoria-action';

interface ModalCategoriaProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (categoria: Categoria) => void;
}

const inputBaseClass =
    'block w-full rounded-lg border border-black/20 bg-white py-2.5 px-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

export default function ModalCategoria({ isOpen, onClose, onSuccess }: ModalCategoriaProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewCategoriaSchema>({
        resolver: zodResolver(newCategoriaSchema),
        defaultValues: {
            nombre: '',
        },
    });

    const { execute, status } = useAction(newCategoriaAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg)
                reset();
                onClose();
            } else {
                toast.error(data.msg)
            }
        },
        onError: (error) => {
            toast.error('Error al crear la categoría')
            // console.log({ error })
        }
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




    const onSubmit = (data: NewCategoriaSchema) => {
        // const newCat: Categoria = {
        //     id: `cat-${Date.now()}`,
        //     nombre: data.nombre.trim(),
        //     createdAt: new Date(),
        //     updatedAt: new Date(),
        // };
        // toast.success(`Categoría "${newCat.nombre}" agregada`);
        // onSuccess(newCat);
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
                            Nueva Categoría
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
                            <label htmlFor="catNombre" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Nombre de la Categoría <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="nombre"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="catNombre"
                                        type="text"
                                        autoFocus
                                        placeholder="Ej. Bebidas y Licores"
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
