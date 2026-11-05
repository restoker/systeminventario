'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    WalletIcon,
    StoreIcon,
    CheckCircle2Icon,
    MapPinIcon
} from 'lucide-react';
import { Sucursal } from '@/interfaces';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CajaAbiertaViewProps {
    sucursal: Sucursal;
    sucursales?: Sucursal[];
    caja?: any;
}

export default function CajaAbiertaView({
    sucursal,
    sucursales = [],
    caja
}: CajaAbiertaViewProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/caja" className="hover:underline">Caja</Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">{sucursal.nombre}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard/caja"
                            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                            aria-label="Volver a selección de sucursales"
                        >
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    Caja Abierta
                                </h1>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                                    <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                    Operativa
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                Sucursal: <span className="font-semibold text-foreground">{sucursal.nombre}</span> ({sucursal.codigo})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Branch Switcher & Actions */}
                <div className="flex items-center gap-2.5">
                    {sucursales.length > 1 && (
                        <select
                            className="h-9 px-3 rounded-md border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            value={sucursal.id}
                            onChange={(e) => {
                                router.push(`/dashboard/caja?sucursalId=${e.target.value}`);
                            }}
                        >
                            {sucursales.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre} ({s.codigo})
                                </option>
                            ))}
                        </select>
                    )}
                    <Link
                        href="/dashboard/caja"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                        Cambiar Sucursal
                    </Link>
                </div>
            </div>

            {/* Sucursal Summary Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <StoreIcon className="size-5" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{sucursal.nombre}</span>
                            <Badge variant="outline" className="text-[10px]">
                                {sucursal.codigo}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <MapPinIcon className="size-3" />
                                {sucursal.direccion || 'Sin dirección'}
                            </span>
                            {sucursal.telefono && (
                                <span>• Tel: {sucursal.telefono}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-1 px-2.5 text-xs">
                        <CheckCircle2Icon className="size-3 mr-1.5" />
                        Caja Activa
                    </Badge>
                </div>
            </div>

            {/* Placeholder Container as requested */}
            <Card className="border border-dashed shadow-xs">
                <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <WalletIcon className="size-8" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Caja Abierta - {sucursal.nombre}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                        La caja se encuentra abierta y habilitada para registrar ventas y movimientos.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
