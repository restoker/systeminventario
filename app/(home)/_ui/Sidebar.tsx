import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger
} from '@/components/ui/sidebar'

import LanguageDropdown from '@/components/shadcn-studio/blocks/dropdown-language'
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

import FacebookIcon from '@/assets/svg/facebook-icon'
import InstagramIcon from '@/assets/svg/instagram-icon'
import LinkedinIcon from '@/assets/svg/linkedin-icon'
import TwitterIcon from '@/assets/svg/twitter-icon'
import { ChartNoAxesCombinedIcon, ChartSplineIcon, UsersIcon, ChartPieIcon, HashIcon, ArrowRightLeftIcon, Clock9Icon, ClipboardListIcon, CrownIcon, SquareActivityIcon, CalendarClockIcon, Undo2Icon, SettingsIcon, LanguagesIcon } from "lucide-react"

const SidebarAux = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='flex min-h-dvh w-full'>
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <ChartNoAxesCombinedIcon
                                            />
                                            <span>Dashboard</span>
                                        </SidebarMenuButton>
                                        <SidebarMenuBadge className='bg-primary/10 top-1/2! right-2 -translate-y-1/2! rounded-full'>
                                            5
                                        </SidebarMenuBadge>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarGroup>
                            <SidebarGroupLabel>Pages</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <ChartSplineIcon
                                            />
                                            <span>Content Performance</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <UsersIcon
                                            />
                                            <span>Audience Insight</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <ChartPieIcon
                                            />
                                            <span>Engagement Metrics</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <HashIcon
                                            />
                                            <span>Hashtag Performance</span>
                                        </SidebarMenuButton>
                                        <SidebarMenuBadge className='bg-primary/10 top-1/2! right-2 -translate-y-1/2! rounded-full'>
                                            3
                                        </SidebarMenuBadge>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <ArrowRightLeftIcon
                                            />
                                            <span>Competitor Analysis</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <Clock9Icon
                                            />
                                            <span>Campaign Tracking</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <ClipboardListIcon
                                            />
                                            <span>Sentiment Tracking</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <CrownIcon
                                            />
                                            <span>Influencer</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                        <SidebarGroup>
                            <SidebarGroupLabel>Supporting Features</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <SquareActivityIcon
                                            />
                                            <span>Real Time Monitoring</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <CalendarClockIcon
                                            />
                                            <span>Schedule Post & Calendar</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <Undo2Icon
                                            />
                                            <span>Report & Export</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <SettingsIcon
                                            />
                                            <span>Settings & Integrations</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<a href='#' />}>
                                            <UsersIcon
                                            />
                                            <span>User Management</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
                <div className='flex flex-1 flex-col'>
                    <header className='bg-card sticky top-0 z-50 border-b'>
                        <div className='mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6'>
                            <div className='flex items-center gap-4'>
                                <SidebarTrigger className='[&_svg]:size-5!' />
                                <Separator orientation='vertical' className='hidden h-4! data-vertical:self-center sm:block' />
                                <Breadcrumb className='hidden sm:block'>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href='#'>Home</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href='#'>Dashboard</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Free</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <LanguageDropdown
                                    trigger={
                                        <Button variant='ghost' size='icon-lg'>
                                            <LanguagesIcon
                                            />
                                        </Button>
                                    }
                                />
                                <ProfileDropdown
                                    trigger={
                                        <Button variant='ghost' size='icon-lg'>
                                            <Avatar className='size-[inherit] rounded-[inherit] after:rounded-[inherit]'>
                                                <AvatarImage
                                                    src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png'
                                                    className='rounded-[inherit]'
                                                />
                                                <AvatarFallback className='rounded-[inherit]'>JD</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </header>
                    <main className='mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6'>
                        {children}
                    </main>
                    <footer>
                        <div className='text-muted-foreground mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6'>
                            <p className='text-sm text-balance max-sm:text-center'>
                                {`©${new Date().getFullYear()}`}{' '}
                                <a href='#' className='text-primary'>
                                    shadcn/studio
                                </a>
                                , Made for better web design
                            </p>
                            <div className='text-muted-foreground *:hover:text-primary flex items-center gap-5'>
                                <a href='#'>
                                    <FacebookIcon className='size-4' />
                                </a>
                                <a href='#'>
                                    <InstagramIcon className='size-4' />
                                </a>
                                <a href='#'>
                                    <LinkedinIcon className='size-4' />
                                </a>
                                <a href='#'>
                                    <TwitterIcon className='size-4' />
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>
            </SidebarProvider>
        </div>
    )
}

export default SidebarAux;
