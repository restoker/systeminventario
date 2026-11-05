'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';
import {
    ArrowLeftIcon,
    WalletIcon,
    StoreIcon,
    MapPinIcon,
    CoinsIcon,
    Loader2Icon,
    LockIcon,
    AlertCircleIcon,
    CheckCircle2Icon
} from 'lucide-react';
import { Sucursal } from '@/interfaces';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { abrirCajaAction } from '@/server/actions/caja/abrir-caja-action';

interface AbrirCajaViewProps {
    sucursal: Sucursal;
    sucursales?: Sucursal[];
}

export default function AbrirCajaView({ sucursal, sucursales = [] }: AbrirCajaViewProps) {
    const router = useRouter();
    const [montoInicial, setMontoInicial] = useState<string>('0.00');
    const [montoError, setMontoError] = useState<string | null>(null);

    const { execute, status } = useAction(abrirCajaAction, {
        onSuccess: ({ data }) => {
            if (data?.ok) {
                toast.success(data.msg || 'Caja abierta exitosamente');
                router.refresh();
            } else if (data?.msg) {
                toast.error(data.msg);
            }
        },
        onError: () => {
            toast.error('Ocurrió un error al intentar abrir la caja');
        }
    });

    const isPending = status === 'executing';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericMonto = parseFloat(montoInicial);

        if (isNaN(numericMonto) || numericMonto < 0) {
            setMontoError('El monto inicial debe ser un número válido mayor o igual a 0');
            return;
        }

        setMontoError(null);
        execute({
            montoInicial: numericMonto,
            sucursalId: sucursal.id,
        });
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
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
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                {sucursal.nombre}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Código de sede: <span className="font-mono text-foreground font-semibold">{sucursal.codigo}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Branch Switcher & Actions */}
                <div className="flex items-center gap-2.5">
                    {sucursales.length > 1 && (
                        <div className="flex items-center gap-2">
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
                        </div>
                    )}
                    <Link
                        href="/dashboard/caja"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                        Cambiar Sucursal
                    </Link>
                </div>
            </div>

            {/* Sucursal Overview Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="rounded-lg p-2.5 bg-muted text-foreground shrink-0">
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
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 py-1 px-2.5 text-xs">
                        <LockIcon className="size-3 mr-1.5" />
                        Caja Cerrada
                    </Badge>
                </div>
            </div>

            {/* Apertura de Caja Form Section */}
            <Card className="border shadow-xs">
                <CardHeader className="space-y-1 pb-4">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                        <WalletIcon className="size-4" />
                        <span>Gestión de Turno</span>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                        Apertura de Nueva Caja
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Actualmente no hay ninguna caja abierta en esta sucursal. Para habilitar las operaciones de venta en el POS, realiza la apertura indicando el saldo o fondo inicial.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                        <div className="space-y-2">
                            <Label htmlFor="montoInicial" className="text-xs font-semibold text-foreground">
                                Monto Inicial de Apertura (S/) <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-muted-foreground font-semibold text-sm">
                                    S/
                                </div>
                                <Input
                                    id="montoInicial"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={montoInicial}
                                    onChange={(e) => {
                                        setMontoInicial(e.target.value);
                                        if (montoError) setMontoError(null);
                                    }}
                                    disabled={isPending}
                                    className={`pl-9 text-base font-medium ${montoError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            {montoError && (
                                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                    <AlertCircleIcon className="size-3.5" />
                                    {montoError}
                                </p>
                            )}
                            <p className="text-[11px] text-muted-foreground">
                                Ingresa el efectivo base con el que inicia la jornada para cambio o devueltos. Si inicia sin efectivo, puedes dejarlo en 0.00.
                            </p>
                        </div>

                        {/* Quick Presets for Monto Inicial */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Montos rápidos sugeridos:</span>
                            <div className="flex flex-wrap gap-2">
                                {[0, 50, 100, 150, 200, 300].map((preset) => (
                                    <Button
                                        key={preset}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() => {
                                            setMontoInicial(preset.toFixed(2));
                                            if (montoError) setMontoError(null);
                                        }}
                                        className="h-7 text-xs px-2.5 font-mono"
                                    >
                                        S/ {preset.toFixed(2)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="cursor-pointer font-semibold gap-2 min-w-40"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2Icon className="size-4 animate-spin" />
                                        <span>Abriendo caja...</span>
                                    </>
                                ) : (
                                    <>
                                        <WalletIcon className="size-4" />
                                        <span>Abrir Caja</span>
                                    </>
                                )}
                            </Button>

                            <Link
                                href="/dashboard/caja"
                                className={buttonVariants({ variant: "ghost" })}
                            >
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
