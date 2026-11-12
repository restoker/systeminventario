'use server';

import db from '../../index';
import { actionClient } from '@/lib/safe-action';
import { stockSucursal } from '@/server/schema/stock-sucursal';
import { products } from '@/server/schema/products';
import { kardex, type MotivoKardex, type TipoMovimientoKardex } from '@/server/schema/kardex';
import { api } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ajusteStockSchema } from '@/types/stock-schema';

export const ajusteStockAction = actionClient
    .inputSchema(ajusteStockSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción.' };
            }

            const { sucursalId, productoId, tipoOperacion, cantidad, motivo, observacion } = parsedInput;

            // 1. Validar permisos de sucursal según el rol del usuario
            if (session.user.role === 'saler') {
                const userSucursal = await db.query.usuarioSucursal.findFirst({
                    where: {
                        userId: session.user.id,
                        sucursalId: sucursalId,
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
                    msg: 'La sucursal seleccionada no existe o se encuentra inactiva.',
                };
            }

            // 3. Verificar que el producto exista
            const productoTarget = await db.query.products.findFirst({
                where: { id: productoId },
            });

            if (!productoTarget) {
                return {
                    ok: false,
                    msg: 'El producto seleccionado no existe en el catálogo.',
                };
            }

            // 4. Ejecutar la operación de ajuste de stock dentro de una transacción
            const resultado = await db.transaction(async (tx) => {
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
                let stockActual = stockAnterior;
                let diferencia = 0;
                let tipoMovimiento: TipoMovimientoKardex = 'ENTRADA';
                let motivoFinal: MotivoKardex = 'AJUSTE_POSITIVO';

                if (tipoOperacion === 'INCREMENTO') {
                    if (cantidad <= 0) {
                        throw new Error('La cantidad a incrementar debe ser mayor a 0.');
                    }
                    diferencia = cantidad;
                    stockActual = stockAnterior + diferencia;
                    tipoMovimiento = 'ENTRADA';
                    motivoFinal = motivo === 'INVENTARIO_INICIAL' ? 'INVENTARIO_INICIAL' : 'AJUSTE_POSITIVO';
                } else if (tipoOperacion === 'DECREMENTO') {
                    if (cantidad <= 0) {
                        throw new Error('La cantidad a decrementar debe ser mayor a 0.');
                    }
                    if (cantidad > stockAnterior) {
                        throw new Error(
                            `No puedes descontar ${cantidad} unidades. El stock disponible actual es de ${stockAnterior}.`
                        );
                    }
                    diferencia = cantidad;
                    stockActual = stockAnterior - diferencia;
                    tipoMovimiento = 'SALIDA';
                    motivoFinal = motivo === 'MERMA' ? 'MERMA' : 'AJUSTE_NEGATIVO';
                } else if (tipoOperacion === 'CONTEO_FISICO') {
                    const nuevoStock = cantidad;
                    if (nuevoStock === stockAnterior) {
                        throw new Error(
                            `El stock físico ingresado (${nuevoStock}) es igual al stock actual registrado. No requiere ajuste.`
                        );
                    }
                    if (nuevoStock > stockAnterior) {
                        diferencia = nuevoStock - stockAnterior;
                        stockActual = nuevoStock;
                        tipoMovimiento = 'ENTRADA';
                        motivoFinal = 'AJUSTE_POSITIVO';
                    } else {
                        diferencia = stockAnterior - nuevoStock;
                        stockActual = nuevoStock;
                        tipoMovimiento = 'SALIDA';
                        motivoFinal = motivo === 'MERMA' ? 'MERMA' : 'AJUSTE_NEGATIVO';
                    }
                }

                // 4.1 Actualizar o insertar en stock_sucursal
                if (existingStock) {
                    await tx
                        .update(stockSucursal)
                        .set({
                            cantidad: stockActual,
                            updatedAt: new Date(),
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

                // 4.2 Obtener secuencia correlativa en Kardex
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
                const costoUnit = Number(productoTarget.precioCompra ?? 0).toFixed(4);
                const comprobanteRef = `AJ-${Date.now().toString().slice(-6)}`;
                const origenId = crypto.randomUUID();

                // 4.3 Registrar movimiento inmutable en Kardex
                await tx.insert(kardex).values({
                    secuencia,
                    tipoMovimiento,
                    motivo: motivoFinal,
                    detalleMotivo:
                        observacion?.trim() ||
                        `Ajuste manual de existencias (${tipoOperacion.toLowerCase()} de ${diferencia} unid.)`,
                    origenTipo: 'AJUSTE',
                    origenId,
                    cantidad: diferencia,
                    stockAnterior,
                    stockActual,
                    costoUnitario: costoUnit,
                    costoPromedio: costoUnit,
                    comprobanteRef,
                    productoId,
                    sucursalId,
                    usuarioId: session.user.id,
                });

                return {
                    stockAnterior,
                    stockActual,
                    diferencia,
                    tipoMovimiento,
                };
            });

            revalidatePath('/dashboard/inventario/stock');
            revalidatePath('/dashboard/inventario');

            return {
                ok: true,
                msg: `Stock actualizado con éxito. Stock anterior: ${resultado.stockAnterior} → Nuevo stock: ${resultado.stockActual}.`,
            };
        } catch (error: any) {
            console.error('Error al realizar ajuste de stock:', error);
            return {
                ok: false,
                msg: error?.message || 'Ocurrió un error inesperado al realizar el ajuste.',
            };
        }
    });
