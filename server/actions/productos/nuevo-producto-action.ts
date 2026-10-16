'use server';

import { actionClient } from "@/lib/safe-action";
import { productoSchema } from "@/types/producto-schema";

export const nuevoProductoAction = actionClient
    .inputSchema(productoSchema)
    .action(async ({ parsedInput: { name, descripcion, precioCompra, precioVenta, image, codigo, enConsignacion, nota, categoryId, marcaId, unidadId, proveedorId } }) => {
        try {

        } catch (error) {
            console.log(error);
        }
    })