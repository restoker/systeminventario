'use server';

import db from '../../index';
import { actionClient } from '@/lib/safe-action';
import { stockSucursal } from '@/server/schema/stock-sucursal';
import { products } from '@/server/schema/products';
import { kardex } from '@/server/schema/kardex';
import { api } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { reabastecerSchema } from '@/types/reabastecer-schema';

export const reabastecerAction = actionClient
    .inputSchema(reabastecerSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción' };
            }

            const { productoId, sucursalId, cantidad, costoUnitario, proveedorId, numeroComprobante, motivo } = parsedInput;

            // 1. Validar que la caja de la sucursal esté abierta
            const cajaAbierta = await db.query.caja.findFirst({
                where: {
                    AND: [
                        { estado: 'abierto' },
                        { sucursalId: sucursalId }
                    ]
                }
            });

            if (!cajaAbierta) {
                return {
                    ok: false,
                    msg: 'Operación denegada: La caja de esta sucursal no se encuentra abierta.'
                };
            }

            // 2. Actualizar o crear registro en stock_sucursal
            const existingStock = await db.query.stockSucursal.findFirst({
                where: {
                    AND: [
                        { productoId: productoId },
                        { sucursalId: sucursalId }
                    ]
                }
            });

            const stockAnterior = existingStock?.cantidad ?? 0;
            const stockActual = stockAnterior + cantidad;

            if (existingStock) {
                await db
                    .update(stockSucursal)
                    .set({
                        cantidad: sql`${stockSucursal.cantidad} + ${cantidad}`,
                        updatedAt: new Date()
                    })
                    .where(eq(stockSucursal.id, existingStock.id));
            } else {
                await db.insert(stockSucursal).values({
                    productoId,
                    sucursalId,
                    cantidad,
                    stockMinimo: 5,
                });
            }

            // 3. Si se especificó costo unitario o proveedor, actualizar el producto
            const productUpdates: Record<string, unknown> = {
                updatedAt: new Date()
            };

            if (costoUnitario !== undefined && costoUnitario > 0) {
                productUpdates.precioCompra = costoUnitario;
            }

            if (proveedorId && proveedorId.trim() !== '') {
                productUpdates.proveedorId = proveedorId;
            }

            if (Object.keys(productUpdates).length > 1) {
                await db
                    .update(products)
                    .set(productUpdates)
                    .where(eq(products.id, productoId));
            }

            // 4. Registrar en kardex de forma segura
            try {
                const lastKardex = await db.query.kardex.findFirst({
                    where: {
                        AND: [
                            { productoId: productoId },
                            { sucursalId: sucursalId }
                        ]
                    },
                    orderBy: { secuencia: 'desc' },
                });

                const secuencia = (lastKardex?.secuencia ?? 0) + 1;

                await db.insert(kardex).values({
                    secuencia,
                    tipoMovimiento: "ENTRADA",
                    motivo: "COMPRA",
                    detalleMotivo: motivo?.trim() || "Reabastecimiento de inventario en sucursal",
                    cantidad,
                    stockAnterior,
                    stockActual,
                    costoUnitario: costoUnitario ? costoUnitario.toFixed(4) : undefined,
                    costoPromedio: costoUnitario ? costoUnitario.toFixed(4) : undefined,
                    comprobanteRef: numeroComprobante?.trim() || undefined,
                    productoId,
                    sucursalId,
                    usuarioId: session.user.id,
                });
            } catch (kardexError) {
                console.warn('Advertencia: No se pudo registrar en kardex:', kardexError);
            }

            // 5. Revalidar rutas
            revalidatePath('/dashboard/inventario');
            revalidatePath('/dashboard/inventario/reabastecer');
            revalidatePath('/dashboard/pos');
            revalidatePath('/dashboard/productos');

            return {
                ok: true,
                msg: `Se han reabastecido ${cantidad} unidades exitosamente.`
            };
        } catch (error) {
            console.error('Error en reabastecerAction:', error);
            return {
                ok: false,
                msg: 'Error interno en el servidor al reabastecer inventario.'
            };
        }
    });
