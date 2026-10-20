import React from 'react'
import { UsersIcon, ShieldCheckIcon, ClockIcon } from 'lucide-react'

import db from '@/server'
import SidebarAux from '@/app/(home)/_ui/Sidebar'
import TableVendedores from './_ui/TableVendedores'

export const dynamic = 'force-dynamic'

export default async function VendedoresPage() {
  const vendedores = await db.query.users.findMany({
    where: { role: { eq: 'saler' } },
    orderBy: { createdAt: 'desc' }
  })

  const totalVendedores = vendedores.length
  const totalVerificados = vendedores.filter(v => v.emailVerified).length
  const totalPendientes = totalVendedores - totalVerificados

  return (
    <SidebarAux>
      <div className='flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'>
        {/* Page Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
              <span>Dashboard</span>
              <span>/</span>
              <span className='text-foreground font-medium'>Vendedores</span>
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-foreground'>
              Equipo de Vendedores
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Consulta, filtra y administra las cuentas de usuarios con rol de vendedor y sus datos de contacto.
            </p>
          </div>
        </div>

        {/* Stats Overview Bar */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
          {/* Total Vendedores */}
          <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
            <div className='rounded-lg p-2.5 bg-primary/10 text-primary shrink-0'>
              <UsersIcon className='size-5' />
            </div>
            <div className='min-w-0'>
              <span className='text-xs text-muted-foreground block truncate'>Total Vendedores</span>
              <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalVendedores}</span>
            </div>
          </div>

          {/* Verificados */}
          <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
            <div className='rounded-lg p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
              <ShieldCheckIcon className='size-5' />
            </div>
            <div className='min-w-0'>
              <span className='text-xs text-muted-foreground block truncate'>Correos Verificados</span>
              <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalVerificados}</span>
            </div>
          </div>

          {/* Pendientes */}
          <div className='rounded-xl border bg-card p-4 shadow-xs flex items-center gap-3.5'>
            <div className='rounded-lg p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0'>
              <ClockIcon className='size-5' />
            </div>
            <div className='min-w-0'>
              <span className='text-xs text-muted-foreground block truncate'>Pendientes de Verificación</span>
              <span className='text-xl sm:text-2xl font-bold text-foreground'>{totalPendientes}</span>
            </div>
          </div>
        </div>

        {/* Vendedores Data Table */}
        <TableVendedores vendedores={vendedores} />
      </div>
    </SidebarAux>
  )
}
