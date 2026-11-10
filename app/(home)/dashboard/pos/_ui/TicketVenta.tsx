'use client';

import React, { useRef } from 'react';
import {
    DownloadIcon,
    PrinterIcon,
    ReceiptIcon
} from 'lucide-react';
import { toast } from 'sonner';

import { Sucursal } from '@/interfaces';
import { Button } from '@/components/ui/button';

export interface CartCheckoutItem {
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

export interface TicketGeneratedData {
    numeroTicket: string;
    fechaEmision: string;
    horaEmision: string;
    tipoComprobanteNombre: string;
    tipoComprobanteSunat: string;
    serie: string;
    correlativo: string;
    tipoDocumentoNombre: string;
    numeroDocumento: string;
    clienteNombre: string;
    clienteDireccion?: string;
    items: CartCheckoutItem[];
    opGravada: number;
    igv: number;
    total: number;
    montoRecibido: number;
    vuelto: number;
    sucursal: Sucursal;
    vendedorNombre: string;
    tipoPagoNombre?: string;
    tipoPagoId?: string;
}

export function numeroALetrasSoles(monto: number): string {
    const unidades = [
        '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
        'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'
    ];
    const decenas = [
        '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
    ];
    const centenas = [
        '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
    ];

    function convertirMenorMil(n: number): string {
        if (n === 0) return '';
        if (n === 100) return 'CIEN';
        const c = Math.floor(n / 100);
        const resto = n % 100;
        let texto = c > 0 ? centenas[c] : '';
        if (resto > 0) {
            if (texto) texto += ' ';
            if (resto < 30) {
                texto += unidades[resto];
            } else {
                const d = Math.floor(resto / 10);
                const u = resto % 10;
                texto += decenas[d] + (u > 0 ? ` Y ${unidades[u]}` : '');
            }
        }
        return texto;
    }

    const entero = Math.floor(Math.abs(monto));
    const centimos = Math.round((Math.abs(monto) - entero) * 100);
    const centimosStr = String(centimos).padStart(2, '0');

    if (entero === 0) {
        return `CERO CON ${centimosStr}/100 SOLES`;
    }

    const miles = Math.floor(entero / 1000);
    const restoMiles = entero % 1000;
    let letras = '';

    if (miles === 1) {
        letras = 'MIL';
    } else if (miles > 1) {
        letras = `${convertirMenorMil(miles)} MIL`;
    }

    if (restoMiles > 0) {
        letras = letras ? `${letras} ${convertirMenorMil(restoMiles)}` : convertirMenorMil(restoMiles);
    }

    return `${letras} CON ${centimosStr}/100 SOLES`;
}

/**
 * Descarga el comprobante en formato de imagen PNG de alta resolución (estilo impresora térmica 80mm).
 */
export function downloadTicketImage(ticketData: TicketGeneratedData): void {
    try {
        const canvas = document.createElement('canvas');
        const scale = 2;
        const width = 380;

        const baseHeight = 510;
        const itemRowHeight = 40;
        const extraAddressHeight = ticketData.clienteDireccion ? 22 : 0;
        const height = baseHeight + ticketData.items.length * itemRowHeight + extraAddressHeight;

        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast.error('No se pudo generar el archivo del ticket');
            return;
        }

        ctx.scale(scale, scale);

        // Fondo blanco tipo papel térmico
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#111827';
        let y = 26;

        const drawCenteredText = (text: string, yPos: number, font: string, color = '#111827') => {
            ctx.font = font;
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(text, width / 2, yPos);
        };

        const drawDashedLine = (yPos: number) => {
            ctx.save();
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(18, yPos);
            ctx.lineTo(width - 18, yPos);
            ctx.stroke();
            ctx.restore();
        };

        const drawKeyValue = (label: string, value: string, yPos: number, bold = false) => {
            ctx.font = bold ? 'bold 12px monospace' : '11px monospace';
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'left';
            ctx.fillText(label, 20, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(value, width - 20, yPos);
        };

        // 1. Encabezado de la empresa / sucursal
        const nombreEmpresa = (ticketData.sucursal.razonSocial || ticketData.sucursal.nombre || 'MI EMPRESA').toUpperCase();
        drawCenteredText(nombreEmpresa, y, 'bold 15px monospace');
        y += 18;

        drawCenteredText(`SUCURSAL: ${ticketData.sucursal.nombre.toUpperCase()} (${ticketData.sucursal.codigo})`, y, '11px monospace', '#374151');
        y += 15;

        if (ticketData.sucursal.ruc) {
            drawCenteredText(`R.U.C.: ${ticketData.sucursal.ruc}`, y, 'bold 11px monospace', '#111827');
            y += 15;
        }

        if (ticketData.sucursal.direccion) {
            const dir = ticketData.sucursal.direccion.length > 44
                ? ticketData.sucursal.direccion.slice(0, 44) + '...'
                : ticketData.sucursal.direccion;
            drawCenteredText(dir, y, '10px monospace', '#4b5563');
            y += 14;
        }

        if (ticketData.sucursal.telefono) {
            drawCenteredText(`TEL: ${ticketData.sucursal.telefono}`, y, '10px monospace', '#4b5563');
            y += 14;
        }

        y += 4;
        drawDashedLine(y);
        y += 18;

        // 2. Tipo de comprobante y numeración
        drawCenteredText(ticketData.tipoComprobanteSunat.toUpperCase(), y, 'bold 13px monospace');
        y += 18;
        drawCenteredText(ticketData.numeroTicket, y, 'bold 15px monospace');
        y += 12;

        drawDashedLine(y);
        y += 16;

        // 3. Datos del cliente y de la operación
        drawKeyValue('FECHA:', `${ticketData.fechaEmision} ${ticketData.horaEmision}`, y);
        y += 16;
        drawKeyValue('CAJERO:', ticketData.vendedorNombre.slice(0, 26).toUpperCase(), y);
        y += 16;
        drawKeyValue(`${ticketData.tipoDocumentoNombre.toUpperCase()}:`, ticketData.numeroDocumento, y);
        y += 16;
        drawKeyValue('CLIENTE:', ticketData.clienteNombre.slice(0, 25).toUpperCase(), y);
        y += 16;

        if (ticketData.clienteDireccion) {
            drawKeyValue('DIRECCIÓN:', ticketData.clienteDireccion.slice(0, 24).toUpperCase(), y);
            y += 16;
        }

        y += 2;
        drawDashedLine(y);
        y += 16;

        // 4. Cabecera de tabla de productos
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText('CANT', 20, y);
        ctx.fillText('DESCRIPCIÓN', 60, y);
        ctx.textAlign = 'right';
        ctx.fillText('P.UNIT', width - 82, y);
        ctx.fillText('TOTAL', width - 20, y);
        y += 8;
        drawDashedLine(y);
        y += 16;

        // 5. Detalle de ítems
        ticketData.items.forEach((item) => {
            const importe = item.precio * item.cantidad;
            const nombreCorto = item.name.length > 22 ? item.name.slice(0, 22) + '..' : item.name;

            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.cantidad}`, 20, y);
            ctx.fillText(nombreCorto.toUpperCase(), 60, y);

            ctx.font = '11px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(item.precio.toFixed(2), width - 82, y);
            ctx.font = 'bold 11px monospace';
            ctx.fillText(importe.toFixed(2), width - 20, y);

            y += 14;
            ctx.font = '9px monospace';
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'left';
            ctx.fillText(`SKU: ${item.codigo}`, 60, y);
            y += 18;
        });

        drawDashedLine(y);
        y += 18;

        // 6. Totales y desglose IGV
        drawKeyValue('OP. GRAVADA (S/):', `S/ ${ticketData.opGravada.toFixed(2)}`, y);
        y += 16;
        drawKeyValue('I.G.V. (18%):', `S/ ${ticketData.igv.toFixed(2)}`, y);
        y += 18;

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.fillText('TOTAL A PAGAR:', 20, y);
        ctx.textAlign = 'right';
        ctx.fillText(`S/ ${ticketData.total.toFixed(2)}`, width - 20, y);
        y += 18;

        drawDashedLine(y);
        y += 16;

        // 7. Efectivo recibido y vuelto
        drawKeyValue('MÉTODO DE PAGO:', (ticketData.tipoPagoNombre || 'EFECTIVO').toUpperCase(), y);
        y += 16;
        drawKeyValue('MONTO RECIBIDO:', `S/ ${ticketData.montoRecibido.toFixed(2)}`, y);
        y += 16;
        drawKeyValue('VUELTO / CAMBIO:', `S/ ${ticketData.vuelto.toFixed(2)}`, y, true);
        y += 18;

        // Importe en letras
        const montoLetras = `SON: ${numeroALetrasSoles(ticketData.total)}`;
        ctx.font = '9.5px monospace';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        if (montoLetras.length > 46) {
            ctx.fillText(montoLetras.slice(0, 46), width / 2, y);
            y += 13;
            ctx.fillText(montoLetras.slice(46), width / 2, y);
        } else {
            ctx.fillText(montoLetras, width / 2, y);
        }
        y += 14;

        drawDashedLine(y);
        y += 18;

        // 8. Código de barras simulado y pie de ticket
        const barStartX = 65;
        const barWidthTotal = width - 130;
        ctx.fillStyle = '#111827';
        for (let x = 0; x < barWidthTotal; x += 4) {
            const bw = (x * 7 + ticketData.numeroTicket.charCodeAt(x % ticketData.numeroTicket.length)) % 3 + 1;
            ctx.fillRect(barStartX + x, y, bw, 28);
        }
        y += 42;

        drawCenteredText('¡GRACIAS POR SU COMPRA!', y, 'bold 11px monospace');
        y += 14;
        drawCenteredText('Conserve su ticket para cualquier reclamo', y, '9.5px monospace', '#6b7280');

        // Descargar archivo PNG
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const safeDocNumber = ticketData.numeroTicket.replace(/[^a-zA-Z0-9-_]/g, '_');
        link.download = `Ticket_${safeDocNumber}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Ticket ${ticketData.numeroTicket} descargado correctamente`);
    } catch (err) {
        console.error(err);
        toast.error('Ocurrió un error al descargar el ticket');
    }
}

/**
 * Abre una ventana emergente para imprimir el ticket en formato térmico 80mm.
 */
export function printTicket(ticketData: TicketGeneratedData): void {
    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) {
        toast.warning('Habilita las ventanas emergentes para imprimir o usa el botón Descargar Ticket');
        return;
    }

    const itemsHtml = ticketData.items
        .map(
            (item) => `
            <tr>
                <td style="padding:3px 0;vertical-align:top;">${item.cantidad}</td>
                <td style="padding:3px 4px;">
                    <div style="font-weight:bold;">${item.name}</div>
                    <div style="font-size:10px;color:#555;">SKU: ${item.codigo}</div>
                </td>
                <td style="padding:3px 0;text-align:right;vertical-align:top;">${item.precio.toFixed(2)}</td>
                <td style="padding:3px 0;text-align:right;font-weight:bold;vertical-align:top;">${(item.precio * item.cantidad).toFixed(2)}</td>
            </tr>`
        )
        .join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8" />
            <title>Ticket ${ticketData.numeroTicket}</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    width: 76mm;
                    margin: 0 auto;
                    padding: 10px 6px;
                    font-size: 11px;
                    color: #000;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #333; margin: 7px 0; }
                .row { display: flex; justify-content: space-between; margin: 3px 0; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { text-align: left; border-bottom: 1px dashed #333; padding-bottom: 4px; }
            </style>
        </head>
        <body>
            <div class="center bold" style="font-size:14px;">${(ticketData.sucursal.razonSocial || ticketData.sucursal.nombre).toUpperCase()}</div>
            <div class="center">SUCURSAL: ${ticketData.sucursal.nombre} (${ticketData.sucursal.codigo})</div>
            ${ticketData.sucursal.ruc ? `<div class="center bold">R.U.C.: ${ticketData.sucursal.ruc}</div>` : ''}
            ${ticketData.sucursal.direccion ? `<div class="center">${ticketData.sucursal.direccion}</div>` : ''}
            ${ticketData.sucursal.telefono ? `<div class="center">TEL: ${ticketData.sucursal.telefono}</div>` : ''}
            <div class="divider"></div>
            <div class="center bold" style="font-size:12px;">${ticketData.tipoComprobanteSunat}</div>
            <div class="center bold" style="font-size:14px;">${ticketData.numeroTicket}</div>
            <div class="divider"></div>
            <div class="row"><span>FECHA:</span><span>${ticketData.fechaEmision} ${ticketData.horaEmision}</span></div>
            <div class="row"><span>CAJERO:</span><span>${ticketData.vendedorNombre}</span></div>
            <div class="row"><span>${ticketData.tipoDocumentoNombre.toUpperCase()}:</span><span>${ticketData.numeroDocumento}</span></div>
            <div class="row"><span>CLIENTE:</span><span>${ticketData.clienteNombre}</span></div>
            ${ticketData.clienteDireccion ? `<div class="row"><span>DIRECCIÓN:</span><span>${ticketData.clienteDireccion}</span></div>` : ''}
            <div class="divider"></div>
            <table>
                <thead>
                    <tr>
                        <th>CANT</th>
                        <th>DESCRIPCIÓN</th>
                        <th style="text-align:right;">P.U.</th>
                        <th style="text-align:right;">IMP.</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="divider"></div>
            <div class="row"><span>OP. GRAVADA:</span><span>S/ ${ticketData.opGravada.toFixed(2)}</span></div>
            <div class="row"><span>I.G.V. (18%):</span><span>S/ ${ticketData.igv.toFixed(2)}</span></div>
            <div class="row bold" style="font-size:13px;"><span>TOTAL A PAGAR:</span><span>S/ ${ticketData.total.toFixed(2)}</span></div>
            <div class="divider"></div>
            <div class="row"><span>MÉTODO DE PAGO:</span><span class="bold">${(ticketData.tipoPagoNombre || 'EFECTIVO').toUpperCase()}</span></div>
            <div class="row"><span>MONTO RECIBIDO:</span><span>S/ ${ticketData.montoRecibido.toFixed(2)}</span></div>
            <div class="row bold"><span>VUELTO / CAMBIO:</span><span>S/ ${ticketData.vuelto.toFixed(2)}</span></div>
            <div class="center" style="font-size:10px;margin-top:6px;">SON: ${numeroALetrasSoles(ticketData.total)}</div>
            <div class="divider"></div>
            <div class="center bold" style="margin-top:8px;">¡GRACIAS POR SU COMPRA!</div>
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

interface TicketVentaProps {
    ticketData: TicketGeneratedData;
    showActions?: boolean;
    className?: string;
}

/**
 * Componente que renderiza la vista previa y descarga/impresión del Ticket de Venta (80mm).
 */
export default function TicketVenta({
    ticketData,
    showActions = true,
    className = '',
}: TicketVentaProps) {
    const ticketRef = useRef<HTMLDivElement>(null);

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {showActions && (
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ReceiptIcon className="size-3.5 text-primary" />
                        Vista Previa del Ticket (80mm)
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => downloadTicketImage(ticketData)}
                            className="h-7 text-[11px] gap-1 cursor-pointer"
                        >
                            <DownloadIcon className="size-3" />
                            <span>Descargar Ticket</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => printTicket(ticketData)}
                            className="h-7 text-[11px] gap-1 cursor-pointer"
                        >
                            <PrinterIcon className="size-3" />
                            <span>Imprimir</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Papel Térmico Simulado */}
            <div
                ref={ticketRef}
                className="rounded-xl border bg-white text-zinc-900 shadow-md p-4 font-mono text-[11px] leading-relaxed space-y-2.5 max-h-[58vh] overflow-y-auto"
            >
                {/* Cabecera Empresa */}
                <div className="text-center space-y-0.5">
                    <p className="font-bold text-xs uppercase tracking-tight">
                        {ticketData.sucursal.razonSocial || ticketData.sucursal.nombre}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                        SUCURSAL: {ticketData.sucursal.nombre} ({ticketData.sucursal.codigo})
                    </p>
                    {ticketData.sucursal.ruc && (
                        <p className="text-[10px] font-bold text-zinc-800">
                            R.U.C.: {ticketData.sucursal.ruc}
                        </p>
                    )}
                    {ticketData.sucursal.direccion && (
                        <p className="text-[10px] text-zinc-600">
                            {ticketData.sucursal.direccion}
                        </p>
                    )}
                </div>

                <div className="border-t border-dashed border-zinc-400 pt-2 text-center">
                    <p className="font-bold text-xs uppercase">
                        {ticketData.tipoComprobanteSunat}
                    </p>
                    <p className="font-extrabold text-sm tracking-wider">
                        {ticketData.numeroTicket}
                    </p>
                </div>

                {/* Datos del Cliente en el Ticket */}
                <div className="border-t border-dashed border-zinc-400 pt-2 space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">FECHA:</span>
                        <span>{ticketData.fechaEmision} {ticketData.horaEmision}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">CAJERO:</span>
                        <span className="uppercase">{ticketData.vendedorNombre}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">{ticketData.tipoDocumentoNombre.toUpperCase()}:</span>
                        <span className="font-semibold">{ticketData.numeroDocumento}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-zinc-500 shrink-0">CLIENTE:</span>
                        <span className="font-semibold text-right truncate uppercase">
                            {ticketData.clienteNombre}
                        </span>
                    </div>
                    {ticketData.clienteDireccion && (
                        <div className="flex justify-between gap-2">
                            <span className="text-zinc-500 shrink-0">DIRECCIÓN:</span>
                            <span className="text-right truncate uppercase">
                                {ticketData.clienteDireccion}
                            </span>
                        </div>
                    )}
                </div>

                {/* Tabla de Productos del Ticket */}
                <div className="border-t border-dashed border-zinc-400 pt-2">
                    <div className="grid grid-cols-12 font-bold text-[10px] border-b border-dashed border-zinc-300 pb-1 mb-1.5">
                        <span className="col-span-2">CANT</span>
                        <span className="col-span-5">DESCRIPCIÓN</span>
                        <span className="col-span-2 text-right">P.U.</span>
                        <span className="col-span-3 text-right">TOTAL</span>
                    </div>
                    <div className="space-y-1.5">
                        {ticketData.items.map((item) => (
                            <div key={item.stockId} className="grid grid-cols-12 items-start text-[10px]">
                                <span className="col-span-2 font-bold">{item.cantidad}</span>
                                <div className="col-span-5 pr-1">
                                    <p className="font-semibold leading-tight uppercase truncate">
                                        {item.name}
                                    </p>
                                    <span className="text-[9px] text-zinc-500">
                                        {item.codigo}
                                    </span>
                                </div>
                                <span className="col-span-2 text-right">
                                    {item.precio.toFixed(2)}
                                </span>
                                <span className="col-span-3 text-right font-bold">
                                    {(item.precio * item.cantidad).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Totales del Ticket */}
                <div className="border-t border-dashed border-zinc-400 pt-2 space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-600">OP. GRAVADA:</span>
                        <span>S/ {ticketData.opGravada.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-600">I.G.V. (18%):</span>
                        <span>S/ {ticketData.igv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-dashed border-zinc-300">
                        <span>TOTAL A PAGAR:</span>
                        <span>S/ {ticketData.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                        <span className="text-zinc-600">MÉTODO DE PAGO:</span>
                        <span className="font-semibold uppercase">{ticketData.tipoPagoNombre || 'EFECTIVO'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-600">MONTO RECIBIDO:</span>
                        <span>S/ {ticketData.montoRecibido.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>VUELTO / CAMBIO:</span>
                        <span>S/ {ticketData.vuelto.toFixed(2)}</span>
                    </div>
                </div>

                {/* Importe en Letras y Pie */}
                <div className="border-t border-dashed border-zinc-400 pt-2 text-center space-y-1">
                    <p className="text-[9.5px] text-zinc-700 font-semibold">
                        SON: {numeroALetrasSoles(ticketData.total)}
                    </p>
                    <p className="text-[10px] font-bold pt-1">
                        ¡GRACIAS POR SU COMPRA!
                    </p>
                </div>
            </div>
        </div>
    );
}

