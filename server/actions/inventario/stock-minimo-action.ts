'use server';

import db from '../../index';
import { actionClient } from '@/lib/safe-action';
import { stockSucursal } from '@/server/schema/stock-sucursal';
import { api } from '@/lib/auth';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateStockMinimoSchema } from '@/types/stock-schema';

export const updateStockMinimoAction = actionClient
    .inputSchema(updateStockMinimoSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción.' };
            }

            const { sucursalId, productoId, stockMinimo } = parsedInput;

            const [existing] = await db
                .select()
                .from(stockSucursal)
                .where(
                    and(
                        eq(stockSucursal.productoId, productoId),
                        eq(stockSucursal.sucursalId, sucursalId)
                    )
                )
                .limit(1);

            if (existing) {
                await db
                    .update(stockSucursal)
                    .set({
                        stockMinimo,
                        updatedAt: new Date(),
                    })
                    .where(eq(stockSucursal.id, existing.id));
            } else {
                await db.insert(stockSucursal).values({
                    productoId,
                    sucursalId,
                    cantidad: 0,
                    stockMinimo,
                });
            }

            revalidatePath('/dashboard/inventario/stock');
            revalidatePath('/dashboard/inventario');

            return {
                ok: true,
                msg: `Stock mínimo actualizado a ${stockMinimo} unidades.`,
            };
        } catch (error: any) {
            console.error('Error al actualizar stock mínimo:', error);
            return {
                ok: false,
                msg: error?.message || 'Error al actualizar el stock mínimo.',
            };
        }
    });

