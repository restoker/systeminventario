export interface Sucursal {
    id: string;
    codigo: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    nombre: string;
    telefono: string;
    direccion: string;
    activo: boolean | null;
    razonSocial: string | null;
    ruc: string | null;
}