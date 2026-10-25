'use client';

import { useState } from 'react';
import {
    CreditCard,
    TrendingUp,
    FileText,
    Plus,
    Save,
    Trash2,
    Building2,
    Globe,
    IdCard,
    BadgePercent,
    Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemGroup } from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    updateConfiguracionAction,
} from '@/server/actions/configuracion/configuracion-actions';
import { newIgvAction } from '@/server/actions/igv/new-igv-action';
import {
    toggleTipoDocumentoAction,
    deleteTipoDocumentoAction,
} from '@/server/actions/tipo-documento/tipo-documento-actions';
import ModalNewTipoDocumento from './ModalNewTipoDocumento';

interface TipoDocItem {
    id: string;
    nombre: string;
    estado: boolean | null;
    createdAt?: Date;
}

interface Props {
    initialIgv: {
        id: string;
        value: number;
        isActive: boolean | null;
    } | null;
    initialTiposDocumento: TipoDocItem[];
    initialConfiguracion: {
        id: string;
        recargoTarjeta: number;
        comisionVendedor: number;
    } | null;
}

export default function ConfiguracionClient({
    initialIgv,
    initialTiposDocumento,
    initialConfiguracion,
}: Props) {
    // 1. Estado para el IGV
    const [igvValue, setIgvValue] = useState<number>(initialIgv?.value ?? 0.18);
    const [igvActive, setIgvActive] = useState<boolean>(initialIgv?.isActive ?? true);

    // 2. Estado para el listado de tipos de documento
    const [documentos, setDocumentos] = useState<TipoDocItem[]>(initialTiposDocumento);
    const [isModalDocOpen, setIsModalDocOpen] = useState(false);

    // 3. Estado para el recargo por pago con tarjeta
    const [recargoTarjeta, setRecargoTarjeta] = useState<number>(
        initialConfiguracion?.recargoTarjeta ?? 0.05
    );

    // 4. Estado para la comisión del vendedor
    const [comisionVendedor, setComisionVendedor] = useState<number>(
        initialConfiguracion?.comisionVendedor ?? 0.03
    );

    // Acciones del servidor
    const { execute: executeIgv, status: statusIgv } = useAction(newIgvAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) toast.success(data.msg);
            else if (data?.msg) toast.error(data.msg);
        },
        onError: () => toast.error('Error al guardar la tasa de IGV'),
    });

    const { execute: executeConfiguracion, status: statusConfiguracion } = useAction(updateConfiguracionAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) toast.success(data.msg);
            else if (data?.msg) toast.error(data.msg);
        },
        onError: () => toast.error('Error al guardar la configuración'),
    });

    const { execute: executeToggleDoc } = useAction(toggleTipoDocumentoAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) toast.success(data.msg);
            else if (data?.msg) toast.error(data.msg);
        },
        onError: () => toast.error('Error al cambiar el estado del documento'),
    });

    const { execute: executeDeleteDoc } = useAction(deleteTipoDocumentoAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) toast.success(data.msg);
            else if (data?.msg) toast.error(data.msg);
        },
        onError: () => toast.error('Error al eliminar el documento'),
    });

    // Manejador toggle documento
    const handleToggleDocumento = (id: string, nuevoEstado: boolean) => {
        setDocumentos((prev) =>
            prev.map((d) => (d.id === id ? { ...d, estado: nuevoEstado } : d))
        );
        executeToggleDoc({ id, estado: nuevoEstado });
    };

    // Manejador eliminar documento
    const handleDeleteDocumento = (id: string, nombre: string) => {
        if (!confirm(`¿Estás seguro de eliminar el documento "${nombre}"?`)) return;
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
        executeDeleteDoc({ id });
    };

    // Obtener ícono contextual según el nombre del documento
    const getDocumentIcon = (nombre: string) => {
        const n = nombre.toLowerCase();
        if (n.includes('dni') || n.includes('identidad')) return <IdCard className="size-4 text-emerald-500" />;
        if (n.includes('ruc') || n.includes('tributario') || n.includes('empresa')) return <Building2 className="size-4 text-blue-500" />;
        if (n.includes('pasaporte') || n.includes('extranj') || n.includes('ce')) return <Globe className="size-4 text-purple-500" />;
        return <FileText className="size-4 text-amber-500" />;
    };

    // Obtener subtítulo descriptivo del documento
    const getDocumentDescription = (nombre: string) => {
        const n = nombre.toLowerCase();
        if (n.includes('dni')) return 'Documento Nacional de Identidad · 8 dígitos (Personas Naturales)';
        if (n.includes('ruc')) return 'Registro Único de Contribuyentes · 11 dígitos (Empresas y Negocios)';
        if (n.includes('extranj') || n.includes('ce')) return 'Carnet de Extranjería para personas no domiciliadas';
        if (n.includes('pasaporte')) return 'Documento de viaje e identificación internacional';
        return 'Documento registrado para validación y facturación comercial';
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pb-16">
            {/* Cabecera Principal */}
            <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>Dashboard</span>
                    <span>/</span>
                    <span className="text-foreground font-medium">Configuración</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Configuración del Sistema
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
                    Ajusta los parámetros tributarios, catálogo de documentos habilitados, recargos de pasarelas de pago y comisiones comerciales.
                </p>
            </div>

            {/* SECCIÓN 1: IMPUESTO GENERAL A LAS VENTAS (IGV) */}
            <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <BadgePercent className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Impuesto General a las Ventas (IGV)
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Tasa impositiva aplicada a los productos y ventas registradas en el inventario.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <label htmlFor="igv-active-toggle" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                            {igvActive ? 'Impuesto Activo' : 'Exonerado / Inactivo'}
                        </label>
                        <Switch
                            id="igv-active-toggle"
                            checked={igvActive}
                            onCheckedChange={setIgvActive}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Input y Control */}
                    <div className="space-y-3">
                        <label htmlFor="input-igv" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70">
                            Tasa Decimal del Impuesto
                        </label>
                        <div className="relative flex items-center">
                            <input
                                id="input-igv"
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={isNaN(igvValue) ? '' : igvValue}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setIgvValue(isNaN(val) ? 0 : val);
                                }}
                                placeholder="0.18"
                                className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm font-mono text-black placeholder:text-black/40 focus:border-[#FC7819] focus:outline-hidden focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white transition-colors"
                            />
                            <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    = {(igvValue * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Estándar nacional en Perú: <span className="font-semibold text-foreground">0.18</span> (18% de IGV). Usa <span className="font-semibold text-foreground">0</span> si tus productos son exonerados.
                        </p>

                        <div className="pt-2">
                            <Button
                                onClick={() => executeIgv({ value: igvValue, isActive: igvActive, id: initialIgv?.id })}
                                disabled={statusIgv === 'executing'}
                                className="w-full sm:w-auto gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                            >
                                <Save className="size-3.5" />
                                <span>{statusIgv === 'executing' ? 'Guardando...' : 'Guardar Tasa de IGV'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Simulación en tiempo real */}
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Calculator className="size-3.5 text-muted-foreground" />
                            <span>Ejemplo de Facturación con IGV ({(igvValue * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal (Base Imponible):</span>
                                <span className="font-mono">S/ 100.00</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>IGV Aplicable ({(igvValue * 100).toFixed(0)}%):</span>
                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                    + S/ {(100 * igvValue).toFixed(2)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-border/70 flex justify-between font-bold text-foreground">
                                <span>Total con Comprobante:</span>
                                <span className="font-mono">
                                    S/ {(100 + 100 * igvValue).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 2: TIPOS DE DOCUMENTO (USANDO PATRÓN LIST-02 / NOTIFICATIONS) */}
            <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Tipos de Documento de Identidad
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Documentos válidos para clientes, proveedores y emisión de comprobantes de pago.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsModalDocOpen(true)}
                        className="gap-2 self-start sm:self-auto text-xs font-semibold cursor-pointer shadow-xs"
                    >
                        <Plus className="size-4" />
                        <span>Agregar Documento</span>
                    </Button>
                </div>

                {/* Listado de Documentos */}
                {documentos.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-border/80 p-8 text-center space-y-2">
                        <p className="text-sm font-medium text-foreground">No hay tipos de documento registrados</p>
                        <p className="text-xs text-muted-foreground">Haz clic en &quot;Agregar Documento&quot; para registrar DNI, RUC, Pasaporte, etc.</p>
                    </div>
                ) : (
                    <ItemGroup className="space-y-3">
                        {documentos.map((doc) => {
                            const isActivo = doc.estado !== false;
                            return (
                                <Item
                                    key={doc.id}
                                    variant="outline"
                                    className="p-3 sm:p-4 rounded-xl hover:border-black/25 dark:hover:border-white/25 transition-all shadow-2xs"
                                >
                                    <ItemMedia
                                        variant="icon"
                                        className="size-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0"
                                    >
                                        {getDocumentIcon(doc.nombre)}
                                    </ItemMedia>

                                    <ItemContent>
                                        <div className="flex items-center gap-2">
                                            <ItemTitle className="font-semibold text-sm text-foreground">
                                                {doc.nombre}
                                            </ItemTitle>
                                            <Badge
                                                variant={isActivo ? 'default' : 'secondary'}
                                                className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider"
                                            >
                                                {isActivo ? 'Habilitado' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                        <ItemDescription className="text-xs text-muted-foreground">
                                            {getDocumentDescription(doc.nombre)}
                                        </ItemDescription>
                                    </ItemContent>

                                    <ItemActions className="gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                                {isActivo ? 'Activo' : 'Desactivado'}
                                            </span>
                                            <Switch
                                                checked={isActivo}
                                                onCheckedChange={(checked) => handleToggleDocumento(doc.id, checked)}
                                                aria-label={`Alternar estado de ${doc.nombre}`}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDocumento(doc.id, doc.nombre)}
                                            title={`Eliminar ${doc.nombre}`}
                                            className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </ItemActions>
                                </Item>
                            );
                        })}
                    </ItemGroup>
                )}
            </section>

            {/* SECCIÓN 3: RECARGO POR PAGO CON TARJETA */}
            <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-[#FC7819] shrink-0">
                        <CreditCard className="size-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Recargo por Pago con Tarjeta
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Porcentaje adicional cobrado al procesar pagos con tarjeta de débito o crédito (Izipay, Niubiz, POS).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Input y Guardar */}
                    <div className="space-y-3">
                        <label htmlFor="input-recargo-tarjeta" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70">
                            Porcentaje de Recargo (Decimal)
                        </label>
                        <div className="relative flex items-center">
                            <input
                                id="input-recargo-tarjeta"
                                type="number"
                                step="0.005"
                                min="0"
                                max="1"
                                value={isNaN(recargoTarjeta) ? '' : recargoTarjeta}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setRecargoTarjeta(isNaN(val) ? 0 : val);
                                }}
                                placeholder="0.05"
                                className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm font-mono text-black placeholder:text-black/40 focus:border-[#FC7819] focus:outline-hidden focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white transition-colors"
                            />
                            <div className="absolute right-3 flex items-center pointer-events-none">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-[#FC7819]">
                                    = {(recargoTarjeta * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Valor habitual en comercios: <span className="font-semibold text-foreground">0.05</span> (5.0%). Este recargo se sumará automáticamente a las ventas cobradas mediante tarjeta.
                        </p>

                        <div className="pt-2">
                            <Button
                                onClick={() => executeConfiguracion({ recargoTarjeta, comisionVendedor })}
                                disabled={statusConfiguracion === 'executing'}
                                className="w-full sm:w-auto gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                            >
                                <Save className="size-3.5" />
                                <span>{statusConfiguracion === 'executing' ? 'Guardando...' : 'Guardar Recargo'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Simulación en tiempo real */}
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Calculator className="size-3.5 text-muted-foreground" />
                            <span>Simulación de Cobro con Tarjeta ({(recargoTarjeta * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Venta neta de productos:</span>
                                <span className="font-mono">S/ 100.00</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Recargo POS ({(recargoTarjeta * 100).toFixed(1)}%):</span>
                                <span className="font-mono font-medium text-[#FC7819]">
                                    + S/ {(100 * recargoTarjeta).toFixed(2)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-border/70 flex justify-between font-bold text-foreground">
                                <span>Total debitado en POS:</span>
                                <span className="font-mono">
                                    S/ {(100 + 100 * recargoTarjeta).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 4: COMISIÓN DEL VENDEDOR */}
            <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <TrendingUp className="size-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Comisión del Vendedor
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Porcentaje de incentivo económico asignado a los vendedores sobre las ventas concretadas.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Input y Guardar */}
                    <div className="space-y-3">
                        <label htmlFor="input-comision-vendedor" className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70">
                            Porcentaje de Comisión (Decimal)
                        </label>
                        <div className="relative flex items-center">
                            <input
                                id="input-comision-vendedor"
                                type="number"
                                step="0.005"
                                min="0"
                                max="1"
                                value={isNaN(comisionVendedor) ? '' : comisionVendedor}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setComisionVendedor(isNaN(val) ? 0 : val);
                                }}
                                placeholder="0.03"
                                className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm font-mono text-black placeholder:text-black/40 focus:border-[#FC7819] focus:outline-hidden focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-white/5 dark:text-white transition-colors"
                            />
                            <div className="absolute right-3 flex items-center pointer-events-none">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    = {(comisionVendedor * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tasa general recomendada: <span className="font-semibold text-foreground">0.03</span> (3.0%). Se utiliza para el cálculo automático en liquidaciones de comisiones.
                        </p>

                        <div className="pt-2">
                            <Button
                                onClick={() => executeConfiguracion({ recargoTarjeta, comisionVendedor })}
                                disabled={statusConfiguracion === 'executing'}
                                className="w-full sm:w-auto gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                            >
                                <Save className="size-3.5" />
                                <span>{statusConfiguracion === 'executing' ? 'Guardando...' : 'Guardar Comisión'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Simulación en tiempo real */}
                    <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Calculator className="size-3.5 text-muted-foreground" />
                            <span>Proyección de Comisión Mensual ({(comisionVendedor * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Volumen de ventas mensual:</span>
                                <span className="font-mono">S/ 10,000.00</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tasa acordada:</span>
                                <span className="font-mono font-medium">{(comisionVendedor * 100).toFixed(1)}%</span>
                            </div>
                            <div className="pt-2 border-t border-border/70 flex justify-between font-bold text-foreground">
                                <span>Comisión liquidable:</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                    S/ {(10000 * comisionVendedor).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal para agregar nuevo documento */}
            <ModalNewTipoDocumento
                isOpen={isModalDocOpen}
                onClose={() => setIsModalDocOpen(false)}
                onSuccess={(newDoc) => {
                    setDocumentos((prev) => [newDoc, ...prev]);
                }}
            />
        </div>
    );
}
