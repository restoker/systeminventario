export interface TipoDocumentoDto {
    id: string;
    nombre: string;
    createdAt: Date;
    updatedAt: Date;
    estado: boolean | null;
}