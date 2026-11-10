'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    XIcon,
    CoinsIcon,
    BanknoteIcon,
    CreditCardIcon,
    DownloadIcon,
    PrinterIcon,
    CheckCircle2Icon,
    SearchIcon,
    Loader2Icon,
    UserIcon,
    FileTextIcon,
    RotateCcwIcon,
    SparklesIcon,
    AlertCircleIcon,
    CheckIcon,
    ShoppingBagIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { Sucursal, TipoDocumentoDto, TipoPagoDto } from '@/interfaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getInfoDocumento, getRucBusiness } from '@/server/actions/get-info-dni-ruc';
import TicketVenta, {
    TicketGeneratedData,
    CartCheckoutItem,
    downloadTicketImage,
    printTicket
} from './TicketVenta';

export type { TicketGeneratedData, CartCheckoutItem };

export interface TipoComprobantePosItem {
    id: string;
    nombre: string;
    serie: string;
    numero?: string;
    nombreSunat?: string | null;
    correlative?: number;
}

interface ModalCobrarVentaProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartCheckoutItem[];
    subtotal?: number;
    igvTotal: number;
    total: number;
    sucursal: Sucursal;
    vendedorNombre: string;
    tipoDocumentos?: TipoDocumentoDto[];
    tiposComprobante?: TipoComprobantePosItem[];
    tiposPago?: TipoPagoDto[];
    onConfirmSale: (saleData: TicketGeneratedData) => void;
}

// Monedas y billetes nominales vigentes en Perú (en Soles)
const DENOMINACIONES_PERU = [
    { valor: 1, tipo: 'moneda' as const, label: 'S/ 1' },
    { valor: 2, tipo: 'moneda' as const, label: 'S/ 2' },
    { valor: 5, tipo: 'moneda' as const, label: 'S/ 5' },
    { valor: 10, tipo: 'billete' as const, label: 'S/ 10' },
    { valor: 20, tipo: 'billete' as const, label: 'S/ 20' },
    { valor: 50, tipo: 'billete' as const, label: 'S/ 50' },
    { valor: 100, tipo: 'billete' as const, label: 'S/ 100' },
    { valor: 200, tipo: 'billete' as const, label: 'S/ 200' },
];

const DEFAULT_TIPOS_DOCUMENTO: { id: string; nombre: string }[] = [
    { id: 'doc-dni', nombre: 'DNI' },
    { id: 'doc-ruc', nombre: 'RUC' },
    { id: 'doc-ce', nombre: 'Carnet de Extranjería' },
    { id: 'doc-pasaporte', nombre: 'Pasaporte' },
    { id: 'doc-sin-doc', nombre: 'Sin Documento' },
];

const DEFAULT_TIPOS_COMPROBANTE: TipoComprobantePosItem[] = [
    {
        id: 'comp-ticket',
        nombre: 'Ticket de Venta',
        serie: 'T001',
        nombreSunat: 'TICKET DE VENTA',
        correlative: 1,
    },
    {
        id: 'comp-boleta',
        nombre: 'Boleta de Venta',
        serie: 'B001',
        nombreSunat: 'BOLETA DE VENTA ELECTRÓNICA',
        correlative: 1,
    },
    {
        id: 'comp-factura',
        nombre: 'Factura',
        serie: 'F001',
        nombreSunat: 'FACTURA ELECTRÓNICA',
        correlative: 1,
    },
];

const DEFAULT_TIPOS_PAGO: { id: string; nombre: string }[] = [
    { id: 'pago-efectivo', nombre: 'Efectivo' },
    { id: 'pago-tarjeta', nombre: 'Tarjeta' },
    { id: 'pago-plin', nombre: 'PLIN' },
    { id: 'pago-yape', nombre: 'YAPE' },
    { id: 'pago-deposito', nombre: 'Deposito' },
    { id: 'pago-falta-pagar', nombre: 'Falta pagar' },
];

export default function ModalCobrarVenta({
    isOpen,
    onClose,
    cart,
    igvTotal,
    total,
    sucursal,
    vendedorNombre,
    tipoDocumentos = [],
    tiposComprobante = [],
    tiposPago = [],
    onConfirmSale,
}: ModalCobrarVentaProps) {
    // Catálogo de tipos de documento (DB + respaldo)
    const documentosCatalog = useMemo(() => {
        if (tipoDocumentos && tipoDocumentos.length > 0) {
            const hasSinDoc = tipoDocumentos.some((d) =>
                d.nombre.toLowerCase().includes('sin doc')
            );
            return hasSinDoc
                ? tipoDocumentos.map((d) => ({ id: d.id, nombre: d.nombre }))
                : [
                    ...tipoDocumentos.map((d) => ({ id: d.id, nombre: d.nombre })),
                    { id: 'doc-sin-doc', nombre: 'Sin Documento' },
                ];
        }
        return DEFAULT_TIPOS_DOCUMENTO;
    }, [tipoDocumentos]);

    // Catálogo de tipos de comprobante para venta en POS (Ticket, Boleta, Factura)
    const comprobantesCatalog = useMemo(() => {
        const filtered = (tiposComprobante || []).filter(
            (c) => !c.nombre.toLowerCase().includes('liquidac')
        );
        if (filtered.length > 0) {
            return filtered;
        }
        return DEFAULT_TIPOS_COMPROBANTE;
    }, [tiposComprobante]);

    // Catálogo de tipos de pago (DB o seed por defecto)
    const pagosCatalog = useMemo(() => {
        if (tiposPago && tiposPago.length > 0) {
            return tiposPago.map((p) => ({ id: p.id, nombre: p.nombre }));
        }
        return DEFAULT_TIPOS_PAGO;
    }, [tiposPago]);

    // Defaults iniciales
    const defaultTipoDocId = useMemo(() => {
        const dni = documentosCatalog.find((d) => d.nombre.toUpperCase() === 'DNI');
        return dni?.id || documentosCatalog[0]?.id || '';
    }, [documentosCatalog]);

    const defaultTipoComprobanteId = useMemo(() => {
        const ticketOrBoleta =
            comprobantesCatalog.find((c) => c.nombre.toLowerCase().includes('ticket')) ||
            comprobantesCatalog.find((c) => c.nombre.toLowerCase().includes('boleta'));
        return ticketOrBoleta?.id || comprobantesCatalog[0]?.id || '';
    }, [comprobantesCatalog]);

    const defaultTipoPagoId = useMemo(() => {
        const efectivo = pagosCatalog.find((p) => p.nombre.toLowerCase() === 'efectivo');
        return efectivo?.id || pagosCatalog[0]?.id || '';
    }, [pagosCatalog]);

    // Estados del formulario de cobro
    const [selectedTipoDocId, setSelectedTipoDocId] = useState<string>(defaultTipoDocId);
    const [numeroDocumento, setNumeroDocumento] = useState<string>('');
    const [clienteNombre, setClienteNombre] = useState<string>('');
    const [clienteDireccion, setClienteDireccion] = useState<string>('');
    const [selectedTipoComprobanteId, setSelectedTipoComprobanteId] = useState<string>(defaultTipoComprobanteId);
    const [selectedTipoPagoId, setSelectedTipoPagoId] = useState<string>(defaultTipoPagoId);
    const [montoRecibidoInput, setMontoRecibidoInput] = useState<string>('');
    const [hasUsedKeypad, setHasUsedKeypad] = useState<boolean>(false);
    const [isSearchingDoc, setIsSearchingDoc] = useState<boolean>(false);

    // Estado del ticket generado tras cobrar
    const [generatedTicket, setGeneratedTicket] = useState<TicketGeneratedData | null>(null);
    const [ticketSequence, setTicketSequence] = useState<number>(1);

    const handleCloseModal = () => {
        setSelectedTipoDocId(defaultTipoDocId);
        setNumeroDocumento('');
        setClienteNombre('');
        setClienteDireccion('');
        setSelectedTipoComprobanteId(defaultTipoComprobanteId);
        setSelectedTipoPagoId(defaultTipoPagoId);
        setMontoRecibidoInput('');
        setHasUsedKeypad(false);
        setGeneratedTicket(null);
        setIsSearchingDoc(false);
        onClose();
    };

    // Cerrar con tecla Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const selectedTipoDoc = useMemo(
        () => documentosCatalog.find((d) => d.id === selectedTipoDocId) || documentosCatalog[0],
        [documentosCatalog, selectedTipoDocId]
    );

    const selectedComprobante = useMemo(
        () => comprobantesCatalog.find((c) => c.id === selectedTipoComprobanteId) || comprobantesCatalog[0],
        [comprobantesCatalog, selectedTipoComprobanteId]
    );

    const selectedTipoPago = useMemo(
        () => pagosCatalog.find((p) => p.id === selectedTipoPagoId) || pagosCatalog[0],
        [pagosCatalog, selectedTipoPagoId]
    );

    const isFaltaPagar = useMemo(() => {
        const name = (selectedTipoPago?.nombre || '').toLowerCase();
        return name.includes('falta pagar') || name.includes('credito') || name.includes('crédito');
    }, [selectedTipoPago]);

    const docNameUpper = (selectedTipoDoc?.nombre || '').toUpperCase();
    const isDni = docNameUpper === 'DNI';
    const isRuc = docNameUpper === 'RUC';
    const isSinDoc = docNameUpper.includes('SIN DOC');

    const displayedMontoInput = hasUsedKeypad
        ? montoRecibidoInput
        : total > 0
            ? total.toFixed(2)
            : '0.00';

    const montoRecibido = useMemo(() => {
        const parsed = parseFloat(displayedMontoInput);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }, [displayedMontoInput]);

    const vuelto = useMemo(() => {
        return Math.max(0, Number((montoRecibido - total).toFixed(2)));
    }, [montoRecibido, total]);

    const faltante = useMemo(() => {
        return Math.max(0, Number((total - montoRecibido).toFixed(2)));
    }, [montoRecibido, total]);

    const opGravada = useMemo(() => {
        return Number((total - igvTotal).toFixed(2));
    }, [total, igvTotal]);

    // Correlativo estimado para vista previa
    const previewCorrelativo = useMemo(() => {
        const base = (selectedComprobante?.correlative ?? 0) + ticketSequence;
        return String(base).padStart(6, '0');
    }, [selectedComprobante, ticketSequence]);

    const previewSerie = useMemo(() => {
        if (selectedComprobante?.serie) return selectedComprobante.serie;
        const nameLower = (selectedComprobante?.nombre || '').toLowerCase();
        if (nameLower.includes('factura')) return 'F001';
        if (nameLower.includes('boleta')) return 'B001';
        return 'T001';
    }, [selectedComprobante]);

    // Al cambiar tipo de comprobante a Factura, sugerir RUC automáticamente
    const handleComprobanteChange = (newCompId: string) => {
        setSelectedTipoComprobanteId(newCompId);
        const comp = comprobantesCatalog.find((c) => c.id === newCompId);
        if (comp && comp.nombre.toLowerCase().includes('factura')) {
            const rucDoc = documentosCatalog.find((d) => d.nombre.toUpperCase() === 'RUC');
            if (rucDoc) {
                setSelectedTipoDocId(rucDoc.id);
            }
        }
    };

    // Al cambiar tipo de pago
    const handleTipoPagoChange = (newPagoId: string) => {
        setSelectedTipoPagoId(newPagoId);
        const pagoObj = pagosCatalog.find((p) => p.id === newPagoId);
        const name = (pagoObj?.nombre || '').toLowerCase();
        if (name.includes('falta pagar') || name.includes('credito') || name.includes('crédito')) {
            if (!hasUsedKeypad) {
                setHasUsedKeypad(true);
                setMontoRecibidoInput('0.00');
            }
        } else if (name.includes('tarjeta') || name.includes('yape') || name.includes('plin') || name.includes('deposito')) {
            if (!hasUsedKeypad || montoRecibido === 0) {
                setHasUsedKeypad(false);
                setMontoRecibidoInput(total.toFixed(2));
            }
        }
    };

    // Botonera de montos nominales en Soles (1, 2, 5, 10, 20, 50, 100, 200)
    const handleAddDenominacion = (valor: number) => {
        if (!hasUsedKeypad) {
            setHasUsedKeypad(true);
            setMontoRecibidoInput(valor.toFixed(2));
        } else {
            const nuevoMonto = Number((montoRecibido + valor).toFixed(2));
            setMontoRecibidoInput(nuevoMonto.toFixed(2));
        }
    };

    const handleSetExactAmount = () => {
        setHasUsedKeypad(false);
        setMontoRecibidoInput(total.toFixed(2));
    };

    const handleClearAmount = () => {
        setHasUsedKeypad(true);
        setMontoRecibidoInput('0.00');
    };

    // Consulta opcional DNI / RUC
    const handleSearchCustomerDoc = async () => {
        const cleanDoc = numeroDocumento.trim();
        if (!cleanDoc) {
            toast.warning('Ingresa un número de documento para buscar');
            return;
        }
        if (isDni && cleanDoc.length !== 8) {
            toast.error('El DNI debe tener 8 dígitos');
            return;
        }
        if (isRuc && cleanDoc.length !== 11) {
            toast.error('El RUC debe tener 11 dígitos');
            return;
        }

        setIsSearchingDoc(true);
        try {
            if (isRuc) {
                const res = await getRucBusiness(cleanDoc);
                if (res?.ok && res.data) {
                    setClienteNombre(res.data.name || '');
                    setClienteDireccion(res.data.address?.trim() || '');
                    toast.success('Datos de RUC obtenidos correctamente');
                } else {
                    toast.error(res?.msg || 'No se encontraron datos para el RUC ingresado');
                }
            } else if (isDni) {
                const res = await getInfoDocumento(selectedTipoDocId, cleanDoc);
                if (res?.ok && res.data && 'nombres' in res.data) {
                    const nombreCompleto = `${res.data.nombres} ${res.data.apellidos}`.trim();
                    setClienteNombre(nombreCompleto);
                    toast.success('Datos de DNI obtenidos correctamente');
                } else {
                    toast.error(res?.msg || 'No se pudo consultar el DNI; puedes ingresar el nombre manualmente');
                }
            }
        } catch {
            toast.error('No se pudo conectar al servicio de consulta');
        } finally {
            setIsSearchingDoc(false);
        }
    };

    // Construir objeto de datos del ticket actual (para vista previa y para el ticket emitido)
    const currentTicketData: TicketGeneratedData = useMemo(() => {
        if (generatedTicket) return generatedTicket;

        const now = new Date();
        const fechaEmision = now.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        const horaEmision = now.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        const compSunat =
            selectedComprobante?.nombreSunat ||
            (selectedComprobante?.nombre.toLowerCase().includes('factura')
                ? 'FACTURA ELECTRÓNICA'
                : selectedComprobante?.nombre.toLowerCase().includes('boleta')
                    ? 'BOLETA DE VENTA ELECTRÓNICA'
                    : 'TICKET DE VENTA');

        return {
            numeroTicket: `${previewSerie}-${previewCorrelativo}`,
            fechaEmision,
            horaEmision,
            tipoComprobanteNombre: selectedComprobante?.nombre || 'Ticket de Venta',
            tipoComprobanteSunat: compSunat,
            serie: previewSerie,
            correlativo: previewCorrelativo,
            tipoDocumentoNombre: selectedTipoDoc?.nombre || 'DNI',
            numeroDocumento: isSinDoc ? '00000000' : numeroDocumento.trim() || '00000000',
            clienteNombre: clienteNombre.trim() || 'CLIENTE VARIOS',
            clienteDireccion: clienteDireccion.trim() || undefined,
            items: cart,
            opGravada,
            igv: igvTotal,
            total,
            montoRecibido,
            vuelto,
            sucursal,
            vendedorNombre,
            tipoPagoNombre: selectedTipoPago?.nombre || 'Efectivo',
            tipoPagoId: selectedTipoPago?.id,
        };
    }, [
        generatedTicket,
        selectedComprobante,
        selectedTipoPago,
        previewSerie,
        previewCorrelativo,
        selectedTipoDoc,
        isSinDoc,
        numeroDocumento,
        clienteNombre,
        clienteDireccion,
        cart,
        opGravada,
        igvTotal,
        total,
        montoRecibido,
        vuelto,
        sucursal,
        vendedorNombre,
    ]);

    // Confirmar el cobro y generar el ticket de venta
    const handleConfirmarCobro = (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        const isFactura = (selectedComprobante?.nombre || '').toLowerCase().includes('factura');

        if (isFactura && (!numeroDocumento.trim() || (isRuc && numeroDocumento.trim().length !== 11))) {
            toast.error('Para emitir Factura debes ingresar un número de RUC válido (11 dígitos)');
            return;
        }

        if (!isSinDoc && isDni && numeroDocumento.trim().length > 0 && numeroDocumento.trim().length !== 8) {
            toast.error('El número de DNI debe contener 8 dígitos');
            return;
        }

        if (!isFaltaPagar && montoRecibido < total) {
            toast.error(`El monto recibido (S/ ${montoRecibido.toFixed(2)}) es menor al total a cobrar (S/ ${total.toFixed(2)})`);
            return;
        }

        const ticketFinal: TicketGeneratedData = {
            ...currentTicketData,
            fechaEmision: new Date().toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }),
            horaEmision: new Date().toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
        };

        setGeneratedTicket(ticketFinal);
        setTicketSequence((prev) => prev + 1);
        onConfirmSale(ticketFinal);
        toast.success(`Cobro registrado • Comprobante ${ticketFinal.numeroTicket} generado`);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-modal-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleCloseModal();
            }}
        >
            <div className="relative w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
                {/* Cabecera del Modal */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg p-2 bg-primary/10 text-primary">
                            <CoinsIcon className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 id="checkout-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                                    {generatedTicket ? 'Comprobante Emitido' : 'Cobrar Venta y Emitir Comprobante'}
                                </h2>
                                <Badge variant="outline" className="font-mono text-[11px]">
                                    {currentTicketData.numeroTicket}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sucursal: <strong className="text-foreground">{sucursal.nombre}</strong> • {currentTicketData.items.reduce((a, b) => a + b.cantidad, 0)} {currentTicketData.items.reduce((a, b) => a + b.cantidad, 0) === 1 ? 'artículo' : 'artículos'}
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleCloseModal}
                        className="size-8 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label="Cerrar ventana de cobro"
                    >
                        <XIcon className="size-4" />
                    </Button>
                </div>

                {/* Cuerpo Principal Scrollable */}
                <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Columna Izquierda (7 cols): Formulario de Cobro, Documento, Comprobante y Botonera de Soles */}
                        <div className="lg:col-span-7 space-y-5">
                            {generatedTicket ? (
                                /* Vista de Confirmación Exitosa tras cobrar */
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6 space-y-5">
                                    <div className="flex items-start gap-3.5">
                                        <div className="rounded-full bg-emerald-500/15 p-3 text-emerald-600 dark:text-emerald-400 shrink-0">
                                            <CheckCircle2Icon className="size-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]">
                                                Venta Cobrada con Éxito
                                            </Badge>
                                            <h3 className="text-xl font-bold text-foreground">
                                                {generatedTicket.tipoComprobanteSunat}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Serie y correlativo: <strong className="font-mono text-foreground">{generatedTicket.numeroTicket}</strong> • Emitido el {generatedTicket.fechaEmision} a las {generatedTicket.horaEmision}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Resumen de Monto Cobrado y Vuelto */}
                                    <div className="grid grid-cols-3 gap-3 rounded-xl border bg-card p-4">
                                        <div>
                                            <span className="text-[11px] font-medium text-muted-foreground block">
                                                Total Cobrado
                                            </span>
                                            <span className="text-lg font-extrabold font-mono text-foreground">
                                                S/ {generatedTicket.total.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="border-x px-3">
                                            <span className="text-[11px] font-medium text-muted-foreground block">
                                                Monto Recibido
                                            </span>
                                            <span className="text-lg font-bold font-mono text-foreground">
                                                S/ {generatedTicket.montoRecibido.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="pl-1">
                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                                                Vuelto a Entregar
                                            </span>
                                            <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                                                S/ {generatedTicket.vuelto.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Datos del cliente en el comprobante */}
                                    <div className="rounded-xl border bg-card/80 p-3.5 text-xs space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cliente:</span>
                                            <strong className="text-foreground font-semibold">{generatedTicket.clienteNombre}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{generatedTicket.tipoDocumentoNombre}:</span>
                                            <span className="font-mono text-foreground">{generatedTicket.numeroDocumento}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Comprobante:</span>
                                            <span className="font-semibold text-foreground">{generatedTicket.tipoComprobanteNombre} ({generatedTicket.numeroTicket})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Método de Pago:</span>
                                            <strong className="text-foreground font-semibold uppercase">{generatedTicket.tipoPagoNombre || 'Efectivo'}</strong>
                                        </div>
                                    </div>

                                    {/* Acciones principales del comprobante */}
                                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={() => downloadTicketImage(generatedTicket)}
                                            className="flex-1 font-bold gap-2 cursor-pointer"
                                        >
                                            <DownloadIcon className="size-4" />
                                            <span>Descargar Comprobante (Ticket)</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => printTicket(generatedTicket)}
                                            className="gap-2 cursor-pointer"
                                        >
                                            <PrinterIcon className="size-4" />
                                            <span>Imprimir Ticket</span>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form id="pos-checkout-form" onSubmit={handleConfirmarCobro} className="space-y-5">
                                    {/* 1. Selección de Tipo de Comprobante y Datos del Cliente */}
                                    <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <FileTextIcon className="size-4 text-primary" />
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                    Comprobante, Tipo de Pago y Datos del Cliente
                                                </h3>
                                            </div>
                                            <span className="text-[11px] font-mono text-muted-foreground">
                                                Serie: <strong className="text-foreground">{previewSerie}</strong>
                                            </span>
                                        </div>

                                        {/* Fila 1: Tipo de Comprobante y Tipo de Pago */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {/* Select: Tipo de Comprobante */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="select-tipo-comprobante" className="text-xs font-semibold">
                                                    Tipo de Comprobante
                                                </Label>
                                                <select
                                                    id="select-tipo-comprobante"
                                                    value={selectedTipoComprobanteId}
                                                    onChange={(e) => handleComprobanteChange(e.target.value)}
                                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                                                >
                                                    {comprobantesCatalog.map((comp) => (
                                                        <option key={comp.id} value={comp.id}>
                                                            {comp.nombre} ({comp.serie})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Select: Tipo de Pago */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="select-tipo-pago" className="text-xs font-semibold flex items-center gap-1.5">
                                                        <CreditCardIcon className="size-3.5 text-primary" />
                                                        <span>Tipo / Método de Pago</span>
                                                    </Label>
                                                    {isFaltaPagar && (
                                                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase bg-amber-500/15 px-1.5 py-0.5 rounded">
                                                            Crédito / Pendiente
                                                        </span>
                                                    )}
                                                </div>
                                                <select
                                                    id="select-tipo-pago"
                                                    value={selectedTipoPagoId}
                                                    onChange={(e) => handleTipoPagoChange(e.target.value)}
                                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                                                >
                                                    {pagosCatalog.map((pago) => (
                                                        <option key={pago.id} value={pago.id}>
                                                            {pago.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Fila 2: Tipo de Documento y N° de Documento con botón consultar */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {/* Select: Tipo de Documento del Cliente */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="select-tipo-documento" className="text-xs font-semibold">
                                                    Tipo de Documento del Cliente
                                                </Label>
                                                <select
                                                    id="select-tipo-documento"
                                                    value={selectedTipoDocId}
                                                    onChange={(e) => {
                                                        setSelectedTipoDocId(e.target.value);
                                                        setNumeroDocumento('');
                                                    }}
                                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                                                >
                                                    {documentosCatalog.map((doc) => (
                                                        <option key={doc.id} value={doc.id}>
                                                            {doc.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Input: Número de Documento del Cliente + Botón Consultar */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="input-numero-documento" className="text-xs font-semibold">
                                                    N° de Documento ({selectedTipoDoc?.nombre || 'Cliente'})
                                                </Label>
                                                <div className="flex gap-1.5">
                                                    <Input
                                                        id="input-numero-documento"
                                                        type="text"
                                                        disabled={isSinDoc}
                                                        maxLength={isRuc ? 11 : isDni ? 8 : 20}
                                                        value={numeroDocumento}
                                                        onChange={(e) => {
                                                            const val = isDni || isRuc
                                                                ? e.target.value.replace(/\D/g, '')
                                                                : e.target.value;
                                                            setNumeroDocumento(val);
                                                        }}
                                                        placeholder={
                                                            isSinDoc
                                                                ? 'Sin documento (00000000)'
                                                                : isRuc
                                                                    ? 'Ej: 20601234567 (11 dígitos)'
                                                                    : isDni
                                                                        ? 'Ej: 71234567 (8 dígitos)'
                                                                        : 'Ingrese número de documento'
                                                        }
                                                        className="h-10 font-mono text-xs"
                                                    />
                                                    {(isDni || isRuc) && (
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={handleSearchCustomerDoc}
                                                            disabled={isSearchingDoc || !numeroDocumento.trim()}
                                                            className="h-10 px-3 shrink-0 cursor-pointer text-xs gap-1"
                                                            title="Consultar datos por DNI/RUC"
                                                        >
                                                            {isSearchingDoc ? (
                                                                <Loader2Icon className="size-3.5 animate-spin" />
                                                            ) : (
                                                                <SearchIcon className="size-3.5" />
                                                            )}
                                                            <span>Buscar</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fila 3: Input: Nombre o Razón Social del Cliente */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="input-nombre-cliente" className="text-xs font-semibold">
                                                Nombre o Razón Social (Opcional)
                                            </Label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    id="input-nombre-cliente"
                                                    type="text"
                                                    value={clienteNombre}
                                                    onChange={(e) => setClienteNombre(e.target.value)}
                                                    placeholder="Cliente Varios / Público General"
                                                    className="h-10 pl-8 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Sección de Cobro y Botonera Rápida de Monedas/Billetes de Perú */}
                                    <div className="rounded-xl border bg-muted/10 p-4 space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <BanknoteIcon className="size-4 text-primary" />
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                    Monto Recibido ({selectedTipoPago?.nombre || 'Efectivo'}) y Botonera Rápida (Soles - Perú)
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={handleSetExactAmount}
                                                    className="h-7 text-[11px] gap-1 cursor-pointer"
                                                >
                                                    <SparklesIcon className="size-3 text-primary" />
                                                    <span>Monto Exacto (S/ {total.toFixed(2)})</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="xs"
                                                    onClick={handleClearAmount}
                                                    className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-destructive cursor-pointer"
                                                >
                                                    <RotateCcwIcon className="size-3" />
                                                    <span>Limpiar</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Botonera de Denominaciones Peruanas: 1, 2, 5, 10, 20, 50, 100 y 200 Soles */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span>
                                                    {isFaltaPagar
                                                        ? 'Indica el monto a cuenta entregado por el cliente (o deja en 0.00 para crédito total):'
                                                        : 'Haz clic en las monedas o billetes que entregó el cliente para sumar o elegir el monto rápido:'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                                {DENOMINACIONES_PERU.map((denom) => {
                                                    const isMoneda = denom.tipo === 'moneda';
                                                    return (
                                                        <button
                                                            key={denom.valor}
                                                            type="button"
                                                            onClick={() => handleAddDenominacion(denom.valor)}
                                                            className={`group relative flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all cursor-pointer active:scale-95 select-none ${isMoneda
                                                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                                                }`}
                                                        >
                                                            <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                                                                {isMoneda ? 'Moneda' : 'Billete'}
                                                            </span>
                                                            <span className="text-sm font-extrabold font-mono mt-0.5">
                                                                {denom.label}
                                                            </span>
                                                            <span className="text-[9px] font-mono opacity-70 mt-0.5">
                                                                +{denom.valor}.00
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Input Manual de Monto Recibido + Indicador de Vuelto / Cambio */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                            {/* Total a Pagar */}
                                            <div className="rounded-xl border bg-card p-3 flex flex-col justify-between">
                                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                    Total a Cobrar
                                                </span>
                                                <span className="text-xl font-extrabold font-mono text-foreground mt-1">
                                                    S/ {total.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Input Monto Recibido */}
                                            <div className="rounded-xl border-2 border-primary/50 bg-card p-3 flex flex-col justify-between">
                                                <Label
                                                    htmlFor="input-monto-recibido"
                                                    className="text-[11px] font-bold text-primary uppercase"
                                                >
                                                    Monto Recibido (S/)
                                                </Label>
                                                <div className="relative mt-1">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground font-mono">
                                                        S/
                                                    </span>
                                                    <Input
                                                        id="input-monto-recibido"
                                                        type="number"
                                                        step="0.10"
                                                        min="0"
                                                        value={displayedMontoInput}
                                                        onChange={(e) => {
                                                            setHasUsedKeypad(true);
                                                            setMontoRecibidoInput(e.target.value);
                                                        }}
                                                        placeholder="0.00"
                                                        className="pl-8 h-9 text-base font-extrabold font-mono border-0 bg-muted/40 focus-visible:ring-1"
                                                    />
                                                </div>
                                            </div>

                                            {/* Vuelto o Faltante / Saldo Pendiente */}
                                            <div
                                                className={`rounded-xl border p-3 flex flex-col justify-between ${faltante > 0
                                                        ? isFaltaPagar
                                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                                            : 'bg-destructive/10 border-destructive/30 text-destructive'
                                                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                    }`}
                                            >
                                                <span className="text-[11px] font-bold uppercase">
                                                    {faltante > 0
                                                        ? isFaltaPagar
                                                            ? 'Saldo Pendiente'
                                                            : 'Monto Faltante'
                                                        : 'Vuelto / Cambio'}
                                                </span>
                                                <span className="text-xl font-extrabold font-mono mt-1">
                                                    S/ {(faltante > 0 ? faltante : vuelto).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {faltante > 0 && (
                                            <div
                                                className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${isFaltaPagar
                                                        ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30'
                                                        : 'text-destructive bg-destructive/5 border border-destructive/20'
                                                    }`}
                                            >
                                                <AlertCircleIcon className="size-4 shrink-0" />
                                                <span>
                                                    {isFaltaPagar
                                                        ? `Venta al crédito / Pendiente de pago. Quedará un saldo pendiente de S/ ${faltante.toFixed(2)}.`
                                                        : `Faltan S/ ${faltante.toFixed(2)} para cubrir el importe total de la venta.`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Columna Derecha (5 cols): Componente Modular de Vista Previa y Descarga/Impresión del Ticket */}
                        <TicketVenta ticketData={currentTicketData} className="lg:col-span-5" />
                    </div>
                </div>

                {/* Pie del Modal */}
                <div className="px-5 py-3.5 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <ShoppingBagIcon className="size-4 text-primary" />
                        <span>
                            Comprobante: <strong className="text-foreground">{currentTicketData.tipoComprobanteNombre}</strong> ({currentTicketData.numeroTicket})
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        {generatedTicket ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => downloadTicketImage(generatedTicket)}
                                    className="gap-1.5 cursor-pointer"
                                >
                                    <DownloadIcon className="size-4" />
                                    <span>Descargar Ticket</span>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="gap-1.5 font-bold cursor-pointer"
                                >
                                    <CheckIcon className="size-4" />
                                    <span>Finalizar y Nueva Venta</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseModal}
                                    className="cursor-pointer"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    form="pos-checkout-form"
                                    disabled={cart.length === 0 || (!isFaltaPagar && montoRecibido < total)}
                                    className="gap-2 font-bold cursor-pointer min-w-52"
                                >
                                    <CoinsIcon className="size-4" />
                                    <span>
                                        Confirmar Cobro ({selectedTipoPago?.nombre || 'Efectivo'} - S/ {total.toFixed(2)})
                                    </span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
