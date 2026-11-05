import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProductOrden {
    id: string;
    cantidad: number;
}

interface cartState {
    lugarId: string;
    ordenes: ProductOrden[];
    handleLugarId: (id: string) => void;
    handleOrden: (orden: ProductOrden[]) => void;
    tipocliente: string;
    handleTipoCliente: (tipo: string) => void;
    clearTipoCliente: () => void;
    clearOrder: () => void;
    clearLugarId: () => void;
}


export const cartStore = create<cartState>()(
    persist(
        (set) => ({
            lugarId: "",
            ordenes: [],
            handleLugarId: (id: string) => set({ lugarId: id }),
            handleOrden: (orden: ProductOrden[]) => set({ ordenes: orden }),
            tipocliente: "",
            handleTipoCliente: (tipo: string) => set({ tipocliente: tipo }),
            clearTipoCliente: () => set({ tipocliente: "" }),
            clearOrder: () => set({ ordenes: [] }),
            clearLugarId: () => set({ lugarId: "" }),
        }),
        { name: 'cart-storage' }
    )
);
