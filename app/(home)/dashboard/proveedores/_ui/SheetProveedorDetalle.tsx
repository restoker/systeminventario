'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    Building2,
    FileText,
    Phone,
    Mail,
    MapPin,
    Package,
    Calendar,
    Clock,
    Copy,
    Check,
    Edit3,
    Power,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProveedorWithProductCount } from '@/interfaces';

interface SheetProveedorDetalleProps {
    proveedor: ProveedorWithProductCount | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (prov: ProveedorWithProductCount) => void;
    onToggleStatus: (prov: ProveedorWithProductCount) => void;
}

export default function SheetProveedorDetalle({
    proveedor,
    isOpen,
    onClose,
    onEdit,
    onToggleStatus,
}: SheetProveedorDetalleProps) {
    const [copiedField, setCopiedField] = React.useState<string | null>(null);

    if (!proveedor) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast.success(`${label} copiado al portapapeles`);
        setTimeout(() => setCopiedField(null), 1800);
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'No registrado';
        const d = new Date(date);
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join('');
    };

    const cleanPhone = proveedor.telefono?.replace(/[^0-9]/g, '') || '';

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col justify-between overflow-y-auto"
            >
                <div>
                    {/* Header Banner */}
                    <div className="p-6 border-b border-border/70 bg-muted/20">
                        <SheetHeader className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base select-none">
                                        {getInitials(proveedor.nombre) || <Building2 className="size-6" />}
                                    </div>
                                    <div>
                                        <SheetTitle className="text-lg font-bold tracking-tight text-foreground capitalize">
                                            {proveedor.nombre}
                                        </SheetTitle>
                                        {proveedor.razonSocial && (
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide line-clamp-1">
                                                {proveedor.razonSocial}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Badge
                                    variant={proveedor.activo ? 'outline' : 'secondary'}
                                    className={`shrink-0 rounded-full text-[11px] font-medium px-2.5 py-0.5 border ${proveedor.activo
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
                                            : 'bg-muted text-muted-foreground border-border'
                                        }`}
                                >
                                    {proveedor.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                            <SheetDescription className="text-xs text-muted-foreground">
                                Ficha consolidada de proveedor, información tributaria y vínculos en catálogo.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body content */}
                    <div className="p-6 space-y-6">
                        {/* Identificación Fiscal */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Identificación Tributaria
                            </h4>
                            <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="size-3.5" />
                                        RUC / Documento
                                    </span>
                                    {proveedor.numeroDocumento ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-xs font-semibold text-foreground">
                                                {proveedor.numeroDocumento}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        proveedor.numeroDocumento!,
                                                        'RUC'
                                                    )
                                                }
                                                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
                                                title="Copiar RUC"
                                            >
                                                {copiedField === 'RUC' ? (
                                                    <Check className="size-3 text-emerald-600" />
                                                ) : (
                                                    <Copy className="size-3" />
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                            No especificado
                                        </span>
                                    )}
                                </div>

                                {proveedor.razonSocial && (
                                    <div className="pt-2 border-t border-border/50">
                                        <span className="text-[11px] text-muted-foreground block mb-0.5">
                                            Razón Social Registrada:
                                        </span>
                                        <span className="text-xs font-medium text-foreground capitalize">
                                            {proveedor.razonSocial}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contacto Directo */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Canales de Contacto
                            </h4>
                            <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Phone className="size-3.5" />
                                        Teléfono
                                    </span>
                                    {proveedor.telefono ? (
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`tel:${proveedor.telefono}`}
                                                className="text-xs font-medium text-foreground hover:underline"
                                            >
                                                {proveedor.telefono}
                                            </a>
                                            {cleanPhone.length >= 9 && (
                                                <a
                                                    href={`https://wa.me/51${cleanPhone}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                                                    title="Abrir WhatsApp"
                                                >
                                                    <span>WA</span>
                                                    <ExternalLink className="size-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                            Sin teléfono
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Mail className="size-3.5" />
                                        Correo
                                    </span>
                                    {proveedor.email ? (
                                        <a
                                            href={`mailto:${proveedor.email}`}
                                            className="text-xs font-medium text-foreground hover:underline truncate max-w-50"
                                            title={proveedor.email}
                                        >
                                            {proveedor.email}
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">
                                            Sin correo
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ubicación */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Ubicación / Almacén
                            </h4>
                            <div className="rounded-lg border border-border/80 bg-card p-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <span className="text-xs text-foreground leading-relaxed capitalize">
                                        {proveedor.direccion || 'Sin dirección registrada'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Catálogo y Registro */}
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                Catálogo e Historial
                            </h4>
                            <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Package className="size-3.5" />
                                        Productos Suministrados
                                    </span>
                                    <span className="text-xs font-semibold text-foreground">
                                        {proveedor.totalProductos} producto(s)
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="size-3.5" />
                                        Fecha de Registro
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        {formatDate(proveedor.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="size-3.5" />
                                        Última Actualización
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        {formatDate(proveedor.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border/70 bg-muted/20 flex items-center justify-between gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleStatus(proveedor)}
                        className="gap-1.5 text-xs cursor-pointer"
                    >
                        <Power className="size-3.5" />
                        <span>{proveedor.activo ? 'Desactivar' : 'Activar'}</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                                onClose();
                                onEdit(proveedor);
                            }}
                            className="gap-1.5 text-xs cursor-pointer"
                        >
                            <Edit3 className="size-3.5" />
                            <span>Editar Proveedor</span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
