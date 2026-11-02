'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, X, Check, CircleAlert, Search, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Proveedor, TipoDocumentoDto } from '@/interfaces';
import { newProveedorSchema, NewProveedorType } from '@/types/new-proveedor-schema';
import { useAction } from 'next-safe-action/hooks';
import { newProveedorAction } from '@/server/actions/proveedor/new-proveedor-action';
import { getRucBusiness, getInfoDocumento } from '@/server/actions/get-info-dni-ruc';

interface ModalProveedorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (proveedor: Proveedor) => void;
    tipoDocumentos?: TipoDocumentoDto[];
}

const inputBaseClass =
    'block w-full rounded-lg border border-black/20 bg-white py-2.5 px-3 text-sm text-black placeholder:text-black/35 focus:border-[#FC7819] focus:outline-none focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#FC7819] dark:focus:ring-[#FC7819] transition-colors duration-200';

export default function ModalProveedor({ isOpen, onClose, onSuccess, tipoDocumentos = [] }: ModalProveedorProps) {
    const [isSearchingDoc, setIsSearchingDoc] = useState(false);
    const [sunatStatus, setSunatStatus] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<NewProveedorType>({
        resolver: zodResolver(newProveedorSchema),
        defaultValues: {
            tipoDocumentoId: '',
            nombre: '',
            numeroDocumento: '',
            telefono: '',
            email: '',
            razonSocial: '',
            direccion: '',
        },
    });

    const currentDoc = watch('numeroDocumento');
    const selectedTipoDocId = watch('tipoDocumentoId');

    const selectedTipoDoc = tipoDocumentos.find((d) => d.id === selectedTipoDocId);
    const isRuc = selectedTipoDoc?.nombre?.toUpperCase() === 'RUC';
    const isDni = selectedTipoDoc?.nombre?.toUpperCase() === 'DNI';
    const canSearch = isRuc || isDni;
    const isDocBlocked = !selectedTipoDocId;

    // Resetear status al cambiar tipo de documento
    useEffect(() => {
        setSunatStatus(null);
    }, [selectedTipoDocId]);

    const { execute, status } = useAction(newProveedorAction, {
        onSuccess: ({ data }) => {
            if (data.ok) {
                toast.success(data.msg);
                if (data.data && onSuccess) {
                    onSuccess(data.data as Proveedor);
                }
                reset();
                setSunatStatus(null);
                onClose();
            } else {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Error al crear el proveedor');
        },
    });

    const isPending = status === 'executing';

    // Búsqueda en SUNAT / RENIEC según el tipo de documento
    const handleSearchDoc = async () => {
        const doc = currentDoc?.trim();
        if (!doc) {
            toast.error('Ingresa un número de documento para consultar');
            return;
        }

        if (isRuc && doc.length !== 11) {
            toast.error('El RUC debe tener 11 dígitos');
            return;
        }

        if (isDni && doc.length !== 8) {
            toast.error('El DNI debe tener 8 dígitos');
            return;
        }

        setIsSearchingDoc(true);
        setSunatStatus(null);

        try {
            if (isRuc) {
                const res = await getRucBusiness(doc);
                if (res && res.ok && res.data) {
                    const { name, address, status: rucStatus } = res.data;
                    setValue('razonSocial', name || '');
                    // if (!watch('nombre') || watch('nombre').trim() === '') {
                    //     setValue('nombre', name || '');
                    // }
                    setValue('direccion', address?.trim() || '');
                    setSunatStatus(rucStatus || 'OK');
                    toast.success('Datos obtenidos exitosamente de SUNAT');
                } else {
                    toast.error(res?.msg || 'No se encontró información para el RUC ingresado');
                    setSunatStatus(null);
                }
            } else if (isDni && selectedTipoDocId) {
                const res = await getInfoDocumento(selectedTipoDocId, doc);
                if (res && res.ok && res.data && 'nombres' in res.data) {
                    const fullName = `${res.data.nombres} ${res.data.apellidos}`.trim();
                    setValue('nombre', fullName);
                    setValue('razonSocial', fullName);
                    toast.success('Datos obtenidos exitosamente de RENIEC');
                } else {
                    toast.error(res?.msg || 'No se encontró información para el DNI ingresado');
                }
            }
        } catch (error) {
            // console.error(error);
            toast.error('Error al conectar con el servicio de consulta');
        } finally {
            setIsSearchingDoc(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending) {
                reset();
                setSunatStatus(null);
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPending, reset]);

    if (!isOpen) return null;

    const onSubmit = (data: NewProveedorType) => {
        execute(data);
    };

    const handleClose = () => {
        if (isPending) return;
        reset();
        setSunatStatus(null);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPending) handleClose();
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
                        {/* Tipo de Documento */}
                        <div>
                            <label htmlFor="provTipoDoc" className="block text-xs font-medium text-black dark:text-white mb-1">
                                Tipo de Documento <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Controller
                                    control={control}
                                    name="tipoDocumentoId"
                                    render={({ field }) => (
                                        <select
                                            {...field}
                                            id="provTipoDoc"
                                            autoFocus
                                            disabled={isPending}
                                            className={`${inputBaseClass} pr-8 appearance-none cursor-pointer ${errors.tipoDocumentoId ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''
                                                }`}
                                        >
                                            <option value="">Seleccione un tipo de documento...</option>
                                            {tipoDocumentos.map((doc) => (
                                                <option key={doc.id} value={doc.id}>
                                                    {doc.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                />
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-black/40 dark:text-white/40" />
                            </div>
                            {errors.tipoDocumentoId && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.tipoDocumentoId.message}
                                </p>
                            )}
                        </div>

                        {/* Número de Documento */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="provDoc" className="block text-xs font-medium text-black dark:text-white">
                                    <span>
                                        {selectedTipoDoc
                                            ? `N° de ${selectedTipoDoc.nombre}`
                                            : 'N° de Documento'}
                                    </span>
                                    {isDocBlocked && (
                                        <span className="text-[10px] text-black/40 dark:text-white/40 font-normal ml-1">
                                            (bloqueado)
                                        </span>
                                    )}
                                </label>
                                {sunatStatus && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 className="size-3" />
                                        SUNAT: {sunatStatus}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Controller
                                        control={control}
                                        name="numeroDocumento"
                                        render={({ field }) => (
                                            <input
                                                {...field}
                                                id="provDoc"
                                                type="text"
                                                disabled={isDocBlocked || isPending}
                                                maxLength={isRuc ? 11 : isDni ? 8 : 20}
                                                placeholder={
                                                    isDocBlocked
                                                        ? 'Seleccione un tipo de documento primero'
                                                        : isRuc
                                                            ? 'Ej. 20601234567 (11 dígitos)'
                                                            : isDni
                                                                ? 'Ej. 12345678 (8 dígitos)'
                                                                : 'Ej. 123456789'
                                                }
                                                className={`${inputBaseClass} font-mono ${isDocBlocked ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''
                                                    } ${errors.numeroDocumento ? 'border-red-500! focus:border-red-500! focus:ring-red-500!' : ''}`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (canSearch && !isDocBlocked) {
                                                            handleSearchDoc();
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                                {canSearch && (
                                    <button
                                        type="button"
                                        onClick={handleSearchDoc}
                                        disabled={isDocBlocked || isSearchingDoc || !currentDoc}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-black/5 dark:border-white/15 dark:bg-white/10 px-3 py-2 text-xs font-medium text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                        title={isRuc ? 'Consultar padrón SUNAT' : 'Consultar datos DNI'}
                                    >
                                        {isSearchingDoc ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Search className="size-3.5" />
                                        )}
                                        <span>{isRuc ? 'Buscar RUC' : isDni ? 'Buscar DNI' : 'Buscar'}</span>
                                    </button>
                                )}
                            </div>
                            {isDocBlocked && (
                                <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">
                                    Debe seleccionar un tipo de documento para ingresar el número.
                                </p>
                            )}
                            {errors.numeroDocumento && (
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                                    <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                                    {errors.numeroDocumento.message}
                                </p>
                            )}
                        </div>

                        {/* Nombre Comercial */}
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

                        {/* Razón Social */}
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

                        {/* Teléfono y Correo */}
                        <div className="grid grid-cols-2 gap-3">
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
                        </div>

                        {/* Dirección */}
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
                            {isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Check className="size-3.5" />
                            )}
                            <span>{isPending ? 'Guardando...' : 'Guardar y Seleccionar'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
