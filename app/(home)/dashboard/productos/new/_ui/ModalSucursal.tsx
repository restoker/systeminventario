'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, X, Check, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Sucursal } from '@/interfaces';
import { newSucursalSchema, NewSurcursalSchema } from '@/types/new-surcursal-schema';
import { useAction } from 'next-safe-action/hooks';
import { newSucursalAction } from '@/server/actions/sucursal/new-sucursal-action';

interface ModalSucursalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (sucursal: Sucursal) => void;
}

const inputBaseClass =
    'block w-full rounded-lg border border-black/20 bg-white py-2.5 px-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

export default function ModalSucursal({ isOpen, onClose, onSuccess }: ModalSucursalProps) {
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewSurcursalSchema>({
        resolver: zodResolver(newSucursalSchema),
        defaultValues: {
            nombre: '',
            codigo: '',
            direccion: '',
            telefono: '',
            email: '',
            ruc: '',
            razonSocial: '',
            isActive: true,
        },
    });

    const { execute, status } = useAction(newSucursalAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg);
                // if (data.sucursal) {
                //     onSuccess(data.sucursal);
                // }
                reset();
                onClose();
            } else {
                toast.error(data?.msg || 'Error al agregar la sucursal');
            }
        },
        onError: () => {
            toast.error('Ocurrió un error al agregar la sucursal');
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

    const onSubmit = (data: NewSurcursalSchema) => {
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
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-black/15 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-neutral-900 animate-in zoom-in-95 duration-200 space-y-5">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FC7819] uppercase tracking-wider">
                            <Sparkles className="size-3.5" />
                            <span>Agregar nueva opción</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Nueva Sucursal o Almacén
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
                        {/* Nombre de la Sucursal */}
                        <div>
                            <label htmlFor="sucNombre" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Nombre de la Sucursal <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="nombre"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="sucNombre"
                                        type="text"
                                        autoFocus
                                        placeholder="Ej. Almacén Central (Lima)"
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

                        {/* Código y Teléfono */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="sucCodigo" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    Código <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    control={control}
                                    name="codigo"
                                    render={({ field }) => (
                                        <div className="flex rounded-lg">
                                            <span
                                                className={`inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-black/5 text-xs sm:text-sm font-mono font-medium text-black/60 dark:bg-white/10 dark:text-white/60 select-none transition-colors duration-200 ${errors.codigo
                                                    ? 'border-red-500! text-red-600! dark:text-red-400!'
                                                    : 'border-black/20 dark:border-white/15'
                                                    }`}
                                            >
                                                SUC-
                                            </span>
                                            <input
                                                {...field}
                                                id="sucCodigo"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="01"
                                                onChange={(e) => {
                                                    field.onChange(e.target.value.replace(/\D/g, ''));
                                                }}
                                                onKeyDown={(e) => {
                                                    if (
                                                        ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
                                                        (e.ctrlKey || e.metaKey)
                                                    ) {
                                                        return;
                                                    }
                                                    if (!/^\d$/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className={`${inputBaseClass} rounded-l-none! focus:z-10 ${errors.codigo ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                            />
                                        </div>
                                    )}
                                />
                                {errors.codigo && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                        <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                        {errors.codigo.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="sucTelefono" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    Teléfono
                                </label>
                                <Controller
                                    control={control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="sucTelefono"
                                            type="tel"
                                            placeholder="987654321"
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* RUC y Razón Social */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="sucRuc" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    RUC
                                </label>
                                <Controller
                                    control={control}
                                    name="ruc"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="sucRuc"
                                            type="text"
                                            placeholder="20123456789"
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <label htmlFor="sucRazonSocial" className="block text-xs font-medium text-black dark:text-white mb-1">
                                    Razón Social
                                </label>
                                <Controller
                                    control={control}
                                    name="razonSocial"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="sucRazonSocial"
                                            type="text"
                                            placeholder="Mi Empresa S.A.C."
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Correo Electrónico */}
                        <div>
                            <label htmlFor="sucEmail" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Correo Electrónico
                            </label>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="sucEmail"
                                        type="email"
                                        placeholder="almacen@empresa.com"
                                        className={`${inputBaseClass} ${errors.email ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
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

                        {/* Dirección */}
                        <div>
                            <label htmlFor="sucDireccion" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Dirección <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="direccion"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="sucDireccion"
                                        type="text"
                                        placeholder="Ej. Av. Industrial 1234, Lima"
                                        className={`${inputBaseClass} ${errors.direccion ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                    />
                                )}
                            />
                            {errors.direccion && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.direccion.message}
                                </p>
                            )}
                        </div>

                        {/* Estado Activo */}
                        <div className="pt-1">
                            <Controller
                                control={control}
                                name="isActive"
                                render={({ field: { value, onChange } }) => (
                                    <label htmlFor="sucIsActive" className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-black/80 dark:text-white/80">
                                        <input
                                            id="sucIsActive"
                                            type="checkbox"
                                            checked={!!value}
                                            onChange={(e) => onChange(e.target.checked)}
                                            className="size-4 rounded border-black/20 text-[#FC7819] focus:ring-[#FC7819] dark:border-white/20 dark:bg-white/5"
                                        />
                                        <span>Sucursal activa para operaciones y almacenamiento</span>
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
