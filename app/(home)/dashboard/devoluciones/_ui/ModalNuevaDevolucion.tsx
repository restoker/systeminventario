'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    X,
    CornerDownLeft,
    Store,
    ReceiptText,
    Boxes,
    AlertCircle,
    Loader2,
    Search,
    CheckCircle2,
    ArrowDownLeft,
    Lock,
    Unlock,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';

import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { nuevaDevolucionAction } from '@/server/actions/devoluciones/nueva-devolucion-action';
import { abrirCajaAction } from '@/server/actions/caja/abrir-caja-action';
import {
    CajaAbiertaOption,
    ProductoOption,
    SucursalOption,
    VentaOptionForDevolucion,
} from '@/types/devolucion-schema';

interface ModalNuevaDevolucionProps {
    isOpen: boolean;
    onClose: () => void;
    sucursales: SucursalOption[];
    productos: ProductoOption[];
    ventas: VentaOptionForDevolucion[];
    cajasAbiertas: CajaAbiertaOption[];
    isAdmin: boolean;
    defaultSucursalId: string;
    onSuccess: () => void;
}

const MOTIVOS_SUGERIDOS = [
    'Producto defectuoso o con falla',
    'Cambio de modelo / talla / color',
    'Error en facturación o despacho',
    'Inconformidad del cliente',
];

export default function ModalNuevaDevolucion({
    isOpen,
    onClose,
    sucursales,
    productos,
    ventas,
    cajasAbiertas,
    isAdmin,
    defaultSucursalId,
    onSuccess,
}: ModalNuevaDevolucionProps) {
    const router = useRouter();
    const initialSucursal =
        defaultSucursalId && defaultSucursalId !== 'all'
            ? defaultSucursalId
            : sucursales[0]?.id || '';

    const [sucursalId, setSucursalId] = useState<string>(initialSucursal);
    const [ventaSearch, setVentaSearch] = useState<string>('');
    const [ventaId, setVentaId] = useState<string>('');
    const [productoId, setProductoId] = useState<string>('');
    const [cantidad, setCantidad] = useState<string>('1');
    const [motivo, setMotivo] = useState<string>('');
    const [montoAperturaInput, setMontoAperturaInput] = useState<string>('0');
    const [localOpenedCajas, setLocalOpenedCajas] = useState<Record<string, CajaAbiertaOption>>({});

    // Reiniciar estado al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const targetSucursal =
                defaultSucursalId && defaultSucursalId !== 'all'
                    ? defaultSucursalId
                    : sucursales[0]?.id || '';
            setSucursalId(targetSucursal);
            setVentaSearch('');
            setMotivo('');
            setCantidad('1');
            setMontoAperturaInput('0');
            setLocalOpenedCajas({});

            const ventasDeSede = ventas.filter((v) => v.sucursalId === targetSucursal);
            const firstVenta = ventasDeSede[0];
            setVentaId(firstVenta?.id || '');

            if (firstVenta && firstVenta.items.length > 0) {
                const firstReturnable =
                    firstVenta.items.find((i) => i.disponibleDevolver > 0) || firstVenta.items[0];
                setProductoId(firstReturnable?.productoId || '');
            } else {
                setProductoId(productos[0]?.id || '');
            }
        }
    }, [isOpen, defaultSucursalId, sucursales, ventas, productos]);

    // Ventas filtradas por la sucursal activa y búsqueda rápida
    const ventasFiltradas = useMemo(() => {
        const query = ventaSearch.trim().toLowerCase();
        return ventas.filter((v) => {
            if (sucursalId && v.sucursalId !== sucursalId) return false;
            if (!query) return true;
            return (
                v.comprobanteRef.toLowerCase().includes(query) ||
                v.cliente.toLowerCase().includes(query) ||
                (v.numeroDocumento || '').toLowerCase().includes(query)
            );
        });
    }, [ventas, sucursalId, ventaSearch]);

    const selectedVenta = useMemo(
        () => ventas.find((v) => v.id === ventaId) || null,
        [ventas, ventaId]
    );

    const hasLineItems = Boolean(selectedVenta && selectedVenta.items.length > 0);

    const selectedVentaItem = useMemo(() => {
        if (!selectedVenta || !hasLineItems) return null;
        return selectedVenta.items.find((i) => i.productoId === productoId) || null;
    }, [selectedVenta, hasLineItems, productoId]);

    const selectedCatalogProduct = useMemo(
        () => productos.find((p) => p.id === productoId) || null,
        [productos, productoId]
    );

    // Cuando cambia de sucursal, seleccionar automáticamente la primera venta de esa sede
    const handleSucursalChange = (newSucursalId: string) => {
        setSucursalId(newSucursalId);
        const ventasDeSede = ventas.filter((v) => v.sucursalId === newSucursalId);
        const firstVenta = ventasDeSede[0];
        setVentaId(firstVenta?.id || '');

        if (firstVenta && firstVenta.items.length > 0) {
            const firstReturnable =
                firstVenta.items.find((i) => i.disponibleDevolver > 0) || firstVenta.items[0];
            setProductoId(firstReturnable?.productoId || '');
        } else {
            setProductoId(productos[0]?.id || '');
        }
        setCantidad('1');
    };

    // Cuando cambia de venta, ajustar el producto seleccionado
    const handleVentaChange = (newVentaId: string) => {
        setVentaId(newVentaId);
        const vTarget = ventas.find((v) => v.id === newVentaId);
        if (vTarget && vTarget.items.length > 0) {
            const firstReturnable =
                vTarget.items.find((i) => i.disponibleDevolver > 0) || vTarget.items[0];
            setProductoId(firstReturnable?.productoId || '');
        } else {
            setProductoId(productos[0]?.id || '');
        }
        setCantidad('1');
    };

    const numCantidad = Number(cantidad) || 0;
    const maxDevolucion = selectedVentaItem ? selectedVentaItem.disponibleDevolver : null;
    const isOverMax = maxDevolucion !== null && numCantidad > maxDevolucion;
    const activeSucursalNombre =
        sucursales.find((s) => s.id === sucursalId)?.nombre || 'Sede seleccionada';
    const activeUnit =
        selectedVentaItem?.unidad || selectedCatalogProduct?.unidad || 'UND';
    const precioUnitarioDevolucion =
        selectedVentaItem?.precioUnitario ??
        selectedCatalogProduct?.precioVenta ??
        0;
    const montoEgresoEstimado = Math.max(
        0,
        Number((precioUnitarioDevolucion * (numCantidad > 0 ? numCantidad : 0)).toFixed(2))
    );

    // Mapa de cajas abiertas (servidor + recién abiertas desde este modal)
    const cajasPorSucursal = useMemo(() => {
        const map = new Map<string, CajaAbiertaOption>();
        cajasAbiertas.forEach((c) => map.set(c.sucursalId, c));
        Object.values(localOpenedCajas).forEach((c) => {
            if (!map.has(c.sucursalId)) {
                map.set(c.sucursalId, c);
            }
        });
        return map;
    }, [cajasAbiertas, localOpenedCajas]);

    // La caja obligatoria debe pertenecer al lugar donde se realizó la venta
    const targetVentaSucursalId = selectedVenta?.sucursalId || sucursalId;
    const targetVentaSucursalNombre =
        selectedVenta?.sucursalNombre || activeSucursalNombre;
    const cajaAbiertaDeSede = targetVentaSucursalId
        ? cajasPorSucursal.get(targetVentaSucursalId) || null
        : null;

    const { execute: executeAbrirCaja, status: abrirCajaStatus } = useAction(abrirCajaAction, {
        onSuccess: ({ data, input }) => {
            if (data?.ok) {
                toast.success(
                    data.msg || `Caja abierta exitosamente en ${targetVentaSucursalNombre}.`
                );
                setLocalOpenedCajas((prev) => ({
                    ...prev,
                    [input.sucursalId]: {
                        id: `opened-${input.sucursalId}`,
                        sucursalId: input.sucursalId,
                        montoApertura: Number(input.montoInicial) || 0,
                        usuarioNombre: 'Tú (Recién abierta)',
                        fechaAperturaFormateada: 'Ahora mismo',
                    },
                }));
                router.refresh();
            } else {
                toast.error(data?.msg || 'No se pudo abrir la caja en esta sucursal.');
            }
        },
        onError: ({ error }) => {
            const validationErrors = error.validationErrors as Record<string, any> | undefined;
            const firstFieldErr = validationErrors
                ? Object.values(validationErrors).flat()?.[0]
                : null;
            toast.error(firstFieldErr || error.serverError || 'Error al abrir la caja.');
        },
    });

    const isOpeningCaja = abrirCajaStatus === 'executing';

    const handleAbrirCajaEnSede = () => {
        if (!targetVentaSucursalId) {
            toast.error('No se pudo identificar la sucursal donde se realizó la venta.');
            return;
        }
        const montoNum = Number(montoAperturaInput);
        if (Number.isNaN(montoNum) || montoNum < 0) {
            toast.error('Ingresa un monto de apertura válido (mayor o igual a 0).');
            return;
        }
        executeAbrirCaja({
            sucursalId: targetVentaSucursalId,
            montoInicial: montoNum,
        });
    };

    const { execute, status } = useAction(nuevaDevolucionAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Devolución registrada exitosamente.');
                onSuccess();
                onClose();
            } else {
                toast.error(data?.msg || 'No se pudo registrar la devolución.');
            }
        },
        onError: ({ error }) => {
            const validationErrors = error.validationErrors as Record<string, any> | undefined;
            const firstFieldErr = validationErrors
                ? Object.values(validationErrors).flat()?.[0]
                : null;
            toast.error(
                firstFieldErr || error.serverError || 'Error al procesar la devolución.'
            );
        },
    });

    const isSubmitting = status === 'executing';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sucursalId) {
            toast.error('Selecciona una tienda / sucursal.');
            return;
        }
        if (!cajaAbiertaDeSede) {
            toast.error(
                `No hay una caja abierta en ${targetVentaSucursalNombre}. Debes abrir la caja en el lugar donde se vendió antes de registrar la devolución.`
            );
            return;
        }
        if (!ventaId) {
            toast.error('Selecciona la venta asociada.');
            return;
        }
        if (!productoId) {
            toast.error('Selecciona el producto a devolver.');
            return;
        }
        if (numCantidad <= 0 || !Number.isInteger(numCantidad)) {
            toast.error('Ingresa una cantidad entera mayor a 0.');
            return;
        }
        if (isOverMax) {
            toast.error(
                `Solo hay ${maxDevolucion} unidades disponibles para devolver en esta venta.`
            );
            return;
        }
        if (motivo.trim().length < 3) {
            toast.error('Describe el motivo de la devolución (mínimo 3 caracteres).');
            return;
        }

        execute({
            sucursalId,
            ventaId,
            productoId,
            cantidad: numCantidad,
            motivo: motivo.trim(),
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-nueva-devolucion-title"
        >
            <div className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/70 bg-muted/20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <CornerDownLeft className="size-4.5" />
                        </div>
                        <div className="min-w-0">
                            <h2
                                id="modal-nueva-devolucion-title"
                                className="text-base font-bold text-foreground tracking-tight truncate"
                            >
                                Registrar Nueva Devolución
                            </h2>
                            <p className="text-xs text-muted-foreground truncate">
                                Reingresa mercadería al stock, registra Kardex y genera un egreso en caja.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
                    {/* 1. Tienda / Sucursal */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Store className="size-3.5 text-primary" />
                            Tienda / Sucursal
                        </label>
                        {isAdmin ? (
                            <select
                                value={sucursalId}
                                onChange={(e) => handleSucursalChange(e.target.value)}
                                disabled={isSubmitting || isOpeningCaja}
                                className="w-full h-9.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                {sucursales.map((s) => {
                                    const hasCaja = cajasPorSucursal.has(s.id);
                                    return (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre} {s.codigo ? `(${s.codigo})` : ''} —{' '}
                                            {hasCaja ? 'Caja abierta' : 'Caja cerrada'}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <div className="h-9.5 rounded-lg border border-border/70 bg-muted/30 px-3 flex items-center justify-between text-xs">
                                <span className="font-semibold text-foreground">
                                    {activeSucursalNombre}
                                </span>
                                <Badge variant="secondary" className="text-[10px]">
                                    Sede Asignada
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Verificación de Caja Abierta en el Lugar de Venta */}
                    {targetVentaSucursalId && (
                        cajaAbiertaDeSede ? (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3.5 py-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <Unlock className="size-3.5" />
                                    </div>
                                    <div className="min-w-0 text-xs">
                                        <p className="font-semibold text-foreground truncate">
                                            Caja abierta en {targetVentaSucursalNombre}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            Cajero: {cajaAbiertaDeSede.usuarioNombre} • Apertura: {cajaAbiertaDeSede.fechaAperturaFormateada}
                                        </p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-semibold shrink-0">
                                    Habilitada
                                </Badge>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-amber-500/45 bg-amber-500/8 p-3.5 space-y-3">
                                <div className="flex items-start gap-2.5">
                                    <div className="size-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <Lock className="size-3.5" />
                                    </div>
                                    <div className="min-w-0 text-xs space-y-0.5">
                                        <p className="font-semibold text-foreground">
                                            Caja cerrada en {targetVentaSucursalNombre}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Para realizar esta devolución debe haber una caja abierta en{' '}
                                            <span className="font-semibold text-foreground">
                                                {targetVentaSucursalNombre}
                                            </span>{' '}
                                            (donde se vendió el producto). Ábrela aquí para continuar:
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-end gap-2 pt-1">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[11px] font-medium text-muted-foreground block">
                                            Monto inicial de caja (S/)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={montoAperturaInput}
                                            onChange={(e) => setMontoAperturaInput(e.target.value)}
                                            disabled={isOpeningCaja || isSubmitting}
                                            className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs font-mono font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAbrirCajaEnSede}
                                        disabled={isOpeningCaja || isSubmitting}
                                        className="h-8.5 px-3 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
                                    >
                                        {isOpeningCaja ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                <span>Abriendo...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Wallet className="size-3.5" />
                                                <span>Abrir Caja en {targetVentaSucursalNombre}</span>
                                            </>
                                        )}
                                    </Button>
                                    <Link
                                        href={`/dashboard/caja?sucursalId=${targetVentaSucursalId}`}
                                        className={buttonVariants({
                                            variant: 'outline',
                                            size: 'sm',
                                            className: 'h-8.5 px-2.5 text-xs shrink-0',
                                        })}
                                    >
                                        Ir a Caja
                                    </Link>
                                </div>
                            </div>
                        )
                    )}

                    {/* 2. Venta Asociada */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <ReceiptText className="size-3.5 text-primary" />
                                Venta de Origen
                            </label>
                            <span className="text-[11px] text-muted-foreground font-mono">
                                {ventasFiltradas.length} disponibles
                            </span>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={ventaSearch}
                                onChange={(e) => setVentaSearch(e.target.value)}
                                placeholder="Filtrar venta por comprobante, cliente o DNI/RUC..."
                                className="w-full h-8.5 rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {ventasFiltradas.length > 0 ? (
                            <select
                                value={ventaId}
                                onChange={(e) => handleVentaChange(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full h-9.5 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                {ventasFiltradas.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.comprobanteRef} — {v.cliente} ({v.fechaFormateada} • S/ {v.total.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>
                                    No hay ventas registradas para esta sucursal o criterio de búsqueda.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 3. Producto y Cantidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Boxes className="size-3.5 text-primary" />
                                Producto a Devolver
                            </label>

                            {hasLineItems ? (
                                <select
                                    value={productoId}
                                    onChange={(e) => {
                                        setProductoId(e.target.value);
                                        setCantidad('1');
                                    }}
                                    disabled={isSubmitting || !ventaId}
                                    className="w-full h-9.5 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    {selectedVenta!.items.map((item) => (
                                        <option
                                            key={item.productoId}
                                            value={item.productoId}
                                            disabled={item.disponibleDevolver <= 0}
                                        >
                                            {item.productoNombre} ({item.productoCodigo}) — Disp: {item.disponibleDevolver}/{item.cantidadVendida} {item.unidad}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value={productoId}
                                    onChange={(e) => setProductoId(e.target.value)}
                                    disabled={isSubmitting || !ventaId}
                                    className="w-full h-9.5 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    {productos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} ({p.codigo})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground">
                                    Cantidad
                                </label>
                                {maxDevolucion !== null && (
                                    <button
                                        type="button"
                                        onClick={() => setCantidad(String(Math.max(1, maxDevolucion)))}
                                        className="text-[10px] font-mono font-semibold text-primary hover:underline cursor-pointer"
                                    >
                                        Máx: {maxDevolucion}
                                    </button>
                                )}
                            </div>
                            <input
                                type="number"
                                min={1}
                                max={maxDevolucion !== null && maxDevolucion > 0 ? maxDevolucion : undefined}
                                step={1}
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                disabled={isSubmitting}
                                className={`w-full h-9.5 rounded-lg border bg-background px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 ${
                                    isOverMax
                                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                                        : 'border-input focus:border-primary focus:ring-primary'
                                }`}
                            />
                        </div>
                    </div>

                    {isOverMax && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>
                                La cantidad excede las unidades disponibles para devolver ({maxDevolucion}).
                            </span>
                        </div>
                    )}

                    {/* 4. Motivo de Devolución */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground block">
                            Motivo de la Devolución
                        </label>

                        <div className="flex flex-wrap gap-1.5">
                            {MOTIVOS_SUGERIDOS.map((sugerencia) => {
                                const isActive = motivo === sugerencia;
                                return (
                                    <button
                                        key={sugerencia}
                                        type="button"
                                        onClick={() => setMotivo(sugerencia)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                                            isActive
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border/80 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {sugerencia}
                                    </button>
                                );
                            })}
                        </div>

                        <textarea
                            rows={3}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Detalla el motivo por el cual el cliente devuelve el producto..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Resumen de Impacto en Inventario y Egreso de Caja */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 divide-y divide-border/60 overflow-hidden">
                        <div className="p-3 flex items-center justify-between gap-3 text-xs bg-emerald-500/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <ArrowDownLeft className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-semibold text-foreground block truncate">
                                        Impacto en Inventario ({targetVentaSucursalNombre})
                                    </span>
                                    <span className="text-[11px] text-muted-foreground block truncate">
                                        Asiento automático en Kardex • DEVOLUCION_CLIENTE
                                    </span>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                                +{numCantidad > 0 ? numCantidad : 0} {activeUnit}
                            </span>
                        </div>

                        <div className="p-3 flex items-center justify-between gap-3 text-xs bg-rose-500/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                    <Wallet className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-semibold text-foreground block truncate">
                                        Egreso en Caja ({targetVentaSucursalNombre})
                                    </span>
                                    <span className="text-[11px] text-muted-foreground block truncate">
                                        {cajaAbiertaDeSede
                                            ? `Salida de dinero registrada en caja (${cajaAbiertaDeSede.usuarioNombre})`
                                            : 'Requiere caja abierta en el lugar donde se vendió'}
                                    </span>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 shrink-0 tabular-nums">
                                -S/ {montoEgresoEstimado.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-9 px-4 text-xs cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                isSubmitting ||
                                isOpeningCaja ||
                                !cajaAbiertaDeSede ||
                                !ventaId ||
                                !productoId ||
                                isOverMax ||
                                numCantidad <= 0
                            }
                            className="h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Registrando...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Registrar Devolución</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

