'use server';

import db from '../../index';
import { actionClient } from '@/lib/safe-action';
import { stockSucursal } from '@/server/schema/stock-sucursal';
import { products } from '@/server/schema/products';
import { kardex } from '@/server/schema/kardex';
import { traslado, trasladoDetalle } from '@/server/schema/traslado';
import { api } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, count, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { trasladoStockSchema } from '@/types/stock-schema';

export const trasladoStockAction = actionClient
    .inputSchema(trasladoStockSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción.' };
            }

            const {
                sucursalOrigenId,
                sucursalDestinoId,
                productoId,
                cantidad,
                motivo,
                observacion,
            } = parsedInput;

            if (sucursalOrigenId === sucursalDestinoId) {
                return {
                    ok: false,
                    msg: 'La sucursal de destino no puede ser idéntica a la sucursal de origen.',
                };
            }

            // 1. Validar permisos de sucursal según el rol del usuario
            if (session.user.role === 'saler') {
                const userSucursal = await db.query.usuarioSucursal.findFirst({
                    where: {
                        userId: session.user.id,
                        sucursalId: sucursalOrigenId,
                    },
                });

                if (!userSucursal) {
                    return {
                        ok: false,
                        msg: 'Permiso denegado: No tienes asignada la sucursal de origen seleccionada.',
                    };
                }
            }

            // 2. Verificar que ambas sucursales existan y estén activas
            const [origen, destino, productoTarget] = await Promise.all([
                db.query.sucursal.findFirst({ where: { id: sucursalOrigenId } }),
                db.query.sucursal.findFirst({ where: { id: sucursalDestinoId } }),
                db.query.products.findFirst({ where: { id: productoId } }),
            ]);

            if (!origen || origen.activo === false) {
                return {
                    ok: false,
                    msg: 'La sucursal de origen no existe o se encuentra inactiva.',
                };
            }

            if (!destino || destino.activo === false) {
                return {
                    ok: false,
                    msg: 'La sucursal de destino no existe o se encuentra inactiva.',
                };
            }

            if (!productoTarget) {
                return {
                    ok: false,
                    msg: 'El producto seleccionado no existe en el catálogo.',
                };
            }

            // 3. Ejecutar traslado atómico: traslado, trasladoDetalle, actualización de stocks y Kardex origen/destino
            const result = await db.transaction(async (tx) => {
                // 3.1 Validar stock disponible en la sucursal de origen
                const [stockOrigen] = await tx
                    .select()
                    .from(stockSucursal)
                    .where(
                        and(
                            eq(stockSucursal.productoId, productoId),
                            eq(stockSucursal.sucursalId, sucursalOrigenId)
                        )
                    )
                    .limit(1);

                const cantidadDisponible = stockOrigen?.cantidad ?? 0;
                if (cantidadDisponible < cantidad) {
                    throw new Error(
                        `Stock insuficiente en ${origen.nombre}. Disponible: ${cantidadDisponible} unid., requerido: ${cantidad} unid.`
                    );
                }

                // 3.2 Generar código correlativo de traslado
                const [{ totalTraslados }] = await tx
                    .select({ totalTraslados: count() })
                    .from(traslado);

                const codigoCorrelativo = `TR-${String(totalTraslados + 1).padStart(6, '0')}`;

                // 3.3 Registrar cabecera del traslado
                const [nuevoTraslado] = await tx
                    .insert(traslado)
                    .values({
                        codigo: codigoCorrelativo,
                        fechaTraslado: new Date(),
                        estado: 'recibido',
                        motivo: motivo.trim(),
                        observacion: observacion?.trim() || null,
                        sucursalOrigenId,
                        sucursalDestinoId,
                        creadoPorId: session.user.id,
                        recibidoPorId: session.user.id,
                        fechaEnvio: new Date(),
                        fechaRecepcion: new Date(),
                    })
                    .returning();

                // 3.4 Registrar detalle del producto trasladado
                await tx.insert(trasladoDetalle).values({
                    trasladoId: nuevoTraslado.id,
                    productoId,
                    cantidadEnviada: cantidad,
                    cantidadRecibida: cantidad,
                });

                // 3.5 Disminuir stock en la sucursal de origen
                const stockAnteriorOrigen = cantidadDisponible;
                const stockActualOrigen = stockAnteriorOrigen - cantidad;

                await tx
                    .update(stockSucursal)
                    .set({
                        cantidad: stockActualOrigen,
                        updatedAt: new Date(),
                    })
                    .where(eq(stockSucursal.id, stockOrigen.id));

                // 3.6 Aumentar o inicializar stock en la sucursal de destino
                const [stockDestino] = await tx
                    .select()
                    .from(stockSucursal)
                    .where(
                        and(
                            eq(stockSucursal.productoId, productoId),
                            eq(stockSucursal.sucursalId, sucursalDestinoId)
                        )
                    )
                    .limit(1);

                const stockAnteriorDestino = stockDestino?.cantidad ?? 0;
                const stockActualDestino = stockAnteriorDestino + cantidad;

                if (stockDestino) {
                    await tx
                        .update(stockSucursal)
                        .set({
                            cantidad: stockActualDestino,
                            updatedAt: new Date(),
                        })
                        .where(eq(stockSucursal.id, stockDestino.id));
                } else {
                    await tx.insert(stockSucursal).values({
                        productoId,
                        sucursalId: sucursalDestinoId,
                        cantidad: stockActualDestino,
                        stockMinimo: 5,
                    });
                }

                const costoUnit = Number(productoTarget.precioCompra ?? 0).toFixed(4);

                // 3.7 Registrar Kardex en sucursal ORIGEN (SALIDA)
                const [lastKardexOrigen] = await tx
                    .select({ secuencia: kardex.secuencia })
                    .from(kardex)
                    .where(
                        and(
                            eq(kardex.productoId, productoId),
                            eq(kardex.sucursalId, sucursalOrigenId)
                        )
                    )
                    .orderBy(desc(kardex.secuencia))
                    .limit(1);

                const secOrigen = (lastKardexOrigen?.secuencia ?? 0) + 1;

                await tx.insert(kardex).values({
                    secuencia: secOrigen,
                    tipoMovimiento: 'SALIDA',
                    motivo: 'TRASLADO_SALIDA',
                    detalleMotivo: `Traslado enviado a "${destino.nombre}" (${codigoCorrelativo}): ${motivo}`,
                    origenTipo: 'TRASLADO',
                    origenId: nuevoTraslado.id,
                    cantidad,
                    stockAnterior: stockAnteriorOrigen,
                    stockActual: stockActualOrigen,
                    costoUnitario: costoUnit,
                    costoPromedio: costoUnit,
                    comprobanteRef: codigoCorrelativo,
                    productoId,
                    sucursalId: sucursalOrigenId,
                    usuarioId: session.user.id,
                });

                // 3.8 Registrar Kardex en sucursal DESTINO (ENTRADA)
                const [lastKardexDestino] = await tx
                    .select({ secuencia: kardex.secuencia })
                    .from(kardex)
                    .where(
                        and(
                            eq(kardex.productoId, productoId),
                            eq(kardex.sucursalId, sucursalDestinoId)
                        )
                    )
                    .orderBy(desc(kardex.secuencia))
                    .limit(1);

                const secDestino = (lastKardexDestino?.secuencia ?? 0) + 1;

                await tx.insert(kardex).values({
                    secuencia: secDestino,
                    tipoMovimiento: 'ENTRADA',
                    motivo: 'TRASLADO_ENTRADA',
                    detalleMotivo: `Traslado recibido desde "${origen.nombre}" (${codigoCorrelativo}): ${motivo}`,
                    origenTipo: 'TRASLADO',
                    origenId: nuevoTraslado.id,
                    cantidad,
                    stockAnterior: stockAnteriorDestino,
                    stockActual: stockActualDestino,
                    costoUnitario: costoUnit,
                    costoPromedio: costoUnit,
                    comprobanteRef: codigoCorrelativo,
                    productoId,
                    sucursalId: sucursalDestinoId,
                    usuarioId: session.user.id,
                });

                return {
                    codigo: codigoCorrelativo,
                    cantidad,
                    origen: origen.nombre,
                    destino: destino.nombre,
                };
            });

            revalidatePath('/dashboard/inventario/stock');
            revalidatePath('/dashboard/inventario');

            return {
                ok: true,
                msg: `Traslado ${result.codigo} registrado exitosamente (${result.cantidad} unid. de "${result.origen}" a "${result.destino}").`,
            };
        } catch (error: any) {
            console.error('Error al procesar traslado de stock:', error);
            return {
                ok: false,
                msg: error?.message || 'Ocurrió un error inesperado al procesar el traslado.',
            };
        }
    });
