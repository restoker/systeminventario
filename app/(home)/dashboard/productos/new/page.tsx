import SidebarAux from "@/app/(home)/_ui/Sidebar";
import FormNewProduct from "./_ui/FormNewProduct";
import db from "@/server";

export default async function NewProductPage() {
    const categorias = await db.query.categorias.findMany();
    const sucursales = await db.query.sucursal.findMany();
    const igv = await db.query.igv.findMany();
    const proveedor = await db.query.proveedor.findMany();
    const unidad = await db.query.unidades.findMany();
    const marcas = await db.query.marcas.findMany();
    return (
        <SidebarAux>
            {/* <h1>NewProductPage</h1> */}
            <FormNewProduct categorias={categorias} sucursales={sucursales} igv={igv} proveedor={proveedor} unidad={unidad} marcas={marcas} />
        </SidebarAux>
    );
}