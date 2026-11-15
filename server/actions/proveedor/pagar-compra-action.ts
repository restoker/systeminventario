'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';

import db from '@/server';
import { api } from '@/lib/auth';
import { actionClient } from '@/lib/safe-action';
import { compra } from '@/server/schema/compras';
import { egresos } from '@/server/schema/egreso';
import { caja } from '@/server/schema/caja';
import { proveedor } from '@/server/schema/proveedor';
import { tipoComprobante } from '@/server/schema/tipo-comprobante';
import { pagarCompraProveedorSchema } from '@/types/proveedor-transacciones-schema';

export const pagarCompraProveedorAction = actionClient
    .inputSchema(pagarCompraProveedorSchema)
    .action(async ({ parsedInput }) => {
        try {
            const session = await api.getSession({ headers: await headers() });
            if (!session?.user) {
                return { ok: false, msg: 'No autorizado para realizar esta acción.' };
            }

            const { compraId } = parsedInput;

            // 1. Obtener la compra actual
            const [compraTarget] = await db
                .select({
                    id: compra.id,
                    monto: compra.monto,
                    numeroComprobante: compra.numeroComprobante,
                    estado: compra.estado,
                    sucursalId: compra.sucursalId,
                    proveedorId: compra.proveedorId,
                    tipoComprobanteId: compra.tipoComprobanteId,
                })
                .from(compra)
                .where(eq(compra.id, compraId))
                .limit(1);

            if (!compraTarget) {
                return { ok: false, msg: 'La compra seleccionada no existe.' };
            }

            if (compraTarget.estado === 'pagado') {
                return { ok: false, msg: 'Esta compra ya figura como pagada.' };
            }

            // 2. Validar acceso de sucursal si es vendedor
            if (session.user.role === 'saler') {
                const userSucursal = await db.query.usuarioSucursal.findFirst({
                    where: {
                        userId: session.user.id,
                        sucursalId: compraTarget.sucursalId,
                    },
                });
                if (!userSucursal) {
                    return {
                        ok: false,
                        msg: 'Permiso denegado: esta compra pertenece a otra sucursal.',
                    };
                }
            }

            // 3. Obtener proveedor y tipo de comprobante para el asiento de egreso
            const [provRow] = await db
                .select({
                    nombre: proveedor.nombre,
                    razonSocial: proveedor.razonSocial,
                })
                .from(proveedor)
                .where(eq(proveedor.id, compraTarget.proveedorId))
                .limit(1);

            const [tipoCompRow] = await db
                .select({
                    nombre: tipoComprobante.nombre,
                    serie: tipoComprobante.serie,
                })
                .from(tipoComprobante)
                .where(eq(tipoComprobante.id, compraTarget.tipoComprobanteId))
                .limit(1);

            // 4. Validar caja abierta en la sucursal de la compra y ejecutar pago + egreso en transacción
            const resultado = await db.transaction(async (tx) => {
                const [cajaAbierta] = await tx
                    .select({ id: caja.id })
                    .from(caja)
                    .where(
                        and(
                            eq(caja.sucursalId, compraTarget.sucursalId),
                            eq(caja.estado, 'abierto')
                        )
                    )
                    .limit(1);

                if (!cajaAbierta) {
                    throw new Error(
                        'No hay una caja abierta en la sucursal de esta compra. Abre la caja en dicha sucursal para registrar el pago.'
                    );
                }

                const [updatedCompra] = await tx
                    .update(compra)
                    .set({
                        estado: 'pagado',
                        updatedAt: new Date(),
                    })
                    .where(and(eq(compra.id, compraTarget.id), eq(compra.estado, 'pendiente')))
                    .returning();

                if (!updatedCompra) {
                    throw new Error('Esta compra ya fue liquidada anteriormente.');
                }

                const nombreTipoLower = (tipoCompRow?.nombre || '').toLowerCase();
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

                const rawComp = (compraTarget.numeroComprobante || '').trim();
                let serieEgreso: string | null = tipoCompRow?.serie || null;
                let numeroEgreso: string | null = rawComp || 'S/N';

                if (rawComp.includes('-')) {
                    const [seriePart, ...numParts] = rawComp.split('-');
                    serieEgreso = seriePart.trim() || serieEgreso;
                    numeroEgreso = numParts.join('-').trim() || rawComp;
                }

                const nombreProveedor = provRow?.razonSocial || provRow?.nombre || 'Proveedor';

                await tx.insert(egresos).values({
                    tipoDocumento: tipoDocEgreso,
                    motivo: 'compras',
                    serie: serieEgreso,
                    numero: numeroEgreso,
                    fecha: new Date(),
                    descripcion: `Pago de compra pendiente (${rawComp || 'S/N'}) - Prov: ${nombreProveedor}`,
                    monto: compraTarget.monto,
                    estado: 'activo',
                    cajaId: cajaAbierta.id,
                    createdByUserId: session.user.id,
                });

                return {
                    monto: compraTarget.monto,
                    comprobante: rawComp || 'S/N',
                    proveedor: nombreProveedor,
                };
            });

            revalidatePath('/dashboard/proveedores/transacciones');
            revalidatePath('/dashboard/proveedores');
            revalidatePath('/dashboard/caja');

            return {
                ok: true,
                msg: `Pago registrado (${resultado.comprobante} — ${resultado.proveedor}). Egreso en caja: S/ ${resultado.monto.toFixed(2)}.`,
            };
        } catch (error) {
            console.error('Error en pagarCompraProveedorAction:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Ocurrió un error al registrar el pago al proveedor.';
            return {
                ok: false,
                msg: message,
            };
        }
    });
