'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    XIcon,
    ShoppingCartIcon,
    PlusIcon,
    MinusIcon,
    PackageIcon,
    Building2Icon,
    CheckCircle2Icon,
    AlertTriangleIcon,
    XCircleIcon,
    CopyIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    FileTextIcon,
    InfoIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { PosStockItem } from './PosTerminal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModalDetalleProductoProps {
    item: PosStockItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (item: PosStockItem, quantity: number) => void;
    currentInCart?: number;
    sucursalNombre: string;
    isAdmin?: boolean;
}

export default function ModalDetalleProducto({
    item,
    isOpen,
    onClose,
    onAddToCart,
    currentInCart = 0,
    sucursalNombre,
    isAdmin = false,
}: ModalDetalleProductoProps) {
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
    const [selectedQty, setSelectedQty] = useState<number>(1);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);

    // Reset internal state when item changes
    useEffect(() => {
        if (item) {
            setActiveImageIndex(0);
            setSelectedQty(1);
            setCopiedCode(false);
        }
    }, [item]);

    // Keyboard support for ESC and arrow keys
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                handlePrevImage();
            } else if (e.key === 'ArrowRight') {
                handleNextImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeImageIndex, item]);

    if (!isOpen || !item) return null;

    const prod = item.producto;
    const images = prod.imagenes || [];
    const hasImages = images.length > 0;
    const availableStock = item.cantidad;
    const remainingStock = Math.max(0, availableStock - currentInCart);
    const isOutOfStock = availableStock <= 0;
    const isLowStock = availableStock > 0 && availableStock <= item.stockMinimo;

    const handleCopyCode = () => {
        if (!prod.codigo) return;
        navigator.clipboard.writeText(prod.codigo);
        setCopiedCode(true);
        toast.success(`Código ${prod.codigo} copiado`);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handlePrevImage = () => {
        if (images.length <= 1) return;
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        if (images.length <= 1) return;
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const handleIncrementQty = () => {
        if (selectedQty < remainingStock) {
            setSelectedQty((prev) => prev + 1);
        } else {
            toast.warning(`Máximo stock disponible a agregar: ${remainingStock}`);
        }
    };

    const handleDecrementQty = () => {
        if (selectedQty > 1) {
            setSelectedQty((prev) => prev - 1);
        }
    };

    const handleAdd = () => {
        if (isOutOfStock || remainingStock <= 0) {
            toast.error('No hay stock disponible en esta sucursal');
            return;
        }
        onAddToCart(item, selectedQty);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                            {prod.categoria?.nombre || 'General'}
                        </span>
                        {prod.marca?.nombre && (
                            <>
                                <span>•</span>
                                <span className="text-[11px] font-medium">{prod.marca.nombre}</span>
                            </>
                        )}
                        <span>•</span>
                        <span className="font-mono text-[11px] text-muted-foreground truncate">
                            SKU: {prod.codigo}
                        </span>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={onClose}
                        className="size-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label="Cerrar ventana"
                    >
                        <XIcon className="size-4" />
                    </Button>
                </div>

                {/* Modal Body - Scrollable Content */}
                <div className="overflow-y-auto p-5 sm:p-6 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* Left Column: Visual Gallery (5 cols) */}
                        <div className="md:col-span-5 space-y-3">
                            {/* Main Image Display */}
                            <div className="relative aspect-4/3 w-full rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center group">
                                {hasImages ? (
                                    <>
                                        <Image
                                            loading='eager'
                                            src={images[activeImageIndex].url}
                                            alt={`${prod.name} - Imagen ${activeImageIndex + 1}`}
                                            fill
                                            priority
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-contain p-2 transition-transform duration-200"
                                        />

                                        {/* Prev / Next controls if multiple images */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handlePrevImage}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-background/80 hover:bg-background shadow-md border flex items-center justify-center text-foreground transition-all cursor-pointer opacity-80 hover:opacity-100"
                                                    aria-label="Imagen anterior"
                                                >
                                                    <ChevronLeftIcon className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleNextImage}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-background/80 hover:bg-background shadow-md border flex items-center justify-center text-foreground transition-all cursor-pointer opacity-80 hover:opacity-100"
                                                    aria-label="Imagen siguiente"
                                                >
                                                    <ChevronRightIcon className="size-4" />
                                                </button>

                                                {/* Counter Pill */}
                                                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-background/90 border text-[10px] font-mono text-foreground font-semibold shadow-xs">
                                                    {activeImageIndex + 1} / {images.length}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground/60 space-y-2">
                                        <PackageIcon className="size-14 stroke-[1.2]" />
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Sin imágenes registradas
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails Strip */}
                            {images.length > 1 && (
                                <div className="space-y-1">
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Galería ({images.length} fotos)
                                    </span>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                                        {images.map((img, idx) => {
                                            const isActive = idx === activeImageIndex;
                                            return (
                                                <button
                                                    key={img.id || idx}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`relative size-14 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${isActive
                                                            ? 'ring-2 ring-primary border-transparent scale-102 shadow-xs'
                                                            : 'opacity-65 hover:opacity-100 hover:border-foreground/30'
                                                        }`}
                                                    aria-label={`Ver foto ${idx + 1}`}
                                                >
                                                    <Image
                                                        src={img.url}
                                                        alt={`Miniatura ${idx + 1}`}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quick SKU / Code Copy Card */}
                            <div className="rounded-lg border bg-muted/20 p-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                        Código de Barras / SKU
                                    </span>
                                    <span className="font-mono text-xs font-bold text-foreground truncate block">
                                        {prod.codigo}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={handleCopyCode}
                                    className="h-7 px-2 text-[11px] gap-1 shrink-0 cursor-pointer"
                                >
                                    {copiedCode ? (
                                        <>
                                            <CheckIcon className="size-3 text-emerald-600" />
                                            <span>Copiado</span>
                                        </>
                                    ) : (
                                        <>
                                            <CopyIcon className="size-3" />
                                            <span>Copiar</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Detailed Specifications & Intelligence (7 cols) */}
                        <div className="md:col-span-7 space-y-4">
                            {/* Title & Description */}
                            <div className="space-y-1.5">
                                <h2
                                    id="product-modal-title"
                                    className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug"
                                >
                                    {prod.name}
                                </h2>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    {prod.description || 'Sin descripción detallada registrada para este artículo.'}
                                </p>
                            </div>

                            {/* Price & IGV Block */}
                            <div className="rounded-xl border bg-muted/15 p-4 flex flex-wrap items-baseline justify-between gap-3">
                                <div>
                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Precio de Venta al Público
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-mono">
                                            S/ {Number(prod.precioVenta || 0).toFixed(2)}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            / {prod.unidad?.abreviatura || prod.unidad?.nombre || 'UND'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                                        <InfoIcon className="size-3" />
                                        <span>
                                            {prod.igv?.descripcion
                                                ? `${prod.igv.descripcion} (${(prod.igv.porcentaje * 100).toFixed(0)}%)`
                                                : 'IGV 18% incluido'}
                                        </span>
                                    </div>
                                </div>

                                {isAdmin && prod.precioCompra != null && (
                                    <div className="text-right border-l pl-4 border-border/60">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                            Costo Referencial (Admin)
                                        </span>
                                        <span className="text-sm font-semibold font-mono text-muted-foreground">
                                            S/ {Number(prod.precioCompra).toFixed(2)}
                                        </span>
                                        {prod.precioCompra > 0 && prod.precioVenta > prod.precioCompra && (
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                                                Margen: +{(
                                                    ((prod.precioVenta - prod.precioCompra) / prod.precioCompra) *
                                                    100
                                                ).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stock Status for this Local */}
                            <div className="rounded-xl border p-3.5 space-y-2 bg-card">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Building2Icon className="size-3.5 text-primary" />
                                        <span>Disponibilidad en:</span>
                                        <strong className="text-foreground">{sucursalNombre}</strong>
                                    </div>

                                    <Badge
                                        variant={isOutOfStock ? 'destructive' : isLowStock ? 'secondary' : 'outline'}
                                        className={
                                            isOutOfStock
                                                ? 'bg-destructive/10 text-destructive border-destructive/20 text-xs'
                                                : isLowStock
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs'
                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs'
                                        }
                                    >
                                        {isOutOfStock ? (
                                            <>
                                                <XCircleIcon className="size-3 mr-1" />
                                                Agotado en este local
                                            </>
                                        ) : isLowStock ? (
                                            <>
                                                <AlertTriangleIcon className="size-3 mr-1" />
                                                Stock Crítico ({item.cantidad} disponibles)
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2Icon className="size-3 mr-1" />
                                                En Stock ({item.cantidad} disponibles)
                                            </>
                                        )}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t text-xs">
                                    <div>
                                        <span className="text-[11px] text-muted-foreground block">Stock Físico Actual</span>
                                        <span className="font-bold text-foreground text-sm font-mono">
                                            {item.cantidad} {prod.unidad?.abreviatura || 'uds'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-muted-foreground block">Alerta de Reposición (Mín.)</span>
                                        <span className="font-semibold text-muted-foreground text-sm font-mono">
                                            {item.stockMinimo} {prod.unidad?.abreviatura || 'uds'}
                                        </span>
                                    </div>
                                </div>

                                {currentInCart > 0 && (
                                    <div className="rounded-md bg-primary/10 px-2.5 py-1.5 flex items-center justify-between text-xs text-primary">
                                        <span>Cantidad actual en la orden de venta:</span>
                                        <strong className="font-mono font-bold">{currentInCart} uds.</strong>
                                    </div>
                                )}
                            </div>

                            {/* Technical Specifications Grid */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                    Ficha Técnica y Clasificación
                                </span>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border rounded-xl p-3 bg-muted/10">
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Categoría</span>
                                        <span className="font-medium text-foreground">
                                            {prod.categoria?.nombre || 'No asignada'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Marca</span>
                                        <span className="font-medium text-foreground">
                                            {prod.marca?.nombre || 'Genérico / Sin marca'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Unidad de Medida</span>
                                        <span className="font-medium text-foreground">
                                            {prod.unidad?.nombre} ({prod.unidad?.abreviatura})
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[11px]">Modalidad</span>
                                        <span className="font-medium text-foreground">
                                            {prod.enConsignacion ? 'En consignación' : 'Propiedad del negocio'}
                                        </span>
                                    </div>
                                    {prod.proveedor && (
                                        <div className="col-span-2 pt-1 border-t">
                                            <span className="text-muted-foreground block text-[11px]">Proveedor</span>
                                            <span className="font-medium text-foreground">
                                                {prod.proveedor.nombre || prod.proveedor.razonSocial}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Internal Note (if any) */}
                            {prod.nota && (
                                <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                    <FileTextIcon className="size-4 shrink-0 mt-0.5 text-amber-600" />
                                    <div>
                                        <strong className="font-semibold block">Nota interna:</strong>
                                        <span>{prod.nota}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer: Purchase & Cart Controls */}
                <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                            Cantidad a agregar:
                        </span>
                        <div className="flex items-center border rounded-lg bg-background shadow-2xs">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                disabled={selectedQty <= 1 || isOutOfStock || remainingStock <= 0}
                                onClick={handleDecrementQty}
                                className="size-8 rounded-l-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                aria-label="Disminuir cantidad"
                            >
                                <MinusIcon className="size-3.5" />
                            </Button>
                            <span className="w-10 text-center font-bold text-sm font-mono text-foreground">
                                {selectedQty}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                disabled={selectedQty >= remainingStock || isOutOfStock || remainingStock <= 0}
                                onClick={handleIncrementQty}
                                className="size-8 rounded-r-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                aria-label="Aumentar cantidad"
                            >
                                <PlusIcon className="size-3.5" />
                            </Button>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            (Máx: {remainingStock})
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="cursor-pointer"
                        >
                            Cerrar
                        </Button>

                        <Button
                            type="button"
                            disabled={isOutOfStock || remainingStock <= 0}
                            onClick={handleAdd}
                            className="gap-2 cursor-pointer font-bold flex-1 sm:flex-initial min-w-48"
                        >
                            <ShoppingCartIcon className="size-4" />
                            <span>
                                Agregar S/ {(selectedQty * Number(prod.precioVenta || 0)).toFixed(2)}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
