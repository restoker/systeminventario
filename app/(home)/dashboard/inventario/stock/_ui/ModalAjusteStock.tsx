'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    SlidersHorizontal,
    PlusCircle,
    MinusCircle,
    ClipboardCheck,
    AlertCircle,
    Loader2,
    Check,
    Boxes,
    Search,
    ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { ajusteStockAction } from '@/server/actions/inventario/ajuste-stock-action';

export interface StockProductOption {
    productoId: string;
    nombre: string;
    codigo: string;
    cantidad: number;
    stockMinimo: number;
    unidad: string;
    precioCompra: number | null;
}

interface ModalAjusteStockProps {
    isOpen: boolean;
    onClose: () => void;
    sucursalId: string;
    sucursalNombre: string;
    productos: StockProductOption[];
    selectedProduct: StockProductOption | null;
    onSuccess: () => void;
}

export default function ModalAjusteStock({
    isOpen,
    onClose,
    sucursalId,
    sucursalNombre,
    productos,
    selectedProduct,
    onSuccess,
}: ModalAjusteStockProps) {
    const [productoId, setProductoId] = useState<string>('');
    const [tipoOperacion, setTipoOperacion] = useState<'INCREMENTO' | 'DECREMENTO' | 'CONTEO_FISICO'>('INCREMENTO');
    const [cantidad, setCantidad] = useState<string>('');
    const [motivo, setMotivo] = useState<'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'MERMA' | 'INVENTARIO_INICIAL'>('AJUSTE_POSITIVO');
    const [observacion, setObservacion] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

    // Sincronizar producto seleccionado al abrir
    useEffect(() => {
        if (isOpen) {
            if (selectedProduct) {
                setProductoId(selectedProduct.productoId);
                setSearchTerm(`${selectedProduct.nombre} (${selectedProduct.codigo})`);
            } else if (productos.length > 0) {
                setProductoId(productos[0].productoId);
                setSearchTerm(`${productos[0].nombre} (${productos[0].codigo})`);
            }
            setTipoOperacion('INCREMENTO');
            setMotivo('AJUSTE_POSITIVO');
            setCantidad('');
            setObservacion('');
            setIsDropdownOpen(false);
        }
    }, [isOpen, selectedProduct, productos]);

    // Actualizar motivo predeterminado según el tipo de operación
    useEffect(() => {
        if (tipoOperacion === 'INCREMENTO') {
            setMotivo('AJUSTE_POSITIVO');
        } else if (tipoOperacion === 'DECREMENTO') {
            setMotivo('AJUSTE_NEGATIVO');
        }
    }, [tipoOperacion]);

    const activeProduct = useMemo(() => {
        return productos.find((p) => p.productoId === productoId) || null;
    }, [productos, productoId]);

    const currentStock = activeProduct?.cantidad ?? 0;
    const numCantidad = Number(cantidad) || 0;

    // Cálculo dinámico de stock proyectado
    const projectedStock = useMemo(() => {
        if (tipoOperacion === 'INCREMENTO') {
            return currentStock + numCantidad;
        }
        if (tipoOperacion === 'DECREMENTO') {
            return Math.max(0, currentStock - numCantidad);
        }
        if (tipoOperacion === 'CONTEO_FISICO') {
            return numCantidad;
        }
        return currentStock;
    }, [currentStock, numCantidad, tipoOperacion]);

    const isExceeding = tipoOperacion === 'DECREMENTO' && numCantidad > currentStock;

    // Filtro de productos para el selector de búsqueda
    const filteredProducts = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return productos.slice(0, 30);
        return productos
            .filter((p) => p.nombre.toLowerCase().includes(query) || p.codigo.toLowerCase().includes(query))
            .slice(0, 30);
    }, [productos, searchTerm]);

    const { execute, status } = useAction(ajusteStockAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Ajuste de stock registrado.');
                onSuccess();
                onClose();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error inesperado al procesar el ajuste de stock.');
        },
    });

    const isPending = status === 'executing';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!productoId) {
            toast.error('Selecciona un producto');
            return;
        }

        if (numCantidad <= 0 && tipoOperacion !== 'CONTEO_FISICO') {
            toast.error('Ingresa una cantidad mayor a 0');
            return;
        }

        if (numCantidad < 0) {
            toast.error('La cantidad no puede ser negativa');
            return;
        }

        if (tipoOperacion === 'CONTEO_FISICO' && numCantidad === currentStock) {
            toast.error('El conteo físico ingresado es idéntico al stock actual. No requiere ajuste.');
            return;
        }

        if (isExceeding) {
            toast.error(`No puedes descontar más unidades de las disponibles (${currentStock}).`);
            return;
        }

        let motivoFinal = motivo;
        if (tipoOperacion === 'CONTEO_FISICO') {
            motivoFinal = numCantidad > currentStock ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
        }

        execute({
            sucursalId,
            productoId,
            tipoOperacion,
            cantidad: numCantidad,
            motivo: motivoFinal,
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
                                <SlidersHorizontal className="size-4.5" />
                            </span>
                            <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                Ajuste Manual de Stock
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Regularización física y auditoría en <span className="font-semibold text-foreground">{sucursalNombre}</span>.
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
                    {/* Selector de Producto */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>Producto a ajustar</span>
                            {activeProduct && (
                                <span className="text-[11px] font-normal text-muted-foreground">
                                    Stock actual:{' '}
                                    <strong className="text-foreground font-mono font-bold">
                                        {currentStock} {activeProduct.unidad}
                                    </strong>
                                </span>
                            )}
                        </label>

                        {/* Searchable input / display */}
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

                            {/* Dropdown list if searching */}
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

                    {/* Selector de Tipo de Operación */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Tipo de Operación
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTipoOperacion('INCREMENTO')}
                                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                    tipoOperacion === 'INCREMENTO'
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <PlusCircle className="size-4" />
                                <span>Sumar (+)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTipoOperacion('DECREMENTO')}
                                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                    tipoOperacion === 'DECREMENTO'
                                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold shadow-xs'
                                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <MinusCircle className="size-4" />
                                <span>Restar (-)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTipoOperacion('CONTEO_FISICO')}
                                className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                    tipoOperacion === 'CONTEO_FISICO'
                                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                }`}
                            >
                                <ClipboardCheck className="size-4" />
                                <span>Conteo Real (=)</span>
                            </button>
                        </div>
                    </div>

                    {/* Cantidad y Motivo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                {tipoOperacion === 'CONTEO_FISICO' ? 'Stock Físico Real' : 'Cantidad a ajustar'}
                            </label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                placeholder={tipoOperacion === 'CONTEO_FISICO' ? `${currentStock}` : 'Ej: 5'}
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

                        {tipoOperacion !== 'CONTEO_FISICO' ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Motivo Operativo
                                </label>
                                <select
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value as any)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    {tipoOperacion === 'INCREMENTO' ? (
                                        <>
                                            <option value="AJUSTE_POSITIVO">Ajuste Positivo / Sobrante</option>
                                            <option value="INVENTARIO_INICIAL">Inventario Inicial</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="AJUSTE_NEGATIVO">Ajuste Negativo / Faltante</option>
                                            <option value="MERMA">Merma, Daño o Vencimiento</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Resultado del Conteo
                                </label>
                                <div className="h-9 px-3 flex items-center rounded-lg border border-border/60 bg-muted/30 text-xs font-medium">
                                    {numCantidad > currentStock && (
                                        <span className="text-emerald-600 font-semibold">
                                            + {numCantidad - currentStock} unid. (Sobrante)
                                        </span>
                                    )}
                                    {numCantidad < currentStock && (
                                        <span className="text-rose-600 font-semibold">
                                            - {currentStock - numCantidad} unid. (Faltante)
                                        </span>
                                    )}
                                    {numCantidad === currentStock && (
                                        <span className="text-muted-foreground">Sin variación</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resumen de Impacto en Stock */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                            <span className="text-muted-foreground block text-[11px]">Proyección de Existencias</span>
                            <div className="flex items-center gap-2 font-mono">
                                <span className="text-muted-foreground line-through">
                                    {currentStock} {activeProduct?.unidad || 'UND'}
                                </span>
                                <span>→</span>
                                <span className="text-base font-bold text-foreground">
                                    {projectedStock} {activeProduct?.unidad || 'UND'}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">Kardex de Auditoría</span>
                            <span className="font-semibold text-primary">Registrado automáticamente</span>
                        </div>
                    </div>

                    {/* Observación / Justificación */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            Observación / Justificación <span className="text-muted-foreground font-normal">(Opcional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            placeholder="Ej: Hallazgo tras conteo físico mensual o producto deteriorado..."
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
                            disabled={isPending || isExceeding || !productoId}
                            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="size-3.5" />
                                    <span>Aplicar Ajuste</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

