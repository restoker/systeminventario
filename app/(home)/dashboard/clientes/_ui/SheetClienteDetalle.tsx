'use client';

import React, { useState } from 'react';
import {
    Building2,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    MapPin,
    Phone,
    Receipt,
    Store,
    User,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { ClienteResumenRow } from '@/interfaces/clientes';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

interface SheetClienteDetalleProps {
    cliente: ClienteResumenRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const solesFormatter = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatSoles(value: number): string {
    return `S/ ${solesFormatter.format(value)}`;
}

function getCategoryLabel(categoria: ClienteResumenRow['categoria']): string {
    if (categoria === 'empresa') return 'Empresa';
    if (categoria === 'varios') return 'Público general';
    return 'Persona natural';
}

export default function SheetClienteDetalle({
    cliente,
    open,
    onOpenChange,
}: SheetClienteDetalleProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [expandedVentaIds, setExpandedVentaIds] = useState<Record<string, boolean>>({});

    const handleCopy = (value: string, key: string, label: string) => {
        navigator.clipboard.writeText(value);
        setCopiedKey(key);
        toast.success(`${label} copiado`);
        setTimeout(() => setCopiedKey(null), 1800);
    };

    const toggleVentaExpanded = (ventaId: string) => {
        setExpandedVentaIds((prev) => ({
            ...prev,
            [ventaId]: !prev[ventaId],
        }));
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setExpandedVentaIds({});
                }
                onOpenChange(nextOpen);
            }}
        >
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl p-0 flex flex-col gap-0 overflow-hidden"
            >
                {cliente && (
                    <>
                        <SheetHeader className="px-6 pt-6 pb-5 bg-muted/40 gap-2.5 text-left">
                            <div className="flex items-center gap-2 pr-8">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-[13px] font-medium text-foreground">
                                    {cliente.categoria === 'empresa' ? (
                                        <Building2 className="size-3.5 text-primary" />
                                    ) : cliente.categoria === 'varios' ? (
                                        <Users className="size-3.5 text-muted-foreground" />
                                    ) : (
                                        <User className="size-3.5 text-primary" />
                                    )}
                                    {getCategoryLabel(cliente.categoria)}
                                </span>

                                {cliente.totalPendiente > 0.009 ? (
                                    <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-1 text-[13px] font-medium text-amber-800 dark:text-amber-300 tabular-nums">
                                        Saldo: {formatSoles(cliente.totalPendiente)}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-md bg-emerald-500/12 px-2.5 py-1 text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                                        Al día
                                    </span>
                                )}
                            </div>

                            <SheetTitle className="text-xl font-semibold tracking-tight text-foreground leading-snug pr-6">
                                {cliente.nombre}
                            </SheetTitle>

                            <SheetDescription className="text-[13px] text-muted-foreground leading-relaxed">
                                {cliente.esPublicoGeneral
                                    ? 'Ventas registradas sin documento específico ni razón social identificada.'
                                    : `Última compra el ${cliente.ultimaCompraFormateada} a las ${cliente.ultimaCompraHora} en ${cliente.sucursalPrincipalNombre}.`}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Resumen financiero del cliente */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-muted/45 p-4">
                                <div>
                                    <div className="text-[13px] text-muted-foreground">Compras</div>
                                    <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                                        {cliente.totalCompras}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[13px] text-muted-foreground">Total gastado</div>
                                    <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                                        {formatSoles(cliente.totalGastado)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[13px] text-muted-foreground">Ticket prom.</div>
                                    <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                                        {formatSoles(cliente.ticketPromedio)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[13px] text-muted-foreground">Unidades</div>
                                    <div className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                                        {cliente.totalProductos}
                                    </div>
                                </div>
                            </div>

                            {/* Datos de identificación y contacto */}
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">
                                    Datos de contacto y sucursales
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-lg bg-muted/30 p-3.5 space-y-1">
                                        <div className="text-[13px] text-muted-foreground">
                                            Documento ({cliente.tipoDocumentoNombre || 'Sin tipo'})
                                        </div>
                                        {cliente.numeroDocumento ? (
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-foreground tabular-nums">
                                                    {cliente.numeroDocumento}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopy(
                                                            cliente.numeroDocumento!,
                                                            'doc',
                                                            'Documento'
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color,color] duration-150 cursor-pointer"
                                                    aria-label="Copiar documento"
                                                >
                                                    {copiedKey === 'doc' ? (
                                                        <Check className="size-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                    <span>Copiar</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No registrado</span>
                                        )}
                                    </div>

                                    <div className="rounded-lg bg-muted/30 p-3.5 space-y-1">
                                        <div className="text-[13px] text-muted-foreground">Teléfono</div>
                                        {cliente.telefono ? (
                                            <div className="flex items-center justify-between gap-2">
                                                <a
                                                    href={`tel:${cliente.telefono}`}
                                                    className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline tabular-nums"
                                                >
                                                    <Phone className="size-3.5 text-muted-foreground" />
                                                    {cliente.telefono}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopy(
                                                            cliente.telefono!,
                                                            'tel',
                                                            'Teléfono'
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color,color] duration-150 cursor-pointer"
                                                    aria-label="Copiar teléfono"
                                                >
                                                    {copiedKey === 'tel' ? (
                                                        <Check className="size-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                    <span>Copiar</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No registrado</span>
                                        )}
                                    </div>

                                    <div className="rounded-lg bg-muted/30 p-3.5 space-y-1 sm:col-span-2">
                                        <div className="text-[13px] text-muted-foreground">Dirección</div>
                                        {cliente.direccion ? (
                                            <div className="flex items-start gap-2 text-foreground">
                                                <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <span className="leading-snug">{cliente.direccion}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No registrada</span>
                                        )}
                                    </div>

                                    <div className="rounded-lg bg-muted/30 p-3.5 space-y-1 sm:col-span-2">
                                        <div className="text-[13px] text-muted-foreground">
                                            Sucursales y métodos frecuentes
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-foreground">
                                            <span className="inline-flex items-center gap-1.5 font-medium">
                                                <Store className="size-3.5 text-muted-foreground" />
                                                {cliente.sucursalesNombres.join(', ')}
                                            </span>
                                            {cliente.metodosPago.length > 0 && (
                                                <span className="text-muted-foreground">
                                                    · Pagos: {cliente.metodosPago.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Historial de compras */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Historial de compras ({cliente.ventas.length})
                                    </h3>
                                    {cliente.totalDescuentos > 0 && (
                                        <span className="text-[13px] text-muted-foreground tabular-nums">
                                            Desc. acumulados: {formatSoles(cliente.totalDescuentos)}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    {cliente.ventas.map((ventaItem, index) => {
                                        const isExpanded =
                                            expandedVentaIds[ventaItem.id] ?? index === 0;

                                        return (
                                            <div
                                                key={ventaItem.id}
                                                className="rounded-xl bg-muted/35 p-4 space-y-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Receipt className="size-4 text-muted-foreground shrink-0" />
                                                            <span className="text-sm font-semibold text-foreground tabular-nums">
                                                                {ventaItem.comprobanteRef}
                                                            </span>
                                                            {ventaItem.comprobanteEstado === false ? (
                                                                <span className="rounded bg-destructive/12 px-2 py-0.5 text-[13px] font-medium text-destructive">
                                                                    Anulado
                                                                </span>
                                                            ) : ventaItem.saldoPendiente > 0.009 ? (
                                                                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[13px] font-medium text-amber-800 dark:text-amber-300 tabular-nums">
                                                                    Debe {formatSoles(ventaItem.saldoPendiente)}
                                                                </span>
                                                            ) : (
                                                                <span className="rounded bg-emerald-500/12 px-2 py-0.5 text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                                                                    Pagado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[13px] text-muted-foreground tabular-nums">
                                                            {ventaItem.fechaFormateada}, {ventaItem.horaFormateada} · {ventaItem.sucursalNombre} · {ventaItem.metodoPagoNombre}
                                                        </div>
                                                        <div className="text-[13px] text-muted-foreground">
                                                            Atendido por {ventaItem.vendedorNombre}
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <div className="text-base font-semibold text-foreground tabular-nums">
                                                            {formatSoles(ventaItem.total)}
                                                        </div>
                                                        {ventaItem.descuento > 0 && (
                                                            <div className="text-[13px] text-muted-foreground tabular-nums">
                                                                Desc. {formatSoles(ventaItem.descuento)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {ventaItem.productos.length > 0 && (
                                                    <div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleVentaExpanded(ventaItem.id)}
                                                            aria-expanded={isExpanded}
                                                            className="h-8 px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="size-3.5" />
                                                            ) : (
                                                                <ChevronRight className="size-3.5" />
                                                            )}
                                                            <span>
                                                                {ventaItem.productos.length}{' '}
                                                                {ventaItem.productos.length === 1
                                                                    ? 'producto'
                                                                    : 'productos'}{' '}
                                                                ({ventaItem.productosCount} uds.)
                                                            </span>
                                                        </Button>

                                                        {isExpanded && (
                                                            <div className="mt-2 rounded-lg bg-background p-3 space-y-2">
                                                                {ventaItem.productos.map((prod) => (
                                                                    <div
                                                                        key={prod.id}
                                                                        className="flex items-start justify-between gap-3 text-[13px]"
                                                                    >
                                                                        <div className="min-w-0">
                                                                            <div className="font-medium text-foreground truncate">
                                                                                {prod.productoNombre}
                                                                            </div>
                                                                            <div className="text-muted-foreground tabular-nums">
                                                                                {prod.cantidad} {prod.unidadAbreviatura} ×{' '}
                                                                                {formatSoles(prod.precio)}
                                                                                {prod.productoCodigo
                                                                                    ? ` · Cód. ${prod.productoCodigo}`
                                                                                    : ''}
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-medium text-foreground tabular-nums shrink-0">
                                                                            {formatSoles(prod.precioTotal)}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
