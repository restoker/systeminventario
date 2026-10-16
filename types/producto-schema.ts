import z from "zod";

export const productoSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100, "El nombre debe tener menos de 100 caracteres"),
    descripcion: z.string().min(3, "La descripción debe tener al menos 3 caracteres").max(100, "La descripción debe tener menos de 100 caracteres"),
    precioCompra: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    precioVenta: z.number().min(1, "El precio debe ser mayor a 0"),
    // stock: z.number().min(0, "El stock debe ser mayor o igual a 0"),
    image: z.string(),
    codigo: z.string().min(3, "El código de barras debe tener al menos 3 caracteres").max(100, "El código de barras debe tener menos de 100 caracteres"),
    enConsignacion: z.boolean().default(false),//si esta en consignación se no se establece el precio de compra
    // el stock por sucursal vive en `stock_sucursal`
    nota: z.string().min(3, "La nota debe tener al menos 3 caracteres").max(100, "La nota debe tener menos de 100 caracteres"),
    // slug: z.string().min(3, "El slug debe tener al menos 3 caracteres").max(100, "El slug debe tener menos de 100 caracteres"),
    categoryId: z.string().min(3, "La categoría debe tener al menos 3 caracteres").max(100, "La categoría debe tener menos de 100 caracteres"),
    marcaId: z.string().min(3, "La marca debe tener al menos 3 caracteres").max(100, "La marca debe tener menos de 100 caracteres"),
    unidadId: z.string().min(3, "La unidad debe tener al menos 3 caracteres").max(100, "La unidad debe tener menos de 100 caracteres"),
    proveedorId: z.string().min(3, "El proveedor debe tener al menos 3 caracteres").max(100, "El proveedor debe tener menos de 100 caracteres"),
});

export type ProductSchema = z.infer<typeof productoSchema>;
