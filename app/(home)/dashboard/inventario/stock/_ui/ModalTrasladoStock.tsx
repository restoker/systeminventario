'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    ArrowRightLeft,
    Building2,
    Store,
    AlertCircle,
    Loader2,
    Check,
    ArrowRight,
    Search,
    ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { trasladoStockAction } from '@/server/actions/inventario/traslado-stock-action';
import { StockProductOption } from './ModalAjusteStock';

interface SucursalBasic {
    id: string;
    nombre: string;
    codigo: string;
    direccion?: string | null;
    activo: boolean | null;
}

interface ModalTrasladoStockProps {
    isOpen: boolean;
    onClose: () => void;
    sucursalOrigenId: string;
    sucursalOrigenNombre: string;
    sucursales: SucursalBasic[];
    productos: StockProductOption[];
    selectedProduct: StockProductOption | null;
    onSuccess: () => void;
}

export default function ModalTrasladoStock({
    isOpen,
    onClose,
    sucursalOrigenId,
    sucursalOrigenNombre,
    sucursales,
    productos,
    selectedProduct,
    onSuccess,
}: ModalTrasladoStockProps) {
    const [sucursalDestinoId, setSucursalDestinoId] = useState<string>('');
    const [productoId, setProductoId] = useState<string>('');
    const [cantidad, setCantidad] = useState<string>('');
    const [motivo, setMotivo] = useState<string>('Reabastecimiento entre sedes');
    const [observacion, setObservacion] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    // Filtrar sucursales destino elegibles (excluyendo la sucursal de origen)
    const availableDestinos = useMemo(() => {
        return sucursales.filter((s) => s.id !== sucursalOrigenId && s.activo !== false);
    }, [sucursales, sucursalOrigenId]);

    // Inicializar estado al abrir modal
    useEffect(() => {
        if (isOpen) {
            if (availableDestinos.length > 0) {
                setSucursalDestinoId(availableDestinos[0].id);
            } else {
                setSucursalDestinoId('');
            }

            if (selectedProduct) {
                setProductoId(selectedProduct.productoId);
                setSearchTerm(`${selectedProduct.nombre} (${selectedProduct.codigo})`);
            } else if (productos.length > 0) {
                setProductoId(productos[0].productoId);
                setSearchTerm(`${productos[0].nombre} (${productos[0].codigo})`);
            }

            setCantidad('');
            setMotivo('Reabastecimiento entre sedes');
            setObservacion('');
            setIsDropdownOpen(false);
        }
    }, [isOpen, selectedProduct, productos, availableDestinos]);

    const activeProduct = useMemo(() => {
        return productos.find((p) => p.productoId === productoId) || null;
    }, [productos, productoId]);

    const currentStock = activeProduct?.cantidad ?? 0;
    const numCantidad = Number(cantidad) || 0;
    const remainingStock = Math.max(0, currentStock - numCantidad);
    const isExceeding = numCantidad > currentStock;

    // Filtro para selector de productos
    const filteredProducts = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return productos.slice(0, 30);
        return productos
            .filter((p) => p.nombre.toLowerCase().includes(query) || p.codigo.toLowerCase().includes(query))
            .slice(0, 30);
    }, [productos, searchTerm]);

    const { execute, status } = useAction(trasladoStockAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Traslado registrado exitosamente.');
                onSuccess();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error inesperado al procesar el traslado.');
        },
    });

    const isPending = status === 'executing';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sucursalDestinoId) {
            toast.error('Selecciona una sucursal destino');
            return;
        }

        if (!productoId) {
            toast.error('Selecciona un producto para trasladar');
            return;
        }

        if (numCantidad <= 0) {
            toast.error('Ingresa una cantidad mayor a 0');
            return;
        }

        if (isExceeding) {
            toast.error(`No cuentas con stock suficiente en ${sucursalOrigenNombre} (${currentStock} disponible).`);
            return;
        }

        if (!motivo.trim()) {
            toast.error('Ingresa el motivo del traslado');
            return;
        }

        execute({
            sucursalOrigenId,
            sucursalDestinoId,
            productoId,
            cantidad: numCantidad,
            motivo: motivo.trim(),
            observacion: observacion.trim() || undefined,
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isPending) onClose();
            }}
        >
            <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ArrowRightLeft className="size-4.5" />
                            </span>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Traslado entre Sucursales
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Movimiento formal de mercadería con registro en Kardex y correlativo TR.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                    >
                        <X className="size-4.5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Indicador de Origen y Destino */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-border/80 bg-muted/20">
                        {/* Origen (Fijo) */}
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                Sede de Origen (Salida)
                            </span>
                            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                <Store className="size-3.5 text-primary shrink-0" />
                                <span className="truncate">{sucursalOrigenNombre}</span>
                            </div>
                        </div>

                        {/* Destino (Selector) */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                Sede Destino (Entrada) <span className="text-destructive">*</span>
                            </label>
                            {availableDestinos.length === 0 ? (
                                <p className="text-xs text-destructive font-medium">
                                    No hay otras sedes disponibles.
                                </p>
                            ) : (
                                <select
                                    value={sucursalDestinoId}
                                    onChange={(e) => setSucursalDestinoId(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                    required
                                >
                                    {availableDestinos.map((dest) => (
                                        <option key={dest.id} value={dest.id}>
                                            {dest.nombre} {dest.codigo ? `(${dest.codigo})` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Selector de Producto */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>Producto a trasladar</span>
                            {activeProduct && (
                                <span className="text-[11px] font-normal text-muted-foreground">
                                    Disponible en origen:{' '}
                                    <strong className="text-foreground font-mono font-bold">
                                        {currentStock} {activeProduct.unidad}
                                    </strong>
                                </span>
                            )}
                        </label>

                        <div className="relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    disabled={Boolean(selectedProduct) || isPending}
                                    placeholder="Buscar producto por nombre o código..."
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        if (!selectedProduct) setIsDropdownOpen(true);
                                    }}
                                    className="w-full rounded-lg border border-input bg-background pl-9 pr-8 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-80"
                                />
                                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                {!selectedProduct && (
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <ChevronDown className="size-4" />
                                    </button>
                                )}
                            </div>

                            {!selectedProduct && isDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl p-1">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-muted-foreground">
                                            No se encontraron productos coincidentes.
                                        </div>
                                    ) : (
                                        filteredProducts.map((p) => (
                                            <button
                                                key={p.productoId}
                                                type="button"
                                                onClick={() => {
                                                    setProductoId(p.productoId);
                                                    setSearchTerm(`${p.nombre} (${p.codigo})`);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-md text-xs flex items-center justify-between hover:bg-muted transition-colors cursor-pointer ${
                                                    productoId === p.productoId ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                                }`}
                                            >
                                                <div className="truncate pr-2">
                                                    <span className="font-medium">{p.nombre}</span>
                                                    <span className="text-[11px] text-muted-foreground font-mono ml-2">
                                                        [{p.codigo}]
                                                    </span>
                                                </div>
                                                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                                    {p.cantidad} {p.unidad}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cantidad y Motivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Cantidad a trasladar
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={currentStock > 0 ? currentStock : 1}
                                step={1}
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                placeholder="Ej: 10"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                            {isExceeding && (
                                <p className="text-[11px] text-destructive flex items-center gap-1">
                                    <AlertCircle className="size-3 shrink-0" />
                                    Excede las {currentStock} unidades disponibles.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                Motivo del traslado
                            </label>
                            <input
                                type="text"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Ej: Rebalanceo, solicitud de sede..."
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    {/* Resumen del movimiento */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                            <span className="text-muted-foreground block text-[11px]">Remanente en {sucursalOrigenNombre}</span>
                            <div className="flex items-center gap-2 font-mono">
                                <span className="text-muted-foreground">
                                    {currentStock}
                                </span>
                                <span>-</span>
                                <span className="font-bold text-primary">
                                    {numCantidad}
                                </span>
                                <span>=</span>
                                <span className="font-bold text-foreground">
                                    {remainingStock} {activeProduct?.unidad || 'UND'}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">Estado Inicial</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Completado y Recibido</span>
                        </div>
                    </div>

                    {/* Observación adicional */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Observación adicional <span className="text-muted-foreground font-normal">(Opcional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            placeholder="Detalles sobre el transporte, transportista o notas operativas..."
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || isExceeding || numCantidad <= 0 || !productoId || !sucursalDestinoId}
                            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="size-3.5" />
                                    <span>Confirmar Traslado</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

