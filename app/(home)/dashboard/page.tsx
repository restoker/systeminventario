import { auth } from "@/lib/auth";
import SidebarAux, { type UserRole } from "../_ui/Sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) redirect("/login");

    return (
        <SidebarAux role={session.user.role as UserRole}>
            <h1>Dashboard</h1>
        </SidebarAux>
    );
}