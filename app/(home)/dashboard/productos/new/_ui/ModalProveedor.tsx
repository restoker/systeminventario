'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Sparkles, X, Check, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Proveedor } from '@/interfaces';
import { newProveedorSchema, NewProveedorType } from '@/types/new-proveedor-schema';
import { useAction } from 'next-safe-action/hooks';
import { newProveedorAction } from '@/server/actions/proveedor/new-proveedor-action';

interface ModalProveedorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (proveedor: Proveedor) => void;
}

const inputBaseClass =
    'block w-full rounded-lg border border-black/20 bg-white py-2.5 px-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

export default function ModalProveedor({ isOpen, onClose, onSuccess }: ModalProveedorProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewProveedorType>({
        resolver: zodResolver(newProveedorSchema),
        defaultValues: {
            nombre: '',
            numeroDocumento: '',
            telefono: '',
            email: '',
            razonSocial: '',
            direccion: '',
        },
    });

    const { execute, status } = useAction(newProveedorAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg);
                reset();
                onClose();
            } else {
                toast.error(data.msg);
            }
        },
        onError: ({ error }) => {
            toast.error("Error al crear el proveedor");
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

    const onSubmit = (data: NewProveedorType) => {
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
                            Nuevo Proveedor
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
                            <label htmlFor="provNombre" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="nombre"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="provNombre"
                                        type="text"
                                        autoFocus
                                        placeholder="Ej. Distribuidora Los Andes S.A.C."
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

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="provDoc" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    RUC / N° Documento
                                </label>
                                <Controller
                                    control={control}
                                    name="numeroDocumento"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="provDoc"
                                            type="text"
                                            placeholder="20123456789"
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <label htmlFor="provTel" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    Teléfono
                                </label>
                                <Controller
                                    control={control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="provTel"
                                            type="tel"
                                            placeholder="987654321"
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="provEmail" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    Correo Electrónico
                                </label>
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="provEmail"
                                            type="email"
                                            placeholder="contacto@proveedor.com"
                                            className={`${inputBaseClass} ${errors.email ? 'border-red-500! focus:border-red-500!' : ''}`}
                                        />
                                    )}
                                />
                                {errors.email && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="provRazon" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    Razón Social
                                </label>
                                <Controller
                                    control={control}
                                    name="razonSocial"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="provRazon"
                                            type="text"
                                            placeholder="Ej. Distribuidora Los Andes S.A.C."
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="provDir" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Dirección
                            </label>
                            <Controller
                                control={control}
                                name="direccion"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="provDir"
                                        type="text"
                                        placeholder="Ej. Av. Nicolás de Piérola 123, Lima"
                                        className={inputBaseClass}
                                    />
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
