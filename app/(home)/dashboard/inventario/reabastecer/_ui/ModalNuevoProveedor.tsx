'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    X,
    Check,
    CircleAlert,
    Building2,
    Search,
    Loader2,
    MapPin,
    Phone,
    Mail,
    FileText,
    CheckCircle2,
    ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { newProveedorAction } from '@/server/actions/proveedor/new-proveedor-action';
import { getRucBusiness, getInfoDocumento } from '@/server/actions/get-info-dni-ruc';
import { newProveedorSchema, NewProveedorType } from '@/types/new-proveedor-schema';
import { TipoDocumentoDto } from '@/interfaces';
import { ProveedorItem } from './FormReabastecer';

interface ModalNuevoProveedorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (proveedor: ProveedorItem) => void;
    tipoDocumentos: TipoDocumentoDto[];
}

const inputBaseClass =
    'block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-muted/10 transition-colors duration-150';

export default function ModalNuevoProveedor({
    isOpen,
    onClose,
    onSuccess,
    tipoDocumentos = [],
}: ModalNuevoProveedorProps) {
    const [isSearchingDoc, setIsSearchingDoc] = useState(false);
    const [sunatStatus, setSunatStatus] = useState<string | null>(null);

    // Preferir RUC por defecto para agilizar la búsqueda SUNAT
    const defaultTipoDocId =
        tipoDocumentos.find((d) => d.nombre?.toUpperCase() === 'RUC')?.id ||
        tipoDocumentos[0]?.id ||
        '';

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
            tipoDocumentoId: defaultTipoDocId,
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

    // Resetear status al cambiar de tipo de documento
    useEffect(() => {
        setSunatStatus(null);
    }, [selectedTipoDocId]);

    // Resetear formulario al abrir el modal
    useEffect(() => {
        if (isOpen) {
            setSunatStatus(null);
            reset({
                tipoDocumentoId: defaultTipoDocId,
                nombre: '',
                numeroDocumento: '',
                telefono: '',
                email: '',
                razonSocial: '',
                direccion: '',
            });
        }
    }, [isOpen, defaultTipoDocId, reset]);

    const { execute, status } = useAction(newProveedorAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Proveedor registrado exitosamente');
                if (data.data) {
                    onSuccess(data.data as ProveedorItem);
                }
                reset();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error al registrar el proveedor');
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
                    const { name, address, status } = res.data;
                    setValue('razonSocial', name || '');
                    if (!watch('nombre') || watch('nombre').trim() === '') {
                        setValue('nombre', name || '');
                    }
                    setValue('direccion', address?.trim() || '');
                    setSunatStatus(status || 'OK');
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
            console.error(error);
            toast.error('Error al conectar con el servicio de consulta');
        } finally {
            setIsSearchingDoc(false);
        }
    };

    // Manejo de tecla Escape
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

    const onSubmit = (data: NewProveedorType) => {
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
            <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Building2 className="size-4" />
                            </span>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Registrar Nuevo Proveedor
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ingresa los datos comerciales y fiscales para vincularlo a las compras y reabastecimientos.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        aria-label="Cerrar modal"
                    >
                        <X className="size-4.5" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-3.5">
                        {/* Tipo de Documento */}
                        <div>
                            <label
                                htmlFor="provTipoDoc"
                                className="block text-xs font-medium text-foreground mb-1"
                            >
                                Tipo de Documento <span className="text-destructive">*</span>
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
                                            className={`${inputBaseClass} pr-8 appearance-none cursor-pointer ${
                                                errors.tipoDocumentoId
                                                    ? 'border-destructive focus:border-destructive focus:ring-destructive'
                                                    : ''
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
                                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            </div>
                            {errors.tipoDocumentoId && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                    <CircleAlert className="size-3 shrink-0" />
                                    {errors.tipoDocumentoId.message}
                                </p>
                            )}
                        </div>

                        {/* Número de Documento */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label
                                    htmlFor="provDoc"
                                    className="text-xs font-medium text-foreground flex items-center gap-1.5"
                                >
                                    <FileText className="size-3.5 text-muted-foreground" />
                                    <span>
                                        {selectedTipoDoc
                                            ? `N° de ${selectedTipoDoc.nombre}`
                                            : 'N° de Identificación'}
                                    </span>
                                    {isDocBlocked && (
                                        <span className="text-[10px] text-muted-foreground/80 font-normal">
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
                                                className={`${inputBaseClass} font-mono ${
                                                    isDocBlocked
                                                        ? 'opacity-60 cursor-not-allowed bg-muted/40 dark:bg-muted/20'
                                                        : ''
                                                } ${
                                                    errors.numeroDocumento
                                                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                                                        : ''
                                                }`}
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
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    Debe seleccionar un tipo de documento para ingresar el número.
                                </p>
                            )}
                            {errors.numeroDocumento && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                    <CircleAlert className="size-3 shrink-0" />
                                    {errors.numeroDocumento.message}
                                </p>
                            )}
                        </div>

                        {/* Nombre Comercial */}
                        <div>
                            <label
                                htmlFor="provNombre"
                                className="block text-xs font-medium text-foreground mb-1"
                            >
                                Nombre Comercial <span className="text-destructive">*</span>
                            </label>
                            <Controller
                                control={control}
                                name="nombre"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="provNombre"
                                        type="text"
                                        placeholder="Ej. Distribuidora Andes SAC"
                                        className={`${inputBaseClass} ${
                                            errors.nombre
                                                ? 'border-destructive focus:border-destructive focus:ring-destructive'
                                                : ''
                                        }`}
                                    />
                                )}
                            />
                            {errors.nombre && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                    <CircleAlert className="size-3 shrink-0" />
                                    {errors.nombre.message}
                                </p>
                            )}
                        </div>

                        {/* Razón Social */}
                        <div>
                            <label
                                htmlFor="provRazon"
                                className="block text-xs font-medium text-foreground mb-1"
                            >
                                Razón Social (Fiscal)
                            </label>
                            <Controller
                                control={control}
                                name="razonSocial"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="provRazon"
                                        type="text"
                                        placeholder="Ej. Inversiones y Servicios Los Andes S.A.C."
                                        className={inputBaseClass}
                                    />
                                )}
                            />
                        </div>

                        {/* Teléfono y Correo Electrónico */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label
                                    htmlFor="provTel"
                                    className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                                >
                                    <Phone className="size-3.5 text-muted-foreground" />
                                    <span>Teléfono / WhatsApp</span>
                                </label>
                                <Controller
                                    control={control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="provTel"
                                            type="tel"
                                            placeholder="Ej. +51 987 654 321"
                                            className={inputBaseClass}
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="provEmail"
                                    className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                                >
                                    <Mail className="size-3.5 text-muted-foreground" />
                                    <span>Correo Electrónico</span>
                                </label>
                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="provEmail"
                                            type="email"
                                            placeholder="ventas@proveedor.com"
                                            className={`${inputBaseClass} ${
                                                errors.email
                                                    ? 'border-destructive focus:border-destructive focus:ring-destructive'
                                                    : ''
                                            }`}
                                        />
                                    )}
                                />
                                {errors.email && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                        <CircleAlert className="size-3 shrink-0" />
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Dirección Fiscal / Almacén */}
                        <div>
                            <label
                                htmlFor="provDir"
                                className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1"
                            >
                                <MapPin className="size-3.5 text-muted-foreground" />
                                <span>Dirección Fiscal o Almacén</span>
                            </label>
                            <Controller
                                control={control}
                                name="direccion"
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="provDir"
                                        type="text"
                                        placeholder="Ej. Av. Nicolás de Piérola 123, Cercado de Lima"
                                        className={inputBaseClass}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-xs font-semibold shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Check className="size-3.5" />
                            )}
                            <span>{isPending ? 'Registrando...' : 'Registrar Proveedor'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
