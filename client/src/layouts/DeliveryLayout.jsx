import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
    Grid3X3,
    Package,
    Wallet,
    User,
    LogOut,
    Bell,
    Navigation,
    Power,
    ChevronRight,
    Store,
    TrendingUp,
    Settings,
    HelpCircle,
    ChevronsUpDown,
    Menu
} from 'lucide-react';
import { MdDeliveryDining } from 'react-icons/md';

import { cn } from '@/lib/utils';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { socketService } from '../config/socket';

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

// Navigation Items
const NAV_MAIN = [
    {
        title: 'Dashboard',
        url: '/delivery',
        icon: Grid3X3,
        isActive: true,
    },
    {
        title: 'Active Order',
        url: '/delivery/active-order',
        icon: Navigation,
    },
    {
        title: 'Order History',
        url: '/delivery/orders',
        icon: Package,
    },
    {
        title: 'Wallet & Earnings',
        url: '/delivery/wallet',
        icon: Wallet,
    },
];

const NAV_SECONDARY = [
    {
        title: 'My Profile',
        url: '/delivery/profile',
        icon: User,
    },
];

// App Sidebar Component
function AppSidebar({
    user,
    isOnline,
    toggleOnlineStatus,
    activeOrder,
    accountStatus,
    ...props
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const isActive = (path) => {
        if (path === '/delivery' && location.pathname === '/delivery') return true;
        if (path !== '/delivery' && location.pathname.startsWith(path)) return true;
        return false;
    };

    // Show all navigation items
    const filteredNavMain = NAV_MAIN;

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
                            <Link to="/delivery">
                                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-200">
                                    <MdDeliveryDining className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold text-gray-900">Quickart</span>
                                    <span className="truncate text-xs text-gray-500">Partner App</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Online/Offline Toggle Card */}
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <div className={cn(
                        "mx-2 p-4 rounded-2xl transition-all duration-300",
                        isOnline
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-200"
                            : "bg-gray-100 text-gray-700"
                    )}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    isOnline ? "bg-white animate-pulse" : "bg-gray-400"
                                )} />
                                <span className="font-semibold text-sm">
                                    {isOnline ? 'On Duty' : 'Off Duty'}
                                </span>
                            </div>
                            <Power className="size-4 opacity-70" />
                        </div>
                        <button
                            onClick={toggleOnlineStatus}
                            className={cn(
                                "w-full py-2 rounded-xl text-sm font-semibold transition-all",
                                isOnline
                                    ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                                    : "bg-gray-900 hover:bg-gray-800 text-white"
                            )}
                        >
                            {isOnline ? 'Go Offline' : 'Go Online'}
                        </button>
                    </div>
                </SidebarGroup>

                {/* Collapsed Online Indicator */}
                <SidebarGroup className="hidden group-data-[collapsible=icon]:flex">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip={isOnline ? 'Online - Click to go offline' : 'Offline - Click to go online'}
                                onClick={toggleOnlineStatus}
                                className={cn(
                                    "justify-center",
                                    isOnline ? "text-green-600 hover:text-green-700" : "text-gray-500"
                                )}
                            >
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                )} />
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredNavMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={isActive(item.url)}
                                    >
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                            {item.url === '/delivery/active-order' && activeOrder && (
                                                <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Secondary Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Account</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_SECONDARY.map((item) => (
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
                                        <span className="truncate font-semibold">{user?.name || 'Partner'}</span>
                                        <span className="truncate text-xs text-gray-500">
                                            {user?.mobile || user?.email}
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
                                            <span className="truncate font-semibold">{user?.name}</span>
                                            <span className="truncate text-xs text-gray-500">
                                                {user?.mobile}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link to="/delivery/profile" className="cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            My Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/delivery/wallet" className="cursor-pointer">
                                            <Wallet className="mr-2 h-4 w-4" />
                                            Earnings
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/" className="cursor-pointer text-gray-600">
                                        <Store className="mr-2 h-4 w-4" />
                                        Return to Shop
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/" className="cursor-pointer text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </Link>
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

// Main Layout Component
const DeliveryLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);
    const watchId = useRef(null);

    // Global Agent State
    const [isOnline, setIsOnline] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [accountStatus, setAccountStatus] = useState(null);

    // Initial Status Check
    const fetchRiderStatus = useCallback(async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delivery.dashboard,
            });

            if (response.data.success) {
                const data = response.data.data;
                setIsOnline(data.rider?.isOnline || false);
                setActiveOrder(data.activeOrder);

                if (data.isPendingApproval) setAccountStatus('PENDING');
                else if (data.isRejected) setAccountStatus('REJECTED');
                else if (data.isSuspended) setAccountStatus('SUSPENDED');
                else setAccountStatus('VERIFIED');
            }
        } catch (error) {
            console.error('Status fetch error:', error);
        }
    }, [user?._id]);

    useEffect(() => {
        if (user?._id) {
            fetchRiderStatus();
        }
    }, [fetchRiderStatus, user?._id]);

    // Location Services
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    };

    const startLocationTracking = useCallback((currentActiveOrder = activeOrder) => {
        if (!navigator.geolocation) return;

        if (watchId.current) navigator.geolocation.clearWatch(watchId.current);

        watchId.current = navigator.geolocation.watchPosition(
            async (position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    speed: position.coords.speed,
                    heading: position.coords.heading
                };
                setCurrentLocation(loc);

                try {
                    await Axios({
                        ...SummaryApi.delivery.updateLocation,
                        data: loc
                    });

                    if (socketService.socket) {
                        socketService.socket.emit('rider:location', {
                            riderId: user?._id,
                            ...loc,
                            orderId: currentActiveOrder?.orderId,
                            activityType: currentActiveOrder ? 'moving_to_customer' : 'idle'
                        });
                    }
                } catch (error) {
                    // silent fail
                }
            },
            (error) => console.error('Tracking error:', error),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
    }, [user, activeOrder]);

    const stopLocationTracking = useCallback(() => {
        if (watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    }, []);

    // Manage Tracking and Socket based on isOnline
    useEffect(() => {
        if (isOnline) {
            socketService.socket?.emit('agent:join', user?._id);
            socketService.socket?.emit('rider:online', { riderId: user?._id });
            startLocationTracking();
        } else {
            socketService.socket?.emit('agent:leave', user?._id);
            socketService.socket?.emit('rider:offline', { riderId: user?._id });
            stopLocationTracking();
        }

        return () => {
            stopLocationTracking();
        }
    }, [isOnline, user?._id, startLocationTracking, stopLocationTracking]);

    // Toggle Status
    const toggleOnlineStatus = async () => {
        try {
            let loc = null;
            if (!isOnline) {
                try {
                    loc = await getCurrentLocation();
                    setCurrentLocation(loc);
                } catch {
                    toast.error('Please enable location services');
                    return;
                }
            }

            const response = await Axios({
                ...SummaryApi.delivery.toggleStatus,
                data: {
                    isOnline: !isOnline,
                    lat: loc?.lat,
                    lng: loc?.lng
                }
            });

            if (response.data.success) {
                const newStatus = !isOnline;
                setIsOnline(newStatus);
                toast.success(newStatus ? 'You are now Online' : 'You are now Offline');
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    // Get current page title
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/delivery') return 'Dashboard';
        if (path === '/delivery/active-order') return 'Active Order';
        if (path === '/delivery/orders') return 'Order History';
        if (path === '/delivery/wallet') return 'Wallet & Earnings';
        if (path === '/delivery/profile') return 'My Profile';
        return 'Dashboard';
    };

    return (
        <SidebarProvider>
            <AppSidebar
                user={user}
                isOnline={isOnline}
                toggleOnlineStatus={toggleOnlineStatus}
                activeOrder={activeOrder}
                accountStatus={accountStatus}
            />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 sticky top-0 z-20">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />

                    {/* Page Title */}
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-3">
                        {/* Online Status Badge */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                            isOnline
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                        )}>
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                            )} />
                            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>

                        {/* Notifications */}
                        <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                            <Bell size={20} />
                        </button>

                        {/* Mobile Profile Link */}
                        <Link
                            to="/delivery/profile"
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
                    <Outlet context={{
                        isOnline,
                        toggleOnlineStatus,
                        currentLocation,
                        activeOrder,
                        setActiveOrder,
                        fetchRiderStatus,
                        accountStatus
                    }} />
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden pb-safe">
                    <div className="flex justify-around items-center h-16">
                        {NAV_MAIN.filter(item => !item.requiresActiveOrder || activeOrder).slice(0, 4).map((item) => {
                            const isItemActive = location.pathname === item.url ||
                                (item.url !== '/delivery' && location.pathname.startsWith(item.url));
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
                                    <span className="text-[10px] font-medium">{item.title.split(' ')[0]}</span>
                                </Link>
                            );
                        })}
                        <Link
                            to="/delivery/profile"
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                location.pathname === '/delivery/profile' ? "text-red-600" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <User className="size-5" />
                            <span className="text-[10px] font-medium">Profile</span>
                        </Link>
                    </div>
                </nav>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DeliveryLayout;
