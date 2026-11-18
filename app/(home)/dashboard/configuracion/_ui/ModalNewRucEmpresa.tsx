'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Building2,
    X,
    Search,
    Loader2,
    Check,
    CheckCircle2,
    ShieldCheck,
    MapPin,
    Phone,
    Mail,
    Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { newRucEmpresaAction } from '@/server/actions/ruc/ruc-actions';
import { newRucEmpresaSchema, NewRucEmpresaInput } from '@/types/ruc-empresa-schema';
import { getRucBusiness } from '@/server/actions/get-info-dni-ruc';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { RucEmpresa } from '@/server/schema/ruc';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (newRuc: RucEmpresa) => void;
    zIndexClass?: string;
}

const inputClass =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-xs text-black placeholder:text-black/40 focus:border-[#FC7819] focus:outline-hidden focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 transition-colors";

const ModalNewRucEmpresa = React.memo(function ModalNewRucEmpresa({
    isOpen,
    onClose,
    onSuccess,
    zIndexClass = "z-50"
}: Props) {
    const [isSearchingSunat, setIsSearchingSunat] = useState(false);
    const [sunatStatus, setSunatStatus] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        watch,
        reset,
        formState: { errors },
    } = useForm<NewRucEmpresaInput>({
        resolver: zodResolver(newRucEmpresaSchema),
        defaultValues: {
            numeroRuc: '',
            nombre: '',
            razonSocial: '',
            direccionFiscal: '',
            telefono: '',
            email: '',
            descripcion: '',
            activo: true,
            esPrincipal: false,
        },
    });

    const esPrincipalValue = watch('esPrincipal');

    const { execute, status } = useAction(newRucEmpresaAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg);
                if (data.data && onSuccess) {
                    onSuccess(data.data as RucEmpresa);
                }
                reset();
                setSunatStatus(null);
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Error de red al registrar el RUC');
        },
    });

    const isPending = status === 'executing';

    // Consulta en vivo a la API de SUNAT
    const handleConsultarSunat = async () => {
        const rawRuc = (getValues('numeroRuc') || '').trim();
        if (!rawRuc) {
            toast.error('Ingresa los 11 dígitos del RUC');
            return;
        }
        if (!/^\d{11}$/.test(rawRuc)) {
            toast.error('El RUC debe tener exactamente 11 dígitos numéricos');
            return;
        }

        setIsSearchingSunat(true);
        setSunatStatus(null);

        try {
            const res = await getRucBusiness(rawRuc);
            if (res?.ok && res.data) {
                const { name, address, status: estadoSunat } = res.data;
                const cleanName = (name || '').trim();
                const cleanAddress = (address || '').trim();

                setValue('razonSocial', cleanName, { shouldValidate: true, shouldDirty: true });
                if (!getValues('nombre')?.trim()) {
                    // Si el nombre comercial está vacío, sugerir la razón social
                    setValue('nombre', cleanName, { shouldValidate: true, shouldDirty: true });
                }
                if (cleanAddress) {
                    setValue('direccionFiscal', cleanAddress, { shouldValidate: true, shouldDirty: true });
                }
                setSunatStatus(estadoSunat || 'OK');
                toast.success('Datos oficiales obtenidos desde SUNAT');
            } else {
                toast.error(res?.msg || 'No se encontró información en SUNAT para este RUC');
            }
        } catch {
            toast.error('No se pudo conectar al servicio de consulta SUNAT');
        } finally {
            setIsSearchingSunat(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending && !isSearchingSunat) onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPending, isSearchingSunat]);

    if (!isOpen) return null;

    const onSubmit = (formData: NewRucEmpresaInput) => {
        execute(formData);
    };

    return (
        <div
            className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPending && !isSearchingSunat) onClose();
            }}
        >
            <div className="relative w-full max-w-lg rounded-xl border border-black/15 bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-neutral-900 animate-in zoom-in-95 duration-200 space-y-5 max-h-[92vh] overflow-y-auto">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            <Building2 className="size-3.5" />
                            <span>Facturación Multi-RUC</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Registrar Nuevo RUC Emisor
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ingresa el número de RUC para consultar datos de SUNAT o completa los campos manualmente.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending || isSearchingSunat}
                        className="rounded-lg p-1.5 text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                        aria-label="Cerrar modal"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Campo RUC con botón de consulta SUNAT */}
                    <div className="space-y-1.5">
                        <label htmlFor="input-numero-ruc" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Número de RUC <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    id="input-numero-ruc"
                                    type="text"
                                    maxLength={11}
                                    placeholder="20601411947"
                                    {...register('numeroRuc')}
                                    className={`${inputClass} font-mono tracking-wider`}
                                />
                                {sunatStatus && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Badge
                                            variant="outline"
                                            className="h-5 text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold"
                                        >
                                            <ShieldCheck className="size-3" />
                                            <span>{sunatStatus}</span>
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleConsultarSunat}
                                disabled={isSearchingSunat || isPending}
                                className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
                            >
                                {isSearchingSunat ? (
                                    <Loader2 className="size-3.5 animate-spin text-blue-600" />
                                ) : (
                                    <Search className="size-3.5 text-blue-600 dark:text-blue-400" />
                                )}
                                <span>Consultar SUNAT</span>
                            </Button>
                        </div>
                        {errors.numeroRuc && (
                            <p className="text-[11px] text-red-500">{errors.numeroRuc.message}</p>
                        )}
                    </div>

                    {/* Razón Social */}
                    <div className="space-y-1.5">
                        <label htmlFor="input-razon-social" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Razón Social (Oficial SUNAT) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="input-razon-social"
                            type="text"
                            placeholder="Ej. CONEXUS DISTRIBUCIONES E.I.R.L."
                            {...register('razonSocial')}
                            className={inputClass}
                        />
                        {errors.razonSocial && (
                            <p className="text-[11px] text-red-500">{errors.razonSocial.message}</p>
                        )}
                    </div>

                    {/* Nombre Comercial / Alias */}
                    <div className="space-y-1.5">
                        <label htmlFor="input-nombre-comercial" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Nombre Comercial / Alias <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="input-nombre-comercial"
                            type="text"
                            placeholder="Ej. Conexus Distribuciones"
                            {...register('nombre')}
                            className={inputClass}
                        />
                        {errors.nombre && (
                            <p className="text-[11px] text-red-500">{errors.nombre.message}</p>
                        )}
                    </div>

                    {/* Dirección Fiscal */}
                    <div className="space-y-1.5">
                        <label htmlFor="input-direccion-fiscal" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground" />
                            <span>Dirección Fiscal</span>
                        </label>
                        <input
                            id="input-direccion-fiscal"
                            type="text"
                            placeholder="Ej. Av. Los Corales Mza. C Lote 10, Lima"
                            {...register('direccionFiscal')}
                            className={inputClass}
                        />
                    </div>

                    {/* Teléfono y Correo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="input-telefono-ruc" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Phone className="size-3 text-muted-foreground" />
                                <span>Teléfono de Contacto</span>
                            </label>
                            <input
                                id="input-telefono-ruc"
                                type="text"
                                placeholder="987654321"
                                {...register('telefono')}
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="input-email-ruc" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <Mail className="size-3 text-muted-foreground" />
                                <span>Correo de Facturación</span>
                            </label>
                            <input
                                id="input-email-ruc"
                                type="email"
                                placeholder="facturacion@empresa.com"
                                {...register('email')}
                                className={inputClass}
                            />
                            {errors.email && (
                                <p className="text-[11px] text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Switch: RUC Principal */}
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Star className="size-4" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-foreground block">
                                    Establecer como RUC Principal
                                </span>
                                <span className="text-[11px] text-muted-foreground block">
                                    Será la empresa emisora predeterminada para ventas y facturación en el POS.
                                </span>
                            </div>
                        </div>
                        <Switch
                            checked={Boolean(esPrincipalValue)}
                            onCheckedChange={(checked) => setValue('esPrincipal', checked)}
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isPending || isSearchingSunat}
                            className="text-xs cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || isSearchingSunat}
                            className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Registrando...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="size-3.5" />
                                    <span>Guardar RUC Emisor</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
});

export default ModalNewRucEmpresa;
