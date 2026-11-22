'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';

import type {
    RucEmpresaRow,
    RucFacturacionResumen,
} from '@/interfaces/rucs';
import {
    upsertFacturacionSchema,
    type UpsertFacturacionInput,
} from '@/types/facturacion-schema';
import { upsertFacturacionAction } from '@/server/actions/facturacion/facturacion-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface SheetFacturacionFormProps {
    ruc: RucEmpresaRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (facturacion: RucFacturacionResumen) => void;
}

export default function SheetFacturacionForm({
    ruc,
    open,
    onOpenChange,
    onSuccess,
}: SheetFacturacionFormProps) {
    const isEditing = Boolean(ruc?.facturacion);

    const [showClaveSol, setShowClaveSol] = useState(false);
    const [showCertPassword, setShowCertPassword] = useState(false);
    const [showClientSecret, setShowClientSecret] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors },
    } = useForm<UpsertFacturacionInput>({
        resolver: zodResolver(upsertFacturacionSchema),
        defaultValues: {
            rucEmpresaId: '',
            ubigeo: '',
            departamento: '',
            provincia: '',
            distrito: '',
            pathCert: '',
            logo: '',
            usuarioSol: '',
            claveSol: '',
            passwordCertificadoDigital: '',
            produccion: false,
            clienteId: '',
            clienteSecret: '',
        },
    });

    const produccionValue = useWatch({ control, name: 'produccion' });

    useEffect(() => {
        if (!open || !ruc) return;

        const f = ruc.facturacion;
        reset({
            rucEmpresaId: ruc.id,
            ubigeo: f?.ubigeo ?? '',
            departamento: f?.departamento ?? '',
            provincia: f?.provincia ?? '',
            distrito: f?.distrito ?? '',
            pathCert: f?.pathCert ?? '',
            logo: f?.logo ?? '',
            usuarioSol: f?.usuarioSol ?? '',
            claveSol: f?.claveSol ?? '',
            passwordCertificadoDigital: f?.passwordCertificadoDigital ?? '',
            produccion: f?.produccion ?? false,
            clienteId: f?.clienteId ?? '',
            clienteSecret: f?.clienteSecret ?? '',
        });
    }, [open, ruc, reset]);

    const { execute, status } = useAction(upsertFacturacionAction, {
        onSuccess: ({ data }) => {
            if (data?.ok && data.data) {
                toast.success(data.msg);
                const saved = data.data;
                onSuccess({
                    id: saved.id,
                    rucEmpresaId: saved.rucEmpresaId,
                    ubigeo: saved.ubigeo,
                    departamento: saved.departamento,
                    provincia: saved.provincia,
                    distrito: saved.distrito,
                    pathCert: saved.pathCert,
                    logo: saved.logo,
                    usuarioSol: saved.usuarioSol,
                    claveSol: saved.claveSol,
                    passwordCertificadoDigital: saved.passwordCertificadoDigital,
                    produccion: saved.produccion ?? false,
                    clienteId: saved.clienteId,
                    clienteSecret: saved.clienteSecret,
                    createdAt: new Date(saved.createdAt).toISOString(),
                    updatedAt: new Date(saved.updatedAt).toISOString(),
                });
                onOpenChange(false);
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('No se pudo guardar la configuración de facturación');
        },
    });

    const isPending = status === 'executing';

    const onSubmit = (values: UpsertFacturacionInput) => {
        if (!ruc) return;
        execute({
            ...values,
            rucEmpresaId: ruc.id,
        });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (isPending) return;
        if (!nextOpen) {
            setShowClaveSol(false);
            setShowCertPassword(false);
            setShowClientSecret(false);
        }
        onOpenChange(nextOpen);
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl p-0 flex flex-col gap-0 overflow-hidden"
            >
                {ruc && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col h-full min-h-0"
                    >
                        <SheetHeader className="px-6 pt-6 pb-5 bg-muted/40 gap-1.5 text-left">
                            <SheetTitle className="text-xl font-semibold tracking-tight text-foreground leading-snug pr-8">
                                {isEditing
                                    ? 'Editar datos de facturación'
                                    : 'Agregar datos de facturación'}
                            </SheetTitle>
                            <SheetDescription className="text-sm text-muted-foreground leading-relaxed tabular-nums">
                                RUC {ruc.numeroRuc} · {ruc.razonSocial || ruc.nombre}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Entorno SUNAT */}
                            <section
                                aria-label="Entorno de emisión SUNAT"
                                className="rounded-xl bg-muted/45 p-4 flex items-center justify-between gap-4"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <Label
                                        htmlFor="facturacion-produccion"
                                        className="text-sm font-medium text-foreground cursor-pointer"
                                    >
                                        Modo producción SUNAT
                                    </Label>
                                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                                        {produccionValue
                                            ? 'Activo: los comprobantes se enviarán al servidor oficial de SUNAT.'
                                            : 'Desactivado: las emisiones se procesarán en entorno de pruebas (Beta).'}
                                    </p>
                                </div>
                                <Switch
                                    id="facturacion-produccion"
                                    checked={Boolean(produccionValue)}
                                    onCheckedChange={(checked) =>
                                        setValue('produccion', checked, {
                                            shouldDirty: true,
                                        })
                                    }
                                    disabled={isPending}
                                />
                            </section>

                            {/* Ubicación SUNAT */}
                            <section
                                aria-label="Ubicación geográfica SUNAT"
                                className="space-y-3.5"
                            >
                                <div className="space-y-0.5">
                                    <h3 className="text-[13px] font-semibold text-foreground">
                                        Ubicación geográfica (SUNAT)
                                    </h3>
                                    <p className="text-[13px] text-muted-foreground">
                                        Datos requeridos para emisión electrónica y notas de crédito.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-ubigeo"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Ubigeo
                                        </Label>
                                        <Input
                                            id="facturacion-ubigeo"
                                            type="text"
                                            maxLength={6}
                                            inputMode="numeric"
                                            placeholder="150101"
                                            disabled={isPending}
                                            {...register('ubigeo')}
                                            className="h-9 text-sm bg-background tabular-nums"
                                        />
                                        {errors.ubigeo && (
                                            <p className="text-xs text-destructive">
                                                {errors.ubigeo.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-departamento"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Departamento
                                        </Label>
                                        <Input
                                            id="facturacion-departamento"
                                            type="text"
                                            placeholder="Lima"
                                            disabled={isPending}
                                            {...register('departamento')}
                                            className="h-9 text-sm bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-provincia"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Provincia
                                        </Label>
                                        <Input
                                            id="facturacion-provincia"
                                            type="text"
                                            placeholder="Lima"
                                            disabled={isPending}
                                            {...register('provincia')}
                                            className="h-9 text-sm bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-distrito"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Distrito
                                        </Label>
                                        <Input
                                            id="facturacion-distrito"
                                            type="text"
                                            placeholder="San Isidro"
                                            disabled={isPending}
                                            {...register('distrito')}
                                            className="h-9 text-sm bg-background"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Credenciales SOL y Certificado */}
                            <section
                                aria-label="Credenciales SOL y certificado digital"
                                className="space-y-3.5"
                            >
                                <div className="space-y-0.5">
                                    <h3 className="text-[13px] font-semibold text-foreground">
                                        Credenciales SOL y certificado digital
                                    </h3>
                                    <p className="text-[13px] text-muted-foreground">
                                        Accesos secundarios de SUNAT y firma electrónica del emisor.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-usuario-sol"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Usuario SOL
                                        </Label>
                                        <Input
                                            id="facturacion-usuario-sol"
                                            type="text"
                                            autoComplete="off"
                                            placeholder="MODDATOS"
                                            disabled={isPending}
                                            {...register('usuarioSol')}
                                            className="h-9 text-sm bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-clave-sol"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Clave SOL
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="facturacion-clave-sol"
                                                type={
                                                    showClaveSol
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                disabled={isPending}
                                                {...register('claveSol')}
                                                className="h-9 pr-9 text-sm bg-background"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowClaveSol((v) => !v)
                                                }
                                                aria-label={
                                                    showClaveSol
                                                        ? 'Ocultar clave SOL'
                                                        : 'Mostrar clave SOL'
                                                }
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                            >
                                                {showClaveSol ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="facturacion-path-cert"
                                        className="text-[13px] font-medium text-foreground"
                                    >
                                        Ruta o URL del certificado digital (.pfx / .p12)
                                    </Label>
                                    <Input
                                        id="facturacion-path-cert"
                                        type="text"
                                        placeholder="/certs/empresa.pfx o URL del certificado"
                                        disabled={isPending}
                                        {...register('pathCert')}
                                        className="h-9 text-sm bg-background"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="facturacion-password-cert"
                                        className="text-[13px] font-medium text-foreground"
                                    >
                                        Contraseña del certificado digital
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="facturacion-password-cert"
                                            type={
                                                showCertPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            disabled={isPending}
                                            {...register(
                                                'passwordCertificadoDigital'
                                            )}
                                            className="h-9 pr-9 text-sm bg-background"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCertPassword((v) => !v)
                                            }
                                            aria-label={
                                                showCertPassword
                                                    ? 'Ocultar contraseña del certificado'
                                                    : 'Mostrar contraseña del certificado'
                                            }
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            {showCertPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* API SUNAT & Logo */}
                            <section
                                aria-label="Credenciales API SUNAT y logotipo"
                                className="space-y-3.5"
                            >
                                <div className="space-y-0.5">
                                    <h3 className="text-[13px] font-semibold text-foreground">
                                        Credenciales API SUNAT y logotipo
                                    </h3>
                                    <p className="text-[13px] text-muted-foreground">
                                        Client ID / Secret para servicios REST de SUNAT y logotipo impreso en comprobantes.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-cliente-id"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Client ID
                                        </Label>
                                        <Input
                                            id="facturacion-cliente-id"
                                            type="text"
                                            autoComplete="off"
                                            placeholder="ID de cliente SUNAT"
                                            disabled={isPending}
                                            {...register('clienteId')}
                                            className="h-9 text-sm bg-background"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="facturacion-cliente-secret"
                                            className="text-[13px] font-medium text-foreground"
                                        >
                                            Client Secret
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="facturacion-cliente-secret"
                                                type={
                                                    showClientSecret
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                disabled={isPending}
                                                {...register('clienteSecret')}
                                                className="h-9 pr-9 text-sm bg-background"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowClientSecret(
                                                        (v) => !v
                                                    )
                                                }
                                                aria-label={
                                                    showClientSecret
                                                        ? 'Ocultar Client Secret'
                                                        : 'Mostrar Client Secret'
                                                }
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                            >
                                                {showClientSecret ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="facturacion-logo"
                                        className="text-[13px] font-medium text-foreground"
                                    >
                                        URL o ruta del logotipo
                                    </Label>
                                    <Input
                                        id="facturacion-logo"
                                        type="text"
                                        placeholder="https://... o /images/logo-empresa.png"
                                        disabled={isPending}
                                        {...register('logo')}
                                        className="h-9 text-sm bg-background"
                                    />
                                </div>
                            </section>
                        </div>

                        <SheetFooter className="bg-muted/35 px-6 py-4 flex-row items-center justify-end gap-2.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleOpenChange(false)}
                                className="h-9 px-3.5 text-sm cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isPending}
                                className="h-9 px-4 text-sm font-medium gap-1.5 cursor-pointer"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-4" />
                                        <span>
                                            {isEditing
                                                ? 'Guardar cambios'
                                                : 'Guardar facturación'}
                                        </span>
                                    </>
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                )}
            </SheetContent>
        </Sheet>
    );
}
