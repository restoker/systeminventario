'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { actionClient } from '@/lib/safe-action';
import { api } from '@/lib/auth';
import db from '@/server';
import { facturacion } from '@/server/schema/facturacion';
import { upsertFacturacionSchema } from '@/types/facturacion-schema';

function normalizeOptional(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

export const upsertFacturacionAction = actionClient
    .inputSchema(upsertFacturacionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user || session.user.role !== 'admin') {
                return {
                    ok: false,
                    msg: 'No tienes permiso para configurar datos de facturación',
                };
            }

            const ruc = await db.query.rucEmpresa.findFirst({
                where: { id: parsedInput.rucEmpresaId },
            });

            if (!ruc) {
                return {
                    ok: false,
                    msg: 'El RUC seleccionado no existe en el sistema',
                };
            }

            const existing = await db.query.facturacion.findFirst({
                where: { rucEmpresaId: parsedInput.rucEmpresaId },
            });

            const payload = {
                ubigeo: normalizeOptional(parsedInput.ubigeo),
                departamento: normalizeOptional(parsedInput.departamento),
                provincia: normalizeOptional(parsedInput.provincia),
                distrito: normalizeOptional(parsedInput.distrito),
                pathCert: normalizeOptional(parsedInput.pathCert),
                logo: normalizeOptional(parsedInput.logo),
                usuarioSol: normalizeOptional(parsedInput.usuarioSol),
                claveSol: normalizeOptional(parsedInput.claveSol),
                passwordCertificadoDigital: normalizeOptional(
                    parsedInput.passwordCertificadoDigital
                ),
                produccion: parsedInput.produccion,
                clienteId: normalizeOptional(parsedInput.clienteId),
                clienteSecret: normalizeOptional(parsedInput.clienteSecret),
            };

            if (existing) {
                const [updated] = await db
                    .update(facturacion)
                    .set({
                        ...payload,
                        updatedAt: new Date(),
                    })
                    .where(eq(facturacion.id, existing.id))
                    .returning();

                revalidatePath('/dashboard/rucs');
                revalidatePath('/dashboard/configuracion');
                revalidatePath('/dashboard/pos');

                return {
                    ok: true,
                    msg: `Datos de facturación actualizados para el RUC ${ruc.numeroRuc}`,
                    data: updated,
                };
            }

            const [created] = await db
                .insert(facturacion)
                .values({
                    ...payload,
                    rucEmpresaId: parsedInput.rucEmpresaId,
                })
                .returning();

            revalidatePath('/dashboard/rucs');
            revalidatePath('/dashboard/configuracion');
            revalidatePath('/dashboard/pos');

            return {
                ok: true,
                msg: `Datos de facturación vinculados al RUC ${ruc.numeroRuc}`,
                data: created,
            };
        } catch (error) {
            console.error('Error in upsertFacturacionAction:', error);
            return {
                ok: false,
                msg: 'Error interno al guardar los datos de facturación',
            };
        }
    });
