"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SearchIcon,
  CopyIcon,
  CheckIcon,
  PackageIcon,
  Building2Icon,
  LayoutDashboardIcon,
  BoxesIcon,
} from "lucide-react";

interface SystemDestination {
  title: string;
  url: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SYSTEM_DESTINATIONS: SystemDestination[] = [
  {
    title: "Panel general",
    url: "/dashboard",
    description: "Métricas consolidadas, resumen de despachos y estado general.",
    category: "Principal",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Catálogo de productos",
    url: "/dashboard/productos",
    description: "Listado maestro de artículos, precios y fichas técnicas.",
    category: "Ventas",
    icon: PackageIcon,
  },
  {
    title: "Control de stock",
    url: "/dashboard/inventario/stock",
    description: "Existencias en tiempo real, alertas de reposición y reservas.",
    category: "Inventario",
    icon: BoxesIcon,
  },
  {
    title: "Sucursales y almacenes",
    url: "/dashboard/sucursales",
    description: "Depósitos físicos, puntos de despacho y asignación local.",
    category: "Inventario",
    icon: Building2Icon,
  },
];

export default function NotFound() {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredDestinations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return SYSTEM_DESTINATIONS;
    return SYSTEM_DESTINATIONS.filter(
      (dest) =>
        dest.title.toLowerCase().includes(q) ||
        dest.description.toLowerCase().includes(q) ||
        dest.category.toLowerCase().includes(q) ||
        dest.url.toLowerCase().includes(q)
    );
  }, [searchTerm]);

  const handleCopyDiagnostic = () => {
    const diagnostic = `SYSTEM_INVENTARIO_ERROR_404 | Ruta: ${pathname || "desconocida"} | Registro no localizado`;
    navigator.clipboard.writeText(diagnostic).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="relative min-h-[100svh] w-full bg-white text-neutral-900 font-sans dark:bg-neutral-950 dark:text-neutral-100 flex flex-col justify-between selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900 overflow-hidden">
      <style>{`
        @keyframes notFoundEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes maskFadeIn {
          from {
            opacity: 0;
            transform: scale(1.03);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-enter,
          .anim-mask {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
        .anim-enter {
          animation: notFoundEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-mask {
          animation: maskFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Fondo con imagen de almacén enmascarada (Image Mask) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none anim-mask"
      >
        <div
          className="absolute inset-0 opacity-[0.14] sm:opacity-[0.22] dark:opacity-[0.18] dark:sm:opacity-[0.24] transition-opacity duration-700"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 88% 35%, black 10%, rgba(0, 0, 0, 0.35) 52%, transparent 82%)", /* taste-skill-ignore */
            maskImage: "radial-gradient(ellipse 85% 65% at 88% 35%, black 10%, rgba(0, 0, 0, 0.35) 52%, transparent 82%)", /* taste-skill-ignore */
          }}
        >
          <Image
            src="https://cdn.cosmos.so/8e9cea80-761b-45a5-9610-4ec2d363154b?format=webp"
            alt="Estructura de almacenamiento e inventario del almacén central"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-[center_right] grayscale contrast-125 dark:contrast-110"
          />
        </div>
      </div>

      {/* Barra de cabecera utilitaria */}
      <header
        className="relative z-10 anim-enter w-full bg-neutral-50/90 dark:bg-neutral-900/80"
        style={{ animationDelay: "40ms" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="anim-enter flex items-center gap-3 text-sm font-semibold tracking-tight text-neutral-900 dark:text-white hover:opacity-80 transition-opacity"
            style={{ animationDelay: "70ms" }}
          >
            <span className="flex size-7 items-center justify-center rounded bg-neutral-900 text-[13px] font-bold text-white dark:bg-white dark:text-neutral-900">
              SI
            </span>
            <span>SYSTEM INVENTARIO</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span
              className="anim-enter text-neutral-500 dark:text-neutral-400"
              style={{ animationDelay: "100ms" }}
            >
              Almacén Central
            </span>
            <Link
              href="/dashboard"
              className="anim-enter font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300 transition-colors"
              style={{ animationDelay: "130ms" }}
            >
              Ir al panel
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Columna izquierda: Declaración y navegación primaria */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div
              className="anim-enter text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none select-none"
              style={{ animationDelay: "80ms" }}
            >
              404
            </div>

            <h1
              className="anim-enter mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-white leading-[1.12] max-w-[22ch]"
              style={{ animationDelay: "140ms" }}
            >
              Registro no localizado en el almacén
            </h1>

            <p
              className="anim-enter mt-5 text-base sm:text-lg text-neutral-700 dark:text-neutral-300 max-w-[52ch] leading-relaxed"
              style={{ animationDelay: "200ms" }}
            >
              La coordenada o módulo solicitado no existe en la base de datos de existencias, sucursales ni despachos activos de este sistema.
            </p>

            {/* Acciones principales directas */}
            <div
              className="anim-enter mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
              style={{ animationDelay: "260ms" }}
            >
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-md bg-neutral-900 px-6 text-base font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
              >
                Volver al panel principal
              </Link>
              <Link
                href="/dashboard/productos"
                className="inline-flex h-12 items-center justify-center rounded-md bg-neutral-100 px-6 text-base font-medium text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Ver catálogo de productos
              </Link>
            </div>

            {/* Ficha técnica informativa */}
            <div
              className="anim-enter mt-10 rounded-md bg-neutral-100 p-4 dark:bg-neutral-900/60 max-w-xl"
              style={{ animationDelay: "320ms" }}
            >
              <div className="flex items-center justify-between text-[13px] sm:text-sm text-neutral-600 dark:text-neutral-400">
                <span>Ruta no indexada:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {pathname || "/ruta-no-encontrada"}
                </span>
              </div>
            </div>
          </div>

          {/* Columna derecha: Fragmento de interfaz interactivo (The live thing) */}
          <div className="lg:col-span-5">
            <div
              data-ui="inventory-navigator"
              className="anim-enter rounded-lg bg-neutral-50 p-6 dark:bg-neutral-900"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Localizador rápido de módulos
                  </h2>
                  <p className="mt-1 text-[13px] text-neutral-600 dark:text-neutral-400">
                    Navega de forma directa a una sección activa de inventario
                  </p>
                </div>
              </div>

              {/* Buscador de rutas en tiempo real */}
              <div
                className="anim-enter relative mt-2"
                style={{ animationDelay: "240ms" }}
              >
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar módulo, stock o sucursal..."
                  className="h-10 w-full rounded-md bg-white pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Lista filtrada de destinos */}
              <div className="mt-4 space-y-2">
                {filteredDestinations.map((dest, idx) => {
                  const Icon = dest.icon;
                  return (
                    <Link
                      key={dest.url}
                      href={dest.url}
                      className="anim-enter group flex items-start gap-3 rounded-md bg-white p-3 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:text-white dark:hover:bg-neutral-700 transition-colors"
                      style={{ animationDelay: `${300 + idx * 60}ms` }}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-700 dark:text-neutral-200 dark:group-hover:bg-white dark:group-hover:text-neutral-900 transition-colors">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {dest.title}
                          </span>
                          <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                            {dest.category}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-neutral-600 dark:text-neutral-400 line-clamp-1">
                          {dest.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}

                {filteredDestinations.length === 0 && (
                  <div className="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    No se encontraron módulos coincidentes con "{searchTerm}".
                  </div>
                )}
              </div>

              {/* Acción de copiado de diagnóstico para soporte */}
              <div
                className="anim-enter mt-5 pt-4"
                style={{ animationDelay: "560ms" }}
              >
                <button
                  type="button"
                  onClick={handleCopyDiagnostic}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-200 py-2.5 px-3 text-[13px] font-medium text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="size-3.5 text-neutral-900 dark:text-white" />
                      <span>Referencia de error copiada</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3.5" />
                      <span>Copiar referencia para soporte</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página sobrio y diseñado */}
      <footer
        className="relative z-10 anim-enter w-full bg-neutral-50/90 dark:bg-neutral-900/60 py-6"
        style={{ animationDelay: "580ms" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-[13px] text-neutral-500 dark:text-neutral-400">
          <div
            className="anim-enter"
            style={{ animationDelay: "620ms" }}
          >
            Control y gestión de existencias · Sistema central de inventario
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/sucursales"
              className="anim-enter hover:text-neutral-900 dark:hover:text-white transition-colors"
              style={{ animationDelay: "660ms" }}
            >
              Sucursales
            </Link>
            <Link
              href="/dashboard/inventario/stock"
              className="anim-enter hover:text-neutral-900 dark:hover:text-white transition-colors"
              style={{ animationDelay: "700ms" }}
            >
              Stock
            </Link>
            <Link
              href="/dashboard/productos"
              className="anim-enter hover:text-neutral-900 dark:hover:text-white transition-colors"
              style={{ animationDelay: "740ms" }}
            >
              Productos
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
