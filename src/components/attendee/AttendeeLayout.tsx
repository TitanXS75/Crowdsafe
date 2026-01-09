
import { useState } from "react";
import { NavLink, useLocation, Navigate, useNavigate } from "react-router-dom";
import { SOSPopup } from "../SOSPopup";
import { SOSCheckInModal } from "../SOSCheckInModal";
import {
  Map,
  Car,
  AlertTriangle,
  Bell,
  Settings,
  Home,
  Search,
  User,
  Menu,
  X,
  HelpCircle,
  LogOut,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useAuth } from "@/contexts/AuthContext";

interface AttendeeLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: "Home", path: "/attendee" },
  { icon: Map, label: "Navigate", path: "/attendee/map" },
  { icon: Car, label: "Parking", path: "/attendee/parking" },
  { icon: Bell, label: "Alerts", path: "/attendee/alerts" },
  { icon: Settings, label: "Settings", path: "/attendee/settings" },
];

export const AttendeeLayout = ({ children }: AttendeeLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/attendee" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Map className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">CrowdNav</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Event Info */}
          <div className="p-4 border-b border-border">
            <div className="glass rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Current Event</p>
              <p className="font-semibold text-foreground">
                {JSON.parse(localStorage.getItem("currentEvent") || "{}").name || "No Event Selected"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {JSON.parse(localStorage.getItem("currentEvent") || "{}").location || "--"}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-border space-y-1">
            <NavLink
              to="/attendee/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </NavLink>
            <NavLink
              to="/attendee/help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help & FAQs</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search locations, facilities..."
                  className="pl-10 pr-4 py-2 bg-muted rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online indicator */}
              {isOnline && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  Online
                </div>
              )}

              {/* Offline indicator */}
              <OfflineIndicator />

              {/* Emergency button - always visible */}
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 shadow-lg"
                asChild
              >
                <NavLink to="/attendee/emergency">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">Emergency</span>
                </NavLink>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-30">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>

      {/* SOS Components */}
      <SOSPopup />
      <SOSCheckInModal />
    </div>
  );
};
