'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, sql } from 'drizzle-orm';

import db from '@/server';
import { api } from '@/lib/auth';
import { actionClient } from '@/lib/safe-action';
import { devolucion } from '@/server/schema/devolucion';
import { venta } from '@/server/schema/venta';
import { productoVenta } from '@/server/schema/producto-venta';
import { stockSucursal } from '@/server/schema/stock-sucursal';
import { kardex } from '@/server/schema/kardex';
import { comprobante } from '@/server/schema/comprobante';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { caja } from '@/server/schema/caja';
import { egresos } from '@/server/schema/egreso';
import { nuevaDevolucionSchema } from '@/types/devolucion-schema';

export const nuevaDevolucionAction = actionClient
    .inputSchema(nuevaDevolucionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción.' };
            }

            const { sucursalId, ventaId, productoId, cantidad, motivo } = parsedInput;

            // 1. Validar permisos de sucursal si es vendedor (saler)
            if (session.user.role === 'saler') {
                const userSucursal = await db.query.usuarioSucursal.findFirst({
                    where: {
                        userId: session.user.id,
                        sucursalId,
                    },
                });

                if (!userSucursal) {
                    return {
                        ok: false,
                        msg: 'Permiso denegado: No tienes asignada esta sucursal.',
                    };
                }
            }

            // 2. Verificar que la sucursal exista y esté activa
            const sucursalTarget = await db.query.sucursal.findFirst({
                where: { id: sucursalId },
            });

            if (!sucursalTarget || sucursalTarget.activo === false) {
                return {
                    ok: false,
                    msg: 'La tienda / sucursal seleccionada no existe o está inactiva.',
                };
            }

            // 3. Verificar que la venta exista y pertenezca a la sucursal
            const ventaTarget = await db.query.venta.findFirst({
                where: { id: ventaId },
            });

            if (!ventaTarget) {
                return {
                    ok: false,
                    msg: 'La venta seleccionada no existe.',
                };
            }

            if (ventaTarget.sucursalId !== sucursalId) {
                return {
                    ok: false,
                    msg: 'La venta seleccionada no pertenece a la sucursal elegida.',
                };
            }

            // 3.5 Verificar que exista una caja abierta en la sucursal donde se realizó la venta
            const [cajaAbiertaSede] = await db
                .select({ id: caja.id })
                .from(caja)
                .where(
                    and(
                        eq(caja.sucursalId, ventaTarget.sucursalId),
                        eq(caja.estado, 'abierto')
                    )
                )
                .limit(1);

            if (!cajaAbiertaSede) {
                return {
                    ok: false,
                    msg: 'No hay una caja abierta en la sucursal donde se realizó esta venta. Debes abrir la caja en dicha sucursal antes de registrar la devolución.',
                };
            }

            // 4. Verificar que el producto exista
            const productoTarget = await db.query.products.findFirst({
                where: { id: productoId },
            });

            if (!productoTarget) {
                return {
                    ok: false,
                    msg: 'El producto seleccionado no existe en el catálogo.',
                };
            }

            // 5. Ejecutar registro de devolución, reposición de stock y Kardex en transacción atómica
            const resultado = await db.transaction(async (tx) => {
                // 5.0 Revalidar caja abierta dentro de la transacción para evitar condiciones de carrera
                const [cajaActivaTx] = await tx
                    .select({ id: caja.id })
                    .from(caja)
                    .where(
                        and(
                            eq(caja.sucursalId, ventaTarget.sucursalId),
                            eq(caja.estado, 'abierto')
                        )
                    )
                    .limit(1);

                if (!cajaActivaTx) {
                    throw new Error(
                        'La caja de la sucursal donde se realizó la venta se encuentra cerrada. Abre una caja en dicha sucursal para continuar.'
                    );
                }

                // 5.1 Verificar detalles vendidos en productos_venta (si la venta tiene detalle registrado)
                const ventaItems = await tx
                    .select({
                        productId: productoVenta.productId,
                        cantidadVendida: sql<number>`coalesce(sum(${productoVenta.cantidad}), 0)::int`,
                        precio: sql<number>`max(${productoVenta.precio})::float`,
                        totalPagadoLinea: sql<number>`coalesce(sum(${productoVenta.precioTotal}), 0)::float`,
                    })
                    .from(productoVenta)
                    .where(eq(productoVenta.ventaId, ventaId))
                    .groupBy(productoVenta.productId);

                let precioUnitarioDevolucion = Number(productoTarget.precioVenta) || 0;

                if (ventaItems.length > 0) {
                    const matchedItem = ventaItems.find((i) => i.productId === productoId);
                    if (!matchedItem) {
                        throw new Error(
                            `El producto "${productoTarget.name}" no figura en el detalle de la venta seleccionada.`
                        );
                    }

                    const [prevDevoluciones] = await tx
                        .select({
                            totalDevuelto: sql<number>`coalesce(sum(${devolucion.cantidad}), 0)::int`,
                        })
                        .from(devolucion)
                        .where(
                            and(
                                eq(devolucion.ventaId, ventaId),
                                eq(devolucion.productoId, productoId)
                            )
                        );

                    const yaDevuelto = Number(prevDevoluciones?.totalDevuelto) || 0;
                    const disponibleParaDevolver = Math.max(0, matchedItem.cantidadVendida - yaDevuelto);

                    if (cantidad > disponibleParaDevolver) {
                        throw new Error(
                            `Solo puedes devolver hasta ${disponibleParaDevolver} unidades de este producto (vendidas: ${matchedItem.cantidadVendida}, ya devueltas: ${yaDevuelto}).`
                        );
                    }

                    precioUnitarioDevolucion =
                        matchedItem.cantidadVendida > 0 && matchedItem.totalPagadoLinea > 0
                            ? matchedItem.totalPagadoLinea / matchedItem.cantidadVendida
                            : matchedItem.precio;
                }

                const montoEgreso = Math.max(0, Number((precioUnitarioDevolucion * cantidad).toFixed(2)));

                // 5.2 Insertar registro de devolución
                const fechaActual = new Date();
                const [insertedDevolucion] = await tx
                    .insert(devolucion)
                    .values({
                        cantidad,
                        fecha: fechaActual,
                        motivo: motivo.trim(),
                        sucursalId,
                        ventaId,
                        productoId,
                    })
                    .returning();

                // 5.3 Actualizar o crear stock en stock_sucursal
                const [existingStock] = await tx
                    .select()
                    .from(stockSucursal)
                    .where(
                        and(
                            eq(stockSucursal.productoId, productoId),
                            eq(stockSucursal.sucursalId, sucursalId)
                        )
                    )
                    .limit(1);

                const stockAnterior = existingStock?.cantidad ?? 0;
                const stockActual = stockAnterior + cantidad;

                if (existingStock) {
                    await tx
                        .update(stockSucursal)
                        .set({
                            cantidad: stockActual,
                            updatedAt: fechaActual,
                        })
                        .where(eq(stockSucursal.id, existingStock.id));
                } else {
                    await tx.insert(stockSucursal).values({
                        productoId,
                        sucursalId,
                        cantidad: stockActual,
                        stockMinimo: 5,
                    });
                }

                // 5.4 Obtener correlativo y tipo de comprobante si la venta tiene uno
                let compNumero: string | null = null;
                let compSerie: string | null = null;
                let tipoCompNombre = '';
                if (ventaTarget.comprobanteId) {
                    const [comp] = await tx
                        .select({
                            numero: comprobante.numero,
                            tipoNombre: tipoComprobante.nombre,
                            tipoSerie: tipoComprobante.serie,
                        })
                        .from(comprobante)
                        .leftJoin(
                            tipoComprobante,
                            eq(comprobante.tipoComprobanteId, tipoComprobante.id)
                        )
                        .where(eq(comprobante.id, ventaTarget.comprobanteId))
                        .limit(1);
                    compNumero = comp?.numero ?? null;
                    compSerie = comp?.tipoSerie ?? null;
                    tipoCompNombre = comp?.tipoNombre ?? '';
                }

                // 5.5 Calcular secuencia correlativa en Kardex
                const [lastKardex] = await tx
                    .select({ secuencia: kardex.secuencia })
                    .from(kardex)
                    .where(
                        and(
                            eq(kardex.productoId, productoId),
                            eq(kardex.sucursalId, sucursalId)
                        )
                    )
                    .orderBy(desc(kardex.secuencia))
                    .limit(1);

                const secuencia = (lastKardex?.secuencia ?? 0) + 1;
                const costoUnit = Number(productoTarget.precioCompra ?? productoTarget.precioVenta ?? 0).toFixed(4);
                const comprobanteRef = compNumero
                    ? `DEV-${compNumero}`
                    : `DEV-${insertedDevolucion.id.slice(0, 6).toUpperCase()}`;

                // 5.6 Registrar movimiento de entrada en Kardex
                await tx.insert(kardex).values({
                    secuencia,
                    tipoMovimiento: 'ENTRADA',
                    motivo: 'DEVOLUCION_CLIENTE',
                    detalleMotivo: motivo.trim(),
                    origenTipo: 'DEVOLUCION',
                    origenId: insertedDevolucion.id,
                    cantidad,
                    stockAnterior,
                    stockActual,
                    costoUnitario: costoUnit,
                    costoPromedio: costoUnit,
                    fecha: fechaActual,
                    comprobanteRef,
                    productoId,
                    sucursalId,
                    usuarioId: session.user.id,
                });

                // 5.7 Registrar egreso en la caja abierta de la sucursal donde se realizó la venta
                const nombreTipoLower = tipoCompNombre.toLowerCase();
                const tipoDocEgreso: 'ticket' | 'boleta' | 'factura' | 'cheque' | 'sin comprobante' =
                    nombreTipoLower.includes('factura')
                        ? 'factura'
                        : nombreTipoLower.includes('boleta')
                        ? 'boleta'
                        : nombreTipoLower.includes('ticket')
                        ? 'ticket'
                        : nombreTipoLower.includes('cheque')
                        ? 'cheque'
                        : 'sin comprobante';

                let serieEgreso: string | null = compSerie;
                let numeroEgreso: string | null = compNumero || comprobanteRef;

                if (compNumero && compNumero.includes('-')) {
                    const [seriePart, ...numParts] = compNumero.split('-');
                    serieEgreso = seriePart.trim() || compSerie;
                    numeroEgreso = numParts.join('-').trim() || compNumero;
                }

                await tx.insert(egresos).values({
                    tipoDocumento: tipoDocEgreso,
                    motivo: 'otros',
                    serie: serieEgreso,
                    numero: numeroEgreso,
                    fecha: fechaActual,
                    descripcion: `Devolución de cliente (${comprobanteRef}): ${cantidad} x ${productoTarget.name} — ${motivo.trim()}`,
                    monto: montoEgreso,
                    estado: 'activo',
                    cajaId: cajaActivaTx.id,
                    createdByUserId: session.user.id,
                });

                return {
                    devolucionId: insertedDevolucion.id,
                    stockAnterior,
                    stockActual,
                    comprobanteRef,
                    montoEgreso,
                };
            });

            revalidatePath('/dashboard/devoluciones');
            revalidatePath('/dashboard/inventario/stock');
            revalidatePath('/dashboard/inventario/kardex');
            revalidatePath('/dashboard/caja');

            return {
                ok: true,
                msg: `Devolución registrada (${resultado.comprobanteRef}). Stock en "${sucursalTarget.nombre}": ${resultado.stockAnterior} → ${resultado.stockActual} unid. Egreso en caja: S/ ${resultado.montoEgreso.toFixed(2)}.`,
                data: resultado,
            };
        } catch (error: any) {
            console.error('Error al registrar devolución:', error);
            return {
                ok: false,
                msg: error?.message || 'Error inesperado al registrar la devolución.',
            };
        }
    });

