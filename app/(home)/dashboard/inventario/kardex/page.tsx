import SidebarAux from "@/app/(home)/_ui/Sidebar";
import db from "@/server";

export default async function KardexPage() {
    const kardex = await db.query.kardex.findMany();
    return (
        <SidebarAux>
            <h1 className="text-3xl">Kardex</h1>
        </SidebarAux>
    )
}   