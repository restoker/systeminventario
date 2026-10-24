import z from "zod";

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
] as const;

const isFile = (val: unknown): val is File => typeof File !== "undefined" && val instanceof File;
const isFileList = (val: unknown): val is FileList => typeof FileList !== "undefined" && val instanceof FileList;

const extractFile = (val: unknown): File | null => {
    if (isFile(val)) return val;
    if (isFileList(val)) return val.length > 0 ? val[0] : null;
    return null;
};

export const imageSchema = z
    .custom<File | FileList | string | undefined | null>()
    .refine(
        (val) => {
            if (!val || typeof val === "string") return true;
            if (isFileList(val) && val.length === 0) return true;
            const file = extractFile(val);
            if (file) {
                return file.size <= MAX_IMAGE_SIZE;
            }
            return false;
        },
        {
            message: "El tamaño de la imagen no debe superar los 2MB",
        }
    )
    .refine(
        (val) => {
            if (!val || typeof val === "string") return true;
            if (isFileList(val) && val.length === 0) return true;
            const file = extractFile(val);
            if (file) {
                return ACCEPTED_IMAGE_TYPES.includes(file.type as any) || file.type.startsWith("image/");
            }
            return false;
        },
        {
            message: "Solo se permiten imágenes (JPEG, PNG, WEBP, GIF, AVIF). No se permiten videos ni otros archivos",
        }
    )
    .optional()
    .nullable();

export const productoSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100, "El nombre debe tener menos de 100 caracteres"),
    descripcion: z.string().min(3, "La descripción debe tener al menos 3 caracteres").max(100, "La descripción debe tener menos de 100 caracteres"),
    precioCompra: z.number().min(0, "El precio debe ser mayor o igual a 0"),
    precioVenta: z.number().min(1, "El precio debe ser mayor a 0"),
    // stock: z.number().min(0, "El stock debe ser mayor o igual a 0"),
    image: imageSchema,
    codigo: z.string().min(3, "El código de barras debe tener al menos 3 caracteres").max(100, "El código de barras debe tener menos de 100 caracteres"),
    enConsignacion: z.boolean(),
    // el stock por sucursal vive en `stock_sucursal`
    nota: z.string().optional(),
    // slug: z.string().min(3, "El slug debe tener al menos 3 caracteres").max(100, "El slug debe tener menos de 100 caracteres"),
    igv: z.string().min(1, "El IGV es obligatorio"),
    categoryId: z.string().min(3, "La categoría es obligatoria").max(100, "La categoría debe tener menos de 100 caracteres"),
    marcaId: z.string().min(1, "La marca es obligatoria"),
    unidadId: z.string().min(3, "La unidad es obligatoria").max(100, "La unidad debe tener menos de 100 caracteres"),
    proveedorId: z.string().min(1, "El proveedor es obligatorio"),
    sucursalId: z.string().min(1, "La sucursal es obligatoria"),
});

export type ProductSchema = z.infer<typeof productoSchema>;
