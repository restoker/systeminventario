'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import { cn } from 'cn';
import {
    ArrowLeftIcon,
    PackagePlusIcon,
    StoreIcon,
    WalletIcon,
    PackageIcon,
    PlusIcon,
    MinusIcon,
    Loader2Icon,
    BoxesIcon,
    ReceiptIcon,
    TruckIcon,
    AlertTriangleIcon,
    AlertCircleIcon,
    CheckCircle2Icon,
    RotateCcwIcon,
    SearchIcon,
    Trash2Icon,
    CalendarIcon,
    ClockIcon,
    ArrowRightIcon,
    XIcon
} from 'lucide-react';
import { Sucursal, TipoDocumentoDto } from '@/interfaces';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    reabastecerSchema,
    ReabastecerValues,
    ReabastecerInput
} from '@/types/reabastecer-schema';
import { reabastecerAction } from '@/server/actions/inventario/reabastecer-action';
import ModalNuevoProveedor from './ModalNuevoProveedor';

export interface FormProductItem {
    id: string;
    name: string;
    codigo: string;
    description: string;
    precioCompra: number | null;
    precioVenta: number;
    enConsignacion?: boolean | null;
    proveedorId?: string | null;
    categoria?: { id: string; nombre: string } | null;
    marca?: { id: string; nombre: string } | null;
    unidad?: { id: string; nombre: string; abreviatura?: string | null } | null;
    proveedor?: { id: string; nombre: string; razonSocial?: string | null; numeroDocumento?: string | null } | null;
    imagenes?: { id: string; url: string; isPrincipal?: boolean | null }[];
}

export interface StockSucursalItem {
    id: string;
    productoId: string;
    sucursalId: string;
    cantidad: number;
    stockMinimo: number;
}

export interface ProveedorItem {
    id: string;
    nombre: string;
    razonSocial?: string | null;
    numeroDocumento?: string | null;
    telefono?: string | null;
    email?: string | null;
    activo?: boolean | null;
}

export interface TipoComprobanteItem {
    id: string;
    nombre: string;
    serie: string;
    numero: string;
    nombreSunat?: string | null;
}

export interface CajaItem {
    id: string;
    estado: 'abierto' | 'cerrado' | null;
    fechaApertura: Date | null;
    montoApertura: number;
    usuario?: {
        name?: string | null;
        email?: string | null;
    } | null;
}

interface FormReabastecerProps {
    sucursal: Sucursal;
    sucursales: Sucursal[];
    caja: CajaItem;
    productoInicial: FormProductItem | null;
    stocksSucursal: StockSucursalItem[];
    proveedores: ProveedorItem[];
    tipoDocumentos?: TipoDocumentoDto[];
    tiposComprobante: TipoComprobanteItem[];
    productosDisponibles: FormProductItem[];
    canChangeSucursal: boolean;
}

function getTodayIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function FormReabastecer({
    sucursal,
    caja,
    productoInicial,
    stocksSucursal,
    proveedores,
    tipoDocumentos = [],
    tiposComprobante,
    productosDisponibles,
    canChangeSucursal,
}: FormReabastecerProps) {
    const router = useRouter();

    const defaultTipoComprobanteId = useMemo(() => {
        const factura = tiposComprobante.find((t) =>
            t.nombre.toLowerCase().includes('factura')
        );
        return factura?.id || tiposComprobante[0]?.id || '';
    }, [tiposComprobante]);

    const defaultProveedorId =
        productoInicial?.proveedorId || proveedores[0]?.id || '';

    // Estados locales de UI
    const [searchQuery, setSearchQuery] = useState('');
    const [onlyLowStock, setOnlyLowStock] = useState(false);
    const [isModalProveedorOpen, setIsModalProveedorOpen] = useState(false);
    const [proveedoresList, setProveedoresList] = useState<ProveedorItem[]>(proveedores);
    const [lastPurchaseSummary, setLastPurchaseSummary] = useState<{
        totalProductos: number;
        totalUnidades: number;
        montoTotal: number;
        aCredito: boolean;
    } | null>(null);

    useEffect(() => {
        setProveedoresList(proveedores);
    }, [proveedores]);

    // Mapas rápidos O(1) para catálogo y existencias en sucursal
    const productsById = useMemo(() => {
        const map = new Map<string, FormProductItem>();
        for (const p of productosDisponibles) {
            map.set(p.id, p);
        }
        if (productoInicial && !map.has(productoInicial.id)) {
            map.set(productoInicial.id, productoInicial);
        }
        return map;
    }, [productosDisponibles, productoInicial]);

    const stocksByProductId = useMemo(() => {
        const map = new Map<string, StockSucursalItem>();
        for (const s of stocksSucursal) {
            map.set(s.productoId, s);
        }
        return map;
    }, [stocksSucursal]);

    // Inicialización de React Hook Form + useFieldArray
    const {
        register,
        handleSubmit,
        control,
        setValue,
        getValues,
        reset,
        formState: { errors },
    } = useForm<ReabastecerInput, unknown, ReabastecerValues>({
        resolver: zodResolver(reabastecerSchema),
        defaultValues: {
            sucursalId: sucursal.id,
            proveedorId: defaultProveedorId,
            tipoComprobanteId: defaultTipoComprobanteId,
            numeroComprobante: '',
            fechaComprobante: getTodayIsoDate(),
            aCredito: false,
            numeroDiasCredito: undefined,
            motivo: '',
            items: productoInicial
                ? [
                      {
                          productoId: productoInicial.id,
                          cantidad: 10,
                          costoUnitario: productoInicial.precioCompra ?? 0,
                      },
                  ]
                : [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    // Observadores reactivos en tiempo real
    const watchedItems = useWatch({ control, name: 'items' }) || [];
    const watchedACredito = Boolean(useWatch({ control, name: 'aCredito' }));
    const watchedDiasCredito = useWatch({ control, name: 'numeroDiasCredito' });
    const watchedTipoComprobanteId = useWatch({ control, name: 'tipoComprobanteId' });

    const selectedTipoComprobante = useMemo(
        () => tiposComprobante.find((t) => t.id === watchedTipoComprobanteId),
        [tiposComprobante, watchedTipoComprobanteId]
    );

    // Conjunto de productos ya agregados a la orden de compra
    const addedProductIds = useMemo(() => {
        const map = new Map<string, number>();
        watchedItems.forEach((item, idx) => {
            if (item?.productoId) {
                map.set(item.productoId, idx);
            }
        });
        return map;
    }, [watchedItems]);

    // Totales calculados dinámicamente
    const { totalUnidades, montoTotal } = useMemo(() => {
        let unidades = 0;
        let monto = 0;
        for (const item of watchedItems) {
            const qty = Number(item?.cantidad) || 0;
            const cost = Number(item?.costoUnitario) || 0;
            if (qty > 0) unidades += qty;
            if (qty > 0 && cost >= 0) monto += qty * cost;
        }
        return {
            totalUnidades: unidades,
            montoTotal: monto,
        };
    }, [watchedItems]);

    // Fecha estimada de vencimiento si es compra a crédito
    const dueDatePreview = useMemo(() => {
        const days = Number(watchedDiasCredito);
        if (!watchedACredito || !days || days <= 0) return null;
        const target = new Date();
        target.setDate(target.getDate() + days);
        return target.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }, [watchedACredito, watchedDiasCredito]);

    // Filtrado del buscador de catálogo
    const filteredCatalog = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return productosDisponibles.filter((prod) => {
            if (onlyLowStock) {
                const st = stocksByProductId.get(prod.id);
                const qty = st?.cantidad ?? 0;
                const min = st?.stockMinimo ?? 5;
                if (qty > min) return false;
            }
            if (!q) return true;
            return (
                prod.name.toLowerCase().includes(q) ||
                prod.codigo.toLowerCase().includes(q) ||
                (prod.marca?.nombre.toLowerCase().includes(q) ?? false) ||
                (prod.categoria?.nombre.toLowerCase().includes(q) ?? false)
            );
        });
    }, [productosDisponibles, searchQuery, onlyLowStock, stocksByProductId]);

    const lowStockCount = useMemo(() => {
        let count = 0;
        for (const prod of productosDisponibles) {
            const st = stocksByProductId.get(prod.id);
            const qty = st?.cantidad ?? 0;
            const min = st?.stockMinimo ?? 5;
            if (qty <= min) count++;
        }
        return count;
    }, [productosDisponibles, stocksByProductId]);

    // Acción para agregar o incrementar un producto en la lista
    const handleAddProductToOrder = (product: FormProductItem) => {
        const existingIndex = addedProductIds.get(product.id);

        if (existingIndex !== undefined) {
            const currentItems = getValues('items') || [];
            const prevQty = Number(currentItems[existingIndex]?.cantidad) || 0;
            setValue(`items.${existingIndex}.cantidad`, prevQty + 1, {
                shouldValidate: true,
                shouldDirty: true,
            });
            toast.info(`Se sumó +1 unidad a "${product.name}"`);
            return;
        }

        append({
            productoId: product.id,
            cantidad: 1,
            costoUnitario: product.precioCompra ?? 0,
        });

        // Si aún no hay proveedor elegido y el producto tiene uno asociado, sugerirlo
        const currentProv = getValues('proveedorId');
        if (!currentProv && product.proveedorId) {
            setValue('proveedorId', product.proveedorId, { shouldValidate: true });
        }
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return;

        e.preventDefault();
        const exactMatch = productosDisponibles.find(
            (p) => p.codigo.toLowerCase() === q
        );
        if (exactMatch) {
            handleAddProductToOrder(exactMatch);
            setSearchQuery('');
            return;
        }
        if (filteredCatalog.length === 1) {
            handleAddProductToOrder(filteredCatalog[0]);
            setSearchQuery('');
        }
    };

    const handleQuantityStep = (index: number, delta: number) => {
        const currentItems = getValues('items') || [];
        const currentVal = Number(currentItems[index]?.cantidad) || 0;
        const nextVal = Math.max(1, currentVal + delta);
        setValue(`items.${index}.cantidad`, nextVal, {
            shouldValidate: true,
            shouldDirty: true,
        });
    };

    const handleTipoComprobanteChange = (newTipoId: string) => {
        setValue('tipoComprobanteId', newTipoId, { shouldValidate: true });
        const chosen = tiposComprobante.find((t) => t.id === newTipoId);
        if (
            chosen?.nombre.toLowerCase().includes('sin comprobante') &&
            !String(getValues('numeroComprobante') || '').trim()
        ) {
            setValue('numeroComprobante', 'S/N', { shouldValidate: true });
        }
    };

    const handleProveedorCreated = (newProveedor: ProveedorItem) => {
        setProveedoresList((prev) => [
            newProveedor,
            ...prev.filter((p) => p.id !== newProveedor.id),
        ]);
        setValue('proveedorId', newProveedor.id, {
            shouldValidate: true,
            shouldDirty: true,
        });
        toast.success(
            `Proveedor "${newProveedor.razonSocial || newProveedor.nombre}" seleccionado.`
        );
    };

    // Integración con Server Action
    const { execute, status } = useAction(reabastecerAction, {
        onSuccess: ({ data, input }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Compra y reabastecimiento registrados');
                const submittedItems = input.items || [];
                const sumQty = submittedItems.reduce(
                    (acc, it) => acc + (Number(it.cantidad) || 0),
                    0
                );
                const sumMonto = submittedItems.reduce(
                    (acc, it) =>
                        acc + (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0),
                    0
                );
                setLastPurchaseSummary({
                    totalProductos: submittedItems.length,
                    totalUnidades: sumQty,
                    montoTotal: sumMonto,
                    aCredito: Boolean(input.aCredito),
                });
                router.refresh();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error al procesar el registro de la compra.');
        },
    });

    const isPending = status === 'executing';

    const onSubmit = (data: ReabastecerValues) => {
        execute(data);
    };

    const handleResetOrder = () => {
        setLastPurchaseSummary(null);
        reset({
            sucursalId: sucursal.id,
            proveedorId: getValues('proveedorId') || defaultProveedorId,
            tipoComprobanteId: defaultTipoComprobanteId,
            numeroComprobante: '',
            fechaComprobante: getTodayIsoDate(),
            aCredito: false,
            numeroDiasCredito: undefined,
            motivo: '',
            items: [],
        });
    };

    const catalogPreviewList =
        searchQuery.trim() !== '' || onlyLowStock
            ? filteredCatalog.slice(0, 8)
            : productosDisponibles.slice(0, 5);

    return (
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Cabecera y contexto operativo compacto */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground transition-colors">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/dashboard/inventario" className="hover:text-foreground transition-colors">
                            Inventario
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Ingreso de Compra</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/dashboard/inventario"
                            className={buttonVariants({
                                variant: 'ghost',
                                size: 'icon-sm',
                                className: 'size-8 text-muted-foreground hover:text-foreground cursor-pointer',
                            })}
                            title="Volver al Inventario"
                        >
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                Registro de Compra y Reabastecimiento
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Ingresa uno o varios productos a almacén, registra el comprobante del proveedor y controla el egreso en caja.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estado compacto de Sede y Caja */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
                        <StoreIcon className="size-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">{sucursal.nombre}</span>
                        {sucursal.codigo && (
                            <span className="font-mono text-[11px] text-muted-foreground">
                                ({sucursal.codigo})
                            </span>
                        )}
                        {canChangeSucursal && (
                            <Link
                                href="/dashboard/inventario/reabastecer"
                                className="ml-1 text-[11px] font-medium text-primary hover:underline"
                            >
                                Cambiar
                            </Link>
                        )}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-xs">
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-medium text-foreground">
                            Caja abierta · {caja.usuario?.name || 'Operador'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Banner de confirmación tras registrar una compra */}
            {lastPurchaseSummary && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-foreground">
                                Compra registrada e inventario actualizado
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Ingresaron{' '}
                                <strong className="text-foreground font-mono">
                                    {lastPurchaseSummary.totalUnidades} unid.
                                </strong>{' '}
                                en{' '}
                                <strong className="text-foreground">
                                    {lastPurchaseSummary.totalProductos}{' '}
                                    {lastPurchaseSummary.totalProductos === 1 ? 'producto' : 'productos'}
                                </strong>{' '}
                                por{' '}
                                <strong className="text-foreground font-mono">
                                    S/ {lastPurchaseSummary.montoTotal.toFixed(2)}
                                </strong>{' '}
                                ({lastPurchaseSummary.aCredito ? 'A crédito · sin egreso de caja' : 'Al contado · egreso registrado en caja'}).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetOrder}
                            className="text-xs gap-1.5 cursor-pointer flex-1 sm:flex-initial"
                        >
                            <RotateCcwIcon className="size-3.5" />
                            Nueva compra
                        </Button>
                        <Link
                            href="/dashboard/inventario"
                            className={buttonVariants({
                                size: 'sm',
                                className: 'text-xs cursor-pointer flex-1 sm:flex-initial',
                            })}
                        >
                            Ir a Inventario
                        </Link>
                    </div>
                </div>
            )}

            {/* Formulario principal en 2 columnas: Izquierda = Productos, Derecha = Comprobante, Pago y Resumen */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <input type="hidden" {...register('sucursalId')} />

                {/* COLUMNA IZQUIERDA (8 cols): Selección y Detalle de Productos */}
                <div className="lg:col-span-8 space-y-5">
                    {/* Buscador para agregar múltiples productos */}
                    <Card className="border shadow-2xs">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <SearchIcon className="size-4 text-primary" />
                                        Agregar Productos a la Compra
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Busca por nombre, SKU / código de barras o marca. Presiona Enter para agregar por código exacto.
                                    </CardDescription>
                                </div>

                                {lowStockCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setOnlyLowStock((prev) => !prev)}
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto',
                                            onlyLowStock
                                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <AlertTriangleIcon className="size-3.5 text-amber-500" />
                                        <span>Stock bajo / agotado ({lowStockCount})</span>
                                    </button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-0">
                            <div className="relative">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    disabled={isPending}
                                    placeholder="Buscar producto por nombre, código SKU o marca..."
                                    className="pl-9 pr-9 h-10 text-xs"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <XIcon className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Resultados rápidos del catálogo */}
                            <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-y-auto bg-background">
                                {catalogPreviewList.length === 0 ? (
                                    <div className="p-5 text-center text-xs text-muted-foreground">
                                        No se encontraron productos con ese criterio en el catálogo.
                                    </div>
                                ) : (
                                    catalogPreviewList.map((prod) => {
                                        const stockInfo = stocksByProductId.get(prod.id);
                                        const currentQty = stockInfo?.cantidad ?? 0;
                                        const minQty = stockInfo?.stockMinimo ?? 5;
                                        const addedIdx = addedProductIds.get(prod.id);
                                        const isAdded = addedIdx !== undefined;
                                        const thumb = prod.imagenes?.[0]?.url;

                                        return (
                                            <div
                                                key={prod.id}
                                                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/40 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="relative size-9 rounded-md overflow-hidden border border-border/80 bg-muted/30 shrink-0 flex items-center justify-center">
                                                        {thumb ? (
                                                            <Image
                                                                src={thumb}
                                                                alt={prod.name}
                                                                fill
                                                                sizes="36px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <PackageIcon className="size-4 text-muted-foreground/60" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-foreground truncate">
                                                            {prod.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                            <span className="font-mono">{prod.codigo}</span>
                                                            <span>·</span>
                                                            <span
                                                                className={cn(
                                                                    'font-mono font-medium',
                                                                    currentQty === 0
                                                                        ? 'text-destructive'
                                                                        : currentQty <= minQty
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-muted-foreground'
                                                                )}
                                                            >
                                                                Stock: {currentQty} {prod.unidad?.abreviatura || 'unid'}
                                                            </span>
                                                            <span>·</span>
                                                            <span className="font-mono">
                                                                Costo: S/ {Number(prod.precioCompra || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant={isAdded ? 'secondary' : 'outline'}
                                                    size="sm"
                                                    disabled={isPending}
                                                    onClick={() => handleAddProductToOrder(prod)}
                                                    className="h-8 px-2.5 text-xs gap-1 shrink-0 cursor-pointer"
                                                >
                                                    <PlusIcon className="size-3.5" />
                                                    <span>{isAdded ? 'Sumar +1' : 'Agregar'}</span>
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla editable de Productos de la Compra */}
                    <Card className="border shadow-2xs overflow-hidden">
                        <CardHeader className="border-b pb-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <BoxesIcon className="size-4 text-primary" />
                                    <CardTitle className="text-sm font-bold">
                                        Productos a Ingresar ({fields.length})
                                    </CardTitle>
                                </div>
                                {fields.length > 0 && (
                                    <span className="text-xs font-mono text-muted-foreground">
                                        Total físico: <strong className="text-foreground">+{totalUnidades} unid.</strong>
                                    </span>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {fields.length === 0 ? (
                                <div className="py-12 px-6 text-center space-y-2">
                                    <div className="mx-auto size-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
                                        <PackagePlusIcon className="size-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Aún no has agregado productos a la compra
                                    </p>
                                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                        Usa el buscador superior para seleccionar uno o más artículos del catálogo e indicar las unidades recibidas y su costo de adquisición.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {/* Encabezado de columnas en escritorio */}
                                    <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-4 py-2.5 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        <div className="col-span-5">Producto / Proyección Stock</div>
                                        <div className="col-span-3 text-center">Cantidad</div>
                                        <div className="col-span-2 text-right">Costo Unit. (S/)</div>
                                        <div className="col-span-2 text-right">Subtotal</div>
                                    </div>

                                    {fields.map((field, index) => {
                                        const itemWatch = watchedItems[index];
                                        const prodId = itemWatch?.productoId || field.productoId;
                                        const prod = productsById.get(prodId);
                                        const stockRow = stocksByProductId.get(prodId);
                                        const stockPrevio = stockRow?.cantidad ?? 0;
                                        const rowQty = Number(itemWatch?.cantidad) || 0;
                                        const rowCost = Number(itemWatch?.costoUnitario) || 0;
                                        const stockNuevo = stockPrevio + (rowQty > 0 ? rowQty : 0);
                                        const rowSubtotal = (rowQty > 0 ? rowQty : 0) * (rowCost >= 0 ? rowCost : 0);
                                        const thumb = prod?.imagenes?.[0]?.url;
                                        const unitLabel = prod?.unidad?.abreviatura || 'unid';
                                        const costExceedsSale =
                                            prod && prod.precioVenta > 0 && rowCost > prod.precioVenta;

                                        const qtyError = errors.items?.[index]?.cantidad?.message;
                                        const costError = errors.items?.[index]?.costoUnitario?.message;

                                        return (
                                            <div
                                                key={field.id}
                                                className="p-4 sm:px-4 sm:py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-center hover:bg-muted/15 transition-colors"
                                            >
                                                <input
                                                    type="hidden"
                                                    {...register(`items.${index}.productoId`)}
                                                />

                                                {/* Producto + Proyección de stock */}
                                                <div className="sm:col-span-5 flex items-start gap-3 min-w-0">
                                                    <div className="relative size-11 rounded-lg overflow-hidden border border-border bg-muted/30 shrink-0 flex items-center justify-center">
                                                        {thumb ? (
                                                            <Image
                                                                src={thumb}
                                                                alt={prod?.name || 'Producto'}
                                                                fill
                                                                sizes="44px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <PackageIcon className="size-5 text-muted-foreground/60" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <p
                                                            className="text-xs font-bold text-foreground truncate"
                                                            title={prod?.name}
                                                        >
                                                            {prod?.name || 'Producto seleccionado'}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                                                            <span className="font-mono">{prod?.codigo}</span>
                                                            {prod?.precioVenta !== undefined && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="font-mono">
                                                                        P. Venta: S/ {Number(prod.precioVenta).toFixed(2)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">
                                                            <span>Stock: {stockPrevio}</span>
                                                            <ArrowRightIcon className="size-3 text-primary" />
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                                {stockNuevo} {unitLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cantidad con Stepper */}
                                                <div className="sm:col-span-3 space-y-1">
                                                    <Label className="sm:hidden text-[11px] text-muted-foreground">
                                                        Cantidad ({unitLabel})
                                                    </Label>
                                                    <div className="flex items-center justify-start sm:justify-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon-sm"
                                                            disabled={rowQty <= 1 || isPending}
                                                            onClick={() => handleQuantityStep(index, -1)}
                                                            className="size-8 shrink-0 cursor-pointer"
                                                        >
                                                            <MinusIcon className="size-3.5" />
                                                        </Button>

                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            step={1}
                                                            disabled={isPending}
                                                            {...register(`items.${index}.cantidad`, {
                                                                valueAsNumber: true,
                                                                setValueAs: (v) =>
                                                                    v === '' || Number.isNaN(Number(v))
                                                                        ? 0
                                                                        : parseInt(String(v), 10),
                                                            })}
                                                            className={cn(
                                                                'h-8 w-16 px-1.5 text-center font-mono text-xs font-bold tabular-nums',
                                                                qtyError &&
                                                                    'border-destructive focus-visible:ring-destructive'
                                                            )}
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon-sm"
                                                            disabled={isPending}
                                                            onClick={() => handleQuantityStep(index, 1)}
                                                            className="size-8 shrink-0 cursor-pointer"
                                                        >
                                                            <PlusIcon className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                    {qtyError && (
                                                        <p className="text-[11px] text-destructive text-center">
                                                            {qtyError}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Costo Unitario */}
                                                <div className="sm:col-span-2 space-y-1">
                                                    <Label className="sm:hidden text-[11px] text-muted-foreground">
                                                        Costo Unitario (S/)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        disabled={isPending}
                                                        placeholder="0.00"
                                                        {...register(`items.${index}.costoUnitario`, {
                                                            valueAsNumber: true,
                                                            setValueAs: (v) =>
                                                                v === '' || Number.isNaN(Number(v))
                                                                    ? 0
                                                                    : parseFloat(String(v)),
                                                        })}
                                                        className={cn(
                                                            'h-8 text-right font-mono text-xs tabular-nums px-2',
                                                            costError &&
                                                                'border-destructive focus-visible:ring-destructive'
                                                        )}
                                                    />
                                                    {costExceedsSale && (
                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-right leading-tight">
                                                            Mayor a P. Venta
                                                        </p>
                                                    )}
                                                    {costError && (
                                                        <p className="text-[11px] text-destructive text-right">
                                                            {costError}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Subtotal y Eliminar */}
                                                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                                    <span className="sm:hidden text-xs text-muted-foreground">
                                                        Subtotal:
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                                                            S/ {rowSubtotal.toFixed(2)}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            disabled={isPending}
                                                            onClick={() => remove(index)}
                                                            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                                                            title="Quitar producto de la lista"
                                                        >
                                                            <Trash2Icon className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pie de tabla con totales parciales */}
                                    <div className="px-4 py-3 bg-muted/25 flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {fields.length}{' '}
                                            {fields.length === 1 ? 'ítem registrado' : 'ítems registrados'} ·{' '}
                                            <strong className="text-foreground font-mono">
                                                {totalUnidades} unidades
                                            </strong>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground font-medium">
                                                Importe Total:
                                            </span>
                                            <span className="font-mono text-base font-extrabold text-foreground tabular-nums">
                                                S/ {montoTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error general del arreglo items */}
                            {(errors.items?.message || errors.items?.root?.message) && (
                                <div className="m-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2">
                                    <AlertCircleIcon className="size-4 shrink-0" />
                                    <span>
                                        {errors.items?.message || errors.items?.root?.message}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMNA DERECHA (4 cols): Proveedor, Comprobante, Compra a Crédito y Liquidación */}
                <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
                    <Card className="border shadow-2xs">
                        <CardHeader className="border-b pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <ReceiptIcon className="size-4 text-primary" />
                                Datos de la Compra y Pago
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Respaldo documentario, proveedor y modalidad de pago.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-4">
                            {/* 1. Proveedor + Modal Nuevo Proveedor */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="proveedor-select"
                                        className="text-xs font-bold text-foreground flex items-center gap-1.5"
                                    >
                                        <TruckIcon className="size-3.5 text-muted-foreground" />
                                        <span>
                                            Proveedor <span className="text-destructive">*</span>
                                        </span>
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalProveedorOpen(true)}
                                        className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                    >
                                        <PlusIcon className="size-3" />
                                        <span>Nuevo Proveedor</span>
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        id="proveedor-select"
                                        {...register('proveedorId')}
                                        disabled={isPending}
                                        className={cn(
                                            'flex-1 text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer h-9',
                                            errors.proveedorId &&
                                                'border-destructive focus-visible:ring-destructive'
                                        )}
                                    >
                                        <option value="">-- Selecciona un proveedor --</option>
                                        {proveedoresList.map((prov) => (
                                            <option key={prov.id} value={prov.id}>
                                                {prov.razonSocial || prov.nombre}{' '}
                                                {prov.numeroDocumento ? `(${prov.numeroDocumento})` : ''}
                                            </option>
                                        ))}
                                    </select>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => setIsModalProveedorOpen(true)}
                                        disabled={isPending}
                                        className="size-9 shrink-0 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                                        title="Registrar nuevo proveedor"
                                    >
                                        <PlusIcon className="size-4" />
                                    </Button>
                                </div>

                                {errors.proveedorId && (
                                    <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                                        <AlertCircleIcon className="size-3.5 shrink-0" />
                                        {errors.proveedorId.message}
                                    </p>
                                )}
                            </div>

                            {/* 2. Tipo de Comprobante y Fecha */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="tipo-comprobante-select"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        Tipo Comprobante <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        id="tipo-comprobante-select"
                                        disabled={isPending}
                                        {...register('tipoComprobanteId', {
                                            onChange: (e) =>
                                                handleTipoComprobanteChange(e.target.value),
                                        })}
                                        className={cn(
                                            'w-full text-xs rounded-md border border-input bg-background px-2.5 py-2 text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer h-9',
                                            errors.tipoComprobanteId &&
                                                'border-destructive focus-visible:ring-destructive'
                                        )}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {tiposComprobante.map((tc) => (
                                            <option key={tc.id} value={tc.id}>
                                                {tc.nombre} ({tc.serie})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.tipoComprobanteId && (
                                        <p className="text-[11px] text-destructive">
                                            {errors.tipoComprobanteId.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="fecha-comprobante-input"
                                        className="text-xs font-bold text-foreground flex items-center gap-1"
                                    >
                                        <CalendarIcon className="size-3 text-muted-foreground" />
                                        <span>Fecha Comprobante</span>
                                    </Label>
                                    <Input
                                        id="fecha-comprobante-input"
                                        type="date"
                                        disabled={isPending}
                                        {...register('fechaComprobante')}
                                        className="h-9 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            {/* 3. Número de Comprobante */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="comprobante-input"
                                        className="text-xs font-bold text-foreground"
                                    >
                                        N° Comprobante <span className="text-destructive">*</span>
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setValue('numeroComprobante', 'S/N', {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                            })
                                        }
                                        className="text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        Usar S/N
                                    </button>
                                </div>
                                <Input
                                    id="comprobante-input"
                                    type="text"
                                    disabled={isPending}
                                    {...register('numeroComprobante')}
                                    placeholder={`Ej: ${selectedTipoComprobante?.serie || 'F001'}-002847`}
                                    className={cn(
                                        'h-9 text-xs font-mono',
                                        errors.numeroComprobante &&
                                            'border-destructive focus-visible:ring-destructive'
                                    )}
                                />
                                {errors.numeroComprobante && (
                                    <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                                        <AlertCircleIcon className="size-3.5 shrink-0" />
                                        {errors.numeroComprobante.message}
                                    </p>
                                )}
                            </div>

                            {/* 4. Compra a Crédito (Booleano: controla si genera egreso en caja o no) */}
                            <div
                                className={cn(
                                    'rounded-xl border p-3.5 space-y-3 transition-colors',
                                    watchedACredito
                                        ? 'border-amber-500/35 bg-amber-500/5'
                                        : 'border-border bg-muted/20'
                                )}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                        <Label
                                            htmlFor="a-credito-switch"
                                            className="text-xs font-bold text-foreground cursor-pointer"
                                        >
                                            Compra a Crédito
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground">
                                            {watchedACredito
                                                ? 'Pago diferido al proveedor'
                                                : 'Pago inmediato con fondos de caja'}
                                        </p>
                                    </div>

                                    <Controller
                                        control={control}
                                        name="aCredito"
                                        render={({ field }) => (
                                            <Switch
                                                id="a-credito-switch"
                                                checked={Boolean(field.value)}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    if (
                                                        checked &&
                                                        !getValues('numeroDiasCredito')
                                                    ) {
                                                        setValue('numeroDiasCredito', 30, {
                                                            shouldValidate: true,
                                                        });
                                                    }
                                                }}
                                                disabled={isPending}
                                            />
                                        )}
                                    />
                                </div>

                                {watchedACredito ? (
                                    <div className="space-y-2.5 pt-2 border-t border-amber-500/20">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="dias-credito-input"
                                                    className="text-xs font-semibold text-foreground flex items-center gap-1"
                                                >
                                                    <ClockIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                                                    <span>Plazo de crédito (días)</span>
                                                </Label>
                                                {dueDatePreview && (
                                                    <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                                                        Vence: {dueDatePreview}
                                                    </span>
                                                )}
                                            </div>
                                            <Input
                                                id="dias-credito-input"
                                                type="number"
                                                min={1}
                                                step={1}
                                                disabled={isPending}
                                                placeholder="Ej: 30"
                                                {...register('numeroDiasCredito')}
                                                className="h-8 text-xs font-mono bg-background"
                                            />
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {[7, 15, 30, 60, 90].map((dias) => (
                                                    <button
                                                        key={dias}
                                                        type="button"
                                                        onClick={() =>
                                                            setValue('numeroDiasCredito', dias, {
                                                                shouldValidate: true,
                                                            })
                                                        }
                                                        className={cn(
                                                            'text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer',
                                                            Number(watchedDiasCredito) === dias
                                                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold'
                                                                : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                                        )}
                                                    >
                                                        {dias}d
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.numeroDiasCredito && (
                                                <p className="text-[11px] text-destructive">
                                                    {errors.numeroDiasCredito.message}
                                                </p>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                                            <strong>Sin egreso en caja:</strong> La mercadería ingresará al stock y la compra quedará con estado <strong>Pendiente</strong> sin descontar efectivo de la caja abierta.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/60 leading-snug">
                                        <strong className="text-foreground">Con egreso en caja:</strong> Se registrará una salida por compras de{' '}
                                        <strong className="font-mono text-foreground">
                                            S/ {montoTotal.toFixed(2)}
                                        </strong>{' '}
                                        en la caja abierta actual y la compra quedará como <strong>Pagada</strong>.
                                    </p>
                                )}
                            </div>

                            {/* 5. Observaciones / Motivo */}
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="motivo-input"
                                    className="text-xs font-bold text-foreground"
                                >
                                    Nota u Observación (Opcional)
                                </Label>
                                <Input
                                    id="motivo-input"
                                    type="text"
                                    disabled={isPending}
                                    {...register('motivo')}
                                    placeholder="Ej: Reposición quincenal, lote mayorista"
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* 6. Liquidación final y botón de confirmación */}
                            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Artículos distintos:</span>
                                    <span className="font-mono font-semibold text-foreground">
                                        {fields.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Total unidades a ingresar:</span>
                                    <span className="font-mono font-semibold text-foreground">
                                        +{totalUnidades} unid.
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Impacto en caja actual:</span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-[10px] py-0 font-mono',
                                            watchedACredito
                                                ? 'border-amber-500/30 text-amber-700 dark:text-amber-300'
                                                : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                        )}
                                    >
                                        {watchedACredito
                                            ? 'S/ 0.00 (Crédito)'
                                            : `- S/ ${montoTotal.toFixed(2)} (Egreso)`}
                                    </Badge>
                                </div>
                                <div className="border-t border-border pt-2 flex items-center justify-between">
                                    <span className="font-bold text-foreground">Total Compra:</span>
                                    <span className="font-mono text-lg font-extrabold text-foreground tabular-nums">
                                        S/ {montoTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    type="submit"
                                    disabled={isPending || fields.length === 0}
                                    className="w-full h-10 text-xs font-semibold gap-2 shadow-xs cursor-pointer"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2Icon className="size-4 animate-spin" />
                                            Registrando compra e inventario...
                                        </>
                                    ) : (
                                        <>
                                            <PackagePlusIcon className="size-4" />
                                            Registrar Compra e Ingresar Stock
                                        </>
                                    )}
                                </Button>

                                <Link
                                    href="/dashboard/inventario"
                                    className={buttonVariants({
                                        variant: 'outline',
                                        className: 'w-full h-9 text-xs cursor-pointer',
                                    })}
                                >
                                    Cancelar
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>

            {/* Modal para registrar un nuevo proveedor al vuelo */}
            <ModalNuevoProveedor
                isOpen={isModalProveedorOpen}
                onClose={() => setIsModalProveedorOpen(false)}
                onSuccess={handleProveedorCreated}
                tipoDocumentos={tipoDocumentos}
            />
        </div>
    );
}
