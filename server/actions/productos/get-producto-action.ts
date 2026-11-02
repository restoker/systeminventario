'use server';

import db from "@/server";

export const getProductoAction = async (id: string) => {
    try {
        const product = await db.query.products.findFirst({
            where: {
                id: id,
            },
            with: {
                categoria: true,
                marca: true,
                unidad: true,
                proveedor: true,
                stocks: true,
                imagenes: true,
            },
        });

        if (!product) {
            return { ok: false, msg: 'Producto no encontrado', data: null };
        }

        const sucursalId = product.stocks?.[0]?.sucursalId ?? '';

        return {
            ok: true,
            msg: 'Producto obtenido exitosamente',
            data: {
                ...product,
                sucursalId,
            },
        };
    } catch (e) {
        console.error('Error al obtener el producto:', e);
        return {
            ok: false,
            msg: 'Error en el servidor al obtener el producto',
            data: null,
        };
    }
};

