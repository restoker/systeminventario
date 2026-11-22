'use client';

import React, { useState } from 'react';
import {
    Check,
    Copy,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Star,
    Store,
} from 'lucide-react';
import { toast } from 'sonner';

import type { RucEmpresaRow } from '@/interfaces/rucs';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface SheetRucDetalleProps {
    ruc: RucEmpresaRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAdmin: boolean;
    onEdit: (ruc: RucEmpresaRow) => void;
    onSetPrincipal: (ruc: RucEmpresaRow) => void;
    isMutating: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function formatFecha(iso: string): string {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return '—';
    return dateFormatter.format(parsed);
}

export default function SheetRucDetalle({
    ruc,
    open,
    onOpenChange,
    isAdmin,
    onEdit,
    onSetPrincipal,
    isMutating,
}: SheetRucDetalleProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (value: string, key: string, label: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(key);
        toast.success(`${label} copiado`);
        setTimeout(() => setCopiedField(null), 1800);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-lg p-0 flex flex-col gap-0 overflow-hidden"
            >
                {ruc && (
                    <>
                        <SheetHeader className="px-6 pt-6 pb-5 bg-muted/40 gap-2.5 text-left">
                            <div className="flex flex-wrap items-center gap-2 pr-8">
                                {ruc.esPrincipal && (
                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-[13px] font-medium text-amber-800 dark:text-amber-300">
                                        <Star className="size-3.5 fill-current" />
                                        Principal
                                    </span>
                                )}
                                <span
                                    className={
                                        ruc.activo
                                            ? 'inline-flex items-center rounded-md bg-emerald-500/12 px-2.5 py-1 text-[13px] font-medium text-emerald-800 dark:text-emerald-300'
                                            : 'inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-[13px] font-medium text-muted-foreground'
                                    }
                                >
                                    {ruc.activo ? 'Activo para facturar' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <SheetTitle className="text-xl font-semibold tracking-tight text-foreground leading-snug tabular-nums">
                                    RUC {ruc.numeroRuc}
                                </SheetTitle>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(ruc.numeroRuc, 'ruc', 'RUC')}
                                    aria-label={`Copiar RUC ${ruc.numeroRuc}`}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {copiedField === 'ruc' ? (
                                        <Check className="size-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                </button>
                            </div>

                            <SheetDescription className="text-sm text-foreground/85 leading-relaxed">
                                {ruc.razonSocial || ruc.nombre}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Identidad fiscal */}
                            <section aria-label="Datos fiscales" className="space-y-3">
                                <h3 className="text-[13px] font-semibold text-foreground">
                                    Datos fiscales y contacto
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div className="space-y-0.5">
                                        <dt className="text-[13px] text-muted-foreground">
                                            Nombre comercial
                                        </dt>
                                        <dd className="font-medium text-foreground">
                                            {ruc.nombre}
                                        </dd>
                                    </div>

                                    {ruc.razonSocial && ruc.razonSocial !== ruc.nombre && (
                                        <div className="space-y-0.5">
                                            <dt className="text-[13px] text-muted-foreground">
                                                Razón social SUNAT
                                            </dt>
                                            <dd className="font-medium text-foreground">
                                                {ruc.razonSocial}
                                            </dd>
                                        </div>
                                    )}

                                    <div className="space-y-0.5">
                                        <dt className="text-[13px] text-muted-foreground">
                                            Dirección fiscal
                                        </dt>
                                        <dd className="flex items-start gap-2 text-foreground">
                                            <MapPin className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                                            <span>
                                                {ruc.direccionFiscal || 'Sin dirección fiscal registrada'}
                                            </span>
                                        </dd>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="space-y-0.5">
                                            <dt className="text-[13px] text-muted-foreground">
                                                Teléfono
                                            </dt>
                                            <dd className="flex items-center gap-1.5 text-foreground tabular-nums">
                                                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                                                <span>{ruc.telefono || 'Sin registrar'}</span>
                                            </dd>
                                        </div>

                                        <div className="space-y-0.5">
                                            <dt className="text-[13px] text-muted-foreground">
                                                Correo de facturación
                                            </dt>
                                            <dd className="flex items-center gap-1.5 text-foreground min-w-0">
                                                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                                                <span className="truncate" title={ruc.email || undefined}>
                                                    {ruc.email || 'Sin registrar'}
                                                </span>
                                            </dd>
                                        </div>
                                    </div>

                                    {ruc.descripcion && (
                                        <div className="space-y-0.5 pt-1">
                                            <dt className="text-[13px] text-muted-foreground">
                                                Descripción interna
                                            </dt>
                                            <dd className="text-foreground/90 leading-relaxed">
                                                {ruc.descripcion}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </section>

                            {/* Actividad operativa */}
                            <section aria-label="Actividad registrada" className="space-y-3">
                                <h3 className="text-[13px] font-semibold text-foreground">
                                    Actividad asociada
                                </h3>
                                <div className="rounded-xl bg-muted/45 p-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-[13px] text-muted-foreground">
                                            Comprobantes
                                        </div>
                                        <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">
                                            {ruc.totalComprobantes}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[13px] text-muted-foreground">
                                            Ventas
                                        </div>
                                        <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">
                                            {ruc.totalVentas}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[13px] text-muted-foreground">
                                            Compras
                                        </div>
                                        <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">
                                            {ruc.totalCompras}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Sucursales vinculadas */}
                            <section aria-label="Sucursales vinculadas" className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-semibold text-foreground">
                                        Sucursales vinculadas
                                    </h3>
                                    <span className="text-[13px] text-muted-foreground tabular-nums">
                                        {ruc.sucursales.length}
                                    </span>
                                </div>

                                {ruc.sucursales.length > 0 ? (
                                    <ul className="space-y-2">
                                        {ruc.sucursales.map((suc) => (
                                            <li
                                                key={suc.id}
                                                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3.5 py-2.5 text-sm"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Store className="size-4 shrink-0 text-muted-foreground" />
                                                    <span className="font-medium text-foreground truncate">
                                                        {suc.nombre}
                                                    </span>
                                                    <span className="text-[13px] text-muted-foreground tabular-nums shrink-0">
                                                        {suc.codigo}
                                                    </span>
                                                </div>
                                                <span
                                                    className={
                                                        suc.activo
                                                            ? 'text-[13px] text-emerald-700 dark:text-emerald-300 shrink-0'
                                                            : 'text-[13px] text-muted-foreground shrink-0'
                                                    }
                                                >
                                                    {suc.activo ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Ninguna sucursal tiene este RUC como predeterminado.
                                    </p>
                                )}
                            </section>

                            {/* Series asignadas */}
                            {ruc.series.length > 0 && (
                                <section aria-label="Series de comprobantes" className="space-y-2.5">
                                    <h3 className="text-[13px] font-semibold text-foreground">
                                        Series configuradas
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {ruc.series.map((serie) => (
                                            <span
                                                key={serie.id}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-muted/55 px-2.5 py-1 text-[13px] text-foreground tabular-nums"
                                            >
                                                <span className="font-medium">{serie.serie}</span>
                                                <span className="text-muted-foreground">
                                                    {serie.nombre}
                                                </span>
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Auditoría */}
                            <section
                                aria-label="Fechas de registro"
                                className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[13px] text-muted-foreground tabular-nums"
                            >
                                <span>Registrado el {formatFecha(ruc.createdAt)}</span>
                                <span>Actualizado el {formatFecha(ruc.updatedAt)}</span>
                            </section>
                        </div>

                        {isAdmin && (
                            <SheetFooter className="bg-muted/35 px-6 py-4 flex-row items-center justify-between gap-2">
                                {!ruc.esPrincipal ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        disabled={isMutating}
                                        onClick={() => onSetPrincipal(ruc)}
                                        className="h-9 px-3.5 text-sm font-medium gap-1.5 cursor-pointer"
                                    >
                                        <Star className="size-3.5" />
                                        <span>Marcar principal</span>
                                    </Button>
                                ) : (
                                    <span className="text-[13px] text-muted-foreground">
                                        Emisor principal actual
                                    </span>
                                )}

                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={isMutating}
                                    onClick={() => onEdit(ruc)}
                                    className="h-9 px-4 text-sm font-medium gap-1.5 cursor-pointer"
                                >
                                    <Pencil className="size-3.5" />
                                    <span>Editar RUC</span>
                                </Button>
                            </SheetFooter>
                        )}
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
