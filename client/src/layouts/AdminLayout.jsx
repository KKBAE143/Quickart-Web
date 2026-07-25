import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
    Grid3X3,
    Package,
    Tags,
    Folder,
    Upload,
    Box,
    Star,
    ShoppingCart,
    Truck,
    Wallet,
    BarChart3,
    MapPin,
    User,
    LogOut,
    Bell,
    Settings,
    ChevronsUpDown,
    Store,
    ShoppingBag,
    MapPinned,
    Home
} from 'lucide-react';

import { cn } from '@/lib/utils';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { logout } from '../store/userSlice';
import AxiosToastError from '../utils/AxiosToastError';
import isAdmin from '../utils/isAdmin';

// Sidebar Components
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Navigation Items - Admin Panel
const NAV_ADMIN = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Grid3X3,
    },
    {
        title: 'Category',
        url: '/dashboard/category',
        icon: Tags,
    },
    {
        title: 'Sub Category',
        url: '/dashboard/subcategory',
        icon: Folder,
    },
    {
        title: 'Upload Product',
        url: '/dashboard/upload-product',
        icon: Upload,
    },
    {
        title: 'Products',
        url: '/dashboard/product',
        icon: Box,
    },
    // HIDDEN: Reviews feature temporarily disabled
    // {
    //     title: 'Reviews',
    //     url: '/dashboard/reviews',
    //     icon: Star,
    // },
];

const NAV_ORDERS = [
    {
        title: 'Order Management',
        url: '/dashboard/admin-orders',
        icon: ShoppingCart,
    },
];

const NAV_AGENTS = [
    {
        title: 'Delivery Agents',
        url: '/dashboard/agents',
        icon: Truck,
    },
    {
        title: 'Agent Analytics',
        url: '/dashboard/agent-analytics',
        icon: BarChart3,
    },
    {
        title: 'Payouts',
        url: '/dashboard/payouts',
        icon: Wallet,
    },
    {
        title: 'Live Tracking',
        url: '/dashboard/rider-tracking',
        icon: MapPin,
    },
];

// User navigation - shown to regular users only
const NAV_USER = [
    {
        title: 'My Orders',
        url: '/dashboard/myorders',
        icon: ShoppingBag,
    },
    {
        title: 'Saved Addresses',
        url: '/dashboard/address',
        icon: MapPinned,
    },
    {
        title: 'My Profile',
        url: '/dashboard/profile',
        icon: User,
    },
];

// Admin profile - minimal options for admin
const NAV_ADMIN_PROFILE = [
    {
        title: 'My Profile',
        url: '/dashboard/profile',
        icon: User,
    },
];

// App Sidebar Component
function AppSidebar({ user, ...props }) {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const userIsAdmin = isAdmin(user?.role);

    const isActive = (path) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.logout
            });
            if (response.data.success) {
                dispatch(logout());
                localStorage.clear();
                toast.success(response.data.message);
                navigate("/");
            }
        } catch (error) {
            console.log(error);
            AxiosToastError(error);
        }
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            {/* Header with Logo */}
            <SidebarHeader className="border-b border-gray-100">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-red-50 data-[state=open]:text-red-700 hover:bg-red-50 hover:text-red-700"
                            asChild
                        >
                            <Link to="/dashboard">
                                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-200">
                                    <Store className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold text-gray-900">Quickart</span>
                                    <span className="truncate text-xs text-gray-500">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Admin Navigation - Only for Admins */}
                {userIsAdmin && (
                    <>
                        <SidebarGroup>
                            <SidebarGroupLabel>Store Management</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {NAV_ADMIN.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={item.title}
                                                isActive={isActive(item.url)}
                                            >
                                                <Link to={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>Orders</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {NAV_ORDERS.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={item.title}
                                                isActive={isActive(item.url)}
                                            >
                                                <Link to={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>Delivery Management</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {NAV_AGENTS.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={item.title}
                                                isActive={isActive(item.url)}
                                            >
                                                <Link to={item.url}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator />
                    </>
                )}

                {/* User Navigation - Different for Admin vs Regular User */}
                <SidebarGroup>
                    <SidebarGroupLabel>{userIsAdmin ? 'Account' : 'My Account'}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {(userIsAdmin ? NAV_ADMIN_PROFILE : NAV_USER).map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={isActive(item.url)}
                                    >
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer with User */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-red-50 data-[state=open]:text-red-700"
                                >
                                    <Avatar className="h-8 w-8 rounded-xl">
                                        <AvatarImage src={user?.avatar} alt={user?.name} />
                                        <AvatarFallback className="rounded-xl bg-red-100 text-red-700 font-bold">
                                            {user?.name?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user?.name || 'User'}
                                            {userIsAdmin && (
                                                <span className="ml-1 text-[10px] font-bold text-white bg-gradient-to-r from-red-600 to-red-700 px-1.5 py-0.5 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </span>
                                        <span className="truncate text-xs text-gray-500">
                                            {user?.email || user?.mobile}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 text-gray-400" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-xl">
                                            <AvatarImage src={user?.avatar} alt={user?.name} />
                                            <AvatarFallback className="rounded-xl">
                                                {user?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">
                                                {user?.name}
                                                {userIsAdmin && (
                                                    <span className="ml-1 text-[10px] font-bold text-white bg-gradient-to-r from-red-600 to-red-700 px-1.5 py-0.5 rounded-full">
                                                        Admin
                                                    </span>
                                                )}
                                            </span>
                                            <span className="truncate text-xs text-gray-500">
                                                {user?.email || user?.mobile}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/" className="cursor-pointer text-gray-600">
                                        <Home className="mr-2 h-4 w-4" />
                                        Go to Shop
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-red-600"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

// Get Page Title Helper
const getPageTitle = (pathname) => {
    const titles = {
        '/dashboard': 'Dashboard',
        '/dashboard/category': 'Categories',
        '/dashboard/subcategory': 'Sub Categories',
        '/dashboard/upload-product': 'Upload Product',
        '/dashboard/product': 'Products',
        // '/dashboard/reviews': 'Reviews', // HIDDEN: Reviews feature temporarily disabled
        '/dashboard/admin-orders': 'Order Management',
        '/dashboard/agents': 'Delivery Agents',
        '/dashboard/agent-analytics': 'Agent Analytics',
        '/dashboard/payouts': 'Payouts',
        '/dashboard/rider-tracking': 'Live Rider Tracking',
        '/dashboard/myorders': 'My Orders',
        '/dashboard/address': 'Saved Addresses',
        '/dashboard/profile': 'My Profile',
    };

    return titles[pathname] || 'Dashboard';
};

// Main Layout Component
const AdminLayout = () => {
    const location = useLocation();
    const user = useSelector((state) => state.user);
    const userIsAdmin = isAdmin(user?.role);

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 sticky top-0 z-20">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />

                    {/* Page Title */}
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-900">
                            {getPageTitle(location.pathname)}
                        </h1>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                        {/* Admin Badge */}
                        {userIsAdmin && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700">
                                <Store className="w-3.5 h-3.5" />
                                <span>Admin</span>
                            </div>
                        )}

                        {/* Notifications */}
                        <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                            <Bell size={20} />
                        </button>

                        {/* Mobile Profile Link */}
                        <Link
                            to="/dashboard/profile"
                            className="md:hidden flex items-center"
                        >
                            <Avatar className="h-8 w-8 rounded-xl border border-gray-200">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="text-xs font-bold">
                                    {user?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden pb-safe">
                    <div className="flex justify-around items-center h-16">
                        {[
                            { title: 'Home', url: '/dashboard', icon: Grid3X3 },
                            ...(userIsAdmin ? [{ title: 'Orders', url: '/dashboard/admin-orders', icon: ShoppingCart }] : []),
                            ...(userIsAdmin ? [{ title: 'Products', url: '/dashboard/product', icon: Box }] : []),
                            ...(!userIsAdmin ? [{ title: 'My Orders', url: '/dashboard/myorders', icon: ShoppingBag }] : []),
                            { title: 'Profile', url: '/dashboard/profile', icon: User },
                        ].slice(0, 5).map((item) => {
                            const isItemActive = location.pathname === item.url ||
                                (item.url !== '/dashboard' && location.pathname.startsWith(item.url));
                            return (
                                <Link
                                    key={item.url}
                                    to={item.url}
                                    className={cn(
                                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                        isItemActive ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <item.icon className="size-5" />
                                    <span className="text-[10px] font-medium">{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AdminLayout;
