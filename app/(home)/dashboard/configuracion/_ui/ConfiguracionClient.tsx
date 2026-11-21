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
    Star,
    Copy,
    MapPin,
    ShieldCheck,
    AlertTriangle,
    Loader2,
    Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle, ItemGroup } from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    updateConfiguracionAction,
} from '@/server/actions/configuracion/configuracion-actions';
import { newIgvAction } from '@/server/actions/igv/new-igv-action';
import {
    toggleTipoDocumentoAction,
    deleteTipoDocumentoAction,
} from '@/server/actions/tipo-documento/tipo-documento-actions';
import {
    toggleRucEmpresaAction,
    setRucPrincipalAction,
    deleteRucEmpresaAction,
} from '@/server/actions/ruc/ruc-actions';
import ModalNewTipoDocumento from './ModalNewTipoDocumento';
import ModalNewRucEmpresa from './ModalNewRucEmpresa';
import type { RucEmpresa } from '@/server/schema/ruc';

interface TipoDocItem {
    id: string;
    nombre: string;
    estado: boolean | null;
    createdAt?: Date;
}

type DeleteTarget =
    | {
          type: 'ruc';
          id: string;
          numeroRuc: string;
          razonSocial: string;
          esPrincipal: boolean;
      }
    | {
          type: 'documento';
          id: string;
          nombre: string;
      }
    | null;

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
    initialRucs?: RucEmpresa[];
}

export default function ConfiguracionClient({
    initialIgv,
    initialTiposDocumento,
    initialConfiguracion,
    initialRucs = [],
}: Props) {
    // 1. Estado para el IGV
    const [igvValue, setIgvValue] = useState<number>(initialIgv?.value ?? 0.18);
    const [igvActive, setIgvActive] = useState<boolean>(initialIgv?.isActive ?? true);

    // 2. Estado para RUCs de la empresa (Multi-RUC)
    const [rucs, setRucs] = useState<RucEmpresa[]>(initialRucs);
    const [selectedRucId, setSelectedRucId] = useState<string>(
        initialRucs.find((r) => r.esPrincipal)?.id || initialRucs[0]?.id || ''
    );
    const [isModalRucOpen, setIsModalRucOpen] = useState(false);
    const [editingRuc, setEditingRuc] = useState<RucEmpresa | null>(null);

    // RUC seleccionado actual
    const selectedRuc = rucs.find((r) => r.id === selectedRucId) || rucs[0] || null;

    // 3. Estado para el listado de tipos de documento
    const [documentos, setDocumentos] = useState<TipoDocItem[]>(initialTiposDocumento);
    const [isModalDocOpen, setIsModalDocOpen] = useState(false);

    // 4. Estado para el recargo por pago con tarjeta
    const [recargoTarjeta, setRecargoTarjeta] = useState<number>(
        initialConfiguracion?.recargoTarjeta ?? 0.05
    );

    // 5. Estado para la comisión del vendedor
    const [comisionVendedor, setComisionVendedor] = useState<number>(
        initialConfiguracion?.comisionVendedor ?? 0.03
    );

    // 6. Estado para diálogo de confirmación de eliminación
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    // Acciones del servidor: RUC Empresa
    const { execute: executeToggleRuc } = useAction(toggleRucEmpresaAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) toast.success(data.msg);
            else if (data?.msg) toast.error(data.msg);
        },
        onError: () => toast.error('Error al actualizar el estado del RUC'),
    });

    const { execute: executeSetPrincipal } = useAction(setRucPrincipalAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) toast.success(data.msg);
            else if (data?.msg) toast.error(data.msg);
        },
        onError: () => toast.error('Error al cambiar el RUC principal'),
    });

    const { execute: executeDeleteRuc, status: statusDeleteRuc } = useAction(deleteRucEmpresaAction, {
        onSuccess: ({ data, input }) => {
            if (data?.ok) {
                toast.success(data.msg);
                setRucs((prev) => {
                    const next = prev.filter((r) => r.id !== input.id);
                    if (selectedRucId === input.id) {
                        setSelectedRucId(next[0]?.id || '');
                    }
                    return next;
                });
            } else if (data?.msg) {
                toast.error(data.msg);
            }
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error('Error al eliminar el RUC');
            setDeleteTarget(null);
        },
    });

    // Manejadores para RUCs
    const handleToggleRuc = (id: string, nuevoEstado: boolean) => {
        setRucs((prev) =>
            prev.map((r) => (r.id === id ? { ...r, activo: nuevoEstado } : r))
        );
        executeToggleRuc({ id, activo: nuevoEstado });
    };

    const handleSetPrincipal = (id: string) => {
        setRucs((prev) =>
            prev.map((r) => ({ ...r, esPrincipal: r.id === id, activo: r.id === id ? true : r.activo }))
        );
        executeSetPrincipal({ id });
    };

    const handleDeleteRuc = (ruc: RucEmpresa) => {
        setDeleteTarget({
            type: 'ruc',
            id: ruc.id,
            numeroRuc: ruc.numeroRuc,
            razonSocial: ruc.razonSocial || ruc.nombre,
            esPrincipal: ruc.esPrincipal,
        });
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado al portapapeles`);
    };

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

    const { execute: executeDeleteDoc, status: statusDeleteDoc } = useAction(deleteTipoDocumentoAction, {
        onSuccess: ({ data, input }) => {
            if (data?.ok) {
                toast.success(data.msg);
                setDocumentos((prev) => prev.filter((d) => d.id !== input.id));
            } else if (data?.msg) {
                toast.error(data.msg);
            }
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error('Error al eliminar el documento');
            setDeleteTarget(null);
        },
    });

    const isDeleting = statusDeleteRuc === 'executing' || statusDeleteDoc === 'executing';

    // Manejador toggle documento
    const handleToggleDocumento = (id: string, nuevoEstado: boolean) => {
        setDocumentos((prev) =>
            prev.map((d) => (d.id === id ? { ...d, estado: nuevoEstado } : d))
        );
        executeToggleDoc({ id, estado: nuevoEstado });
    };

    // Manejador eliminar documento
    const handleDeleteDocumento = (id: string, nombre: string) => {
        setDeleteTarget({
            type: 'documento',
            id,
            nombre,
        });
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget || isDeleting) return;
        if (deleteTarget.type === 'ruc') {
            executeDeleteRuc({ id: deleteTarget.id });
        } else {
            executeDeleteDoc({ id: deleteTarget.id });
        }
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

            {/* SECCIÓN 2: RAZÓN SOCIAL Y RUCS EMISORES (MULTI-RUC) */}
            <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6 shadow-xs dark:border-white/10 dark:bg-white/2 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                    Razón Social y RUCs Emisores (Multi-RUC)
                                </h2>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold">
                                    {rucs.length} {rucs.length === 1 ? 'RUC registrado' : 'RUCs registrados'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Administra las empresas y RUCs con los que tu negocio emite comprobantes de pago ante SUNAT.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setEditingRuc(null);
                            setIsModalRucOpen(true);
                        }}
                        className="gap-2 self-start sm:self-auto text-xs font-semibold cursor-pointer shadow-xs"
                    >
                        <Plus className="size-4" />
                        <span>Agregar RUC</span>
                    </Button>
                </div>

                {/* Listado / Selección de RUCs */}
                {rucs.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-border/80 p-8 text-center space-y-3">
                        <div className="mx-auto size-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                            <Building2 className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">No hay RUCs registrados en el sistema</p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Agrega los RUCs y razones sociales de tus empresas para emitir boletas, facturas y tickets desde cualquier sucursal.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingRuc(null);
                                setIsModalRucOpen(true);
                            }}
                            className="gap-1.5 text-xs font-semibold cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Registrar Primer RUC</span>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        {/* Columna Izquierda: Select de RUCs y Controles de Estado */}
                        <div className="md:col-span-6 space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="select-ruc-empresa"
                                    className="block text-xs font-semibold uppercase tracking-wider text-black/70 dark:text-white/70"
                                >
                                    Seleccionar RUC para Consultar o Editar
                                </label>
                                <div className="relative">
                                    <select
                                        id="select-ruc-empresa"
                                        value={selectedRuc?.id || ''}
                                        onChange={(e) => setSelectedRucId(e.target.value)}
                                        className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-xs font-medium text-black focus:border-[#FC7819] focus:outline-hidden focus:ring-1 focus:ring-[#FC7819] dark:border-white/15 dark:bg-neutral-900 dark:text-white transition-colors cursor-pointer"
                                    >
                                        {rucs.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.numeroRuc} — {r.nombre || r.razonSocial} {r.esPrincipal ? '★ (Principal)' : ''} {!r.activo ? '(Inactivo)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Elige un RUC del menú desplegable para revisar sus datos fiscales, cambiar su estado o establecerlo como predeterminado.
                                </p>
                            </div>

                            {/* Acciones Rápidas sobre el RUC seleccionado */}
                            {selectedRuc && (
                                <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-3 text-xs">
                                    {/* Control RUC Principal */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                <Star className={`size-3.5 ${selectedRuc.esPrincipal ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                                                <span>RUC Principal del Negocio</span>
                                            </span>
                                            <span className="text-[11px] text-muted-foreground block">
                                                {selectedRuc.esPrincipal
                                                    ? 'Este RUC es el predeterminado para ventas nuevas en el POS.'
                                                    : 'Haz clic en el botón para que sea el RUC por defecto del negocio.'}
                                            </span>
                                        </div>
                                        {!selectedRuc.esPrincipal && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="xs"
                                                onClick={() => handleSetPrincipal(selectedRuc.id)}
                                                className="h-7 text-[11px] font-semibold gap-1 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer shrink-0"
                                            >
                                                <Star className="size-3" />
                                                <span>Hacer Principal</span>
                                            </Button>
                                        )}
                                    </div>

                                    <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-3">
                                        <div>
                                            <span className="font-semibold text-foreground block">
                                                Habilitado para Facturación
                                            </span>
                                            <span className="text-[11px] text-muted-foreground block">
                                                {selectedRuc.activo
                                                    ? 'Aparece como opción disponible al cobrar en caja.'
                                                    : 'Oculto en el selector de comprobantes de ventas.'}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={selectedRuc.activo}
                                            onCheckedChange={(checked) => handleToggleRuc(selectedRuc.id, checked)}
                                            aria-label={`Alternar estado de ${selectedRuc.numeroRuc}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Ficha Tributaria del RUC Seleccionado */}
                        <div className="md:col-span-6">
                            {selectedRuc ? (
                                <div className="rounded-xl border border-border/80 bg-muted/15 p-4 sm:p-5 space-y-3.5 shadow-2xs">
                                    {/* Header de la Ficha */}
                                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                                Ficha Tributaria Oficial
                                            </span>
                                            <h3 className="text-base font-bold text-foreground truncate mt-0.5">
                                                {selectedRuc.razonSocial || selectedRuc.nombre}
                                            </h3>
                                            {selectedRuc.nombre && selectedRuc.nombre !== selectedRuc.razonSocial && (
                                                <span className="text-xs text-muted-foreground block truncate">
                                                    Alias / Comercial: <strong>{selectedRuc.nombre}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {selectedRuc.esPrincipal && (
                                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px] font-bold gap-1">
                                                    <Star className="size-2.5 fill-current" />
                                                    <span>Principal</span>
                                                </Badge>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-semibold ${selectedRuc.activo ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' : 'bg-muted text-muted-foreground'}`}
                                            >
                                                {selectedRuc.activo ? 'Activo SUNAT' : 'Inactivo'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Datos en Fila */}
                                    <div className="space-y-2.5 text-xs">
                                        {/* RUC */}
                                        <div className="flex items-center justify-between py-1 border-b border-border/40">
                                            <span className="text-muted-foreground">Número de RUC:</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-foreground text-sm tracking-wide">
                                                    {selectedRuc.numeroRuc}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(selectedRuc.numeroRuc, 'RUC')}
                                                    title="Copiar RUC"
                                                    className="size-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                                >
                                                    <Copy className="size-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dirección Fiscal */}
                                        <div className="flex items-start justify-between py-1 border-b border-border/40 gap-3">
                                            <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                                                <MapPin className="size-3" /> Dirección:
                                            </span>
                                            <span className="text-right text-foreground font-medium">
                                                {selectedRuc.direccionFiscal || 'No registrada en ficha'}
                                            </span>
                                        </div>

                                        {/* Contacto / Correo */}
                                        {(selectedRuc.telefono || selectedRuc.email) && (
                                            <div className="flex items-center justify-between py-1 border-b border-border/40 gap-3">
                                                <span className="text-muted-foreground shrink-0">Contacto:</span>
                                                <span className="text-right text-foreground font-mono text-[11px]">
                                                    {[selectedRuc.telefono, selectedRuc.email].filter(Boolean).join(' · ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Botones de Edición y Eliminación */}
                                    <div className="pt-2 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={() => {
                                                setEditingRuc(selectedRuc);
                                                setIsModalRucOpen(true);
                                            }}
                                            className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer"
                                        >
                                            <Pencil className="size-3" />
                                            <span>Editar RUC</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => handleDeleteRuc(selectedRuc)}
                                            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer"
                                        >
                                            <Trash2 className="size-3" />
                                            <span>Eliminar RUC</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}
            </section>

            {/* SECCIÓN 3: TIPOS DE DOCUMENTO (USANDO PATRÓN LIST-02 / NOTIFICATIONS) */}
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

            {/* Modal para registrar o editar RUC de empresa */}
            {isModalRucOpen && (
                <ModalNewRucEmpresa
                    isOpen={isModalRucOpen}
                    rucToEdit={editingRuc}
                    onClose={() => {
                        setIsModalRucOpen(false);
                        setEditingRuc(null);
                    }}
                    onSuccess={(savedRuc) => {
                        setRucs((prev) => {
                            const exists = prev.some((r) => r.id === savedRuc.id);
                            const updated = exists
                                ? prev.map((r) => (r.id === savedRuc.id ? savedRuc : r))
                                : [savedRuc, ...prev];
                            if (savedRuc.esPrincipal) {
                                return updated.map((r) =>
                                    r.id === savedRuc.id ? r : { ...r, esPrincipal: false }
                                );
                            }
                            return updated;
                        });
                        setSelectedRucId(savedRuc.id);
                    }}
                />
            )}
            {/* Diálogo de confirmación para eliminación */}
            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent className="sm:max-w-md gap-5 p-6">
                    <AlertDialogHeader className="gap-2">
                        <AlertDialogMedia className="size-11 rounded-lg bg-destructive/10 text-destructive mb-1 *:[svg:not([class*='size-'])]:size-5">
                            <AlertTriangle />
                        </AlertDialogMedia>
                        <AlertDialogTitle className="text-base font-semibold tracking-tight text-foreground">
                            {deleteTarget?.type === 'ruc'
                                ? `¿Eliminar RUC ${deleteTarget.numeroRuc}?`
                                : deleteTarget?.type === 'documento'
                                ? `¿Eliminar "${deleteTarget.nombre}"?`
                                : 'Confirmar eliminación'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
                            {deleteTarget?.type === 'ruc' ? (
                                <>
                                    Se eliminará permanentemente{' '}
                                    <span className="font-semibold text-foreground">
                                        {deleteTarget.razonSocial}
                                    </span>{' '}
                                    (<span className="font-mono text-foreground">{deleteTarget.numeroRuc}</span>) del
                                    catálogo de RUCs emisores. Esta acción no se puede deshacer y solo procederá si no
                                    tiene sucursales, ventas ni comprobantes asociados.
                                </>
                            ) : deleteTarget?.type === 'documento' ? (
                                <>
                                    Se eliminará el tipo de documento{' '}
                                    <span className="font-semibold text-foreground">{deleteTarget.nombre}</span> del
                                    catálogo del sistema. Esta acción no se puede deshacer.
                                </>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteTarget?.type === 'ruc' && deleteTarget.esPrincipal && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
                            Este RUC está marcado actualmente como <strong>RUC Principal</strong>. Si lo eliminas,
                            recuerda asignar otro RUC como predeterminado para el POS.
                        </div>
                    )}

                    <AlertDialogFooter className="pt-1">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            className="text-xs cursor-pointer"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="text-xs font-semibold gap-1.5 cursor-pointer"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Eliminando...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>Sí, eliminar</span>
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
