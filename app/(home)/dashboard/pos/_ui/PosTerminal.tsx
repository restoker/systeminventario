'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    SearchIcon,
    ShoppingCartIcon,
    PackageIcon,
    PlusIcon,
    MinusIcon,
    Trash2Icon,
    StoreIcon,
    UserIcon,
    ReceiptIcon,
    CoinsIcon,
    InfoIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { Sucursal, TipoDocumentoDto, TipoPagoDto } from '@/interfaces';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cartStore } from '@/store/cartStore';
import ModalDetalleProducto from './ModalDetalleProducto';
import ModalCobrarVenta, { TipoComprobantePosItem } from './ModalCobrarVenta';

export interface PosStockItem {
    id: string;
    productoId: string;
    sucursalId: string;
    cantidad: number;
    stockMinimo: number;
    producto: {
        id: string;
        name: string;
        codigo: string;
        description: string;
        precioVenta: number;
        precioCompra?: number | null;
        enConsignacion?: boolean | null;
        nota?: string | null;
        categoria?: { id: string; nombre: string } | null;
        marca?: { id: string; nombre: string } | null;
        unidad?: { id: string; nombre: string; abreviatura: string } | null;
        proveedor?: { id: string; nombre?: string | null; razonSocial?: string | null } | null;
        igv?: { id: string; descripcion: string; porcentaje: number } | null;
        imagenes?: { id: string; url: string }[];
    };
}

interface PosTerminalProps {
    sucursal: Sucursal;
    sucursales?: Sucursal[];
    caja?: { id: string; estado?: string | null } | null;
    usuario: {
        id: string;
        name?: string | null;
        username?: string | null;
        role?: string | null;
    };
    stocks: PosStockItem[];
    tipoDocumentos?: TipoDocumentoDto[];
    tiposComprobante?: TipoComprobantePosItem[];
    tiposPago?: TipoPagoDto[];
    canChangeSucursal?: boolean;
}

interface CartItem {
    stockId: string;
    productoId: string;
    name: string;
    codigo: string;
    precio: number;
    cantidad: number;
    maxStock: number;
    unidad?: string;
    imagen?: string;
}

export default function PosTerminal({
    sucursal,
    sucursales = [],
    usuario,
    stocks,
    tipoDocumentos = [],
    tiposComprobante = [],
    tiposPago = [],
    canChangeSucursal = false,
}: PosTerminalProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProductModal, setSelectedProductModal] = useState<PosStockItem | null>(null);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    // Sync with zustand cartStore if needed
    const { lugarId, handleLugarId, handleOrden, clearOrder } = cartStore();

    useEffect(() => {
        if (lugarId !== sucursal.id) {
            handleLugarId(sucursal.id);
            clearOrder();
        }
    }, [sucursal.id, lugarId, handleLugarId, clearOrder]);

    // Categories available in this sucursal's stock
    const categories = useMemo(() => {
        const catMap = new Map<string, string>();
        stocks.forEach((s) => {
            if (s.producto?.categoria) {
                catMap.set(s.producto.categoria.id, s.producto.categoria.nombre);
            }
        });
        return Array.from(catMap.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [stocks]);

    // Filter products by search and category
    const filteredStocks = useMemo(() => {
        const query = search.trim().toLowerCase();
        return stocks.filter((item) => {
            const prod = item.producto;
            if (!prod) return false;

            const matchesCategory =
                selectedCategory === 'all' || prod.categoria?.id === selectedCategory;

            if (!matchesCategory) return false;

            if (!query) return true;

            const nameMatch = prod.name.toLowerCase().includes(query);
            const codeMatch = prod.codigo.toLowerCase().includes(query);
            const descMatch = prod.description?.toLowerCase().includes(query) ?? false;
            const catMatch = prod.categoria?.nombre.toLowerCase().includes(query) ?? false;

            return nameMatch || codeMatch || descMatch || catMatch;
        });
    }, [stocks, search, selectedCategory]);

    // Add item to cart (supports quantityToAdd from modal or default 1)
    const addToCart = (stockItem: PosStockItem, quantityToAdd: number = 1) => {
        const prod = stockItem.producto;
        if (!prod || stockItem.cantidad <= 0) {
            toast.error('Producto sin stock en esta sucursal');
            return;
        }

        setCart((prev) => {
            const existingIndex = prev.findIndex((item) => item.stockId === stockItem.id);
            if (existingIndex > -1) {
                const currentQty = prev[existingIndex].cantidad;
                const newTotal = currentQty + quantityToAdd;
                if (newTotal > stockItem.cantidad) {
                    toast.warning(`Stock máximo alcanzado (${stockItem.cantidad} disponibles en sede)`);
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        cantidad: stockItem.cantidad,
                    };
                    return updated;
                }
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    cantidad: newTotal,
                };
                toast.success(`Agregado: ${quantityToAdd} ${quantityToAdd === 1 ? 'unidad' : 'unidades'} de ${prod.name}`);
                return updated;
            } else {
                const validQty = Math.min(quantityToAdd, stockItem.cantidad);
                const newItem: CartItem = {
                    stockId: stockItem.id,
                    productoId: prod.id,
                    name: prod.name,
                    codigo: prod.codigo,
                    precio: Number(prod.precioVenta) || 0,
                    cantidad: validQty,
                    maxStock: stockItem.cantidad,
                    unidad: prod.unidad?.abreviatura || prod.unidad?.nombre,
                    imagen: prod.imagenes?.[0]?.url,
                };
                toast.success(`Agregado a la orden: ${prod.name}`);
                return [...prev, newItem];
            }
        });
    };

    // Update quantity
    const updateQuantity = (stockId: string, newQty: number) => {
        setCart((prev) => {
            if (newQty <= 0) {
                return prev.filter((item) => item.stockId !== stockId);
            }
            return prev.map((item) => {
                if (item.stockId === stockId) {
                    const validQty = Math.min(newQty, item.maxStock);
                    if (newQty > item.maxStock) {
                        toast.warning(`Stock máximo: ${item.maxStock}`);
                    }
                    return { ...item, cantidad: validQty };
                }
                return item;
            });
        });
    };

    // Remove item
    const removeFromCart = (stockId: string) => {
        setCart((prev) => prev.filter((item) => item.stockId !== stockId));
    };

    // Clear whole cart
    const handleClearCart = () => {
        setCart([]);
        clearOrder();
        toast.info('Carrito vaciado');
    };

    // Financial calculations
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    }, [cart]);

    const igvTotal = useMemo(() => {
        // En Perú el IGV usualmente está incluido o se desglosa al 18%
        return subtotal * 0.18;
    }, [subtotal]);

    const total = subtotal;
    const totalItems = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.cantidad, 0);
    }, [cart]);

    const handleCheckout = () => {
        if (cart.length === 0) {
            toast.error('Agrega productos al carrito para realizar una venta');
            return;
        }

        // Sync order to cartStore and open Checkout Modal
        handleOrden(cart.map((c) => ({ id: c.productoId, cantidad: c.cantidad })));
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmSale = () => {
        setCart([]);
        clearOrder();
    };

    return (
        <div className="flex flex-col gap-5 p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full min-h-[calc(100vh-4rem)]">
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                        <span>/</span>
                        {canChangeSucursal ? (
                            <>
                                <Link href="/dashboard/pos" className="hover:underline">Punto de Venta</Link>
                                <span>/</span>
                                <span className="text-foreground font-medium">{sucursal.nombre}</span>
                            </>
                        ) : (
                            <span className="text-foreground font-medium">Punto de Venta (POS)</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {canChangeSucursal && (
                            <Link
                                href="/dashboard/pos"
                                className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                                aria-label="Cambiar local"
                            >
                                <ArrowLeftIcon className="size-4" />
                            </Link>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <ReceiptIcon className="size-6 text-primary" />
                                    POS - {sucursal.nombre}
                                </h1>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                                    <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                    Caja Abierta
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                    <StoreIcon className="size-3" />
                                    Código: <strong className="font-mono text-foreground">{sucursal.codigo}</strong>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <UserIcon className="size-3" />
                                    Cajero: <strong className="text-foreground">{usuario.name || usuario.username || 'Usuario'}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions (Branch Switcher for Admin) */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                    {canChangeSucursal && sucursales.length > 1 && (
                        <select
                            className="h-9 px-3 rounded-md border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            value={sucursal.id}
                            onChange={(e) => {
                                setCart([]);
                                clearOrder();
                                router.push(`/dashboard/pos?sucursalId=${e.target.value}`);
                            }}
                        >
                            {sucursales.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre} ({s.codigo})
                                </option>
                            ))}
                        </select>
                    )}
                    {canChangeSucursal && (
                        <Link
                            href="/dashboard/pos"
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                            Cambiar Local
                        </Link>
                    )}
                </div>
            </div>

            {/* POS Main Grid: Catalogue (Left) + Cart Ticket (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Product Catalogue (7 cols on lg) */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                    {/* Search & Category Filter */}
                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Buscar producto por nombre o código en este local..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10"
                            />
                        </div>
                        {categories.length > 0 && (
                            <select
                                className="h-10 px-3 rounded-md border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Todas las categorías ({stocks.length})</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Products Grid */}
                    {filteredStocks.length === 0 ? (
                        <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center flex flex-col items-center justify-center">
                            <div className="rounded-full bg-muted p-3 mb-2.5 text-muted-foreground">
                                <PackageIcon className="size-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                                {stocks.length === 0
                                    ? `No hay productos asignados a la sucursal ${sucursal.nombre}`
                                    : 'No se encontraron productos con el filtro aplicado'}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-3">
                                {stocks.length === 0
                                    ? 'Para vender en esta tienda, debes asignar stock a los productos en esta sede desde el módulo de inventario.'
                                    : 'Intenta modificar el término de búsqueda o categoría.'}
                            </p>
                            {stocks.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearch('');
                                        setSelectedCategory('all');
                                    }}
                                >
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filteredStocks.map((item) => {
                                const prod = item.producto;
                                if (!prod) return null;
                                const isOutOfStock = item.cantidad <= 0;
                                const isLowStock = item.cantidad > 0 && item.cantidad <= item.stockMinimo;
                                const currentInCart = cart.find((c) => c.stockId === item.id)?.cantidad || 0;
                                const availableLeft = item.cantidad - currentInCart;

                                return (
                                    <Card
                                        key={item.id}
                                        // onClick={() => {
                                        //     if (isOutOfStock) {
                                        //         toast.error('Producto sin stock en esta sucursal');
                                        //         return;
                                        //     }
                                        //     if (availableLeft <= 0) {
                                        //         toast.warning('No hay más unidades disponibles de este producto');
                                        //         return;
                                        //     }
                                        //     addToCart(item, 1);
                                        // }}
                                        // title={isOutOfStock ? 'Producto sin stock' : 'Haz clic para agregar al carrito'}
                                        className={`group cursor-pointer select-none border transition-all duration-150 hover:border-primary/60 hover:shadow-sm flex flex-col justify-between overflow-hidden ${isOutOfStock ? 'opacity-55 bg-muted/30 cursor-not-allowed' : 'bg-card active:scale-[0.99]'
                                            }`}
                                    >
                                        <CardContent className="p-3.5 flex flex-col justify-between h-full gap-2.5">
                                            {/* Top: Category & Stock Badges */}
                                            <div className="flex items-start justify-between gap-1.5">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider truncate">
                                                    {prod.categoria?.nombre || 'General'}
                                                </span>
                                                <Badge
                                                    variant={isOutOfStock ? 'destructive' : isLowStock ? 'secondary' : 'outline'}
                                                    className={`text-[10px] font-mono px-1.5 py-0 ${isOutOfStock
                                                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                        : isLowStock
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        }`}
                                                >
                                                    {isOutOfStock
                                                        ? 'Agotado'
                                                        : `Stock: ${item.cantidad}`}
                                                </Badge>
                                            </div>

                                            {/* Mid: Image / Placeholder + Product Name */}
                                            <div className="space-y-1.5">
                                                <div className="relative w-full aspect-4/3 rounded-md bg-muted/60 overflow-hidden flex items-center justify-center">
                                                    {prod.imagenes?.[0]?.url ? (
                                                        <Image
                                                            loading='eager'
                                                            src={prod.imagenes[0].url}
                                                            alt={prod.name}
                                                            fill
                                                            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 20vw"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                        />
                                                    ) : (
                                                        <PackageIcon className="size-8 text-muted-foreground/40" />
                                                    )}
                                                    {currentInCart > 0 && (
                                                        <div className="absolute top-1.5 right-1.5 rounded-full bg-primary text-primary-foreground font-bold text-[11px] size-6 flex items-center justify-center shadow-md">
                                                            {currentInCart}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                                        {prod.name}
                                                    </h3>
                                                    <span className="text-[10px] font-mono text-muted-foreground">
                                                        {prod.codigo}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom: Price + Actions */}
                                            <div className="pt-2 border-t flex items-center justify-between gap-1">
                                                <div>
                                                    <span className="text-xs text-muted-foreground font-medium block text-[10px]">
                                                        Precio
                                                    </span>
                                                    <span className="text-sm font-bold text-foreground">
                                                        S/ {Number(prod.precioVenta || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedProductModal(item);
                                                        }}
                                                        className="size-7 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        title="Ver detalles del producto"
                                                        aria-label={`Ver detalles de ${prod.name}`}
                                                    >
                                                        <InfoIcon className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon-xs"
                                                        disabled={isOutOfStock || availableLeft <= 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(item, 1);
                                                        }}
                                                        className="size-7 rounded-md cursor-pointer shrink-0"
                                                        title="Agregar al carrito"
                                                        aria-label={`Agregar ${prod.name} al carrito`}
                                                    >
                                                        <PlusIcon className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Cart / Sales Ticket (5 cols on lg) */}
                <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
                    <Card className="border shadow-sm flex flex-col bg-card">
                        {/* Cart Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-md p-1.5 bg-primary/10 text-primary">
                                    <ShoppingCartIcon className="size-4" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm text-foreground">Orden de Venta</h2>
                                    <span className="text-[11px] text-muted-foreground">
                                        {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                                    </span>
                                </div>
                            </div>
                            {cart.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={handleClearCart}
                                    className="text-xs text-destructive hover:bg-destructive/10"
                                >
                                    Vaciar
                                </Button>
                            )}
                        </div>

                        {/* Cart Item List */}
                        <div className="p-3 divide-y max-h-[46vh] overflow-y-auto space-y-2.5">
                            {cart.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                                    <ShoppingCartIcon className="size-8 text-muted-foreground/40" />
                                    <p className="text-xs font-medium text-foreground">
                                        Carrito de venta vacío
                                    </p>
                                    <p className="text-[11px] text-muted-foreground max-w-xs">
                                        Haz clic en los productos del catálogo de esta sucursal para agregarlos a la orden.
                                    </p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.stockId} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {/* Imagen circular de referencia */}
                                            <div className="relative size-9 rounded-full overflow-hidden border border-border/70 bg-muted/40 shrink-0 flex items-center justify-center">
                                                {item.imagen ? (
                                                    <Image
                                                        src={item.imagen}
                                                        alt={item.name}
                                                        fill
                                                        sizes="36px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <PackageIcon className="size-4 text-muted-foreground/50" />
                                                )}
                                            </div>

                                            {/* Info del producto */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                    <span className="font-medium text-foreground">S/ {item.precio.toFixed(2)}</span>
                                                    <span>•</span>
                                                    <span className="font-mono text-[10px]">{item.codigo}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity Stepper */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="icon-xs"
                                                onClick={() => updateQuantity(item.stockId, item.cantidad - 1)}
                                                className="size-6 rounded"
                                            >
                                                <MinusIcon className="size-3" />
                                            </Button>
                                            <span className="w-6 text-center font-bold text-xs font-mono">
                                                {item.cantidad}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon-xs"
                                                disabled={item.cantidad >= item.maxStock}
                                                onClick={() => updateQuantity(item.stockId, item.cantidad + 1)}
                                                className="size-6 rounded"
                                            >
                                                <PlusIcon className="size-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => removeFromCart(item.stockId)}
                                                className="size-6 text-muted-foreground hover:text-destructive ml-1"
                                                aria-label="Eliminar producto"
                                            >
                                                <Trash2Icon className="size-3" />
                                            </Button>
                                        </div>

                                        {/* Item Total */}
                                        <div className="text-right min-w-14 shrink-0">
                                            <span className="text-xs font-bold text-foreground">
                                                S/ {(item.precio * item.cantidad).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Summary & Checkout */}
                        <div className="p-4 border-t bg-muted/20 space-y-3">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>S/ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>IGV (18% incluido)</span>
                                    <span>S/ {igvTotal.toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-baseline font-bold text-base text-foreground">
                                    <span>Total a Pagar</span>
                                    <span className="text-lg text-primary">S/ {total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={handleCheckout}
                                className="w-full font-bold cursor-pointer gap-2"
                            >
                                <CoinsIcon className="size-4" />
                                <span>Cobrar S/ {total.toFixed(2)}</span>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal de Detalle Completo de Producto con Galería de Imágenes */}
            <ModalDetalleProducto
                item={selectedProductModal}
                isOpen={!!selectedProductModal}
                onClose={() => setSelectedProductModal(null)}
                onAddToCart={(item, qty) => addToCart(item, qty)}
                currentInCart={
                    selectedProductModal
                        ? cart.find((c) => c.stockId === selectedProductModal.id)?.cantidad || 0
                        : 0
                }
                sucursalNombre={sucursal.nombre}
                isAdmin={usuario.role === 'admin'}
            />

            {/* Modal de Cobro, Botonera Nominal de Soles y Emisión/Descarga de Ticket */}
            <ModalCobrarVenta
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
                cart={cart}
                subtotal={subtotal}
                igvTotal={igvTotal}
                total={total}
                sucursal={sucursal}
                vendedorNombre={usuario.name || usuario.username || 'Cajero'}
                tipoDocumentos={tipoDocumentos}
                tiposComprobante={tiposComprobante}
                tiposPago={tiposPago}
                onConfirmSale={handleConfirmSale}
            />
        </div>
    );
}

