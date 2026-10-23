'use server';

import db from '../../index';
import { actionClient } from '@/lib/safe-action';
import { sucursal } from '@/server/schema/sucursal';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const toggleSucursalSchema = z.object({
    id: z.string().min(1, 'ID de sucursal es requerido'),
    activo: z.boolean(),
});

export const toggleSucursalAction = actionClient
    .inputSchema(toggleSucursalSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { id, activo } = parsedInput;

            const [updated] = await db
                .update(sucursal)
                .set({
                    activo,
                    updatedAt: new Date()
                })
                .where(eq(sucursal.id, id))
                .returning();

            revalidatePath('/dashboard/sucursales');

            return {
                ok: true,
                msg: activo ? 'Sucursal activada exitosamente' : 'Sucursal desactivada exitosamente',
                sucursal: updated
            };
        } catch (error) {
            console.error('Error in toggleSucursalAction:', error);
            return {
                ok: false,
                msg: 'Error al cambiar el estado de la sucursal'
            };
        }
    });
