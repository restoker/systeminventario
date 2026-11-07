'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
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
    CheckIcon,
    CopyIcon,
    Loader2Icon,
    BoxesIcon,
    ReceiptIcon,
    TruckIcon,
    TrendingUpIcon,
    AlertTriangleIcon,
    AlertCircleIcon,
    CheckCircle2Icon,
    CoinsIcon,
    InfoIcon,
    RotateCcwIcon
} from 'lucide-react';
import { Sucursal, TipoDocumentoDto } from '@/interfaces';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { reabastecerSchema, ReabastecerValues, ReabastecerInput } from '@/types/reabastecer-schema';
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
    stockActual: StockSucursalItem | null;
    proveedores: ProveedorItem[];
    tipoDocumentos?: TipoDocumentoDto[];
    productosDisponibles: FormProductItem[];
    canChangeSucursal: boolean;
}

export default function FormReabastecer({
    sucursal,
    sucursales,
    caja,
    productoInicial,
    stockActual,
    proveedores,
    tipoDocumentos = [],
    productosDisponibles,
    canChangeSucursal,
}: FormReabastecerProps) {
    const router = useRouter();

    const initialProductId = productoInicial?.id || productosDisponibles[0]?.id || '';
    const initialProduct = productoInicial || productosDisponibles[0];

    const [copiedCode, setCopiedCode] = useState(false);
    const [isSuccessModal, setIsSuccessModal] = useState(false);
    const [lastRestockedQty, setLastRestockedQty] = useState<number>(0);
    const [isModalProveedorOpen, setIsModalProveedorOpen] = useState(false);
    const [proveedoresList, setProveedoresList] = useState<ProveedorItem[]>(proveedores);

    // Mantener la lista sincronizada si la prop proveedores cambia
    useEffect(() => {
        setProveedoresList(proveedores);
    }, [proveedores]);

    // 1. Inicialización de React Hook Form con Zod Resolver
    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors }
    } = useForm<ReabastecerInput, unknown, ReabastecerValues>({
        resolver: zodResolver(reabastecerSchema),
        defaultValues: {
            productoId: initialProductId,
            sucursalId: sucursal.id,
            cantidad: 10,
            costoUnitario: (initialProduct?.precioCompra ?? 0) > 0 ? (initialProduct?.precioCompra ?? 0) : undefined,
            proveedorId: initialProduct?.proveedorId || (proveedores[0]?.id || ''),
            numeroComprobante: '',
            motivo: 'Reabastecimiento regular de existencias',
        }
    });

    // 2. Observadores en tiempo real (useWatch) para cálculos dinámicos
    const watchedProductoId = useWatch({ control, name: 'productoId' }) || initialProductId;
    const watchedCantidad = useWatch({ control, name: 'cantidad' }) ?? 10;
    const watchedCostoUnitario = useWatch({ control, name: 'costoUnitario' });

    // Referencia al producto activo seleccionado
    const currentProduct = useMemo(() => {
        return productosDisponibles.find((p) => p.id === watchedProductoId) || productoInicial || productosDisponibles[0];
    }, [watchedProductoId, productoInicial, productosDisponibles]);

    // Cuando cambia el producto seleccionado en el dropdown
    const handleProductChange = (newProductId: string) => {
        setValue('productoId', newProductId, { shouldValidate: true });
        const product = productosDisponibles.find((p) => p.id === newProductId);
        if (product) {
            if (product.precioCompra !== null && product.precioCompra !== undefined && product.precioCompra > 0) {
                setValue('costoUnitario', product.precioCompra, { shouldValidate: true });
            }
            if (product.proveedorId) {
                setValue('proveedorId', product.proveedorId, { shouldValidate: true });
            }
        }
    };

    // Cálculos numéricos y de inventario
    const numCostoUnitario = Number(watchedCostoUnitario) || 0;
    const numCantidad = Number(watchedCantidad) || 0;
    const totalInversion = useMemo(() => {
        return (numCantidad * numCostoUnitario);
    }, [numCantidad, numCostoUnitario]);

    const currentStockUnits = stockActual && stockActual.productoId === currentProduct?.id
        ? stockActual.cantidad
        : 0;
    const stockMinimo = stockActual?.stockMinimo ?? 5;
    const projectedStock = currentStockUnits + (numCantidad > 0 ? numCantidad : 0);

    const profitMargin = useMemo(() => {
        if (!currentProduct || !currentProduct.precioVenta || numCostoUnitario <= 0) return null;
        const margin = ((currentProduct.precioVenta - numCostoUnitario) / currentProduct.precioVenta) * 100;
        return margin;
    }, [currentProduct, numCostoUnitario]);

    // 3. Integración con Server Action (next-safe-action)
    const { execute, status } = useAction(reabastecerAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Stock reabastecido con éxito');
                setLastRestockedQty(numCantidad);
                setIsSuccessModal(true);
                router.refresh();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error inesperado al procesar el reabastecimiento.');
        }
    });

    const isPending = status === 'executing';

    const handleCopyCode = () => {
        if (!currentProduct?.codigo) return;
        navigator.clipboard.writeText(currentProduct.codigo);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleQuantityDelta = (delta: number) => {
        const nextVal = Math.max(1, (numCantidad || 0) + delta);
        setValue('cantidad', nextVal, { shouldValidate: true, shouldDirty: true });
    };

    const handleProveedorCreated = (newProveedor: ProveedorItem) => {
        setProveedoresList((prev) => [newProveedor, ...prev.filter((p) => p.id !== newProveedor.id)]);
        setValue('proveedorId', newProveedor.id, { shouldValidate: true, shouldDirty: true });
        toast.success(`Proveedor "${newProveedor.razonSocial || newProveedor.nombre}" registrado y seleccionado.`);
    };

    const onSubmit = (data: ReabastecerValues) => {
        execute(data);
    };

    const handleResetForAnother = () => {
        setIsSuccessModal(false);
        reset({
            productoId: currentProduct?.id || initialProductId,
            sucursalId: sucursal.id,
            cantidad: 10,
            costoUnitario: (currentProduct?.precioCompra ?? 0) > 0 ? (currentProduct?.precioCompra ?? 0) : undefined,
            proveedorId: currentProduct?.proveedorId || '',
            numeroComprobante: '',
            motivo: 'Reabastecimiento regular de existencias',
        });
    };

    const productImage = currentProduct?.imagenes?.[0]?.url;

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/inventario" className="hover:underline">Inventario</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Reabastecer</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/dashboard/inventario"
                            className={buttonVariants({
                                variant: 'ghost',
                                size: 'icon-sm',
                                className: 'size-8 text-muted-foreground hover:text-foreground cursor-pointer'
                            })}
                            title="Volver al Inventario"
                        >
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <PackagePlusIcon className="size-6 text-primary" />
                                Reabastecimiento de Inventario
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Ingreso formal de mercadería, ajuste de existencias y registro de compras.
                            </p>
                        </div>
                    </div>
                </div>

                <Link
                    href="/dashboard/inventario"
                    className={buttonVariants({
                        variant: 'outline',
                        size: 'sm',
                        className: 'gap-1.5 text-xs self-start sm:self-auto cursor-pointer'
                    })}
                >
                    <ArrowLeftIcon className="size-3.5" />
                    Volver a Inventario
                </Link>
            </div>

            {/* Context Header: Sucursal & Caja Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Sucursal Card */}
                <div className="rounded-xl border bg-card p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <StoreIcon className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                                    Sucursal Destino
                                </span>
                                {sucursal.codigo && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                                        {sucursal.codigo}
                                    </Badge>
                                )}
                            </div>
                            <h3 className="text-sm font-bold text-foreground leading-snug">
                                {sucursal.nombre}
                            </h3>
                            {sucursal.direccion && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                    {sucursal.direccion}
                                </p>
                            )}
                        </div>
                    </div>

                    {canChangeSucursal && (
                        <Link
                            href="/dashboard/inventario/reabastecer"
                            className={buttonVariants({
                                variant: 'ghost',
                                size: 'sm',
                                className: 'text-xs text-primary hover:text-primary hover:bg-primary/10 cursor-pointer shrink-0'
                            })}
                        >
                            Cambiar sede
                        </Link>
                    )}
                </div>

                {/* Caja Status Card */}
                <div className="rounded-xl border bg-card p-4 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <WalletIcon className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex size-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    Caja Abierta y Operativa
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                                Operador: {caja.usuario?.name || 'Administración'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Apertura: {caja.fechaApertura ? new Date(caja.fechaApertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                            </p>
                        </div>
                    </div>

                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs gap-1 font-medium">
                        <CheckCircle2Icon className="size-3 text-emerald-500" />
                        Habilitado
                    </Badge>
                </div>
            </div>

            {/* Success Notification Banner (After Restocking) */}
            {isSuccessModal && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-start gap-3">
                        <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-600 shrink-0 mt-0.5 sm:mt-0">
                            <CheckCircle2Icon className="size-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground">
                                ¡Reabastecimiento completado con éxito!
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Se agregaron <strong className="text-foreground">{lastRestockedQty} unidades</strong> de{' '}
                                <strong className="text-foreground">{currentProduct?.name}</strong> al stock de {sucursal.nombre}.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResetForAnother}
                            className="text-xs gap-1.5 cursor-pointer w-full sm:w-auto"
                        >
                            <RotateCcwIcon className="size-3.5" />
                            Reabastecer de nuevo
                        </Button>
                        <Link
                            href="/dashboard/inventario"
                            className={buttonVariants({
                                size: 'sm',
                                className: 'text-xs cursor-pointer w-full sm:w-auto'
                            })}
                        >
                            Ver en Inventario
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Restock Layout: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Product Info & Projections (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                    {/* Product Selection / Preview Card */}
                    <Card className="border shadow-2xs">
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BoxesIcon className="size-4 text-primary" />
                                    Producto a Reabastecer
                                </CardTitle>
                                {currentProduct && (
                                    <Badge variant="outline" className="text-[11px] font-normal">
                                        {currentProduct.unidad?.nombre || 'Unidades'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-4">
                            {/* Product Selector if user wants to change product */}
                            {productosDisponibles.length > 1 && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="product-select" className="text-xs font-semibold text-muted-foreground">
                                        Seleccionar o cambiar producto:
                                    </Label>
                                    <select
                                        id="product-select"
                                        value={watchedProductoId}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                        className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                    >
                                        {productosDisponibles.map((prod) => (
                                            <option key={prod.id} value={prod.id}>
                                                {prod.name} ({prod.codigo})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.productoId && (
                                        <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
                                            <AlertCircleIcon className="size-3 shrink-0" />
                                            {errors.productoId.message}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Product Visual Card */}
                            {currentProduct ? (
                                <div className="space-y-3.5">
                                    <div className="flex items-start gap-3.5">
                                        {/* Thumbnail with fallback */}
                                        <div className="relative size-16 rounded-xl overflow-hidden border bg-muted/30 shrink-0 flex items-center justify-center">
                                            {productImage ? (
                                                <Image
                                                    src={productImage}
                                                    alt={currentProduct.name}
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <PackageIcon className="size-7 text-muted-foreground/60 stroke-[1.5]" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-1">
                                            <h4 className="text-sm font-bold text-foreground leading-tight">
                                                {currentProduct.name}
                                            </h4>

                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge
                                                    variant="secondary"
                                                    className="font-mono text-[11px] py-0 px-1.5 gap-1 text-muted-foreground cursor-pointer hover:bg-muted"
                                                    onClick={handleCopyCode}
                                                    title="Copiar código de barras"
                                                >
                                                    {currentProduct.codigo}
                                                    {copiedCode ? (
                                                        <CheckIcon className="size-3 text-emerald-600" />
                                                    ) : (
                                                        <CopyIcon className="size-3 text-muted-foreground" />
                                                    )}
                                                </Badge>

                                                {currentProduct.categoria && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        • {currentProduct.categoria.nombre}
                                                    </span>
                                                )}
                                                {currentProduct.marca && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        • {currentProduct.marca.nombre}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Status Bar */}
                                    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground font-medium">Stock actual en sede:</span>
                                            <span className="font-mono font-bold text-sm text-foreground">
                                                {currentStockUnits} {currentProduct.unidad?.abreviatura || 'unid'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Stock mínimo configurado:</span>
                                            <span className="font-mono text-muted-foreground text-xs">
                                                {stockMinimo} {currentProduct.unidad?.abreviatura || 'unid'}
                                            </span>
                                        </div>

                                        <div className="pt-1 flex items-center justify-between border-t border-border/50">
                                            <span className="text-[11px] text-muted-foreground">Condición:</span>
                                            {currentStockUnits === 0 ? (
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] py-0">
                                                    Agotado
                                                </Badge>
                                            ) : currentStockUnits <= stockMinimo ? (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] py-0">
                                                    Stock Bajo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0">
                                                    En Stock
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Commercial Price Details */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg border p-2.5 bg-card">
                                            <span className="text-muted-foreground text-[11px] block">Precio de Venta</span>
                                            <span className="text-sm font-bold font-mono text-foreground">
                                                S/ {Number(currentProduct.precioVenta || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="rounded-lg border p-2.5 bg-card">
                                            <span className="text-muted-foreground text-[11px] block">Costo en Catálogo</span>
                                            <span className="text-sm font-bold font-mono text-foreground">
                                                S/ {Number(currentProduct.precioCompra || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground text-xs">
                                    No hay un producto seleccionado.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock Projection Live Card */}
                    <Card className="border border-primary/20 bg-primary/5 shadow-2xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                                <TrendingUpIcon className="size-3.5" />
                                Proyección de Inventario
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-1 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Existencias previas:</span>
                                <span className="font-mono font-medium text-foreground">{currentStockUnits} unidades</span>
                            </div>
                            <div className="flex items-center justify-between text-primary font-medium">
                                <span>+ Ingreso a registrar:</span>
                                <span className="font-mono font-bold">+{numCantidad} unidades</span>
                            </div>
                            <div className="border-t border-primary/20 pt-2 flex items-center justify-between">
                                <span className="font-semibold text-foreground">Nuevo Stock Resultante:</span>
                                <span className="font-mono text-base font-extrabold bg-primary/10 px-2 py-0.5 rounded-md text-primary">
                                    {projectedStock} unidades
                                </span>
                            </div>

                            {profitMargin !== null && (
                                <div className="rounded-md bg-background/80 border p-2 flex items-center justify-between mt-2">
                                    <span className="text-[11px] text-muted-foreground">Margen comercial proyectado:</span>
                                    <span className={`font-mono text-xs font-bold ${profitMargin >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                                        {profitMargin.toFixed(1)}%
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Restock Input Form (7 cols) */}
                <div className="lg:col-span-7">
                    <Card className="border shadow-2xs">
                        <CardHeader className="border-b pb-4">
                            <div className="flex items-center gap-2">
                                <ReceiptIcon className="size-4 text-primary" />
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground">
                                        Datos del Ingreso de Mercadería
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Completa la cantidad de unidades físicas e información del comprobante de compra.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {/* Campos ocultos para mantener el schema íntegro */}
                                <input type="hidden" {...register('sucursalId')} />
                                <input type="hidden" {...register('productoId')} />

                                {/* 1. Cantidad a Ingresar (Stepper + Quick Chips + Validación) */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="cantidad-input" className="text-xs font-bold text-foreground">
                                            Cantidad de Unidades a Reabastecer <span className="text-destructive">*</span>
                                        </Label>
                                        <span className="text-xs text-muted-foreground">
                                            Mínimo 1 unidad
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleQuantityDelta(-1)}
                                            disabled={numCantidad <= 1 || isPending}
                                            className="size-10 cursor-pointer shrink-0"
                                        >
                                            <MinusIcon className="size-4" />
                                        </Button>

                                        <Input
                                            id="cantidad-input"
                                            type="number"
                                            min={1}
                                            step={1}
                                            {...register('cantidad', {
                                                valueAsNumber: true,
                                                setValueAs: (v) => (v === '' || isNaN(v) ? 0 : parseInt(v, 10))
                                            })}
                                            disabled={isPending}
                                            className={cn(
                                                "h-10 text-center font-mono text-lg font-bold",
                                                errors.cantidad && "border-destructive focus-visible:ring-destructive"
                                            )}
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleQuantityDelta(1)}
                                            disabled={isPending}
                                            className="size-10 cursor-pointer shrink-0"
                                        >
                                            <PlusIcon className="size-4" />
                                        </Button>
                                    </div>

                                    {/* Mensaje de error de validación para cantidad */}
                                    {errors.cantidad && (
                                        <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
                                            <AlertCircleIcon className="size-3.5 shrink-0" />
                                            {errors.cantidad.message}
                                        </p>
                                    )}

                                    {/* Quick Increment Chips */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <span className="text-[11px] text-muted-foreground mr-1">Rápido:</span>
                                        {[+5, +10, +25, +50, +100].map((inc) => (
                                            <button
                                                key={inc}
                                                type="button"
                                                onClick={() => handleQuantityDelta(inc)}
                                                disabled={isPending}
                                                className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            >
                                                +{inc}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {/* 2. Costo Unitario de Compra */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="costo-input" className="text-xs font-bold text-foreground flex items-center justify-between">
                                            <span>Costo Unitario de Compra</span>
                                            <span className="font-normal text-muted-foreground text-[11px]">(S/.)</span>
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                                                S/
                                            </span>
                                            <Input
                                                id="costo-input"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                {...register('costoUnitario', {
                                                    valueAsNumber: true,
                                                    setValueAs: (v) => (v === '' || isNaN(v) ? undefined : parseFloat(v))
                                                })}
                                                disabled={isPending}
                                                className={cn(
                                                    "pl-8 font-mono text-sm h-10",
                                                    errors.costoUnitario && "border-destructive focus-visible:ring-destructive"
                                                )}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.costoUnitario && (
                                            <p className="text-xs text-destructive flex items-center gap-1 font-medium mt-1">
                                                <AlertCircleIcon className="size-3.5 shrink-0" />
                                                {errors.costoUnitario.message}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            Actualiza el precio de compra unitario en el catálogo maestro.
                                        </p>
                                    </div>

                                    {/* 3. Inversión Total Estimada */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-foreground">
                                            Inversión Total Estimada
                                        </Label>
                                        <div className="h-10 rounded-md border bg-muted/30 px-3 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Total compra:</span>
                                            <span className="font-mono text-base font-bold text-foreground">
                                                S/ {totalInversion.toFixed(2)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            {numCantidad} unid. × S/ {numCostoUnitario.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 4. Proveedor */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="proveedor-select" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <TruckIcon className="size-3.5 text-muted-foreground" />
                                                <span>Proveedor</span>
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
                                                className="flex-1 text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer h-10"
                                            >
                                                <option value="">-- Sin proveedor especificado --</option>
                                                {proveedoresList.map((prov) => (
                                                    <option key={prov.id} value={prov.id}>
                                                        {prov.razonSocial || prov.nombre} {prov.numeroDocumento ? `(${prov.numeroDocumento})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setIsModalProveedorOpen(true)}
                                                disabled={isPending}
                                                className="size-10 shrink-0 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                                                title="Registrar nuevo proveedor"
                                            >
                                                <PlusIcon className="size-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 5. Comprobante de Respaldo */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="comprobante-input" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <ReceiptIcon className="size-3.5 text-muted-foreground" />
                                            N° Comprobante / Guía
                                        </Label>
                                        <Input
                                            id="comprobante-input"
                                            type="text"
                                            {...register('numeroComprobante')}
                                            disabled={isPending}
                                            placeholder="Ej: F001-002847 o GR-012"
                                            className="h-10 text-xs font-mono"
                                        />
                                    </div>
                                </div>

                                {/* 6. Motivo u Observaciones */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="motivo-input" className="text-xs font-bold text-foreground">
                                        Motivo u Observación de la Operación
                                    </Label>
                                    <Input
                                        id="motivo-input"
                                        type="text"
                                        {...register('motivo')}
                                        disabled={isPending}
                                        placeholder="Ej: Reabastecimiento regular, reposición de quiebre de stock"
                                        className="h-10 text-xs"
                                    />
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        {['Compra directa', 'Reposición semanal', 'Ajuste de inventario'].map((sug) => (
                                            <button
                                                key={sug}
                                                type="button"
                                                onClick={() => setValue('motivo', sug, { shouldDirty: true })}
                                                className="text-[10px] text-muted-foreground hover:text-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/60 hover:bg-muted cursor-pointer transition-colors"
                                            >
                                                {sug}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary Box */}
                                <div className="rounded-xl border bg-muted/20 p-4 space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-foreground font-semibold">
                                        <InfoIcon className="size-4 text-primary shrink-0" />
                                        <span>Resumen de la Operación</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Al confirmar, se incrementará el stock físico de <strong>{currentProduct?.name}</strong> en{' '}
                                        <strong className="text-foreground">{numCantidad} unidades</strong> para la sucursal{' '}
                                        <strong className="text-foreground">{sucursal.nombre}</strong>. La caja abierta registrará la operación contable.
                                    </p>
                                </div>

                                {/* General Schema Errors Alert if any */}
                                {(errors.productoId || errors.sucursalId) && (
                                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                                        <AlertTriangleIcon className="size-4 shrink-0" />
                                        <span>
                                            {errors.productoId?.message || errors.sucursalId?.message}
                                        </span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                                    <Link
                                        href="/dashboard/inventario"
                                        className={buttonVariants({
                                            variant: 'outline',
                                            className: 'w-full sm:w-auto text-xs cursor-pointer'
                                        })}
                                    >
                                        Cancelar
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={isPending || numCantidad <= 0 || !currentProduct}
                                        className="w-full sm:w-auto text-xs font-semibold gap-2 shadow-sm cursor-pointer"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2Icon className="size-4 animate-spin" />
                                                Procesando ingreso...
                                            </>
                                        ) : (
                                            <>
                                                <PackagePlusIcon className="size-4" />
                                                Confirmar Reabastecimiento
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

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
