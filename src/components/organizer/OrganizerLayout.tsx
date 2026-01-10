import { useState } from "react";
import { NavLink, useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  MapPin,
  Users,
  Car,
  Bell,
  AlertTriangle,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  HelpCircle,
  ChevronDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useAuth } from "@/contexts/AuthContext";

interface OrganizerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/organizer" },
  { icon: MapPin, label: "POI Management", path: "/organizer/poi" },

  { icon: Car, label: "Parking", path: "/organizer/parking" },
  { icon: Bell, label: "Alerts", path: "/organizer/alerts" },
  { icon: BarChart3, label: "Reports", path: "/organizer/reports" },
];

export const OrganizerLayout = ({ children }: OrganizerLayoutProps) => {
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
    return <Navigate to="/auth/organizer" replace />;
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
                <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground">CrowdNav</span>
                <span className="text-xs text-muted-foreground block">Organizer</span>
              </div>
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

          {/* Make Event Button */}
          <div className="p-4 border-b border-border">
            <NavLink
              to="/organizer/event-setup"
              className="w-full gradient-primary text-primary-foreground rounded-lg p-3 flex items-center justify-between hover:opacity-90 transition-opacity shadow-md"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="text-left flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="font-bold text-sm">Make Event</p>
                  <p className="text-[10px] opacity-80">Setup & Configure</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 opacity-50 -rotate-90" />
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">Control Center</h1>
                <p className="text-xs text-muted-foreground">Real-time event management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Offline indicator */}
              <OfflineIndicator />

              {/* Emergency alerts */}
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 shadow-lg"
                asChild
              >
                <NavLink to="/organizer/emergencies">
                  <AlertTriangle className="w-4 h-4" />
                </NavLink>
              </Button>

              {/* Profile */}
              <Button variant="ghost" size="icon" asChild>
                <NavLink to="/organizer/profile">
                  <User className="w-5 h-5" />
                </NavLink>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
