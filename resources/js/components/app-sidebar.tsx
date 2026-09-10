import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    LayoutGrid,
    Boxes,
    ClipboardList,
    ShieldCheck,
    Users,
    HardHat,
    FolderKanban,
    Package,
    Tag,
    Layers,
    Database,
    Cpu,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as adminMutationsIndex } from '@/routes/admin/mutations';
import { index as adminRequestsIndex } from '@/routes/admin/requests';
import { index as inventoryIndex } from '@/routes/inventory';
import { index as pricesIndex } from '@/routes/master/prices';
import { index as productsIndex } from '@/routes/master/products/data';
import { index as productSpecificationsIndex } from '@/routes/master/products/specifications';
import { index as projectsIndex } from '@/routes/master/projects/data';
import { index as worksiteCategoriesIndex } from '@/routes/master/worksites/categories';
import { index as worksitesIndex } from '@/routes/master/worksites/data';
import { index as requestsIndex } from '@/routes/requests';
import { index as superAdminUsersIndex } from '@/routes/super-admin/users';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
            icon: LayoutGrid,
        },
        {
            title: 'Inventory',
            href: inventoryIndex().url,
            icon: Boxes,
        },
        {
            title: 'My Requests',
            href: requestsIndex().url,
            icon: ClipboardList,
        },
    ];

    const masterNavItems: NavItem[] = [
        {
            title: 'Worksite',
            href: worksiteCategoriesIndex().url,
            icon: HardHat,
            items: [
                {
                    title: 'Categories',
                    href: worksiteCategoriesIndex().url,
                    icon: Layers,
                },
                {
                    title: 'Data',
                    href: worksitesIndex().url,
                    icon: Database,
                },
            ],
        },
        {
            title: 'Projects',
            href: projectsIndex().url,
            icon: FolderKanban,
            items: [
                {
                    title: 'Data',
                    href: projectsIndex().url,
                    icon: Database,
                },
            ],
        },
        {
            title: 'Products',
            href: productsIndex().url,
            icon: Package,
            items: [
                {
                    title: 'Data',
                    href: productsIndex().url,
                    icon: Database,
                },
                {
                    title: 'Specification',
                    href: productSpecificationsIndex().url,
                    icon: Cpu,
                },
            ],
        },
        {
            title: 'Prices',
            href: pricesIndex().url,
            icon: Tag,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Manage Requests',
            href: adminRequestsIndex().url,
            icon: ShieldCheck,
        },
        {
            title: 'Mutation Log',
            href: adminMutationsIndex().url,
            icon: BookOpen,
        },
    ];

    if (user.role === 'super_admin') {
        adminNavItems.push({
            title: 'Manage Users',
            href: superAdminUsersIndex().url,
            icon: Users,
        });
    }

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard().url} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Platform" />
                {isAdmin && <NavMain items={masterNavItems} label="Feature Master" />}
                {isAdmin && <NavMain items={adminNavItems} label="Admin" />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
