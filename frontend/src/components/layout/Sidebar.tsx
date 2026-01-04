'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    CalendarPlus,
    History,
    Ship,
    Settings,
    LogOut,
    Anchor,
    ChevronLeft,
    ChevronRight,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Schedule New', href: '/schedule', icon: CalendarPlus },
    { name: 'Ports', href: '/ports', icon: Anchor },
    { name: 'History', href: '/history', icon: History },
    { name: 'Ships', href: '/ships', icon: Ship },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    user?: {
        email?: string;
        full_name?: string;
        avatar_url?: string;
    };
}

interface NavigationLinksProps {
    pathname: string;
    collapsed?: boolean;
    onItemClick?: () => void;
}

const NavigationLinks = ({ pathname, collapsed = false, onItemClick }: NavigationLinksProps) => (
    <nav className="flex flex-col gap-1">
        {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            const linkContent = (
                <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                >
                    <Icon
                        className={cn(
                            'h-5 w-5 shrink-0',
                            isActive && 'text-sidebar-primary'
                        )}
                    />
                    {!collapsed && <span>{item.name}</span>}
                </Link>
            );

            if (collapsed) {
                return (
                    <Tooltip key={item.name}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>
                            {item.name}
                        </TooltipContent>
                    </Tooltip>
                );
            }

            return <div key={item.name}>{linkContent}</div>;
        })}
    </nav>
);

interface UserSectionProps {
    user: SidebarProps['user'];
    userInitials: string;
    collapsed?: boolean;
    showLabels?: boolean;
    onSignOut: () => void;
}

const UserSection = ({ user, userInitials, collapsed = false, showLabels = true, onSignOut }: UserSectionProps) => (
    <div
        className={cn(
            'flex items-center gap-3 rounded-lg p-2',
            collapsed ? 'justify-center' : ''
        )}
    >
        <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {userInitials}
            </AvatarFallback>
        </Avatar>
        {!collapsed && showLabels && (
            <>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">
                        {user?.full_name || 'Operator'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                        {user?.email}
                    </span>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            onClick={onSignOut}
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Sign out</TooltipContent>
                </Tooltip>
            </>
        )}
        {/* Mobile version (no tooltip needed usually, but keeping consistent structure) */}
        {collapsed && !showLabels && (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onSignOut}
            >
                <LogOut className="h-4 w-4" />
            </Button>
        )}
    </div>
);

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    const userInitials = user?.full_name
        ? user.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : user?.email?.[0]?.toUpperCase() || 'U';

    return (
        <>
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-sidebar px-4 lg:hidden">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-ocean">
                        <Anchor className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-sidebar-foreground">PortMail</span>
                </div>
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                        <SheetDescription className="sr-only">Main navigation menu for PortMail application</SheetDescription>
                        <div className="flex h-full flex-col">
                            {/* Mobile Logo */}
                            <div className="flex h-14 items-center gap-3 px-4 border-b border-sidebar-border">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-ocean">
                                    <Anchor className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold text-sidebar-foreground">
                                        PortMail
                                    </span>
                                    <span className="text-xs text-sidebar-foreground/60">
                                        Maritime Logistics
                                    </span>
                                </div>
                            </div>

                            {/* Mobile Navigation */}
                            <ScrollArea className="flex-1 px-3 py-4">
                                <NavigationLinks
                                    pathname={pathname}
                                    onItemClick={() => setMobileOpen(false)}
                                />
                            </ScrollArea>

                            <Separator className="bg-sidebar-border" />

                            {/* Mobile User Section */}
                            <div className="p-3">
                                <UserSection
                                    user={user}
                                    userInitials={userInitials}
                                    onSignOut={handleSignOut}
                                    showLabels={true}
                                    collapsed={false}
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Sidebar */}
            <TooltipProvider delayDuration={0}>
                <aside
                    className={cn(
                        'relative hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:flex',
                        collapsed ? 'w-16' : 'w-64'
                    )}
                >
                    {/* Logo */}
                    <div className="flex h-16 items-center gap-3 px-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-ocean">
                            <Anchor className="h-6 w-6 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-sidebar-foreground">
                                    PortMail
                                </span>
                                <span className="text-xs text-sidebar-foreground/60">
                                    Maritime Logistics
                                </span>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-sidebar-border" />

                    {/* Navigation */}
                    <ScrollArea className="flex-1 px-3 py-4">
                        <NavigationLinks pathname={pathname} collapsed={collapsed} />
                    </ScrollArea>

                    <Separator className="bg-sidebar-border" />

                    {/* User section */}
                    <div className="p-3">
                        <UserSection
                            user={user}
                            userInitials={userInitials}
                            collapsed={collapsed}
                            onSignOut={handleSignOut}
                        />
                    </div>

                    {/* Collapse button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm hover:bg-sidebar-accent"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </aside>
            </TooltipProvider>
        </>
    );
}
