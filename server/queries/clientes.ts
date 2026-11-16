import { desc, eq, inArray, type SQL } from 'drizzle-orm';

import db from '@/server';
import { users } from '@/server/schema/auth-schema';
import { comprobante } from '@/server/schema/comprobante';
import { productoVenta } from '@/server/schema/producto-venta';
import { products } from '@/server/schema/products';
import { sucursal } from '@/server/schema/sucursal';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { tipoDocumento } from '@/server/schema/tipo-documento';
import { tipoPago } from '@/server/schema/tipo-pago';
import { unidades } from '@/server/schema/unidad';
import { venta } from '@/server/schema/venta';
import {
    ClienteOrdenFiltro,
    ClienteResumenRow,
    ClienteSegmentoFiltro,
    ClientesFilters,
    ClientesMetrics,
    ClienteTipoCategoria,
    ClienteVentaHistorialItem,
    ClienteVentaProductoItem,
} from '@/interfaces/clientes';

const TIME_ZONE = 'America/Lima';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIME_ZONE,
});

const PLACEHOLDER_DOCS = new Set([
    '0',
    '00000000',
    '00000000000',
    '-',
    '--',
    's/d',
    'sd',
    'n/a',
    'na',
    'sin documento',
]);

const GENERIC_CLIENT_NAMES = new Set([
    'cliente varios',
    'clientes varios',
    'publico general',
    'consumidor final',
    'sin nombre',
    'anonimo',
    'varios',
    '-',
]);

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanString(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.replace(/\s+/g, ' ').trim();
    return trimmed.length > 0 ? trimmed : null;
}

function cleanDocument(value: string | null | undefined): string | null {
    const cleaned = cleanString(value);
    if (!cleaned) return null;
    const normalized = normalizeText(cleaned);
    if (PLACEHOLDER_DOCS.has(normalized)) return null;
    return cleaned;
}

function isGenericName(value: string | null): boolean {
    if (!value) return true;
    return GENERIC_CLIENT_NAMES.has(normalizeText(value));
}

function inferDocTypeName(
    docNumber: string | null,
    explicitType: string | null
): string | null {
    if (explicitType) return explicitType;
    if (!docNumber) return null;
    const digitsOnly = docNumber.replace(/\D/g, '');
    if (digitsOnly.length === 11) return 'RUC';
    if (digitsOnly.length === 8) return 'DNI';
    return 'Doc.';
}

function inferCustomerCategory(params: {
    esPublicoGeneral: boolean;
    numeroDocumento: string | null;
    tipoDocumentoNombre: string | null;
    nombre: string;
}): ClienteTipoCategoria {
    if (params.esPublicoGeneral) return 'varios';

    const docTypeNorm = params.tipoDocumentoNombre
        ? normalizeText(params.tipoDocumentoNombre)
        : '';
    if (docTypeNorm.includes('ruc')) return 'empresa';

    if (params.numeroDocumento) {
        const digitsOnly = params.numeroDocumento.replace(/\D/g, '');
        if (digitsOnly.length === 11) return 'empresa';
        if (digitsOnly.length === 8) return 'persona';
    }

    const nameNorm = normalizeText(params.nombre);
    if (/\b(s\.?\s?a\.?\s?c\.?|s\.?\s?r\.?\s?l\.?|e\.?\s?i\.?\s?r\.?\s?l\.?|s\.?\s?a\.?|spa|corp|inversiones|comercial|empresa)\b/i.test(nameNorm)) {
        return 'empresa';
    }

    return 'persona';
}

function buildComprobanteRef(row: {
    comprobanteNumero: string | null;
    tipoComprobanteNombre: string | null;
    tipoComprobanteSerie: string | null;
}): string {
    if (!row.comprobanteNumero) return 'Ticket / S/N';
    const prefix = row.tipoComprobanteNombre || row.tipoComprobanteSerie;
    return prefix ? `${prefix}: ${row.comprobanteNumero}` : row.comprobanteNumero;
}

function resolveIdentityKey(params: {
    rawName: string | null;
    rawDoc: string | null;
}): {
    key: string;
    esPublicoGeneral: boolean;
    displayName: string;
} {
    const hasValidDoc = Boolean(params.rawDoc);
    const hasSpecificName = Boolean(params.rawName && !isGenericName(params.rawName));

    if (hasValidDoc && params.rawDoc) {
        const docKey = params.rawDoc.replace(/\s+/g, '').toUpperCase();
        return {
            key: `doc:${docKey}`,
            esPublicoGeneral: false,
            displayName: hasSpecificName
                ? params.rawName!
                : `Cliente ${docKey.length === 11 ? 'RUC' : 'Doc.'} ${docKey}`,
        };
    }

    if (hasSpecificName && params.rawName) {
        return {
            key: `name:${normalizeText(params.rawName)}`,
            esPublicoGeneral: false,
            displayName: params.rawName,
        };
    }

    return {
        key: 'walkin:publico-general',
        esPublicoGeneral: true,
        displayName: 'Cliente Varios / Público General',
    };
}

interface RawClienteAccumulator {
    id: string;
    esPublicoGeneral: boolean;
    nombre: string;
    nombreEsFallback: boolean;
    numeroDocumento: string | null;
    tipoDocumentoNombre: string | null;
    telefono: string | null;
    direccion: string | null;
    totalCompras: number;
    totalProductos: number;
    totalGastado: number;
    totalDescuentos: number;
    totalPendiente: number;
    ventasConSaldoCount: number;
    primeraCompraIso: string;
    ultimaCompraIso: string;
    ultimaCompraFormateada: string;
    ultimaCompraHora: string;
    sucursalCounts: Map<string, number>;
    sucursalesOrder: string[];
    metodosPagoSet: Set<string>;
    ventas: ClienteVentaHistorialItem[];
}

export interface ClientesDirectoryResult {
    allClientes: ClienteResumenRow[];
    filteredClientes: ClienteResumenRow[];
    metrics: ClientesMetrics;
}

export async function getClientesDirectory(filters: Partial<ClientesFilters> & { sucursalId?: string }): Promise<ClientesDirectoryResult> {
    const conditions: SQL[] = [];

    if (filters.sucursalId && filters.sucursalId !== 'all') {
        conditions.push(eq(venta.sucursalId, filters.sucursalId));
    }

    const baseQuery = db
        .select({
            id: venta.id,
            createdAt: venta.createdAt,
            cliente: venta.cliente,
            numeroDocumento: venta.numeroDocumento,
            telefono: venta.telefono,
            direccion: venta.direccion,
            pagado: venta.pagado,
            subTotal: venta.subTotal,
            descuento: venta.descuento,
            total: venta.total,
            saldoPendiente: venta.saldoPendiente,
            sucursalId: venta.sucursalId,
            sucursalNombre: sucursal.nombre,
            vendedorNombre: users.name,
            metodoPagoNombre: tipoPago.nombre,
            comprobanteNumero: comprobante.numero,
            comprobanteEstado: comprobante.estado,
            comprobanteNombre: comprobante.nombre,
            comprobanteNumeroDocumento: comprobante.numeroDocumento,
            comprobanteTelefono: comprobante.telefono,
            comprobanteDireccion: comprobante.direccion,
            tipoDocumentoNombre: tipoDocumento.nombre,
            tipoComprobanteNombre: tipoComprobante.nombre,
            tipoComprobanteSerie: tipoComprobante.serie,
        })
        .from(venta)
        .innerJoin(sucursal, eq(venta.sucursalId, sucursal.id))
        .innerJoin(tipoPago, eq(venta.metodoPagoId, tipoPago.id))
        .leftJoin(users, eq(venta.vendedor, users.id))
        .leftJoin(comprobante, eq(venta.comprobanteId, comprobante.id))
        .leftJoin(tipoDocumento, eq(comprobante.tipoDocumentoId, tipoDocumento.id))
        .leftJoin(tipoComprobante, eq(comprobante.tipoComprobanteId, tipoComprobante.id));

    const salesRows = conditions.length > 0
        ? await baseQuery.where(conditions[0]).orderBy(desc(venta.createdAt))
        : await baseQuery.orderBy(desc(venta.createdAt));

    if (salesRows.length === 0) {
        return {
            allClientes: [],
            filteredClientes: [],
            metrics: {
                totalPerfiles: 0,
                clientesIdentificados: 0,
                clientesEmpresa: 0,
                clientesPersona: 0,
                clientesSinDocumento: 0,
                clientesFrecuentes: 0,
                clientesConSaldo: 0,
                totalVentasAnalizadas: 0,
                montoTotalVendido: 0,
                montoSaldoPendiente: 0,
                ventasPublicoGeneralCount: 0,
            },
        };
    }

    const ventaIds = salesRows.map((row) => row.id);
    const itemsByVentaId = new Map<string, ClienteVentaProductoItem[]>();

    const CHUNK_SIZE = 1000;
    for (let i = 0; i < ventaIds.length; i += CHUNK_SIZE) {
        const chunk = ventaIds.slice(i, i + CHUNK_SIZE);
        const itemRows = await db
            .select({
                id: productoVenta.id,
                ventaId: productoVenta.ventaId,
                productId: productoVenta.productId,
                cantidad: productoVenta.cantidad,
                precio: productoVenta.precio,
                descuento: productoVenta.descuento,
                precioTotal: productoVenta.precioTotal,
                productoNombre: products.name,
                productoCodigo: products.codigo,
                unidadAbreviatura: unidades.abreviatura,
            })
            .from(productoVenta)
            .innerJoin(products, eq(productoVenta.productId, products.id))
            .leftJoin(unidades, eq(products.unidadId, unidades.id))
            .where(inArray(productoVenta.ventaId, chunk));

        for (const item of itemRows) {
            const existing = itemsByVentaId.get(item.ventaId) ?? [];
            existing.push({
                id: item.id,
                productId: item.productId,
                productoNombre: item.productoNombre,
                productoCodigo: item.productoCodigo,
                unidadAbreviatura: item.unidadAbreviatura || 'UND',
                cantidad: Number(item.cantidad) || 0,
                precio: Number(item.precio) || 0,
                descuento: Number(item.descuento) || 0,
                precioTotal: Number(item.precioTotal) || 0,
            });
            itemsByVentaId.set(item.ventaId, existing);
        }
    }

    const grouped = new Map<string, RawClienteAccumulator>();
    let totalVentasAnalizadas = 0;
    let montoTotalVendido = 0;
    let ventasPublicoGeneralCount = 0;

    for (const row of salesRows) {
        const rawName = cleanString(row.cliente) ?? cleanString(row.comprobanteNombre);
        const rawDoc = cleanDocument(row.numeroDocumento) ?? cleanDocument(row.comprobanteNumeroDocumento);
        const rawPhone = cleanString(row.telefono) ?? cleanString(row.comprobanteTelefono);
        const rawAddress = cleanString(row.direccion) ?? cleanString(row.comprobanteDireccion);
        const docType = inferDocTypeName(rawDoc, cleanString(row.tipoDocumentoNombre));

        const identity = resolveIdentityKey({ rawName, rawDoc });
        const nombreEsFallback = Boolean(
            !identity.esPublicoGeneral && (!rawName || isGenericName(rawName))
        );

        const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
        const fechaIso = createdAt.toISOString();
        const fechaFormateada = dateFormatter.format(createdAt);
        const horaFormateada = timeFormatter.format(createdAt);

        const saleTotal = Number(row.total) || 0;
        const saleSubTotal = Number(row.subTotal) || 0;
        const saleDescuento = Number(row.descuento) || 0;
        const saleSaldoPendiente = Math.max(0, Number(row.saldoPendiente) || 0);
        const productos = itemsByVentaId.get(row.id) ?? [];
        const productosCount = productos.reduce((acc, item) => acc + item.cantidad, 0);

        totalVentasAnalizadas += 1;
        montoTotalVendido += saleTotal;
        if (identity.esPublicoGeneral) {
            ventasPublicoGeneralCount += 1;
        }

        const saleItem: ClienteVentaHistorialItem = {
            id: row.id,
            fechaIso,
            fechaFormateada,
            horaFormateada,
            sucursalId: row.sucursalId,
            sucursalNombre: row.sucursalNombre,
            vendedorNombre: row.vendedorNombre || 'Cajero',
            metodoPagoNombre: row.metodoPagoNombre || 'Efectivo',
            comprobanteRef: buildComprobanteRef({
                comprobanteNumero: row.comprobanteNumero,
                tipoComprobanteNombre: row.tipoComprobanteNombre,
                tipoComprobanteSerie: row.tipoComprobanteSerie,
            }),
            comprobanteEstado: row.comprobanteEstado ?? null,
            pagado: Boolean(row.pagado),
            subTotal: saleSubTotal,
            descuento: saleDescuento,
            total: saleTotal,
            saldoPendiente: saleSaldoPendiente,
            productosCount,
            productos,
        };

        const existing = grouped.get(identity.key);
        if (!existing) {
            const sucursalCounts = new Map<string, number>();
            sucursalCounts.set(row.sucursalNombre, 1);

            grouped.set(identity.key, {
                id: identity.key,
                esPublicoGeneral: identity.esPublicoGeneral,
                nombre: identity.displayName,
                nombreEsFallback,
                numeroDocumento: rawDoc,
                tipoDocumentoNombre: docType,
                telefono: rawPhone,
                direccion: rawAddress,
                totalCompras: 1,
                totalProductos: productosCount,
                totalGastado: saleTotal,
                totalDescuentos: saleDescuento,
                totalPendiente: saleSaldoPendiente,
                ventasConSaldoCount: saleSaldoPendiente > 0.009 ? 1 : 0,
                primeraCompraIso: fechaIso,
                ultimaCompraIso: fechaIso,
                ultimaCompraFormateada: fechaFormateada,
                ultimaCompraHora: horaFormateada,
                sucursalCounts,
                sucursalesOrder: [row.sucursalNombre],
                metodosPagoSet: new Set([saleItem.metodoPagoNombre]),
                ventas: [saleItem],
            });
            continue;
        }

        // Porque las ventas vienen ordenadas desc por fecha, el primer valor no vacío suele ser el más reciente;
        // si el primero fue un fallback ("Cliente RUC ..."), lo reemplazamos si encontramos un nombre real.
        if (existing.nombreEsFallback && !nombreEsFallback && !identity.esPublicoGeneral) {
            existing.nombre = identity.displayName;
            existing.nombreEsFallback = false;
        }
        if (!existing.tipoDocumentoNombre && docType) {
            existing.tipoDocumentoNombre = docType;
        }
        if (!existing.telefono && rawPhone) {
            existing.telefono = rawPhone;
        }
        if (!existing.direccion && rawAddress) {
            existing.direccion = rawAddress;
        }

        existing.totalCompras += 1;
        existing.totalProductos += productosCount;
        existing.totalGastado += saleTotal;
        existing.totalDescuentos += saleDescuento;
        existing.totalPendiente += saleSaldoPendiente;
        if (saleSaldoPendiente > 0.009) {
            existing.ventasConSaldoCount += 1;
        }
        if (fechaIso < existing.primeraCompraIso) {
            existing.primeraCompraIso = fechaIso;
        }
        if (fechaIso > existing.ultimaCompraIso) {
            existing.ultimaCompraIso = fechaIso;
            existing.ultimaCompraFormateada = fechaFormateada;
            existing.ultimaCompraHora = horaFormateada;
        }

        const prevCount = existing.sucursalCounts.get(row.sucursalNombre) ?? 0;
        existing.sucursalCounts.set(row.sucursalNombre, prevCount + 1);
        if (!existing.sucursalesOrder.includes(row.sucursalNombre)) {
            existing.sucursalesOrder.push(row.sucursalNombre);
        }

        existing.metodosPagoSet.add(saleItem.metodoPagoNombre);
        existing.ventas.push(saleItem);
    }

    const allClientes: ClienteResumenRow[] = Array.from(grouped.values()).map((acc) => {
        let sucursalPrincipalNombre = acc.sucursalesOrder[0] ?? 'Principal';
        let maxCount = 0;
        for (const [branchName, count] of acc.sucursalCounts.entries()) {
            if (count > maxCount) {
                maxCount = count;
                sucursalPrincipalNombre = branchName;
            }
        }

        const categoria = inferCustomerCategory({
            esPublicoGeneral: acc.esPublicoGeneral,
            numeroDocumento: acc.numeroDocumento,
            tipoDocumentoNombre: acc.tipoDocumentoNombre,
            nombre: acc.nombre,
        });

        const totalCompras = acc.totalCompras;
        const totalGastado = Number(acc.totalGastado.toFixed(2));

        return {
            id: acc.id,
            nombre: acc.nombre,
            categoria,
            numeroDocumento: acc.numeroDocumento,
            tipoDocumentoNombre: acc.tipoDocumentoNombre,
            telefono: acc.telefono,
            direccion: acc.direccion,
            totalCompras,
            totalProductos: acc.totalProductos,
            totalGastado,
            ticketPromedio: totalCompras > 0 ? Number((totalGastado / totalCompras).toFixed(2)) : 0,
            totalDescuentos: Number(acc.totalDescuentos.toFixed(2)),
            totalPendiente: Number(acc.totalPendiente.toFixed(2)),
            ventasConSaldoCount: acc.ventasConSaldoCount,
            primeraCompraIso: acc.primeraCompraIso,
            ultimaCompraIso: acc.ultimaCompraIso,
            ultimaCompraFormateada: acc.ultimaCompraFormateada,
            ultimaCompraHora: acc.ultimaCompraHora,
            sucursalPrincipalNombre,
            sucursalesNombres: acc.sucursalesOrder,
            metodosPago: Array.from(acc.metodosPagoSet),
            esPublicoGeneral: acc.esPublicoGeneral,
            ventas: acc.ventas,
        };
    });

    const metrics = computeClientesMetrics({
        allClientes,
        totalVentasAnalizadas,
        montoTotalVendido,
        ventasPublicoGeneralCount,
    });

    const filteredClientes = filterAndSortClientes(allClientes, {
        search: filters.search ?? '',
        segmento: filters.segmento ?? 'all',
        sortBy: filters.sortBy ?? 'ultima_compra',
    });

    return {
        allClientes,
        filteredClientes,
        metrics,
    };
}

function computeClientesMetrics(params: {
    allClientes: ClienteResumenRow[];
    totalVentasAnalizadas: number;
    montoTotalVendido: number;
    ventasPublicoGeneralCount: number;
}): ClientesMetrics {
    let clientesIdentificados = 0;
    let clientesEmpresa = 0;
    let clientesPersona = 0;
    let clientesSinDocumento = 0;
    let clientesFrecuentes = 0;
    let clientesConSaldo = 0;
    let montoSaldoPendiente = 0;

    for (const cliente of params.allClientes) {
        if (!cliente.esPublicoGeneral) {
            clientesIdentificados += 1;
            if (cliente.totalCompras >= 2) {
                clientesFrecuentes += 1;
            }
        }
        if (cliente.categoria === 'empresa') {
            clientesEmpresa += 1;
        } else if (cliente.categoria === 'persona') {
            clientesPersona += 1;
        }
        if (!cliente.numeroDocumento) {
            clientesSinDocumento += 1;
        }
        if (cliente.totalPendiente > 0.009) {
            clientesConSaldo += 1;
            montoSaldoPendiente += cliente.totalPendiente;
        }
    }

    return {
        totalPerfiles: params.allClientes.length,
        clientesIdentificados,
        clientesEmpresa,
        clientesPersona,
        clientesSinDocumento,
        clientesFrecuentes,
        clientesConSaldo,
        totalVentasAnalizadas: params.totalVentasAnalizadas,
        montoTotalVendido: Number(params.montoTotalVendido.toFixed(2)),
        montoSaldoPendiente: Number(montoSaldoPendiente.toFixed(2)),
        ventasPublicoGeneralCount: params.ventasPublicoGeneralCount,
    };
}

export function filterAndSortClientes(
    clientes: ClienteResumenRow[],
    filters: {
        search: string;
        segmento: ClienteSegmentoFiltro;
        sortBy: ClienteOrdenFiltro;
    }
): ClienteResumenRow[] {
    const query = filters.search ? normalizeText(filters.search) : '';

    const filtered = clientes.filter((cliente) => {
        if (filters.segmento === 'empresa' && cliente.categoria !== 'empresa') {
            return false;
        }
        if (filters.segmento === 'persona' && cliente.categoria !== 'persona') {
            return false;
        }
        if (filters.segmento === 'con_saldo' && cliente.totalPendiente <= 0.009) {
            return false;
        }
        if (filters.segmento === 'sin_documento' && Boolean(cliente.numeroDocumento)) {
            return false;
        }

        if (!query) return true;

        const searchableParts = [
            cliente.nombre,
            cliente.numeroDocumento ?? '',
            cliente.telefono ?? '',
            cliente.direccion ?? '',
            cliente.sucursalesNombres.join(' '),
            cliente.ventas.map((v) => v.comprobanteRef).join(' '),
        ];

        return normalizeText(searchableParts.join(' ')).includes(query);
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
        // En orden por defecto, mantener perfiles específicos primero solo si tienen empate,
        // pero respetar el criterio principal elegido por el usuario.
        switch (filters.sortBy) {
            case 'mayor_gasto':
                return b.totalGastado - a.totalGastado || b.totalCompras - a.totalCompras;
            case 'mas_compras':
                return b.totalCompras - a.totalCompras || b.totalGastado - a.totalGastado;
            case 'saldo_pendiente':
                return (
                    b.totalPendiente - a.totalPendiente ||
                    b.ultimaCompraIso.localeCompare(a.ultimaCompraIso)
                );
            case 'nombre':
                return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
            case 'ultima_compra':
            default:
                return b.ultimaCompraIso.localeCompare(a.ultimaCompraIso);
        }
    });

    return sorted;
}
