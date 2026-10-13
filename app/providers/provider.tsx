import { Toaster } from 'sonner'
import React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

const Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <Toaster richColors position='top-right' closeButton />
            <TooltipProvider>
                {children}
            </TooltipProvider>
        </div>
    )
}

export default Provider