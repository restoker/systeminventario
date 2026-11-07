'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Building2Icon,
    SearchIcon,
    MapPinIcon,
    PhoneIcon,
    WalletIcon,
    ChevronRightIcon,
    CheckCircle2Icon,
    PowerOffIcon,
    StoreIcon,
    ArrowRightIcon
} from 'lucide-react';
import { Sucursal } from '@/interfaces';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SelectSucursalProps {
    sucursales: Sucursal[];
    targetUrl?: string;
    title?: string;
    subtitle?: string;
    actionLabel?: string;
    moduleName?: string;
}

export default function SelectSucursal({
    sucursales,
    targetUrl = '/dashboard/caja',
    title = 'Gestión y Control de Caja',
    subtitle = 'Selecciona una sucursal para consultar el estado de la caja o abrir una nueva jornada.',
    actionLabel = 'Gestionar Caja',
    moduleName = 'Caja',
}: SelectSucursalProps) {
    const [search, setSearch] = useState('');

    const filteredSucursales = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return sucursales;
        return sucursales.filter((s) =>
            s.nombre.toLowerCase().includes(query) ||
            s.codigo.toLowerCase().includes(query) ||
            s.direccion.toLowerCase().includes(query)
        );
    }, [sucursales, search]);

    const totalSucursales = sucursales.length;
    const totalActivas = sucursales.filter((s) => s.activo ?? true).length;

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span className="text-foreground font-medium">{moduleName}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg p-2 bg-primary/10 text-primary">
                            <WalletIcon className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5">
                    <div className="rounded-lg p-2.5 bg-primary/10 text-primary shrink-0">
                        <Building2Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block truncate">Total Sucursales</span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">{totalSucursales}</span>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5">
                    <div className="rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="text-xs text-muted-foreground block truncate">Sedes Operativas</span>
                        <span className="text-xl sm:text-2xl font-bold text-foreground">{totalActivas}</span>
                    </div>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Buscar por nombre, código o dirección..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-end sm:self-auto">
                    <span>Mostrando</span>
                    <span className="font-semibold text-foreground">{filteredSucursales.length}</span>
                    <span>de {totalSucursales} sedes</span>
                </div>
            </div>

            {/* Sucursales List / Grid */}
            {filteredSucursales.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card/50 p-12 text-center flex flex-col items-center justify-center">
                    <div className="rounded-full bg-muted p-3 mb-3 text-muted-foreground">
                        <StoreIcon className="size-6" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                        {sucursales.length === 0 ? "No hay sucursales registradas" : "No se encontraron sucursales"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                        {sucursales.length === 0
                            ? "Debes registrar al menos una sucursal en el sistema antes de gestionar cajas."
                            : "No hay sedes que coincidan con el término de búsqueda ingresado."}
                    </p>
                    {sucursales.length === 0 ? (
                        <Link href="/dashboard/sucursales" className={buttonVariants({ size: "sm" })}>
                            Registrar Sucursal
                            <ArrowRightIcon className="size-4 ml-1.5" />
                        </Link>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                            Limpiar búsqueda
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSucursales.map((sucursal) => {
                        const isActivo = sucursal.activo ?? true;
                        const separator = targetUrl.includes('?') ? '&' : '?';
                        return (
                            <Link
                                key={sucursal.id}
                                href={`${targetUrl}${separator}sucursalId=${sucursal.id}`}
                                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                            >
                                <Card className="h-full border transition-all duration-200 hover:border-primary/50 hover:shadow-md group-hover:-translate-y-0.5">
                                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="rounded-lg p-2 bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                                        <StoreIcon className="size-5" />
                                                    </div>
                                                    <div>
                                                        <h2 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                                            {sucursal.nombre}
                                                        </h2>
                                                        <span className="text-[11px] font-mono text-muted-foreground">
                                                            {sucursal.codigo}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={isActivo ? "default" : "secondary"}
                                                    className={isActivo ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]" : "text-[10px]"}
                                                >
                                                    {isActivo ? (
                                                        <>
                                                            <span className="size-1.5 rounded-full bg-emerald-500 mr-1" />
                                                            Operativa
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PowerOffIcon className="size-2.5 mr-1" />
                                                            Inactiva
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1.5 pt-1 text-xs text-muted-foreground border-t">
                                                <div className="flex items-center gap-2 truncate">
                                                    <MapPinIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                                                    <span className="truncate">{sucursal.direccion || "Sin dirección"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 truncate">
                                                    <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                                                    <span>{sucursal.telefono || "Sin teléfono"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex items-center justify-between text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
                                            <span>{actionLabel}</span>
                                            <ChevronRightIcon className="size-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
