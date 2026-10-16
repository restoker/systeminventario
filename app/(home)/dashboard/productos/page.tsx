import db from "@/server";
import SidebarAux from "../../_ui/Sidebar";
import TablaProductos from "./_ui/TablaProductos";

export default async function ProductosPage() {

    const productos = await db.query.products.findMany();

    console.log(productos);

    return (
        <SidebarAux>
            <h1>ProductosPage</h1>
            <TablaProductos />
        </SidebarAux>
    );
}