import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    LogOut,
    Shield,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

// No side nav items needed for now in full width layout
// const navItems = [
//     { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
//     { icon: Users, label: "User Management", path: "/admin" }, 
// ];

// Simplified full-width layout without sidebar
export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const isOnline = useNetworkStatus();
    const navigate = useNavigate();

    const handleLogout = () => {
        // For now, just navigate to home page
        // In a real app, you'd also clear auth tokens/session
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background flex flex-col text-foreground font-sans selection:bg-primary/20">
            {/* Top Header */}
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">CrowdSafe Admin</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Offline Indicator */}
                    {!isOnline && <OfflineIndicator />}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 border border-border">
                                    <AvatarImage src="/placeholder-avatar.jpg" alt="Admin" />
                                    <AvatarFallback>AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">Administrator</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        admin@crowdsafe.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <NavLink to="/admin/profile" className="flex w-full items-center cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </NavLink>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-7xl mx-auto space-y-6"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};
